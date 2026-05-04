export type DashboardView = 'dashboard' | 'evaluation-setup' | 'script-uploads' | 'analytics';

export type EvaluationMode = 'NLP' | 'LLM';
export type ExamType = 'Theory' | 'Technical';
export type SessionStatus = 'created' | 'uploaded' | 'processing' | 'processed' | string;

export interface SessionPreferences {
  exam_type: ExamType;
  language_exam?: boolean | null;
  max_marks: number;
  min_answer_length: number;
  is_handwritten?: boolean;
  llm_provider?: string;
  llm_model?: string;
}

export interface TeacherSessionSummary {
  session_id: string;
  name: string;
  status: SessionStatus;
  correction_mode: EvaluationMode;
  created_at: string;
}

export interface TeacherSession extends TeacherSessionSummary {
  preferences: SessionPreferences;
  custom_prompt?: string;
  total_files?: number;
  processed?: number;
}

export interface EvaluationSetupFormState {
  name: string;
  examType: ExamType;
  correctionMode: EvaluationMode;
  languageExam: boolean;
  isHandwritten: boolean;
  maxMarks: number;
  minAnswerLength: number;
  questionPaper: File | null;
  teacherModelAnswer: File | null;
  customPrompt: string;
  llmProvider: string;
  llmModel: string;
}

export interface ZipInspection {
  pdfCount: number;
  pdfNames: string[];
  ignoredFiles: string[];
  hasNestedFolders: boolean;
  totalEntries: number;
}

export interface SessionStatusPayload {
  status: SessionStatus;
  total_files?: number;
  processed?: number;
}

export interface NlpResult {
  marks: number;
  similarity: number;
  keyword_score: number;
  length_score: number;
}

export interface LlmResult {
  marks: Record<string, number>;
  question_feedback: Record<string, string>;
  total_marks: number;
  evaluation_note: string;
  confidence_score: number;
  other_info?: {
    strengths?: string[];
    weaknesses?: string[];
    ocr_issue_detected?: boolean;
  };
}

export interface SessionResult {
  session_id: string;
  student_name: string;
  pdf_file: string;
  result: NlpResult | LlmResult;
}
