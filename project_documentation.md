# OmniMark AI Project Documentation

**Name:** OmniMark AI

**githubUrl:** (Insert your repository URL here)

**description:** OmniMark AI is an AI-powered academic evaluation platform that helps universities, departments, teachers, and now students manage the full exam-evaluation lifecycle. The platform supports session creation, answer-sheet processing, automated grading, cheat-risk analysis, dashboard insights, question paper generation, and student-side result visibility with reevaluation requests.

## Functional Requirements

**Authentication & Roles**
* JWT-based authentication with role-aware access patterns.
* Role support for University Admin, Teacher, and Student users.
* Secure password hashing using Bcrypt.
* Separate student login flow for simplified exam-result access.

**Teacher & University Module**
* Create and manage evaluation sessions.
* Upload question paper and teacher model answer.
* Upload student scripts in bulk (ZIP) and trigger processing.
* Monitor processing state and fetch session-level results.
* Access dashboard metrics and OMI AI analysis.

**Student Module (New)**
* Student login using roll number + password.
* View personal results across evaluated sessions.
* Submit reevaluation requests with reasons.
* Track outcomes through teacher-managed approval/rejection flow.

**Reevaluation Workflow (Expanded)**
* Teachers can directly reevaluate a student result.
* Teachers can review student-submitted reevaluation requests.
* Requests can be approved (triggers reevaluation) or rejected.
* Reevaluation history is preserved for traceability.

**Automated Answer Evaluation**
* **NLP Mode:** Fast deterministic scoring using similarity and linguistic signals.
* **LLM Mode:** Context-rich grading for nuanced subjective answers.
* Supports configurable evaluation preferences and optional custom prompts.

**Handwriting & Document Processing**
* OCR pipeline for handwritten/scanned answer scripts.
* PDF text extraction fallback for non-OCR flows.

**Cheat Detection Engine**
* Multi-signal cheat-risk scoring (semantic overlap, lexical similarity, sequence and statistical patterns).
* Cluster-aware grouping of answers so suspicious similarity bands can be reviewed as cohorts, not just isolated pairs.
* Session-level cheating analysis and report retrieval.

**OMI (OmniMark Intelligence) & Analytics**
* Teacher summary analytics and session-wise metrics.
* AI-generated interpretation of class performance trends.

**QCP (Question Paper Creator)**
* AI-assisted question paper generation based on inputs like subject context and constraints.

## Non-Functional Requirements
* Reliable grading and analytics outputs with reproducible pipelines.
* Asynchronous processing for heavy OCR/LLM operations.
* Secure credential handling with role-based endpoint access for core authenticated flows.
* Responsive UI with modular React components.
* Maintainable architecture with clear separation of API, worker logic, and AI engine modules.

**problem_statement:** Manual evaluation at institutional scale is time-consuming and inconsistent. Educators also need tooling for cheating analysis, analytics-driven interventions, and transparent reevaluation. Students need direct visibility into outcomes and a structured way to request correction review.

**proposed_solution:** OmniMark AI provides a full-stack AI evaluation system where teachers and universities can automate grading and analysis, while students can access marks and request reevaluation through both authenticated and compatibility endpoint flows. The backend orchestrates OCR, NLP/LLM grading, and analytics, while the frontend offers dedicated dashboards for each actor.

**technologies_used:** React 19, TypeScript, Tailwind CSS 4, Vite, Axios, Recharts, FastAPI, Python, MongoDB (pymongo), JWT, Pydantic, Ollama/LLM integration, PaddleOCR, pdf2image, NLTK, Sentence-Transformers, Scikit-learn, Pandas, NumPy.

**system_architecture:** Three-tier architecture with a React frontend, FastAPI orchestration layer, and MongoDB persistence. A dedicated `Engine` layer provides OCR, grading (NLP/LLM), cheat detection, dashboard statistics, OMI insights, and QCP generation. Background tasks/process workers handle long-running evaluation jobs.

The cheat detection pipeline now emits pairwise scores plus answer clusters, and the teacher analytics UI renders both views.

**in_scope:**
* Session-based exam evaluation for teachers/university.
* Student authentication and personal result retrieval.
* Student reevaluation requests and teacher approval/rejection flow.
* NLP/LLM grading, OCR extraction, cheat analysis, and dashboard insights.
* Question paper generation support.

**out_scope:**
* Deep LMS/LTI integrations in current version.
* Real-time remote proctoring using live camera streams.
* Fully reliable diagram/math-expression visual grading in all formats.
* Offline-first deployment and edge execution.

**future_enhancements:**
* Add downloadable student mark sheets and reevaluation status tracking timeline.
* Add notification channels (email/in-app) for reevaluation decisions.
* Add LMS integration for roster sync and grade pushback.
* Improve OCR robustness for low-quality scans and multilingual scripts.
* Add rubric-aware explainable grading reports for teachers and students.

**conclusion:** OmniMark AI now goes beyond evaluator tooling by including a student-facing academic transparency loop. With teacher/university workflows, AI-assisted grading, analytics, and a structured reevaluation module, the platform is positioned as an end-to-end academic assessment system with strong practical relevance.

**projectType:** AI-SaaS Web Application
