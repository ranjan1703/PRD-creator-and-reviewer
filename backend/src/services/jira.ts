import { JiraTicket, JiraComment } from '../../../shared/types/jira';
import { GoogleGenerativeAI } from '@google/generative-ai';

let jiraInstance: JiraService | null = null;

// Helper function to extract text from Atlassian Document Format (ADF)
function extractTextFromADF(adf: any): string {
  if (!adf) return '';

  // If it's already a string, return it
  if (typeof adf === 'string') return adf;

  // If it's an ADF object
  if (adf.type === 'doc' && Array.isArray(adf.content)) {
    return adf.content.map((node: any) => extractTextFromADFNode(node)).join('\n');
  }

  return '';
}

function extractTextFromADFNode(node: any): string {
  if (!node) return '';

  // If it's a text node, return the text
  if (node.type === 'text') {
    return node.text || '';
  }

  // If it has content array, recursively extract
  if (Array.isArray(node.content)) {
    return node.content.map((child: any) => extractTextFromADFNode(child)).join('');
  }

  return '';
}

export class JiraService {
  private baseUrl: string;
  private email: string;
  private apiToken: string;
  private authHeader: string;

  constructor() {
    this.baseUrl = process.env.JIRA_BASE_URL || '';
    this.email = process.env.JIRA_EMAIL || '';
    this.apiToken = process.env.JIRA_API_TOKEN || '';
    this.authHeader = Buffer.from(`${this.email}:${this.apiToken}`).toString('base64');

    // Debug logging
    console.log('🔍 Jira Service initialized with:');
    console.log('  - JIRA_BASE_URL:', this.baseUrl ? '✓ Set' : '✗ Missing');
    console.log('  - JIRA_EMAIL:', this.email ? '✓ Set' : '✗ Missing');
    console.log('  - JIRA_API_TOKEN:', this.apiToken ? '✓ Set' : '✗ Missing');
  }

  isConfigured(): boolean {
    const configured = !!(this.baseUrl && this.email && this.apiToken);
    console.log('🔍 Jira isConfigured:', configured);
    return configured;
  }

