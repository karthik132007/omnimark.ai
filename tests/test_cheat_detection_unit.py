import numpy as np

from Engine.cheat_detection import main as cheat_main


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

    assert report["total_pairs"] == 3
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
