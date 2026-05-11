# OmniMark AI - Technical Project Documentation

## Document Control
- Project: OmniMark AI
- Repository scope reviewed: backend, engine modules, frontend, worker, tests, configuration files
- Purpose: factual, implementation-backed technical documentation for engineering review and hackathon evaluation
- Method: code-first documentation rewrite (no speculative feature claims)

## 1. Executive Overview

OmniMark AI is an integrated academic evaluation platform that automates large parts of answer-sheet assessment while preserving teacher control for final decisions and reevaluation.

The system is built around:
- structured role-based access (university, teacher, student),
- session-centric exam processing,
- asynchronous grading orchestration,
- multimodal text extraction (OCR + native PDF text paths),
- dual grading engines (NLP and LLM),
- cheating-risk analytics and clustering,
- teacher-facing analytics and recommendation outputs,
- student reevaluation request lifecycle.

This document represents the currently implemented system behavior.

## 2. Problem Context and Design Intent

At institutional scale, manual evaluation creates pressure across three dimensions:
- throughput: large script volumes and tight publication timelines,
- consistency: subjective variance in marking quality,
- visibility: delayed feedback loops for teachers and students.

OmniMark AI addresses these pressures through a pipeline that standardizes session setup, automates batch processing, and introduces observability into grading and risk patterns.

## 3. Implemented Functional Scope

### 3.1 Identity and Role Model

Roles in active use:
- **University**: administrative owner of teacher accounts.
- **Teacher**: session owner and primary evaluator/reviewer.
- **Student**: result consumer and reevaluation requester.

Auth implementation includes:
- JWT issuance and role propagation.
- Optional-user decoding for routes that can work in both open and secured contexts.
- Backward compatibility logic for email casing and legacy password storage.

### 3.2 Session-Centric Evaluation Lifecycle

Each evaluation cycle is modeled as a **session** with:
- a question paper,
- a teacher model answer,
- grading preferences,
- correction mode,
- uploaded student answer bundle.

Lifecycle transitions:
1. `created`
2. `uploaded`
3. `processing`
4. `processed`

The lifecycle is persisted in MongoDB and mirrored in frontend workflow navigation.

### 3.3 Asynchronous Processing and Task Boundaries

#### Task A: `process_session`
Responsibilities:
- unzip uploaded archive,
- discover PDF submissions,
- auto-map student identity from filename,
- extract answer text using OCR/non-OCR path,
- dispatch to chosen grading engine,
- persist result rows,
- update class roster history,
- maintain progress counters,
- transition session state,
- trigger cheat-detection phase.

#### Task B: `check_cheat_in_session`
Responsibilities:
- collect answer texts from results (with fallback extraction for legacy records),
- run cheating analysis,
- persist session-level risk report,
- persist per-student risk metadata.

### 3.4 Grading Engine Implementations

#### NLP Engine
Current logic composes a weighted score from:
- semantic similarity,
- keyword overlap,
- answer-length adequacy.

Behavioral controls include:
- language exam mode handling,
- min-answer-length normalization,
- mark capping to configured maximum.

#### LLM Engine
Current logic:
- builds strict JSON prompt with grading constraints,
- calls configured provider/model,
- parses JSON response,
- returns explicit error payload when model output is non-JSON.

Also supports a dedicated reevaluation prompt flow.

### 3.5 OCR and Text Acquisition Strategy

For handwritten/scanned workflows:
- PDFs are rendered to images per page.
- OCR fallback chain is applied for robustness.

For non-handwritten workflows:
- direct PDF text extraction path with normalization logic that attempts to fix extraction artifacts.

This dual-path approach is implemented and selected per-session preference (`is_handwritten`).

### 3.6 Cheating-Risk Analytics

Risk analysis is not a single-signal check.
The implemented engine calculates pairwise similarity using multiple complementary signals and synthesizes a score.

Implemented capabilities:
- pair ranking and suspicious-flag filtering,
- per-student risk summarization,
- cluster-level grouping via DBSCAN,
- response payload with pair, student, cluster, and summary sections.

### 3.7 Teacher Analytics and OMI Layer

