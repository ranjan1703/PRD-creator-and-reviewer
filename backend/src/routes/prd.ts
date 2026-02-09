import express from 'express';
import { z } from 'zod';
import multer from 'multer';
import { claudeService } from '../services/claude';
import { documentParserService } from '../services/documentParser';
import { documentExportService } from '../services/documentExport';
import { CreatePRDRequest, ReviewPRDRequest } from '../../../shared/types';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

const router = express.Router();

// Validation schemas
const CreatePRDSchema = z.object({
  input: z.string().min(1, 'Input is required and must be a non-empty string'),
  inputType: z.enum(['text', 'jira']).default('text'),
  sourceId: z.string().optional(),
});

const ReviewPRDSchema = z.object({
  prdContent: z.string().min(1, 'PRD content is required and must be a non-empty string'),
  format: z.enum(['markdown', 'json']).optional(),
});

const GetPRDSchema = z.object({
  id: z.string().regex(/^prd-\d+$/, 'Invalid PRD ID format'),
});

// Validation middleware
function validate<T extends z.ZodType>(schema: T) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const data = req.method === 'GET' ? req.params : req.body;
      const validated = schema.parse(data);

      if (req.method === 'GET') {
        req.params = validated as any;
      } else {
        req.body = validated;
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
}

// Configure multer for file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const supportedExtensions = documentParserService.getSupportedExtensions();
    const extension = file.originalname.toLowerCase().split('.').pop() || '';

    if (supportedExtensions.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type. Supported formats: ${supportedExtensions.join(', ')}`));
    }
  },
});

// Directory to store PRDs
const PRDS_DIR = path.join(process.env.HOME || '', 'Documents', 'prd-system', 'prds');

// Ensure PRDs directory exists
async function ensurePRDsDir() {
  try {
    await fs.access(PRDS_DIR);
  } catch {
    await fs.mkdir(PRDS_DIR, { recursive: true });
  }
}

/**
 * POST /api/prd/create
 * Create a new PRD from user input
 */
router.post('/create', validate(CreatePRDSchema), async (req, res, next) => {
  try {
    const { input, inputType, sourceId }: CreatePRDRequest = req.body;

    // Generate PRD using Claude
    const prdMarkdown = await claudeService.createPRD(input);

    // Extract title from PRD (first heading)
    const titleMatch = prdMarkdown.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : 'Untitled PRD';

    // Generate metadata
    const timestamp = new Date().toISOString();
    const id = `prd-${Date.now()}`;
    const filename = `${id}.md`;

    // Create frontmatter
    const frontmatter = {
      id,
      title,
      createdAt: timestamp,
      updatedAt: timestamp,
      source: inputType,
      ...(sourceId && { sourceId }),
    };

    // Combine frontmatter and content
    const fullContent = `---
${yaml.dump(frontmatter)}---

${prdMarkdown}`;

    // Save to file
    await ensurePRDsDir();
    const filepath = path.join(PRDS_DIR, filename);
    await fs.writeFile(filepath, fullContent, 'utf-8');

    res.json({
      success: true,
      prd: {
        metadata: {
          id,
          createdAt: timestamp,
          updatedAt: timestamp,
          source: inputType,
          ...(sourceId && { sourceId }),
        },
        document: { title }, // Simplified for now
      },
      markdown: prdMarkdown,
      filepath,
    });
  } catch (error: any) {
    console.error('Error creating PRD:', error);
    next(error);
  }
});

/**
 * POST /api/prd/create-stream
 * Create a PRD with streaming response
 */
router.post('/create-stream', validate(CreatePRDSchema), async (req, res, next) => {
  try {
    const { input, inputType, sourceId }: CreatePRDRequest = req.body;

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullContent = '';

    // Stream PRD generation
    for await (const chunk of claudeService.createPRDStream(input)) {
      fullContent += chunk;
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }

    // Save the generated PRD
    const titleMatch = fullContent.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : 'Untitled PRD';

    const timestamp = new Date().toISOString();
    const id = `prd-${Date.now()}`;
    const filename = `${id}.md`;

    const frontmatter = {
      id,
      title,
      createdAt: timestamp,
      updatedAt: timestamp,
      source: inputType,
      ...(sourceId && { sourceId }),
    };

    const fullDoc = `---
${yaml.dump(frontmatter)}---

${fullContent}`;

    await ensurePRDsDir();
    const filepath = path.join(PRDS_DIR, filename);
    await fs.writeFile(filepath, fullDoc, 'utf-8');

    // Send completion message
    res.write(`data: ${JSON.stringify({ done: true, id, filepath })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error('Error streaming PRD:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

/**
 * POST /api/prd/review
 * Review a PRD and provide feedback
 */
router.post('/review', validate(ReviewPRDSchema), async (req, res, next) => {
  try {
    const { prdContent }: ReviewPRDRequest = req.body;

    // Review PRD using Claude
    const review = await claudeService.reviewPRD(prdContent);

    res.json({
      success: true,
      review,
    });
  } catch (error: any) {
    console.error('Error reviewing PRD:', error);
    next(error);
  }
});

/**
 * POST /api/prd/review-document
 * Upload and review a PRD document (PDF, DOCX, TXT, Excel)
 */
router.post('/review-document', upload.single('document'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please upload a document.',
      });
    }

    const { buffer, mimetype, originalname } = req.file;

    console.log(`Received file: ${originalname} (${mimetype}, ${buffer.length} bytes)`);

    // Parse the document to extract text
    const parsed = await documentParserService.parseDocument(buffer, mimetype, originalname);

    if (!parsed.text || parsed.text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Could not extract text from the document. The file may be empty or corrupted.',
      });
    }

    console.log(`Extracted ${parsed.text.length} characters from ${originalname}`);

    // Review the extracted PRD content
    const review = await claudeService.reviewPRD(parsed.text);

    res.json({
      success: true,
      review,
      extractedText: parsed.text.substring(0, 500) + '...', // Preview of extracted text
      metadata: parsed.metadata,
      filename: originalname,
    });
  } catch (error: any) {
    console.error('Error reviewing document:', error);

    if (error.message?.includes('Unsupported file type')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    next(error);
  }
});

