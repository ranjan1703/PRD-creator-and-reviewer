import { SchemaType } from '@google/generative-ai';

export const PROBLEM_EVALUATOR_SYSTEM_PROMPT = `You are a research methodology expert specializing in product discovery and user research.

Your role is to:
1. Evaluate problem statements for clarity and completeness
2. Identify missing context or information gaps
3. Assess potential risks in the research approach
4. Suggest specific research goals that would address the problem
5. Recommend the most appropriate research method (survey, interview, or both)

Be thorough, constructive, and actionable. Your goal is to ensure the research is well-scoped and will yield valuable insights.`;

export function createProblemEvaluationPrompt(input: {
  problemStatement: string;
  productContext: string;
  targetUserSegment: string;
  expectedOutcome?: string;
}): string {
  return `Evaluate the following product research problem and provide a structured assessment.

PROBLEM STATEMENT:
${input.problemStatement}

PRODUCT CONTEXT:
${input.productContext}

TARGET USER SEGMENT:
${input.targetUserSegment}

${input.expectedOutcome ? `EXPECTED OUTCOME:\n${input.expectedOutcome}\n` : ''}

Perform a comprehensive evaluation covering:

1. **Clarity Score** (0-100):
   - How well-defined is the problem?
   - Is the problem statement specific and measurable?
   - Can researchers clearly understand what needs to be investigated?

2. **Missing Information**:
   - What critical context is missing?
   - What assumptions need to be validated?
   - What constraints or scope limitations should be defined?
   - What success criteria are unclear?

3. **Risk Areas**:
   - What could go wrong with this research?
   - Are there biases in how the problem is framed?
   - Is the target segment too broad or too narrow?
   - Are there ethical considerations to address?
   - Could the research yield inconclusive results?

4. **Suggested Research Goals**:
   - What specific questions should this research answer?
   - What hypotheses should be tested?
   - What user behaviors or pain points should be explored?
   - What decision points will this research inform?

5. **Recommended Method**:
   - Should this use surveys (quantitative data, larger sample size)?
   - Should this use interviews (qualitative insights, deeper understanding)?
   - Or both (mixed methods for comprehensive insights)?
   - Provide clear rationale for your recommendation

Return your evaluation as a structured JSON object.`;
}

export const PROBLEM_EVALUATION_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    clarityScore: {
      type: SchemaType.NUMBER,
      description: 'Score from 0-100 indicating how well-defined the problem is',
    },
    missingInformation: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'List of missing context or information gaps',
    },
    riskAreas: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Potential risks or concerns with the research approach',
    },
    suggestedResearchGoals: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Specific questions or hypotheses to investigate',
    },
    recommendedMethod: {
      type: SchemaType.STRING,
      description: 'Either "survey", "interview", or "both"',
    },
    rationale: {
      type: SchemaType.STRING,
      description: 'Explanation for the recommended research method',
    },
  },
  required: [
    'clarityScore',
    'missingInformation',
    'riskAreas',
    'suggestedResearchGoals',
    'recommendedMethod',
    'rationale',
  ],
};
