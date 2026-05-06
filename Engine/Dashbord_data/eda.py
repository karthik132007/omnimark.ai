#this code id to genrate stats(like avg mark, higest, low, over time reports, etc.) for the dashboard
# input is teacher email for full stats and session id for session stats
from backend.db import db
import pandas as pd

def get_teacher_stats(teacher_email):
    sessions = db.sessions.find({"teacher_email": teacher_email})
    sessions_list = list(sessions)
    for session in sessions_list:
        session_id = session["session_id"]
        marks = db.results.find({"session_id": session_id}).distinct("marks")
        session["avg_marks"] = sum(marks) / len(marks) if marks else 0
        session["max_marks"] = max(marks) if marks else 0
        session["min_marks"] = min(marks) if marks else 0
    if not sessions_list:
        return {}
    df = pd.DataFrame(sessions_list)
    return df.describe()

def get_session_stats(session_id):
    session = db.sessions.find_one({"session_id": session_id})
    if session is None:
        return {"error": "Session not found"}
    # Assuming session has a field 'marks' which is a list of marks for that session
    marks = db.results.find({"session_id": session_id}).distinct("marks")
    if not marks:
        return {}
    df = pd.DataFrame(marks, columns=["marks"])
    return df.describe()