/**
 * GET /api/prd/list
 * List all saved PRDs
 */
router.get('/list', async (req, res, next) => {
  try {
    await ensurePRDsDir();
    const files = await fs.readdir(PRDS_DIR);
    const prdFiles = files.filter((f) => f.endsWith('.md'));

    const prds = await Promise.all(
      prdFiles.map(async (filename) => {
        const filepath = path.join(PRDS_DIR, filename);
        const content = await fs.readFile(filepath, 'utf-8');

        // Extract frontmatter
        const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---/);
        if (frontmatterMatch) {
          const metadata = yaml.load(frontmatterMatch[1]) as any;
          return {
            filename,
            filepath,
            ...metadata,
          };
        }

        return {
          filename,
          filepath,
          id: filename.replace('.md', ''),
          title: 'Unknown',
        };
      })
    );

    res.json({
      success: true,
      prds: prds.sort((a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      ),
    });
  } catch (error: any) {
    console.error('Error listing PRDs:', error);
    next(error);
  }
});

/**
 * GET /api/prd/:id
 * Get a specific PRD by ID
 */
router.get('/:id', validate(GetPRDSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const filepath = path.join(PRDS_DIR, `${id}.md`);

    const content = await fs.readFile(filepath, 'utf-8');

    // Extract frontmatter and content
    const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---\n([\s\S]+)/);
    if (frontmatterMatch) {
      const metadata = yaml.load(frontmatterMatch[1]) as any;
      const markdown = frontmatterMatch[2];

      res.json({
        success: true,
        prd: {
          metadata,
          markdown,
        },
      });
    } else {
      res.json({
        success: true,
        prd: {
          markdown: content,
        },
      });
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({
        success: false,
        error: 'PRD not found',
      });
    }
    console.error('Error getting PRD:', error);
    next(error);
  }
});

/**
 * POST /api/prd/export
 * Export PRD markdown to PDF or DOCX format
 */
const ExportPRDSchema = z.object({
  markdown: z.string().min(1, 'Markdown content is required'),
  format: z.enum(['pdf', 'docx']),
  title: z.string().optional(),
});

router.post('/export', async (req, res, next) => {
  try {
    const validation = ExportPRDSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const { markdown, format, title } = validation.data;

    console.log(`Exporting PRD to ${format.toUpperCase()}...`);

    let buffer: Buffer;
    let filename: string;
    let contentType: string;

    if (format === 'pdf') {
      buffer = await documentExportService.exportToPDF(markdown, { title });
      filename = `${title || 'PRD'}.pdf`;
      contentType = 'application/pdf';
    } else {
      buffer = await documentExportService.exportToDOCX(markdown, { title });
      filename = `${title || 'PRD'}.docx`;
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);

    console.log(`Successfully exported PRD as ${format.toUpperCase()}: ${filename}`);
  } catch (error: any) {
    console.error('Error exporting PRD:', error);
    next(error);
  }
});

export default router;
