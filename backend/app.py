from fastapi import BackgroundTasks, FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from Engine.cheat_detection.main import check_cheat
from Engine.grade.nlp import Correct_NLP
from backend.db import db
from backend.auth import router as auth_router
import shutil
import time
import os
import uuid

from worker.work import process_session, check_cheat_in_session
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


@app.post("/session/create")
def create_session(name: str,mode: str, preferences: dict, teacher_model_answer: str, question_paper: str,custom_prompt: str):
    # create session in mongodb, return session_id
    session_id = f"session_{uuid.uuid4().hex}"
    db.sessions.insert_one({
        "session_id": session_id, "status": "created", "name": name, "mode": mode, "preferences": preferences, "teacher_model_answer": teacher_model_answer, "question_paper": question_paper, "custom_prompt": custom_prompt})
    return {"session_id": session_id}

UPLOAD_FOLDER = './uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.post("/session/{session_id}/upload_zip")
def upload_folder(session_id: str,background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    #no time ill do later
    session = db.sessions.find_one({"session_id": session_id})
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    if not file.filename.lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only .zip files allowed")
    file_location = os.path.join(UPLOAD_FOLDER, f"{session_id}.zip")
    with open(file_location, "wb") as f:
        shutil.copyfileobj(file.file, f)

    db.sessions.update_one(
        {"session_id": session_id},
        {
            "$set": {
                "status": "processing",
                "zip_file": file_location
            }
        }
    )
    # background_tasks.add_task(process_session, session_id)
    return{
        "message": "File uploaded successfully"
    }

@app.post("/session/{session_id}/process")
def process_session_endpoint(session_id: str, background_tasks: BackgroundTasks):
    session = db.sessions.find_one({"session_id": session_id})
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.get("status") != "processing":
        raise HTTPException(status_code=400, detail="Session not in processing state")
    background_tasks.add_task(process_session, session_id, session.get("zip_file"))
    return {
        "message": "Session processing started"
    }



@app.post("/session/{session_id}/cheat_detection")
def detect_cheat(session_id: str, background_tasks: BackgroundTasks):
    session = db.sessions.find_one({"session_id": session_id})
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.get("status") != "processed":
        raise HTTPException(status_code=400, detail="Session not in processed state")
    background_tasks.add_task(check_cheat_in_session, session_id)
    return {
        "message": "Cheat detection started"
    }

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
    from Engine.grade.llm import Correct_LLM
    result = Correct_LLM(question_paper, teacher_model_answer, student_answer, preferences)
    return result