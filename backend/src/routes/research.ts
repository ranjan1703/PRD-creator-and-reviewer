import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../services/database';
import { researchService } from '../services/research';
import { researchParserService } from '../services/research-parser';
import { researchExportService } from '../services/research-export';
import { requireAuthDB } from '../middleware/auth-db';
import type {
  CreateResearchSessionRequest,
  ProblemEvaluation,
  SurveyQuestion,
  InterviewGuide,
} from '../../../shared/types/research';

const router = express.Router();

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
  fileFilter: (req, file, cb) => {
    const validExtensions = ['xlsx', 'xls', 'csv', 'txt'];
    const extension = file.originalname.toLowerCase().split('.').pop() || '';

    if (validExtensions.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type. Supported formats: ${validExtensions.join(', ')}`));
    }
  },
});

// Validation middleware
function validate<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
}

// Validation schemas
const CreateSessionSchema = z.object({
  problemStatement: z.string().min(20, 'Problem statement must be at least 20 characters'),
  productContext: z.string().min(10, 'Product context must be at least 10 characters'),
  targetUserSegment: z.string().min(3, 'Target user segment is required'),
  expectedOutcome: z.string().optional(),
  researchType: z.enum(['survey', 'interview']),
});

const GenerateQuestionsSchema = z.object({
  tone: z.enum(['exploratory', 'validation', 'pricing']).optional(),
  depth: z.enum(['quick', 'standard', 'comprehensive']).optional(),
});

const UpdateQuestionsSchema = z.object({
  questions: z.union([
    z.array(
      z.object({
        id: z.string(),
        text: z.string().min(5),
        type: z.enum(['mcq', 'likert', 'open-ended', 'screening']),
        options: z.array(z.string()).optional(),
        objective: z.enum(['screening', 'behavioral', 'pain-point', 'willingness-to-pay', 'usage']),
      })
    ),
    z.object({
      openingScript: z.string(),
      questions: z.array(
        z.object({
          id: z.string(),
          question: z.string(),
          probes: z.array(z.string()),
        })
      ),
      observationChecklist: z.array(z.string()),
      biasAvoidanceTips: z.array(z.string()),
    }),
  ]),
});

/**
 * POST /api/research/sessions
 * Create new research session and evaluate problem
 */
router.post(
  '/sessions',
  requireAuthDB,
  validate(CreateSessionSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'User not authenticated' });
        return;
      }

      const data: CreateResearchSessionRequest = req.body;

      // Step 2: Evaluate problem
      const evaluation = await researchService.evaluateProblem(req.userId, {
        problemStatement: data.problemStatement,
        productContext: data.productContext,
        targetUserSegment: data.targetUserSegment,
        expectedOutcome: data.expectedOutcome,
      });

      // Create session in database
      const session = await prisma.researchSession.create({
        data: {
          userId: req.userId,
          problemStatement: data.problemStatement,
          productContext: data.productContext,
          targetUserSegment: data.targetUserSegment,
          expectedOutcome: data.expectedOutcome,
          researchType: data.researchType,
          status: 'draft',
        },
      });

      res.status(201).json({
        success: true,
        session: {
          id: session.id,
          status: session.status,
          createdAt: session.createdAt.toISOString(),
          problemStatement: session.problemStatement,
          productContext: session.productContext,
          targetUserSegment: session.targetUserSegment,
          expectedOutcome: session.expectedOutcome || undefined,
          researchType: session.researchType as 'survey' | 'interview',
        },
        evaluation,
      });
    } catch (error: any) {
      console.error('Error creating research session:', error);
      next(error);
    }
  }
);

/**
 * GET /api/research/sessions
 * List user's research sessions
 */
router.get(
  '/sessions',
  requireAuthDB,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'User not authenticated' });
        return;
      }

      const status = req.query.status as string | undefined;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const where: any = { userId: req.userId };
      if (status) {
        where.status = status;
      }

      const [sessions, total] = await Promise.all([
        prisma.researchSession.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          select: {
            id: true,
            problemStatement: true,
            researchType: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.researchSession.count({ where }),
      ]);

      res.json({
        success: true,
        sessions: sessions.map((s) => ({
          id: s.id,
          problemStatement: s.problemStatement,
          researchType: s.researchType as 'survey' | 'interview',
          status: s.status,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        })),
        total,
      });
    } catch (error: any) {
      console.error('Error listing research sessions:', error);
      next(error);
    }
  }
);

/**
 * GET /api/research/sessions/:id
 * Get session details
 */
router.get(
  '/sessions/:id',
  requireAuthDB,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'User not authenticated' });
        return;
      }

      const session = await prisma.researchSession.findFirst({
        where: { id: String(req.params.id), userId: req.userId },
        include: {
          plan: true,
          results: true,
        },
      });

      if (!session) {
        res.status(404).json({ success: false, error: 'Research session not found' });
        return;
      }

      res.json({
        success: true,
        session: {
          id: session.id,
          problemStatement: session.problemStatement,
          productContext: session.productContext,
          targetUserSegment: session.targetUserSegment,
          expectedOutcome: session.expectedOutcome || undefined,
          researchType: session.researchType as 'survey' | 'interview',
          status: session.status,
          createdAt: session.createdAt.toISOString(),
          updatedAt: session.updatedAt.toISOString(),
        },
        plan: session.plan
          ? {
              id: session.plan.id,
              evaluation: JSON.parse(session.plan.evaluation),
              questions: JSON.parse(session.plan.questions),
              tone: session.plan.tone,
              depth: session.plan.depth,
              isEdited: session.plan.isEdited,
            }
          : undefined,
        results: session.results
          ? {
              id: session.results.id,
              uploadedFileName: session.results.uploadedFileName || undefined,
              uploadedFileType: session.results.uploadedFileType || undefined,
              uploadedAt: session.results.uploadedAt?.toISOString(),
              analysis: session.results.analysis ? JSON.parse(session.results.analysis) : undefined,
              reportGenerated: session.results.reportGenerated,
            }
          : undefined,
      });
    } catch (error: any) {
      console.error('Error getting research session:', error);
      next(error);
    }
  }
);

/**
 * DELETE /api/research/sessions/:id
 * Delete research session
 */
router.delete(
  '/sessions/:id',
  requireAuthDB,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'User not authenticated' });
        return;
      }

      const session = await prisma.researchSession.findFirst({
        where: { id: String(req.params.id), userId: req.userId },
      });

      if (!session) {
        res.status(404).json({ success: false, error: 'Research session not found' });
        return;
      }

      await prisma.researchSession.delete({
        where: { id: String(req.params.id) },
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting research session:', error);
      next(error);
    }
  }
);

/**
 * POST /api/research/sessions/:id/generate-questions
 * Generate questions based on evaluation
 */
router.post(
  '/sessions/:id/generate-questions',
  requireAuthDB,
  validate(GenerateQuestionsSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'User not authenticated' });
        return;
      }

      const session = await prisma.researchSession.findFirst({
        where: { id: String(req.params.id), userId: req.userId },
      });

      if (!session) {
        res.status(404).json({ success: false, error: 'Research session not found' });
        return;
      }

      const tone = req.body.tone || 'exploratory';
      const depth = req.body.depth || 'standard';

      // First, evaluate if we don't have an evaluation yet
      const evaluation = await researchService.evaluateProblem(req.userId, {
        problemStatement: session.problemStatement,
        productContext: session.productContext,
        targetUserSegment: session.targetUserSegment,
        expectedOutcome: session.expectedOutcome || undefined,
      });

      // Generate questions based on research type
      let questions: SurveyQuestion[] | InterviewGuide;

      if (session.researchType === 'survey') {
        questions = await researchService.generateSurveyQuestions(
          req.userId,
          {
            problemStatement: session.problemStatement,
            productContext: session.productContext,
            targetUserSegment: session.targetUserSegment,
            evaluation,
          },
          { tone, depth }
        );
      } else {
        questions = await researchService.generateInterviewGuide(
          req.userId,
          {
            problemStatement: session.problemStatement,
            productContext: session.productContext,
            targetUserSegment: session.targetUserSegment,
            evaluation,
          },
          { tone, depth }
        );
      }

      // Save plan to database
      const plan = await prisma.researchPlan.upsert({
        where: { sessionId: session.id },
        update: {
          evaluation: JSON.stringify(evaluation),
          questions: JSON.stringify(questions),
          tone,
          depth,
          isEdited: false,
        },
        create: {
          sessionId: session.id,
          evaluation: JSON.stringify(evaluation),
          questions: JSON.stringify(questions),
          tone,
          depth,
          isEdited: false,
        },
      });

      // Update session status
      await prisma.researchSession.update({
        where: { id: session.id },
        data: { status: 'questions_generated' },
      });

      res.json({
        success: true,
        plan: {
          questions,
          evaluation,
          tone,
          depth,
        },
      });
    } catch (error: any) {
      console.error('Error generating questions:', error);
      next(error);
    }
  }
);

/**
 * PUT /api/research/sessions/:id/questions
 * Update questions after editing
 */
router.put(
  '/sessions/:id/questions',
  requireAuthDB,
  validate(UpdateQuestionsSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'User not authenticated' });
        return;
      }

      const session = await prisma.researchSession.findFirst({
        where: { id: String(req.params.id), userId: req.userId },
        include: { plan: true },
      });

      if (!session || !session.plan) {
        res.status(404).json({ success: false, error: 'Research plan not found' });
        return;
      }

      await prisma.researchPlan.update({
        where: { id: session.plan.id },
        data: {
          questions: JSON.stringify(req.body.questions),
          isEdited: true,
        },
      });

      res.json({
        success: true,
        plan: {
          questions: req.body.questions,
          isEdited: true,
        },
      });
    } catch (error: any) {
      console.error('Error updating questions:', error);
      next(error);
    }
  }
);

/**
 * GET /api/research/sessions/:id/export-template
 * Download Excel template
 */
router.get(
  '/sessions/:id/export-template',
  requireAuthDB,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'User not authenticated' });
        return;
      }

      const session = await prisma.researchSession.findFirst({
        where: { id: String(req.params.id), userId: req.userId },
        include: { plan: true },
      });

      if (!session || !session.plan) {
        res.status(404).json({ success: false, error: 'Research plan not found' });
        return;
      }

      const questions = JSON.parse(session.plan.questions);

      let buffer: Buffer;

      if (session.researchType === 'survey') {
        buffer = await researchExportService.generateSurveyExcel(questions, session.id);
      } else {
        buffer = await researchExportService.generateInterviewExcel(questions, session.id);
      }

      const filename = `research-${session.researchType}-${session.id.substring(0, 8)}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error: any) {
      console.error('Error exporting template:', error);
      next(error);
    }
  }
);

