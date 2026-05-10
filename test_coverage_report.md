# Test Coverage Report

Date: 10-5-2026

This report is based on the latest test run performed locally with `pytest` and `pytest-cov`. The numbers below are copied from the actual command output; no fake coverage claims are included.

## Command Run

```powershell
.\.venv\Scripts\python.exe -m pytest --cov=. --cov-report=term-missing
```

## Test Result

- Total tests collected: 32
- Passed: 32
- Failed: 0
- Warnings: 4
- Final result: `32 passed, 4 warnings in 18.74s`

## Coverage Summary

Overall measured coverage:

```text
TOTAL  2023 statements, 393 missing, 81% coverage
```

Important note: this coverage command used `--cov=.` so it includes both application code and test files in the measurement. Application-only coverage would need a narrower command such as `--cov=backend --cov=Engine`.

## Module Coverage

| Module | Statements | Missing | Coverage |
|---|---:|---:|---:|
| `Engine/Dashbord_data/eda.py` | 126 | 15 | 88% |
| `Engine/OCR/ocr.py` | 41 | 11 | 73% |
| `Engine/OCR/ollama_ocr.py` | 16 | 10 | 38% |
| `Engine/OMI/omi.py` | 8 | 1 | 88% |
| `Engine/QCP/qcp.py` | 17 | 2 | 88% |
| `Engine/call_llm.py` | 22 | 0 | 100% |
| `Engine/cheat_detection/cluster.py` | 83 | 17 | 80% |
| `Engine/cheat_detection/main.py` | 191 | 36 | 81% |
| `Engine/grade/base.py` | 6 | 1 | 83% |
| `Engine/grade/llm.py` | 26 | 2 | 92% |
| `Engine/grade/nlp.py` | 38 | 5 | 87% |
| `Engine/helpers.py` | 45 | 1 | 98% |
| `backend/app.py` | 347 | 111 | 68% |
| `backend/auth.py` | 219 | 60 | 73% |
| `backend/config.py` | 45 | 13 | 71% |
| `backend/db.py` | 48 | 23 | 52% |
| `backend/schemas.py` | 36 | 0 | 100% |
| `backend/worker/celery_app.py` | 6 | 0 | 100% |
| `backend/worker/files.py` | 5 | 0 | 100% |
| `backend/worker/work.py` | 177 | 70 | 60% |
| **Total** | **2023** | **393** | **81%** |

## Test Files Run

- `tests/test_cheat_detection_unit.py`
- `tests/test_db.py`
- `tests/test_eda.py`
- `tests/test_eda_dashboard_summary_extended.py`
- `tests/test_endpoints.py`
- `tests/test_app_routes_extended.py`
- `tests/test_auth_flows_extended.py`
- `tests/test_helpers_llm_qcp.py`
- `tests/test_nlp_grading_unit.py`
- `tests/test_ocr_fallback_unit.py`
- `tests/test_omi.py`
- `tests/test_stats.py`
- `tests/test_worker_processing_extended.py`

Pytest also included imported/collected coverage data for `tests/test_eda2.py` and `tests/test_omi_fastapi.py`.

## Warnings

The run completed successfully, but produced 4 non-failing warnings:

- `mongomock` uses deprecated `pkg_resources`.
- `PyPDF2` is deprecated and recommends moving to `pypdf`.
- `backend/app.py` uses FastAPI `on_event`, which is deprecated in favor of lifespan handlers.
- FastAPI emitted the matching framework-level `on_event` deprecation warning.

## Honest Assessment

The test suite currently passes and exceeds the requested 80% total coverage under the command above. Stronger areas now include schemas, Celery app configuration, file saving, LLM/QCP wrappers, helper prompts, NLP grading, dashboard statistics, and cheat detection logic. Coverage is still weaker in the main FastAPI app, auth edge cases, MongoDB unavailable branches, raw OCR/Ollama integration, and the deeper worker error paths.
