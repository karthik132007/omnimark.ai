from collections import defaultdict
import logging

import numpy as np
from sklearn.cluster import DBSCAN

from Engine.encoder import model

logger = logging.getLogger(__name__)


def _extract_student_name(answer, index):
    """Extract student name from answer dict with fallback."""
    if isinstance(answer, dict):
        name = answer.get("student_name") or answer.get("name")
        if name:
            return str(name).strip()
    return f"student_{index + 1}"


def _extract_answer_text(answer):
    """Extract answer text from dict with fallback."""
    if isinstance(answer, dict):
        return str(answer.get("answer_text") or answer.get("text") or "").strip()
    return str(answer or "").strip()


def _cosine_similarity(left, right):
    """Compute cosine similarity with numeric safety."""
    try:
        if left is None or right is None:
            return 0.0
        left = np.asarray(left, dtype=float)
        right = np.asarray(right, dtype=float)
        
        left_norm = float(np.linalg.norm(left))
        right_norm = float(np.linalg.norm(right))
        
        if left_norm <= 0 or right_norm <= 0:
            return 0.0
        
        dot_prod = float(np.dot(left, right))
        if np.isnan(dot_prod) or np.isinf(dot_prod):
            return 0.0
        
        result = dot_prod / (left_norm * right_norm)
        result = max(0.0, min(1.0, result))  # Clamp to [0, 1]
        return 0.0 if np.isnan(result) or np.isinf(result) else result
    except (ValueError, TypeError, RuntimeError):
        logger.debug("Error computing cosine similarity, returning 0.0")
        return 0.0


def cluster_answers(answers, eps=0.22, min_samples=2, distance_matrix=None):
    """Cluster answers by semantic similarity or precomputed distance using DBSCAN.

    Args:
        answers: List of answer dicts with 'student_name' and 'answer_text'.
        eps: DBSCAN epsilon (cosine distance threshold).
        min_samples: Minimum samples in a neighborhood to form a cluster.
        distance_matrix: Optional precomputed distance matrix (metric="precomputed").

    Returns:
        Dict with 'labels', 'clusters', 'student_cluster_map', 'noise'.
    """
    try:
        candidates = []
        for index, answer in enumerate(answers):
            answer_text = _extract_answer_text(answer).strip()
            if not answer_text:
                continue

            candidates.append(
                {
                    "index": index,
                    "student_name": _extract_student_name(answer, index),
                    "answer_text": answer_text,
                }
            )

        if not candidates:
            return {"labels": [], "clusters": [], "student_cluster_map": {}, "noise": []}

        if distance_matrix is not None:
            # Use precomputed distance matrix
            clustering = DBSCAN(eps=eps, min_samples=min_samples, metric="precomputed").fit(distance_matrix)
            embeddings = None # Not needed for precomputed
        else:
            # Encode and use cosine metric
            answer_texts = [row["answer_text"] for row in candidates]
            embeddings = model.encode(answer_texts, normalize_embeddings=True)
            embeddings = np.asarray(embeddings, dtype=np.float32)

            # Validate embeddings
            if np.any(np.isnan(embeddings)) or np.any(np.isinf(embeddings)):
                logger.warning("Embeddings contain NaN/inf, cleaning...")
                embeddings = np.nan_to_num(embeddings, nan=0.0, posinf=1.0, neginf=0.0)

            # Run DBSCAN clustering
            clustering = DBSCAN(eps=eps, min_samples=min_samples, metric="cosine").fit(embeddings)

        labels = clustering.labels_.tolist()
        grouped_indexes = defaultdict(list)
        for index, label in enumerate(labels):
            grouped_indexes[label].append(index)

        clusters = []
        student_cluster_map = {}
        cluster_id = 1

        # Build clusters from DBSCAN groups
        for label in sorted(label for label in grouped_indexes if label != -1):
            member_indexes = grouped_indexes[label]
            if len(member_indexes) < 2:
                continue

            # Compute pairwise similarities within cluster
            similarities = []
            for left in range(len(member_indexes)):
                for right in range(left + 1, len(member_indexes)):
                    if distance_matrix is not None:
                        # Use 1 - distance as similarity for multi-signal scores
                        sim = 1.0 - float(distance_matrix[member_indexes[left]][member_indexes[right]])
                    else:
                        sim = _cosine_similarity(
                            embeddings[member_indexes[left]],
                            embeddings[member_indexes[right]],
                        )
                    if not np.isnan(sim) and not np.isinf(sim):
                        similarities.append(sim)

            if not similarities:
                continue

            student_names = [candidates[index]["student_name"] for index in member_indexes]
            cluster_record = {
                "cluster_id": cluster_id,
                "dbscan_label": label,
                "student_names": student_names,
                "size": len(member_indexes),
                "average_similarity": round(float(np.mean(similarities)), 4),
                "max_similarity": round(float(np.max(similarities)), 4),
                "answer_preview": candidates[member_indexes[0]]["answer_text"][:140],
            }
            clusters.append(cluster_record)
            for student_name in student_names:
                student_cluster_map[student_name] = cluster_id
            cluster_id += 1

        noise = [candidates[index] for index in grouped_indexes.get(-1, [])]
        
        logger.debug(f"Clustering: {len(candidates)} answers -> {len(clusters)} clusters, {len(noise)} noise")

        return {
            "labels": labels,
            "clusters": clusters,
            "student_cluster_map": student_cluster_map,
            "noise": noise,
        }
    except Exception as e:
        logger.error(f"Clustering failed: {e}")
        return {"labels": [], "clusters": [], "student_cluster_map": {}, "noise": []}