/**
 * POST /api/research/sessions/:id/upload-results
 * Upload research results
 */
router.post(
  '/sessions/:id/upload-results',
  requireAuthDB,
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'User not authenticated' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ success: false, error: 'No file uploaded' });
        return;
      }

      const session = await prisma.researchSession.findFirst({
        where: { id: String(req.params.id), userId: req.userId },
        include: { plan: true },
      });

      if (!session || !session.plan) {
        res.status(404).json({ success: false, error: 'Research plan not found' });
        return;
      }

      const fileExtension = req.file.originalname.toLowerCase().split('.').pop() || '';
      const questions = JSON.parse(session.plan.questions);

      let parsedData: any;
      let dataType: 'survey' | 'interview';
      let rowCount = 0;

      if (session.researchType === 'survey') {
        if (fileExtension === 'xlsx' || fileExtension === 'xls') {
          const result = await researchParserService.parseSurveyExcel(req.file.buffer);
          parsedData = result.data;
          rowCount = result.rowCount;
        } else if (fileExtension === 'csv') {
          const result = await researchParserService.parseSurveyCsv(req.file.buffer);
          parsedData = result.data;
          rowCount = result.rowCount;
        } else {
          res.status(400).json({
            success: false,
            error: 'Invalid file type for survey. Please upload Excel (.xlsx, .xls) or CSV file.',
          });
          return;
        }

        // Validate survey data
        const validation = researchParserService.validateSurveyData(parsedData, questions);
        if (!validation.valid) {
          res.status(400).json({
            success: false,
            error: 'Invalid survey data structure',
            details: validation.errors,
          });
          return;
        }

        dataType = 'survey';
      } else {
        // Interview
        if (fileExtension === 'txt') {
          const result = await researchParserService.parseInterviewTranscripts(req.file.buffer);
          parsedData = result.transcripts;
          rowCount = result.count;
        } else {
          res.status(400).json({
            success: false,
            error: 'Invalid file type for interviews. Please upload TXT file with transcripts.',
          });
          return;
        }

        // Validate interview data
        const validation = researchParserService.validateInterviewData(parsedData);
        if (!validation.valid) {
          res.status(400).json({
            success: false,
            error: 'Invalid interview data structure',
            details: validation.errors,
          });
          return;
        }

        dataType = 'interview';
      }

      // Save results to database
      await prisma.researchResults.upsert({
        where: { sessionId: session.id },
        update: {
          uploadedFileName: req.file.originalname,
          uploadedFileType: fileExtension,
          uploadedAt: new Date(),
          parsedData: JSON.stringify(parsedData),
          analysis: '', // Will be filled by analyze endpoint
        },
        create: {
          sessionId: session.id,
          uploadedFileName: req.file.originalname,
          uploadedFileType: fileExtension,
          uploadedAt: new Date(),
          parsedData: JSON.stringify(parsedData),
          analysis: '',
        },
      });

      // Update session status
      await prisma.researchSession.update({
        where: { id: session.id },
        data: { status: 'data_uploaded' },
      });

      const preview = researchParserService.getDataPreview(
        Array.isArray(parsedData) ? parsedData : [parsedData],
        5
      );

      res.json({
        success: true,
        parsedData: {
          rowCount,
          preview,
          dataType,
        },
      });
    } catch (error: any) {
      console.error('Error uploading results:', error);
      next(error);
    }
  }
);

