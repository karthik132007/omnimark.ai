import mongomock

from Engine.Dashbord_data import eda


def test_teacher_dashboard_summary_with_results(monkeypatch):
    mock_db = mongomock.MongoClient().omnimark
    mock_db.sessions.insert_many(
        [
            {
                "session_id": "summary_1",
                "name": "Midterm",
                "status": "processed",
                "teacher_email": "teacher@example.com",
                "teacher_email_normalized": "teacher@example.com",
                "preferences": {"max_marks": 10},
                "created_at": "2026-05-09T00:00:00+00:00",
            },
            {
                "session_id": "summary_2",
                "name": "Final",
                "status": "created",
                "teacher_email": "teacher@example.com",
                "teacher_email_normalized": "teacher@example.com",
                "preferences": {"max_marks": 20},
                "created_at": "2026-05-10T00:00:00+00:00",
            },
        ]
    )
    mock_db.results.insert_many(
        [
            {
                "session_id": "summary_1",
                "student_name": "A",
                "result": {
                    "total_marks": 3,
                    "similarity": 0.4,
                    "keyword_score": 0.3,
                    "length_score": 0.5,
                    "other_info": {"weaknesses": ["Missed definitions"], "ocr_issue_detected": True},
                    "question_feedback": {"Q1": "missing example"},
                },
            },
            {
                "session_id": "summary_1",
                "student_name": "B",
                "result": {"total_marks": 8, "other_info": {"strengths": ["Good examples"]}},
            },
            {
                "session_id": "summary_2",
                "student_name": "C",
                "result": {"marks": {"q1": 5, "q2": 7}},
            },
        ]
    )
    monkeypatch.setattr(eda, "db", mock_db)

    summary = eda.get_teacher_dashboard_summary("teacher@example.com")

    assert summary["metrics"]["total_sessions"] == 2
    assert summary["metrics"]["processed_sessions"] == 1
    assert summary["metrics"]["total_submissions"] == 3
    assert summary["metrics"]["highest_marks"] == 12
    assert summary["trend"][0]["name"] == "Midterm"
    assert summary["trend"][0]["submissions"] == 2
    assert summary["toppers"][0]["student_name"] == "B"
    assert sum(item["students"] for item in summary["score_distribution"]) == 3


def test_teacher_dashboard_summary_empty(monkeypatch):
    mock_db = mongomock.MongoClient().omnimark
    monkeypatch.setattr(eda, "db", mock_db)

    summary = eda.get_teacher_dashboard_summary("missing@example.com")

    assert summary["metrics"]["total_sessions"] == 0
    assert summary["trend"] == []
