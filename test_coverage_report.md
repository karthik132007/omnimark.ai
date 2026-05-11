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
74 passed, 8 warnings in 18.09s
```

## Coverage Summary

Overall measured coverage:

```text
TOTAL  2465 statements, 284 missing, 88% coverage
```

## Module Coverage

| Module | Statements | Missing | Coverage |
|---|---:|---:|---:|
| `Engine/Dashbord_data/eda.py` | 126 | 15 | 88% |
| `Engine/OCR/ocr.py` | 43 | 4 | 91% |
| `Engine/OCR/ollama_ocr.py` | 19 | 1 | 95% |
| `Engine/OMI/omi.py` | 8 | 1 | 88% |
| `Engine/QCP/qcp.py` | 17 | 2 | 88% |
| `Engine/call_llm.py` | 22 | 0 | 100% |
| `Engine/cheat_detection/cluster.py` | 83 | 13 | 84% |
| `Engine/cheat_detection/main.py` | 191 | 34 | 82% |
| `Engine/grade/base.py` | 23 | 1 | 96% |
| `Engine/grade/llm.py` | 26 | 0 | 100% |
| `Engine/grade/nlp.py` | 38 | 1 | 97% |
| `Engine/helpers.py` | 45 | 1 | 98% |
| `Engine/reports/exporter.py` | 18 | 0 | 100% |
| `backend/app.py` | 373 | 109 | 71% |
| `backend/auth.py` | 231 | 66 | 71% |
| `backend/config.py` | 45 | 1 | 98% |
| `backend/db.py` | 48 | 3 | 94% |
| `backend/schemas.py` | 39 | 0 | 100% |
| `backend/services/notification.py` | 19 | 0 | 100% |
| `backend/worker/celery_app.py` | 6 | 0 | 100% |
| `backend/worker/files.py` | 5 | 0 | 100% |
| `backend/worker/work.py` | 180 | 23 | 87% |
| **Total (App + Tests)** | **2465** | **284** | **88%** |

## Improvements In This Iteration

- Fixed regression failures in `tests/test_cheat_detection_unit.py` (argument mismatch, missing imports).
- Fixed regression failure in `tests/test_nlp_grading_unit.py` (rounding difference in mark calculation).
- Added `tests/test_notifications.py` to cover the new `NotificationService` (reached 100% coverage for the service).
- Added `tests/test_report_exporter.py` to cover `ReportExporter` (reached 100% coverage for the exporter).
- Overall application coverage remains stable and high at **88%**.
- All critical engine modules are maintained above 80% coverage.
