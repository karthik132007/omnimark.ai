import pytest
import mongomock
from fastapi import HTTPException

from backend import app as app_module


def test_require_student_rollnum_access_all_paths():
    with pytest.raises(HTTPException) as e1:
        app_module._require_student_rollnum_access(None, 1)
    assert e1.value.status_code == 401

    with pytest.raises(HTTPException) as e2:
        app_module._require_student_rollnum_access({"role": "teacher", "rollnum": 1}, 1)
    assert e2.value.status_code == 403

    with pytest.raises(HTTPException) as e3:
        app_module._require_student_rollnum_access({"role": "student", "rollnum": 2}, 1)
    assert e3.value.status_code == 403

    app_module._require_student_rollnum_access({"role": "student", "rollnum": 1}, 1)


def test_get_authorized_session_teacher_email_paths(monkeypatch):
    mock_db = mongomock.MongoClient().omnimark
    mock_db.sessions.insert_one({"session_id": "s1", "teacher_email": "a@test.com"})
    monkeypatch.setattr(app_module, "db", mock_db)

    session = app_module.get_authorized_session("s1", current_user=None, teacher_email="a@test.com")
    assert session["session_id"] == "s1"

    with pytest.raises(HTTPException) as exc:
        app_module.get_authorized_session("s1", current_user=None, teacher_email="b@test.com")
    assert exc.value.status_code == 403


def test_get_authorized_session_teacher_user_paths(monkeypatch):
    mock_db = mongomock.MongoClient().omnimark
    mock_db.sessions.insert_one(
        {
            "session_id": "s2",
            "teacher_id": "t-1",
            "teacher_email": "teacher@test.com",
            "teacher_email_normalized": "teacher@test.com",
        }
    )
    monkeypatch.setattr(app_module, "db", mock_db)

    allowed = app_module.get_authorized_session(
        "s2", current_user={"role": "teacher", "id": "t-1", "email": "x@test.com"}
    )
    assert allowed["session_id"] == "s2"

    with pytest.raises(HTTPException) as denied:
        app_module.get_authorized_session(
            "s2", current_user={"role": "teacher", "id": "other", "email": "other@test.com"}
        )
    assert denied.value.status_code == 403
