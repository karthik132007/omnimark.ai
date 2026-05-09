import logging
import math
import re
import time
from collections import Counter
from difflib import SequenceMatcher

import numpy as np

from Engine.encoder import model
from Engine.cheat_detection.cluster import cluster_answers
from Engine.helpers import remove_stop_words

logger = logging.getLogger(__name__)
TOKEN_PATTERN = re.compile(r"\b[a-zA-Z]{3,}\b")


def _normalize_text(text):
    """Normalize text: lowercase, strip, collapse whitespace, handle OCR artifacts."""
    text = (text or "").lower().strip()
    # Collapse multiple spaces
    text = re.sub(r"\s+", " ", text)
    # Remove common OCR artifacts: repeated chars (e.g., 'oooo' -> 'o'), weird unicode
    text = re.sub(r"(.)\1{3,}", r"\1", text)
    # Remove control chars and other noise
    text = "".join(c if ord(c) >= 32 or c in "\n\t\r" else "" for c in text)
    return text.strip()


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
    """Compute pair similarity score with robustness to NaN/inf."""
    # Validate inputs
    for val in [semantic, jaccard, sequence, rare_overlap, length_similarity]:
        if not isinstance(val, (int, float)) or np.isnan(val) or np.isinf(val):
            return 0.0
    
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


def _should_skip_pair(len_i, len_j, min_word_count, semantic_similarity):
    """Early-exit check: skip pairs that can't possibly be suspicious."""
    min_len = min(len_i, len_j)
    max_len = max(len_i, len_j)
    
    # Only skip very short answers (< 3 tokens) with no semantic match
    if min_len < 3 and semantic_similarity < 0.5:
        return True
    
    # Huge length imbalance (3x+) + very low semantic similarity -> different answers
    if max_len > 0 and min_len / max_len < 0.25 and semantic_similarity < 0.50:
        return True
    
    return False


def _adaptive_threshold(pair_scores):
    """Compute adaptive threshold based on score distribution."""
    if not pair_scores or len(pair_scores) < 3:
        return 0.82
    
    scores = np.array(pair_scores, dtype=float)
    scores = scores[~np.isnan(scores)]
    if len(scores) < 3:
        return 0.82
    
    mean = np.mean(scores)
    std = np.std(scores)
    
    # Threshold = mean + 1.5*std, but stay in [0.70, 0.90] range
    adaptive = mean + 1.5 * std
    return max(0.70, min(0.90, adaptive))


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


