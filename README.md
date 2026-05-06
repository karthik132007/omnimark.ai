# OmniMark AI

OmniMark AI is a comprehensive, AI-powered academic evaluation platform designed to automate and enhance the grading process for universities and educators. It leverages cutting-edge NLP, LLM (Large Language Models), OCR, and advanced statistical models to provide robust, objective, and insightful evaluation of student answer sheets. 

From grading handwritten or typed exam papers to generating new question papers and intelligently summarizing class performance, OmniMark AI functions as an end-to-end assistant for modern education.

---

## 🎯 Core Features

1. **Automated Answer Evaluation**: 
   - **NLP Mode**: Uses semantic similarity, keyword matching, and length comparisons for rapid and deterministic grading of textual answers.
   - **LLM Mode**: Uses a sophisticated language model (`qwen3-coder-next:cloud` via Ollama) for advanced contextual assessment and nuanced grading.
2. **Handwritten Support (OCR)**: Extracts text from scanned, handwritten student submissions using PaddleOCR before pushing it through the grading pipeline.
3. **Cheat Detection Engine**: Analyzes submissions using a robust combination of Semantic Similarity (Embeddings), Jaccard Index, Sequence Matching, Rare Overlap (TF-IDF), and Length analysis to identify potential collusion.
4. **OMI (OmniMark Intelligence)**: An intelligent academic assistant that analyzes performance statistics and provides teachers with actionable insights, identifying strengths and learning gaps in the classroom.
5. **QCP (Question Paper Creator)**: Automatically sets university-level examination papers based on provided reference materials, difficulty levels, required marks, and course details.
6. **Detailed Analytics Dashboard**: Provides teachers and university administrators with an overview of exam sessions, performance metrics, and cheat detection reports.

---

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB (via `pymongo`)
- **Authentication**: JWT & Bcrypt
- **Validation**: Pydantic
- **Concurrency**: FastAPI `BackgroundTasks` for asynchronous grading and cheat detection.

### AI / ML Engine (The "Engine" Directory)
- **LLM Engine**: Ollama (Running `qwen3-coder-next:cloud`)
- **OCR Engine**: PaddleOCR & `pdf2image`
- **NLP Processing**: NLTK (Stopwords, Lemmatization, Keyword Extraction)
- **Embeddings / Similarity**: `sentence-transformers` & Scikit-learn (Cosine Similarity, Semantic Matrix)
- **Data Manipulation**: NumPy & Pandas (for EDA and Dashboard Stats)

### Frontend
- **Framework**: React 19 with Vite & TypeScript
- **Styling**: TailwindCSS v4
- **Routing**: React Router DOM
- **Visualization**: Recharts (for Dashboard Analytics)
- **Icons & Animation**: Lucide-React & Framer Motion
- **API Client**: Axios

---

## 🔄 System Architecture & A-Z Workflow

### 1. Session Creation & Setup
- The teacher navigates to the **Evaluation Setup** on the frontend.
- They create a new session by uploading a **Question Paper (PDF)** and a **Teacher Model Answer (PDF)**.
- They configure the evaluation preferences: Maximum Marks, Correction Mode (NLP vs LLM), whether the answers are handwritten (enables OCR), and language specifics.
- **Backend Flow**: `/session/create` receives the form data, saves the PDFs, extracts the text using standard PDF parsing (for typed documents), and stores a new session record in MongoDB.

### 2. Uploading Student Submissions
- The teacher uploads a `.zip` file containing all the students' answer sheets in PDF format.
- **Backend Flow**: `/session/{session_id}/upload_zip` validates the upload, saves the zip locally in the `uploads/` folder, and marks the session status as `uploaded`.

### 3. Asynchronous Processing & Grading
- The teacher triggers the grading process via `/session/{session_id}/process`.
- **Backend Flow**: A `BackgroundTask` is spawned (`worker/work.py -> process_session`).
  - The ZIP file is extracted.
  - For every PDF, text is extracted. If `is_handwritten` is `true`, the OCR pipeline (`PaddleOCR`) converts the pages to images and extracts the text line by line. Otherwise, standard PDF text extraction is used.
  - The extracted text is passed to either the `Correct_NLP` or `LLM_Grade` module based on the session configuration.
  - The calculated score and feedback are saved in the `db.results` collection.
  - Once all papers are graded, the system automatically triggers the Cheat Detection pipeline.
  - Session status becomes `processed`.

### 4. Cheat Detection Analysis
- Can be triggered automatically post-grading or manually via `/session/{session_id}/cheat_detection`.
- **Backend Flow**: `analyze_session_cheating` compares every student's answer against every other student's answer using a multi-layered matrix:
  - **Semantic Overlap**: Using sentence embeddings.
  - **Token Overlap**: Jaccard similarity.
  - **Sequence Overlap**: `difflib.SequenceMatcher`.
  - **Rare Keyword Overlap**: TF-IDF based weighting.
- A comprehensive report with risk levels (critical, high, medium, low) is generated and attached to the session.

### 5. Insights and OMI Analysis
- Teachers view the dashboard to see class averages, highest/lowest marks, and score distributions.
- **OMI Analysis**: By calling `/omi/analyze`, the backend aggregates the current dashboard stats and sends them to the Ollama LLM with a strict prompt to act as an academic advisor. It returns a structured JSON highlighting strengths, weaknesses, and a recommended action plan.

---

## 📍 API Endpoints

### 🔐 Authentication (`backend/auth.py`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Registers a new user (Teacher/Univ) using bcrypt hashing. |
| POST | `/auth/login` | Authenticates a user and returns a JWT token. |
| GET | `/auth/me` | Returns the currently authenticated user's profile. |

