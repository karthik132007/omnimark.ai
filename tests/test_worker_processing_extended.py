import zipfile

import mongomock

from backend.worker import work


def test_worker_helpers_and_process_session(tmp_path, monkeypatch):
    mock_db = mongomock.MongoClient().omnimark
    session_id = "session_worker_1"
    mock_db.sessions.insert_one(
        {
            "session_id": session_id,
            "status": "uploaded",
            "teacher_id": "teacher-id",
            "teacher_email": "teacher@example.com",
            "correction_mode": "NLP",
            "preferences": {"is_handwritten": False, "max_marks": 10},
            "teacher_model_answer": "answer key",
            "question_paper": "paper",
        }
    )
    zip_path = tmp_path / "answers.zip"
    with zipfile.ZipFile(zip_path, "w") as archive:
        archive.writestr("Alice.pdf", b"%PDF fake")
        archive.writestr("nested/Bob.pdf", b"%PDF fake")

    monkeypatch.setattr(work, "db", mock_db)
    monkeypatch.setattr(work, "get_text_from_nonOCR_pdf", lambda path: f"text from {path}")
    monkeypatch.setattr(work, "Correct_NLP", lambda **_kwargs: {"total_marks": 7, "marks": 7})
    monkeypatch.setattr(work, "check_cheat_in_session", lambda _session_id: {"ok": True})

    assert work._extract_total_marks({"marks": {"q1": 2, "q2": 3}}) is None
    assert work._extract_total_marks({"total_marks": 8}) == 8

    pdfs = work.unzip(str(zip_path))
    assert len(pdfs) == 2

    work.process_session.run(session_id, str(zip_path))

    session = mock_db.sessions.find_one({"session_id": session_id})
    assert session["status"] == "processed"
    assert session["processed"] == 2
    assert sorted(session["student_rollnums"]) == [1, 2]
    assert mock_db.results.count_documents({"session_id": session_id}) == 2
    assert mock_db.classroom_students.count_documents({"teacher_email": "teacher@example.com"}) == 2


def test_check_cheat_in_session_paths(monkeypatch):
    mock_db = mongomock.MongoClient().omnimark
    monkeypatch.setattr(work, "db", mock_db)

    assert work.check_cheat_in_session.run("missing") == {"error": "Session not found"}

    mock_db.sessions.insert_one({"session_id": "one", "preferences": {"is_handwritten": False}})
    mock_db.results.insert_one({"session_id": "one", "student_name": "Only", "answer_text": "solo"})
    one_report = work.check_cheat_in_session.run("one")
    assert one_report["total_students"] == 1
    assert mock_db.sessions.find_one({"session_id": "one"})["cheat_detection_status"] == "completed"

    mock_db.sessions.insert_one({"session_id": "many", "preferences": {"is_handwritten": False}})
    mock_db.results.insert_many(
        [
            {"session_id": "many", "student_name": "A", "answer_text": "same answer"},
            {"session_id": "many", "student_name": "B", "answer_text": "same answer"},
        ]
    )
    monkeypatch.setattr(
        work,
        "analyze_session_cheating",
        lambda answers, threshold: {
            "students": [
                {
                    "student_name": "A",
                    "risk_level": "High",
                    "risk_score": 0.9,
                    "max_pair_score": 0.9,
                    "flagged_pairs": 1,
                    "matched_with": ["B"],
                    "cluster_id": 1,
                    "cluster_size": 2,
                }
            ]
        },
    )
    many_report = work.check_cheat_in_session.run("many")
    assert many_report["students"][0]["student_name"] == "A"
    assert mock_db.results.find_one({"student_name": "A"})["cheat_detection"]["risk_level"] == "High"
