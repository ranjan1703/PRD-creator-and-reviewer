export interface JiraTicket {
  id: string;
  key: string;
  summary: string;
  description: string;
  issueType: string;
  status: string;
  priority: string;
  assignee?: string;
  reporter?: string;
  created: string;
  updated: string;
  comments: JiraComment[];
  customFields?: Record<string, any>;
}

export interface JiraComment {
  id: string;
  author: string;
  body: string;
  created: string;
}

export interface FetchJiraRequest {
  ticketId: string | string[]; // Support single or multiple ticket IDs
}

export interface FetchJiraResponse {
  success: boolean;
  ticket?: JiraTicket;
  tickets?: JiraTicket[]; // Array of tickets for multiple ticket support
  prdInput?: string;
  summary?: string;
  isMultiple?: boolean;
  count?: number;
  error?: string;
}
