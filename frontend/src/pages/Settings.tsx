import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import type { UserSettings } from '../../../shared/types';

export const Settings: React.FC = () => {
  const { settings, saving, saveSettings, testConnection } = useSettings();

  // Form state
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-pro');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [jiraBaseUrl, setJiraBaseUrl] = useState('');
  const [jiraEmail, setJiraEmail] = useState('');
  const [jiraApiToken, setJiraApiToken] = useState('');
  const [confluenceBaseUrl, setConfluenceBaseUrl] = useState('');
  const [confluenceApiToken, setConfluenceApiToken] = useState('');
  const [notionApiKey, setNotionApiKey] = useState('');

  // Test states
  const [testingGemini, setTestingGemini] = useState(false);
  const [testingJira, setTestingJira] = useState(false);
  const [testingConfluence, setTestingConfluence] = useState(false);
  const [testingNotion, setTestingNotion] = useState(false);

  // Messages
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load settings into form on mount
  useEffect(() => {
    if (settings) {
      setGeminiModel(settings.geminiModel || 'gemini-2.5-pro');
      // API keys are masked, so only update if they exist (user can leave them as is)
      if (settings.apiKeys?.jira) {
        setJiraEmail(settings.apiKeys.jira.email || '');
        setJiraBaseUrl(settings.apiKeys.jira.baseUrl || '');
      }
      if (settings.apiKeys?.confluence) {
        setConfluenceBaseUrl(settings.apiKeys.confluence.baseUrl || '');
      }
    }
  }, [settings]);

  const handleSave = async () => {
    setMessage(null);

    const newSettings: UserSettings = {
      aiProvider: 'gemini',
      geminiModel,
      apiKeys: {
        ...(geminiApiKey && { gemini: geminiApiKey }),
        ...(jiraEmail && jiraApiToken && jiraBaseUrl && {
          jira: {
            email: jiraEmail,
            apiToken: jiraApiToken,
            baseUrl: jiraBaseUrl,
          },
        }),
        ...(confluenceApiToken && confluenceBaseUrl && {
          confluence: {
            apiToken: confluenceApiToken,
            baseUrl: confluenceBaseUrl,
          },
        }),
        ...(notionApiKey && {
          notion: {
            apiKey: notionApiKey,
          },
        }),
      },
    };

    const result = await saveSettings(newSettings);

    if (result.success) {
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      // Clear password fields after save
      setGeminiApiKey('');
      setJiraApiToken('');
      setConfluenceApiToken('');
      setNotionApiKey('');
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to save settings' });
    }
  };

  const handleTestGemini = async () => {
    setMessage(null);
    setTestingGemini(true);

    const result = await testConnection('gemini', {
      aiProvider: 'gemini',
      geminiModel,
      apiKeys: { gemini: geminiApiKey },
    });

    setTestingGemini(false);

    if (result.success) {
      setMessage({ type: 'success', text: result.message });
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  const handleTestJira = async () => {
    setMessage(null);
    setTestingJira(true);

    const result = await testConnection('jira', {
      aiProvider: 'gemini',
      geminiModel: 'gemini-2.5-pro',
      apiKeys: {
        jira: {
          email: jiraEmail,
          apiToken: jiraApiToken,
          baseUrl: jiraBaseUrl,
        },
      },
    });

    setTestingJira(false);

    if (result.success) {
      setMessage({ type: 'success', text: result.message });
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  const handleTestConfluence = async () => {
    setMessage(null);
    setTestingConfluence(true);

    const result = await testConnection('confluence', {
      aiProvider: 'gemini',
      geminiModel: 'gemini-2.5-pro',
      apiKeys: {
        confluence: {
          apiToken: confluenceApiToken,
          baseUrl: confluenceBaseUrl,
        },
      },
    });

    setTestingConfluence(false);

    if (result.success) {
      setMessage({ type: 'success', text: result.message });
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  const handleTestNotion = async () => {
    setMessage(null);
    setTestingNotion(true);

    const result = await testConnection('notion', {
      aiProvider: 'gemini',
      geminiModel: 'gemini-2.5-pro',
      apiKeys: {
        notion: {
          apiKey: notionApiKey,
        },
      },
    });

    setTestingNotion(false);

    if (result.success) {
      setMessage({ type: 'success', text: result.message });
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Settings</h2>
      </div>

      {message && (
        <div
          className={`px-4 py-3 rounded ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* AI Configuration */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">AI Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Model
            </label>
            <select
              value={geminiModel}
              onChange={(e) => setGeminiModel(e.target.value)}
              className="input w-full"
            >
              <option value="gemini-2.5-pro">Gemini 2.5 Pro (Recommended)</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Faster)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gemini API Key
            </label>
            <input
              type="password"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              className="input w-full"
              placeholder="Enter new API key or leave blank to keep existing"
            />
          </div>

          <button
            onClick={handleTestGemini}
            disabled={!geminiApiKey || testingGemini}
            className="btn btn-secondary text-sm"
          >
            {testingGemini ? 'Testing...' : 'Test Connection'}
          </button>
        </div>
      </div>

      {/* Jira Integration */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Jira Integration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base URL
            </label>
            <input
              type="url"
              value={jiraBaseUrl}
              onChange={(e) => setJiraBaseUrl(e.target.value)}
              className="input w-full"
              placeholder="https://your-company.atlassian.net"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={jiraEmail}
              onChange={(e) => setJiraEmail(e.target.value)}
              className="input w-full"
              placeholder="your-email@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Token
            </label>
            <input
              type="password"
              value={jiraApiToken}
              onChange={(e) => setJiraApiToken(e.target.value)}
              className="input w-full"
              placeholder="Enter new API token or leave blank to keep existing"
            />
          </div>

          <button
            onClick={handleTestJira}
            disabled={!jiraEmail || !jiraApiToken || !jiraBaseUrl || testingJira}
            className="btn btn-secondary text-sm"
          >
            {testingJira ? 'Testing...' : 'Test Connection'}
          </button>
        </div>
      </div>

      {/* Confluence Integration */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Confluence Integration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base URL
            </label>
            <input
              type="url"
              value={confluenceBaseUrl}
              onChange={(e) => setConfluenceBaseUrl(e.target.value)}
              className="input w-full"
              placeholder="https://your-company.atlassian.net"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Token
            </label>
            <input
              type="password"
              value={confluenceApiToken}
              onChange={(e) => setConfluenceApiToken(e.target.value)}
              className="input w-full"
              placeholder="Enter new API token or leave blank to keep existing"
            />
          </div>

          <button
            onClick={handleTestConfluence}
            disabled={!confluenceApiToken || !confluenceBaseUrl || testingConfluence}
            className="btn btn-secondary text-sm"
          >
            {testingConfluence ? 'Testing...' : 'Test Connection'}
          </button>
        </div>
      </div>

      {/* Notion Integration */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Notion Integration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <input
              type="password"
              value={notionApiKey}
              onChange={(e) => setNotionApiKey(e.target.value)}
              className="input w-full"
              placeholder="Enter new API key or leave blank to keep existing"
            />
          </div>

          <button
            onClick={handleTestNotion}
            disabled={!notionApiKey || testingNotion}
            className="btn btn-secondary text-sm"
          >
            {testingNotion ? 'Testing...' : 'Test Connection'}
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};
