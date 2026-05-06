export type DashboardView = 'dashboard' | 'evaluation-setup' | 'script-uploads' | 'analytics' | 'qcp' | 'omi';

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
  answer_text?: string;
  cheat_detection?: {
    risk_level?: string;
    risk_score?: number;
    max_pair_score?: number;
    flagged_pairs?: number;
    matched_with?: string[];
  };
  result: NlpResult | LlmResult;
}

export interface CheatDetectionPair {
  student_1: string;
  student_2: string;
  score: number;
  risk_level: string;
  suspicious: boolean;
  signals: {
    semantic: number;
    token_overlap: number;
    sequence: number;
    rare_overlap: number;
    length_similarity: number;
  };
}

export interface CheatDetectionStudent {
  student_name: string;
  max_pair_score: number;
  risk_score: number;
  risk_level: string;
  flagged_pairs: number;
  matched_with: string[];
}

export interface CheatDetectionReport {
  threshold: number;
  total_students: number;
  total_pairs: number;
  flagged_pairs: CheatDetectionPair[];
  pairs: CheatDetectionPair[];
  students: CheatDetectionStudent[];
  summary: {
    students_flagged: number;
    pairs_flagged: number;
    highest_pair_score: number;
  };
}

export interface CheatDetectionResponse {
  status: string;
  last_run?: string;
  report: CheatDetectionReport | null;
}

export interface QCPFormState {
  difficulty: string;
  max_marks: number;
  no_of_ques: number;
  course: string;
  choice_aval: boolean;
  choice_type: string;
  custom_prompt: string;
  relevent_docs: File | null;
}

export interface OmiAnalysisResponse {
  greeting: string;
  overview: string;
  strengths: string[];
  areas_for_improvement: string[];
  action_plan: string[];
  insights?: string[];
  performance_level?: 'excellent' | 'good' | 'average' | 'poor' | string;
  error?: string;
  raw?: string;
}

export interface TeacherDashboardSummary {
  metrics: {
    total_sessions: number;
    processed_sessions: number;
    total_submissions: number;
    average_marks: number;
    highest_marks: number;
    lowest_marks: number;
  };
  trend: Array<{
    session_id: string;
    name: string;
    date: string;
    average_marks: number;
    submissions: number;
  }>;
  common_mistakes: Array<{
    name: string;
    count: number;
  }>;
  toppers: Array<{
    student_name: string;
    session_name: string;
    marks: number;
    max_marks: number;
    percentage: number;
  }>;
  score_distribution: Array<{
    range: string;
    students: number;
  }>;
  risk_bands: Array<{
    name: string;
    students: number;
  }>;
}
