import api from './api';
import type { CreateIssueRequest, Issue } from '../types';

export const reportIssue = async (data: CreateIssueRequest): Promise<Issue> => {
  const response = await api.post<Issue>('/issues/report', data);
  return response.data;
};
