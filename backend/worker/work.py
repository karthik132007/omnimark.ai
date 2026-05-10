import os
import re
import zipfile
from datetime import datetime, timezone
from backend.db import db
from backend.auth import get_password_hash
from Engine.OCR.ocr import extract_text_from_pdf
from Engine.cheat_detection.main import analyze_session_cheating
from Engine.grade.nlp import Correct_NLP
from Engine.grade.llm import LLM_Grade
from pypdf import PdfReader
from backend.worker.celery_app import celery_app


def _normalize_student_name(name: str) -> str:
    return " ".join(str(name or "").strip().lower().split())


def _ensure_student_record(student_name: str):
    normalized = _normalize_student_name(student_name)
    if not normalized:
        normalized = "unknown"
        student_name = "Unknown"

    student = db.students.find_one({"name_key": normalized})
    if student:
        return student

    last = db.students.find_one({}, sort=[("rollnum", -1)])
    next_roll = int(last.get("rollnum", 0)) + 1 if last else 1
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "rollnum": next_roll,
        "name": student_name,
        "name_key": normalized,
        "password": get_password_hash("12345678"),
        "created_at": now,
        "updated_at": now,
    }
    db.students.insert_one(doc)
    return doc


def _extract_total_marks(result: dict):
    if not isinstance(result, dict):
        return None
    if isinstance(result.get("total_marks"), (int, float)):
        return float(result["total_marks"])
    if isinstance(result.get("marks"), (int, float)):
        return float(result["marks"])
    return None


def _upsert_classroom_student(teacher_id, teacher_email, session_id, student_doc, result):
    now = datetime.now(timezone.utc).isoformat()
    total_marks = _extract_total_marks(result)
    db.classroom_students.update_one(
        {
            "teacher_id": teacher_id,
            "teacher_email": teacher_email,
            "rollnum": student_doc["rollnum"],
        },
        {
            "$set": {
                "name": student_doc.get("name"),
                "name_key": student_doc.get("name_key"),
                "updated_at": now,
            },
            "$setOnInsert": {
                "created_at": now,
            },
            "$push": {
                "history": {
                    "session_id": session_id,
                    "marks": total_marks,
                    "captured_at": now,
                }
            },
        },
        upsert=True,
    )


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



@celery_app.task(name="backend.worker.work.process_session")
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
    teacher_id = session.get("teacher_id")
    teacher_email = session.get("teacher_email")
    session_rollnums = set()

    for pdf in pdf_files:
        student_name = os.path.basename(pdf).replace(".pdf", "")
        student_doc = _ensure_student_record(student_name)
        session_rollnums.add(student_doc["rollnum"])
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
                "student_rollnum": student_doc["rollnum"],
                "student_name_key": student_doc["name_key"],
                "pdf_file": pdf,
                "answer_text": text,
                "result": result
            })
            _upsert_classroom_student(teacher_id, teacher_email, session_id, student_doc, result)
            
        elif correction_mode == "LLM":
            print(f"Processing {pdf} with LLM")
            result = LLM_Grade(question_paper=question_paper, student_answer=text, teacher_model_answer=teacher_model_answer, preferences=preferences)
            db.results.insert_one({
                "session_id": session_id,
                "student_name": student_name,
                "student_rollnum": student_doc["rollnum"],
                "student_name_key": student_doc["name_key"],
                "pdf_file": pdf,
                "answer_text": text,
                "result": result
            })
            _upsert_classroom_student(teacher_id, teacher_email, session_id, student_doc, result)
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
        {
            "$set": {"cheat_detection_status": "running"},
            "$unset": {"cheat_detection": "", "cheat_detection_error": ""},
        },
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
        {"$set": {"status": "processed", "student_rollnums": sorted(session_rollnums)}}
        )

@celery_app.task(name="backend.worker.work.check_cheat_in_session")
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
                            "cluster_id": student_report.get("cluster_id"),
                            "cluster_size": student_report.get("cluster_size", 1),
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
        extracted = page.extract_text() or ""
        text += extracted + "\n"

    # Normalize common PDF extraction artifacts while preserving meaningful structure.
    text = text.replace("\r", "\n")
    raw_lines = [re.sub(r"[ \t]+", " ", ln).strip() for ln in text.split("\n")]
    lines = [ln for ln in raw_lines]

    list_marker_re = re.compile(r"^(\d+[\).:-]|[-*•])\s+")
    merged_parts = []
    prev_line = ""

    for line in lines:
        if not line:
            # Preserve paragraph breaks.
            if merged_parts and merged_parts[-1] != "\n\n":
                merged_parts.append("\n\n")
            prev_line = ""
            continue

        if not merged_parts:
            merged_parts.append(line)
            prev_line = line
            continue

        # Keep list and heading style breaks on new lines.
        if list_marker_re.match(line) or prev_line.endswith(":"):
            if merged_parts[-1] != "\n\n":
                merged_parts.append("\n")
            merged_parts.append(line)
            prev_line = line
            continue

        # Word-per-line artifact fix: join tiny fragments with spaces.
        prev_words = len(prev_line.split())
        cur_words = len(line.split())
        if prev_words <= 2 and cur_words <= 2:
            merged_parts.append(" ")
            merged_parts.append(line)
            prev_line = f"{prev_line} {line}"
            continue

        # Default: join wrapped lines with spaces inside a paragraph.
        merged_parts.append(" ")
        merged_parts.append(line)
        prev_line = line

    cleaned = "".join(merged_parts)
    cleaned = re.sub(r"[ \t]+", " ", cleaned)
    cleaned = re.sub(r" ?\n ?","\\n", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()
