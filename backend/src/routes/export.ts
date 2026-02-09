import express from 'express';
import { z } from 'zod';
import { confluenceService } from '../services/confluence';
import { notionService } from '../services/notion';

const router = express.Router();

// Validation schemas
const ExportSchema = z.object({
  platform: z.enum(['confluence', 'notion'], {
    errorMap: () => ({ message: 'Platform must be either "confluence" or "notion"' })
  }),
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  spaceKey: z.string().optional(),
  parentPageId: z.string().optional(),
}).refine(
  (data) => {
    if (data.platform === 'confluence' && !data.spaceKey) {
      return false;
    }
    if (data.platform === 'notion' && !data.parentPageId) {
      return false;
    }
    return true;
  },
  (data) => ({
    message: data.platform === 'confluence'
      ? 'Space key is required for Confluence export'
      : 'Parent page ID is required for Notion export',
    path: [data.platform === 'confluence' ? 'spaceKey' : 'parentPageId'],
  })
);

// Validation middleware
function validate<T extends z.ZodType>(schema: T) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      req.body = schema.parse(req.body);
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

interface ExportRequest {
  platform: 'confluence' | 'notion';
  title: string;
  content: string;
  spaceKey?: string;
  parentPageId?: string;
}

/**
 * GET /api/export/status
 * Check which export integrations are configured
 */
router.get('/status', (req, res) => {
  res.json({
    confluence: confluenceService.isConfigured(),
    notion: notionService.isConfigured(),
  });
});

/**
 * POST /api/export
 * Export a PRD to Confluence or Notion
 */
router.post('/', validate(ExportSchema), async (req, res, next) => {
  try {
    const { platform, title, content, spaceKey, parentPageId }: ExportRequest = req.body;

    if (platform === 'confluence') {
      if (!confluenceService.isConfigured()) {
        return res.status(503).json({
          success: false,
          error: 'Confluence integration is not configured',
        });
      }

      const result = await confluenceService.createPage(
        spaceKey!,
        title,
        content,
        parentPageId
      );

      res.json({
        success: true,
        platform: 'confluence',
        pageId: result.id,
        url: result.url,
      });
    } else if (platform === 'notion') {
      if (!notionService.isConfigured()) {
        return res.status(503).json({
          success: false,
          error: 'Notion integration is not configured',
        });
      }

      const result = await notionService.createPage(
        parentPageId!,
        title,
        content
      );

      res.json({
        success: true,
        platform: 'notion',
        pageId: result.id,
        url: result.url,
      });
    }
  } catch (error: any) {
    console.error('Error exporting PRD:', error);
    next(error);
  }
});

export default router;
