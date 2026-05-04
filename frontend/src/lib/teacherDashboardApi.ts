import { api } from './api';
import type {
  EvaluationSetupFormState,
  SessionResult,
  SessionStatusPayload,
  TeacherSession,
  TeacherSessionSummary,
} from '../types/teacherDashboard';

interface CreateSessionResponse {
  session_id: string;
}

interface UploadSessionZipOptions {
  file: File;
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

export const listTeacherSessions = async () => {
  const response = await api.get<TeacherSessionSummary[]>('/sessions');
  return response.data;
};

export const getTeacherSession = async (sessionId: string) => {
  const response = await api.get<TeacherSession>(`/session/${sessionId}`);
  return response.data;
};

export const createTeacherSession = async (form: EvaluationSetupFormState) => {
  const payload = new FormData();
  payload.append('name', form.name);
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
  const payload = new FormData();
  payload.append('file', options.file, options.file.name);

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

export const processTeacherSession = async (sessionId: string) => {
  const response = await api.post<{ message: string }>(`/session/${sessionId}/process`);
  return response.data;
};

export const getTeacherSessionStatus = async (sessionId: string) => {
  const response = await api.get<SessionStatusPayload>(`/session/${sessionId}/status`);
  return response.data;
};

export const deleteTeacherSession = async (sessionId: string) => {
  const response = await api.delete<{ message: string }>(`/session/${sessionId}`);
  return response.data;
};

export const getSessionResults = async (sessionId: string) => {
  const response = await api.get<SessionResult[]>(`/session/${sessionId}/results`);
  return response.data;
};
