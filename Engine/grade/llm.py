from Engine.helpers import make_prompt, make_reevaluate_prompt
import json
from Engine.call_llm import grade_via_llm
from backend.config import get_llm_default_model, get_llm_reevaluate_model
from Engine.grade.base import AbstractGradingEngine

class LLMGradingEngine(AbstractGradingEngine):
    def grade(self, question_paper: str, teacher_model_answer: str, student_answer: str, preferences: dict, **kwargs) -> dict:
        return LLM_Grade(question_paper, teacher_model_answer, student_answer, preferences)

def LLM_Grade(question_paper, teacher_model_answer, student_answer, preferences):
    prompt = make_prompt(question_paper, teacher_model_answer, student_answer, preferences)
    llm_provider = preferences.get("llm_provider", "ollama")
    llm_model = preferences.get("llm_model", get_llm_default_model())
    
    # Call LLM API with the prompt and get the response
    llm_response = grade_via_llm(prompt, provider=llm_provider, model=llm_model)
    
    # Parse the JSON response from the LLM
    try:
        grading_result = json.loads(llm_response)
        return grading_result
    except json.JSONDecodeError:
        return {
            "error": "Invalid JSON response from LLM",
            "raw_response": llm_response
        }

def LLM_Reevaluate(question_paper, teacher_model_answer, student_answer, preferences, previous_result):
    prompt = make_reevaluate_prompt(question_paper, teacher_model_answer, student_answer, preferences, previous_result)
    llm_response = grade_via_llm(
        prompt,
        provider="ollama",
        model=get_llm_reevaluate_model(),
        think="medium",
    )
    
    # Parse the JSON response from the LLM
    try:
        grading_result = json.loads(llm_response)
        return grading_result
    except json.JSONDecodeError:
        return {
            "error": "Invalid JSON response from LLM",
            "raw_response": llm_response
        }
