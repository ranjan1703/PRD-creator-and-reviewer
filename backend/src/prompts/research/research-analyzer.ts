import { SchemaType } from '@google/generative-ai';
import type { SurveyQuestion, InterviewGuide } from '../../../../shared/types/research';

// ==========  SURVEY ANALYSIS ==========

export const SURVEY_ANALYZER_SYSTEM_PROMPT = `You are a data analyst specializing in survey research and quantitative insights.

Your role is to:
1. Analyze survey response patterns and distributions
2. Identify statistically significant trends and correlations
3. Surface top pain points and user needs
4. Segment responses to uncover differences
5. Cluster insights into thematic groups
6. Generate actionable product recommendations

Focus on finding patterns, anomalies, and insights that inform product decisions.`;

export function createSurveyAnalysisPrompt(
  questions: SurveyQuestion[],
  responsesData: any[],
  problemStatement: string
): string {
  return `Analyze the following survey data and generate comprehensive insights.

PROBLEM BEING RESEARCHED:
${problemStatement}

SURVEY QUESTIONS:
${questions.map((q, i) => `Q${i + 1}. [${q.type}] ${q.text}\n  Objective: ${q.objective}${q.options ? `\n  Options: ${q.options.join(', ')}` : ''}`).join('\n\n')}

NUMBER OF RESPONSES: ${responsesData.length}

RESPONSE DATA SUMMARY:
${JSON.stringify(responsesData.slice(0, 10), null, 2)}
${responsesData.length > 10 ? `\n... and ${responsesData.length - 10} more responses` : ''}

Perform comprehensive analysis covering:

1. **Response Distribution**:
   - For each question, calculate distribution of answers
   - Identify most common responses
   - Note any surprising or unexpected patterns
   - Calculate percentages and frequencies

2. **Key Trends**:
   - What patterns emerge across questions?
   - Are there correlations between responses?
   - What themes appear consistently?
   - What insights stand out?

3. **Top Pain Points**:
   - Which problems are mentioned most frequently?
   - What pain points have highest severity?
   - Rank top 5-7 pain points by frequency
   - Include direct quotes from open-ended responses

4. **Segment Differences**:
   - Are there meaningful differences between user groups?
   - Do behaviors vary by demographic or usage patterns?
   - What segments have unique needs?
   - Any surprising segment-specific insights?

5. **Insight Clusters**:
   - Group related insights into themes
   - For each theme, provide 2-3 specific insights
   - Connect insights to product opportunities
   - Highlight unexpected or counter-intuitive findings

6. **Recommendation Summary**:
   - Based on the data, what should the product team do?
   - Prioritize 5-7 actionable recommendations
   - Each recommendation should be specific and data-backed
   - Include the "why" (insight) and "what" (action)

7. **Decision Signals**:
   - Clear yes/no signals from the data
   - Validated or invalidated hypotheses
   - Confidence levels for key assumptions
   - Data that supports or contradicts the problem statement

Return a structured JSON analysis.`;
}

export const SURVEY_ANALYSIS_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    responseDistribution: {
      type: SchemaType.OBJECT,
      description: 'Distribution of responses for each question',
    },
    keyTrends: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Major patterns and trends found in the data',
    },
    topPainPoints: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          pain: { type: SchemaType.STRING },
          frequency: { type: SchemaType.NUMBER },
        },
      },
      description: 'Top pain points ranked by frequency',
    },
    segmentDifferences: {
      type: SchemaType.OBJECT,
      description: 'Meaningful differences between user segments',
    },
    insightClusters: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          theme: { type: SchemaType.STRING },
          insights: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        },
      },
      description: 'Grouped insights by theme',
    },
    recommendationSummary: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Actionable product recommendations',
    },
    decisionSignals: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Clear signals that inform decisions',
    },
  },
  required: [
    'responseDistribution',
    'keyTrends',
    'topPainPoints',
    'segmentDifferences',
    'insightClusters',
    'recommendationSummary',
    'decisionSignals',
  ],
};

