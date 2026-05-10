import json
import os
import re
import uuid
from datetime import datetime, timezone
from bson.objectid import ObjectId
from Engine.Dashbord_data.eda import get_teacher_dashboard_summary, get_teacher_stats, get_session_stats
from Engine.OMI.omi import explain_stats
from fastapi import BackgroundTasks, Depends, FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from Engine.cheat_detection.main import check_cheat
from Engine.grade.nlp import Correct_NLP
from backend.db import db
from backend.auth import get_current_user, get_optional_current_user, normalize_email, router as auth_router
from backend.config import get_app_env, get_cors_allow_origins, validate_required_env
from backend.schemas import EvaluationPreferences,QuestionParerPrefrences
from backend.worker.files import save_upload_file
from Engine.QCP.qcp import set_paper
from backend.worker.work import (
    check_cheat_in_session,
    get_text_from_nonOCR_pdf,
    process_session,
)

app = FastAPI()
app.title = "Omnimark Ai"

_app_env = get_app_env()
_cors_origins = get_cors_allow_origins()
_allow_all_origins = _app_env != "production" and not _cors_origins
_resolved_cors_origins = ["*"] if _allow_all_origins else _cors_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=_resolved_cors_origins,
    allow_credentials=not _allow_all_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)


@app.on_event("startup")
def startup_validate_config():
    validate_required_env()

@app.get("/health")
def health_check():
    return {"status": "ok"}


UPLOAD_FOLDER = "./uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def _email_match_query(email: str):
    normalized = normalize_email(email)
    return {
        "$or": [
            {"teacher_email_normalized": normalized},
            {"teacher_email": normalized},
            {"teacher_email": {"$regex": f"^{re.escape(normalized)}$", "$options": "i"}},
        ]
    }

def _teacher_session_query(email: str, teacher_id: str | None = None):
    clauses = _email_match_query(email)["$or"]
    if teacher_id:
        clauses.insert(0, {"teacher_id": teacher_id})
    # Backward compatibility: include orphan sessions only in single-teacher setups.
    if db.users.count_documents({"role": "teacher"}) == 1:
        clauses.append(
            {
                "$and": [
                    {"$or": [{"teacher_email": None}, {"teacher_email": {"$exists": False}}]},
                    {"$or": [{"teacher_id": None}, {"teacher_id": {"$exists": False}}]},
                ]
            }
        )
    return {"$or": clauses}


def _build_pagination_meta(total: int, offset: int, limit: int):
    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "has_more": (offset + limit) < total,
    }

def resolve_teacher_identity(current_user: dict | None, teacher_email: str | None = None):
    if teacher_email:
        return {"email": normalize_email(teacher_email), "id": None}
    if current_user and current_user.get("role") == "teacher":
        return {
            "email": normalize_email(current_user.get("email", "")),
            "id": current_user.get("id"),
        }
    if teacher_email and current_user and current_user.get("role") == "university":
        email = normalize_email(teacher_email)
        teacher = db.users.find_one(
            {
                "role": "teacher",
                "email": email,
                "university_id": current_user.get("id"),
            },
            {"_id": 1, "email": 1},
        )
        if teacher is None:
            raise HTTPException(status_code=404, detail="Teacher not found for this university")
        return {"email": email, "id": str(teacher["_id"])}
    raise HTTPException(status_code=400, detail="teacher_email is required")

def resolve_teacher_email(current_user: dict, teacher_email: str | None = None):
    return resolve_teacher_identity(current_user, teacher_email)["email"]

def _normalize_student_name(name: str):
    return " ".join(str(name or "").strip().lower().split())

def _perform_reevaluation(session: dict, result_record: dict):
    from Engine.grade.llm import LLM_Reevaluate

    previous_result = result_record.get("result", {})
    student_answer = result_record.get("answer_text", "")

    # Fallback support for legacy sessions
    if not student_answer:
        pdf_path = result_record.get("pdf_file", "")
        if pdf_path and os.path.exists(pdf_path):
            student_answer = get_text_from_nonOCR_pdf(pdf_path)

    question_paper = session.get("question_paper", "")
    teacher_model_answer = session.get("teacher_model_answer", "")
    preferences = session.get("preferences", {})

    return LLM_Reevaluate(
        question_paper=question_paper,
        teacher_model_answer=teacher_model_answer,
        student_answer=student_answer,
        preferences=preferences,
        previous_result=previous_result
    )