Dashboard summary aggregation computes:
- macro metrics,
- temporal trends,
- common mistake categories,
- topper snapshots,
- score distributions,
- risk-band segmentation.

OMI (`/omi/analyze`) consumes this structured summary and produces JSON-formatted instructional insights.

### 3.8 Reevaluation Governance

Implemented request loop:
- Student creates request with reason.
- Teacher reviews and resolves request.
- Approve path triggers reevaluation and result overwrite with historical trace.
- Reject path captures reason and timestamp.

This preserves an auditable result-change history per evaluated script.

### 3.9 Question Paper Composer

QCP endpoint supports generating question papers from:
- requested structure/preferences,
- uploaded relevant reference content,
- teacher custom instructions.

Response is expected in JSON form and parser safeguards are present.

## 4. System Architecture

### 4.1 Component Topology

- **Presentation layer**: React application with role-specific routes and views.
- **Application layer**: FastAPI route handlers, authorization, orchestration.
- **Processing layer**: Celery workers for heavy/background workloads.
- **Intelligence layer**: Engine modules for OCR, grading, risk scoring, and insight generation.
- **Persistence layer**: MongoDB collections for users, sessions, results, requests, and classroom aggregates.

### 4.2 Control-Plane vs Data-Plane Separation

- Control plane: API validation, role checks, session transitions.
- Data plane: OCR/grading/risk computations executed out-of-band through task workers.

This separation enables non-blocking API behavior under heavy script batches.

## 5. Backend API Surface (Implemented)

### 5.1 Health
- `GET /health`

### 5.2 Authentication and User Management
- `POST /auth/univ/register`
- `POST /auth/login`
- `POST /auth/student/login`
- `GET /teachers/me`

### 5.3 University Operations
- `POST /univ/teachers`
- `GET /univ/teachers`
- `PUT /univ/teachers/{teacher_id}`
- `DELETE /univ/teachers/{teacher_id}`

### 5.4 Session Operations
- `POST /session/create`
- `GET /sessions`
- `GET /session/{session_id}`
- `DELETE /session/{session_id}`
- `POST /session/{session_id}/upload_zip`
- `POST /session/{session_id}/process`
- `GET /session/{session_id}/status`
- `GET /session/{session_id}/results`

### 5.5 Analytics and OMI
- `GET /dashboard/teacher_stats`
- `GET /dashboard/teacher_summary`
- `GET /omi/analyze`
- `GET /session/{session_id}/stats`

### 5.6 Cheating Risk
- `POST /session/{session_id}/cheat_detection`
- `GET /session/{session_id}/cheat_report`

### 5.7 Classroom, Student, and Reevaluation Flows
- `GET /teacher/my-class`
- `GET /teacher/my-class/{rollnum}`
- `GET /student/{rollnum}/results`
- `POST /student/{rollnum}/request-reevaluation`
- `GET /teacher/reevaluation-requests`
- `POST /teacher/reevaluation-requests/{request_id}/approve`
- `POST /teacher/reevaluation-requests/{request_id}/reject`
- `POST /session/{session_id}/student/{student_name}/reevaluate`

### 5.8 Question Paper Composer
- `POST /QCP`

## 6. Data Persistence Model (Observed)

### 6.1 Collections in runtime usage
- `users`
- `students`
- `sessions`
- `results`
- `classroom_students`
- `student_requests`

### 6.2 Session document role
`session` is the orchestration anchor. It stores metadata, processing status, preferences, teacher ownership, and cheat-detection report references.

### 6.3 Result document role
Each result row captures student-level evaluation output and optional appended structures such as:
- `cheat_detection` summary,
- `reevaluation_history` audit trail.

### 6.4 Classroom aggregate role
`classroom_students` acts as teacher-scoped longitudinal student history built from per-session processing.

## 7. Frontend Application Design (Implemented)

### 7.1 Route map
- `/`
- `/auth`
- `/univ-dashboard`
- `/teacher-dashboard`
- `/student-auth`
- `/student-dashboard`