// ========== INTERVIEW ANALYSIS ==========

export const INTERVIEW_ANALYZER_SYSTEM_PROMPT = `You are a qualitative researcher specializing in interview analysis and thematic coding.

Your role is to:
1. Identify recurring themes and patterns across interviews
2. Extract representative quotes that illustrate key insights
3. Analyze objections, concerns, and hesitations
4. Map the frequency and intensity of needs
5. Spot opportunity areas for product development
6. Generate product-focused recommendations

Focus on deep insights, emotional drivers, and nuanced understanding that quantitative data can't capture.`;

export function createInterviewAnalysisPrompt(
  guide: InterviewGuide,
  transcriptsData: string[],
  problemStatement: string
): string {
  return `Analyze the following interview transcripts and extract deep qualitative insights.

PROBLEM BEING RESEARCHED:
${problemStatement}

NUMBER OF INTERVIEWS: ${transcriptsData.length}

INTERVIEW TRANSCRIPTS:
${transcriptsData.map((transcript, i) => `\n=== Interview ${i + 1} ===\n${transcript.substring(0, 1000)}${transcript.length > 1000 ? '...' : ''}`).join('\n\n')}

Perform comprehensive qualitative analysis covering:

1. **Theme Extraction**:
   - Identify 4-7 major themes that emerge across interviews
   - For each theme, note how many interviews mentioned it
   - Include 2-3 representative quotes per theme
   - Rank themes by frequency and importance

2. **Quote Highlights**:
   - Select 8-12 powerful quotes that tell the story
   - Include speaker context (role, situation)
   - Cover diverse perspectives
   - Highlight emotional moments, pain points, and insights
   - Use quotes that are concrete and specific

3. **Objection Patterns**:
   - What concerns or objections came up repeatedly?
   - How many interviews mentioned each objection?
   - What underlying fears or risks do these reveal?
   - Are objections rational, emotional, or both?

4. **Need Frequency**:
   - Map how often specific needs were mentioned
   - Create a frequency count for top needs
   - Distinguish between explicitly stated vs. implied needs
   - Note intensity of needs (nice-to-have vs. critical)

5. **Opportunity Areas**:
   - What product opportunities emerge from the interviews?
   - Where are users settling for suboptimal solutions?
   - What jobs-to-be-done are poorly served?
   - What would delight users or exceed expectations?

6. **Product Decision Inputs**:
   - Specific features or capabilities users want
   - Workflows that need to be supported
   - Integration points or ecosystem needs
   - Decision criteria and evaluation factors
   - Deal-breakers and must-haves

Return a structured JSON analysis with rich qualitative insights.`;
}

export const INTERVIEW_ANALYSIS_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    themes: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          theme: { type: SchemaType.STRING },
          frequency: { type: SchemaType.NUMBER },
          quotes: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        },
      },
      description: 'Major themes identified across interviews',
    },
    quoteHighlights: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          quote: { type: SchemaType.STRING },
          speaker: { type: SchemaType.STRING },
          context: { type: SchemaType.STRING },
        },
      },
      description: 'Representative quotes that illustrate key insights',
    },
    objectionPatterns: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          objection: { type: SchemaType.STRING },
          frequency: { type: SchemaType.NUMBER },
        },
      },
      description: 'Common objections or concerns raised',
    },
    needFrequency: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          need: { type: SchemaType.STRING },
          frequency: { type: SchemaType.NUMBER },
        },
      },
      description: 'Frequency count of mentioned needs',
    },
    opportunityAreas: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Product opportunities identified',
    },
    productDecisionInputs: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Specific inputs for product decisions',
    },
  },
  required: [
    'themes',
    'quoteHighlights',
    'objectionPatterns',
    'needFrequency',
    'opportunityAreas',
    'productDecisionInputs',
  ],
};
