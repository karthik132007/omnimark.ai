from fastapi import BackgroundTasks, FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from Engine.cheat_detection.main import check_cheat
from Engine.grade.nlp import Correct_NLP
from backend import db
from backend.auth import router as auth_router
import shutil
import time
import os
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
def create_session(name: str,mode: str, preferences: dict, teacher_model_answer: str, question_paper: str):
    # create session in mongodb, return session_id
    session_id = "session_" + str(int(time.time())) # simple session id generation
    db.sessions.insert_one({
        "session_id": session_id, "status": "created", "name": name, "mode": mode, "preferences": preferences, "teacher_model_answer": teacher_model_answer, "question_paper": question_paper})
    return {"session_id": session_id}

@app.post("/session/upload/{session_id}")
# save zip file,# create session in mongodb,start worker task,return session_id
def upload_file(session_id: str, file: UploadFile = File(...)):
    #no time ill do later
    pass

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