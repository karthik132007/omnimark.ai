from pdf2image import convert_from_path
import os
import io
import base64
import numpy as np
import concurrent.futures
from Engine.OCR.ollama_ocr import ocr_with_llm

def _ocr_with_fallback(page_image):
    buffered = io.BytesIO()
    page_image.save(buffered, format="JPEG")
    base64_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
    
    try:
        llm_text = ocr_with_llm(base64_str=base64_str)
        if isinstance(llm_text, dict) and llm_text.get("error"):
            raise RuntimeError(llm_text["error"])
        if llm_text:
            return str(llm_text).strip()
    except Exception:
        pass

    try:
        from paddleocr import PaddleOCR
        import logging
        logging.getLogger("ppocr").setLevel(logging.ERROR)
        
        # Initialize PaddleOCR (only runs once as it caches)
        ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
        img_array = np.array(page_image)
        result = ocr.ocr(img_array, cls=True)
        
        if result and result[0]:
            fallback_text = "\n".join([line[1][0] for line in result[0]])
            return str(fallback_text or "").strip()
    except Exception:
        pass
    
    return ""

def _process_page(page_tuple):
    page_num, page_image = page_tuple
    text = _ocr_with_fallback(page_image)
    return {
        "page": page_num,
        "text": text
    }

def extract_text_from_pdf(pdf_path):
    pages = convert_from_path(pdf_path)
    full_text = []

    with concurrent.futures.ThreadPoolExecutor() as executor:
        results = list(executor.map(_process_page, enumerate(pages, start=1)))
        
    full_text = sorted(results, key=lambda x: x["page"])

    return full_text
