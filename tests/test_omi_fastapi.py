from fastapi.testclient import TestClient
import mongomock

from backend import app as app_module
from backend import analytics, utils


client = TestClient(app_module.app)


def test_omi_analyze_route_returns_json(monkeypatch):
    mock_db = mongomock.MongoClient().omnimark
    mock_db.users.insert_one({"email": "t1@test.in", "role": "teacher"})

    for m in [utils]:
        monkeypatch.setattr(m, "db", mock_db)
        
    monkeypatch.setattr(
        analytics,
        "get_teacher_dashboard_summary",
        lambda *_args, **_kwargs: {"total_sessions": 1, "avg_score": 80},
    )
    monkeypatch.setattr(
        analytics,
        "explain_stats",
        lambda stats: '{"insights": ["ok"], "summary": "done"}',
    )

    response = client.get("/omi/analyze", params={"teacher_email": "t1@test.in"})

    assert response.status_code == 200
    data = response.json()
    assert data["insights"] == ["ok"]
    assert data["summary"] == "done"
