import io
import zipfile

from fastapi.testclient import TestClient
import mongomock

from backend import app as app_module
from backend import auth as auth_module


client = TestClient(app_module.app)


def _zip_bytes(filename="student_one.pdf", content=b"%PDF-1.4 fake"):
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, "w") as archive:
        archive.writestr(filename, content)
    stream.seek(0)
    return stream


def test_session_lifecycle_routes(monkeypatch):
    mock_db = mongomock.MongoClient().omnimark
    session_id = "session_route_1"
    mock_db.sessions.insert_one(
        {
            "session_id": session_id,
            "name": "Route Test",
            "status": "created",
            "teacher_email": "teacher@example.com",
            "teacher_email_normalized": "teacher@example.com",
            "teacher_id": "teacher-id",
            "created_at": "2026-05-10T00:00:00+00:00",
            "preferences": {"max_marks": 10},
        }
    )
    mock_db.results.insert_one(
        {
            "session_id": session_id,
            "student_name": "Student One",
            "student_rollnum": 1,
            "answer_text": "answer",
            "result": {"total_marks": 8},
        }
    )
    monkeypatch.setattr(app_module, "db", mock_db)
    monkeypatch.setattr(app_module.process_session, "delay", lambda *_args, **_kwargs: "queued")

    listed = client.get("/sessions", params={"teacher_email": "teacher@example.com"})
    assert listed.status_code == 200
    assert listed.json()["items"][0]["session_id"] == session_id

    detail = client.get(f"/session/{session_id}", params={"teacher_email": "teacher@example.com"})
    assert detail.status_code == 200
    assert detail.json()["name"] == "Route Test"

    upload = client.post(
        f"/session/{session_id}/upload_zip",
        data={"teacher_email": "teacher@example.com"},
        files={"file": ("answers.zip", _zip_bytes(), "application/zip")},
    )
    assert upload.status_code == 200
    assert mock_db.sessions.find_one({"session_id": session_id})["status"] == "uploaded"

    process = client.post(f"/session/{session_id}/process", data={"teacher_email": "teacher@example.com"})
    assert process.status_code == 200
    assert mock_db.sessions.find_one({"session_id": session_id})["status"] == "processing"

    status = client.get(f"/session/{session_id}/status", params={"teacher_email": "teacher@example.com"})
    assert status.status_code == 200

    results = client.get(f"/session/{session_id}/results", params={"teacher_email": "teacher@example.com"})
    assert results.status_code == 200
    assert results.json()[0]["student_name"] == "Student One"

    deleted = client.delete(f"/session/{session_id}", params={"teacher_email": "teacher@example.com"})
    assert deleted.status_code == 200
    assert mock_db.sessions.find_one({"session_id": session_id}) is None


def test_student_and_reevaluation_routes(monkeypatch):
    mock_db = mongomock.MongoClient().omnimark
    session_id = "session_route_2"
    mock_db.users.insert_one({"_id": mongomock.ObjectId(), "email": "teacher@example.com", "role": "teacher"})
    mock_db.sessions.insert_one(
        {
            "session_id": session_id,
            "name": "Processed",
            "status": "processed",
            "teacher_email": "teacher@example.com",
            "teacher_email_normalized": "teacher@example.com",
            "preferences": {"max_marks": 10},
            "teacher_model_answer": "key",
            "question_paper": "paper",
        }
    )
    mock_db.students.insert_one({"rollnum": 7, "name": "Student Seven", "name_key": "student seven"})
    mock_db.classroom_students.insert_one(
        {
            "teacher_email": "teacher@example.com",
            "rollnum": 7,
            "name": "Student Seven",
            "name_key": "student seven",
            "history": [],
        }
    )
    mock_db.results.insert_one(
        {
            "session_id": session_id,
            "student_name": "Student Seven",
            "student_rollnum": 7,
            "answer_text": "answer",
            "result": {"total_marks": 6},
        }
    )
    monkeypatch.setattr(app_module, "db", mock_db)
    monkeypatch.setattr(auth_module, "db", mock_db)
    monkeypatch.setattr(app_module, "_perform_reevaluation", lambda *_args, **_kwargs: {"total_marks": 8})
    class _CheatTask:
        @staticmethod
        def delay(_session_id):
            return "queued"

        def __call__(self, _session_id):
            return {"summary": {"pairs_flagged": 0}}

    monkeypatch.setattr(app_module, "check_cheat_in_session", _CheatTask())

    student_id = str(mock_db.students.find_one({"rollnum": 7})["_id"])
    student_token = auth_module.create_access_token(
        data={"sub": "student:7", "role": "student", "id": student_id, "rollnum": 7}
    )
    other_inserted = mock_db.students.insert_one({"rollnum": 8, "name": "Student Eight", "name_key": "student eight"})
    other_student_token = auth_module.create_access_token(
        data={"sub": "student:8", "role": "student", "id": str(other_inserted.inserted_id), "rollnum": 8}
    )
    student_headers = {"Authorization": f"Bearer {student_token}"}
    other_student_headers = {"Authorization": f"Bearer {other_student_token}"}

    assert client.get("/teacher/my-class", params={"teacher_email": "teacher@example.com"}).status_code == 200
    assert client.get("/teacher/my-class/7", params={"teacher_email": "teacher@example.com"}).status_code == 200
    assert client.get("/student/7/results", headers=student_headers).status_code == 200
    assert client.get("/student/7/results").status_code == 401
    assert client.get("/student/7/results", headers=other_student_headers).status_code == 403

    request = client.post(
        "/student/7/request-reevaluation",
        data={"session_id": session_id, "reason": "Please check again"},
        headers=student_headers,
    )
    assert request.status_code == 200
    request_id = request.json()["request"]["request_id"]

    list_requests = client.get("/teacher/reevaluation-requests", params={"teacher_email": "teacher@example.com"})
    assert list_requests.status_code == 200
    assert list_requests.json()["items"][0]["status"] == "pending"

    approve = client.post(
        f"/teacher/reevaluation-requests/{request_id}/approve",
        data={"teacher_email": "teacher@example.com"},
    )
    assert approve.status_code == 200

    second_request = client.post(
        "/student/7/request-reevaluation",
        data={"session_id": session_id, "reason": "Still concerned"},
        headers=student_headers,
    ).json()["request"]["request_id"]
    reject = client.post(
        f"/teacher/reevaluation-requests/{second_request}/reject",
        data={"teacher_email": "teacher@example.com", "reason": "No change"},
    )
    assert reject.status_code == 200

    direct = client.post(
        f"/session/{session_id}/student/Student Seven/reevaluate",
        data={"teacher_email": "teacher@example.com"},
    )
    assert direct.status_code == 200

    cheat = client.post(f"/session/{session_id}/cheat_detection", data={"teacher_email": "teacher@example.com"})
    assert cheat.status_code == 200
    report = client.get(f"/session/{session_id}/cheat_report", params={"teacher_email": "teacher@example.com"})
    assert report.status_code == 200

    # Edge case: Unauthorized access
    unauth = client.get(f"/session/{session_id}", params={"teacher_email": "wrong@example.com"})
    assert unauth.status_code == 403

    # Edge case: Rejecting already approved request
    already_approved = client.post(
        f"/teacher/reevaluation-requests/{request_id}/reject",
        data={"teacher_email": "teacher@example.com", "reason": "Should fail"},
    )
    assert already_approved.status_code == 400
    
    # Edge case: Approving already rejected request
    already_rejected = client.post(
        f"/teacher/reevaluation-requests/{second_request}/approve",
        data={"teacher_email": "teacher@example.com"},
    )
    assert already_rejected.status_code == 400
