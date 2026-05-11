import zipfile

import mongomock
import pytest

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


def test_process_session_llm_and_unknown_mode(tmp_path, monkeypatch):
    mock_db = mongomock.MongoClient().omnimark
    monkeypatch.setattr(work, "db", mock_db)
    monkeypatch.setattr(work, "check_cheat_in_session", lambda _session_id: {"ok": True})
    monkeypatch.setattr(work, "LLM_Grade", lambda **_kwargs: {"total_marks": 9})
    monkeypatch.setattr(work, "get_text_from_nonOCR_pdf", lambda _path: "typed text")

    llm_session = "session_worker_llm"
    mock_db.sessions.insert_one(
        {
            "session_id": llm_session,
            "status": "uploaded",
            "teacher_id": "teacher-id",
            "teacher_email": "teacher@example.com",
            "correction_mode": "LLM",
            "preferences": {"is_handwritten": False, "max_marks": 10},
            "teacher_model_answer": "model answer",
            "question_paper": "paper",
        }
    )
    zip_path = tmp_path / "llm_answers.zip"
    with zipfile.ZipFile(zip_path, "w") as archive:
        archive.writestr("Alice.pdf", b"%PDF fake")

    work.process_session.run(llm_session, str(zip_path))
    assert mock_db.results.count_documents({"session_id": llm_session}) == 1
    assert mock_db.sessions.find_one({"session_id": llm_session})["status"] == "processed"

    unknown_session = "session_worker_unknown"
    mock_db.sessions.insert_one(
        {
            "session_id": unknown_session,
            "status": "uploaded",
            "teacher_id": "teacher-id",
            "teacher_email": "teacher@example.com",
            "correction_mode": "UNKNOWN",
            "preferences": {"is_handwritten": False},
        }
    )
    unknown_zip = tmp_path / "unknown_answers.zip"
    with zipfile.ZipFile(unknown_zip, "w") as archive:
        archive.writestr("Bob.pdf", b"%PDF fake")

    result = work.process_session.run(unknown_session, str(unknown_zip))
    assert result == {"error": "Unknown correction mode: UNKNOWN"}


def test_check_cheat_in_session_exception_and_pdf_fallback(monkeypatch, tmp_path):
    mock_db = mongomock.MongoClient().omnimark
    monkeypatch.setattr(work, "db", mock_db)

    session_id = "cheat_fallback"
    pdf_path = tmp_path / "legacy.pdf"
    pdf_path.write_bytes(b"%PDF fake")
    mock_db.sessions.insert_one({"session_id": session_id, "preferences": {"is_handwritten": False}})
    mock_db.results.insert_many(
        [
            {"session_id": session_id, "student_name": "A", "answer_text": "", "pdf_file": str(pdf_path)},
            {"session_id": session_id, "student_name": "B", "answer_text": "", "pdf_file": str(pdf_path)},
        ]
    )
    monkeypatch.setattr(work, "get_text_from_nonOCR_pdf", lambda _path: "fallback text")
    monkeypatch.setattr(
        work,
        "analyze_session_cheating",
        lambda answers, threshold: {"students": [{"student_name": "A", "risk_level": "Low"}]},
    )
    report = work.check_cheat_in_session.run(session_id)
    assert report["students"][0]["student_name"] == "A"

    err_session = "cheat_error"
    mock_db.sessions.insert_one({"session_id": err_session, "preferences": {"is_handwritten": False}})
    mock_db.results.insert_many(
        [
            {"session_id": err_session, "student_name": "C", "answer_text": "x"},
            {"session_id": err_session, "student_name": "D", "answer_text": "y"},
        ]
    )
    monkeypatch.setattr(work, "analyze_session_cheating", lambda *_args, **_kwargs: (_ for _ in ()).throw(RuntimeError("boom")))
    with pytest.raises(RuntimeError):
        work.check_cheat_in_session.run(err_session)
    assert mock_db.sessions.find_one({"session_id": err_session})["cheat_detection_status"] == "failed"


def test_get_text_from_nonocr_pdf_normalizes_lines(monkeypatch):
    class _FakePage:
        def __init__(self, text):
            self._text = text

        def extract_text(self):
            return self._text

    class _FakeReader:
        def __init__(self, _path):
            self.pages = [
                _FakePage("Title:\\nA\\nB\\n\\n1) Point one\\nWrapped line"),
                _FakePage("Next line\\n"),
            ]

    monkeypatch.setattr(work, "PdfReader", _FakeReader)
    cleaned = work.get_text_from_nonOCR_pdf("dummy.pdf")
    assert "Title:" in cleaned
    assert "1) Point one" in cleaned
    assert "Wrapped line Next line" in cleaned
