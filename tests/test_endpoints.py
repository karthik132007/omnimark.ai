from fastapi.testclient import TestClient
from unittest.mock import patch
from backend.app import app

client = TestClient(app)

# Dummy sessions to return for the teacher
mock_sessions = [
    {
        "session_id": "test_session_123",
        "teacher_email": "test@teacher.com",
        "marks": [85, 90, 78, 92, 88, 65, 100]
    },
    {
        "session_id": "test_session_456",
        "teacher_email": "test@teacher.com",
        "marks": [70, 75, 80]
    }
]

@patch('backend.db.db.sessions.find')
def test_teacher_stats(mock_find):
    mock_find.return_value = mock_sessions
    response = client.get("/dashboard/teacher_stats?teacher_email=test@teacher.com")
    print("Teacher Stats Status:", response.status_code)
    print("Teacher Stats JSON:", response.json())
    assert response.status_code == 200

@patch('backend.app.get_session_stats')
@patch('backend.app.get_authorized_session')
def test_session_stats(mock_get_authorized_session, mock_get_session_stats):
    mock_get_authorized_session.return_value = mock_sessions[0]
    mock_get_session_stats.return_value = {"count": {"marks": 7}}
    response = client.get("/session/test_session_123/stats")
    print("\nSession Stats Status:", response.status_code)
    print("Session Stats JSON:", response.json())
    assert response.status_code == 200
    
@patch('backend.db.db.sessions.find')
def test_teacher_stats_empty(mock_find):
    mock_find.return_value = []
    response = client.get("/dashboard/teacher_stats?teacher_email=new@teacher.com")
    print("\nTeacher Stats (Empty) Status:", response.status_code)
    print("Teacher Stats (Empty) JSON:", response.json())
    assert response.status_code == 200

@patch('backend.app.db.sessions.find_one')
def test_session_stats_empty(mock_find_one):
    mock_find_one.return_value = None
    response = client.get("/session/invalid_session/stats")
    print("\nSession Stats (Not Found) Status:", response.status_code)
    print("Session Stats (Not Found) JSON:", response.json())
    assert response.status_code == 404

if __name__ == "__main__":
    test_teacher_stats()
    test_session_stats()
    test_teacher_stats_empty()
    test_session_stats_empty()