### 7.2 Teacher dashboard orchestration
The teacher page coordinates:
- session creation,
- upload validation and progress display,
- status polling for in-flight processing,
- analytics and OMI views,
- QCP generation,
- classroom drill-down,
- reevaluation actions.

### 7.3 University dashboard
University admin can manage teacher list directly from UI.

### 7.4 Student dashboard
Student can inspect evaluated sessions and submit reevaluation requests.

## 8. Configuration and Environment Controls

### 8.1 Mandatory startup checks
The backend enforces:
- database URI presence,
- JWT secret presence,
- production CORS restrictions.

### 8.2 LLM provider flexibility
System supports:
- local/provider-based Ollama usage,
- OpenAI-compatible route through configured base URL and key.

### 8.3 Celery transport defaults
Development defaults are SQLite-backed when broker/backend are unset.
Production deployments should explicitly provide durable message broker and backend.

## 9. Deployment and Operations

### 9.1 Local run path
- install Python + frontend dependencies,
- run API and frontend (`npm run dev`),
- run Celery worker in separate process.

### 9.2 Docker compose path
Repository includes `docker-compose.yml` with services for:
- backend
- frontend
- mongodb

### 9.3 Operational observability
Processing progress is exposed via session status endpoint fields (`processed`/`total_files`).
Cheat detection exposes runtime status (`running/completed/failed`) and timestamps.

## 10. Testing and Validation Coverage

The repository contains a multi-file pytest suite (16 files) that exercises:
- authentication and role flows,
- route behaviors,
- worker pipeline logic,
- OCR fallback path behavior,
- cheat detection unit behavior,
- NLP grading unit behavior,
- dashboard metric generation behavior,
- OMI-related endpoint behavior.

This provides good functional confidence for current implemented pathways.

## 11. Engineering Strengths (Evidence-Based)

1. **Complete role-based workflow implementation** from account creation to student reevaluation requests.
2. **Asynchronous processing architecture** for heavy workloads via Celery.
3. **Multi-strategy text extraction** improving robustness for real-world input quality variance.
4. **Hybrid grading strategy** supporting deterministic NLP scoring and LLM-based contextual evaluation.
5. **Cheat detection beyond naive similarity** with multi-signal scoring and semantic clustering.
6. **Practical observability endpoints** that expose progress and reports for UI consumption.

## 12. Known Risks and Limitations (Code-Observed)

1. Student auto-provisioning currently uses a static default password (`12345678`) and should be replaced in hardened environments.
2. SQLite Celery transport defaults are development-focused; production-grade queues should use Redis/RabbitMQ.
3. `backend/pyproject.toml` is minimal and not a full dependency definition; runtime dependency truth is in `requirements.txt`.
4. OCR quality and LLM output quality remain model/input dependent and should be monitored per deployment context.

## 13. Claims and Evidence Policy for Hackathon Review

### 13.1 Accuracy and speed claims
Historical project documentation mentions approximately:
- 95% accuracy,
- 3-minute processing.

In the current repo, these values are narrative/project-reported claims and are not enforced by an automated benchmark harness in tests.

### 13.2 Recommended presentation framing
For external judging, present those figures as:
- **team-observed outcomes**,
- not universal guarantees,
- and pair them with reproducibility plans (fixed datasets, benchmark script, and repeated runs).

This protects factual integrity while still communicating project direction.

## 14. Suggested Next Hardening Milestones

1. Introduce benchmark harness for reproducible latency/accuracy reporting.
2. Replace static student default credentialing with secure onboarding/reset flow.
3. Move Celery production profile to managed Redis/Rabbit and tune concurrency.
4. Add explicit schema docs (OpenAPI examples + collection contracts).
5. Add integration tests for full session pipelines with representative fixture PDFs.

## 15. Conclusion

OmniMark AI, as currently implemented, is a substantial full-stack evaluation platform with real operational depth:
- role-based governance,
- asynchronous processing,
- integrated OCR and grading strategies,
- cheating-risk intelligence,
- analytics and recommendation surfaces,
- reevaluation control loop.

From a hackathon perspective, the project demonstrates strong systems integration, realistic workflow design, and clear extensibility toward production-grade deployments.
