import { configService } from './config';

export class ConfluenceService {
  // Use getters to dynamically read from ConfigService
  private get baseUrl(): string {
    return configService.get('CONFLUENCE_BASE_URL') || '';
  }

  private get apiToken(): string {
    return configService.get('CONFLUENCE_API_TOKEN') || '';
  }

  private get authHeader(): string {
    // For Confluence Cloud, use the same email as Jira
    const email = configService.get('JIRA_EMAIL') || '';
    return Buffer.from(`${email}:${this.apiToken}`).toString('base64');
  }

  constructor() {
    console.log('🔍 Confluence Service initialized with ConfigService');
  }

  isConfigured(): boolean {
    return !!(this.baseUrl && this.apiToken);
  }

  /**
   * Convert markdown to Confluence storage format
   * Improved implementation with better handling of markdown syntax
   */
  private markdownToConfluenceStorage(markdown: string): string {
    let html = markdown;

    // Escape HTML special characters first
    html = html.replace(/&/g, '&amp;');
    html = html.replace(/</g, '&lt;');
    html = html.replace(/>/g, '&gt;');

    // Code blocks (```code```)
    html = html.replace(/```(\w+)?\n([\s\S]+?)```/g, (match, lang, code) => {
      return `<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">${lang || 'none'}</ac:parameter><ac:plain-text-body><![CDATA[${code.trim()}]]></ac:plain-text-body></ac:structured-macro>`;
    });

    // Inline code (`code`)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headings (must come before bold/italic to avoid conflicts)
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Bold and italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // Ordered lists
    const orderedListRegex = /(?:^\d+\.\s.+$\n?)+/gm;
    html = html.replace(orderedListRegex, (match) => {
      const items = match.trim().split('\n').map(line => {
        const text = line.replace(/^\d+\.\s/, '');
        return `<li>${text}</li>`;
      }).join('\n');
      return `<ol>\n${items}\n</ol>`;
    });

    // Unordered lists
    const unorderedListRegex = /(?:^[\*\-]\s.+$\n?)+/gm;
    html = html.replace(unorderedListRegex, (match) => {
      const items = match.trim().split('\n').map(line => {
        const text = line.replace(/^[\*\-]\s/, '');
        return `<li>${text}</li>`;
      }).join('\n');
      return `<ul>\n${items}\n</ul>`;
    });

    // Blockquotes
    html = html.replace(/^&gt;\s(.+)$/gm, '<blockquote>$1</blockquote>');

    // Horizontal rules
    html = html.replace(/^---+$/gm, '<hr />');

    // Tables (basic support)
    const tableRegex = /(?:^\|.+\|$\n?)+/gm;
    html = html.replace(tableRegex, (match) => {
      const lines = match.trim().split('\n');
      if (lines.length < 2) return match;

      const headerCells = lines[0].split('|').filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`).join('');
      const bodyRows = lines.slice(2).map(line => {
        const cells = line.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
        return `<tr>${cells}</tr>`;
      }).join('\n');

      return `<table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
    });

    // Paragraphs - split by double newlines
    const lines = html.split('\n');
    let inBlock = false;
    const processed: string[] = [];
    let currentParagraph: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Check if line is already an HTML block element
      if (trimmed.match(/^<(h[1-6]|ul|ol|blockquote|hr|table|ac:structured-macro)/i)) {
        if (currentParagraph.length > 0) {
          processed.push(`<p>${currentParagraph.join(' ')}</p>`);
          currentParagraph = [];
        }
        processed.push(line);
        inBlock = true;
      } else if (trimmed.match(/^<\/(ul|ol|blockquote|table|ac:structured-macro)/i)) {
        processed.push(line);
        inBlock = false;
      } else if (inBlock) {
        processed.push(line);
      } else if (trimmed === '') {
        if (currentParagraph.length > 0) {
          processed.push(`<p>${currentParagraph.join(' ')}</p>`);
          currentParagraph = [];
        }
      } else if (!trimmed.match(/^<[^>]+>$/)) {
        currentParagraph.push(trimmed);
      } else {
        processed.push(line);
      }
    }

    if (currentParagraph.length > 0) {
      processed.push(`<p>${currentParagraph.join(' ')}</p>`);
    }

    return processed.join('\n');
  }

  async createPage(
    spaceKey: string,
    title: string,
    content: string,
    parentPageId?: string
  ): Promise<{ id: string; url: string }> {
    if (!this.isConfigured()) {
      throw new Error('Confluence integration is not configured');
    }

    const storageContent = this.markdownToConfluenceStorage(content);

    const payload: any = {
      type: 'page',
      title,
      space: { key: spaceKey },
      body: {
        storage: {
          value: storageContent,
          representation: 'storage',
        },
      },
    };

    if (parentPageId) {
      payload.ancestors = [{ id: parentPageId }];
    }

    try {
      const response = await fetch(`${this.baseUrl}/rest/api/content`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.authHeader}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Confluence API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as { id: string };
      const pageUrl = `${this.baseUrl}/pages/viewpage.action?pageId=${data.id}`;

      return {
        id: data.id,
        url: pageUrl,
      };
    } catch (error: any) {
      console.error('Error creating Confluence page:', error);
      throw new Error(`Failed to create Confluence page: ${error.message}`);
    }
  }
}

export const confluenceService = new ConfluenceService();