  async fetchTicket(ticketId: string): Promise<JiraTicket> {
    if (!this.isConfigured()) {
      throw new Error('Jira integration is not configured. Please set JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN environment variables.');
    }

    try {
      // Fetch issue details
      const issueResponse = await fetch(
        `${this.baseUrl}/rest/api/3/issue/${ticketId}?expand=renderedFields`,
        {
          headers: {
            'Authorization': `Basic ${this.authHeader}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!issueResponse.ok) {
        const errorText = await issueResponse.text();
        throw new Error(`Jira API error: ${issueResponse.status} - ${errorText}`);
      }

      const issue = await issueResponse.json() as any;

      // Fetch comments
      const commentsResponse = await fetch(
        `${this.baseUrl}/rest/api/3/issue/${ticketId}/comment`,
        {
          headers: {
            'Authorization': `Basic ${this.authHeader}`,
            'Accept': 'application/json',
          },
        }
      );

      const commentsData = await commentsResponse.json() as any;
      const comments: JiraComment[] = (commentsData.comments || []).map((c: any) => {
        // Extract text from ADF format
        let bodyText = '';
        if (c.body) {
          bodyText = extractTextFromADF(c.body);
        }

        return {
          id: c.id,
          author: c.author?.displayName || 'Unknown',
          body: bodyText || '[No comment text]',
          created: c.created,
        };
      });

      // Transform to our format
      const ticket: JiraTicket = {
        id: issue.id,
        key: issue.key,
        summary: issue.fields.summary,
        description: issue.renderedFields?.description || issue.fields.description || '',
        issueType: issue.fields.issuetype?.name || 'Unknown',
        status: issue.fields.status?.name || 'Unknown',
        priority: issue.fields.priority?.name || 'Unknown',
        assignee: issue.fields.assignee?.displayName,
        reporter: issue.fields.reporter?.displayName,
        created: issue.fields.created,
        updated: issue.fields.updated,
        comments,
        customFields: issue.fields,
      };

      return ticket;
    } catch (error: any) {
      console.error('Error fetching Jira ticket:', error);
      throw new Error(`Failed to fetch Jira ticket: ${error.message}`);
    }
  }

  /**
   * Transform Jira ticket into text suitable for PRD creation
   */
  transformTicketToPRDInput(ticket: JiraTicket): string {
    let input = `# ${ticket.summary}\n\n`;
    input += `**Issue Type:** ${ticket.issueType}\n`;
    input += `**Priority:** ${ticket.priority}\n`;
    input += `**Status:** ${ticket.status}\n\n`;

    if (ticket.description) {
      input += `## Description\n${ticket.description}\n\n`;
    }

    if (ticket.comments && ticket.comments.length > 0) {
      input += `## Comments and Discussion\n`;
      ticket.comments.forEach((comment) => {
        input += `\n**${comment.author}** (${new Date(comment.created).toLocaleDateString()}):\n`;
        input += `${comment.body}\n`;
      });
    }

    // Check for acceptance criteria in custom fields
    if (ticket.customFields) {
      const acceptanceCriteria =
        ticket.customFields['customfield_10100'] || // Common field for AC
        ticket.customFields.acceptanceCriteria;

      if (acceptanceCriteria) {
        input += `\n## Acceptance Criteria\n${acceptanceCriteria}\n`;
      }
    }

    return input;
  }

  /**
   * Generate AI summary of Jira ticket
   */
  async generateSummary(ticket: JiraTicket): Promise<string> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); // Use Flash for speed

    // Build context from ticket
    let context = `Ticket: ${ticket.key} - ${ticket.summary}\n\n`;
    context += `Type: ${ticket.issueType} | Priority: ${ticket.priority} | Status: ${ticket.status}\n\n`;

    if (ticket.description) {
      context += `Description:\n${ticket.description}\n\n`;
    }

    if (ticket.comments && ticket.comments.length > 0) {
      context += `Comments (${ticket.comments.length}):\n`;
      ticket.comments.forEach(comment => {
        context += `- ${comment.author}: ${comment.body.substring(0, 200)}${comment.body.length > 200 ? '...' : ''}\n`;
      });
    }

    const prompt = `Analyze this Jira ticket and provide a concise summary in 3-4 sentences.
Focus on:
1. What is the problem or request?
2. Key details from the description
3. Important points from comments (if any)

Keep it professional and actionable.

${context}`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  /**
   * Fetch multiple Jira tickets in parallel
   */
  async fetchMultipleTickets(ticketIds: string[]): Promise<JiraTicket[]> {
    console.log(`Fetching ${ticketIds.length} Jira tickets:`, ticketIds.join(', '));

    // Fetch all tickets in parallel
    const ticketPromises = ticketIds.map(id => this.fetchTicket(id.trim()));
    const tickets = await Promise.all(ticketPromises);

    return tickets;
  }

  /**
   * Generate combined summary for multiple tickets
   */
  async generateCombinedSummary(tickets: JiraTicket[]): Promise<string> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Build context from all tickets
    let context = `Analyzing ${tickets.length} related Jira tickets:\n\n`;

    tickets.forEach((ticket, index) => {
      context += `### Ticket ${index + 1}: ${ticket.key} - ${ticket.summary}\n`;
      context += `Type: ${ticket.issueType} | Priority: ${ticket.priority} | Status: ${ticket.status}\n`;

      if (ticket.description) {
        const desc = ticket.description.length > 300
          ? ticket.description.substring(0, 300) + '...'
          : ticket.description;
        context += `Description: ${desc}\n`;
      }

      if (ticket.comments && ticket.comments.length > 0) {
        context += `Comments: ${ticket.comments.length} comment(s)\n`;
      }

      context += '\n';
    });

    const prompt = `Analyze these ${tickets.length} related Jira tickets and provide a unified summary (4-6 sentences).

Focus on:
1. What is the overall problem or theme across these tickets?
2. Are these tickets related? How?
3. What are the key requirements or issues to address?
4. Any common patterns or dependencies?

Provide a cohesive summary that helps understand the bigger picture.

${context}`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  /**
   * Transform multiple Jira tickets into combined PRD input
   */
  transformMultipleTicketsToPRDInput(tickets: JiraTicket[]): string {
    let input = `# Combined PRD from ${tickets.length} Jira Tickets\n\n`;
    input += `**Tickets:** ${tickets.map(t => t.key).join(', ')}\n\n`;

    // Add overview section
    input += `## Overview\n\n`;
    input += `This PRD addresses the following related tickets:\n\n`;
    tickets.forEach(ticket => {
      input += `- **${ticket.key}**: ${ticket.summary} (${ticket.issueType}, ${ticket.priority})\n`;
    });
    input += `\n`;

    // Add detailed sections for each ticket
    tickets.forEach((ticket, index) => {
      input += `## Ticket ${index + 1}: ${ticket.key} - ${ticket.summary}\n\n`;
      input += `**Issue Type:** ${ticket.issueType}\n`;
      input += `**Priority:** ${ticket.priority}\n`;
      input += `**Status:** ${ticket.status}\n\n`;

      if (ticket.description) {
        input += `### Description\n${ticket.description}\n\n`;
      }

      if (ticket.comments && ticket.comments.length > 0) {
        input += `### Comments and Discussion\n`;
        ticket.comments.forEach((comment) => {
          input += `\n**${comment.author}** (${new Date(comment.created).toLocaleDateString()}):\n`;
          input += `${comment.body}\n`;
        });
        input += `\n`;
      }

      // Check for acceptance criteria
      if (ticket.customFields) {
        const acceptanceCriteria =
          ticket.customFields['customfield_10100'] ||
          ticket.customFields.acceptanceCriteria;

        if (acceptanceCriteria) {
          input += `### Acceptance Criteria\n${acceptanceCriteria}\n\n`;
        }
      }
    });

    return input;
  }

  /**
   * Add a comment to a Jira ticket
   */
  async addComment(ticketId: string, commentText: string): Promise<{ id: string; success: boolean }> {
    if (!this.isConfigured()) {
      throw new Error('Jira integration is not configured');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/rest/api/3/issue/${ticketId}/comment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${this.authHeader}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            body: {
              type: 'doc',
              version: 1,
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: commentText,
                    },
                  ],
                },
              ],
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add comment: ${response.status} - ${errorText}`);
      }

      const result = await response.json() as any;
      return { id: result.id, success: true };
    } catch (error: any) {
      console.error('Error adding comment to Jira:', error);
      throw new Error(`Failed to add comment: ${error.message}`);
    }
  }

  /**
   * Add an attachment to a Jira ticket
   */
  async addAttachment(ticketId: string, file: Buffer, filename: string): Promise<{ id: string; success: boolean; url: string }> {
    if (!this.isConfigured()) {
      throw new Error('Jira integration is not configured');
    }

    try {
      // Use axios for better multipart/form-data support
      const axios = (await import('axios')).default;
      const FormData = (await import('form-data')).default;

      const formData = new FormData();

      // Append the file with proper options including content type
      formData.append('file', file, {
        filename: filename,
        contentType: this.getContentType(filename),
      });

      // Make the request using axios
      const response = await axios.post(
        `${this.baseUrl}/rest/api/3/issue/${ticketId}/attachments`,
        formData,
        {
          headers: {
            'Authorization': `Basic ${this.authHeader}`,
            'Accept': 'application/json',
            'X-Atlassian-Token': 'no-check', // Required for attachments
            ...formData.getHeaders(), // This adds the Content-Type with boundary
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }
      );

      const result = response.data;
      const attachment = Array.isArray(result) ? result[0] : result;

      return {
        id: attachment.id,
        success: true,
        url: attachment.content || attachment.self,
      };
    } catch (error: any) {
      console.error('Error adding attachment to Jira:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.errorMessages?.[0] || error.message;
      throw new Error(`Failed to add attachment: ${errorMessage}`);
    }
  }

  /**
   * Get content type based on file extension
   */
  private getContentType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop() || '';
    const contentTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'doc': 'application/msword',
      'txt': 'text/plain',
      'md': 'text/markdown',
    };
    return contentTypes[ext] || 'application/octet-stream';
  }
}

// Lazy initialization function
function getJiraService(): JiraService {
  if (!jiraInstance) {
    jiraInstance = new JiraService();
  }
  return jiraInstance;
}

// Export a Proxy that creates the instance on first access
export const jiraService = new Proxy({} as JiraService, {
  get(_target, prop) {
    const instance = getJiraService();
    return instance[prop as keyof JiraService];
  }
});
