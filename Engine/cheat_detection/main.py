import math
import re
from collections import Counter
from difflib import SequenceMatcher

import numpy as np

from Engine.encoder import model
from Engine.helpers import remove_stop_words

TOKEN_PATTERN = re.compile(r"\b[a-zA-Z]{3,}\b")


def _normalize_text(text):
    text = (text or "").lower().strip()
    text = re.sub(r"\s+", " ", text)
    return text


def _tokenize(text):
    cleaned = remove_stop_words(_normalize_text(text))
    return TOKEN_PATTERN.findall(cleaned)


def _jaccard_similarity(tokens_1, tokens_2):
    set_1 = set(tokens_1)
    set_2 = set(tokens_2)
    if not set_1 and not set_2:
        return 0.0
    return len(set_1 & set_2) / len(set_1 | set_2)


def _rare_overlap(tokens_1, tokens_2, idf_by_term):
    set_1 = set(tokens_1)
    set_2 = set(tokens_2)
    union = set_1 | set_2
    if not union:
        return 0.0
    inter = set_1 & set_2
    inter_weight = sum(idf_by_term.get(term, 0.0) for term in inter)
    union_weight = sum(idf_by_term.get(term, 0.0) for term in union)
    if union_weight <= 0:
        return 0.0
    return inter_weight / union_weight


def _length_similarity(tokens_1, tokens_2):
    length_1 = len(tokens_1)
    length_2 = len(tokens_2)
    max_len = max(length_1, length_2, 1)
    return max(0.0, 1.0 - abs(length_1 - length_2) / max_len)


def _sequence_similarity(text_1, text_2):
    # Limit text length for predictable runtime in pairwise comparison.
    return SequenceMatcher(None, text_1[:4500], text_2[:4500]).ratio()


def _risk_label(score):
    if score >= 0.92:
        return "critical"
    if score >= 0.86:
        return "high"
    if score >= 0.80:
        return "medium"
    if score >= 0.72:
        return "low"
    return "minimal"


def _build_idf(all_token_lists):
    class_size = len(all_token_lists)
    doc_freq = Counter()
    for token_list in all_token_lists:
        doc_freq.update(set(token_list))
    return {
        term: math.log((class_size + 1) / (freq + 1)) + 1
        for term, freq in doc_freq.items()
    }


def _pair_score(semantic, jaccard, sequence, rare_overlap, length_similarity, short_answer):
    score = (
        semantic * 0.45
        + jaccard * 0.20
        + sequence * 0.15
        + rare_overlap * 0.15
        + length_similarity * 0.05
    )
    if short_answer:
        score *= 0.82
    if semantic > 0.97 and jaccard > 0.82:
        score = max(score, 0.93)
    return max(0.0, min(1.0, score))


def check_cheat(student1, student2, threshold=0.82):
    answers = [
        {"student_name": "student_1", "answer_text": student1},
        {"student_name": "student_2", "answer_text": student2},
    ]
    report = analyze_session_cheating(answers, threshold=threshold)
    pair = report["pairs"][0] if report["pairs"] else None
    if not pair:
        return {"suspicious": False, "similarity_score": 0}
    return {
        "suspicious": bool(pair["suspicious"]),
        "similarity_score": round(pair["score"] * 100, 2),
        "risk_level": pair["risk_level"],
        "signals": pair["signals"],
    }


