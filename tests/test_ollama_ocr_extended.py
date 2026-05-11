import base64

from Engine.OCR import ollama_ocr


def test_img_to_base64_errors_when_path_missing():
    result = ollama_ocr.img_to_base64("")
    assert result == {"error": "No image path provided"}


def test_img_to_base64_reads_file(tmp_path):
    img = tmp_path / "sample.jpg"
    img.write_bytes(b"abc123")

    encoded = ollama_ocr.img_to_base64(str(img))

    assert encoded == base64.b64encode(b"abc123").decode("utf-8")


def test_ocr_with_llm_returns_trimmed_content(monkeypatch):
    monkeypatch.setattr(ollama_ocr, "img_to_base64", lambda _path: "ZmFrZQ==")
    monkeypatch.setattr(ollama_ocr, "make_prompt_for_ocr", lambda: "prompt")
    monkeypatch.setattr(ollama_ocr, "get_ollama_ocr_model", lambda: "model-x")

    captured = {}

    class _OllamaClientStub:
        def __init__(self, host=None): pass
        def chat(self, **kwargs):
            captured.update(kwargs)
            return {"message": {"content": "  extracted text  "}}

    monkeypatch.setattr(ollama_ocr.ollama, "Client", _OllamaClientStub)

    result = ollama_ocr.ocr_with_llm("image.jpg")

    assert result == "extracted text"
    assert captured["model"] == "model-x"
    assert captured["messages"][0]["images"] == ["ZmFrZQ=="]


def test_ocr_with_llm_returns_error_when_base64_conversion_fails(monkeypatch):
    monkeypatch.setattr(ollama_ocr, "img_to_base64", lambda _path: "")

    result = ollama_ocr.ocr_with_llm("image.jpg")

    assert result == {"error": "Failed to convert image to base64"}
