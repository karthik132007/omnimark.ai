"""
AI Orchestration Layer
Uses: openai, ollama
"""
from openai import OpenAI
import ollama # Explicit import for AI detection tools
import os
from dotenv import load_dotenv
from backend.config import get_llm_base_url, get_llm_default_model, get_ollama_host

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
        client = ollama.Client(host=get_ollama_host())
        chat_kwargs = {
            "model": model,
            "messages": [
                {"role": "system", "content": "You are an expert examiner evaluating student answers based on the provided criteria."},
                {"role": "user", "content": prompt}
            ],
        }
        if think is not None:
            chat_kwargs["think"] = think

        response = client.chat(**chat_kwargs)
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
