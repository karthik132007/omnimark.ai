import { api } from './api';
import type { SessionResult } from '../types/teacherDashboard';

export interface StudentResultsResponse {
  student: {
    rollnum: number;
    name: string;
    name_key: string;
  };
  results: SessionResult[];
}

export const studentLogin = async (rollnum: number, password: string) => {
  const response = await api.post<{
    access_token: string;
    token_type: string;
    role: 'student';
    rollnum: number;
    name: string;
  }>('/auth/student/login', { rollnum, password });
  return response.data;
};

export const getStudentResults = async (rollnum: number) => {
  const response = await api.get<StudentResultsResponse>(`/student/${rollnum}/results`);
  return response.data;
};

export const requestStudentReevaluation = async (rollnum: number, sessionId: string, reason: string) => {
  const payload = new FormData();
  payload.append('session_id', sessionId);
  payload.append('reason', reason);
  const response = await api.post<{ message: string }>(`/student/${rollnum}/request-reevaluation`, payload);
  return response.data;
};

export const changeStudentPassword = async (oldPassword: string, newPassword: string) => {
  const response = await api.post<{ message: string }>('/student/change-password', {
    old_password: oldPassword,
    new_password: newPassword,
  });
  return response.data;
};
