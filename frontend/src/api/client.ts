import axios from 'axios';
import type {
  CreatePRDRequest,
  CreatePRDResponse,
  ReviewPRDRequest,
  ReviewPRDResponse,
  FetchJiraRequest,
  FetchJiraResponse,
  LoginRequest,
  LoginResponse,
  ValidateResponse,
  UserSettings,
  SettingsResponse,
  TestConnectionResponse,
} from '../../../shared/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add auth token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle 401 errors (session expired)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired or invalid, clear token and redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

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

export const authApi = {
  async register(request: {
    email: string;
    username: string;
    password: string;
    name?: string;
  }): Promise<{ success: boolean; userId?: string; error?: string; message?: string }> {
    const { data } = await apiClient.post('/auth/register', request);
    return data;
  },

  async login(request: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', request);
    return data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async validate(): Promise<ValidateResponse> {
    const { data } = await apiClient.get<ValidateResponse>('/auth/validate');
    return data;
  },

  async getCurrentUser(): Promise<any> {
    const { data } = await apiClient.get('/auth/me');
    return data;
  },
};

export const settingsApi = {
  async get(): Promise<SettingsResponse> {
    const { data } = await apiClient.get<SettingsResponse>('/settings');
    return data;
  },

  async save(settings: UserSettings): Promise<SettingsResponse> {
    const { data } = await apiClient.post<SettingsResponse>('/settings', settings);
    return data;
  },

  async test(integration: string, testSettings: Partial<UserSettings>): Promise<TestConnectionResponse> {
    const { data } = await apiClient.post<TestConnectionResponse>(`/settings/test/${integration}`, testSettings);
    return data;
  },
};
