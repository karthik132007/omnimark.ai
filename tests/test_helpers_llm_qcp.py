import json

import pytest

from Engine import call_llm, helpers
from Engine.QCP import qcp
from Engine.grade import llm


def test_text_helpers_extract_keywords_and_prompts():
    text = "The student is in the lab and studies Machine Learning, learning systems."

    assert "student" in helpers.remove_stop_words(text).lower()
    assert "the" not in helpers.remove_stop_words(text).lower().split()
    assert "learning" in helpers.get_lemmatized_words(text)
    assert helpers.get_key_words("alpha beta beta gamma")
    assert helpers.similarity_score("same", "same") == pytest.approx(1.0)

    prompt = helpers.make_prompt("Q1", "answer key", "student answer", {"max_marks": 10})
    reevaluate_prompt = helpers.make_reevaluate_prompt("Q1", "answer key", "student answer", {}, {"total_marks": 4})
    ocr_prompt = helpers.make_prompt_for_ocr()

    assert "Question Paper" in prompt
    assert "RE-EVALUATION" in reevaluate_prompt
    assert "strict OCR extraction engine" in ocr_prompt


def test_llm_grade_parses_valid_and_invalid_json(monkeypatch):
    monkeypatch.setattr(llm, "grade_via_llm", lambda *args, **kwargs: '{"total_marks": 8}')
    assert llm.LLM_Grade("q", "key", "answer", {"llm_provider": "ollama"}) == {"total_marks": 8}

    monkeypatch.setattr(llm, "grade_via_llm", lambda *args, **kwargs: "not-json")
    invalid = llm.LLM_Grade("q", "key", "answer", {})
    assert invalid["error"] == "Invalid JSON response from LLM"

    monkeypatch.setattr(llm, "grade_via_llm", lambda *args, **kwargs: '{"total_marks": 9}')
    assert llm.LLM_Reevaluate("q", "key", "answer", {}, {"total_marks": 7}) == {"total_marks": 9}
    assert llm.LLMGradingEngine().grade("q", "key", "answer", {}) == {"total_marks": 9}


def test_grade_via_llm_ollama_and_openai_paths(monkeypatch):
    class _OllamaClientStub:
        def chat(self, **kwargs):
            if "think" in kwargs:
                assert kwargs["think"] == "medium"
            return {"message": {"content": "ollama-result"}}

    class _OllamaStub:
        Client = lambda self, host=None: _OllamaClientStub()

    monkeypatch.setitem(__import__("sys").modules, "ollama", _OllamaStub())
    assert call_llm.grade_via_llm("prompt", provider="ollama", model="m", think="medium") == "ollama-result"

    class _Message:
        content = "openai-result"

    class _Choice:
        message = _Message()

    class _Completions:
        @staticmethod
        def create(**_kwargs):
            return type("Response", (), {"choices": [_Choice()]})()

    class _Client:
        chat = type("Chat", (), {"completions": _Completions()})()

    monkeypatch.setenv("LLM_API_KEY", "test-key")
    monkeypatch.setattr(call_llm, "OpenAI", lambda **_kwargs: _Client())
    assert call_llm.grade_via_llm("prompt", provider="openai", model="m") == "openai-result"

    monkeypatch.delenv("LLM_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    with pytest.raises(RuntimeError):
        call_llm._build_openai_client()


def test_llm_grade_error_paths(monkeypatch):
    # Test LLM_Grade with invalid JSON
    monkeypatch.setattr(llm, "grade_via_llm", lambda *args, **kwargs: "not-json")
    invalid = llm.LLM_Grade("q", "key", "answer", {})
    assert invalid["error"] == "Invalid JSON response from LLM"
    assert "not-json" in invalid["raw_response"]

    # Test LLM_Reevaluate with invalid JSON
    monkeypatch.setattr(llm, "grade_via_llm", lambda *args, **kwargs: "not-json")
    invalid_re = llm.LLM_Reevaluate("q", "key", "answer", {}, {"total_marks": 7})
    assert invalid_re["error"] == "Invalid JSON response from LLM"
    assert "not-json" in invalid_re["raw_response"]


def test_qcp_set_paper_parses_json_and_returns_raw(monkeypatch):
    valid_payload = {
        "exam_title": "Mid Exam",
        "course": "AI",
        "difficulty": "Easy",
        "total_marks": 10,
        "questions": {"Chapter 1": [{"question_no": 1, "question": "Define AI", "marks": 10}]},
    }

    class _OllamaClientStub:
        def __init__(self, host=None): pass
        def chat(self, **kwargs):
            content = kwargs.get("content_to_return", f"```json\n{json.dumps(valid_payload)}\n```")
            return {"message": {"content": content}}

    monkeypatch.setattr(qcp.ollama, "Client", _OllamaClientStub)
    
    # Test valid JSON extraction
    parsed = json.loads(qcp.set_paper("Easy", 10, 1, "AI", False, "None", "notes", "keep clear"))
    assert parsed["course"] == "AI"

    # Test no JSON found - it should return the raw content
    def chat_no_json(self, **kwargs):
        return {"message": {"content": "no json here"}}
    monkeypatch.setattr(_OllamaClientStub, "chat", chat_no_json)
    
    assert qcp.set_paper("Easy", 10, 1, "AI", False, "None", "notes", "") == "no json here"
