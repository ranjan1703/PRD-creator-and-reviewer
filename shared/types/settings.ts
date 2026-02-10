export interface UserSettings {
  aiProvider: 'gemini'; // Future: 'gemini' | 'claude'
  geminiModel: string; // e.g., 'gemini-2.5-pro', 'gemini-2.5-flash'
  apiKeys: {
    gemini?: string;
    jira?: {
      email: string;
      apiToken: string;
      baseUrl: string;
    };
    confluence?: {
      apiToken: string;
      baseUrl: string;
    };
    notion?: {
      apiKey: string;
    };
  };
}

export interface SettingsResponse {
  success: boolean;
  settings?: Partial<UserSettings>; // Partial to allow masking sensitive data
  error?: string;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
}
