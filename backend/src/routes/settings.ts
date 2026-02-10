import { Router, Request, Response } from 'express';
import { configService } from '../services/config';
import { requireAuth } from '../middleware/auth';
import type { UserSettings, TestConnectionResponse } from '../../../shared/types';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

/**
 * GET /api/settings
 * Get current user settings (with API keys masked)
 */
router.get('/', requireAuth, (req: Request, res: Response): void => {
  try {
    const settings = configService.getCurrentSettings();

    res.status(200).json({
      success: true,
      settings: settings || undefined,
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve settings',
    });
  }
});

/**
 * POST /api/settings
 * Save user settings
 */
router.post('/', requireAuth, (req: Request, res: Response): void => {
  try {
    const settings = req.body as UserSettings;

    // Basic validation
    if (!settings || typeof settings !== 'object') {
      res.status(400).json({
        success: false,
        error: 'Invalid settings format',
      });
      return;
    }

    // Validate aiProvider
    if (settings.aiProvider && settings.aiProvider !== 'gemini') {
      res.status(400).json({
        success: false,
        error: 'Only "gemini" is supported as aiProvider currently',
      });
      return;
    }

    // Save settings
    configService.saveUserSettings(settings);

    // Reload settings
    configService.loadUserSettings();

    res.status(200).json({
      success: true,
      settings: configService.getCurrentSettings() || undefined,
    });
  } catch (error) {
    console.error('Save settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save settings',
    });
  }
});

/**
 * POST /api/settings/test/:integration
 * Test connection to an integration
 */
router.post('/test/:integration', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { integration } = req.params;
    const testSettings = req.body as Partial<UserSettings>;

    let result: TestConnectionResponse;

    switch (integration) {
      case 'gemini':
        result = await testGeminiConnection(testSettings);
        break;
      case 'jira':
        result = await testJiraConnection(testSettings);
        break;
      case 'confluence':
        result = await testConfluenceConnection(testSettings);
        break;
      case 'notion':
        result = await testNotionConnection(testSettings);
        break;
      default:
        res.status(400).json({
          success: false,
          message: `Unknown integration: ${integration}`,
        });
        return;
    }

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during connection test',
    });
  }
});

/**
 * Test Gemini API connection
 */
async function testGeminiConnection(settings: Partial<UserSettings>): Promise<TestConnectionResponse> {
  try {
    const apiKey = settings.apiKeys?.gemini;
    const model = settings.geminiModel || 'gemini-2.5-pro';

    if (!apiKey) {
      return {
        success: false,
        message: 'Gemini API key is required',
      };
    }

    // Test the API by making a simple request
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ model });

    const result = await geminiModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
    });

    if (result.response) {
      return {
        success: true,
        message: `Successfully connected to ${model}`,
      };
    }

    return {
      success: false,
      message: 'Failed to get valid response from Gemini API',
    };
  } catch (error: any) {
    console.error('Gemini connection test failed:', error);
    return {
      success: false,
      message: error.message || 'Failed to connect to Gemini API',
    };
  }
}

/**
 * Test Jira connection
 */
async function testJiraConnection(settings: Partial<UserSettings>): Promise<TestConnectionResponse> {
  try {
    const jiraConfig = settings.apiKeys?.jira;

    if (!jiraConfig?.email || !jiraConfig?.apiToken || !jiraConfig?.baseUrl) {
      return {
        success: false,
        message: 'Jira email, API token, and base URL are required',
      };
    }

    // Test the API by fetching user info
    const authHeader = Buffer.from(`${jiraConfig.email}:${jiraConfig.apiToken}`).toString('base64');

    const response = await fetch(`${jiraConfig.baseUrl}/rest/api/3/myself`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json() as any;
      return {
        success: true,
        message: `Successfully connected to Jira as ${data.displayName || jiraConfig.email}`,
      };
    }

    const errorText = await response.text();
    return {
      success: false,
      message: `Failed to connect to Jira: ${response.status} ${errorText}`,
    };
  } catch (error: any) {
    console.error('Jira connection test failed:', error);
    return {
      success: false,
      message: error.message || 'Failed to connect to Jira',
    };
  }
}

/**
 * Test Confluence connection
 */
async function testConfluenceConnection(settings: Partial<UserSettings>): Promise<TestConnectionResponse> {
  try {
    const confluenceConfig = settings.apiKeys?.confluence;

    if (!confluenceConfig?.apiToken || !confluenceConfig?.baseUrl) {
      return {
        success: false,
        message: 'Confluence API token and base URL are required',
      };
    }

    // Test the API by fetching current user
    const response = await fetch(`${confluenceConfig.baseUrl}/wiki/rest/api/user/current`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${confluenceConfig.apiToken}`,
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json() as any;
      return {
        success: true,
        message: `Successfully connected to Confluence as ${data.displayName || 'user'}`,
      };
    }

    const errorText = await response.text();
    return {
      success: false,
      message: `Failed to connect to Confluence: ${response.status} ${errorText}`,
    };
  } catch (error: any) {
    console.error('Confluence connection test failed:', error);
    return {
      success: false,
      message: error.message || 'Failed to connect to Confluence',
    };
  }
}

/**
 * Test Notion connection
 */
async function testNotionConnection(settings: Partial<UserSettings>): Promise<TestConnectionResponse> {
  try {
    const notionApiKey = settings.apiKeys?.notion?.apiKey;

    if (!notionApiKey) {
      return {
        success: false,
        message: 'Notion API key is required',
      };
    }

    // Test the API by listing users
    const response = await fetch('https://api.notion.com/v1/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Notion-Version': '2022-06-28',
      },
    });

    if (response.ok) {
      const data = await response.json() as any;
      return {
        success: true,
        message: `Successfully connected to Notion as ${data.name || 'user'}`,
      };
    }

    const errorText = await response.text();
    return {
      success: false,
      message: `Failed to connect to Notion: ${response.status} ${errorText}`,
    };
  } catch (error: any) {
    console.error('Notion connection test failed:', error);
    return {
      success: false,
      message: error.message || 'Failed to connect to Notion',
    };
  }
}

export default router;
