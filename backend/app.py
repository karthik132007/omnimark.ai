from fastapi import FastAPI
from pydantic import BaseModel
from Engine.cheat_detection.main import check_cheat
from Engine.grade.nlp import Correct_NLP
app = FastAPI()
app.title = "Omnimark Ai"

@app.get("/health")
def health_check():
    return {"status": "ok"}




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