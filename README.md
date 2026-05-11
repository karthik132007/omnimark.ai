# OmniMark AI

OmniMark AI is a role-based AI evaluation platform that helps universities and teachers run end-to-end answer sheet assessment workflows with automation, consistency, and visibility.

**Live Demo:** [http://13.204.156.83](http://13.204.156.83) (Deployed on AWS)

The project is fully **Dockerized** for easy deployment and scalability.

It supports:
- session creation with model answer and question paper ingestion,
- bulk student script upload,
- asynchronous OCR + grading processing,
- cheating-risk analysis,
- teacher session analytics and insights,
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
- **University admins** manage teacher accounts only (no analytics dashboard).
- **Teachers** create and process sessions, review per-session analytics, and handle reevaluation.
- **Students** log in using roll number credentials, view results, and request reevaluation.

## 2. Implemented Capabilities

### 2.1 Authentication and Role Control
- University registration (`/auth/univ/register`).
- Unified login for university/teacher (`/auth/login`).
- Student login with automatic roll number provisioning (`/auth/student/login`).
- Endpoint for students to securely change their auto-provisioned password on first login (`/student/change-password`).
- JWT-based auth with role checks.
- Email normalization logic for consistent account lookup.
- Backward-compatibility support for legacy mixed-case emails.
- Password hash migration path for legacy plaintext rows (migrated to bcrypt on login).

### 2.2 University Admin Operations
- Add teacher (`POST /univ/teachers`).
- List teachers (`GET /univ/teachers`).
- Edit teacher (`PUT /univ/teachers/{teacher_id}`).
- Delete teacher (`DELETE /univ/teachers/{teacher_id}`).

**Note:** University dashboard has no analytics view. Only teacher management is available.

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
- Export session results as CSV or XLSX.

**Note:** No real-time monitoring dashboard. Processing status is polled via REST API only.

### 2.4 NLP and LLM Grading
- **NLP grading path**:
  - stopword filtering,
  - keyword extraction via TF-IDF,
  - lemmatized keyword overlap,
  - sentence-transformer semantic similarity,
  - weighted score composition and max-marks capping.
- **LLM grading path**:
  - structured grading prompt with Explainable AI (XAI) outputs,
  - returns `"question_feedback"` mapping with per-question breakdowns,
  - provider/model selection from preferences,
  - JSON response parsing with fallback behavior.

### 2.5 OCR for Handwritten / Scanned Content
- PDF page rendering via `pdf2image`.
- OCR fallback chain:
  1. Ollama LLM vision OCR,
  2. PaddleOCR.
- Parallel processing of OCR operations per document.
- Page-wise extraction merged into answer text for evaluation.

### 2.6 Asynchronous Processing with Celery
- `process_session` task:
  - unzip PDFs,
  - extract student text (OCR or PDF text extraction),
  - run grading engine,
  - write result documents,
  - update processing counters,
  - trigger cheat detection status flow.
- `check_cheat_in_session` task:
  - compute pair-wise similarity scores,
  - flag suspicious pairs,
  - detect clusters with DBSCAN,
  - write session-level and per-student cheat summaries.

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

### 2.8 Session-Level Analytics and Insights
- Session stats endpoint provides per-session:
  - total submissions,
  - average/highest/lowest marks,
  - score distribution,
  - risk bands summary.
- CSV/XLSX result exports for teacher download.
- OMI endpoint generates structured teaching insights by analyzing session summary stats.

### 2.9 Reevaluation Governance
- Student can submit reevaluation request by session.
- Teacher can list requests and filter by status.
- Teacher can approve request:
  - reevaluation applied,
  - result updated,
  - `reevaluation_history` appended.
- Teacher can reject request with reason.
- Teacher can also directly reevaluate a student result in a session.

### 2.10 Question Paper Generation (QCP)
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
7. Session progress updated via REST API polling (`/session/{id}/status`).
8. Results become available after processing completion.
9. Cheat detection report is generated and stored.
10. Teacher reviews session analytics and can export results.
11. Students can log in, view marks, and request reevaluation.
12. Teacher resolves reevaluation requests.

## 4. System Architecture

### 4.1 Core Components
- **Frontend (React + TS):** user interfaces for all roles.
- **FastAPI backend:** API, validation, auth, session orchestration.
- **Engine modules:** grading, OCR, cheat detection, QCP, and analytics helpers.
- **Celery worker:** async execution for long-running workflows.
- **MongoDB:** persistence for all lifecycle entities.
- **SQLite (Celery):** message broker and result backend (no external services required).

### 4.2 Backend/Worker Responsibility Split
- **FastAPI** handles request validation, access checks, and job dispatch.
- **Celery worker** handles heavy operations (batch processing and cheat analysis).
- **Engine** modules remain reusable and decoupled from transport layer.

### 4.3 Session State Progression
Typical status flow in `sessions` collection:
```
created → uploaded → processing → processed
```

### 4.4 Simplified System Architecture

```
┌─────────────────────────────────────────────────────┐
│            FRONTEND (React + TypeScript)             │
│  ├─ Teacher Portal (Session setup, results export)  │
│  ├─ Student Portal (View results, request reeval)   │
│  └─ University Admin (Teacher management only)      │
└────────────────┬────────────────────────────────────┘
                 │ REST API / WebSocket
                 ▼
┌─────────────────────────────────────────────────────┐
│         BACKEND (FastAPI) - Request Layer           │
│  ├─ Authentication (JWT, RBAC)                      │
│  ├─ Session orchestration                           │
│  ├─ File handling (PDF uploads, ZIP extraction)     │
│  ├─ Analytics & export endpoints                    │
│  └─ Celery task dispatch                            │
└────────────────┬────────────────────────────────────┘
                 │ Job Enqueue
                 ▼
┌──────────────────────────┐      ┌──────────────────┐
│   MongoDB (Persistence)  │      │  SQLite (Celery) │
│  ├─ users                │      │  ├─ Message DB   │
│  ├─ students             │      │  └─ Result DB    │
│  ├─ sessions             │      │                  │
│  ├─ results              │      │                  │
│  ├─ cheat_reports        │      │                  │
│  └─ reevaluation_history │      │                  │
└──────────────────────────┘      └──────────────────┘
                 ▲                         ▲
                 │      Read/Write         │
                 └────────────┬────────────┘
                              ▼
         ┌─────────────────────────────────────────┐
         │  ASYNC WORKER (Celery) - Processing     │
         │  ├─ process_session:                    │
         │  │  ├─ ZIP extraction                   │
         │  │  ├─ OCR + text extraction            │
         │  │  ├─ NLP/LLM grading                  │
         │  │  └─ Result persistence               │
         │  │                                       │
         │  └─ check_cheat_in_session:             │
         │     ├─ Pair similarity analysis         │
         │     ├─ Risk scoring                     │
         │     ├─ DBSCAN clustering                │
         │     └─ Report generation                │
         └────────────┬───────────────────────────┘
                      │ Engine Module Calls
                      ▼
         ┌─────────────────────────────────────────┐
         │  ENGINE MODULES (Reusable)              │
         │  ├─ OCR (Ollama → PaddleOCR fallback)   │
         │  ├─ Grading (NLP & LLM logic)           │
         │  ├─ Cheat detection (similarity + risk) │
         │  ├─ Analytics helpers                   │
         │  ├─ Encoder (semantic embeddings)       │
         │  └─ QCP (Question generation)           │
         └────────────┬───────────────────────────┘
                      │
                      ▼
         ┌─────────────────────────────────────────┐
         │  EXTERNAL SERVICES (Optional)           │
         │  ├─ LLM API (OpenAI-compatible)         │
         │  ├─ Ollama (local/cloud OCR)            │
         │  └─ PaddleOCR (local fallback)          │
         └─────────────────────────────────────────┘
```

### 4.5 Data Flow Overview

**Synchronous Request Flow:**
```
Browser Request
    ↓
FastAPI Router (Validation & Auth)
    ↓
Business Logic Handler
    ↓
Database Query/Write (MongoDB)
    ↓
Response Serialization
    ↓
Browser Response
```

**Asynchronous Processing Flow:**
```
Teacher clicks "Start Processing"
    ↓
FastAPI dispatches Celery task (process_session)
    ↓
Returns job_id to frontend
    ↓
Frontend polls GET /session/{id}/status
    ↓
Celery Worker (background):
    ├─ Extract PDFs from ZIP
    ├─ Run OCR & text extraction
    ├─ Execute grading pipeline
    ├─ Write results to MongoDB
    ├─ Update session status
    └─ Dispatch cheat detection task
    ↓
Cheat Detection Worker:
    ├─ Compute pair similarities
    ├─ Score risk levels
    ├─ Cluster analysis
    └─ Write cheat report
    ↓
Session analytics becomes available
```

## 5. Tech Stack

### Backend
- FastAPI
- Pydantic
- Celery (with SQLite broker/backend)
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
├── [backend/](./backend/)
│   ├── [app.py](./backend/app.py)
│   ├── [auth.py](./backend/auth.py)
│   ├── [config.py](./backend/config.py)
│   ├── [db.py](./backend/db.py)
│   ├── [schemas.py](./backend/schemas.py)
│   └── [worker/](./backend/worker/)
│       ├── [celery_app.py](./backend/worker/celery_app.py)
│       ├── [files.py](./backend/worker/files.py)
│       └── [work.py](./backend/worker/work.py)
├── [Engine/](./Engine/)
│   ├── [OCR/](./Engine/OCR/)
│   ├── [grade/](./Engine/grade/)
│   ├── [cheat_detection/](./Engine/cheat_detection/)
│   ├── [Dashbord_data/](./Engine/Dashbord_data/)
│   ├── [OMI/](./Engine/OMI/)
│   ├── [QCP/](./Engine/QCP/)
│   ├── [call_llm.py](./Engine/call_llm.py)
│   ├── [encoder.py](./Engine/encoder.py)
│   └── [helpers.py](./Engine/helpers.py)
├── [frontend/](./frontend/)
├── [tests/](./tests/)
├── [Datasets/](./Datasets/)
├── [media/](./media/)
├── [requirements.txt](./requirements.txt)
├── [docker-compose.yml](./docker-compose.yml)
└── [package.json](./package.json)
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

### 7.3 Celery Configuration
This project uses **SQLite** as the message broker and result backend for Celery, eliminating the need for external services like Redis.

Local configuration (default):
- Broker: `sqla+sqlite:///celerydb.sqlite`
- Result backend: `db+sqlite:///celery_results.sqlite`

Docker configuration (with persistent volumes):
- Broker: `sqla+sqlite:////app/data/celerydb.sqlite`
- Result backend: `db+sqlite:////app/data/celery_results.sqlite`

## 8. Deployment with Docker

The project is fully Dockerized and can be started using [docker-compose.yml](./docker-compose.yml):

```bash
docker-compose up --build
```

This will spin up:
- **FastAPI Backend**: `http://localhost:8000`
- **Celery Worker**: For async OCR and grading.
- **Frontend (Nginx)**: `http://localhost:80`

## 9. Local Development Setup (Non-Docker)

### 9.1 Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB (local or cloud)
- Git

### 9.2 Backend Setup

```bash
# Clone repository
git clone https://github.com/karthik132007/omnimark.ai.git
cd omnimark.ai

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r [requirements.txt](./requirements.txt)

# Set environment variables
export MONGO_URI="mongodb://localhost:27017/omnimark"
export JWT_SECRET="your-secret-key"
export LLM_BASE_URL="https://api.openai.com/v1"
export LLM_API_KEY="your-api-key"

# Run backend server
uvicorn [backend/app.py](./backend/app.py):app --reload --host 0.0.0.0 --port 8000
```

### 9.3 Frontend Setup

```bash
cd [frontend/](./frontend/)

# Install dependencies
npm install

# Start development server
npm run dev
```

Backend will be accessible at `http://localhost:8000`
Frontend will be accessible at `http://localhost:5173`

## 10. Running Celery Workers (Local)

Start worker from repository root in a separate terminal:

```bash
source .venv/bin/activate
celery -A [backend/worker/celery_app.py](./backend/worker/celery_app.py):celery_app worker --loglevel=info --pool=solo
```

SQLite files (`celerydb.sqlite` and `celery_results.sqlite`) will be created in the root directory.

## 11. API Reference (Implemented Endpoints)

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

### Session analytics
- `GET /session/{session_id}/stats`
- `GET /omi/analyze`

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

## 12. Data Model (Observed Collections)

Primary collections used by runtime code:
- `users`
- `students`
- `sessions`
- `results`
- `classroom_students`
- `student_requests`
- `cheat_reports`

### 12.1 `sessions` (high-level fields)
- `session_id`
- `name`
- `status` (`created`, `uploaded`, `processing`, `processed`)
- `teacher_id`
- `teacher_email`
- `teacher_email_normalized`
- `correction_mode` (`NLP` or `LLM`)
- `preferences`
- `teacher_model_answer`
- `question_paper`
- `custom_prompt`
- processing metadata (`total_files`, `processed`)
- cheat metadata (`cheat_detection_status`, `cheat_detection`, timestamps)

### 12.2 `results`
- `session_id`
- `student_name`
- `student_rollnum`
- `student_name_key`
- `pdf_file`
- `answer_text`
- `result` (contains overall marks, per-question feedback [XAI for LLM], and explanation)
- optional `cheat_detection` (risk scores and cluster info)
- optional `reevaluation_history` (list of reevaluation events)

### 12.3 `classroom_students`
- teacher linkage
- roll number / normalized name
- `history` entries (`session_id`, marks, timestamp)

### 12.4 `student_requests`
- `rollnum`
- `student_name`
- `session_id`
- `reason`
- `status` (`pending`, `approved`, `rejected`)
- created/approved/rejected timestamps
- optional rejection reason

## 13. Frontend Functional Views

### 13.1 Home and marketing shell
- Landing page with product framing and call-to-actions.

### 13.2 Auth views
- University/teacher authentication.
- Student authentication.

### 13.3 University Admin Dashboard
- Add/list/delete teachers.
- **No analytics or reporting view.**

### 13.4 Teacher Dashboard
- Session setup and management.
- ZIP script upload.
- Results retrieval and CSV/XLSX export.
- Per-session analytics view.
- OMI (insights) view for session analysis.
- QCP (question paper generation) view.
- Class roster and student detail view.
- Reevaluation request operations.
- **No real-time monitoring dashboard.**

### 13.5 Student Dashboard
- Result listing by roll number.
- Reevaluation request submission per session.

## 13.6 Source Code Modules
Detailed implementation logic can be found in:
- [Engine/OCR/ocr.py](./Engine/OCR/ocr.py): OCR fallback logic.
- [Engine/grade/nlp.py](./Engine/grade/nlp.py): NLP grading engine.
- [Engine/grade/llm.py](./Engine/grade/llm.py): LLM grading engine.
- [Engine/cheat_detection/main.py](./Engine/cheat_detection/main.py): Cheat detection entry point.
- [backend/worker/work.py](./backend/worker/work.py): Main Celery task implementations.

## 14. Testing and Validation

The repository contains 23 Python test files under [tests/](./tests/) covering:
- auth flows,
- route behavior,
- worker processing,
- cheat detection,
- NLP grading units,
- OCR fallback behavior,
- session analytics,
- OMI helper endpoints.

Run tests:
```bash
pytest
```

## 15. Production Notes and Known Limitations

### 15.1 Current Constraints
- **No external queue required:** SQLite-backed Celery is simple but intended for single-worker deployments.
- **No real-time monitoring:** Teacher dashboard has no live progress display. Use REST API polling for status.
- **No university analytics dashboard:** Analytics are available only at per-session level, not aggregated across all sessions.
- **REST API only:** No WebSocket support for live updates (polling is required).

### 15.2 Security & Operational Notes
- **Ollama Service Requirement:** For production VM deployments, the Ollama service/daemon must be installed and running on the host or a reachable server. Ensure the required models (e.g., `gemma4:31b-cloud`, `qwen3-coder-next:cloud`) are pulled using `ollama pull <model_name>`. The application communicates with the Ollama API; merely installing the python library is insufficient.
- Production should upgrade Celery to use managed Redis/RabbitMQ for robustness at scale.
- [backend/config.py](./backend/config.py) enforces required env checks and CORS restrictions in production mode.
- Sensitive keys (JWT_SECRET, API keys) must be managed via secure vaults in production.

### 15.3 Dependency Source of Truth
- [backend/pyproject.toml](./backend/pyproject.toml) natively handles dependencies (PEP-621); [requirements.txt](./requirements.txt) provided for backward compatibility.

## 16. Claims, Benchmarks, and Evidence Policy

This repository prioritizes evidence-based documentation. All claims in sections 1-15 are verifiable by examining the source code in this repository.

## 17. Future Roadmap

We are actively evolving OmniMark AI. The following features are under exploration for future integration:

- **LMS Integration**: Standardized adapters for Moodle, Canvas, and Blackboard for automated roster and grade syncing.
- **SMS & Email Notifications**: Automated alerts for processing completion and reevaluation updates.
- **Student Script Visibility**: Secure student access to their evaluated answer scripts.
- **Advanced Comparative Analytics**: Longitudinal cohort insights and question difficulty profiling.
- **Real-time Monitoring Dashboard**: Live processing progress for teachers.
- **University-wide Analytics**: Aggregated reporting and trends across all sessions and teachers.
- **WebSocket Support**: Real-time status updates instead of polling.
