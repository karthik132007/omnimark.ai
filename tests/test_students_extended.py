import pytest
from fastapi.testclient import TestClient
from backend.app import app
from backend.db import db
from unittest.mock import MagicMock

client = TestClient(app)

def test_get_my_class_students_with_teacher_id(monkeypatch):
    mock_teacher = {"email": "t@e.com", "id": "tid_123"}
    monkeypatch.setattr("backend.students.resolve_teacher_identity", lambda *args: mock_teacher)
    
    mock_coll = MagicMock()
    mock_coll.count_documents.return_value = 0
    mock_coll.find.return_value.sort.return_value.skip.return_value.limit.return_value = []
    monkeypatch.setattr(db, "classroom_students", mock_coll)
    
    response = client.get("/teacher/my-class", params={"teacher_email": "t@e.com"})
    assert response.status_code == 200
    # Verify query had $or with teacher_id
    args, kwargs = mock_coll.count_documents.call_args
    assert "$or" in args[0]

def test_get_my_class_student_detail_not_found(monkeypatch):
    monkeypatch.setattr("backend.students.resolve_teacher_identity", lambda *args: {"email": "t@e.com"})
    
    mock_coll = MagicMock()
    mock_coll.find_one.return_value = None
    monkeypatch.setattr(db, "classroom_students", mock_coll)
    
    response = client.get("/teacher/my-class/101", params={"teacher_email": "t@e.com"})
    assert response.status_code == 404
    assert response.json()["detail"] == "Student not found in this class"

def test_get_student_results_open_not_found(monkeypatch):
    from backend.auth import get_current_user
    # Mock get_current_user using FastAPI dependency_overrides
    app.dependency_overrides[get_current_user] = lambda: {"role": "student", "rollnum": 101}
    monkeypatch.setattr("backend.students._require_student_rollnum_access", lambda *args: None)
    
    mock_coll = MagicMock()
    mock_coll.find_one.return_value = None
    monkeypatch.setattr(db, "students", mock_coll)
    
    try:
        response = client.get("/student/101/results")
        assert response.status_code == 404
        assert response.json()["detail"] == "Student not found"
    finally:
        app.dependency_overrides.clear()

