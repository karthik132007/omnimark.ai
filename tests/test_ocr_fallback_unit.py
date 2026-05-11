import sys
import types

from Engine.OCR import ocr


class _FakePage:
    def save(self, path, format=None, **kwargs):
        if isinstance(path, str):
            with open(path, "wb") as fh:
                fh.write(b"fake-image")
        else:
            path.write(b"fake-image")


def test_extract_text_uses_primary_ocr(monkeypatch):
    monkeypatch.setattr(ocr, "convert_from_path", lambda _pdf_path: [_FakePage()])
    monkeypatch.setattr(ocr, "ocr_with_llm", lambda base64_str=None, **kwargs: "primary-text")

    class _PaddleOCRNever:
        def __init__(self, **_kwargs):
            raise AssertionError("Fallback OCR should not run when primary OCR succeeds")

    paddleocr_stub = types.ModuleType("paddleocr")
    paddleocr_stub.PaddleOCR = _PaddleOCRNever
    monkeypatch.setitem(sys.modules, "paddleocr", paddleocr_stub)

    rows = ocr.extract_text_from_pdf("dummy.pdf")
    assert rows == [{"page": 1, "text": "primary-text"}]


def test_extract_text_falls_back_when_primary_fails(monkeypatch):
    monkeypatch.setattr(ocr, "convert_from_path", lambda _pdf_path: [_FakePage()])

    def _raise_primary(base64_str=None, **kwargs):
        raise RuntimeError("LLM OCR unavailable")

    monkeypatch.setattr(ocr, "ocr_with_llm", _raise_primary)

    class _PaddleOCRStub:
        def __init__(self, **_kwargs):
            pass

        def ocr(self, _img_path, cls=True):
            return [[[None, ["fallback-text", 0.99]]]]

    paddleocr_stub = types.ModuleType("paddleocr")
    paddleocr_stub.PaddleOCR = _PaddleOCRStub
    monkeypatch.setitem(sys.modules, "paddleocr", paddleocr_stub)

    rows = ocr.extract_text_from_pdf("dummy.pdf")
    assert rows == [{"page": 1, "text": "fallback-text"}]
