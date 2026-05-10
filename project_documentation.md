# OmniMark AI Project Documentation

**Name:** OmniMark AI

**githubUrl:** [GitHub](https://github.com/karthik132007/omnimark.ai)

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

**Automated Answer Evaluation (AI Engine)**
* **NLP Mode (Deterministic):** Fast, robust scoring leveraging Sentence Transformers (`model.encode`) and NLTK for text preprocessing. The scoring logic computes a weighted composite score: 
  * `80% Semantic Similarity` (cosine similarity of embeddings between teacher model and student answer)
  * `15% Key Word Overlap` (lemmatized keyword intersection scoring)
  * `5% Length Factor` (dynamic length penalty based on `min_answer_length` constraints)
* **LLM Mode (Generative):** Context-rich grading using Ollama-backed LLMs for nuanced subjective answers, parsing complex multi-part questions, and generating qualitative feedback.
* Supports configurable evaluation preferences, stop-word removal, OCR-artifact normalization, and custom dynamic prompts.

**Handwriting & Document Processing**
* Advanced OCR pipeline using PaddleOCR + `pdf2image` for robust text extraction from scanned, handwritten answer scripts.
* PDF text extraction fallback for digitally native or non-OCR flows, complete with artifact cleaning (`r"(.)\1{3,}"` regex for OCR noise).

**Cheat Detection Engine (Advanced Analytics)**
* **Multi-Signal Similarity Scoring:** Computes a composite risk score for pairwise student comparisons using:
  * `45% Semantic Overlap` (Sentence-Transformer embeddings, normalized cosine distance)
  * `20% Lexical Overlap` (Jaccard similarity on lemmatized tokens)
  * `15% Sequence Matching` (difflib SequenceMatcher ratio for exact string sequence overlap)
  * `15% Rare Overlap` (TF-IDF weighted rare keyword intersection)
  * `5% Length Similarity` (normalized length variance)
* **DBSCAN Clustering (Cohort Analysis):** Employs Density-Based Spatial Clustering of Applications with Noise (DBSCAN) using a cosine distance metric (`eps=0.22`, `min_samples=2`) on high-dimensional answer embeddings. This identifies organized cheating cohorts and suspicious similarity bands, rather than just isolated pairs.
* **Adaptive Thresholding:** Dynamically computes risk thresholds (`mean + 1.5 * std`) across the batch distribution to reduce false positives in highly standardized technical answers.

**OMI (OmniMark Intelligence) & Analytics**
* Teacher summary analytics and session-wise metrics powered by Pandas and NumPy aggregations.
* AI-generated interpretation of class performance trends, highlighting knowledge gaps.

**QCP (Question Paper Creator)**
* AI-assisted question paper generation utilizing constraint-solving generation to ensure balanced cognitive load (Bloom's Taxonomy coverage) and subject context integration.

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
* **Federated Learning for Grading Models:** Enable cross-university model training on grading patterns without sharing sensitive student PII or raw answer scripts, utilizing federated averaging.
* **Multimodal Real-Time Proctoring:** Integrate edge AI computer vision (gaze tracking, head pose estimation) and ambient audio anomaly detection to flag suspicious behavior synchronously during remote exams.
* **Blockchain-Backed Immutable Grade Verification:** Store hashed, cryptographically signed evaluation results on a distributed ledger to prevent post-evaluation tampering and ensure absolute academic integrity.
* **Generative Synthetic Dataset Augmentation:** Use advanced LLMs to generate synthetic student answers spanning varying levels of correctness and edge cases to continuously train and fine-tune the local grading models.
* **Self-Supervised Handwriting Recognition:** Implement self-supervised transformer models tailored for extremely low-quality scans and zero-shot multilingual handwritten script recognition.
* **Explainable AI (XAI) Grading Reports:** Implement attention-map visualizations for NLP/LLM grading, showing teachers and students exactly which sentences or phrases contributed positively or negatively to the final score.

**conclusion:** OmniMark AI now goes beyond evaluator tooling by including a student-facing academic transparency loop. With teacher/university workflows, AI-assisted grading, analytics, and a structured reevaluation module, the platform is positioned as an end-to-end academic assessment system with strong practical relevance.

**projectType:** AI-SaaS Web Application
