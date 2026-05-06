import sys
from unittest.mock import patch
sys.path.append("/home/electron/Documents/GitHub/omnimark.ai")

from backend.app import app
from Engine.Dashbord_data.eda import get_teacher_stats, get_session_stats

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
def test_teacher_stats_data(mock_find):
    mock_find.return_value = mock_sessions
    stats = get_teacher_stats("test@teacher.com")
    print("Teacher Stats (With Data):\n", stats)
    if not isinstance(stats, dict):
        print("To Dict:", stats.fillna(0).to_dict())

@patch('backend.db.db.sessions.find_one')
def test_session_stats_data(mock_find_one):
    mock_find_one.return_value = mock_sessions[0]
    stats = get_session_stats("test_session_123")
    print("\nSession Stats (With Data):\n", stats)
    if not isinstance(stats, dict):
        print("To Dict:", stats.fillna(0).to_dict())

@patch('backend.db.db.sessions.find')
def test_teacher_stats_empty(mock_find):
    mock_find.return_value = []
    stats = get_teacher_stats("new@teacher.com")
    print("\nTeacher Stats (Empty):\n", stats)

@patch('backend.db.db.sessions.find_one')
def test_session_stats_empty(mock_find_one):
    mock_find_one.return_value = None
    stats = get_session_stats("invalid_session")
    print("\nSession Stats (Not Found):\n", stats)

if __name__ == "__main__":
    test_teacher_stats_data()
    test_session_stats_data()
    test_teacher_stats_empty()
    test_session_stats_empty()
