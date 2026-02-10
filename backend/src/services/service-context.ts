import { configDBService } from './config-db';

/**
 * Service context for user-specific operations
 * Provides configuration access scoped to a specific user
 */
export class ServiceContext {
  constructor(public readonly userId: string) {}

  /**
   * Get configuration value for the current user
   */
  async getConfig(key: string): Promise<string | undefined> {
    return configDBService.get(this.userId, key as any);
  }

  /**
   * Check if required configuration keys are available
   */
  async isConfigured(keys: string[]): Promise<boolean> {
    return configDBService.isConfigured(this.userId, keys as any);
  }

  /**
   * Get all user settings
   */
  async getSettings() {
    return configDBService.loadUserSettings(this.userId);
  }
}

/**
 * Create a service context for a user
 */
export function createServiceContext(userId: string): ServiceContext {
  return new ServiceContext(userId);
}
