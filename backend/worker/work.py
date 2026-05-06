import os
import zipfile
from datetime import datetime, timezone
from backend.db import db
from Engine.OCR.ocr import extract_text_from_pdf
from Engine.cheat_detection.main import analyze_session_cheating
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
                "answer_text": text,
                "result": result
            })
            
        elif correction_mode == "LLM":
            print(f"Processing {pdf} with LLM")
            result = LLM_Grade(question_paper=question_paper, student_answer=text, teacher_model_answer=teacher_model_answer, preferences=preferences)
            db.results.insert_one({
                "session_id": session_id,
                "student_name": student_name,
                "pdf_file": pdf,
                "answer_text": text,
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
    db.sessions.update_one(
        {"session_id": session_id},
        {"$set": {"cheat_detection_status": "running"}},
    )
    try:
        check_cheat_in_session(session_id)
        db.sessions.update_one(
            {"session_id": session_id},
            {"$set": {"cheat_detection_status": "completed"}},
        )
    except Exception as exc:
        db.sessions.update_one(
            {"session_id": session_id},
            {"$set": {"cheat_detection_status": "failed", "cheat_detection_error": str(exc)}},
        )

    db.sessions.update_one(
        {"session_id": session_id},
        {"$set": {"status": "processed"}}
        )

def check_cheat_in_session(session_id):
    try:
        session = db.sessions.find_one({"session_id": session_id}, {"_id": 0, "preferences": 1})
        if not session:
            return {"error": "Session not found"}

        is_handwritten = bool(session.get("preferences", {}).get("is_handwritten", False))
        result_rows = list(db.results.find({"session_id": session_id}))
        if len(result_rows) < 2:
            report = {
                "threshold": 0.82,
                "total_students": len(result_rows),
                "total_pairs": 0,
                "flagged_pairs": [],
                "pairs": [],
                "students": [],
                "summary": {"students_flagged": 0, "pairs_flagged": 0, "highest_pair_score": 0},
            }
            db.sessions.update_one(
                {"session_id": session_id},
                {"$set": {"cheat_detection": report, "cheat_detection_last_run": datetime.now(timezone.utc).isoformat(), "cheat_detection_status": "completed"}},
            )
            return report

        answers = []
        row_ids_by_student = {}
        for row in result_rows:
            student_name = row.get("student_name", "Unknown")
            answer_text = str(row.get("answer_text", "")).strip()

            # Fallback support for legacy sessions where answer text was not stored.
            if not answer_text:
                pdf_path = row.get("pdf_file", "")
                if pdf_path and os.path.exists(pdf_path):
                    if is_handwritten:
                        extracted_pages = extract_text_from_pdf(pdf_path)
                        answer_text = " ".join(page.get("text", "") for page in extracted_pages if isinstance(page, dict))
                    else:
                        answer_text = get_text_from_nonOCR_pdf(pdf_path)

            answers.append({"student_name": student_name, "answer_text": answer_text})
            row_ids_by_student[student_name] = row["_id"]

        report = analyze_session_cheating(answers, threshold=0.82)
        by_student = {row["student_name"]: row for row in report.get("students", [])}

        for student_name, student_report in by_student.items():
            row_id = row_ids_by_student.get(student_name)
            if not row_id:
                continue
            db.results.update_one(
                {"_id": row_id},
                {
                    "$set": {
                        "cheat_detection": {
                            "risk_level": student_report.get("risk_level"),
                            "risk_score": student_report.get("risk_score"),
                            "max_pair_score": student_report.get("max_pair_score"),
                            "flagged_pairs": student_report.get("flagged_pairs", 0),
                            "matched_with": student_report.get("matched_with", []),
                        }
                    }
                },
            )

        db.sessions.update_one(
            {"session_id": session_id},
            {"$set": {"cheat_detection": report, "cheat_detection_last_run": datetime.now(timezone.utc).isoformat(), "cheat_detection_status": "completed"}},
        )
        return report
    except Exception as exc:
        db.sessions.update_one(
            {"session_id": session_id},
            {"$set": {"cheat_detection_status": "failed", "cheat_detection_error": str(exc)}},
        )
        raise

def get_text_from_nonOCR_pdf(pdf_path):
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    return text
