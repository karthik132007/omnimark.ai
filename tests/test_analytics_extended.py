import pytest
from fastapi.testclient import TestClient
from backend.app import app
from backend import analytics
from unittest.mock import MagicMock

client = TestClient(app)

def test_dashboard_teacher_stats_dict_return(monkeypatch):
    # Mock resolve_teacher_identity
    monkeypatch.setattr("backend.analytics.resolve_teacher_identity", lambda *args: {"email": "t@e.com"})
    # Mock get_teacher_stats to return a dict directly
    monkeypatch.setattr("backend.analytics.get_teacher_stats", lambda email, tid: {"avg": 80})
    
    response = client.get("/dashboard/teacher_stats", params={"teacher_email": "t@e.com"})
    assert response.status_code == 200
    assert response.json() == {"avg": 80}

def test_omi_analyze_exception(monkeypatch):
    monkeypatch.setattr("backend.analytics.resolve_teacher_identity", lambda *args: {"email": "t@e.com"})
    monkeypatch.setattr("backend.analytics.get_teacher_dashboard_summary", lambda email, tid: {})
    
    def mock_explain_stats(data):
        raise Exception("Omi went offline")
    
    monkeypatch.setattr("backend.analytics.explain_stats", mock_explain_stats)
    
    response = client.get("/omi/analyze", params={"teacher_email": "t@e.com"})
    assert response.status_code == 200
    assert "error" in response.json()
    assert response.json()["raw"] == "Omi went offline"

def test_dashboard_session_stats_dict_return(monkeypatch):
    monkeypatch.setattr("backend.analytics.get_authorized_session", lambda *args: {})
    # Mock get_session_stats to return a dict
    monkeypatch.setattr("backend.analytics.get_session_stats", lambda sid: {"session_avg": 75})
    
    response = client.get("/session/sess_123/stats")
    assert response.status_code == 200
    assert response.json() == {"session_avg": 75}
