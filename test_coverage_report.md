# Test Coverage Report

Date: 2026-05-11

This report is based on a fresh local run using the project virtual environment.

## Commands Run

```bash
./.venv/bin/python -m pytest --disable-warnings --cov=. --cov-report=term-missing
```

## Test Suite Status

```text
124 passed, 12 warnings in 16.00s
```

## Coverage Summary

Overall measured coverage:

```text
TOTAL  3110 statements, 239 missing, 92% coverage
```

## Module Coverage

| Module | Statements | Missing | Coverage |
|---|---:|---:|---:|
| `Engine/Dashbord_data/eda.py` | 126 | 15 | 88% |
| `Engine/OCR/ocr.py` | 43 | 4 | 91% |
| `Engine/OCR/ollama_ocr.py` | 20 | 1 | 95% |
| `Engine/OMI/omi.py` | 9 | 1 | 89% |
| `Engine/QCP/qcp.py` | 18 | 2 | 89% |
| `Engine/call_llm.py` | 24 | 0 | 100% |
| `Engine/cheat_detection/cluster.py` | 83 | 13 | 84% |
| `Engine/cheat_detection/main.py` | 191 | 34 | 82% |
| `Engine/grade/base.py` | 23 | 1 | 96% |
| `Engine/grade/llm.py` | 26 | 0 | 100% |
| `Engine/grade/nlp.py` | 38 | 1 | 97% |
| `Engine/helpers.py` | 45 | 1 | 98% |
| `Engine/reports/exporter.py` | 18 | 0 | 100% |
| `backend/analytics.py` | 34 | 3 | 91% |
| `backend/app.py` | 28 | 3 | 89% |
| `backend/auth.py` | 231 | 40 | 83% |
| `backend/config.py` | 51 | 1 | 98% |
| `backend/db.py` | 48 | 3 | 94% |
| `backend/reevaluation.py` | 122 | 8 | 93% |
| `backend/schemas.py` | 39 | 0 | 100% |
| `backend/services/notification.py` | 54 | 0 | 100% |
| `backend/sessions.py` | 129 | 22 | 83% |
| `backend/students.py` | 37 | 1 | 97% |
| `backend/utils.py` | 79 | 12 | 85% |
| `backend/worker/celery_app.py` | 6 | 0 | 100% |
| `backend/worker/files.py` | 5 | 0 | 100% |
| `backend/worker/work.py` | 180 | 23 | 87% |
| **Total (App + Tests)** | **3110** | **239** | **92%** |

## Improvements In This Iteration

- Increased test count from 110 to 124 passed tests.
- Significantly improved coverage for:
    - `backend/analytics.py`: 85% -> 91%
    - `backend/reevaluation.py`: 84% -> 93%
    - `backend/students.py`: 89% -> 97%
- Added `tests/test_analytics_extended.py` and `tests/test_students_extended.py`.
- Expanded `tests/test_reevaluation_extended.py` to cover error paths, invalid IDs, and notification failures.
- Maintained overall coverage at 92% despite increasing the code surface area.
- All critical backend modules are now at or above 83% coverage.


