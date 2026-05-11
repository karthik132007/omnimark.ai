import pytest
from fastapi import HTTPException
from backend.auth import (
    get_optional_current_user,
    get_current_univ,
    update_teacher,
    delete_teacher,
    change_student_password,
    SECRET_KEY,
    ALGORITHM
)
from backend.db import db
from bson.objectid import ObjectId
import jwt
from unittest.mock import MagicMock

def test_get_optional_current_user_no_token():
    assert get_optional_current_user(None) is None

def test_get_optional_current_user_invalid_token():
    assert get_optional_current_user("invalid-token") is None

def test_get_optional_current_user_student(monkeypatch):
    user_id = str(ObjectId())
    payload = {"sub": "student@e.com", "role": "student", "id": user_id}
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    
    mock_students = MagicMock()
    mock_students.find_one.return_value = {"_id": ObjectId(user_id), "name": "John", "rollnum": 101}
    monkeypatch.setattr(db, "students", mock_students)
    
    res = get_optional_current_user(token)
    assert res["role"] == "student"
    assert res["id"] == user_id
    assert res["rollnum"] == 101

def test_get_optional_current_user_teacher(monkeypatch):
    user_id = str(ObjectId())
    payload = {"sub": "teacher@e.com", "role": "teacher", "id": user_id}
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    
    mock_users = MagicMock()
    mock_users.find_one.return_value = {"_id": ObjectId(user_id), "email": "teacher@e.com", "role": "teacher"}
    monkeypatch.setattr(db, "users", mock_users)
    
    res = get_optional_current_user(token)
    assert res["role"] == "teacher"
    assert res["email"] == "teacher@e.com"

def test_get_current_univ_forbidden():
    with pytest.raises(HTTPException) as exc:
        get_current_univ({"role": "teacher"})
    assert exc.value.status_code == 403

def test_delete_teacher_not_found(monkeypatch):
    current_univ = {"id": "univ_1"}
    mock_users = MagicMock()
    mock_users.delete_one.return_value = MagicMock(deleted_count=0)
    monkeypatch.setattr(db, "users", mock_users)
    
    with pytest.raises(HTTPException) as exc:
        delete_teacher(str(ObjectId()), current_univ)
    assert exc.value.status_code == 404

def test_update_teacher_nothing_to_update():
    from backend.auth import TeacherUpdate
    res = update_teacher("tid", TeacherUpdate(), {"id": "univ_1"})
    assert res == {"msg": "Nothing to update"}

def test_change_student_password_forbidden():
    from backend.auth import StudentChangePasswordModel
    with pytest.raises(HTTPException) as exc:
        change_student_password(StudentChangePasswordModel(old_password="p1", new_password="p2"), {"role": "teacher"})
    assert exc.value.status_code == 403