/**
 * POST /api/research/sessions/:id/analyze
 * Analyze uploaded results
 */
router.post(
  '/sessions/:id/analyze',
  requireAuthDB,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'User not authenticated' });
        return;
      }

      const session = await prisma.researchSession.findFirst({
        where: { id: String(req.params.id), userId: req.userId },
        include: { plan: true, results: true },
      });

      if (!session || !session.plan || !session.results) {
        res.status(404).json({
          success: false,
          error: 'Research plan or results not found. Please upload data first.',
        });
        return;
      }

      const questions = JSON.parse(session.plan.questions);
      const parsedData = JSON.parse(session.results.parsedData);

      let analysis: any;

      if (session.researchType === 'survey') {
        analysis = await researchService.analyzeSurveyResults(
          req.userId,
          questions as SurveyQuestion[],
          parsedData,
          session.problemStatement
        );
      } else {
        analysis = await researchService.analyzeInterviewResults(
          req.userId,
          questions as InterviewGuide,
          parsedData as string[],
          session.problemStatement
        );
      }

      // Save analysis
      await prisma.researchResults.update({
        where: { id: session.results.id },
        data: { analysis: JSON.stringify(analysis) },
      });

      // Update session status
      await prisma.researchSession.update({
        where: { id: session.id },
        data: { status: 'analyzed' },
      });

      res.json({
        success: true,
        analysis,
      });
    } catch (error: any) {
      console.error('Error analyzing results:', error);
      next(error);
    }
  }
);

