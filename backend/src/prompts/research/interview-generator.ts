import { SchemaType } from '@google/generative-ai';
import type { ProblemEvaluation } from '../../../../shared/types/research';

export const INTERVIEW_GENERATOR_SYSTEM_PROMPT = `You are an expert in qualitative user research and interview methodology.

Your role is to:
1. Design structured interview guides that elicit deep insights
2. Create open-ended questions that encourage storytelling
3. Develop probing follow-up questions for deeper exploration
4. Provide guidance on observation and bias avoidance
5. Structure interviews for natural conversation flow

Create interview guides that help researchers uncover nuanced insights, unspoken needs, and rich contextual understanding.`;

export function createInterviewGenerationPrompt(
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
    options.depth === 'quick' ? '10-15' : options.depth === 'standard' ? '15-20' : '20-25';

  const toneGuidance = {
    exploratory:
      'Deep discovery - explore workflows, pain points, motivations, and unmet needs through open-ended storytelling',
    validation:
      'Hypothesis testing - probe specific assumptions, validate problem severity, assess solution fit',
    pricing:
      'Value exploration - understand budget context, decision criteria, willingness to pay, and perceived value',
  }[options.tone];

  return `Generate a comprehensive interview discussion guide for the following product research:

PROBLEM STATEMENT:
${problemStatement}

PRODUCT CONTEXT:
${productContext}

TARGET SEGMENT:
${targetSegment}

RESEARCH GOALS:
${evaluation.suggestedResearchGoals.join('\n')}

INTERVIEW PARAMETERS:
- Tone: ${options.tone} (${toneGuidance})
- Depth: ${options.depth} (aim for ${questionCount} questions)

Create a structured interview guide with the following components:

1. **Opening Script** (2-3 paragraphs):
   - Welcome and introduce yourself
   - Explain the purpose of the interview
   - Set expectations (duration, recording, confidentiality)
   - Create a comfortable, conversational atmosphere
   - Emphasize no wrong answers and value all perspectives

2. **Interview Questions** (${questionCount} questions):

   **Section A: Context Setting (3-4 questions)**
   - Current role, responsibilities, typical day
   - Relevant workflows or activities
   - Tools or systems currently used
   - Warm-up to build rapport

   **Section B: Problem Exploration (5-7 questions)**
   - Describe specific challenges or frustrations
   - Walk through a recent example or scenario
   - Explore impact and frequency of problems
   - Uncover root causes and contributing factors

   **Section C: Current Solutions (3-4 questions)**
   - How do they currently handle the problem?
   - What workarounds have they developed?
   - What tools or alternatives have they tried?
   - What works and what doesn't?

   **Section D: ${
     options.tone === 'pricing' ? 'Value & Budget Context' : 'Needs & Priorities'
   } (4-5 questions)**
   ${
     options.tone === 'pricing'
       ? '- What would they pay to solve this problem?\n   - How do they think about budget and ROI?\n   - What features would justify higher pricing?\n   - How do competitors price similar solutions?'
       : '- What would an ideal solution look like?\n   - Which aspects matter most?\n   - What trade-offs would they accept?\n   - What outcomes would success mean?'
   }

   **Section E: Decision-Making (2-3 questions)**
   - Who else is involved in decisions?
   - What evaluation criteria matter?
   - What concerns or objections might arise?
   - What would trigger adoption or purchase?

3. **Probing Follow-Ups** (for each main question):
   - Generate 2-3 follow-up probes to dig deeper
   - Use prompts like:
     - "Can you tell me more about that?"
     - "Walk me through a specific example..."
     - "Why is that important to you?"
     - "What would happen if...?"
     - "How did that make you feel?"

4. **Observation Checklist** (5-7 items):
   - Nonverbal cues to watch for
   - Emotional reactions to note
   - Inconsistencies or hesitations
   - Unprompted comments or insights
   - Environmental or contextual factors

5. **Bias Avoidance Tips** (5-7 tips):
   - Common interviewer biases to avoid
   - Leading question patterns to watch for
   - How to stay neutral and curious
   - When to stay silent and listen
   - How to handle unexpected responses

**Question Quality Standards:**
- Open-ended (encourage storytelling, not yes/no)
- Neutral and non-leading
- Focus on past behavior and specific examples
- Avoid hypotheticals when possible
- One topic per question
- Natural conversational flow

Return a structured JSON object with the interview guide.`;
}

export const INTERVIEW_GUIDE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    openingScript: {
      type: SchemaType.STRING,
      description: 'Welcome script to set the tone and explain the interview',
    },
    questions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          question: { type: SchemaType.STRING },
          probes: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: 'Follow-up probing questions',
          },
        },
        required: ['id', 'question', 'probes'],
      },
    },
    observationChecklist: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Things to observe during the interview',
    },
    biasAvoidanceTips: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Tips for avoiding interviewer bias',
    },
  },
  required: ['openingScript', 'questions', 'observationChecklist', 'biasAvoidanceTips'],
};
