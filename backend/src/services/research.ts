import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { configDBService } from './config-db';
import {
  PROBLEM_EVALUATOR_SYSTEM_PROMPT,
  createProblemEvaluationPrompt,
  PROBLEM_EVALUATION_SCHEMA,
} from '../prompts/research/problem-evaluator';
import {
  SURVEY_GENERATOR_SYSTEM_PROMPT,
  createSurveyGenerationPrompt,
  SURVEY_QUESTIONS_SCHEMA,
} from '../prompts/research/survey-generator';
import {
  INTERVIEW_GENERATOR_SYSTEM_PROMPT,
  createInterviewGenerationPrompt,
  INTERVIEW_GUIDE_SCHEMA,
} from '../prompts/research/interview-generator';
import {
  SURVEY_ANALYZER_SYSTEM_PROMPT,
  createSurveyAnalysisPrompt,
  SURVEY_ANALYSIS_SCHEMA,
  INTERVIEW_ANALYZER_SYSTEM_PROMPT,
  createInterviewAnalysisPrompt,
  INTERVIEW_ANALYSIS_SCHEMA,
} from '../prompts/research/research-analyzer';
import {
  REPORT_GENERATOR_SYSTEM_PROMPT,
  createReportGenerationPrompt,
} from '../prompts/research/report-generator';
import type {
  ProblemEvaluation,
  SurveyQuestion,
  InterviewGuide,
  SurveyAnalysis,
  InterviewAnalysis,
} from '../../../shared/types/research';

/**
 * Research Service - AI-powered research planning and analysis
 * Uses Gemini API with user-specific API keys for generating research materials
 */
export class ResearchService {
  private static instance: ResearchService;

  private constructor() {
    console.log('🔬 Research Service initialized');
  }

  static getInstance(): ResearchService {
    if (!ResearchService.instance) {
      ResearchService.instance = new ResearchService();
    }
    return ResearchService.instance;
  }