### 📊 Dashboard & Analytics (`backend/app.py`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/teacher_stats` | Fetches aggregate evaluation statistics for a specific teacher. |
| GET | `/dashboard/teacher_summary` | Provides a high-level performance summary of all teacher's sessions. |
| GET | `/omi/analyze` | Generates an AI-driven text analysis of the teacher's dashboard summary using the OMI module. |
| GET | `/session/{session_id}/stats` | Fetches specific statistical insights for a single session. |

### 📝 Session Management & Evaluation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/session/create` | Creates a new evaluation session, capturing preferences and reference PDFs. |
| GET | `/sessions` | Lists all sessions associated with the authenticated teacher. |
| GET | `/session/{session_id}` | Retrieves details for a specific session. |
| DELETE | `/session/{session_id}` | Deletes a session and its associated results. |
| POST | `/session/{session_id}/upload_zip` | Uploads a zip file containing student answer PDFs. |
| POST | `/session/{session_id}/process` | Triggers the background grading pipeline. |
| GET | `/session/{session_id}/status` | Checks the real-time processing status of a session. |
| GET | `/session/{session_id}/results` | Fetches the graded results for all students in the session. |

### 🕵️ Cheat Detection
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/session/{session_id}/cheat_detection` | Triggers the background cheat detection algorithm for a processed session. |
| GET | `/session/{session_id}/cheat_report` | Retrieves the detailed cheat detection report and identified suspicious pairs. |

### 📄 Question Paper Creator (QCP)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/QCP` | Generates a structured JSON question paper based on uploaded relevant docs, difficulty, and preferences. |

---

## 🧠 The Engine (AI Modules Detail)

### 1. `Engine/grade/nlp.py` (NLP Grader)
Evaluates student responses by extracting and comparing keywords, calculating length factors, and generating a semantic similarity score against the teacher's model answer. It weights these components:
- **Similarity**: 80% (Using `sentence-transformers` / `Engine.encoder.model`)
- **Keyword Match**: 15% (Checking if lemmatized key terms exist in the answer)
- **Length Factor**: 5% (Comparing the length of the student's answer to the expected length)

### 2. `Engine/grade/llm.py` (LLM Grader)
Bypasses traditional keyword matching by prompting the `qwen3-coder-next:cloud` model with the student's answer, the teacher's model answer, and the question paper. Returns a highly contextual score and specific constructive feedback.

### 3. `Engine/cheat_detection/main.py` (Cheat Detection Engine)
Generates an $N \times N$ matrix comparing every student against every other student. Uses an aggressive multi-algorithmic approach:
- Calculates TF-IDF distributions to find students who share identical *rare* mistakes or obscure vocabulary (`_rare_overlap`).
- Matches raw character sequences to detect exact copy-pasting (`_sequence_similarity`).
- Flags "critical" risk levels for scores over 0.92, providing granular details about *why* a pair was flagged.

### 4. `Engine/OCR/ocr.py` (Optical Character Recognition)
Used when a session is marked as `is_handwritten=true`. It converts PDF pages to JPEGs using `pdf2image`, then runs the `PaddleOCR` model over the images. It intelligently reconstructs the text blocks before passing them back to the evaluation pipeline.

### 5. `Engine/OMI/omi.py` (OmniMark Intelligence)
Acts as a wrapper around the Ollama API, fed with a strict system prompt to act as an "intelligent academic assistant". It consumes raw Pandas-generated statistics from `Engine.Dashbord_data.eda` and synthesizes them into actionable JSON data (`overview`, `strengths`, `weaknesses`, `action_plan`).

### 6. `Engine/QCP/qcp.py` (Question Paper Creator)
Takes syllabus/document context and configuration variables (difficulty, choice structures, marks) to automatically construct a JSON-structured examination paper using LLM prompt engineering.

---

## 💻 Frontend Structure

The React frontend relies heavily on modern hooks and component-based architecture:
- `src/App.tsx`: The main router configuration.
- `src/pages/`:
  - `Home.tsx`: Landing page for the application.
  - `Auth.tsx`: Login and Registration portal.
  - `TeacherDashboard.tsx`: The core operational hub for educators.
  - `UnivDashboard.tsx`: High-level view for university administrators.
- `src/components/teacher-dashboard/`:
  - `OverviewView.tsx`: High-level session summaries.
  - `EvaluationSetupView.tsx`: Interface to call `/session/create`.
  - `ScriptUploadsView.tsx`: Interface to upload ZIPs and trigger `/session/{session_id}/process`.
  - `AnalyticsView.tsx`: Visualizes the data returned from the stats endpoints using Recharts.
  - `OmiView.tsx`: Renders the AI-generated academic insights.
  - `QCPView.tsx`: Interface for generating automated question papers.
- `src/lib/api.ts` & `src/lib/teacherDashboardApi.ts`: Axios wrappers for communicating with the FastAPI backend.

---

## 🚀 Getting Started

1. **Start the Backend**:
   - Ensure you have a running MongoDB instance.
   - Install requirements: `pip install -r requirements.txt`
   - Start the server: `fastapi dev backend/app.py`
2. **Start the Frontend**:
   - Navigate to the frontend directory: `cd frontend`
   - Install dependencies: `npm install`
   - Start the Vite development server: `npm run dev`
3. **Start Ollama Engine**:
   - Ensure Ollama is running locally or configured correctly in the environment to serve the `qwen3-coder-next:cloud` model.
