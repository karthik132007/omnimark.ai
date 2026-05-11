import pytest
from fastapi import HTTPException
from backend.utils import resolve_teacher_identity, get_authorized_session, _require_student_rollnum_access
from backend.db import db
from bson.objectid import ObjectId
from unittest.mock import MagicMock

def test_resolve_teacher_identity_university_not_found(monkeypatch):
    current_user = {"role": "university", "id": "univ_id"}
    monkeypatch.setattr(db.users, "find_one", lambda query, projection=None: None)
    
    with pytest.raises(HTTPException) as exc:
        resolve_teacher_identity(current_user, "missing@teacher.com")
    assert exc.value.status_code == 404

def test_resolve_teacher_identity_no_email_or_teacher_role():
    with pytest.raises(HTTPException) as exc:
        resolve_teacher_identity({"role": "university"}, None)
    assert exc.value.status_code == 400

def test_require_student_rollnum_access_unauthorized():
    with pytest.raises(HTTPException) as exc:
        _require_student_rollnum_access(None, 101)
    assert exc.value.status_code == 401

def test_require_student_rollnum_access_wrong_role():
    with pytest.raises(HTTPException) as exc:
        _require_student_rollnum_access({"role": "teacher"}, 101)
    assert exc.value.status_code == 403

def test_require_student_rollnum_access_wrong_rollnum():
    with pytest.raises(HTTPException) as exc:
        _require_student_rollnum_access({"role": "student", "rollnum": 102}, 101)
    assert exc.value.status_code == 403

def test_get_authorized_session_not_found(monkeypatch):
    monkeypatch.setattr(db.sessions, "find_one", lambda query: None)
    with pytest.raises(HTTPException) as exc:
        get_authorized_session("missing_sess", None)
    assert exc.value.status_code == 404

def test_get_authorized_session_wrong_teacher_email(monkeypatch):
    session = {"session_id": "s1", "teacher_email": "t1@e.com"}
    mock_sessions = MagicMock()
    mock_sessions.find_one.return_value = session
    monkeypatch.setattr(db, "sessions", mock_sessions)
    
    with pytest.raises(HTTPException) as exc:
        get_authorized_session("s1", None, "t2@e.com")
    assert exc.value.status_code == 403

def test_get_authorized_session_university_access(monkeypatch):
    tid = str(ObjectId())
    session = {"session_id": "s1", "teacher_id": tid}
    
    mock_sessions = MagicMock()
    mock_sessions.find_one.return_value = session
    monkeypatch.setattr(db, "sessions", mock_sessions)
    
    # University user
    current_user = {"role": "university", "id": "univ_1"}
    
    # Teacher exists for this university
    mock_users = MagicMock()
    mock_users.find_one.return_value = {"_id": ObjectId(tid)}
    monkeypatch.setattr(db, "users", mock_users)
    
    res = get_authorized_session("s1", current_user)
    assert res == session
