import mongomock

from Engine.Dashbord_data import eda


def test_teacher_stats_data(monkeypatch):
    mock_db = mongomock.MongoClient().omnimark
    mock_db.sessions.insert_many([
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
    ])
    monkeypatch.setattr(eda, "db", mock_db)

    stats = eda.get_teacher_stats("test@teacher.com")

    assert stats is not None
    assert "avg_marks" in stats.columns


def test_session_stats_data(monkeypatch):
    mock_db = mongomock.MongoClient().omnimark
    mock_db.sessions.insert_one(
        {
            "session_id": "test_session_123",
            "teacher_email": "test@teacher.com",
            "marks": [85, 90, 78, 92, 88, 65, 100],
        }
    )
    monkeypatch.setattr(eda, "db", mock_db)

    stats = eda.get_session_stats("test_session_123")

    assert stats is not None
    assert "marks" in stats.columns


def test_teacher_stats_empty(monkeypatch):
    mock_db = mongomock.MongoClient().omnimark
    monkeypatch.setattr(eda, "db", mock_db)

    stats = eda.get_teacher_stats("new@teacher.com")

    assert stats == {}


def test_session_stats_empty(monkeypatch):
    mock_db = mongomock.MongoClient().omnimark
    monkeypatch.setattr(eda, "db", mock_db)

    stats = eda.get_session_stats("invalid_session")

    assert stats == {"error": "Session not found"}
