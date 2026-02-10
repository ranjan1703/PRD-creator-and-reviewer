import { prisma } from './database';
import { encryptionService } from './encryption';
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

/**
 * Database-backed configuration service with encryption
 * Provides user-specific settings with encrypted API keys
 */
export class ConfigDBService {
  private static instance: ConfigDBService;
  private userSettingsCache: Map<string, UserSettings> = new Map();

  private constructor() {
    console.log('⚙️  ConfigDB Service initialized with encryption');
  }

  static getInstance(): ConfigDBService {
    if (!ConfigDBService.instance) {
      ConfigDBService.instance = new ConfigDBService();
    }
    return ConfigDBService.instance;
  }

  /**
   * Load user settings from database (with decryption)
   */
  async loadUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      const dbSettings = await prisma.userSettings.findUnique({
        where: { userId },
      });

      if (!dbSettings) {
        // Check cache
        return this.userSettingsCache.get(userId) || null;
      }

      // Decrypt API keys
      const settings: UserSettings = {
        aiProvider: dbSettings.aiProvider as 'gemini',
        geminiModel: dbSettings.geminiModel,
        apiKeys: {
          gemini: dbSettings.geminiApiKey
            ? encryptionService.decrypt(dbSettings.geminiApiKey)
            : undefined,
          jira:
            dbSettings.jiraEmail && dbSettings.jiraApiToken && dbSettings.jiraBaseUrl
              ? {
                  email: dbSettings.jiraEmail,
                  apiToken: encryptionService.decrypt(dbSettings.jiraApiToken),
                  baseUrl: dbSettings.jiraBaseUrl,
                }
              : undefined,
          confluence:
            dbSettings.confluenceApiToken && dbSettings.confluenceBaseUrl
              ? {
                  apiToken: encryptionService.decrypt(dbSettings.confluenceApiToken),
                  baseUrl: dbSettings.confluenceBaseUrl,
                }
              : undefined,
          notion: dbSettings.notionApiKey
            ? {
                apiKey: encryptionService.decrypt(dbSettings.notionApiKey),
              }
            : undefined,
        },
      };

      // Cache the decrypted settings
      this.userSettingsCache.set(userId, settings);

      return settings;
    } catch (error) {
      console.error('Failed to load user settings:', error);
      return null;
    }
  }

  /**
   * Save user settings to database (with encryption)
   */
  async saveUserSettings(userId: string, settings: UserSettings): Promise<void> {
    try {
      // Encrypt API keys before storing
      const encryptedSettings = {
        aiProvider: settings.aiProvider,
        geminiModel: settings.geminiModel,
        geminiApiKey: settings.apiKeys?.gemini
          ? encryptionService.encrypt(settings.apiKeys.gemini)
          : null,
        jiraEmail: settings.apiKeys?.jira?.email || null,
        jiraApiToken: settings.apiKeys?.jira?.apiToken
          ? encryptionService.encrypt(settings.apiKeys.jira.apiToken)
          : null,
        jiraBaseUrl: settings.apiKeys?.jira?.baseUrl || null,
        confluenceApiToken: settings.apiKeys?.confluence?.apiToken
          ? encryptionService.encrypt(settings.apiKeys.confluence.apiToken)
          : null,
        confluenceBaseUrl: settings.apiKeys?.confluence?.baseUrl || null,
        notionApiKey: settings.apiKeys?.notion?.apiKey
          ? encryptionService.encrypt(settings.apiKeys.notion.apiKey)
          : null,
      };

      // Upsert settings in database
      await prisma.userSettings.upsert({
        where: { userId },
        update: encryptedSettings,
        create: {
          userId,
          ...encryptedSettings,
        },
      });

      // Update cache
      this.userSettingsCache.set(userId, settings);

      console.log(`✅ Settings saved and encrypted for user ${userId}`);
    } catch (error) {
      console.error('Failed to save user settings:', error);
      throw new Error('Failed to save settings');
    }
  }

  /**
   * Get configuration value for a user (with fallback to env vars)
   */
  async get(userId: string, key: ConfigKey): Promise<string | undefined> {
    // Try user settings first
    let settings = this.userSettingsCache.get(userId);

    if (!settings) {
      const loadedSettings = await this.loadUserSettings(userId);
      if (loadedSettings) {
        settings = loadedSettings;
      }
    }

    if (settings) {
      switch (key) {
        case 'GEMINI_API_KEY':
          if (settings.apiKeys?.gemini) {
            return settings.apiKeys.gemini;
          }
          break;
        case 'GEMINI_MODEL':
          if (settings.geminiModel) {
            return settings.geminiModel;
          }
          break;
        case 'JIRA_EMAIL':
          if (settings.apiKeys?.jira?.email) {
            return settings.apiKeys.jira.email;
          }
          break;
        case 'JIRA_API_TOKEN':
          if (settings.apiKeys?.jira?.apiToken) {
            return settings.apiKeys.jira.apiToken;
          }
          break;
        case 'JIRA_BASE_URL':
          if (settings.apiKeys?.jira?.baseUrl) {
            return settings.apiKeys.jira.baseUrl;
          }
          break;
        case 'CONFLUENCE_API_TOKEN':
          if (settings.apiKeys?.confluence?.apiToken) {
            return settings.apiKeys.confluence.apiToken;
          }
          break;
        case 'CONFLUENCE_BASE_URL':
          if (settings.apiKeys?.confluence?.baseUrl) {
            return settings.apiKeys.confluence.baseUrl;
          }
          break;
        case 'NOTION_API_KEY':
          if (settings.apiKeys?.notion?.apiKey) {
            return settings.apiKeys.notion.apiKey;
          }
          break;
      }
    }

    // Fallback to environment variables
    return process.env[key];
  }

  /**
   * Check if all required configuration keys are available for a user
   */
  async isConfigured(userId: string, keys: ConfigKey[]): Promise<boolean> {
    const values = await Promise.all(keys.map(key => this.get(userId, key)));
    return values.every(value => value !== undefined && value !== '');
  }

  /**
   * Get current user settings (sanitized for frontend)
   */
  async getCurrentSettings(userId: string): Promise<Partial<UserSettings> | null> {
    const settings = await this.loadUserSettings(userId);

    if (!settings) {
      return null;
    }

    // Return settings with API keys masked
    return {
      aiProvider: settings.aiProvider,
      geminiModel: settings.geminiModel,
      apiKeys: {
        gemini: settings.apiKeys?.gemini ? '***' : undefined,
        jira: settings.apiKeys?.jira
          ? {
              email: settings.apiKeys.jira.email,
              apiToken: '***',
              baseUrl: settings.apiKeys.jira.baseUrl,
            }
          : undefined,
        confluence: settings.apiKeys?.confluence
          ? {
              apiToken: '***',
              baseUrl: settings.apiKeys.confluence.baseUrl,
            }
          : undefined,
        notion: settings.apiKeys?.notion
          ? {
              apiKey: '***',
            }
          : undefined,
      },
    };
  }

  /**
   * Clear cache for a user (call after settings update)
   */
  clearCache(userId: string): void {
    this.userSettingsCache.delete(userId);
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.userSettingsCache.clear();
  }
}

export const configDBService = ConfigDBService.getInstance();
