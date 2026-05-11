# OmniMark AI - Technical Project Documentation

## Document Control
- Project: OmniMark AI
- Repository scope reviewed: backend, engine modules, frontend, worker, tests, configuration files
- Purpose: factual, implementation-backed technical documentation for engineering review
- Method: code-first documentation rewrite
- **Live Demo**: [http://13.204.156.83](http://13.204.156.83) (Deployed on AWS)
- **Deployment Mode**: Fully Dockerized
- **Last Updated**: 2026-05-11

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

**Lifecycle transitions:**
1. `created` — Session initialized with metadata
2. `uploaded` — Student answer ZIP archive uploaded
3. `processing` — Asynchronous worker processing in flight
4. `processed` — All answers graded and cheat detection complete; session final state

The lifecycle is persisted in MongoDB and mirrored in frontend workflow navigation. Once `processed`, the session stores a frozen `student_rollnums` array containing all evaluated student roll numbers.

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
- maintain progress counters (`processed` / `total_files`),
- collect and store evaluated student roll numbers,
- trigger cheat-detection phase,
- transition session state to `processed` with frozen student_rollnums,
- trigger teacher notification service.

#### Task B: `check_cheat_in_session`
Responsibilities:
- collect answer texts from results (with fallback extraction for legacy records),
- run cheating analysis,
- persist session-level risk report,
- persist per-student risk metadata,
- update cheat detection status and timestamps.

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
- builds strict JSON prompt with grading constraints that explicitly request Explainable AI (XAI) outputs such as per-question feedback. Note: This per-question explainability is available only when using LLM-based evaluation.
- calls configured provider/model,
- parses JSON response,
- returns explicit error payload when model output is non-JSON.

Also supports a dedicated reevaluation prompt flow via `LLM_Reevaluate()`.

### 3.5 OCR and Text Acquisition Strategy

For handwritten/scanned workflows:
- PDFs are rendered to images per page.
- Pages are processed in parallel using in-memory buffers avoiding intermediary file I/O operations.
- OCR fallback chain is applied for robustness.

For non-handwritten workflows:
- direct PDF text extraction path with normalization logic that attempts to fix extraction artifacts (line wrapping, multi-word splitting, list markers).

This dual-path approach is implemented and selected per-session preference (`is_handwritten`).

### 3.6 Cheating-Risk Analytics

Risk analysis is not a single-signal check.
The implemented engine calculates pairwise similarity using multiple complementary signals and synthesizes a score.

Implemented capabilities:
- pair ranking and suspicious-flag filtering,
- per-student risk summarization,
- cluster-level grouping via DBSCAN,
- response payload with pair, student, cluster, and summary sections,
- embedded per-student risk metadata in result records (risk_level, risk_score, max_pair_score, flagged_pairs, matched_with, cluster_id, cluster_size).

### 3.7 Teacher Analytics and OMI Layer

Dashboard summary aggregation computes:
- macro metrics,
- temporal trends,
- common mistake categories,
- topper snapshots,
- score distributions,
- risk-band segmentation.

The frontend Analytics view (see `frontend/src/components/teacher-dashboard/AnalyticsView.tsx`) provides a **CSV/Excel Export** functionality for session results, enabling institutional record-keeping and downstream analysis.

OMI (`/omi/analyze`) consumes structured summary data and produces JSON-formatted instructional insights.

### 3.8 Reevaluation Governance

Implemented request loop:
- Student creates request with reason.
- Teacher reviews and resolves request via approve/reject workflow.
- **Approve path**: Triggers LLM reevaluation with previous result context, overwrites result, appends historical audit entry.
- **Reject path**: Captures rejection reason and timestamp, preserves original result.

This preserves an auditable `reevaluation_history` trail per evaluated script with actor, timestamp, before/after state.

### 3.9 Notification Service (Implemented)

The system features a centralized `NotificationService` (`backend/services/notification.py`) that handles:
- **Session Completion**: Notifies teachers when a background evaluation task finishes.
- **Reevaluation Updates**: Notifies students when their request is approved or rejected.
- **Multi-channel Support**: SMTP for emails and Twilio for SMS.

### 3.10 Question Paper Composer

QCP endpoint (`POST /QCP`) supports generating question papers from:
- requested structure/preferences (difficulty, max_marks, number of questions, course, choice availability/type),
- uploaded relevant reference content PDF,
- teacher custom instructions.

Response is expected in JSON form and parser safeguards are present.

## 4. System Architecture

### 4.1 Component Topology

- **Presentation layer**: React application with role-specific routes and views. Deployed via Nginx in Docker.
- **Application layer**: FastAPI route handlers, authorization, orchestration.
- **Processing layer**: Celery workers for heavy/background workloads. Uses **SQLite** as broker and result backend.
- **Intelligence layer**: Engine modules for OCR, grading, risk scoring, and insight generation.
- **Persistence layer**: MongoDB collections for users, sessions, results, requests, and classroom aggregates.

### 4.2 Control-Plane vs Data-Plane Separation

- Control plane: API validation, role checks, session transitions, request handling.
- Data plane: OCR/grading/risk computations executed out-of-band through task workers.

This separation enables non-blocking API behavior under heavy script batches.

### 4.3 Celery and Message Broker Strategy

To simplify deployment and reduce external dependencies, the system uses **SQLite** for both the Celery message broker and the result backend. 

In a Dockerized environment, the SQLite database files are stored in a shared persistent volume (`celery_data`), ensuring that both the FastAPI backend (producer) and the Celery worker (consumer) can access the same broker and result state.

- Broker URL: `sqla+sqlite:////app/data/celerydb.sqlite`
- Result Backend: `db+sqlite:////app/data/celery_results.sqlite`

When `CELERY_BROKER_URL` or `CELERY_RESULT_BACKEND` environment variables are unset, the system defaults to these SQLite paths.

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
- `POST /session/{session_id}/process` — initiates async processing task
- `GET /session/{session_id}/status` — returns `status`, `total_files`, `processed` counters
- `GET /session/{session_id}/results` — returns all result rows for session
- `GET /session/{session_id}/export` — CSV/Excel export of results

### 5.5 Analytics and OMI
- `GET /dashboard/teacher_stats`
- `GET /dashboard/teacher_summary`
- `GET /omi/analyze` — produces instructional insights from summary data
- `GET /session/{session_id}/stats`

### 5.6 Cheating Risk
- `POST /session/{session_id}/cheat_detection` — manually trigger cheat detection (requires `status == "processed"`)
- `GET /session/{session_id}/cheat_report` — retrieve cached or lazily-computed cheat report

### 5.7 Classroom, Student, and Reevaluation Flows
- `GET /teacher/my-class` — paginated classroom student list
- `GET /teacher/my-class/{rollnum}` — student detail with result history and reevaluation requests
- `GET /student/{rollnum}/results` — student-scoped result view (requires JWT auth)
- `POST /student/{rollnum}/request-reevaluation` — student submits reevaluation request
- `GET /teacher/reevaluation-requests` — teacher reviews pending requests
- `POST /teacher/reevaluation-requests/{request_id}/approve` — approve and reevaluate
- `POST /teacher/reevaluation-requests/{request_id}/reject` — reject with reason
- `POST /session/{session_id}/student/{student_name}/reevaluate` — teacher-initiated direct reevaluation

### 5.8 Question Paper Composer
- `POST /QCP` — generates question paper from preferences and reference docs

## 6. Data Persistence Model (Observed)

### 6.1 Collections in runtime usage
- `users` — university admins, teachers with auth credentials
- `students` — auto-created on first processing, immutable identity (rollnum, name_key)
- `sessions` — orchestration anchor with status, preferences, metadata
- `results` — one row per evaluated student per session, contains student identity + grading output
- `classroom_students` — teacher-scoped longitudinal student aggregate built incrementally during session processing
- `student_requests` — reevaluation request audit trail

### 6.2 Session document role

`session` is the orchestration anchor. It stores:
- **Metadata**: name, creation timestamp, teacher ownership (teacher_id, teacher_email, teacher_email_normalized)
- **Processing status**: status (created/uploaded/processing/processed), total_files, processed counter
- **Preferences**: is_handwritten, max_marks, and other EvaluationPreferences fields
- **Content**: teacher_model_answer (extracted text), question_paper (extracted text), custom_prompt
- **Cheat detection**: cheat_detection (report object), cheat_detection_status (running/completed/failed), cheat_detection_error, cheat_detection_last_run
- **Student roster**: student_rollnums (frozen array of evaluated student roll numbers, set when status transitions to processed)

### 6.3 Result document role

Each result row captures student-level evaluation output:
- **Identity**: session_id, student_name, student_rollnum, student_name_key, pdf_file
- **Content**: answer_text (extracted answer)
- **Grading output**: result (engine-specific grading dict)
- **Risk metadata**: cheat_detection object containing (risk_level, risk_score, max_pair_score, flagged_pairs, matched_with, cluster_id, cluster_size)
- **Audit trail**: reevaluation_history array with entries {at, actor, before, after}

### 6.4 Classroom aggregate role

`classroom_students` acts as teacher-scoped longitudinal student history built incrementally during session processing via `_upsert_classroom_student()`:
- **Identity**: teacher_id, teacher_email, rollnum
- **Student metadata**: name, name_key
- **History**: history array where each entry captures {session_id, marks, captured_at}
- **Timestamps**: created_at, updated_at

## 7. Frontend Application Design (Implemented)

### 7.1 Route map
- `/` — landing/splash
- `/auth` — teacher login/university registration
- `/univ-dashboard` — university admin panel (manage teachers)
- `/teacher-dashboard` — main teacher UI (sessions, analytics, reevaluation)
- `/student-auth` — student login
- `/student-dashboard` — student result view and reevaluation request submission

### 7.2 Teacher dashboard orchestration
The teacher page coordinates:
- session creation (upload question paper, model answer, preferences),
- upload validation and progress display,
- status polling for in-flight processing,
- analytics and OMI views,
- QCP generation,
- classroom drill-down,
- reevaluation request management,
- result export (CSV/Excel).

### 7.3 University dashboard
University admin can manage teacher list directly from UI (create, edit, delete).

### 7.4 Student dashboard
Student can inspect evaluated sessions, view per-session results, and submit reevaluation requests with reason.

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
When `CELERY_BROKER_URL` and `CELERY_RESULT_BACKEND` are unset, the system defaults to SQLite-backed transport at the paths defined in section 4.3. This is suitable for development and small-to-medium institutional deployments. Production deployments should explicitly provide durable message broker (Redis/RabbitMQ) and result backend.

## 9. Deployment and Operations

### 9.1 Docker Deployment (Recommended)
The project is optimized for Docker Compose. It orchestrates the frontend, backend, and worker services seamlessly.

```bash
docker-compose up --build
```

Services:
- **backend**: FastAPI on port 8000, health check enabled
- **celery_worker**: Celery worker with solo pool (concurrency=1), depends on backend health
- **frontend**: Nginx on port 80, proxies /api/* to backend

Volumes:
- `uploads_data`: persists uploaded student answer PDFs
- `celery_data`: persists SQLite broker and result backend databases

### 9.2 Local run path (Development)
- install Python + frontend dependencies,
- run API (`python -m uvicorn backend.app:app --reload`),
- run frontend (`npm run dev`),
- run Celery worker in separate process (`celery -A backend.worker.celery_app:celery_app worker --loglevel=info`).

By default, local runs use SQLite files in the root directory (./celerydb.sqlite, ./celery_results.sqlite).

### 9.3 Operational observability
- **Session processing progress** is exposed via `/session/{session_id}/status` endpoint returning `{status, total_files, processed}`.
- **Cheat detection status** is tracked in session document (`cheat_detection_status`, `cheat_detection_last_run`, `cheat_detection_error`).
- **Reevaluation history** is appended to result records providing full audit trail (actor, timestamp, before/after).

## 10. Testing and Validation Coverage

The repository contains a multi-file pytest suite (23 files) that exercises:
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
2. **Asynchronous processing architecture** for heavy workloads via Celery with SQLite transport.
3. **Multi-strategy text extraction** improving robustness for real-world input quality variance (OCR + native PDF paths).
4. **Hybrid grading strategy** supporting deterministic NLP scoring and LLM-based contextual evaluation.
5. **Cheat detection beyond naive similarity** with multi-signal scoring and semantic clustering.
6. **Practical observability endpoints** that expose progress, reports, and audit trails for UI consumption.
7. **Incremental classroom aggregation** built during session processing for efficient longitudinal analytics.

## 12. Known Risks and Limitations (Code-Observed)

1. **SQLite Celery transport** is excellent for simplicity and small-to-medium institutional deployments, but extremely high-volume environments may eventually require transitioning to Redis or RabbitMQ for durability and horizontal scaling.
2. **OCR quality and LLM output quality** remain model/input dependent and should be monitored per deployment context.
3. **Session state machine** does not currently support cancellation or rollback of in-flight processing; failed sessions must be manually cleaned up.
4. **Classroom student history** assumes single teacher ownership per student; multi-teacher scenarios require explicit filtering logic.

## 13. Future Scope and Planned Enhancements

We have structured our roadmap into three phases based on implementation complexity, current architectural readiness, and immediate project needs.

### 13.1 Short-Term (Upcoming) Initiatives
These are highly implementable features that build directly on our current data models and address immediate technical debt identified in recent evaluations.

- **Student Answer Script Visibility**: Allow students to securely request and view their annotated or processed PDF answer scripts, providing vital context when they initiate a reevaluation request.
- **Security and Authentication Hardening**: Address identified IDOR vulnerability by enforcing strict JWT validation and Role-Based Access Control (RBAC) on the student module endpoints.
- **Test Coverage and Pipeline Resilience**: Address explicitly identified gaps in critical pipeline testing. Substantially increase coverage for `backend/worker/work.py` with expanded error handling scenarios.

### 13.2 Intermediate Enhancements (Future Integration)
These features require moderate architectural additions but integrate smoothly into the existing `Engine/` abstraction layers.

- **LMS Integration (Exploring)**: Standardized adapter layers for Learning Management Systems such as Moodle, Canvas, and Blackboard to streamline enrollment and result sync.
- **Custom Rubrics and Criteria Management**: Introduce a rubric builder UI with per-session binding, allowing grading engines to map evaluation outputs against institutional and subject-specific standards.
- **Plagiarism and Originality Matching**: Integrate with external plagiarism detection (e.g., Turnitin/SafeAssign) to complement our in-house cheat-detection semantic clustering.
- **Progressive Result Release**: Provide controls for teachers to embargo results and release them asynchronously across a cohort only after manual reviews are finalized.

### 13.3 Long-Term Vision
These capabilities represent systemic growth into a highly scalable, privacy-first, enterprise-grade assessment platform.

- **Federated Learning and Continuous Improvement**: Build upon the reserved `FEATURE_FLAGS["federated_learning"]` to aggregate anonymized, approved reevaluation corrections across multiple institutions.
- **Systematic Engine Module Extensibility**: Evolve the modular `Engine/` directories (`grade/`, `OCR/`, `cheat_detection/`, etc.) into a standardized plugin interface, allowing institutions to securely extend evaluation logic.
- **Advanced Comparative Analytics**: Provide longitudinal cohort insights, cross-session performance trends, and difficulty profiling for questions to feed institutional learning objectives and measurement.
- **Multi-Language Support**: Scale OCR and NLP grading models beyond English, supporting diverse regional exam languages and introducing rigorous UI localization capabilities for the dashboard.
- **Production Infrastructure Hardening**: Fully transition from developmental defaults (like the SQLite Celery transport in our local compose) to durable highly available messaging queues (Redis/RabbitMQ) with persistent result backends.

## 14. Conclusion

OmniMark AI, as currently implemented, is a substantial full-stack evaluation platform with real operational depth:
- role-based governance,
- asynchronous processing with observable state transitions,
- integrated OCR and grading strategies with fallback paths,
- cheating-risk intelligence with semantic clustering,
- analytics and recommendation surfaces,
- complete reevaluation control loop with audit trails.

From a hackathon perspective, the project demonstrates strong systems integration, realistic workflow design, and clear extensibility toward production-grade deployments. The frozen `student_rollnums` array in processed sessions and incremental classroom aggregation provide efficient longitudinal tracking without full-batch recalculation.
