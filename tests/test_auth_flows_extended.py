from fastapi.testclient import TestClient
import mongomock

from backend import auth
from backend.app import app


client = TestClient(app)


def test_auth_register_login_teacher_crud_and_token(monkeypatch):
    mock_db = mongomock.MongoClient().omnimark
    monkeypatch.setattr(auth, "db", mock_db)

    register = client.post(
        "/auth/univ/register",
        json={"name": "Uni", "email": "Admin@Example.com", "password": "secret123"},
    )
    assert register.status_code == 200
    assert mock_db.users.find_one({"email": "admin@example.com"})["role"] == "university"

    duplicate = client.post(
        "/auth/univ/register",
        json={"name": "Uni", "email": "admin@example.com", "password": "secret123"},
    )
    assert duplicate.status_code == 400

    bad_login = client.post("/auth/login", json={"email": "admin@example.com", "password": "wrong"})
    assert bad_login.status_code == 401

    login = client.post("/auth/login", json={"email": "ADMIN@example.com", "password": "secret123"})
    assert login.status_code == 200
    token = login.json()["access_token"]
    current_user = auth.get_current_user(token)
    assert current_user["email"] == "admin@example.com"
    assert current_user["role"] == "university"

    app.dependency_overrides[auth.get_current_univ] = lambda: {
        "id": current_user["id"],
        "email": "admin@example.com",
        "role": "university",
    }
    try:
        add_teacher = client.post(
            "/univ/teachers",
            json={"name": "Teacher One", "email": "Teacher@Example.com", "password": "teach123"},
        )
        assert add_teacher.status_code == 200
        teacher_id = add_teacher.json()["id"]

        teachers = client.get("/univ/teachers")
        assert teachers.status_code == 200
        assert teachers.json()[0]["email"] == "teacher@example.com"

        update = client.put(f"/univ/teachers/{teacher_id}", json={"name": "Teacher Renamed"})
        assert update.status_code == 200
        assert mock_db.users.find_one({"email": "teacher@example.com"})["name"] == "Teacher Renamed"

        delete = client.delete(f"/univ/teachers/{teacher_id}")
        assert delete.status_code == 200
    finally:
        app.dependency_overrides.clear()


def test_student_login_and_optional_user(monkeypatch):
    mock_db = mongomock.MongoClient().omnimark
    student_password = auth.get_password_hash("student123")
    inserted = mock_db.students.insert_one({"rollnum": 101, "name": "Student", "password": student_password})
    monkeypatch.setattr(auth, "db", mock_db)

    bad = client.post("/auth/student/login", json={"rollnum": 101, "password": "wrong"})
    assert bad.status_code == 401

    response = client.post("/auth/student/login", json={"rollnum": 101, "password": "student123"})
    assert response.status_code == 200
    token = response.json()["access_token"]

    current = auth.get_current_user(token)
    assert current["role"] == "student"
    assert current["rollnum"] == 101
    assert current["id"] == str(inserted.inserted_id)

    assert auth.get_optional_current_user(None) is None
    assert auth.get_optional_current_user("bad-token") is None
