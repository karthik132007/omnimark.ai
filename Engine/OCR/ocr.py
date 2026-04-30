from paddleocr import PaddleOCR
from pdf2image import convert_from_path
import os

# initialize once only
ocr = PaddleOCR(
    use_angle_cls=True,
    lang='en'
)

def extract_text_from_pdf(pdf_path):
    pages = convert_from_path(pdf_path)
    
    full_text = []

    for page_num, page in enumerate(pages, start=1):
        img_path = f"temp_page_{page_num}.jpg"
        page.save(img_path, "JPEG")

        result = ocr.predict(img_path, cls=True)

        page_text = []
        for line in result[0]:
            text = line[1][0]
            page_text.append(text)

        full_text.append({
            "page": page_num,
            "text": " ".join(page_text)
        })

        os.remove(img_path)

    return full_text