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


def test_correct_nlp_language_exam_path(monkeypatch):
    monkeypatch.setattr(nlp, "remove_stop_words", lambda text: text)
    monkeypatch.setattr(nlp, "get_key_words", lambda text: ["alpha", "beta"])
    monkeypatch.setattr(nlp, "get_lemmatized_words", lambda text: {"alpha", "beta"})
    monkeypatch.setattr(nlp, "similarity_score", lambda _a, _b: 0.5)

    result = nlp.Correct_NLP(
        Student_Response="alpha beta gamma",
        Teacher_model_answer="alpha beta gamma",
        preferences={"max_marks": 10, "language_exam": True},
        key_points=None,
    )

    assert result["similarity"] == 0.5
    assert result["keyword_score"] == 1.0
    assert result["marks"] > 0


def test_correct_nlp_empty_key_words(monkeypatch):
    monkeypatch.setattr(nlp, "remove_stop_words", lambda text: text)
    monkeypatch.setattr(nlp, "get_key_words", lambda text: [])
    monkeypatch.setattr(nlp, "get_lemmatized_words", lambda text: set())
    monkeypatch.setattr(nlp, "similarity_score", lambda _a, _b: 0.0)

    result = nlp.Correct_NLP(
        Student_Response="alpha beta gamma",
        Teacher_model_answer="alpha beta gamma",
        preferences={"max_marks": 10},
        key_points=None,
    )

    assert result["keyword_score"] == 0.0
    # Score = sim*0.8 + kw*0.15 + len*0.05. 
    # With sim=0, kw=0, and length_factor (alpha beta gamma is 3 words, min_length 250) factor = 3/250 = 0.012
    # marks = score * max_marks = (0 + 0 + 0.012*0.05) * 10 = 0.0006 * 10 = 0.006 -> round(0.006, 2) = 0.01
    assert result["marks"] == 0.01


def test_correct_nlp_length_factor(monkeypatch):
    monkeypatch.setattr(nlp, "remove_stop_words", lambda text: text)
    monkeypatch.setattr(nlp, "get_key_words", lambda text: ["alpha", "beta"])
    monkeypatch.setattr(nlp, "get_lemmatized_words", lambda text: {"alpha", "beta"})
    monkeypatch.setattr(nlp, "similarity_score", lambda _a, _b: 0.5)

    result = nlp.Correct_NLP(
        Student_Response="alpha beta",
        Teacher_model_answer="alpha beta gamma delta",
        preferences={"max_marks": 10, "min_answer_length": 10},
        key_points=None,
    )

    assert result["length_score"] < 1.0
    assert result["marks"] > 0
