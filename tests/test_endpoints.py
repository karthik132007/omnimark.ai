from fastapi.testclient import TestClient
import mongomock

from backend import app as app_module
from backend import analytics, utils
from Engine.Dashbord_data import eda


client = TestClient(app_module.app)


def test_teacher_stats(monkeypatch):
    mock_db = mongomock.MongoClient().omnimark
    mock_db.users.insert_one({"email": "test@teacher.com", "role": "teacher"})
    mock_db.sessions.insert_many(
        [
            {
                "session_id": "test_session_123",
                "teacher_email": "test@teacher.com",
                "teacher_email_normalized": "test@teacher.com",
                "marks": [85, 90, 78, 92, 88, 65, 100],
            },
            {
                "session_id": "test_session_456",
                "teacher_email": "test@teacher.com",
                "teacher_email_normalized": "test@teacher.com",
                "marks": [70, 75, 80],
            },
        ]
    )
    for m in [utils, eda]:
        monkeypatch.setattr(m, "db", mock_db)

    response = client.get("/dashboard/teacher_stats", params={"teacher_email": "test@teacher.com"})

    assert response.status_code == 200


def test_session_stats(monkeypatch):
    monkeypatch.setattr(analytics, "get_authorized_session", lambda *_args, **_kwargs: {"session_id": "test_session_123"})
    monkeypatch.setattr(analytics, "get_session_stats", lambda *_args, **_kwargs: {"count": {"marks": 7}})

    response = client.get("/session/test_session_123/stats")

    assert response.status_code == 200


def test_teacher_stats_empty(monkeypatch):
    mock_db = mongomock.MongoClient().omnimark
    mock_db.users.insert_one({"email": "new@teacher.com", "role": "teacher"})
    for m in [utils, eda]:
        monkeypatch.setattr(m, "db", mock_db)

    response = client.get("/dashboard/teacher_stats", params={"teacher_email": "new@teacher.com"})

    assert response.status_code == 200


def test_session_stats_empty(monkeypatch):
    mock_db = mongomock.MongoClient().omnimark
    for m in [utils]:
        monkeypatch.setattr(m, "db", mock_db)

    response = client.get("/session/invalid_session/stats")

    assert response.status_code == 404
