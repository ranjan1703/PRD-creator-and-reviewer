import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { createPRDPrompt, SYSTEM_PROMPT as CREATOR_SYSTEM_PROMPT } from '../prompts/creator';
import { createReviewPrompt, SYSTEM_PROMPT as REVIEWER_SYSTEM_PROMPT } from '../prompts/reviewer';
import { ReviewResult } from '../../../shared/types/review';

// Using Gemini 2.5 Pro for best quality (or use 'gemini-2.5-flash' for even cheaper!)
const MODEL = 'gemini-2.5-pro';

let genAI: GoogleGenerativeAI;

function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required but not set');
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

export class ClaudeService {
  /**
   * Generate a PRD from user input
   */
  async createPRD(input: string): Promise<string> {
    const userPrompt = createPRDPrompt(input);
    const client = getGeminiClient();
    const model = client.getGenerativeModel({
      model: MODEL,
      systemInstruction: CREATOR_SYSTEM_PROMPT,
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.7,
      },
    });

    const response = result.response;
    const text = response.text();

    if (!text) {
      throw new Error('No text content in Gemini response');
    }

    return text;
  }

  /**
   * Create a PRD with streaming support
   */
  async *createPRDStream(input: string): AsyncGenerator<string> {
    const userPrompt = createPRDPrompt(input);
    const client = getGeminiClient();
    const model = client.getGenerativeModel({
      model: MODEL,
      systemInstruction: CREATOR_SYSTEM_PROMPT,
    });

    const result = await model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.7,
      },
    });

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        yield chunkText;
      }
    }
  }

  /**
   * Review a PRD and provide comprehensive feedback
   */
  async reviewPRD(prdContent: string): Promise<ReviewResult> {
    const userPrompt = createReviewPrompt(prdContent);
    const client = getGeminiClient();

    // Define JSON schema for structured output
    const reviewSchema = {
      type: SchemaType.OBJECT,
      properties: {
        overallScore: { type: SchemaType.NUMBER },
        sections: {
          type: SchemaType.OBJECT,
          properties: {
            missingSections: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            unclearRequirements: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  section: { type: SchemaType.STRING },
                  issue: { type: SchemaType.STRING },
                  severity: { type: SchemaType.STRING }
                },
                required: ['section', 'issue', 'severity']
              }
            },
            edgeCases: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  scenario: { type: SchemaType.STRING },
                  concern: { type: SchemaType.STRING }
                },
                required: ['scenario', 'concern']
              }
            },
            technicalRisks: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  risk: { type: SchemaType.STRING },
                  impact: { type: SchemaType.STRING },
                  mitigation: { type: SchemaType.STRING }
                },
                required: ['risk', 'impact']
              }
            },
            complianceGaps: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            metricsGaps: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            uxGaps: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            goToMarketGaps: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
          },
          required: ['missingSections', 'unclearRequirements', 'edgeCases', 'technicalRisks', 'complianceGaps', 'metricsGaps', 'uxGaps', 'goToMarketGaps']
        },
        recommendations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        summary: { type: SchemaType.STRING }
      },
      required: ['overallScore', 'sections', 'recommendations', 'summary']
    };

    const model = client.getGenerativeModel({
      model: MODEL,
      systemInstruction: REVIEWER_SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: reviewSchema,
      },
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: {
        maxOutputTokens: 8192, // Increased to prevent truncation
        temperature: 0.3,
        responseMimeType: 'application/json',
        responseSchema: reviewSchema,
      },
    });

    const response = result.response;
    const text = response.text();

    if (!text) {
      throw new Error('No text content in Gemini response');
    }

    try {
      // Try direct JSON parse first (since we requested JSON format)
      const reviewResult: ReviewResult = JSON.parse(text);
      return reviewResult;
    } catch (parseError) {
      // Fallback: Try to extract JSON from markdown code blocks
      const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        try {
          const reviewResult: ReviewResult = JSON.parse(codeBlockMatch[1]);
          return reviewResult;
        } catch (e) {
          console.error('Failed to parse JSON from code block:', e);
        }
      }

      // Fallback: Try to extract the first complete JSON object
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const reviewResult: ReviewResult = JSON.parse(jsonMatch[0]);
          return reviewResult;
        } catch (e) {
          console.error('Failed to parse extracted JSON:', e);
          console.error('Extracted text:', jsonMatch[0].substring(0, 500));
        }
      }

      throw new Error(`Could not parse valid JSON from Gemini response. Parse error: ${parseError}`);
    }
  }
}

export const claudeService = new ClaudeService();
