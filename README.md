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

- Automated answer evaluation with two correction modes:
  - NLP mode for deterministic and fast scoring
  - LLM mode for contextual and nuanced evaluation
- OCR pipeline for handwritten script processing
- Session-oriented exam management (create, upload, process, monitor)
- Cheating-risk analysis using multi-signal similarity scoring
- Teacher dashboard with aggregate stats and trends
- OMI insights module for AI-based academic recommendations
- QCP module for automated question paper generation
- Re-evaluation request flow for student-side correction disputes

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
- Background tasks run long processing jobs asynchronously.
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
                                   |      (AI Logic Core)      |
                                   +-------------+--------------+
                                                 |
          +-------------------+------------------+-------------------+-------------------+
          |                   |                  |                   |                   |
+---------v--------+ +--------v---------+ +------v-------+ +---------v---------+ +-------v--------+
|      Grade       | | OMI Assistant    | | Cheat Detect | | Dashboard Data    | |       QCP      |
|------------------| |------------------| |--------------| | Generator          | |----------------|
| - AI paper       | | - AI support     | | - Detects    | | - Analytics        | | - Generates    |
|   grading        | | - Query handling | |   malpractice| | - Dashboard data   | |   question     |
|                  | |                  | |              | |                     | |   papers       |
+------------------+ +------------------+ +--------------+ +---------------------+ +----------------+

```
## Tech Stack

Backend:
- FastAPI
- Pydantic
- JWT + Bcrypt authentication
- MongoDB (`pymongo`)

AI/ML Engine:
- Ollama-backed LLM inference
- PaddleOCR + `pdf2image`
- NLTK
- `sentence-transformers`
- Scikit-learn
- NumPy, Pandas

Frontend:
- React 19 + TypeScript + Vite
- Tailwind CSS
- React Router DOM
- Recharts
- Axios

## Repository Structure

```text
omnimark.ai/
├── backend/                 # FastAPI server, auth, worker orchestration
├── Engine/                  # NLP, LLM, OCR, cheat detection, OMI, QCP modules
├── frontend/                # React + TypeScript dashboard client
├── uploads/                 # Runtime upload artifacts (local)
├── logs/                    # Runtime logs
├── media/                   # Screenshots for documentation
├── docker-compose.yml
├── requirements.txt
└── README.md
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

This runs backend + frontend concurrently using root scripts.

### Option B: Run services manually

Backend:

```bash
pip install -r requirements.txt
cd backend
fastapi dev app.py
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
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

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
7. Cheating report is generated.
8. Teacher reviews dashboard and OMI insights.


## Operational Notes

- Long-running operations are asynchronous; poll `GET /session/{session_id}/status`.
- OCR and LLM grading are compute-intensive; resource sizing matters for large batches.
- Keep `uploads/` and `logs/` out of version control in production environments.
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

## Roadmap

- Role-based access policies for multi-campus environments
- Better observability (job queues, tracing, structured logs)
- Bulk export pipelines (CSV/PDF institutional reports)
- Pluggable LLM provider abstraction
- CI/CD and container-first production profile

## Contributing

Contributions are welcome.

Suggested process:
1. Create a feature branch.
2. Make focused changes with clear commit messages.
3. Validate backend and frontend locally.
4. Open a pull request with screenshots for UI changes.
