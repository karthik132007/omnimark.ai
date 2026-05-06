import json
import os
import uuid
from datetime import datetime, timezone
from Engine.Dashbord_data.eda import get_teacher_stats, get_session_stats
from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from Engine.cheat_detection.main import check_cheat
from Engine.grade.nlp import Correct_NLP
from backend.db import db
from backend.auth import router as auth_router
from backend.schemas import EvaluationPreferences
from backend.worker.files import save_upload_file
from backend.worker.work import (
    check_cheat_in_session,
    get_text_from_nonOCR_pdf,
    process_session,
)

app = FastAPI()
app.title = "Omnimark Ai"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

@app.get("/health")
def health_check():
    return {"status": "ok"}


UPLOAD_FOLDER = "./uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.get("/dashboard/teacher_stats")
def dashboard_teacher_stats(teacher_email: str):
    stats = get_teacher_stats(teacher_email)
    if isinstance(stats, dict):
        return stats
    return stats.fillna(0).to_dict()

@app.get("/session/{session_id}/stats")
def dashboard_session_stats(session_id: str):
    stats = get_session_stats(session_id)
    if isinstance(stats, dict):
        return stats
    return stats.fillna(0).to_dict()

@app.post("/session/create")
def create_session(
    name: str = Form(...),
    teacher_email: str = Form(...),
    correction_mode: str = Form("NLP"),
    preferences_json: str = Form(...),
    custom_prompt: str = Form(""),
    teacher_model_answer: UploadFile = File(...),
    question_paper: UploadFile = File(...),
):
    try:
        preferences_data = json.loads(preferences_json)
        preferences = EvaluationPreferences.model_validate(preferences_data)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Invalid preferences JSON") from exc
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    teacher_model_answer_location = os.path.join(
        UPLOAD_FOLDER, f"{uuid.uuid4().hex}_teacher_model_answer.pdf"
    )
    question_paper_location = os.path.join(
        UPLOAD_FOLDER, f"{uuid.uuid4().hex}_question_paper.pdf"
    )

    save_upload_file(teacher_model_answer, teacher_model_answer_location)
    save_upload_file(question_paper, question_paper_location)

    teacher_model_answer_text = get_text_from_nonOCR_pdf(teacher_model_answer_location)
    question_paper_text = get_text_from_nonOCR_pdf(question_paper_location)

    session_id = f"session_{uuid.uuid4().hex}"
    db.sessions.insert_one(
        {
            "session_id": session_id,
            "status": "created",
            "name": name,
            "teacher_email": teacher_email,
            "correction_mode": correction_mode,
            "preferences": preferences.model_dump(),
            "teacher_model_answer": teacher_model_answer_text,
            "question_paper": question_paper_text,
            "custom_prompt": custom_prompt,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    return {"session_id": session_id}


@app.get("/sessions")
def list_sessions():
    sessions = db.sessions.find(
        {},
        {
            "_id": 0,
            "session_id": 1,
            "name": 1,
            "status": 1,
            "correction_mode": 1,
            "created_at": 1,
        },
    )
    return list(sessions)


@app.get("/session/{session_id}")
def get_session(session_id: str):
    session = db.sessions.find_one({"session_id": session_id}, {"_id": 0})
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@app.delete("/session/{session_id}")
def delete_session(session_id: str):
    session = db.sessions.find_one({"session_id": session_id})
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.sessions.delete_one({"session_id": session_id})
    db.results.delete_many({"session_id": session_id})
    # Optional: could also delete uploaded files if we wanted to
    return {"message": "Session deleted successfully"}


@app.post("/session/{session_id}/upload_zip")
def upload_folder(session_id: str, file: UploadFile = File(...)):
    session = db.sessions.find_one({"session_id": session_id})
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    if not file.filename.lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only .zip files allowed")

    file_location = os.path.join(UPLOAD_FOLDER, f"{session_id}.zip")
    save_upload_file(file, file_location)

    db.sessions.update_one(
        {"session_id": session_id},
        {"$set": {"status": "uploaded", "zip_file": file_location}},
    )
    return {"message": "File uploaded successfully"}


@app.post("/session/{session_id}/process")
def process_session_endpoint(session_id: str, background_tasks: BackgroundTasks):
    session = db.sessions.find_one({"session_id": session_id})
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.get("status") != "uploaded":
        raise HTTPException(status_code=400, detail="Session not ready for processing")
    db.sessions.update_one(
        {"session_id": session_id},
        {"$set": {"status": "processing"}},
    )
    background_tasks.add_task(process_session, session_id, session.get("zip_file"))
    return {"message": "Session processing started"}


@app.get("/session/{session_id}/status")
def session_status(session_id: str):
    session = db.sessions.find_one(
        {"session_id": session_id},
        {"_id": 0, "status": 1, "total_files": 1, "processed": 1},
    )
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@app.get("/session/{session_id}/results")
def get_session_results(session_id: str):
    session = db.sessions.find_one({"session_id": session_id}, {"_id": 0})
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    results = list(db.results.find({"session_id": session_id}, {"_id": 0}))
    return results


@app.post("/session/{session_id}/cheat_detection")
def detect_cheat(session_id: str, background_tasks: BackgroundTasks):
    session = db.sessions.find_one({"session_id": session_id})
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.get("status") != "processed":
        raise HTTPException(status_code=400, detail="Session not in processed state")
    background_tasks.add_task(check_cheat_in_session, session_id)
    return {"message": "Cheat detection started"}


#===================== dont touch below code! =========================
"""
    Test purpose #? written by Kathik - denni kelakadhu - idhi working
"""
@app.post("/test/nlp")
def test_nlp(teacher_answer: str,student_answer: str,prefrences: dict):
    result =Correct_NLP(Student_Response=student_answer,Teacher_model_answer=teacher_answer,preferences=prefrences,key_points=None)
    return result

@app.post("/test/cheat_sim")
def test_cheat_sim(student1: str, student2: str):
    result = check_cheat(student1, student2)
    return result

@app.post("/test/llm")
def test_llm(question_paper: str, teacher_model_answer: str, student_answer: str, preferences: dict):
    from Engine.grade.llm import LLM_Grade
    result = LLM_Grade(question_paper, teacher_model_answer, student_answer, preferences)
    return result