def _append_reevaluation_history(result_record: dict, after_result: dict, actor: str):
    before_result = result_record.get("result", {})
    entry = {
        "at": datetime.now(timezone.utc).isoformat(),
        "actor": actor,
        "before": before_result,
        "after": after_result,
    }
    db.results.update_one(
        {"_id": result_record["_id"]},
        {
            "$set": {"result": after_result},
            "$push": {"reevaluation_history": entry},
        },
    )
    return entry

def get_authorized_session(session_id: str, current_user: dict | None, teacher_email: str | None = None):
    session = db.sessions.find_one({"session_id": session_id})
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    if teacher_email:
        session_email = normalize_email(session.get("teacher_email_normalized") or session.get("teacher_email") or "")
        if session_email == normalize_email(teacher_email):
            return session
        raise HTTPException(status_code=403, detail="Session does not belong to this teacher_email")

    if current_user and current_user.get("role") == "teacher":
        teacher_id = current_user.get("id")
        email = normalize_email(current_user.get("email", ""))
        session_teacher_id = session.get("teacher_id")
        session_email = normalize_email(session.get("teacher_email_normalized") or session.get("teacher_email") or "")
        if session_teacher_id == teacher_id or session_email == email:
            return session
        raise HTTPException(status_code=403, detail="You do not have access to this session")

    if current_user and current_user.get("role") == "university":
        teacher_id = session.get("teacher_id")
        if teacher_id:
            try:
                teacher = db.users.find_one(
                    {
                        "_id": ObjectId(teacher_id),
                        "role": "teacher",
                        "university_id": current_user.get("id"),
                    },
                    {"_id": 1},
                )
                if teacher:
                    return session
            except Exception:
                pass
        session_email = normalize_email(session.get("teacher_email_normalized") or session.get("teacher_email") or "")
        if session_email and db.users.find_one(
            {
                "email": session_email,
                "role": "teacher",
                "university_id": current_user.get("id"),
            },
            {"_id": 1},
        ):
            return session

    raise HTTPException(status_code=403, detail="You do not have access to this session")

@app.get("/dashboard/teacher_stats")
def dashboard_teacher_stats(
    teacher_email: str | None = None,
    current_user: dict | None = Depends(get_optional_current_user),
):
    teacher = resolve_teacher_identity(current_user, teacher_email)
    stats = get_teacher_stats(teacher["email"], teacher.get("id"))
    if isinstance(stats, dict):
        return stats
    return stats.fillna(0).to_dict()

@app.get("/dashboard/teacher_summary")
def dashboard_teacher_summary(
    teacher_email: str | None = None,
    current_user: dict | None = Depends(get_optional_current_user),
):
    teacher = resolve_teacher_identity(current_user, teacher_email)
    return get_teacher_dashboard_summary(teacher["email"], teacher.get("id"))

@app.get("/omi/analyze")
def omi_analyze(
    teacher_email: str | None = None,
    current_user: dict | None = Depends(get_optional_current_user),
):
    teacher = resolve_teacher_identity(current_user, teacher_email)
    stats_data = get_teacher_dashboard_summary(teacher["email"], teacher.get("id"))
    
    try:
        analysis_json_str = explain_stats(stats_data)
        return json.loads(analysis_json_str)
    except Exception as e:
        return {"error": "Failed to parse Omi analysis", "raw": str(e)}

@app.get("/session/{session_id}/stats")
def dashboard_session_stats(
    session_id: str,
    teacher_email: str | None = None,
    current_user: dict | None = Depends(get_optional_current_user),
):
    get_authorized_session(session_id, current_user, teacher_email)
    stats = get_session_stats(session_id)
    if isinstance(stats, dict):
        return stats
    return stats.fillna(0).to_dict()