/**
 * GET /api/research/sessions/:id/report
 * Get generated report
 */
router.get(
  '/sessions/:id/report',
  requireAuthDB,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'User not authenticated' });
        return;
      }

      const session = await prisma.researchSession.findFirst({
        where: { id: String(req.params.id), userId: req.userId },
        include: { plan: true, results: true },
      });

      if (!session || !session.plan || !session.results || !session.results.analysis) {
        res.status(404).json({
          success: false,
          error: 'Analysis not found. Please analyze data first.',
        });
        return;
      }

      // Check if report already generated
      if (session.results.reportGenerated && session.results.reportMarkdown) {
        res.json({
          success: true,
          report: {
            markdown: session.results.reportMarkdown,
            metadata: {
              sessionId: session.id,
              title: `Research Report: ${session.problemStatement.substring(0, 50)}...`,
              researchType: session.researchType,
              conductedDate: session.createdAt.toISOString().split('T')[0],
              respondentCount: session.researchType === 'survey'
                ? JSON.parse(session.results.parsedData).length
                : JSON.parse(session.results.parsedData).length,
            },
          },
        });
        return;
      }

      // Generate new report
      const evaluation = JSON.parse(session.plan.evaluation);
      const questions = JSON.parse(session.plan.questions);
      const analysis = JSON.parse(session.results.analysis);
      const parsedData = JSON.parse(session.results.parsedData);

      const markdown = await researchService.generateReport(req.userId, {
        problemStatement: session.problemStatement,
        productContext: session.productContext,
        researchType: session.researchType as 'survey' | 'interview',
        evaluation,
        questions,
        analysis,
        respondentCount: Array.isArray(parsedData) ? parsedData.length : parsedData.length,
      });

      // Save report
      await prisma.researchResults.update({
        where: { id: session.results.id },
        data: {
          reportMarkdown: markdown,
          reportGenerated: true,
        },
      });

      // Update session status
      await prisma.researchSession.update({
        where: { id: session.id },
        data: { status: 'completed' },
      });

      res.json({
        success: true,
        report: {
          markdown,
          metadata: {
            sessionId: session.id,
            title: `Research Report: ${session.problemStatement.substring(0, 50)}...`,
            researchType: session.researchType,
            conductedDate: session.createdAt.toISOString().split('T')[0],
            respondentCount: Array.isArray(parsedData) ? parsedData.length : parsedData.length,
          },
        },
      });
    } catch (error: any) {
      console.error('Error getting report:', error);
      next(error);
    }
  }
);

