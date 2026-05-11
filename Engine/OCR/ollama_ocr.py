import base64
from Engine.helpers import make_prompt_for_ocr
import ollama
from backend.config import get_ollama_ocr_model

def img_to_base64(img_path):
    if not img_path:
        return {
            "error": "No image path provided"
        }
    with open(img_path, "rb") as img_file:
        return base64.b64encode(img_file.read()).decode('utf-8')

def ocr_with_llm(img_path=None, base64_str=None):
    if not base64_str:
        if not img_path:
            return {
                "error": "No image or base64 string provided"
            }
        base64_str = img_to_base64(img_path)
        
    if not base64_str:
        return {
            "error": "Failed to convert image to base64"
        }
    prompt = make_prompt_for_ocr()
    response = ollama.chat(
        model=get_ollama_ocr_model(),
        messages=[{
            "role": "user",
            "content": prompt,
            "images": [base64_str]
        }],
        options={
            "temperature": 0
        }
    )
    return response["message"]["content"].strip()
