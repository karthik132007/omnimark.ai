#this code id to genrate stats(like avg mark, higest, low, over time reports, etc.) for the dashboard
# input is teacher email for full stats and session id for session stats
from backend.db import db
import pandas as pd
from collections import Counter
from datetime import datetime
import re

def _teacher_session_filter(teacher_email, teacher_id=None):
    email = str(teacher_email or "").strip().lower()
    clauses = []
    if teacher_id:
        clauses.append({"teacher_id": str(teacher_id)})
    if email:
        clauses.extend([
            {"teacher_email_normalized": email},
            {"teacher_email": email},
            {"teacher_email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}},
        ])
    return {"$or": clauses} if clauses else {"_id": None}

def get_teacher_stats(teacher_email, teacher_id=None):
    sessions = db.sessions.find(_teacher_session_filter(teacher_email, teacher_id))
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

def _get_result_marks(result):
    if not isinstance(result, dict):
        return 0
    if isinstance(result.get("marks"), (int, float)):
        return float(result.get("marks", 0))
    if isinstance(result.get("total_marks"), (int, float)):
        return float(result.get("total_marks", 0))
    marks = result.get("marks")
    if isinstance(marks, dict):
        return float(sum(value for value in marks.values() if isinstance(value, (int, float))))
    return 0

def _created_sort_value(session):
    created_at = session.get("created_at", "")
    if not created_at:
        return datetime.min
    try:
        return datetime.fromisoformat(created_at.replace("Z", "+00:00")).replace(tzinfo=None)
    except ValueError:
        return datetime.min

def _collect_mistakes(result, counter):
    if not isinstance(result, dict):
        counter["Result could not be read"] += 1
        return

    if result.get("similarity", 1) < 0.55:
        counter["Low answer similarity"] += 1
    if result.get("keyword_score", 1) < 0.5:
        counter["Missing key points"] += 1
    if result.get("length_score", 1) < 0.75:
        counter["Answers too short"] += 1

    other_info = result.get("other_info")
    if isinstance(other_info, dict):
        for weakness in other_info.get("weaknesses", []) or []:
            counter[str(weakness).strip()[:80] or "Weak concept coverage"] += 1
        if other_info.get("ocr_issue_detected"):
            counter["OCR quality issue"] += 1

    feedback = result.get("question_feedback")
    if isinstance(feedback, dict):
        weak_words = ("missing", "incorrect", "weak", "incomplete", "partial", "poor", "not explained")
        for question, text in feedback.items():
            lowered = str(text).lower()
            if any(word in lowered for word in weak_words):
                counter[f"Gap in {question}"] += 1

    if result.get("error"):
        counter["Evaluation error"] += 1

def get_teacher_dashboard_summary(teacher_email, teacher_id=None):
    sessions = list(db.sessions.find(_teacher_session_filter(teacher_email, teacher_id), {"_id": 0}))
    if not sessions:
        return {
            "metrics": {
                "total_sessions": 0,
                "processed_sessions": 0,
                "total_submissions": 0,
                "average_marks": 0,
                "highest_marks": 0,
                "lowest_marks": 0,
            },
            "trend": [],
            "common_mistakes": [],
            "toppers": [],
            "score_distribution": [],
            "risk_bands": [],
        }

    mistake_counter = Counter()
    all_scores = []
    toppers = []
    trend = []
    bins = Counter({"0-40": 0, "41-60": 0, "61-80": 0, "81-100": 0})
    risk_bands = Counter({"At risk": 0, "Needs support": 0, "On track": 0, "Excellent": 0})

    for session in sorted(sessions, key=_created_sort_value):
        session_id = session.get("session_id")
        results = list(db.results.find({"session_id": session_id}, {"_id": 0}))
        max_marks = float(session.get("preferences", {}).get("max_marks") or 100)
        session_scores = []

        for row in results:
            result = row.get("result", {})
            marks = _get_result_marks(result)
            percentage = round((marks / max(max_marks, 1)) * 100, 2)
            session_scores.append(marks)
            all_scores.append(marks)
            _collect_mistakes(result, mistake_counter)

            if percentage <= 40:
                bins["0-40"] += 1
                risk_bands["At risk"] += 1
            elif percentage <= 60:
                bins["41-60"] += 1
                risk_bands["Needs support"] += 1
            elif percentage <= 80:
                bins["61-80"] += 1
                risk_bands["On track"] += 1
            else:
                bins["81-100"] += 1
                risk_bands["Excellent"] += 1

            toppers.append({
                "student_name": row.get("student_name", "Unknown student"),
                "session_name": session.get("name", "Untitled session"),
                "marks": round(marks, 2),
                "max_marks": max_marks,
                "percentage": percentage,
            })

        trend.append({
            "session_id": session_id,
            "name": session.get("name", "Untitled session"),
            "date": session.get("created_at", ""),
            "average_marks": round(sum(session_scores) / len(session_scores), 2) if session_scores else 0,
            "submissions": len(session_scores),
        })

    return {
        "metrics": {
            "total_sessions": len(sessions),
            "processed_sessions": sum(1 for session in sessions if session.get("status") == "processed"),
            "total_submissions": len(all_scores),
            "average_marks": round(sum(all_scores) / len(all_scores), 2) if all_scores else 0,
            "highest_marks": round(max(all_scores), 2) if all_scores else 0,
            "lowest_marks": round(min(all_scores), 2) if all_scores else 0,
        },
        "trend": trend,
        "common_mistakes": [
            {"name": name, "count": count}
            for name, count in mistake_counter.most_common(6)
        ],
        "toppers": sorted(toppers, key=lambda row: row["percentage"], reverse=True)[:5],
        "score_distribution": [
            {"range": name, "students": bins[name]}
            for name in ["0-40", "41-60", "61-80", "81-100"]
        ],
        "risk_bands": [
            {"name": name, "students": risk_bands[name]}
            for name in ["At risk", "Needs support", "On track", "Excellent"]
        ],
    }
