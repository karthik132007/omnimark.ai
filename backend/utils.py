import os
import re
from typing import Optional
from fastapi import HTTPException
from backend.auth import normalize_email
from backend.db import db

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


def _require_student_rollnum_access(current_user: dict, rollnum: int):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can access this endpoint")
    if int(current_user.get("rollnum", -1)) != int(rollnum):
        raise HTTPException(status_code=403, detail="You can only access your own results")

def resolve_teacher_identity(current_user: dict | None, teacher_email: str | None = None):
    if teacher_email and current_user and current_user.get("role") == "university":
        email = normalize_email(teacher_email)
        from bson.objectid import ObjectId
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

    if teacher_email:
        return {"email": normalize_email(teacher_email), "id": None}

    if current_user and current_user.get("role") == "teacher":
        return {
            "email": normalize_email(current_user.get("email", "")),
            "id": current_user.get("id"),
        }
    raise HTTPException(status_code=400, detail="teacher_email is required")

def resolve_teacher_email(current_user: dict, teacher_email: str | None = None):
    return resolve_teacher_identity(current_user, teacher_email)["email"]

def _normalize_student_name(name: str):
    return " ".join(str(name or "").strip().lower().split())

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
                from bson.objectid import ObjectId
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
