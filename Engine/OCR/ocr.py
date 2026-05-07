from pdf2image import convert_from_path
import os
from Engine.OCR.ollama_ocr import ocr_with_llm

def extract_text_from_pdf(pdf_path):
    pages = convert_from_path(pdf_path)

    full_text = []

    for page_num, page in enumerate(pages, start=1):
        img_path = f"temp_page_{page_num}.jpg"
        page.save(img_path, "JPEG")

        result = ocr_with_llm(img_path)

        full_text.append({
            "page": page_num,
            "text": result
        })

        os.remove(img_path)

    return full_text