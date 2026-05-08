import pandas as pd
from pymongo import MongoClient
import sys

client = MongoClient("mongodb://localhost:27017")
db = client["omnimark"]

dummy_session1 = {
    "session_id": "test_session_123",
    "teacher_email": "test@teacher.com",
    "marks": [85, 90, 78, 92, 88, 65, 100]
}
dummy_session2 = {
    "session_id": "test_session_456",
    "teacher_email": "test@teacher.com",
    "marks": [70, 75, 80]
}

db.sessions.insert_many([dummy_session1, dummy_session2])
print("Inserted data.")

sys.path.append("/home/electron/Documents/GitHub/omnimark.ai")
from Engine.Dashbord_data.eda import get_teacher_stats, get_session_stats

try:
    print("Teacher Stats:")
    print(get_teacher_stats("test@teacher.com"))
except Exception as e:
    print("Error teacher stats:", type(e).__name__, getattr(e, "message", str(e)))

try:
    print("\nSession Stats:")
    print(get_session_stats("test_session_123"))
except Exception as e:
    print("Error session stats:", type(e).__name__, getattr(e, "message", str(e)))

db.sessions.delete_many({"teacher_email": "test@teacher.com"})
print("Cleaned up data.")
