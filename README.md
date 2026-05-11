# OmniMark AI

OmniMark AI is a role-based AI evaluation platform that helps universities and teachers run end-to-end answer sheet assessment workflows with automation, consistency, and visibility.

**Live Demo:** [http://13.204.156.83](http://13.204.156.83) (Deployed on AWS)

The project is fully **Dockerized** for easy deployment and scalability.

It supports:
- session creation with model answer and question paper ingestion,
- bulk student script upload,
- asynchronous OCR + grading processing,
- cheating-risk analysis,
- teacher analytics and insights,
- student-facing results and reevaluation requests,
- university-level teacher management.

This README is intentionally implementation-grounded and aligned with the current repository code.

## Table of Contents
1. Product Overview
2. Implemented Capabilities
3. End-to-End Workflow
4. System Architecture
5. Tech Stack
6. Repository Structure
7. Runtime Configuration
8. Local Development Setup
9. Running Celery Workers
10. API Reference (Implemented Endpoints)
11. Data Model (Observed Collections)
12. Frontend Functional Views
13. Testing and Validation
14. Production Notes and Known Limitations
15. Claims, Benchmarks, and Evidence Policy

## 1. Product Overview

OmniMark AI is designed for academic evaluation operations where manual checking becomes a bottleneck at scale.
The platform combines deterministic backend orchestration with AI-assisted scoring modules and teacher decision loops.

The system is multi-role by design:
- **University admins** manage teacher accounts.
- **Teachers** create and process sessions, review analytics, and handle reevaluation.
- **Students** log in using roll number credentials, view results, and request reevaluation.

## 2. Implemented Capabilities

### 2.1 Authentication and Role Control
- University registration (`/auth/univ/register`).
- Unified login for university/teacher (`/auth/login`).
- Student login with automatic roll number provisioning (`/auth/student/login`).
- Endpoint for students to securely change their auto-provisioned password on first login (`/student/change-password`).
- JWT-based auth with role checks and optional auth mode where needed.
- Email normalization logic for consistent account lookup.
- Backward-compatibility support for legacy mixed-case emails.
- Password hash migration path for legacy plaintext rows (migrated to bcrypt on login).

### 2.2 University Admin Operations
- Add teacher (`POST /univ/teachers`).
- List teachers (`GET /univ/teachers`).
- Edit teacher (`PUT /univ/teachers/{teacher_id}`).
- Delete teacher (`DELETE /univ/teachers/{teacher_id}`).

### 2.3 Teacher Session Lifecycle
- Create session with:
  - session name,
  - correction mode (`NLP`/`LLM`),
  - evaluation preferences JSON,
  - uploaded `teacher_model_answer` PDF,
  - uploaded `question_paper` PDF.
- List sessions with pagination metadata.
- Fetch session details.
- Upload ZIP of student scripts.
- Trigger asynchronous processing.
- Poll processing status (`total_files`, `processed`, `status`).
- Retrieve final evaluated results.
- Delete session and associated results.

### 2.4 NLP and LLM Grading
- **Explainable AI (XAI) per-question Feedback (LLM-only)**: The LLM engine provides fine-grained, interpretable grading reports (XAI). It returns itemized score breakdowns and specific qualitative feedback per question rather than just a single global score (see prompt mechanics in `[Engine/helpers.py](Engine/helpers.py) -> make_prompt()`). Note: This per-question explanation is available for the LLM grading path only.
- **NLP grading path**:
  - stopword filtering,
  - keyword extraction via TF-IDF,
  - lemmatized keyword overlap,
  - sentence-transformer semantic similarity,
  - weighted score composition and max-marks capping.
- **LLM grading path**:
  - structured grading prompt that enforces Explainable AI (XAI) outputs (returns `"question_feedback"` mapping),
  - provider/model selection from preferences,
  - JSON response parsing,
  - invalid-JSON fallback payload.

### 2.5 OCR for Handwritten / Scanned Content
- PDF page rendering via `pdf2image`.
- OCR fallback chain:
  1. Ollama LLM vision OCR,
  2. PaddleOCR.
- Parallel processing of OCR operations per document with non-blocking in-memory image buffers.
- Page-wise extraction output merged into answer text for evaluation.

### 2.6 Asynchronous Processing with Celery
- `process_session` task:
  - unzip PDFs,
  - extract student text (OCR or PDF text extraction path),
  - run grading engine,
  - write result documents,
  - update classroom summary records,
  - update processing counters,
  - trigger cheat detection status flow.
- `check_cheat_in_session` task:
  - compute report,
  - write session-level cheat report,
  - write per-student cheat summary into result documents.

### 2.7 Cheat Detection and Risk Analytics
- Multi-signal pair similarity:
  - semantic similarity,
  - Jaccard token overlap,
  - sequence similarity,
  - rare-token overlap (IDF-weighted),
  - length similarity.
- Pair risk score + suspicious flagging.
- Risk labels (`minimal`, `low`, `medium`, `high`, `critical`).
- Cluster detection with DBSCAN using cosine metric.
- Session summary includes pair-level, student-level, and cluster-level risk summaries.

### 2.8 Dashboard Analytics and OMI Insights
- Dashboard summary endpoint provides:
  - total sessions,
  - processed sessions,
  - submission totals,
  - average/highest/lowest marks,
  - session trends,
  - common mistake buckets,
  - toppers,
  - score distribution,
  - risk bands.
- **CSV Result Exports:** Teachers can instantly export session evaluation results as a `.csv` file directly from the analytics dashboard (implemented natively in `frontend/src/components/teacher-dashboard/AnalyticsView.tsx`).
- OMI endpoint generates structured teaching insights by prompting an LLM with dashboard summary stats.

### 2.9 Reevaluation Governance
- Student can submit reevaluation request by session.
- Teacher can list requests and filter by status.
- Teacher can approve request:
  - reevaluation applied,
  - result updated,
  - `reevaluation_history` appended.
- Teacher can reject request with reason.
- Teacher can also directly reevaluate a student result in a session.

### 2.11 Question Paper Generation (QCP)
- Teacher submits QCP preferences + relevant PDF document.
- Backend extracts reference text and prompts model.
- Response returned as JSON question-paper structure (with parsing fallback behavior).

## 3. End-to-End Workflow

1. University creates teacher accounts.
2. Teacher logs in and creates an evaluation session.
3. Teacher uploads model answer PDF and question paper PDF.
4. Teacher uploads ZIP containing student PDF scripts.
5. Teacher starts processing (`/process`).
6. Celery worker executes OCR/text extraction + grading per script.
7. Session progress updates while processing.
8. Results become available after processing completion.
9. Cheat detection report is generated and stored.
10. Dashboard + OMI insights become available for teacher review.
11. Students can log in, view marks, and request reevaluation.
12. Teacher resolves reevaluation requests.

## 4. System Architecture

### 4.1 Core Components
- **Frontend (React + TS):** user interfaces for all roles.
- **FastAPI backend:** API, validation, auth, session orchestration.
- **Engine modules:** grading, OCR, cheat detection, QCP, and analytics helpers (including Explainable AI logic).
- **Celery worker:** async execution for long-running workflows.
- **MongoDB:** persistence for all lifecycle entities.

### 4.2 Backend/Worker Responsibility Split
- **FastAPI** handles request validation, access checks, and job dispatch.
- **Celery worker** handles heavy operations (batch processing and cheat analysis).
- **Engine** modules remain reusable and decoupled from transport layer.

### 4.3 Session State Progression
Typical status flow in `sessions` collection:
- `created` -> `uploaded` -> `processing` -> `processed`

## 5. Tech Stack

### Backend
- FastAPI
- Pydantic
- Celery
- PyMongo
- JWT (`pyjwt`)
- Bcrypt

### AI / ML / OCR
- SentenceTransformers (`all-MiniLM-L6-v2`)
- NLTK
- scikit-learn
- Ollama
- OpenAI-compatible client
- pdf2image
- PaddleOCR
- pypdf

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- Axios
- Recharts
- framer-motion

## 6. Repository Structure

```text
omnimark.ai/
├── backend/
│   ├── app.py
│   ├── auth.py
│   ├── config.py
│   ├── db.py
│   ├── schemas.py
│   └── worker/
│       ├── celery_app.py
│       ├── files.py
│       └── work.py
├── Engine/
│   ├── OCR/
│   ├── grade/
│   ├── cheat_detection/
│   ├── Dashbord_data/
│   ├── OMI/
│   ├── QCP/
│   ├── call_llm.py
│   ├── encoder.py
│   └── helpers.py
├── frontend/
├── tests/
├── Datasets/
├── media/
├── requirements.txt
├── docker-compose.yml
└── package.json
```

## 7. Runtime Configuration

### 7.1 Required Environment Variables
- `MONGO_URI`
- `JWT_SECRET` (or `SECRET_KEY`)

### 7.2 Frequently Used Optional Variables
- `APP_ENV` (default `development`)
- `CORS_ALLOW_ORIGINS` (mandatory in production)
- `LLM_BASE_URL`
- `LLM_API_KEY` / `OPENAI_API_KEY`
- `LLM_DEFAULT_MODEL`
- `LLM_REEVALUATE_MODEL`
- `OLLAMA_OCR_MODEL`
- `OMI_MODEL`
- `QCP_MODEL`
- `CELERY_BROKER_URL`
- `CELERY_RESULT_BACKEND`

### 7.3 Celery and Docker Setup
This project uses **SQLite** as the message broker and result backend for Celery, allowing it to run without external dependencies like Redis.

In the Dockerized environment, these are configured to use a persistent volume:
- Broker: `sqla+sqlite:////app/data/celerydb.sqlite`
- Result backend: `db+sqlite:////app/data/celery_results.sqlite`

## 8. Deployment with Docker

The project is fully Dockerized and can be started using Docker Compose:

```bash
docker-compose up --build
```

This will spin up:
- **FastAPI Backend**: `http://localhost:8000`
- **Celery Worker**: For async OCR and grading.
- **Frontend (Nginx)**: `http://localhost:80`

## 9. Local Development Setup (Non-Docker)
...
### 9.4 Running Celery Workers (Local)

Start worker from repository root in a separate terminal:

```bash
source .venv/bin/activate
celery -A backend.worker.celery_app:celery_app worker --loglevel=info --pool=solo
```

By default, it uses local SQLite files `celerydb.sqlite` and `celery_results.sqlite` in the root directory.

## 10. API Reference (Implemented Endpoints)

### Health
- `GET /health`

### Auth and identity
- `POST /auth/univ/register`
- `POST /auth/login`
- `POST /auth/student/login`
- `GET /teachers/me`

### University teacher management
- `POST /univ/teachers`
- `GET /univ/teachers`
- `PUT /univ/teachers/{teacher_id}`
- `DELETE /univ/teachers/{teacher_id}`

### Session management
- `POST /session/create`
- `GET /sessions`
- `GET /session/{session_id}`
- `DELETE /session/{session_id}`
- `POST /session/{session_id}/upload_zip`
- `POST /session/{session_id}/process`
- `GET /session/{session_id}/status`
- `GET /session/{session_id}/results`
- `GET /session/{session_id}/export` (supports `format=csv` or `format=xlsx`)

### Dashboard and analytics
- `GET /dashboard/teacher_stats`
- `GET /dashboard/teacher_summary`
- `GET /omi/analyze`
- `GET /session/{session_id}/stats`

### Cheat detection
- `POST /session/{session_id}/cheat_detection`
- `GET /session/{session_id}/cheat_report`

### Classroom and student flows
- `GET /teacher/my-class`
- `GET /teacher/my-class/{rollnum}`
- `GET /student/{rollnum}/results`
- `POST /student/{rollnum}/request-reevaluation`
- `GET /teacher/reevaluation-requests`
- `POST /teacher/reevaluation-requests/{request_id}/approve`
- `POST /teacher/reevaluation-requests/{request_id}/reject`
- `POST /session/{session_id}/student/{student_name}/reevaluate`

### Question paper composer
- `POST /QCP`

## 11. Data Model (Observed Collections)

Primary collections used by runtime code:
- `users`
- `students`
- `sessions`
- `results`
- `classroom_students`
- `student_requests`

### 11.1 `sessions` (high-level fields)
- `session_id`
- `name`
- `status`
- `teacher_id`
- `teacher_email`
- `teacher_email_normalized`
- `correction_mode`
- `preferences`
- `teacher_model_answer`
- `question_paper`
- `custom_prompt`
- processing metadata (`total_files`, `processed`)
- cheat metadata (`cheat_detection_status`, `cheat_detection`, timestamps)

### 11.2 `results`
- `session_id`
- `student_name`
- `student_rollnum`
- `student_name_key`
- `pdf_file`
- `answer_text`
- `result` (NLP payload with overall marks, or LLM payload containing overall marks, per-question feedback [XAI], and explanation)
- optional `cheat_detection`
- optional `reevaluation_history`

### 11.3 `classroom_students`
- teacher linkage
- roll number / normalized name
- `history` entries (`session_id`, marks, timestamp)

### 11.4 `student_requests`
- `rollnum`
- `student_name`
- `session_id`
- `reason`
- `status` (`pending`/`approved`/`rejected`)
- created/approved/rejected timestamps
- optional rejection reason

## 12. Frontend Functional Views

### 12.1 Home and marketing shell
- landing page with product framing and call-to-actions.

### 12.2 Auth views
- University/teacher auth view.
- Student auth view.

### 12.3 University Dashboard
- add/list/delete teachers.

### 12.4 Teacher Dashboard
- session setup,
- ZIP script upload,
- processing monitor,
- analytics view,
- OMI view,
- QCP generation view,
- class roster and detail view,
- reevaluation request operations.

### 12.5 Student Dashboard
- result listing by roll number,
- reevaluation request submission per session.

## 13. Testing and Validation

The repository contains 17 Python test files under `tests/` covering:
- auth flows,
- route behavior,
- worker processing,
- cheat detection,
- NLP grading units,
- OCR fallback behavior,
- dashboard/stat summarization,
- OMI helper endpoints,
- **Future-scope architectural hooks and reporting exporters.**

Run tests:
```bash
pytest
```

## 14. Production Notes and Known Limitations

### 14.1 Security / operational notes
- Local SQLite-backed Celery transport is convenient but not ideal for production reliability.
- Production should use managed Redis/RabbitMQ and hardened secret management.

### 14.2 Configuration integrity
- `backend/config.py` enforces required env checks and CORS restrictions in production mode.

### 14.3 Dependency source of truth
- `backend/pyproject.toml` natively handles dependencies (PEP-621) substituting the previously minimal definition, though `requirements.txt` remains for backward compatibility.

## 15. Claims, Benchmarks, and Evidence Policy

This repository prioritizes evidence-based documentation. All claims in sections 1-13 are verifiable by examining the source code in this repository.

## 16. Future Roadmap (Working on it)

We are actively evolving OmniMark AI. The following features are currently being explored and we intend to integrate them in the future:

- **LMS Integration**: Standardized adapters for Moodle, Canvas, and Blackboard for automated roster and grade syncing.
- **SMS & Email Notifications**: Automated alerts for processing completion and reevaluation updates.
- **Student Script Visibility**: Secure student access to their evaluated answer scripts.
- **Advanced Comparative Analytics**: Longitudinal cohort insights and question difficulty profiling.

