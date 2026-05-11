import { api } from './api';
import type {
  EvaluationSetupFormState,
  SessionResult,
  SessionStatusPayload,
  TeacherSession,
  TeacherSessionSummary,
  QCPFormState,
  OmiAnalysisResponse,
  TeacherDashboardSummary,
  CheatDetectionResponse,
  NlpResult,
  LlmResult,
  ClassroomStudent,
  ClassroomStudentDetailResponse,
  ReevaluationRequest,
} from '../types/teacherDashboard';

interface CreateSessionResponse {
  session_id: string;
}

interface UploadSessionZipOptions {
  file: File;
  teacherEmail?: string;
  onProgress?: (progress: number) => void;
}

interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    offset: number;
    limit: number;
    has_more: boolean;
  };
}

const buildPreferencesPayload = (form: EvaluationSetupFormState) => ({
  exam_type: form.examType,
  language_exam: form.examType === 'Theory' ? form.languageExam : null,
  max_marks: form.maxMarks,
  min_answer_length: form.minAnswerLength,
  is_handwritten: form.isHandwritten,
  llm_provider: form.llmProvider,
  llm_model: form.llmModel,
});

const normalizedEmail = (email: string) => email.trim().toLowerCase();
const resolveTeacherEmail = (teacherEmail?: string) => normalizedEmail(teacherEmail ?? localStorage.getItem('user_email') ?? '');

export const listTeacherSessions = async (teacherEmail?: string) => {
  const email = resolveTeacherEmail(teacherEmail);
  const response = await api.get<TeacherSessionSummary[] | PaginatedResponse<TeacherSessionSummary>>('/sessions', {
    params: { teacher_email: email },
  });
  return Array.isArray(response.data) ? response.data : response.data.items;
};

export const getTeacherSession = async (sessionId: string, teacherEmail?: string) => {
  const email = resolveTeacherEmail(teacherEmail);
  const response = await api.get<TeacherSession>(`/session/${sessionId}`, {
    params: { teacher_email: email },
  });
  return response.data;
};

