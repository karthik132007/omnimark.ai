import pytest
import json
from fastapi import HTTPException, UploadFile
from backend.sessions import create_session, export_session_results
from backend.db import db
from unittest.mock import MagicMock, patch

def test_create_session_invalid_json(monkeypatch):
    monkeypatch.setattr("backend.sessions.resolve_teacher_identity", lambda *args: {"email": "t@e.com"})
    
    with pytest.raises(HTTPException) as exc:
        create_session(name="Sess", preferences_json="invalid-json", teacher_model_answer=None, question_paper=None)
    assert exc.value.status_code == 400
    assert "Invalid preferences JSON" in exc.value.detail

def test_export_session_results_no_results(monkeypatch):
    monkeypatch.setattr("backend.sessions.get_authorized_session", lambda *args: {})
    # db.results.find returns empty list
    monkeypatch.setattr(db.results, "find", lambda *args: MagicMock(to_list=lambda: []))
    
    # Actually db.results.find in sessions.py is: list(db.results.find(...))
    # So I should mock find to return an empty list
    monkeypatch.setattr(db.results, "find", lambda *args, **kwargs: [])
    
    with pytest.raises(HTTPException) as exc:
        export_session_results(session_id="sess_1")
    assert exc.value.status_code == 404
    assert "No results found to export" in exc.value.detail

@patch("Engine.reports.exporter.ReportExporter.to_excel_buffer")
def test_export_session_results_xlsx(mock_to_excel, monkeypatch):
    monkeypatch.setattr("backend.sessions.get_authorized_session", lambda *args: {})
    
    mock_results_coll = MagicMock()
    mock_results_coll.find.return_value = [{"student_name": "John"}]
    monkeypatch.setattr(db, "results", mock_results_coll)
    
    mock_to_excel.return_value = MagicMock()
    
    from backend.sessions import export_session_results
    response = export_session_results(session_id="sess_1", format="xlsx")
    assert response.media_type == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

def test_session_status_not_found(monkeypatch):
    monkeypatch.setattr("backend.sessions.get_authorized_session", lambda *args: {})
    mock_sess_coll = MagicMock()
    mock_sess_coll.find_one.return_value = None
    monkeypatch.setattr(db, "sessions", mock_sess_coll)
    
    from backend.sessions import session_status
    res = session_status("sess_1")
    assert res is None

@patch("backend.sessions.save_upload_file")
@patch("backend.sessions.get_text_from_nonOCR_pdf")
def test_create_session_success(mock_get_text, mock_save, monkeypatch):
    monkeypatch.setattr("backend.sessions.resolve_teacher_identity", lambda *args, **kwargs: {"email": "t@e.com", "id": "tid"})
    mock_get_text.return_value = "extracted text"
    
    # Mock db.sessions.insert_one
    mock_sess_coll = MagicMock()
    monkeypatch.setattr(db, "sessions", mock_sess_coll)
    
    # Mock UploadFile
    mock_file = MagicMock(spec=UploadFile)
    
    preferences = {
        "exam_type": "Theory",
        "max_marks": 100,
        "min_answer_length": 50,
        "theory_marks_pct": 50,
        "nlp_confidence_threshold": 0.5
    }
    
    res = create_session(
        name="Session 1",
        teacher_email="t@e.com",
        correction_mode="NLP",
        preferences_json=json.dumps(preferences),
        custom_prompt="Prompt",
        teacher_model_answer=mock_file,
        question_paper=mock_file
    )
    
    assert "session_id" in res
    mock_sess_coll.insert_one.assert_called_once()

def test_get_cheat_report_running(monkeypatch):
    monkeypatch.setattr("backend.sessions.get_authorized_session", lambda *args: {})
    mock_sess_coll = MagicMock()
    mock_sess_coll.find_one.return_value = {"cheat_detection_status": "running", "cheat_detection_last_run": "2026-05-11"}
    monkeypatch.setattr(db, "sessions", mock_sess_coll)
    
    from backend.sessions import get_cheat_report
    res = get_cheat_report("sess_1")
    assert res["status"] == "running"
    assert res["report"] is None

@patch("backend.sessions.set_paper")
@patch("backend.sessions.save_upload_file")
@patch("backend.sessions.get_text_from_nonOCR_pdf")
def test_question_paper_qcp_endpoint(mock_get_text, mock_save, mock_set_paper, monkeypatch):
    mock_get_text.return_value = "docs text"
    mock_set_paper.return_value = {"paper": "content"}
    
    mock_file = MagicMock(spec=UploadFile)
    preferences = {
        "difficulty": "Easy",
        "max_marks": 50,
        "no_of_ques": 5,
        "course": "AI",
        "choice_aval": False,
        "choice_type": "None",
        "custom_prompt": ""
    }
    
    from backend.sessions import question_paper
    res = question_paper(preferences_json=json.dumps(preferences), relevent_docs=mock_file)
    assert res == {"paper": "content"}
