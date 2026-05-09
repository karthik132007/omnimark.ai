from openai import OpenAI
import os
from dotenv import load_dotenv
from backend.config import get_llm_base_url, get_llm_default_model

load_dotenv()


def _build_openai_client() -> OpenAI:
    api_key = os.environ.get("LLM_API_KEY") or os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "OpenAI provider requested but no API key found. "
            "Set LLM_API_KEY/OPENAI_API_KEY or use provider='ollama'."
        )
    return OpenAI(api_key=api_key, base_url=get_llm_base_url())

def grade_via_llm(prompt, provider="ollama", model=None, think=None):
    model = model or get_llm_default_model()
    if provider == "ollama":
        import ollama
        chat_kwargs = {
            "model": model,
            "messages": [
                {"role": "system", "content": "You are an expert examiner evaluating student answers based on the provided criteria."},
                {"role": "user", "content": prompt}
            ],
        }
        if think is not None:
            chat_kwargs["think"] = think

        response = ollama.chat(**chat_kwargs)
        return response['message']['content']
    else:
        client = _build_openai_client()
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are an expert examiner evaluating student answers based on the provided criteria."},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content

# def explain_stats(stats):
#     response = client.chat.completions.create(
#         model="gpt-4o",
#         response_format={ "type": "json_object" },
#         messages=[
#             {"role": "system", "content": """
# You are Omi, an advanced AI assistant created by OmniMark AI to help teachers. 
# You are a student-teacher relation expert. You will be given stats of a class.
# Analyze the data to identify strengths and areas for improvement in the teacher's approach, engagement, and effectiveness.
# Provide insights into how the teacher can enhance their teaching methods to better support student learning and overall class performance.

# You MUST output your response in valid JSON format with the following keys:
# - "greeting": A friendly, encouraging greeting as Omi.
# - "overview": A brief summary of the overall class performance.
# - "strengths": A list of strings highlighting strong areas.
# - "areas_for_improvement": A list of strings highlighting weaknesses or gaps.
# - "action_plan": A list of actionable steps for the teacher.

# Do not include markdown blocks or any other text outside the JSON object.
# """},
#              {"role": "user", "content": f"Here are the stats of the class:\n{stats}"}
#         ]
#     )
#     return response.choices[0].message.content
