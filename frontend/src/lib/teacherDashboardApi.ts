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
} from '../types/teacherDashboard';

interface CreateSessionResponse {
  session_id: string;
}

interface UploadSessionZipOptions {
  file: File;
  teacherEmail?: string;
  onProgress?: (progress: number) => void;
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
  const response = await api.get<TeacherSessionSummary[]>('/sessions', {
    params: { teacher_email: email },
  });
  return response.data;
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
