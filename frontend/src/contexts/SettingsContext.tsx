import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserSettings, TestConnectionResponse } from '../../../shared/types';

interface SettingsContextType {
  settings: Partial<UserSettings> | null;
  loading: boolean;
  saving: boolean;
  loadSettings: () => Promise<void>;
  saveSettings: (settings: UserSettings) => Promise<{ success: boolean; error?: string }>;
  testConnection: (integration: string, testSettings: Partial<UserSettings>) => Promise<TestConnectionResponse>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Partial<UserSettings> | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  /**
   * Load settings from backend
   */
  const loadSettings = async (): Promise<void> => {
    setLoading(true);
    try {
      const { settingsApi } = await import('../api/client');
      const response = await settingsApi.get();

      if (response.success && response.settings) {
        setSettings(response.settings);
        // Also store in localStorage for quick access
        localStorage.setItem('userSettings', JSON.stringify(response.settings));
      } else {
        setSettings(null);
        localStorage.removeItem('userSettings');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Try to load from localStorage as fallback
      const cached = localStorage.getItem('userSettings');
      if (cached) {
        try {
          setSettings(JSON.parse(cached));
        } catch (e) {
          console.error('Failed to parse cached settings:', e);
          setSettings(null);
        }
      } else {
        setSettings(null);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save settings to backend
   */
  const saveSettings = async (newSettings: UserSettings): Promise<{ success: boolean; error?: string }> => {
    setSaving(true);
    try {
      const { settingsApi } = await import('../api/client');
      const response = await settingsApi.save(newSettings);

      if (response.success && response.settings) {
        setSettings(response.settings);
        // Update localStorage
        localStorage.setItem('userSettings', JSON.stringify(response.settings));
        return { success: true };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to save settings',
        };
      }
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      return {
        success: false,
        error: error.message || 'An error occurred while saving settings',
      };
    } finally {
      setSaving(false);
    }
  };

  /**
   * Test connection to an integration
   */
  const testConnection = async (
    integration: string,
    testSettings: Partial<UserSettings>
  ): Promise<TestConnectionResponse> => {
    try {
      const { settingsApi } = await import('../api/client');
      const response = await settingsApi.test(integration, testSettings);
      return response;
    } catch (error: any) {
      console.error(`Failed to test ${integration} connection:`, error);
      return {
        success: false,
        message: error.message || `Failed to test ${integration} connection`,
      };
    }
  };

  /**
   * On mount, load settings from backend
   */
  useEffect(() => {
    loadSettings();
  }, []);

  const value: SettingsContextType = {
    settings,
    loading,
    saving,
    loadSettings,
    saveSettings,
    testConnection,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

/**
 * Hook to use the settings context
 */
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