def analyze_session_cheating(student_answers, threshold=0.82, min_word_count=25):
    candidates = []
    for row in student_answers:
        student_name = str(row.get("student_name", "Unknown")).strip()
        answer_text = str(row.get("answer_text", "")).strip()
        if answer_text:
            candidates.append({"student_name": student_name, "answer_text": answer_text})

    if len(candidates) < 2:
        return {
            "threshold": threshold,
            "total_students": len(candidates),
            "total_pairs": 0,
            "flagged_pairs": [],
            "pairs": [],
            "students": [],
            "summary": {
                "students_flagged": 0,
                "pairs_flagged": 0,
                "highest_pair_score": 0,
            },
        }

    normalized_texts = [_normalize_text(row["answer_text"]) for row in candidates]
    token_lists = [_tokenize(text) for text in normalized_texts]
    idf_by_term = _build_idf(token_lists)

    embeddings = model.encode(normalized_texts, normalize_embeddings=True)
    semantic_matrix = np.matmul(embeddings, embeddings.T)

    pair_reports = []
    student_metrics = {
        row["student_name"]: {"max_pair_score": 0.0, "flagged_pairs": 0, "matched_with": []}
        for row in candidates
    }

    for i in range(len(candidates)):
        for j in range(i + 1, len(candidates)):
            token_i = token_lists[i]
            token_j = token_lists[j]
            semantic = float(semantic_matrix[i][j])
            jaccard = _jaccard_similarity(token_i, token_j)
            sequence = _sequence_similarity(normalized_texts[i], normalized_texts[j])
            rare_overlap = _rare_overlap(token_i, token_j, idf_by_term)
            length_similarity = _length_similarity(token_i, token_j)
            short_answer = min(len(token_i), len(token_j)) < min_word_count

            score = _pair_score(
                semantic=semantic,
                jaccard=jaccard,
                sequence=sequence,
                rare_overlap=rare_overlap,
                length_similarity=length_similarity,
                short_answer=short_answer,
            )
            suspicious = bool(
                score >= threshold
                or (semantic >= 0.96 and jaccard >= 0.74 and sequence >= 0.76)
            )
            risk_level = _risk_label(score)

            left_name = candidates[i]["student_name"]
            right_name = candidates[j]["student_name"]

            pair_report = {
                "student_1": left_name,
                "student_2": right_name,
                "score": round(score, 4),
                "risk_level": risk_level,
                "suspicious": suspicious,
                "signals": {
                    "semantic": round(semantic, 4),
                    "token_overlap": round(jaccard, 4),
                    "sequence": round(sequence, 4),
                    "rare_overlap": round(rare_overlap, 4),
                    "length_similarity": round(length_similarity, 4),
                },
            }
            pair_reports.append(pair_report)

            for student_name, peer_name in ((left_name, right_name), (right_name, left_name)):
                student_metrics[student_name]["max_pair_score"] = max(
                    student_metrics[student_name]["max_pair_score"], score
                )
                if suspicious:
                    student_metrics[student_name]["flagged_pairs"] += 1
                    student_metrics[student_name]["matched_with"].append(peer_name)

    pair_reports.sort(key=lambda row: row["score"], reverse=True)
    flagged_pairs = [row for row in pair_reports if row["suspicious"]]

    student_reports = []
    for student_name, metrics in student_metrics.items():
        adjusted_score = min(
            0.99,
            metrics["max_pair_score"] + min(0.03 * metrics["flagged_pairs"], 0.10),
        )
        student_reports.append(
            {
                "student_name": student_name,
                "max_pair_score": round(metrics["max_pair_score"], 4),
                "risk_score": round(adjusted_score, 4),
                "risk_level": _risk_label(adjusted_score),
                "flagged_pairs": metrics["flagged_pairs"],
                "matched_with": sorted(set(metrics["matched_with"])),
            }
        )

    student_reports.sort(key=lambda row: row["risk_score"], reverse=True)

    return {
        "threshold": threshold,
        "total_students": len(candidates),
        "total_pairs": len(pair_reports),
        "flagged_pairs": flagged_pairs,
        "pairs": pair_reports,
        "students": student_reports,
        "summary": {
            "students_flagged": sum(1 for row in student_reports if row["flagged_pairs"] > 0),
            "pairs_flagged": len(flagged_pairs),
            "highest_pair_score": round(pair_reports[0]["score"] if pair_reports else 0, 4),
        },
    }
