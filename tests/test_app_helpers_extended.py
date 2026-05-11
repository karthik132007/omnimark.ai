import pytest
import mongomock
from fastapi import HTTPException
from backend import app as app_module
from backend import utils
from bson.objectid import ObjectId


def test_resolve_teacher_identity_paths(monkeypatch):
    mock_db = mongomock.MongoClient().omnimark
    t_id = ObjectId()
    mock_db.users.insert_one({
        "_id": t_id, "role": "teacher", "email": "univ-t@test.com", "university_id": "u1"
    })
    monkeypatch.setattr(utils, "db", mock_db)

    # teacher_email gives dict
    assert utils.resolve_teacher_identity(None, "uNiv-T@test.com ") == {"email": "univ-t@test.com", "id": None}

    # teacher current_user
    u = {"role": "teacher", "email": "me@test.com", "id": "me1"}
    assert utils.resolve_teacher_identity(u) == {"email": "me@test.com", "id": "me1"}

    # univ current_user + teacher_email
    univ = {"role": "university", "id": "u1"}
    resolved = utils.resolve_teacher_identity(univ, "univ-t@test.com")
    assert resolved["email"] == "univ-t@test.com"
    assert resolved["id"] == str(t_id)

    # univ current_user + wrong teacher_email
    with pytest.raises(HTTPException) as exc:
        utils.resolve_teacher_identity(univ, "other@test.com")
    assert exc.value.status_code == 404

    # nothing
    with pytest.raises(HTTPException) as exc:
        utils.resolve_teacher_identity(None)
    assert exc.value.status_code == 400


def test_resolve_teacher_email(monkeypatch):
    assert utils.resolve_teacher_email(None, "foo@test.com") == "foo@test.com"


def test_require_student_rollnum_access_all_paths():
    with pytest.raises(HTTPException) as e1:
        utils._require_student_rollnum_access(None, 1)
    assert e1.value.status_code == 401

    with pytest.raises(HTTPException) as e2:
        utils._require_student_rollnum_access({"role": "teacher"}, 1)
    assert e2.value.status_code == 403

    with pytest.raises(HTTPException) as e3:
        utils._require_student_rollnum_access({"role": "student", "rollnum": 5}, 1)
    assert e3.value.status_code == 403

    # Success path
    utils._require_student_rollnum_access({"role": "student", "rollnum": 1}, 1)


def test_get_authorized_session_teacher_email_paths(monkeypatch):
    mock_db = mongomock.MongoClient().omnimark
    mock_db.sessions.insert_one({"session_id": "s1", "teacher_email": "a@test.com"})
    monkeypatch.setattr(utils, "db", mock_db)

    session = utils.get_authorized_session("s1", current_user=None, teacher_email="a@test.com")
    assert session["session_id"] == "s1"

    with pytest.raises(HTTPException):
        utils.get_authorized_session("s1", current_user=None, teacher_email="b@test.com")

    with pytest.raises(HTTPException):
        utils.get_authorized_session("invalid", current_user=None, teacher_email="a@test.com")


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
    monkeypatch.setattr(utils, "db", mock_db)

    allowed = utils.get_authorized_session(
        "s2", current_user={"role": "teacher", "id": "t-1", "email": "x@test.com"}
    )
    assert allowed["session_id"] == "s2"

    allowed_by_email = utils.get_authorized_session(
        "s2", current_user={"role": "teacher", "id": "t-other", "email": "teacher@test.com"}
    )
    assert allowed_by_email["session_id"] == "s2"

    with pytest.raises(HTTPException):
        utils.get_authorized_session("s2", current_user={"role": "teacher", "id": "t-other", "email": "y@test.com"})
