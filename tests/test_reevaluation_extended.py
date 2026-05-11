import pytest
from fastapi import HTTPException
from bson.objectid import ObjectId
from backend.reevaluation import router, _perform_reevaluation, _append_reevaluation_history
from backend.db import db
from datetime import datetime, timezone
from unittest.mock import MagicMock

def test_perform_reevaluation_fallback_student_answer(monkeypatch):
    monkeypatch.setattr("os.path.exists", lambda x: True)
    monkeypatch.setattr("backend.reevaluation.get_text_from_nonOCR_pdf", lambda x: "extracted answer")
    
    # Mock LLM_Reevaluate
    def mock_reevaluate(**kwargs):
        assert kwargs["student_answer"] == "extracted answer"
        return {"total_marks": 10}
    
    monkeypatch.setattr("Engine.grade.llm.LLM_Reevaluate", mock_reevaluate)
    
    session = {"question_paper": "Q", "teacher_model_answer": "A", "preferences": {}}
    result_record = {"pdf_file": "path/to/pdf", "result": {"total_marks": 5}}
    
    res = _perform_reevaluation(session, result_record)
    assert res["total_marks"] == 10

def test_reevaluate_student_endpoint_not_found(monkeypatch):
    monkeypatch.setattr("backend.reevaluation.get_authorized_session", lambda *args, **kwargs: {})
    # db.results.find_one returns None
    
    with pytest.raises(HTTPException) as exc:
        from backend.reevaluation import reevaluate_student
        reevaluate_student("sess_id", "Unknown Student", None, {"role": "teacher", "email": "t@e.com", "id": "tid"})
    assert exc.value.status_code == 404

def test_approve_reevaluation_request_already_approved(monkeypatch):
    req_id = str(ObjectId())
    req = {
        "_id": ObjectId(req_id),
        "session_id": "sess_1",
        "rollnum": 101,
        "status": "approved"
    }
    monkeypatch.setattr("backend.reevaluation.resolve_teacher_identity", lambda *args, **kwargs: {"email": "t@e.com", "id": "tid"})
    
    # Mock db.student_requests
    mock_req_coll = MagicMock()
    mock_req_coll.find_one.return_value = req
    monkeypatch.setattr(db, "student_requests", mock_req_coll)

    # Mock db.sessions to avoid 404 in get_authorized_session
    mock_sess_coll = MagicMock()
    mock_sess_coll.find_one.return_value = {"session_id": "sess_1", "teacher_email": "t@e.com"}
    monkeypatch.setattr(db, "sessions", mock_sess_coll)

    # Mock db.results to avoid 404 in approve_reevaluation_request
    mock_results_coll = MagicMock()
    mock_results_coll.find_one.return_value = {"session_id": "sess_1", "student_rollnum": 101}
    monkeypatch.setattr(db, "results", mock_results_coll)
    
    from backend.reevaluation import approve_reevaluation_request
    with pytest.raises(HTTPException) as exc:
        approve_reevaluation_request(req_id, None, {"role": "teacher", "email": "t@e.com", "id": "tid"})
    assert exc.value.status_code == 400
    assert exc.value.detail == "Request already approved"

def test_approve_reevaluation_request_with_notification(monkeypatch):
    req_id = str(ObjectId())
    req = {
        "_id": ObjectId(req_id),
        "session_id": "sess_1",
        "rollnum": 101,
        "status": "pending"
    }
    monkeypatch.setattr("backend.reevaluation.resolve_teacher_identity", lambda *args, **kwargs: {"email": "t@e.com", "id": "tid"})
    
    # Mock db.student_requests
    mock_req_coll = MagicMock()
    mock_req_coll.find_one.return_value = req
    monkeypatch.setattr(db, "student_requests", mock_req_coll)

    # Mock db.sessions
    mock_sess_coll = MagicMock()
    mock_sess_coll.find_one.return_value = {"session_id": "sess_1", "teacher_email": "t@e.com", "preferences": {}}
    monkeypatch.setattr(db, "sessions", mock_sess_coll)

    # Mock db.results
    mock_results_coll = MagicMock()
    mock_results_coll.find_one.return_value = {"session_id": "sess_1", "student_rollnum": 101, "_id": ObjectId()}
    monkeypatch.setattr(db, "results", mock_results_coll)

    # Mock db.students
    mock_students_coll = MagicMock()
    mock_students_coll.find_one.return_value = {"email": "s@e.com", "name": "John"}
    monkeypatch.setattr(db, "students", mock_students_coll)

    # Mock _perform_reevaluation
    monkeypatch.setattr("backend.reevaluation._perform_reevaluation", lambda *args: {"marks": 10})
    # Mock _append_reevaluation_history
    monkeypatch.setattr("backend.reevaluation._append_reevaluation_history", lambda *args, **kwargs: {})
    
    # Mock NotificationService
    mock_notify = MagicMock()
    import sys
    notify_mod = MagicMock()
    notify_mod.NotificationService = mock_notify
    monkeypatch.setitem(sys.modules, "backend.services.notification", notify_mod)

    from backend.reevaluation import approve_reevaluation_request
    res = approve_reevaluation_request(req_id, None, {"role": "teacher", "email": "t@e.com", "id": "tid"})
    
    assert res["message"] == "Reevaluation approved and applied"
    mock_notify.notify_reevaluation_update.assert_called_once_with("s@e.com", "John", "approved")

def test_reject_reevaluation_request_with_notification(monkeypatch):
    req_id = str(ObjectId())
    req = {
        "_id": ObjectId(req_id),
        "session_id": "sess_1",
        "rollnum": 101,
        "status": "pending"
    }
    monkeypatch.setattr("backend.reevaluation.resolve_teacher_identity", lambda *args, **kwargs: {"email": "t@e.com", "id": "tid"})
    
    # Mock db.student_requests
    mock_req_coll = MagicMock()
    mock_req_coll.find_one.return_value = req
    monkeypatch.setattr(db, "student_requests", mock_req_coll)

    # Mock db.sessions
    monkeypatch.setattr("backend.reevaluation.get_authorized_session", lambda *args, **kwargs: {})

    # Mock db.students
    mock_students_coll = MagicMock()
    mock_students_coll.find_one.return_value = {"email": "s@e.com", "name": "John"}
    monkeypatch.setattr(db, "students", mock_students_coll)

    # Mock NotificationService
    mock_notify = MagicMock()
    import sys
    notify_mod = MagicMock()
    notify_mod.NotificationService = mock_notify
    monkeypatch.setitem(sys.modules, "backend.services.notification", notify_mod)

    from backend.reevaluation import reject_reevaluation_request
    res = reject_reevaluation_request(req_id, "Bad luck", None, {"role": "teacher", "email": "t@e.com", "id": "tid"})
    
    assert res["message"] == "Reevaluation request rejected"
    mock_notify.notify_reevaluation_update.assert_called_once_with("s@e.com", "John", "rejected")