@app.post("/session/create")
def create_session(
    name: str = Form(...),
    teacher_email: str | None = Form(None),
    correction_mode: str = Form("NLP"),
    preferences_json: str = Form(...),
    custom_prompt: str = Form(""),
    teacher_model_answer: UploadFile = File(...),
    question_paper: UploadFile = File(...),
    current_user: dict | None = Depends(get_optional_current_user),
):
    teacher = resolve_teacher_identity(current_user, teacher_email)
    teacher_email = teacher["email"]
    try:
        preferences_data = json.loads(preferences_json)
        preferences = EvaluationPreferences.model_validate(preferences_data)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Invalid preferences JSON") from exc
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    teacher_model_answer_location = os.path.join(
        UPLOAD_FOLDER, f"{uuid.uuid4().hex}_teacher_model_answer.pdf"
    )
    question_paper_location = os.path.join(
        UPLOAD_FOLDER, f"{uuid.uuid4().hex}_question_paper.pdf"
    )

    save_upload_file(teacher_model_answer, teacher_model_answer_location)
    save_upload_file(question_paper, question_paper_location)

    teacher_model_answer_text = get_text_from_nonOCR_pdf(teacher_model_answer_location)
    question_paper_text = get_text_from_nonOCR_pdf(question_paper_location)

    session_id = f"session_{uuid.uuid4().hex}"
    db.sessions.insert_one(
        {
            "session_id": session_id,
            "status": "created",
            "name": name,
            "teacher_id": teacher.get("id"),
            "teacher_email": teacher_email,
            "teacher_email_normalized": teacher_email,
            "correction_mode": correction_mode,
            "preferences": preferences.model_dump(),
            "teacher_model_answer": teacher_model_answer_text,
            "question_paper": question_paper_text,
            "custom_prompt": custom_prompt,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    return {"session_id": session_id}


@app.get("/sessions")
def list_sessions(
    teacher_email: str | None = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    current_user: dict | None = Depends(get_optional_current_user),
):
    teacher = resolve_teacher_identity(current_user, teacher_email)
    query = _teacher_session_query(teacher["email"], teacher.get("id"))
    total = db.sessions.count_documents(query)
    sessions = db.sessions.find(
        query,
        {
            "_id": 0,
            "session_id": 1,
            "name": 1,
            "status": 1,
            "correction_mode": 1,
            "created_at": 1,
        },
    ).sort("created_at", -1).skip(offset).limit(limit)
    return {
        "items": list(sessions),
        "pagination": _build_pagination_meta(total=total, offset=offset, limit=limit),
    }


@app.get("/session/{session_id}")
def get_session(
    session_id: str,
    teacher_email: str | None = None,
    current_user: dict | None = Depends(get_optional_current_user),
):
    session = get_authorized_session(session_id, current_user, teacher_email)
    session.pop("_id", None)
    return session


@app.delete("/session/{session_id}")
def delete_session(
    session_id: str,
    teacher_email: str | None = None,
    current_user: dict | None = Depends(get_optional_current_user),
):
    get_authorized_session(session_id, current_user, teacher_email)
    
    db.sessions.delete_one({"session_id": session_id})
    db.results.delete_many({"session_id": session_id})
    # Optional: could also delete uploaded files if we wanted to
    return {"message": "Session deleted successfully"}


@app.post("/session/{session_id}/upload_zip")
def upload_folder(
    session_id: str,
    file: UploadFile = File(...),
    teacher_email: str | None = Form(None),
    current_user: dict | None = Depends(get_optional_current_user),
):
    get_authorized_session(session_id, current_user, teacher_email)
    if not file.filename.lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only .zip files allowed")

    file_location = os.path.join(UPLOAD_FOLDER, f"{session_id}.zip")
    save_upload_file(file, file_location)

    db.sessions.update_one(
        {"session_id": session_id},
        {"$set": {"status": "uploaded", "zip_file": file_location}},
    )
    return {"message": "File uploaded successfully"}


@app.post("/session/{session_id}/process")
def process_session_endpoint(
    session_id: str,
    background_tasks: BackgroundTasks,
    teacher_email: str | None = Form(None),
    current_user: dict | None = Depends(get_optional_current_user),
):
    session = get_authorized_session(session_id, current_user, teacher_email)
    if session.get("status") != "uploaded":
        raise HTTPException(status_code=400, detail="Session not ready for processing")
    db.sessions.update_one(
        {"session_id": session_id},
        {"$set": {"status": "processing"}},
    )
    background_tasks.add_task(process_session, session_id, session.get("zip_file"))
    return {"message": "Session processing started"}


@app.get("/session/{session_id}/status")
def session_status(
    session_id: str,
    teacher_email: str | None = None,
    current_user: dict | None = Depends(get_optional_current_user),
):
    get_authorized_session(session_id, current_user, teacher_email)
    session = db.sessions.find_one(
        {"session_id": session_id},
        {"_id": 0, "status": 1, "total_files": 1, "processed": 1},
    )
    return session


@app.get("/session/{session_id}/results")
def get_session_results(
    session_id: str,
    teacher_email: str | None = None,
    current_user: dict | None = Depends(get_optional_current_user),
):
    get_authorized_session(session_id, current_user, teacher_email)
    results = list(db.results.find({"session_id": session_id}, {"_id": 0}))
    return results

@app.get("/teacher/my-class")
def get_my_class_students(
    teacher_email: str | None = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    current_user: dict | None = Depends(get_optional_current_user),
):
    teacher = resolve_teacher_identity(current_user, teacher_email)
    query = {"teacher_email": teacher["email"]}
    if teacher.get("id"):
        query["$or"] = [{"teacher_id": teacher.get("id")}, {"teacher_id": {"$exists": False}}]
    total = db.classroom_students.count_documents(query)
    students = list(
        db.classroom_students.find(
            query,
            {"_id": 0, "rollnum": 1, "name": 1, "name_key": 1, "history": 1, "updated_at": 1},
        ).sort("rollnum", 1).skip(offset).limit(limit)
    )
    return {
        "items": students,
        "pagination": _build_pagination_meta(total=total, offset=offset, limit=limit),
    }

@app.get("/teacher/my-class/{rollnum}")
def get_my_class_student_detail(
    rollnum: int,
    teacher_email: str | None = None,
    current_user: dict | None = Depends(get_optional_current_user),
):
    teacher = resolve_teacher_identity(current_user, teacher_email)
    class_student = db.classroom_students.find_one(
        {"teacher_email": teacher["email"], "rollnum": rollnum},
        {"_id": 0},
    )
    if class_student is None:
        raise HTTPException(status_code=404, detail="Student not found in this class")

    result_rows = list(
        db.results.find(
            {"student_rollnum": rollnum},
            {"_id": 0, "session_id": 1, "student_name": 1, "student_rollnum": 1, "result": 1},
        )
    )
    teacher_session_ids = {
        row.get("session_id")
        for row in db.sessions.find(
            _teacher_session_query(teacher["email"], teacher.get("id")),
            {"_id": 0, "session_id": 1},
        )
    }
    result_rows = [row for row in result_rows if row.get("session_id") in teacher_session_ids]
    result_rows.sort(key=lambda x: x.get("session_id", ""))
    request_rows = list(
        db.student_requests.find(
            {"rollnum": rollnum, "session_id": {"$in": list(teacher_session_ids)}}
        ).sort("created_at", -1)
    )
    for req in request_rows:
        req["_id"] = str(req["_id"])

    return {
        "student": class_student,
        "results": result_rows,
        "requests": request_rows,
    }

@app.get("/student/{rollnum}/results")
def get_student_results_open(rollnum: int):
    student = db.students.find_one({"rollnum": rollnum}, {"_id": 0, "rollnum": 1, "name": 1, "name_key": 1})
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    rows = list(
        db.results.find(
            {"student_rollnum": rollnum},
            {"_id": 0, "session_id": 1, "student_name": 1, "student_rollnum": 1, "result": 1},
        )
    )
    return {"student": student, "results": rows}

@app.post("/student/{rollnum}/request-reevaluation")
def request_student_reevaluation_open(
    rollnum: int,
    session_id: str = Form(...),
    reason: str = Form("Please reevaluate this result."),
):
    student = db.students.find_one({"rollnum": rollnum}, {"_id": 0, "rollnum": 1, "name": 1})
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    result_row = db.results.find_one({"session_id": session_id, "student_rollnum": rollnum}, {"_id": 0, "result": 1})
    if result_row is None:
        raise HTTPException(status_code=404, detail="Result not found for this session")
    doc = {
        "rollnum": rollnum,
        "student_name": student.get("name"),
        "session_id": session_id,
        "reason": reason,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    inserted = db.student_requests.insert_one(doc)
    safe_doc = {k: v for k, v in doc.items() if k != "_id"}
    safe_doc["request_id"] = str(inserted.inserted_id)
    return {"message": "Reevaluation request submitted", "request": safe_doc}

@app.post("/session/{session_id}/student/{student_name}/reevaluate")
def reevaluate_student(
    session_id: str,
    student_name: str,
    teacher_email: str | None = Form(None),
    current_user: dict | None = Depends(get_optional_current_user),
):
    session = get_authorized_session(session_id, current_user, teacher_email)
    
    # Get the specific result
    result_record = db.results.find_one({"session_id": session_id, "student_name": student_name})
    if not result_record:
        raise HTTPException(status_code=404, detail="Student result not found")

    new_result = _perform_reevaluation(session, result_record)
    history_entry = _append_reevaluation_history(result_record, new_result, actor="teacher_direct")
    
    return {"message": "Reevaluation complete", "new_result": new_result, "history_entry": history_entry}

@app.get("/teacher/reevaluation-requests")
def get_teacher_reevaluation_requests(
    status: str | None = None,
    teacher_email: str | None = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    current_user: dict | None = Depends(get_optional_current_user),
):
    teacher = resolve_teacher_identity(current_user, teacher_email)
    session_ids = [
        row.get("session_id")
        for row in db.sessions.find(
            _teacher_session_query(teacher["email"], teacher.get("id")),
            {"_id": 0, "session_id": 1},
        )
    ]
    query = {"session_id": {"$in": session_ids}}
    if status:
        query["status"] = status
    total = db.student_requests.count_documents(query)
    rows = list(db.student_requests.find(query).sort("created_at", -1).skip(offset).limit(limit))
    safe_rows = []
    for row in rows:
        row["_id"] = str(row["_id"])
        safe_rows.append(row)
    return {
        "items": safe_rows,
        "pagination": _build_pagination_meta(total=total, offset=offset, limit=limit),
    }

@app.post("/teacher/reevaluation-requests/{request_id}/approve")
def approve_reevaluation_request(
    request_id: str,
    teacher_email: str | None = Form(None),
    current_user: dict | None = Depends(get_optional_current_user),
):
    teacher = resolve_teacher_identity(current_user, teacher_email)
    try:
        req_obj_id = ObjectId(request_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid request id") from exc
    req = db.student_requests.find_one({"_id": req_obj_id})
    if req is None:
        raise HTTPException(status_code=404, detail="Request not found")

    session_id = req.get("session_id")
    session = get_authorized_session(session_id, current_user, teacher_email=teacher["email"])
    result_record = db.results.find_one(
        {"session_id": session_id, "student_rollnum": req.get("rollnum")}
    )
    if result_record is None:
        raise HTTPException(status_code=404, detail="Student result not found for reevaluation request")

    if req.get("status") == "approved":
        raise HTTPException(status_code=400, detail="Request already approved")
    if req.get("status") == "rejected":
        raise HTTPException(status_code=400, detail="Rejected requests cannot be approved")

    new_result = _perform_reevaluation(session, result_record)
    history_entry = _append_reevaluation_history(result_record, new_result, actor="teacher_approved_request")
    db.student_requests.update_one(
        {"_id": req["_id"]},
        {"$set": {"status": "approved", "approved_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {"message": "Reevaluation approved and applied", "request_id": request_id, "history_entry": history_entry}

@app.post("/teacher/reevaluation-requests/{request_id}/reject")
def reject_reevaluation_request(
    request_id: str,
    reason: str = Form("Request rejected by teacher."),
    teacher_email: str | None = Form(None),
    current_user: dict | None = Depends(get_optional_current_user),
):
    teacher = resolve_teacher_identity(current_user, teacher_email)
    try:
        req_obj_id = ObjectId(request_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid request id") from exc
    req = db.student_requests.find_one({"_id": req_obj_id})
    if req is None:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.get("status") == "approved":
        raise HTTPException(status_code=400, detail="Approved requests cannot be rejected")
    if req.get("status") == "rejected":
        raise HTTPException(status_code=400, detail="Request already rejected")

    session_id = req.get("session_id")
    get_authorized_session(session_id, current_user, teacher_email=teacher["email"])
    db.student_requests.update_one(
        {"_id": req["_id"]},
        {
            "$set": {
                "status": "rejected",
                "rejected_at": datetime.now(timezone.utc).isoformat(),
                "rejection_reason": reason,
            }
        },
    )
    return {"message": "Reevaluation request rejected", "request_id": request_id}

@app.post("/session/{session_id}/cheat_detection")
def detect_cheat(
    session_id: str,
    background_tasks: BackgroundTasks,
    teacher_email: str | None = Form(None),
    current_user: dict | None = Depends(get_optional_current_user),
):
    session = get_authorized_session(session_id, current_user, teacher_email)
    if session.get("status") != "processed":
        raise HTTPException(status_code=400, detail="Session not in processed state")
    db.sessions.update_one(
        {"session_id": session_id},
        {
            "$set": {"cheat_detection_status": "running"},
            "$unset": {"cheat_detection": "", "cheat_detection_error": ""},
        },
    )
    background_tasks.add_task(check_cheat_in_session, session_id)
    return {"message": "Cheat detection started"}


@app.get("/session/{session_id}/cheat_report")
def get_cheat_report(
    session_id: str,
    teacher_email: str | None = None,
    current_user: dict | None = Depends(get_optional_current_user),
):
    get_authorized_session(session_id, current_user, teacher_email)
    session = db.sessions.find_one(
        {"session_id": session_id},
        {"_id": 0, "status": 1, "cheat_detection": 1, "cheat_detection_status": 1, "cheat_detection_last_run": 1},
    )
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    report = session.get("cheat_detection")
    if session.get("cheat_detection_status") == "running":
        return {
            "status": "running",
            "last_run": session.get("cheat_detection_last_run"),
            "report": None,
        }

    if report:
        return {
            "status": session.get("cheat_detection_status", "completed"),
            "last_run": session.get("cheat_detection_last_run"),
            "report": report,
        }

    if session.get("status") == "processed":
        generated_report = check_cheat_in_session(session_id)
        refreshed = db.sessions.find_one(
            {"session_id": session_id},
            {"_id": 0, "cheat_detection_status": 1, "cheat_detection_last_run": 1},
        ) or {}
        return {
            "status": refreshed.get("cheat_detection_status", "completed"),
            "last_run": refreshed.get("cheat_detection_last_run"),
            "report": generated_report,
        }

    return {
        "status": session.get("cheat_detection_status", "pending"),
        "last_run": session.get("cheat_detection_last_run"),
        "report": None,
    }


@app.post("/QCP")
def question_paper(
    preferences_json: str = Form(...),
    relevent_docs: UploadFile = File(...)
):
    try:
        preferences_data = json.loads(preferences_json)
        prefs = QuestionParerPrefrences.model_validate(preferences_data)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    doc_location = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4().hex}_relevent_docs.pdf")
    save_upload_file(relevent_docs, doc_location)

    docs_text = get_text_from_nonOCR_pdf(doc_location)
    genrated_paper = set_paper(
        difficulty=prefs.difficulty,
        max_marks=prefs.max_marks,
        no_of_ques=prefs.no_of_ques,
        course=prefs.course,
        choice_aval=prefs.choice_aval,
        choice_type=prefs.choice_type,
        relavent_docs=docs_text,
        custom_prompt=prefs.custom_prompt
    )
    return genrated_paper
