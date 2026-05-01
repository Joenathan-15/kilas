import axios from 'axios';
import type { CreateIssueRequest, Issue } from '../types';

const ISSUE_API_URL = import.meta.env.VITE_ISSUE_ADMIN_DOMAIN || 'http://localhost:8081/api';

const issueApi = axios.create({
  baseURL: ISSUE_API_URL,
});

// Optional: attach token if the external app uses the same auth
issueApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const reportIssue = async (data: CreateIssueRequest): Promise<Issue> => {
  const response = await issueApi.post<Issue>('/issues/report', data);
  return response.data;
};
