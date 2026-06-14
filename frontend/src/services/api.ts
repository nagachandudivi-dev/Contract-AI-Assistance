import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL;

const api = axios.create({ baseURL: API_BASE });

// Auth
export const register = (data: { fullName: string; email: string; username: string; password: string; role: string }) =>
  api.post('/api/auth/register', data);

export const login = (data: { username: string; password: string }) =>
  api.post('/api/auth/login', data);

// Documents
export const uploadDocument = (file: File, onProgress?: (pct: number) => void) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/api/documents/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: e => onProgress && onProgress(Math.round((e.loaded / (e.total || 1)) * 100)),
  });
};

export const getDocuments = () => api.get('/api/documents');
export const getDocument = (id: number) => api.get(`/api/documents/${id}`);
export const getDocumentChunks = (id: number) => api.get(`/api/documents/${id}/chunks`);
export const deleteDocument = (id: number) => api.delete(`/api/documents/${id}`);

// AI
export const askQuestion = (question: string) => api.post('/api/ai/ask', { question });
export const compareDocuments = (documentIds: number[], keywords: string[]) => api.post('/api/ai/compare', { documentIds, keywords });

// History
export const getQuestionHistory = () => api.get('/api/history/questions');

// Analytics
export const getAnalyticsSummary = () => api.get('/api/analytics/summary');
