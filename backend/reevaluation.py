import os
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Form, HTTPException, Query
from bson.objectid import ObjectId
from backend.db import db
from backend.auth import get_optional_current_user, get_current_user
from backend.worker.work import get_text_from_nonOCR_pdf
from backend.utils import (
    resolve_teacher_identity,
    get_authorized_session,
    _require_student_rollnum_access,
    _teacher_session_query,
    _build_pagination_meta
)

router = APIRouter(tags=["Reevaluation"])

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

@router.post("/student/{rollnum}/request-reevaluation")
def request_student_reevaluation_open(
    rollnum: int,
    session_id: str = Form(...),
    reason: str = Form("Please reevaluate this result."),
    current_user: dict = Depends(get_current_user),
):
    _require_student_rollnum_access(current_user, rollnum)
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

@router.post("/session/{session_id}/student/{student_name}/reevaluate")
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
    if not new_result:
        raise HTTPException(status_code=500, detail="Reevaluation failed to produce a result")
    history_entry = _append_reevaluation_history(result_record, new_result, actor="teacher_direct")
    
    return {"message": "Reevaluation complete", "new_result": new_result, "history_entry": history_entry}

@router.get("/teacher/reevaluation-requests")
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

@router.post("/teacher/reevaluation-requests/{request_id}/approve")
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

    # Notify student
    try:
        student = db.students.find_one({"rollnum": req.get("rollnum")}, {"email": 1, "name": 1})
        if student and student.get("email"):
            from backend.services.notification import NotificationService
            NotificationService.notify_reevaluation_update(
                student["email"], 
                student.get("name", "Student"), 
                "approved"
            )
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to notify student: {str(e)}")

    return {"message": "Reevaluation approved and applied", "request_id": request_id, "history_entry": history_entry}

@router.post("/teacher/reevaluation-requests/{request_id}/reject")
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

    # Notify student
    try:
        student = db.students.find_one({"rollnum": req.get("rollnum")}, {"email": 1, "name": 1})
        if student and student.get("email"):
            from backend.services.notification import NotificationService
            NotificationService.notify_reevaluation_update(
                student["email"], 
                student.get("name", "Student"), 
                "rejected"
            )
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to notify student: {str(e)}")

    return {"message": "Reevaluation request rejected", "request_id": request_id}