/**
 * GET /api/research/sessions/:id/export-report
 * Export report in specified format
 */
router.get(
  '/sessions/:id/export-report',
  requireAuthDB,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'User not authenticated' });
        return;
      }

      const format = (req.query.format as string) || 'markdown';

      if (!['pdf', 'markdown', 'docx'].includes(format)) {
        res.status(400).json({
          success: false,
          error: 'Invalid format. Supported formats: pdf, markdown, docx',
        });
        return;
      }

      const session = await prisma.researchSession.findFirst({
        where: { id: String(req.params.id), userId: req.userId },
        include: { results: true },
      });

      if (!session || !session.results || !session.results.reportMarkdown) {
        res.status(404).json({
          success: false,
          error: 'Report not found. Please generate report first.',
        });
        return;
      }

      const metadata = {
        sessionId: session.id,
        title: `Research Report: ${session.problemStatement.substring(0, 50)}`,
        researchType: session.researchType,
        conductedDate: session.createdAt.toISOString().split('T')[0],
        respondentCount: 0,
      };

      if (format === 'pdf') {
        const buffer = await researchExportService.exportReportToPDF(
          session.results.reportMarkdown,
          metadata
        );
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="research-report-${session.id.substring(0, 8)}.pdf"`);
        res.send(buffer);
      } else if (format === 'docx') {
        const buffer = await researchExportService.exportReportToDOCX(
          session.results.reportMarkdown,
          metadata
        );
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="research-report-${session.id.substring(0, 8)}.docx"`);
        res.send(buffer);
      } else {
        // Markdown
        const markdown = researchExportService.exportReportToMarkdown(
          session.results.reportMarkdown,
          metadata
        );
        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader('Content-Disposition', `attachment; filename="research-report-${session.id.substring(0, 8)}.md"`);
        res.send(markdown);
      }
    } catch (error: any) {
      console.error('Error exporting report:', error);
      next(error);
    }
  }
);

export default router;
