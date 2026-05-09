from Engine.grade import nlp


def test_correct_nlp_empty_answer_scores_zero(monkeypatch):
    monkeypatch.setattr(nlp, "remove_stop_words", lambda text: text)
    monkeypatch.setattr(nlp, "get_key_words", lambda text: ["alpha", "beta"])
    monkeypatch.setattr(nlp, "get_lemmatized_words", lambda text: set())
    monkeypatch.setattr(nlp, "similarity_score", lambda _a, _b: 0.0)

    result = nlp.Correct_NLP(
        Student_Response="",
        Teacher_model_answer="alpha beta gamma",
        preferences={"max_marks": 10, "min_answer_length": 10},
        key_points=None,
    )

    assert result["marks"] == 0
    assert result["similarity"] == 0.0
    assert result["keyword_score"] == 0.0
    assert result["length_score"] == 0.0


def test_correct_nlp_high_similarity_caps_at_max(monkeypatch):
    monkeypatch.setattr(nlp, "remove_stop_words", lambda text: text)
    monkeypatch.setattr(nlp, "get_key_words", lambda text: ["alpha", "beta"])
    monkeypatch.setattr(nlp, "get_lemmatized_words", lambda text: {"alpha", "beta", "gamma"})
    monkeypatch.setattr(nlp, "similarity_score", lambda _a, _b: 0.95)

    result = nlp.Correct_NLP(
        Student_Response="alpha beta gamma " * 20,
        Teacher_model_answer="alpha beta gamma",
        preferences={"max_marks": 5, "min_answer_length": 10},
        key_points=None,
    )

    assert result["similarity"] == 0.95
    assert result["keyword_score"] == 1.0
    assert result["length_score"] == 1
    assert result["marks"] == 5
