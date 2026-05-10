# OmniMark AI

AI-powered academic evaluation platform for universities, departments, and educators.

OmniMark AI helps academic teams run end-to-end assessment workflows: session creation, script uploads, automated grading (NLP or LLM), cheating-risk analysis, dashboard insights, and question paper generation.

## Table of Contents

1. [Overview](#overview)
2. [Core Capabilities](#core-capabilities)
3. [System Architecture](#system-architecture)
4. [Tech Stack](#tech-stack)
5. [Repository Structure](#repository-structure)
6. [Getting Started](#getting-started)
7. [Configuration](#configuration)
8. [Run the Project](#run-the-project)
9. [API Reference (High-Level)](#api-reference-high-level)
10. [Evaluation Workflow](#evaluation-workflow)
11. [Photos / Screenshots](#photos--screenshots)
12. [Operational Notes](#operational-notes)
13. [Troubleshooting](#troubleshooting)
14. [Roadmap](#roadmap)
15. [Contributing](#contributing)
16. [License](#license)

## Overview

OmniMark AI is designed as a practical academic operations platform, not just a grading demo. It combines deterministic NLP techniques, LLM-based assessment, OCR for handwritten documents, and statistical analytics to support reliable and scalable evaluation workflows.

Primary users:
- Teachers and evaluators
- Department coordinators
- University administrators
- Students (for results viewing and reevaluation requests)

## Photos / Screenshots

## 📸 Platform Preview

<div align="center">

<table>
<tr>
<td align="center" width="50%">

### 📊 Dashboard Overview
<img src="media/dashbord.png" alt="Dashboard Overview" width="95%" />

</td>

<td align="center" width="50%">

### ⚙️ Session Setup
<img src="media/evalution_config_v1.png" alt="Session Setup" width="95%" />

</td>
</tr>

<tr>
<td align="center" width="50%">

### 📈 Evaluation Analytics
<img src="media/evalution_analysis.png" alt="Analytics" width="95%" />

</td>

<td align="center" width="50%">

### 🤖 OMI AI Insights
<img src="media/omi.png" alt="OMI Assistant" width="95%" />

</td>
</tr>
</table>

</div>

## Core Capabilities

- **Automated AI Evaluation Engine** with dynamic correction modes:
  - **NLP Mode (Deterministic):** Fast scoring utilizing Sentence Transformers (`model.encode`), NLTK-based text preprocessing, and weighted scoring (80% semantic similarity, 15% keyword overlap, 5% length normalization).
  - **LLM Mode (Generative):** Context-rich grading using Ollama-backed LLMs for complex, multi-part subjective answers and nuanced qualitative feedback.
- **Robust Handwriting & Document Processing:** Advanced OCR pipeline using PaddleOCR and `pdf2image`, coupled with regex-based artifact cleaning algorithms for noisy scanned scripts (e.g. collapsing repeated character artifacts).
- **Advanced Cheat Detection Engine:** Employs a multi-signal risk matrix (45% Semantic, 20% Lexical Jaccard, 15% Sequence Match, 15% Rare-overlap TF-IDF, 5% Length similarity) and utilizes **DBSCAN Clustering (eps=0.22, min_samples=2)** on high-dimensional embeddings to identify organized cheating cohorts and suspicious similarity bands. Includes adaptive thresholding to minimize false positives.
- **Session-Oriented Exam Management:** Asynchronous, worker-driven processing for bulk uploads (ZIP), enabling scalable institutional deployments via Celery workers.
- **OMI (OmniMark Intelligence) Analytics:** AI-generated interpretations of class performance trends, highlighting knowledge gaps using statistical aggregations (NumPy, Pandas).
- **QCP (Question Paper Creator):** Automated, constraint-based question paper generation optimizing for cognitive load distribution.
- **Student Transparency & Re-evaluation:** Dedicated student module with result visibility and a structured, traceable re-evaluation request flow for correction disputes.

## Problem Statement & Requirements Fulfillment

**Problem Statement:** Manual evaluation at an institutional scale is time-consuming, subjective, and inconsistent. External reports indicate that evaluating a 10-question paper can take around 20-30 minutes per student for quality checking, and large-scale re-evaluation studies report frequent marking errors in manual workflows. Educators lack robust tooling for scalable cheating analysis, analytics-driven interventions, and transparent re-evaluation workflows. Students lack direct, immediate visibility into detailed outcomes and a structured way to request correction reviews. This project direction is supported by the research summary in [`manual_paper_evaluation_research.md`](./manual_paper_evaluation_research.md).

**Evidence Snapshot (Problem vs OmniMark AI):**
- Manual checking benchmark: ~20-30 minutes per student for a 10-question paper (source: [Eklavvya](https://www.eklavvya.com/blog/improve-answer-sheet-checking-accuracy/)).
- Manual accuracy concern: external reporting highlights high marking-error rates discovered during re-evaluation in major exams (source: [Eklavvya](https://www.eklavvya.com/blog/improve-answer-sheet-checking-accuracy/)).
- OmniMark AI benchmark (project observation): model-based correction completes in ~3 minutes with ~95% average accuracy.
- Additional context on digitized grading workflows: [Turnitin Feedback Studio](https://www.turnitin.com/blog/turn-over-a-new-leaf-grading-paper-based-assignments-in-feedback-studio).

**Requirements Fulfillment:**
- **Automated Grading:** Implemented a dual-engine architecture (NLP deterministic + LLM generative) to handle both factual and subjective answers, fulfilling the requirement for scalable, accurate assessment.
- **Academic Integrity:** Integrated an advanced DBSCAN clustering-based cheat detection engine that flags suspicious cohorts using multi-signal analysis, directly addressing the need for robust malpractice detection.
- **End-to-End Workflow:** Built distinct modules for Universities/Teachers (session management, analytics) and Students (result visibility, re-evaluation requests), fully satisfying the requirement for an integrated academic transparency loop.
- **Handwritten Script Support:** Integrated PaddleOCR and pdf2image to reliably process handwritten answer sheets, ensuring compatibility with traditional examination formats.

## Code Quality & Best Practices

OmniMark AI is built with a strong emphasis on maintainability, scalability, and robustness:
- **Measured Testing:** The backend test suite currently passes with **32 pytest tests** and **81% measured coverage** using `pytest --cov=. --cov-report=term-missing`. The report is intentionally based on actual local output, not projected or synthetic numbers. For full details, see [`test_coverage_report.md`](./test_coverage_report.md).
- **Modular Architecture:** Clean separation of concerns across the FastAPI orchestration layer, React/TypeScript frontend, and the standalone AI/ML `Engine` (OCR, grading, clustering).
- **Asynchronous Processing:** Long-running OCR, grading, and cheat detection work is submitted through Celery worker tasks. Local development uses a SQLite-backed Celery broker by default; production deployments should configure `CELERY_BROKER_URL` and `CELERY_RESULT_BACKEND` for Redis or RabbitMQ-backed infrastructure.
- **Type Safety & Validation:** Comprehensive use of Pydantic models in the backend for rigorous request/response validation, paired with TypeScript on the frontend to eliminate runtime type errors.
- **Algorithmic Efficiency:** The cheat detection engine employs adaptive thresholding and early-exit heuristics (skipping non-suspicious token counts) to prevent O(N²) time complexity explosions when analyzing large student cohorts.
- **Security:** Secure JWT-based role-aware authentication patterns with Bcrypt password hashing and safe environment variable configurations.
- **Clean Code:** Adherence to PEP 8 standards in Python, DRY principles, centralized helper functions (`remove_stop_words`, `get_lemmatized_words`), and detailed docstrings/logging for observability.

## System Architecture

High-level flow:

1. Teacher creates an evaluation session with reference documents.
2. Student scripts are uploaded as ZIP.
3. Background worker processes each script (OCR optional).
4. Scripts are graded by selected engine (NLP or LLM).
5. Results are stored and surfaced in dashboard APIs.
6. Cheating analysis runs post-grading (or manually).
7. OMI generates guidance from aggregate performance metrics.

Core execution model:
- FastAPI application handles API and orchestration.
- MongoDB stores users, sessions, results, and analysis artifacts.
- Background tasks run long processing jobs asynchronously via Celery workers.
- React frontend provides dashboards and workflow UI.

### System Architecture Overview

```text
+------------------+
|     Frontend     |
|     (Web/UI)     |
+---------+--------+
          |
      HTTP / API
          |
+---------v--------------------------------------------------+
|                        Backend                             |
|                                                            |
|   +----------------------+      +----------------------+   |
|   |    Core Backend      |----->|        Worker        |   |
|   |----------------------|      |----------------------|   |
|   | - API Handling       |      | - Receives Tasks     |   |
|   | - Authentication     |      | - Processes Tasks    |   |
|   | - Database Access    |      | - Communicates       |   |
|   | - Task Management    |      |   with Engine        |   |
|   | - Logging            |      | - Returns Results    |   |
|   +----------------------+      +----------+-----------+   |
|                                                |           |
+------------------------------------------------|-----------+
                                                 |
                                            Send Task
                                                 |
                                   +-------------v--------------+
                                   |         Engine             |
                                   |      (AI Logic Core)       |
                                   +-------------+--------------+
                                                 |
          +-------------------+------------------+-------------------+-------------------+
          |                   |                  |                   |                   |
+---------v--------+ +--------v---------+ +------v-------+ +---------v---------+ +-------v--------+
|      Grade       | | OMI Assistant    | | Cheat Detect | | Dashboard Data    | |       QCP      |
|------------------| |------------------| |--------------| | Generator         | |----------------|
| - AI paper       | | - AI support     | | - Detects    | | - Analytics       | | - Generates    |
|   grading        | | - Query handling | |   malpractice| | - Dashboard data  | |   question     |
|                  | |                  | |              | |                   | |   papers       |
+------------------+ +------------------+ +--------------+ +-------------------+ +----------------+

```
## Tech Stack

Backend:
- FastAPI (~0.136.1)
- Pydantic (~2.13.3)
- JWT (`pyjwt~=2.12.1`) + Bcrypt authentication
- MongoDB (`pymongo~=4.17.0`)
- Celery (`celery~=5.4.0`)

AI/ML Engine:
- Ollama-backed LLM inference
- PaddleOCR (`paddleocr~=2.7.3`) + `pdf2image`
- NLTK (`nltk~=3.9.4`)
- Sentence-Transformers (`sentence-transformers~=5.4.1`)
- Scikit-learn (`scikit-learn~=1.8.0`)
- NumPy, Pandas

Frontend:
- React 19 + TypeScript + Vite
- Tailwind CSS 4
- React Router DOM
- Recharts
- Axios

## Repository Structure

```text
omnimark.ai/
├── backend/                 # FastAPI server, auth, worker orchestration
├── Engine/                  # NLP, LLM, OCR, cheat detection, OMI, QCP modules
├── frontend/                # React + TypeScript dashboard client
├── tests/                   # Pytest automated testing suite
├── uploads/                 # Runtime upload artifacts (local)
├── logs/                    # Runtime logs
├── media/                   # Screenshots for documentation
├── docker-compose.yml       # Docker deployment configuration
├── requirements.txt         # Python dependencies
├── package.json             # Root monorepo scripts for install and dev
└── README.md                # Project documentation
```

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm 9+
- MongoDB running locally or remotely
- Ollama (or equivalent configured LLM endpoint)
- Poppler (required by `pdf2image` on many systems)

### Clone

```bash
git clone https://github.com/karthik132007/omnimark.ai.git
cd omnimark.ai
```

## Configuration

Create or update `.env` at repository root with required values.

Suggested baseline keys:

```env
MONGO_URI=mongodb://localhost:27017
DB_NAME=omnimark
JWT_SECRET=change_this_secret
JWT_EXPIRE_MIN=1440
OLLAMA_BASE_URL=http://localhost:11434
```

Note:
- Exact variables may evolve; align with values referenced in backend config usage.
- Do not commit real credentials.

## Run the Project

### Option A: Single command (recommended)

```bash
npm run install-all
npm run dev
```

This runs backend + frontend concurrently using root scripts (`concurrently`).

### Option B: Run services manually

Backend:

```bash
pip install -r requirements.txt
cd backend
../.venv/bin/uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Default local endpoints:
- Backend: `http://127.0.0.1:8000`
- Frontend: `http://localhost:5173`

## API Reference (High-Level)

Authentication:
- `POST /auth/univ/register`
- `POST /auth/login`
- `POST /auth/student/login`
- `GET /teachers/me`

Dashboard and insights:
- `GET /dashboard/teacher_stats`
- `GET /dashboard/teacher_summary`
- `GET /omi/analyze`
- `GET /session/{session_id}/stats`

Session management:
- `POST /session/create`
- `GET /sessions`
- `GET /session/{session_id}`
- `DELETE /session/{session_id}`
- `POST /session/{session_id}/upload_zip`
- `POST /session/{session_id}/process`
- `GET /session/{session_id}/status`
- `GET /session/{session_id}/results`

Cheating analysis:
- `POST /session/{session_id}/cheat_detection`
- `GET /session/{session_id}/cheat_report`

The advanced cheat detection engine utilizes a multi-vector similarity score (45% Semantic Cosine, 20% Jaccard Lexical, 15% Sequence Match, 15% Rare-overlap TF-IDF, 5% Length) and applies **DBSCAN clustering** (`eps=0.22`, `min_samples=2`) to group highly correlated answers. This allows teachers to inspect not just suspicious isolated pairs, but the broader similarity cohorts they belong to, providing deep insights into coordinated academic malpractice.

Teacher/student and re-evaluation:
- `GET /teacher/my-class`
- `GET /teacher/my-class/{rollnum}`
- `GET /student/{rollnum}/results`
- `POST /student/{rollnum}/request-reevaluation`
- `POST /session/{session_id}/student/{student_name}/reevaluate`
- `GET /teacher/reevaluation-requests`
- `POST /teacher/reevaluation-requests/{request_id}/approve`
- `POST /teacher/reevaluation-requests/{request_id}/reject`

Question paper generation:
- `POST /QCP`

Health check:
- `GET /health`

## Evaluation Workflow

1. Create session with question paper and model answer.
2. Upload student scripts as ZIP.
3. Trigger processing.
4. Worker extracts text (OCR if handwritten mode is enabled).
5. Grading engine computes score + feedback.
6. Session results are persisted.
7. Cheating report is generated with pairwise scoring and answer clustering.
8. Teacher reviews dashboard and OMI insights.


## Operational Notes

- Long-running operations are asynchronous; poll `GET /session/{session_id}/status`.
- OCR and LLM grading are compute-intensive; resource sizing matters for large batches.
- Keep `uploads/`, `tests/`, and `logs/` out of version control in production environments.
- For institutional deployments, prefer managed MongoDB and controlled object storage.

## Troubleshooting

Common issues:
- Backend starts but grading fails:
  - Verify Ollama endpoint/model availability.
- OCR output is empty or poor:
  - Validate scan quality and Poppler/PaddleOCR installation.
- ZIP upload accepted but no results:
  - Check server logs and session status endpoint.
- Auth errors after login:
  - Confirm `JWT_SECRET` and token expiry settings.

## Roadmap & Future Scope

To further revolutionize academic evaluation, we have identified the following futuristic enhancements:
- **Federated Learning for Grading Models:** Enable cross-university model training on grading patterns without sharing sensitive student PII or raw answer scripts, utilizing federated averaging.
- **Multimodal Real-Time Proctoring:** Integrate edge AI computer vision (gaze tracking, head pose estimation) and ambient audio anomaly detection to flag suspicious behavior synchronously during remote exams.
- **Blockchain-Backed Immutable Grade Verification:** Store hashed, cryptographically signed evaluation results on a distributed ledger to prevent post-evaluation tampering and ensure absolute academic integrity.
- **Generative Synthetic Dataset Augmentation:** Use advanced LLMs to generate synthetic student answers spanning varying levels of correctness and edge cases to continuously train and fine-tune local grading models.
- **Self-Supervised Handwriting Recognition:** Implement self-supervised transformer models tailored for extremely low-quality scans and zero-shot multilingual handwritten script recognition.
- **Explainable AI (XAI) Grading Reports:** Implement attention-map visualizations for NLP/LLM grading, showing teachers and students exactly which sentences or phrases contributed positively or negatively to the final score.

## Contributing

Contributions are welcome.

Suggested process:
1. Create a feature branch.
2. Make focused changes with clear commit messages.
3. Validate backend and frontend locally (run `pytest`).
4. Open a pull request with screenshots for UI changes.
