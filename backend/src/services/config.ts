import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { UserSettings } from '../../../shared/types';

type ConfigKey =
  | 'GEMINI_API_KEY'
  | 'GEMINI_MODEL'
  | 'JIRA_EMAIL'
  | 'JIRA_API_TOKEN'
  | 'JIRA_BASE_URL'
  | 'CONFLUENCE_API_TOKEN'
  | 'CONFLUENCE_BASE_URL'
  | 'NOTION_API_KEY';

export class ConfigService {
  private static instance: ConfigService;
  private userSettings: UserSettings | null = null;
  private readonly SETTINGS_FILE: string;

  private constructor() {
    // Store settings in ~/.prd-system/settings.json
    const appDir = path.join(os.homedir(), '.prd-system');
    if (!fs.existsSync(appDir)) {
      fs.mkdirSync(appDir, { recursive: true });
    }
    this.SETTINGS_FILE = path.join(appDir, 'settings.json');
    this.loadUserSettings();
  }

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  /**
   * Load user settings from file storage
   */
  loadUserSettings(): void {
    try {
      if (fs.existsSync(this.SETTINGS_FILE)) {
        const data = fs.readFileSync(this.SETTINGS_FILE, 'utf-8');
        this.userSettings = JSON.parse(data);
        console.log('User settings loaded successfully');
      } else {
        console.log('No user settings file found, using environment variables');
        this.userSettings = null;
      }
    } catch (error) {
      console.error('Failed to load user settings:', error);
      this.userSettings = null;
    }
  }

  /**
   * Save user settings to file storage
   */
  saveUserSettings(settings: UserSettings): void {
    try {
      this.userSettings = settings;
      fs.writeFileSync(this.SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
      console.log('User settings saved successfully');
    } catch (error) {
      console.error('Failed to save user settings:', error);
      throw new Error('Failed to save settings');
    }
  }

  /**
   * Get configuration value with precedence: user settings > environment variables
   */
  get(key: ConfigKey): string | undefined {
    // Try user settings first (HIGHEST PRIORITY)
    if (this.userSettings) {
      switch (key) {
        case 'GEMINI_API_KEY':
          if (this.userSettings.apiKeys?.gemini) {
            return this.userSettings.apiKeys.gemini;
          }
          break;
        case 'GEMINI_MODEL':
          if (this.userSettings.geminiModel) {
            return this.userSettings.geminiModel;
          }
          break;
        case 'JIRA_EMAIL':
          if (this.userSettings.apiKeys?.jira?.email) {
            return this.userSettings.apiKeys.jira.email;
          }
          break;
        case 'JIRA_API_TOKEN':
          if (this.userSettings.apiKeys?.jira?.apiToken) {
            return this.userSettings.apiKeys.jira.apiToken;
          }
          break;
        case 'JIRA_BASE_URL':
          if (this.userSettings.apiKeys?.jira?.baseUrl) {
            return this.userSettings.apiKeys.jira.baseUrl;
          }
          break;
        case 'CONFLUENCE_API_TOKEN':
          if (this.userSettings.apiKeys?.confluence?.apiToken) {
            return this.userSettings.apiKeys.confluence.apiToken;
          }
          break;
        case 'CONFLUENCE_BASE_URL':
          if (this.userSettings.apiKeys?.confluence?.baseUrl) {
            return this.userSettings.apiKeys.confluence.baseUrl;
          }
          break;
        case 'NOTION_API_KEY':
          if (this.userSettings.apiKeys?.notion?.apiKey) {
            return this.userSettings.apiKeys.notion.apiKey;
          }
          break;
      }
    }

    // Fallback to environment variables
    return process.env[key];
  }

  /**
   * Check if all required configuration keys are available
   */
  isConfigured(keys: ConfigKey[]): boolean {
    return keys.every(key => {
      const value = this.get(key);
      return value !== undefined && value !== '';
    });
  }

  /**
   * Get current user settings (sanitized for frontend)
   */
  getCurrentSettings(): Partial<UserSettings> | null {
    if (!this.userSettings) {
      return null;
    }

    // Return settings with API keys masked (for security)
    return {
      aiProvider: this.userSettings.aiProvider,
      geminiModel: this.userSettings.geminiModel,
      apiKeys: {
        gemini: this.userSettings.apiKeys?.gemini ? '***' : undefined,
        jira: this.userSettings.apiKeys?.jira ? {
          email: this.userSettings.apiKeys.jira.email,
          apiToken: '***',
          baseUrl: this.userSettings.apiKeys.jira.baseUrl,
        } : undefined,
        confluence: this.userSettings.apiKeys?.confluence ? {
          apiToken: '***',
          baseUrl: this.userSettings.apiKeys.confluence.baseUrl,
        } : undefined,
        notion: this.userSettings.apiKeys?.notion ? {
          apiKey: '***',
        } : undefined,
      },
    };
  }

  /**
   * Get full settings (including API keys) - use only for backend operations
   */
  getFullSettings(): UserSettings | null {
    return this.userSettings;
  }

  /**
   * Check if user has configured any settings
   */
  hasUserSettings(): boolean {
    return this.userSettings !== null;
  }

  /**
   * Clear all user settings (for testing/debugging)
   */
  clearSettings(): void {
    try {
      if (fs.existsSync(this.SETTINGS_FILE)) {
        fs.unlinkSync(this.SETTINGS_FILE);
      }
      this.userSettings = null;
      console.log('User settings cleared');
    } catch (error) {
      console.error('Failed to clear settings:', error);
    }
  }
}

export const configService = ConfigService.getInstance();
