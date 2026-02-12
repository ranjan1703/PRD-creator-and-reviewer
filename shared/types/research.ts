// Research Planner Types

// ========== Step 1 & 2: Problem Evaluation ==========

export interface CreateResearchSessionRequest {
  problemStatement: string;
  productContext: string;
  targetUserSegment: string;
  expectedOutcome?: string;
  researchType: 'survey' | 'interview';
}

export interface ProblemEvaluation {
  clarityScore: number;
  missingInformation: string[];
  riskAreas: string[];
  suggestedResearchGoals: string[];
  recommendedMethod: {
    method: 'survey' | 'interview' | 'both';
    rationale: string;
  };
}

export interface ResearchSessionSummary {
  id: string;
  problemStatement: string;
  researchType: 'survey' | 'interview';
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResearchSessionResponse {
  success: boolean;
  session?: {
    id: string;
    status: string;
    createdAt: string;
    problemStatement: string;
    productContext: string;
    targetUserSegment: string;
    expectedOutcome?: string;
    researchType: 'survey' | 'interview';
  };
  evaluation?: ProblemEvaluation;
  error?: string;
}

// ========== Step 3: Question Generation ==========

export interface SurveyQuestion {
  id: string;
  text: string;
  type: 'mcq' | 'likert' | 'open-ended' | 'screening';
  options?: string[];
  objective: 'screening' | 'behavioral' | 'pain-point' | 'willingness-to-pay' | 'usage';
}

export interface InterviewGuide {
  openingScript: string;
  questions: Array<{
    id: string;
    question: string;
    probes: string[];
  }>;
  observationChecklist: string[];
  biasAvoidanceTips: string[];
}

export interface GenerateQuestionsRequest {
  tone?: 'exploratory' | 'validation' | 'pricing';
  depth?: 'quick' | 'standard' | 'comprehensive';
}

export interface GenerateQuestionsResponse {
  success: boolean;
  plan?: {
    questions: SurveyQuestion[] | InterviewGuide;
    evaluation: ProblemEvaluation;
    tone: string;
    depth: string;
  };
  error?: string;
}

export interface UpdateQuestionsRequest {
  questions: SurveyQuestion[] | InterviewGuide;
}

export interface UpdateQuestionsResponse {
  success: boolean;
  plan?: {
    questions: SurveyQuestion[] | InterviewGuide;
    isEdited: boolean;
  };
  error?: string;
}

// ========== Step 5: Upload Results ==========

export interface UploadResultsResponse {
  success: boolean;
  parsedData?: {
    rowCount: number;
    preview: any[];
    dataType: 'survey' | 'interview';
  };
  error?: string;
}

// ========== Step 6: Analysis ==========

export interface SurveyAnalysis {
  responseDistribution: Record<string, any>;
  keyTrends: string[];
  topPainPoints: Array<{ pain: string; frequency: number }>;
  segmentDifferences: Record<string, any>;
  insightClusters: Array<{ theme: string; insights: string[] }>;
  recommendationSummary: string[];
  decisionSignals: string[];
}

export interface InterviewAnalysis {
  themes: Array<{ theme: string; frequency: number; quotes: string[] }>;
  quoteHighlights: Array<{ quote: string; speaker: string; context: string }>;
  objectionPatterns: Array<{ objection: string; frequency: number }>;
  needFrequency: Record<string, number>;
  opportunityAreas: string[];
  productDecisionInputs: string[];
}

export interface AnalyzeResultsResponse {
  success: boolean;
  analysis?: SurveyAnalysis | InterviewAnalysis;
  error?: string;
}

// ========== Step 7: Report ==========

export interface ResearchReport {
  markdown: string;
  metadata: {
    sessionId: string;
    title: string;
    researchType: string;
    conductedDate: string;
    respondentCount: number;
  };
}

export interface GetReportResponse {
  success: boolean;
  report?: ResearchReport;
  error?: string;
}

// ========== List & Get Sessions ==========

export interface ListResearchSessionsResponse {
  success: boolean;
  sessions?: ResearchSessionSummary[];
  total?: number;
  error?: string;
}

export interface GetResearchSessionResponse {
  success: boolean;
  session?: {
    id: string;
    problemStatement: string;
    productContext: string;
    targetUserSegment: string;
    expectedOutcome?: string;
    researchType: 'survey' | 'interview';
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  plan?: {
    id: string;
    evaluation: ProblemEvaluation;
    questions: SurveyQuestion[] | InterviewGuide;
    tone: string;
    depth: string;
    isEdited: boolean;
  };
  results?: {
    id: string;
    uploadedFileName?: string;
    uploadedFileType?: string;
    uploadedAt?: string;
    parsedData?: any; // Stored as JSON string in DB, parsed on retrieval
    analysis?: SurveyAnalysis | InterviewAnalysis;
    reportGenerated: boolean;
    reportMarkdown?: string;
  };
  error?: string;
}

export interface DeleteResearchSessionResponse {
  success: boolean;
  error?: string;
}
