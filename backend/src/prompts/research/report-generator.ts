export const REPORT_GENERATOR_SYSTEM_PROMPT = `You are a research report writer specializing in product discovery and user research documentation.

Your role is to:
1. Synthesize research findings into clear, actionable reports
2. Present data and insights in a structured, scannable format
3. Support recommendations with evidence from the research
4. Highlight key decisions and next steps
5. Write for product managers, designers, and executives

Create reports that are professional, data-driven, and immediately useful for product decisions.`;

export function createReportGenerationPrompt(
  problemStatement: string,
  productContext: string,
  researchType: 'survey' | 'interview',
  evaluation: any,
  questions: any,
  analysis: any,
  respondentCount: number
): string {
  return `Generate a comprehensive research report in Markdown format.

RESEARCH METADATA:
- Research Type: ${researchType}
- Problem Statement: ${problemStatement}
- Product Context: ${productContext}
- Number of ${researchType === 'survey' ? 'Respondents' : 'Interviews'}: ${respondentCount}
- Research Goals: ${evaluation.suggestedResearchGoals?.join(', ') || 'N/A'}

FINDINGS:
${JSON.stringify(analysis, null, 2)}

Create a professional research report with the following structure:

# Research Report: [Descriptive Title Based on Problem]

## Executive Summary
- 2-3 paragraphs summarizing the research
- Key findings at a glance (bullet points)
- Critical insights that inform decisions
- Recommended next steps

## Research Overview

### Problem Statement
${problemStatement}

### Research Objectives
- List the specific goals and questions this research aimed to answer
- Reference the ${evaluation.suggestedResearchGoals?.length || 0} research goals identified

### Methodology
- ${researchType === 'survey' ? 'Survey' : 'Interview'} research
- Number of ${researchType === 'survey' ? 'respondents' : 'interviews'}: ${respondentCount}
- Target segment: [Extracted from context]
- Research tone: [Exploratory/Validation/Pricing - infer from analysis]

## Key Findings

${
  researchType === 'survey'
    ? `
### Response Overview
- Present high-level response distribution
- Demographic breakdown if applicable
- Completion rate and data quality notes

### Top Insights
1. **[First Key Trend]**: Description with supporting data
2. **[Second Key Trend]**: Description with supporting data
3. **[Third Key Trend]**: Description with supporting data
... (Continue for all key trends from analysis)

### Top Pain Points
Ranked by frequency and severity:
1. **[Pain Point 1]** (mentioned by X% of respondents)
   - Impact: [Description]
   - Supporting data: [Evidence]

2. **[Pain Point 2]** (mentioned by X% of respondents)
   - Impact: [Description]
   - Supporting data: [Evidence]

... (Continue for all top pain points)

### Segment Analysis
[If segment differences exist, detail them here]
- Segment A vs Segment B differences
- Implications for product strategy
`
    : `
### Major Themes
Present 4-7 themes identified across interviews:

#### Theme 1: [Theme Name]
- Mentioned in X out of ${respondentCount} interviews
- Description and significance
- Representative quotes:
  > "[Quote 1]" - [Speaker context]
  > "[Quote 2]" - [Speaker context]

... (Continue for all themes)

### Quote Highlights
Present 8-12 powerful quotes that tell the story:

> **On [Topic]:** "[Quote]"
> — [Speaker role/context]

... (Continue for all quote highlights)

### Objections & Concerns
- List common objections with frequency
- Analyze underlying reasons
- Implications for product positioning
`
}

## Insights by Category

### User Needs
- Primary needs identified
- Unmet needs and gaps
- Need intensity and priority

### Opportunity Areas
- Product opportunities discovered
- Market gaps identified
- Potential differentiators

### Risks & Challenges
- Concerns raised by ${researchType === 'survey' ? 'respondents' : 'interviewees'}
- Technical or operational risks
- Adoption barriers

## Recommendations

### Immediate Actions (Next 30 days)
1. **[Recommendation 1]**
   - Why: [Supporting insight]
   - Impact: [Expected outcome]
   - Owner: [Suggested team]

2. **[Recommendation 2]**
   - Why: [Supporting insight]
   - Impact: [Expected outcome]
   - Owner: [Suggested team]

... (Continue for all recommendations from analysis)

### Product Decisions
- Feature prioritization based on data
- Solution approaches validated or invalidated
- Trade-offs to consider

### Next Research Steps
- Follow-up questions to investigate
- Additional segments to research
- Validation experiments to run

## Appendix

### Methodology Details
- ${researchType === 'survey' ? 'Survey questions and response rates' : 'Interview discussion guide'}
- Participant screening criteria
- Data collection period
- Analysis approach

### Supporting Data
- Detailed statistics
- Full quote list (for interviews)
- Raw data summary

---

**Report Generated:** [Current Date]
**Research Team:** Product Research

Write in clear, professional markdown. Use headers, bullet points, tables, and quotes effectively. Make the report scannable and actionable.`;
}
