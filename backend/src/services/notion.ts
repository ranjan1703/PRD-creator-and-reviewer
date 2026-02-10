import { configService } from './config';

export class NotionService {
  // Use getter to dynamically read from ConfigService
  private get apiKey(): string {
    return configService.get('NOTION_API_KEY') || '';
  }

  constructor() {
    console.log('🔍 Notion Service initialized with ConfigService');
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Convert markdown to Notion blocks (simplified)
   */
  private markdownToNotionBlocks(markdown: string): any[] {
    const blocks: any[] = [];
    const lines = markdown.split('\n');

    let currentList: string[] = [];
    const flushList = () => {
      if (currentList.length > 0) {
        currentList.forEach((item) => {
          blocks.push({
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ type: 'text', text: { content: item } }],
            },
          });
        });
        currentList = [];
      }
    };

    for (const line of lines) {
      if (!line.trim()) {
        flushList();
        continue;
      }

      // Headings
      if (line.startsWith('# ')) {
        flushList();
        blocks.push({
          object: 'block',
          type: 'heading_1',
          heading_1: {
            rich_text: [{ type: 'text', text: { content: line.slice(2) } }],
          },
        });
      } else if (line.startsWith('## ')) {
        flushList();
        blocks.push({
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: line.slice(3) } }],
          },
        });
      } else if (line.startsWith('### ')) {
        flushList();
        blocks.push({
          object: 'block',
          type: 'heading_3',
          heading_3: {
            rich_text: [{ type: 'text', text: { content: line.slice(4) } }],
          },
        });
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        currentList.push(line.slice(2));
      } else if (line.startsWith('---')) {
        flushList();
        blocks.push({
          object: 'block',
          type: 'divider',
          divider: {},
        });
      } else {
        flushList();
        blocks.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: line } }],
          },
        });
      }
    }

    flushList();
    return blocks;
  }

  /**
   * Append blocks to an existing Notion page
   */
  private async appendBlocks(pageId: string, blocks: any[]): Promise<void> {
    const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({ children: blocks }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notion API error: ${response.status} - ${errorText}`);
    }
  }

  async createPage(
    parentPageId: string,
    title: string,
    content: string
  ): Promise<{ id: string; url: string }> {
    if (!this.isConfigured()) {
      throw new Error('Notion integration is not configured');
    }

    const allBlocks = this.markdownToNotionBlocks(content);

    // Split blocks into chunks of 100 (Notion API limit)
    const initialBlocks = allBlocks.slice(0, 100);
    const remainingBlocks = allBlocks.slice(100);

    const payload = {
      parent: { page_id: parentPageId },
      properties: {
        title: {
          title: [{ type: 'text', text: { content: title } }],
        },
      },
      children: initialBlocks,
    };

    try {
      // Create the page with the first 100 blocks
      const response = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Notion API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as { id: string; url: string };

      // Append remaining blocks in batches of 100
      if (remainingBlocks.length > 0) {
        for (let i = 0; i < remainingBlocks.length; i += 100) {
          const batch = remainingBlocks.slice(i, i + 100);
          await this.appendBlocks(data.id, batch);
        }
      }

      return {
        id: data.id,
        url: data.url,
      };
    } catch (error: any) {
      console.error('Error creating Notion page:', error);
      throw new Error(`Failed to create Notion page: ${error.message}`);
    }
  }
}

export const notionService = new NotionService();
