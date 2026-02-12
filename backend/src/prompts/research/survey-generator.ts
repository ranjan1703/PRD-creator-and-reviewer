import { SchemaType } from '@google/generative-ai';
import type { ProblemEvaluation } from '../../../../shared/types/research';

export const SURVEY_GENERATOR_SYSTEM_PROMPT = `You are a survey design expert specializing in product research and user feedback collection.

Your role is to:
1. Design clear, unbiased survey questions that address research goals
2. Mix question types (MCQ, Likert scale, open-ended) for comprehensive data
3. Structure questions logically from screening to deeper insights
4. Avoid leading questions, double-barreled questions, and other biases
5. Ensure questions are actionable and will inform product decisions

Create surveys that are professional, concise, and yield valuable quantitative and qualitative data.`;

export function createSurveyGenerationPrompt(
  problemStatement: string,
  productContext: string,
  targetSegment: string,
  evaluation: ProblemEvaluation,
  options: {
    tone: 'exploratory' | 'validation' | 'pricing';
    depth: 'quick' | 'standard' | 'comprehensive';
  }
): string {
  const questionCount =
    options.depth === 'quick' ? '8-12' : options.depth === 'standard' ? '12-16' : '16-20';

  const toneGuidance = {
    exploratory:
      'Focus on open discovery - what problems do users face, what workflows exist, what needs are unmet',
    validation:
      'Focus on testing specific hypotheses - validate assumptions, measure interest, confirm problem severity',
    pricing:
      'Focus on willingness-to-pay and value perception - price sensitivity, feature prioritization, competitive comparison',
  }[options.tone];

  return `Generate a comprehensive survey for the following product research:

PROBLEM STATEMENT:
${problemStatement}

PRODUCT CONTEXT:
${productContext}

TARGET SEGMENT:
${targetSegment}

RESEARCH GOALS:
${evaluation.suggestedResearchGoals.join('\n')}

SURVEY PARAMETERS:
- Tone: ${options.tone} (${toneGuidance})
- Depth: ${options.depth} (aim for ${questionCount} questions)

Generate ${questionCount} well-structured survey questions following these guidelines:

**Question Structure:**
1. **Screening Questions** (2-3 questions):
   - Verify respondent fits target segment
   - Confirm relevant experience or usage
   - Filter out unqualified respondents

2. **Behavioral Questions** (3-5 questions):
   - Current behaviors and workflows
   - Frequency of relevant activities
   - Tools or solutions currently used
   - Context of usage

3. **Pain Point Discovery** (3-5 questions):
   - Specific challenges or frustrations
   - Severity and frequency of problems
   - Impact on work or life
   - Workarounds currently employed

4. **${
    options.tone === 'pricing'
      ? 'Willingness-to-Pay (3-4 questions)'
      : 'Product/Solution Feedback (3-5 questions)'
  }**:
   ${
     options.tone === 'pricing'
       ? '- Price sensitivity and budget\n   - Feature value ranking\n   - Competitive pricing comparison\n   - Payment model preferences'
       : '- Interest in proposed solutions\n   - Feature importance ranking\n   - Usage intent or likelihood\n   - Comparison to alternatives'
   }

5. **Usage Context** (2-3 questions):
   - Use case scenarios
   - Decision-making factors
   - Stakeholder involvement
   - Environmental or situational factors

**Question Types Mix:**
- Multiple Choice (MCQ): 40% - For quantitative analysis and clear options
- Likert Scale (1-5): 30% - For measuring agreement, satisfaction, or frequency
- Open-Ended: 30% - For qualitative insights and unexpected findings

**Question Quality Standards:**
- Clear, concise language (8th grade reading level)
- Avoid jargon unless target segment requires it
- One concept per question (no double-barreled questions)
- Neutral wording (no leading or biased questions)
- Mutually exclusive and exhaustive answer options for MCQ
- Include "Other" option where appropriate
- Include "Prefer not to answer" for sensitive questions

**Objective Tags:**
Each question should have one of these objectives:
- screening: Filter qualified respondents
- behavioral: Understand current behaviors
- pain-point: Identify problems and challenges
- willingness-to-pay: Assess pricing and value (if tone is pricing)
- usage: Understand context and scenarios

Return a JSON array of survey questions.`;
}

export const SURVEY_QUESTIONS_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    questions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          text: { type: SchemaType.STRING },
          type: { type: SchemaType.STRING }, // mcq | likert | open-ended | screening
          options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          objective: { type: SchemaType.STRING }, // screening | behavioral | pain-point | willingness-to-pay | usage
        },
        required: ['id', 'text', 'type', 'objective'],
      },
    },
  },
  required: ['questions'],
};
