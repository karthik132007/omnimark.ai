import sys
import types

from Engine.OCR import ocr


class _FakePage:
    def save(self, path, _fmt):
        with open(path, "wb") as fh:
            fh.write(b"fake-image")


def test_extract_text_uses_primary_ocr(monkeypatch):
    monkeypatch.setattr(ocr, "convert_from_path", lambda _pdf_path: [_FakePage()])
    monkeypatch.setattr(ocr, "ocr_with_llm", lambda _img_path: "primary-text")

    # Fail the test if fallback OCR gets called.
    class _PytesseractNever:
        @staticmethod
        def image_to_string(_img):
            raise AssertionError("Fallback OCR should not run when primary OCR succeeds")

    pytesseract_stub = types.ModuleType("pytesseract")
    pytesseract_stub.image_to_string = _PytesseractNever.image_to_string
    monkeypatch.setitem(sys.modules, "pytesseract", pytesseract_stub)

    rows = ocr.extract_text_from_pdf("dummy.pdf")
    assert rows == [{"page": 1, "text": "primary-text"}]


def test_extract_text_falls_back_when_primary_fails(monkeypatch):
    monkeypatch.setattr(ocr, "convert_from_path", lambda _pdf_path: [_FakePage()])

    def _raise_primary(_img_path):
        raise RuntimeError("LLM OCR unavailable")

    monkeypatch.setattr(ocr, "ocr_with_llm", _raise_primary)
    pytesseract_stub = types.ModuleType("pytesseract")
    pytesseract_stub.image_to_string = lambda _img: "fallback-text"
    monkeypatch.setitem(sys.modules, "pytesseract", pytesseract_stub)
    pil_stub = types.ModuleType("PIL")

    class _ImageStub:
        @staticmethod
        def open(_img_path):
            return object()

    pil_stub.Image = _ImageStub
    monkeypatch.setitem(sys.modules, "PIL", pil_stub)

    rows = ocr.extract_text_from_pdf("dummy.pdf")
    assert rows == [{"page": 1, "text": "fallback-text"}]
