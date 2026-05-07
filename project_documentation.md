# OmniMark AI Project Documentation

**Name:** OmniMark AI

**githubUrl:** (Insert your repository URL here)

**description:** An enterprise-grade, AI-powered academic evaluation platform designed to automate and enhance the grading process for educators. It leverages cutting-edge NLP, LLMs, OCR, and advanced statistical models to provide robust, objective evaluation of student answer sheets, generate question papers, and summarize class performance from a single centralized dashboard.

## Functional Requirements

**Authentication & Roles**
* Register, login, and robust session management via JWT.
* Role-based access control (Teacher, University Administrator).
* Secure password hashing with Bcrypt.

**Automated Answer Evaluation**
* **NLP Mode:** Rapid grading using semantic similarity, keyword matching, and length comparisons for textual answers.
* **LLM Mode:** Advanced contextual assessment and nuanced grading via sophisticated LLMs via Ollama.
* Support for uploading and mapping reference answers/marking schemes.

**Handwriting & Document Processing**
* OCR capability (via PaddleOCR) to extract text from scanned, handwritten student submissions (PDF/Images).

**Cheat Detection Engine**
* Submission analysis using Semantic Similarity, Jaccard Index, Sequence Matching, Rare Overlap (TF-IDF), and Length analysis to identify potential collusion among students.

**OMI (OmniMark Intelligence) & Analytics**
* Intelligent insights on classroom performance, identifying strengths and learning gaps.
* Comprehensive analytics dashboard with visual charts and statistical evaluation.

**QCP (Question Paper Creator)**
* Automated generation of university-level exam papers based on reference materials, difficulty levels, and syllabus parameters.

## Non-Functional Requirements
* High accuracy in OCR extraction and AI grading pipelines.
* Fast NLP evaluation response times; async processing for LLM/OCR heavy lifting via BackgroundTasks.
* Secure and persistent document storage (MongoDB).
* Intuitive UI/UX with React 19 and Tailwind CSS 4.
* Reusable component architecture.
* Traffic security and user data encryption.
* Clean and modular codebase.

**problem_statement:** Educators and academic institutions spend countless hours manually grading examinations, which is labor-intensive, subjective, and prone to human error. Furthermore, identifying collusion in large cohorts and generating balanced question papers requires significant effort that could be better spent on actual instruction.

**proposed_solution:** A full-stack AI evaluation platform combining a React 19 + TypeScript frontend with a FastAPI backend that orchestrates an intelligent core Engine. It leverages PaddleOCR, Sentence Transformers, and LLMs (Ollama) to automate grading, auto-generate exams, provide actionable academic insights, and detect cheating via a seamless web dashboard.

**technologies_used:** React 19, TypeScript, Tailwind CSS 4, Recharts, Vite 6, Axios, Lucide-React, Framer Motion, FastAPI, Python, MongoDB (pymongo), JWT, Pydantic, Ollama (LLM), PaddleOCR, pdf2image, NLTK, Sentence-Transformers, Scikit-learn, Pandas, NumPy.

**system_architecture:** Three-tier architecture consisting of a React SPA frontend communicating with a FastAPI REST backend. The backend manages MongoDB data operations and orchestrates heavy AI workloads asynchronously. The dedicated ML "Engine" subsystem houses modules for NLP grading, LLM interaction, OCR document extraction, cheat detection clustering, question generation, and exploratory data analysis.

**in_scope:** Automated grading (NLP and LLM), handwritten text extraction (OCR), statistical cheat detection, real-time analytics dashboards, AI-driven question paper creation, class performance insights, and secure user authentication.

**out_scope:** Direct integration with institutional LMS systems (Canvas, Moodle) on day one, predictive student drop-out modeling, real-time student monitoring/proctoring (camera feeds), and grading of complex diagrams/charts or mathematical derivations visually.

**future_enhancements:**
* **Day 1-2:** Export analytics and grading reports to shareable PDFs.
* **Day 3-5:** Expand LLM capabilities to accurately parse and evaluate mathematical formulas and graphs.
* **Day 6+:** Build LMS integrations (LTI) to directly pull assignments and push grades to tools like Moodle or Canvas.

**conclusion:** OmniMark AI is a robust and intelligent ecosystem that transforms academic assessment. It combines strong AI engineering with a polished web frontend. Its primary challenges involve optimizing OCR accuracy across varied handwriting styles, scaling LLM inferences cost-effectively, and refining the cheat detection thresholds to prevent false positives while remaining highly accurate.

**projectType:** AI-SaaS Web Application
