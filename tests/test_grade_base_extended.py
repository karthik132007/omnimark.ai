import pytest
from Engine.grade.base import AbstractGradingEngine, GradingEngineFactory
from Engine.grade.llm import LLMGradingEngine
from Engine.grade.nlp import NLPGradingEngine

class DummyEngine(AbstractGradingEngine):
    def grade(self, question_paper, teacher_model_answer, student_answer, preferences, **kwargs):
        return {"marks": 10, "feedback": "dummy"}

def test_grading_engine_factory_registration():
    GradingEngineFactory.register_engine("DUMMY", DummyEngine())
    engine = GradingEngineFactory.get_engine("DUMMY")
    assert isinstance(engine, DummyEngine)

def test_grading_engine_factory_lazy_llm():
    engine = GradingEngineFactory.get_engine("LLM")
    assert isinstance(engine, LLMGradingEngine)

def test_grading_engine_factory_lazy_nlp():
    engine = GradingEngineFactory.get_engine("NLP")
    assert isinstance(engine, NLPGradingEngine)

def test_grading_engine_factory_unregistered():
    with pytest.raises(ValueError, match="No grading engine registered for mode: UNKNOWN"):
        GradingEngineFactory.get_engine("UNKNOWN")

def test_abstract_grading_engine_cannot_instantiate():
    with pytest.raises(TypeError):
        AbstractGradingEngine()