  /**
   * Get Gemini client for a specific user
   */
  private async getGeminiClient(userId: string): Promise<GoogleGenerativeAI> {
    const apiKey = await configDBService.get(userId, 'GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is required but not configured. Please add your Gemini API key in Settings.'
      );
    }
    return new GoogleGenerativeAI(apiKey);
  }

  /**
   * Get the Gemini model name for a user
   */
  private async getModelName(userId: string): Promise<string> {
    const model = await configDBService.get(userId, 'GEMINI_MODEL');
    // Use stable Gemini Pro model as default (most compatible with v1beta API)
    return model || 'gemini-pro';
  }

  /**
   * Get Gemini model with automatic fallback to compatible models
   * Tries user's configured model, then gemini-pro (most compatible with v1beta)
   * Also tries without JSON schema if the primary config fails
   */
  private async getModelWithFallback(
    client: GoogleGenerativeAI,
    userId: string,
    config: {
      systemInstruction?: string;
      generationConfig?: any;
    }
  ): Promise<any> {
    let modelName = await this.getModelName(userId);
    // Use gemini-pro as fallback - it's the most stable for v1beta API
    const fallbackModels = ['gemini-pro', 'gemini-1.5-flash-latest', 'gemini-1.5-pro-latest'];

    // Helper to try a model with config and optionally without responseSchema
    const tryModel = async (model: string, fullConfig: any): Promise<any> => {
      try {
        return client.getGenerativeModel({
          model,
          ...fullConfig,
        });
      } catch (error: any) {
        // If error mentions schema/JSON, try without responseSchema
        if (fullConfig.generationConfig?.responseSchema &&
            (error.message?.includes('schema') || error.message?.includes('not supported'))) {
          console.warn(`Schema validation not supported for ${model}, trying without schema...`);
          const configWithoutSchema = {
            ...fullConfig,
            generationConfig: {
              ...fullConfig.generationConfig,
              responseSchema: undefined,
            },
          };
          return client.getGenerativeModel({
            model,
            ...configWithoutSchema,
          });
        }
        throw error;
      }
    };

    // Try primary model
    try {
      return await tryModel(modelName, config);
    } catch (error: any) {
      // If model not found, try fallbacks
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        console.warn(`Model ${modelName} not available, trying fallbacks...`);

        for (const fallback of fallbackModels) {
          if (fallback === modelName) continue; // Skip if already tried

          try {
            console.log(`Trying fallback model: ${fallback}`);
            return await tryModel(fallback, config);
          } catch (fallbackError: any) {
            console.warn(`Fallback model ${fallback} also failed:`, fallbackError.message);
            continue;
          }
        }

        throw new Error(
          `None of the available models (${[modelName, ...fallbackModels].join(', ')}) are accessible. ` +
          `Please check your Gemini API key permissions or try configuring a different model in Settings.`
        );
      }
      throw error;
    }
  }

  /**
   * Step 2: Evaluate problem statement and suggest research approach
   */
  async evaluateProblem(
    userId: string,
    input: {
      problemStatement: string;
      productContext: string;
      targetUserSegment: string;
      expectedOutcome?: string;
    }
  ): Promise<ProblemEvaluation> {
    try {
      const client = await this.getGeminiClient(userId);

      const model = await this.getModelWithFallback(client, userId, {
        systemInstruction: PROBLEM_EVALUATOR_SYSTEM_PROMPT,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: PROBLEM_EVALUATION_SCHEMA,
        },
      });

      const prompt = createProblemEvaluationPrompt(input);
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const text = result.response.text();
      const evaluation: ProblemEvaluation = JSON.parse(text);

      return evaluation;
    } catch (error: any) {
      console.error('Error evaluating problem:', error);
      throw new Error(`Failed to evaluate problem: ${error.message}`);
    }
  }

  /**
   * Step 3: Generate survey questions
   */
  async generateSurveyQuestions(
    userId: string,
    sessionData: {
      problemStatement: string;
      productContext: string;
      targetUserSegment: string;
      evaluation: ProblemEvaluation;
    },
    options: {
      tone: 'exploratory' | 'validation' | 'pricing';
      depth: 'quick' | 'standard' | 'comprehensive';
    }
  ): Promise<SurveyQuestion[]> {
    try {
      const client = await this.getGeminiClient(userId);

      const model = await this.getModelWithFallback(client, userId, {
        systemInstruction: SURVEY_GENERATOR_SYSTEM_PROMPT,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: SURVEY_QUESTIONS_SCHEMA,
        },
      });

      const prompt = createSurveyGenerationPrompt(
        sessionData.problemStatement,
        sessionData.productContext,
        sessionData.targetUserSegment,
        sessionData.evaluation,
        options
      );

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const text = result.response.text();
      const response = JSON.parse(text);

      return response.questions;
    } catch (error: any) {
      console.error('Error generating survey questions:', error);
      throw new Error(`Failed to generate survey questions: ${error.message}`);
    }
  }

  /**
   * Step 3: Generate interview guide
   */
  async generateInterviewGuide(
    userId: string,
    sessionData: {
      problemStatement: string;
      productContext: string;
      targetUserSegment: string;
      evaluation: ProblemEvaluation;
    },
    options: {
      tone: 'exploratory' | 'validation' | 'pricing';
      depth: 'quick' | 'standard' | 'comprehensive';
    }
  ): Promise<InterviewGuide> {
    try {
      const client = await this.getGeminiClient(userId);

      const model = await this.getModelWithFallback(client, userId, {
        systemInstruction: INTERVIEW_GENERATOR_SYSTEM_PROMPT,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: INTERVIEW_GUIDE_SCHEMA,
        },
      });

      const prompt = createInterviewGenerationPrompt(
        sessionData.problemStatement,
        sessionData.productContext,
        sessionData.targetUserSegment,
        sessionData.evaluation,
        options
      );

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const text = result.response.text();
      const guide: InterviewGuide = JSON.parse(text);

      return guide;
    } catch (error: any) {
      console.error('Error generating interview guide:', error);
      throw new Error(`Failed to generate interview guide: ${error.message}`);
    }
  }

  /**
   * Step 6: Analyze survey results
   */
  async analyzeSurveyResults(
    userId: string,
    questions: SurveyQuestion[],
    responsesData: any[],
    problemStatement: string
  ): Promise<SurveyAnalysis> {
    try {
      const client = await this.getGeminiClient(userId);

      const model = await this.getModelWithFallback(client, userId, {
        systemInstruction: SURVEY_ANALYZER_SYSTEM_PROMPT,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: SURVEY_ANALYSIS_SCHEMA,
        },
      });

      const prompt = createSurveyAnalysisPrompt(questions, responsesData, problemStatement);

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const text = result.response.text();
      const analysis: SurveyAnalysis = JSON.parse(text);

      return analysis;
    } catch (error: any) {
      console.error('Error analyzing survey results:', error);
      throw new Error(`Failed to analyze survey results: ${error.message}`);
    }
  }

  /**
   * Step 6: Analyze interview transcripts
   */
  async analyzeInterviewResults(
    userId: string,
    guide: InterviewGuide,
    transcriptsData: string[],
    problemStatement: string
  ): Promise<InterviewAnalysis> {
    const client = await this.getGeminiClient(userId);
    const prompt = createInterviewAnalysisPrompt(guide, transcriptsData, problemStatement);

    console.log('🔄 Starting interview analysis with Gemini...');
    console.log(`📊 Analyzing ${transcriptsData.length} interview transcripts`);

    // Try with schema first, fallback to without schema if it fails
    const attemptAnalysis = async (useSchema: boolean): Promise<InterviewAnalysis> => {
      try {
        const config: any = {
          systemInstruction: INTERVIEW_ANALYZER_SYSTEM_PROMPT,
          generationConfig: {
            responseMimeType: 'application/json',
          },
        };

        if (useSchema) {
          config.generationConfig.responseSchema = INTERVIEW_ANALYSIS_SCHEMA;
          console.log('  Attempting analysis WITH schema validation...');
        } else {
          console.log('  Attempting analysis WITHOUT schema validation...');
        }

        const model = await this.getModelWithFallback(client, userId, config);

        // Add 60-second timeout to prevent hanging
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Analysis timeout after 60 seconds')), 60000);
        });

        const analysisPromise = model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        const result = await Promise.race([analysisPromise, timeoutPromise]);
        const text = result.response.text();

        console.log('✅ Interview analysis completed successfully');
        return JSON.parse(text);
      } catch (error: any) {
        if (useSchema && (error.message?.includes('schema') || error.message?.includes('properties'))) {
          console.warn('  Schema validation failed, retrying without schema...');
          throw error; // Re-throw to trigger fallback
        }
        throw error;
      }
    };

    try {
      // Try with schema first
      return await attemptAnalysis(true);
    } catch (schemaError: any) {
      console.warn('⚠️ Schema-based analysis failed:', schemaError.message);
      try {
        // Fallback: Try without schema
        return await attemptAnalysis(false);
      } catch (fallbackError: any) {
        console.error('❌ Both analysis attempts failed');
        console.error('Error details:', {
          message: fallbackError.message,
          stack: fallbackError.stack?.split('\n').slice(0, 3).join('\n'),
        });
        throw new Error(`Failed to analyze interview results: ${fallbackError.message}`);
      }
    }
  }

  /**
   * Step 7: Generate comprehensive research report
   */
  async generateReport(
    userId: string,
    sessionData: {
      problemStatement: string;
      productContext: string;
      researchType: 'survey' | 'interview';
      evaluation: ProblemEvaluation;
      questions: SurveyQuestion[] | InterviewGuide;
      analysis: SurveyAnalysis | InterviewAnalysis;
      respondentCount: number;
    }
  ): Promise<string> {
    try {
      console.log('🔵 Generating research report...');
      const client = await this.getGeminiClient(userId);

      const model = await this.getModelWithFallback(client, userId, {
        systemInstruction: REPORT_GENERATOR_SYSTEM_PROMPT,
      });

      const prompt = createReportGenerationPrompt(
        sessionData.problemStatement,
        sessionData.productContext,
        sessionData.researchType,
        sessionData.evaluation,
        sessionData.questions,
        sessionData.analysis,
        sessionData.respondentCount
      );

      console.log('🔵 Calling Gemini API to generate report...');

      // Create timeout promise (60 seconds)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          console.error('❌ Report generation timeout after 60 seconds');
          reject(new Error('Report generation timeout after 60 seconds. Please try again.'));
        }, 60000);
      });

      // Create generation promise
      const generationPromise = model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      // Race between generation and timeout
      const result = await Promise.race([generationPromise, timeoutPromise]);

      const markdown = result.response.text();

      console.log('✅ Report generated successfully');
      return markdown;
    } catch (error: any) {
      console.error('❌ Error generating report:', error.message);

      // Check if it's a timeout error
      if (error.message?.includes('timeout')) {
        throw new Error('Report generation took too long and was cancelled. This may be due to large data or API issues. Please try again.');
      }

      throw new Error(`Failed to generate report: ${error.message}`);
    }
  }
}

export const researchService = ResearchService.getInstance();
