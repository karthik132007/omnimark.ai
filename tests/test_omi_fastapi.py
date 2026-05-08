from fastapi.testclient import TestClient
from backend.app import app

client = TestClient(app)
response = client.get("/omi/analyze?teacher_email=t1@test.in")
print("Status Code:", response.status_code)
print("Response JSON:", response.json())
