import json
import os
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import Response, StreamingResponse
from backend.db import db
from backend.auth import get_optional_current_user
from backend.schemas import EvaluationPreferences, QuestionParerPrefrences
from backend.worker.files import save_upload_file
from backend.worker.work import get_text_from_nonOCR_pdf, process_session, check_cheat_in_session
from Engine.QCP.qcp import set_paper
from backend.utils import (
    UPLOAD_FOLDER,
    resolve_teacher_identity,
    _teacher_session_query,
    _build_pagination_meta,
    get_authorized_session
)

router = APIRouter(tags=["Sessions"])

@router.post("/session/create")
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


@router.get("/sessions")
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


@router.get("/session/{session_id}")
def get_session(
    session_id: str,
    teacher_email: str | None = None,
    current_user: dict | None = Depends(get_optional_current_user),
):
    session = get_authorized_session(session_id, current_user, teacher_email)
    session.pop("_id", None)
    return session


@router.delete("/session/{session_id}")
def delete_session(
    session_id: str,
    teacher_email: str | None = None,
    current_user: dict | None = Depends(get_optional_current_user),
):
    get_authorized_session(session_id, current_user, teacher_email)
    
    db.sessions.delete_one({"session_id": session_id})
    db.results.delete_many({"session_id": session_id})
    return {"message": "Session deleted successfully"}


@router.post("/session/{session_id}/upload_zip")
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


@router.post("/session/{session_id}/process")
def process_session_endpoint(
    session_id: str,
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
    process_session.delay(session_id, session.get("zip_file"))
    return {"message": "Session processing started"}


@router.get("/session/{session_id}/status")
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


@router.get("/session/{session_id}/results")
def get_session_results(
    session_id: str,
    teacher_email: str | None = None,
    current_user: dict | None = Depends(get_optional_current_user),
):
    get_authorized_session(session_id, current_user, teacher_email)
    results = list(db.results.find({"session_id": session_id}, {"_id": 0}))
    return results

@router.post("/session/{session_id}/cheat_detection")
def detect_cheat(
    session_id: str,
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
    check_cheat_in_session.delay(session_id)
    return {"message": "Cheat detection started"}


@router.get("/session/{session_id}/cheat_report")
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


@router.get("/session/{session_id}/export")
def export_session_results(
    session_id: str,
    format: str = Query(default="csv", regex="^(csv|xlsx)$"),
    teacher_email: str | None = None,
    current_user: dict | None = Depends(get_optional_current_user),
):
    get_authorized_session(session_id, current_user, teacher_email)
    
    from Engine.reports.exporter import ReportExporter
    import io

    results = list(db.results.find({"session_id": session_id}, {"_id": 0}))
    if not results:
        raise HTTPException(status_code=404, detail="No results found to export")

    filename = f"export_{session_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    if format == "csv":
        csv_data = ReportExporter.to_csv(results)
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}.csv"}
        )
    else:
        buffer = ReportExporter.to_excel_buffer(results)
        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}.xlsx"}
        )

@router.post("/QCP")
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
