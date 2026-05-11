from fastapi import APIRouter, Depends, Query, HTTPException
from backend.db import db
from backend.auth import get_optional_current_user, get_current_user
from backend.utils import (
    resolve_teacher_identity,
    _teacher_session_query,
    _build_pagination_meta,
    _require_student_rollnum_access
)

router = APIRouter(tags=["Students"])

@router.get("/teacher/my-class")
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

@router.get("/teacher/my-class/{rollnum}")
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
    
    from bson.objectid import ObjectId
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

@router.get("/student/{rollnum}/results")
def get_student_results_open(
    rollnum: int,
    current_user: dict = Depends(get_current_user),
):
    _require_student_rollnum_access(current_user, rollnum)
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