export const createTeacherSession = async (form: EvaluationSetupFormState, teacherEmail?: string) => {
  const email = resolveTeacherEmail(teacherEmail);
  const payload = new FormData();
  payload.append('name', form.name);
  payload.append('teacher_email', email);
  const correctionMode = form.examType === 'Technical' ? 'LLM' : 'NLP';
  payload.append('correction_mode', correctionMode);
  payload.append('preferences_json', JSON.stringify(buildPreferencesPayload(form)));
  payload.append('custom_prompt', correctionMode === 'LLM' ? form.customPrompt : '');
  payload.append('question_paper', form.questionPaper as Blob, form.questionPaper?.name);
  payload.append('teacher_model_answer', form.teacherModelAnswer as Blob, form.teacherModelAnswer?.name);

  const response = await api.post<CreateSessionResponse>('/session/create', payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const uploadTeacherSessionZip = async (sessionId: string, options: UploadSessionZipOptions) => {
  const email = resolveTeacherEmail(options.teacherEmail);
  const payload = new FormData();
  payload.append('file', options.file, options.file.name);
  payload.append('teacher_email', email);

  const response = await api.post<{ message: string }>(`/session/${sessionId}/upload_zip`, payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (event) => {
      if (!event.total || !options.onProgress) {
        return;
      }

      const progress = Math.round((event.loaded / event.total) * 100);
      options.onProgress(progress);
    },
  });

  return response.data;
};

export const processTeacherSession = async (sessionId: string, teacherEmail?: string) => {
  const email = resolveTeacherEmail(teacherEmail);
  const payload = new FormData();
  payload.append('teacher_email', email);
  const response = await api.post<{ message: string }>(`/session/${sessionId}/process`, payload);
  return response.data;
};

export const getTeacherSessionStatus = async (sessionId: string, teacherEmail?: string) => {
  const email = resolveTeacherEmail(teacherEmail);
  const response = await api.get<SessionStatusPayload>(`/session/${sessionId}/status`, {
    params: { teacher_email: email },
  });
  return response.data;
};

export const deleteTeacherSession = async (sessionId: string, teacherEmail?: string) => {
  const email = resolveTeacherEmail(teacherEmail);
  const response = await api.delete<{ message: string }>(`/session/${sessionId}`, {
    params: { teacher_email: email },
  });
  return response.data;
};

export const getSessionResults = async (sessionId: string, teacherEmail?: string) => {
  const email = resolveTeacherEmail(teacherEmail);
  const response = await api.get<SessionResult[]>(`/session/${sessionId}/results`, {
    params: { teacher_email: email },
  });
  return response.data;
};

export const reevaluateStudent = async (sessionId: string, studentName: string, teacherEmail?: string) => {
  const email = resolveTeacherEmail(teacherEmail);
  const payload = new FormData();
  if (email) payload.append('teacher_email', email);

  const response = await api.post<{ message: string; new_result: NlpResult | LlmResult }>(
    `/session/${sessionId}/student/${studentName}/reevaluate`,
    payload
  );
  return response.data;
};

export const generateQuestionPaper = async (form: QCPFormState) => {
  const payload = new FormData();

  const preferences = {
    difficulty: form.difficulty,
    max_marks: form.max_marks,
    no_of_ques: form.no_of_ques,
    course: form.course,
    choice_aval: form.choice_aval,
    choice_type: form.choice_type,
    custom_prompt: form.custom_prompt,
  };

  payload.append('preferences_json', JSON.stringify(preferences));
  if (form.relevent_docs) {
    payload.append('relevent_docs', form.relevent_docs as Blob, form.relevent_docs.name);
  }

  const response = await api.post<string>('/QCP', payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const getOmiAnalysis = async (teacherEmail?: string) => {
  const email = resolveTeacherEmail(teacherEmail);
  const response = await api.get<OmiAnalysisResponse>('/omi/analyze', {
    params: { teacher_email: email },
  });
  return response.data;
};

export const getTeacherDashboardSummary = async (teacherEmail?: string) => {
  const email = resolveTeacherEmail(teacherEmail);
  const response = await api.get<TeacherDashboardSummary>('/dashboard/teacher_summary', {
    params: { teacher_email: email },
  });
  return response.data;
};

export const triggerCheatDetection = async (sessionId: string, teacherEmail?: string) => {
  const email = resolveTeacherEmail(teacherEmail);
  const payload = new FormData();
  payload.append('teacher_email', email);
  const response = await api.post<{ message: string }>(`/session/${sessionId}/cheat_detection`, payload);
  return response.data;
};

export const getCheatReport = async (sessionId: string, teacherEmail?: string) => {
  const email = resolveTeacherEmail(teacherEmail);
  const response = await api.get<CheatDetectionResponse>(`/session/${sessionId}/cheat_report`, {
    params: { teacher_email: email },
  });
  return response.data;
};

export const downloadSessionExport = async (sessionId: string, format: 'csv' | 'xlsx' = 'csv', teacherEmail?: string) => {
  const email = resolveTeacherEmail(teacherEmail);
  const response = await api.get(`/session/${sessionId}/export`, {
    params: { teacher_email: email, format },
    responseType: 'blob'
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `export_${sessionId}.${format}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const getMyClassStudents = async (teacherEmail?: string) => {
  const email = resolveTeacherEmail(teacherEmail);
  const response = await api.get<ClassroomStudent[] | PaginatedResponse<ClassroomStudent>>('/teacher/my-class', {
    params: { teacher_email: email },
  });
  return Array.isArray(response.data) ? response.data : response.data.items;
};

export const getMyClassStudentDetail = async (rollnum: number, teacherEmail?: string) => {
  const email = resolveTeacherEmail(teacherEmail);
  const response = await api.get<ClassroomStudentDetailResponse>(`/teacher/my-class/${rollnum}`, {
    params: { teacher_email: email },
  });
  return response.data;
};

export const getTeacherReevaluationRequests = async (status?: string, teacherEmail?: string) => {
  const email = resolveTeacherEmail(teacherEmail);
  const response = await api.get<ReevaluationRequest[] | PaginatedResponse<ReevaluationRequest>>('/teacher/reevaluation-requests', {
    params: { teacher_email: email, status },
  });
  return Array.isArray(response.data) ? response.data : response.data.items;
};

export const approveTeacherReevaluationRequest = async (requestId: string, teacherEmail?: string) => {
  const email = resolveTeacherEmail(teacherEmail);
  const payload = new FormData();
  payload.append('teacher_email', email);
  const response = await api.post<{ message: string; request_id: string }>(
    `/teacher/reevaluation-requests/${requestId}/approve`,
    payload,
  );
  return response.data;
};

export const rejectTeacherReevaluationRequest = async (requestId: string, reason: string, teacherEmail?: string) => {
  const email = resolveTeacherEmail(teacherEmail);
  const payload = new FormData();
  payload.append('teacher_email', email);
  payload.append('reason', reason);
  const response = await api.post<{ message: string; request_id: string }>(
    `/teacher/reevaluation-requests/${requestId}/reject`,
    payload,
  );
  return response.data;
};
