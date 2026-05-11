# Test Coverage Report

Date: 2026-05-11

This report is based on a fresh local run using the project virtual environment.

## Commands Run

```bash
./.venv/bin/python -m pytest -q
./.venv/bin/python -m pytest --disable-warnings --cov=. --cov-report=term
```

## Test Suite Status

```text
44 passed, 1 warning in 10.10s
```

Coverage run status:

```text
44 passed, 1 warning in 14.72s
```

## Coverage Summary

Overall measured coverage:

```text
TOTAL  2155 statements, 296 missing, 86% coverage
```

Important note: this command uses `--cov=.` so the total includes both application code and test files.

## Module Coverage

| Module | Statements | Missing | Coverage |
|---|---:|---:|---:|
| `Engine/Dashbord_data/eda.py` | 126 | 15 | 88% |
| `Engine/OCR/ocr.py` | 35 | 4 | 89% |
| `Engine/OCR/ollama_ocr.py` | 16 | 0 | 100% |
| `Engine/OMI/omi.py` | 8 | 1 | 88% |
| `Engine/QCP/qcp.py` | 17 | 2 | 88% |
| `Engine/call_llm.py` | 22 | 0 | 100% |
| `Engine/cheat_detection/cluster.py` | 83 | 17 | 80% |
| `Engine/cheat_detection/main.py` | 191 | 36 | 81% |
| `Engine/grade/base.py` | 6 | 1 | 83% |
| `Engine/grade/llm.py` | 26 | 2 | 92% |
| `Engine/grade/nlp.py` | 38 | 5 | 87% |
| `Engine/helpers.py` | 45 | 1 | 98% |
| `backend/app.py` | 358 | 101 | 72% |
| `backend/auth.py` | 219 | 59 | 73% |
| `backend/config.py` | 45 | 13 | 71% |
| `backend/db.py` | 48 | 11 | 77% |
| `backend/schemas.py` | 36 | 0 | 100% |
| `backend/worker/celery_app.py` | 6 | 0 | 100% |
| `backend/worker/files.py` | 5 | 0 | 100% |
| `backend/worker/work.py` | 177 | 23 | 87% |
| **Total (App + Tests)** | **2155** | **296** | **86%** |

## What Was Improved In This Iteration

- Added dedicated OCR tests for `Engine/OCR/ollama_ocr.py` covering:
  - missing image path handling,
  - base64 conversion from real file bytes,
  - successful `ollama.chat` invocation + output trimming,
  - explicit fallback return when base64 conversion fails.
- Added new app helper tests to exercise student access guard and teacher authorization helper branches.
- Expanded worker tests to cover:
  - LLM correction mode path,
  - unknown correction mode error path,
  - cheat detection exception path (`failed` status update),
  - legacy answer fallback extraction path,
  - PDF text normalization behavior in `get_text_from_nonOCR_pdf`.

## Goal Check

All measured application modules are now above 70% coverage.
