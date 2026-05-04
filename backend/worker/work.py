import os
import zipfile
from backend.db import db
from Engine.OCR.ocr import extract_text_from_pdf
from Engine.grade.nlp import Correct_NLP
from Engine.grade.llm import LLM_Grade
from PyPDF2 import PdfReader
def unzip(path):
    folder = path.replace(".zip", "")
    os.makedirs(folder, exist_ok=True)
    with zipfile.ZipFile(path, 'r') as zip_ref:
        zip_ref.extractall(folder)
    pdf_files = []
    for root, dirs, files in os.walk(folder):
        for file in files:
            if file.endswith('.pdf'):
                pdf_files.append(os.path.join(root, file))
    return pdf_files



def process_session(session_id, file_location):
    # get correction mode from db using session_id (NLp or LLM)
    session = db.sessions.find_one({"session_id": session_id})
    if not session:
        print(f"Session {session_id} not found in DB")
        return

    pdf_files = unzip(file_location)
    total = len(pdf_files)

    db.sessions.update_one(
        {"session_id": session_id},
        {"$set": {"total_files": total, "processed": 0}}
    )
    correction_mode = session.get("correction_mode", "NLP")

    #get correction preferences from db using session_id
    preferences = session.get("preferences", {})
    #get teacher model answer and question paper from db using session_id
    teacher_model_answer = session.get("teacher_model_answer", "")
    question_paper = session.get("question_paper", "")
    is_handwritten = preferences.get("is_handwritten", False)

    for pdf in pdf_files:
        student_name = os.path.basename(pdf).replace(".pdf", "")
        if is_handwritten:
            extracted_data = extract_text_from_pdf(pdf)
            text = " ".join([page["text"] for page in extracted_data])
        else:
            text = get_text_from_nonOCR_pdf(pdf)
        
        if correction_mode == "NLP":
            print(f"Processing {pdf} with NLP")
            result = Correct_NLP(Student_Response=text, Teacher_model_answer=teacher_model_answer, preferences=preferences, key_points=None)
            db.results.insert_one({
                "session_id": session_id,
                "student_name": student_name,
                "pdf_file": pdf,
                "result": result
            })
            
        elif correction_mode == "LLM":
            print(f"Processing {pdf} with LLM")
            result = LLM_Grade(question_paper=question_paper, student_answer=text, teacher_model_answer=teacher_model_answer, preferences=preferences)
            db.results.insert_one({
                "session_id": session_id,
                "student_name": student_name,
                "pdf_file": pdf,
                "result": result
            })
        else:
            print(f"Unknown correction mode: {correction_mode}")
            return {
                "error": f"Unknown correction mode: {correction_mode}"
            }
        db.sessions.update_one(
            {"session_id": session_id},
            {"$inc": {"processed": 1}},
        )
    #check cheat for all students and update results in db
    
    db.sessions.update_one(
        {"session_id": session_id},
        {"$set": {"status": "processed"}}
        )

def check_cheat_in_session(session_id):
    pass

def get_text_from_nonOCR_pdf(pdf_path):
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    return text