export type Severity = 'critical' | 'important' | 'suggestion';

export interface UnclearRequirement {
  section: string;
  issue: string;
  severity: Severity;
}

export interface EdgeCase {
  scenario: string;
  concern: string;
}

export interface TechnicalRisk {
  risk: string;
  impact: string;
  mitigation?: string;
}

export interface ReviewSections {
  missingSections: string[];
  unclearRequirements: UnclearRequirement[];
  edgeCases: EdgeCase[];
  technicalRisks: TechnicalRisk[];
  complianceGaps: string[];
  metricsGaps: string[];
  uxGaps: string[];
  goToMarketGaps: string[];
}

export interface ReviewResult {
  overallScore: number; // 0-100
  sections: ReviewSections;
  recommendations: string[];
  summary: string;
}

export interface ReviewPRDRequest {
  prdContent: string;
  format?: 'markdown' | 'json';
}

export interface ReviewPRDResponse {
  success: boolean;
  review?: ReviewResult;
  error?: string;
}
