import numpy as np
import pytest

from Engine.cheat_detection import main as cheat_main
from Engine.cheat_detection import cluster as cluster_module

class _CheatModelStub:
    def encode(self, texts, normalize_embeddings=False):
        if isinstance(texts, str):
            texts = [texts]

        vectors = []
        for text in texts:
            text = str(text)
            if "SAME_ANSWER" in text:
                vec = np.array([1.0, 0.0, 0.0], dtype=float)
            elif "DIFFERENT_ANSWER" in text:
                vec = np.array([0.0, 1.0, 0.0], dtype=float)
            elif "unique" in text:
                # Assign distinct vectors for unique1, unique2 to ensure cosine distance > eps
                if "1" in text:
                    vec = np.array([1.0, 0.0, 0.0], dtype=float)
                else:
                    vec = np.array([0.0, 1.0, 0.0], dtype=float)
            else:
                vec = np.array([0.0, 0.0, 1.0], dtype=float)
            vectors.append(vec)

        matrix = np.vstack(vectors)
        if normalize_embeddings:
            norms = np.linalg.norm(matrix, axis=1, keepdims=True)
            norms[norms == 0] = 1.0
            matrix = matrix / norms
        return matrix


def test_analyze_session_cheating_flags_near_duplicates(monkeypatch):
    monkeypatch.setattr(cheat_main, "model", _CheatModelStub())

    report = cheat_main.analyze_session_cheating(
        [
            {"student_name": "A", "answer_text": "SAME_ANSWER with extra context"},
            {"student_name": "B", "answer_text": "SAME_ANSWER with extra context"},
            {"student_name": "C", "answer_text": "DIFFERENT_ANSWER unique response"},
        ],
        threshold=0.82,
        min_word_count=1,
    )

    # With threshold 0.82, and SAME_ANSWER vs SAME_ANSWER getting semantic=1.0, 
    # the total_pairs reported will only include pairs that weren't skipped by _should_skip_pair.
    # SAME vs DIFFERENT has 0 semantic similarity in the stub and DIFFERENT is long enough to skip.
    assert report["total_pairs"] >= 1
    assert report["summary"]["pairs_flagged"] >= 1
    assert any(pair["student_1"] == "A" and pair["student_2"] == "B" and pair["suspicious"] for pair in report["pairs"])


def test_pair_score_applies_short_answer_penalty():
    baseline = cheat_main._pair_score(
        semantic=0.95,
        jaccard=0.9,
        sequence=0.9,
        rare_overlap=0.9,
        length_similarity=0.9,
        short_answer=False,
    )
    penalized = cheat_main._pair_score(
        semantic=0.95,
        jaccard=0.9,
        sequence=0.9,
        rare_overlap=0.9,
        length_similarity=0.9,
        short_answer=True,
    )

    assert penalized < baseline


def test_extract_student_name():
    assert cluster_module._extract_student_name({"student_name": "John"}, 0) == "John"
    assert cluster_module._extract_student_name({"name": "Jane"}, 0) == "Jane"
    assert cluster_module._extract_student_name({}, 0) == "student_1"
    assert cluster_module._extract_student_name({"student_name": "  John  "}, 0) == "John"


def test_extract_answer_text():
    assert cluster_module._extract_answer_text({"answer_text": "Hello"}) == "Hello"
    assert cluster_module._extract_answer_text({"text": "World"}) == "World"
    # _extract_answer_text only takes one argument
    assert cluster_module._extract_answer_text({}) == ""
    assert cluster_module._extract_answer_text({"answer_text": "  Hello  "}) == "Hello"


def test_cosine_similarity_edge_cases():
    assert cluster_module._cosine_similarity(None, None) == 0.0
    assert cluster_module._cosine_similarity(np.array([0.0, 0.0]), np.array([1.0, 0.0])) == 0.0
    assert cluster_module._cosine_similarity(np.array([1.0, 0.0]), np.array([1.0, 0.0])) == pytest.approx(1.0, abs=1e-6)


def test_cluster_answers_empty(monkeypatch):
    monkeypatch.setattr(cluster_module, "model", _CheatModelStub())
    result = cluster_module.cluster_answers([])
    assert result == {"labels": [], "clusters": [], "student_cluster_map": {}, "noise": []}


def test_cluster_answers_no_clusters(monkeypatch):
    monkeypatch.setattr(cluster_module, "model", _CheatModelStub())
    result = cluster_module.cluster_answers(
        [
            {"student_name": "A", "answer_text": "unique1"},
            {"student_name": "B", "answer_text": "unique2"},
        ],
        eps=0.01,  # Very small eps to avoid clustering. 
        # With _CheatModelStub, these get [1,0,0] and [0,1,0].
        # Cosine similarity is 0. Cosine distance is 1. 1 > 0.01.
    )
    assert result["clusters"] == []
    assert len(result["noise"]) == 2
