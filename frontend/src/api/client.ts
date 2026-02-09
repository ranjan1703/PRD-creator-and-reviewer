import axios from 'axios';
import type {
  CreatePRDRequest,
  CreatePRDResponse,
  ReviewPRDRequest,
  ReviewPRDResponse,
  FetchJiraRequest,
  FetchJiraResponse,
} from '../../../shared/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const prdApi = {
  async create(request: CreatePRDRequest): Promise<CreatePRDResponse> {
    const { data } = await apiClient.post<CreatePRDResponse>('/prd/create', request);
    return data;
  },

  async review(request: ReviewPRDRequest): Promise<ReviewPRDResponse> {
    const { data } = await apiClient.post<ReviewPRDResponse>('/prd/review', request);
    return data;
  },

  async reviewDocument(formData: FormData): Promise<ReviewPRDResponse> {
    const { data } = await apiClient.post<ReviewPRDResponse>('/prd/review-document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  async list() {
    const { data } = await apiClient.get('/prd/list');
    return data;
  },

  async get(id: string) {
    const { data } = await apiClient.get(`/prd/${id}`);
    return data;
  },

  async exportDocument(markdown: string, format: 'pdf' | 'docx', title?: string): Promise<Blob> {
    const { data } = await apiClient.post(
      '/prd/export',
      { markdown, format, title },
      { responseType: 'blob' }
    );
    return data;
  },
};

export const jiraApi = {
  async status() {
    const { data } = await apiClient.get('/jira/status');
    return data;
  },

  async fetch(request: FetchJiraRequest): Promise<FetchJiraResponse> {
    const { data } = await apiClient.post<FetchJiraResponse>('/jira/fetch', request);
    return data;
  },

  async transform(request: FetchJiraRequest) {
    const { data } = await apiClient.post('/jira/transform', request);
    return data;
  },

  async addComment(ticketId: string, comment: string) {
    const { data } = await apiClient.post('/jira/comment', { ticketId, comment });
    return data;
  },

  async addAttachment(ticketId: string, filename: string, fileData: string) {
    const { data } = await apiClient.post('/jira/attachment', { ticketId, filename, fileData });
    return data;
  },
};

export const exportApi = {
  async status() {
    const { data } = await apiClient.get('/export/status');
    return data;
  },

  async export(payload: {
    platform: 'confluence' | 'notion';
    title: string;
    content: string;
    spaceKey?: string;
    parentPageId?: string;
  }) {
    const { data } = await apiClient.post('/export', payload);
    return data;
  },
};