def analyze_session_cheating(student_answers, threshold=0.82, min_word_count=25, max_pairs_to_check=None):
    """Analyze session for cheating with robustness and efficiency.
    
    Args:
        student_answers: List of dicts with 'student_name' and 'answer_text'.
        threshold: Similarity score threshold for flagging (0.0-1.0).
        min_word_count: Minimum token count to consider an answer valid.
        max_pairs_to_check: Cap on pairs to evaluate (prevents O(n²) explosion).
    """
    if not isinstance(threshold, (int, float)) or threshold < 0 or threshold > 1:
        threshold = 0.82
    if max_pairs_to_check is None:
        max_pairs_to_check = 5000  # Prevent runaway computation on huge classes
    
    timer_start = time.time()
    
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
            "clusters": [],
            "summary": {
                "students_flagged": 0,
                "pairs_flagged": 0,
                "highest_pair_score": 0,
                "clusters_flagged": 0,
                "largest_cluster_size": 0,
            },
        }

    normalized_texts = [_normalize_text(row["answer_text"]) for row in candidates]
    token_lists = [_tokenize(text) for text in normalized_texts]
    idf_by_term = _build_idf(token_lists)

    embeddings = model.encode(normalized_texts, normalize_embeddings=True)
    semantic_matrix = np.matmul(embeddings, embeddings.T)

    pair_reports = []
    pair_lookup = {}
    student_metrics = {
        row["student_name"]: {"max_pair_score": 0.0, "flagged_pairs": 0, "matched_with": []}
        for row in candidates
    }
    
    # Early-exit if too many pairs to check
    total_pairs = len(candidates) * (len(candidates) - 1) // 2
    if total_pairs > max_pairs_to_check:
        logger.warning(
            f"Session has {len(candidates)} students ({total_pairs} pairs). "
            f"Limiting to top {max_pairs_to_check} most similar by semantic score."
        )

    for i in range(len(candidates)):
        for j in range(i + 1, len(candidates)):
            # Hard cap check
            if len(pair_reports) >= max_pairs_to_check:
                break
            token_i = token_lists[i]
            token_j = token_lists[j]
            semantic = float(semantic_matrix[i][j])
            
            # Early exit: skip pairs that can't be suspicious
            if _should_skip_pair(len(token_i), len(token_j), min_word_count, semantic):
                continue
            
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
            pair_lookup[tuple(sorted((left_name, right_name)))] = pair_report

            for student_name, peer_name in ((left_name, right_name), (right_name, left_name)):
                student_metrics[student_name]["max_pair_score"] = max(
                    student_metrics[student_name]["max_pair_score"], score
                )
                if suspicious:
                    student_metrics[student_name]["flagged_pairs"] += 1
                    student_metrics[student_name]["matched_with"].append(peer_name)

    pair_reports.sort(key=lambda row: row["score"], reverse=True)
    flagged_pairs = [row for row in pair_reports if row["suspicious"]]
    
    # Optional: adaptive threshold refinement based on actual score distribution
    if pair_reports and len(pair_reports) > 5:
        adaptive = _adaptive_threshold([p["score"] for p in pair_reports])
        logger.debug(f"Adaptive threshold: {adaptive:.3f} (original: {threshold:.3f})")
        # Optionally use adaptive if it's significantly different
        if abs(adaptive - threshold) > 0.05:
            threshold = adaptive
            flagged_pairs = [row for row in pair_reports if row["suspicious"] and row["score"] >= threshold]

    cluster_source = cluster_answers(candidates, eps=0.22, min_samples=2)
    student_cluster_map = cluster_source.get("student_cluster_map", {})
    cluster_reports = []
    for cluster in cluster_source.get("clusters", []):
        member_names = cluster.get("student_names", [])
        member_pairs = []
        for i in range(len(member_names)):
            for j in range(i + 1, len(member_names)):
                pair = pair_lookup.get(tuple(sorted((member_names[i], member_names[j]))))
                if pair:
                    member_pairs.append(pair)

        if not member_pairs:
            continue

        max_pair_score = max(pair["score"] for pair in member_pairs)
        average_pair_score = sum(pair["score"] for pair in member_pairs) / len(member_pairs)
        suspicious_pairs = [pair for pair in member_pairs if pair["suspicious"]]
        cluster_reports.append(
            {
                **cluster,
                "average_pair_score": round(average_pair_score, 4),
                "max_pair_score": round(max_pair_score, 4),
                "suspicious_pairs": len(suspicious_pairs),
                "suspicious": bool(suspicious_pairs or max_pair_score >= threshold),
                "risk_level": _risk_label(max_pair_score),
            }
        )

    cluster_reports.sort(key=lambda row: (row["max_pair_score"], row["size"]), reverse=True)
    cluster_lookup = {row["cluster_id"]: row for row in cluster_reports}

    for pair_report in pair_reports:
        left_cluster = student_cluster_map.get(pair_report["student_1"])
        right_cluster = student_cluster_map.get(pair_report["student_2"])
        pair_report["cluster_id"] = left_cluster if left_cluster and left_cluster == right_cluster else None

    student_reports = []
    for student_name, metrics in student_metrics.items():
        cluster_id = student_cluster_map.get(student_name)
        cluster_info = cluster_lookup.get(cluster_id, {}) if cluster_id is not None else {}
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
                "cluster_id": cluster_id,
                "cluster_size": cluster_info.get("size", 1),
            }
        )

    student_reports.sort(key=lambda row: row["risk_score"], reverse=True)
    
    elapsed = time.time() - timer_start
    logger.info(
        f"Cheat detection completed: {len(candidates)} students, "
        f"{len(pair_reports)} pairs checked, {len(flagged_pairs)} flagged, "
        f"{len(cluster_reports)} clusters, {elapsed:.2f}s"
    )

    return {
        "threshold": threshold,
        "total_students": len(candidates),
        "total_pairs": len(pair_reports),
        "flagged_pairs": flagged_pairs,
        "pairs": pair_reports,
        "students": student_reports,
        "clusters": cluster_reports,
        "summary": {
            "students_flagged": sum(1 for row in student_reports if row["flagged_pairs"] > 0),
            "pairs_flagged": len(flagged_pairs),
            "highest_pair_score": round(pair_reports[0]["score"] if pair_reports else 0, 4),
            "clusters_flagged": sum(1 for row in cluster_reports if row["suspicious"]),
            "largest_cluster_size": max((row["size"] for row in cluster_reports), default=0),
        },
    }
