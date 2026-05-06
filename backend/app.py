import json
import os
import re
import uuid
from datetime import datetime, timezone
from bson.objectid import ObjectId
from Engine.Dashbord_data.eda import get_teacher_dashboard_summary, get_teacher_stats, get_session_stats
from Engine.OMI.omi import explain_stats
from fastapi import BackgroundTasks, Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from Engine.cheat_detection.main import check_cheat
from Engine.grade.nlp import Correct_NLP
from backend.db import db
from backend.auth import get_current_user, get_optional_current_user, normalize_email, router as auth_router
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

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
    
    analysis_json_str = explain_stats(stats_data)
    try:
        return json.loads(analysis_json_str)
    except Exception as e:
        return {"error": "Failed to parse Omi analysis", "raw": analysis_json_str}

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
    current_user: dict | None = Depends(get_optional_current_user),
):
    teacher = resolve_teacher_identity(current_user, teacher_email)
    sessions = db.sessions.find(
        _teacher_session_query(teacher["email"], teacher.get("id")),
        {
            "_id": 0,
            "session_id": 1,
            "name": 1,
            "status": 1,
            "correction_mode": 1,
            "created_at": 1,
        },
    )
    return list(sessions)


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

#===================== dont touch below code! =========================
"""
    Test purpose #? written by Kathik - denni kelakadhu - idhi working
"""
@app.post("/test/nlp")
def test_nlp(teacher_answer: str,student_answer: str,prefrences: dict):
    result =Correct_NLP(Student_Response=student_answer,Teacher_model_answer=teacher_answer,preferences=prefrences,key_points=None)
    return result

@app.post("/test/cheat_sim")
def test_cheat_sim(student1: str, student2: str):
    result = check_cheat(student1, student2)
    return result

@app.post("/test/llm")
def test_llm(question_paper: str, teacher_model_answer: str, student_answer: str, preferences: dict):
    from Engine.grade.llm import LLM_Grade
    result = LLM_Grade(question_paper, teacher_model_answer, student_answer, preferences)
    return result
