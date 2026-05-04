from Engine.helpers import make_prompt
import json
from Engine.call_llm import grade_via_llm
def LLM_Grade(question_paper, teacher_model_answer, student_answer, preferences):
    prompt = make_prompt(question_paper, teacher_model_answer, student_answer, preferences)
    llm_provider = preferences.get("llm_provider", "api")
    llm_model = preferences.get("llm_model", "gpt-4o")
    
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