from pdf2image import convert_from_path
import os
from Engine.OCR.ollama_ocr import ocr_with_llm


def _ocr_with_fallback(img_path):
    try:
        llm_text = ocr_with_llm(img_path)
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
        result = ocr.ocr(img_path, cls=True)
        
        if result and result[0]:
            fallback_text = "\n".join([line[1][0] for line in result[0]])
            return str(fallback_text or "").strip()
    except Exception:
        pass

    try:
        import pytesseract
        from PIL import Image

        return str(pytesseract.image_to_string(Image.open(img_path)) or "").strip()
    except Exception:
        pass
    
    return ""

def extract_text_from_pdf(pdf_path):
    pages = convert_from_path(pdf_path)

    full_text = []

    for page_num, page in enumerate(pages, start=1):
        img_path = f"temp_page_{page_num}.jpg"
        page.save(img_path, "JPEG")

        result = _ocr_with_fallback(img_path)

        full_text.append({
            "page": page_num,
            "text": result
        })

        if os.path.exists(img_path):
            os.remove(img_path)

    return full_text
