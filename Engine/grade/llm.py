from Engine.helpers import make_prompt
import json
from call_llm import grade_via_llm
def LLM_Grade(question_paper, teacher_model_answer, student_answer, preferences):
    prompt = make_prompt(question_paper, teacher_model_answer, student_answer, preferences)
    
    # Call LLM API with the prompt and get the response
    llm_response = grade_via_llm(prompt)
    
    # Parse the JSON response from the LLM
    try:
        grading_result = json.loads(llm_response)
        return grading_result
    except json.JSONDecodeError:
        return {
            "error": "Invalid JSON response from LLM",
            "raw_response": llm_response
        }