export interface PRDDocument {
  title: string;
  problem: string;
  successMetrics: string[];
  competitiveAnalysis: string;
  solution: {
    overview: string;
    userStories: string[];
    userFlow: string;
    requirements: string[];
  };
  design: string;
  analytics: string[];
  timeline: string;
  goToMarket: {
    marketing: string;
    opsAndSalesTraining: string;
    faqs: Array<{ question: string; answer: string }>;
  };
  actionItems: {
    product: string[];
    business: string[];
    design: string[];
  };
  feedback: string;
  learnings: string;
  appendix: {
    meetingNotes: string[];
  };
}

export interface PRDMetadata {
  id: string;
  createdAt: string;
  updatedAt: string;
  source: 'text' | 'jira' | 'file';
  sourceId?: string; // Jira ticket ID, etc.
}

export interface PRDWithMetadata {
  metadata: PRDMetadata;
  document: PRDDocument;
}

export interface CreatePRDRequest {
  input: string;
  inputType: 'text' | 'jira';
  sourceId?: string;
}

export interface CreatePRDResponse {
  success: boolean;
  prd?: PRDWithMetadata;
  markdown?: string;
  error?: string;
}
