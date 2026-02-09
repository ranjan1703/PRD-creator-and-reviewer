import express from 'express';
import { z } from 'zod';
import { jiraService } from '../services/jira';
import { FetchJiraRequest } from '../../../shared/types/jira';

const router = express.Router();

// Validation schemas
const FetchJiraSchema = z.object({
  ticketId: z.string().min(1, 'Ticket ID is required'),
});

const TransformJiraSchema = z.object({
  ticketId: z.union([
    z.string().min(1, 'Ticket ID is required'),
    z.array(z.string().min(1)).min(1, 'At least one ticket ID is required'),
  ]),
});

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

/**
 * GET /api/jira/status
 * Check if Jira integration is configured
 */
router.get('/status', (req, res) => {
  res.json({
    configured: jiraService.isConfigured(),
  });
});

/**
 * POST /api/jira/fetch
 * Fetch a Jira ticket by ID or key
 */
router.post('/fetch', validate(FetchJiraSchema), async (req, res, next) => {
  try {
    // FetchJiraSchema ensures ticketId is a string, not an array
    const { ticketId } = req.body as { ticketId: string };

    if (!jiraService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Jira integration is not configured',
      });
    }

    const ticket = await jiraService.fetchTicket(ticketId.trim());

    res.json({
      success: true,
      ticket,
    });
  } catch (error: any) {
    console.error('Error fetching Jira ticket:', error);

    if (error.message.includes('404') || error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: `Jira ticket not found: ${req.body.ticketId}`,
      });
    }

    next(error);
  }
});

/**
 * POST /api/jira/transform
 * Transform a Jira ticket (or multiple tickets) into PRD input format
 * Accepts either a single ticketId string or an array of ticketId strings
 */
router.post('/transform', validate(TransformJiraSchema), async (req, res, next) => {
  try {
    const { ticketId } = req.body;

    if (!jiraService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Jira integration is not configured',
      });
    }

    // Check if it's a single ticket or multiple tickets
    const isMultiple = Array.isArray(ticketId);

    if (isMultiple) {
      // Handle multiple tickets
      const ticketIds = ticketId as string[];
      console.log(`Processing ${ticketIds.length} Jira tickets:`, ticketIds);

      // Fetch all tickets in parallel
      const tickets = await jiraService.fetchMultipleTickets(ticketIds);

      // Generate combined PRD input
      const prdInput = jiraService.transformMultipleTicketsToPRDInput(tickets);

      // Generate combined AI summary
      const summary = await jiraService.generateCombinedSummary(tickets);

      res.json({
        success: true,
        tickets, // Array of tickets
        ticket: tickets[0], // Keep backward compatibility
        prdInput,
        summary,
        isMultiple: true,
        count: tickets.length,
      });
    } else {
      // Handle single ticket (existing logic)
      const ticket = await jiraService.fetchTicket(ticketId.trim());
      const prdInput = jiraService.transformTicketToPRDInput(ticket);
      const summary = await jiraService.generateSummary(ticket);

      res.json({
        success: true,
        ticket,
        tickets: [ticket], // Also provide as array for consistency
        prdInput,
        summary,
        isMultiple: false,
        count: 1,
      });
    }
  } catch (error: any) {
    console.error('Error transforming Jira ticket(s):', error);

    if (error.message.includes('404') || error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'One or more Jira tickets not found. Please check the ticket IDs.',
      });
    }

    next(error);
  }
});

/**
 * POST /api/jira/comment
 * Add a comment to a Jira ticket
 */
const AddCommentSchema = z.object({
  ticketId: z.string().min(1, 'Ticket ID is required'),
  comment: z.string().min(1, 'Comment text is required'),
});

router.post('/comment', validate(AddCommentSchema), async (req, res, next) => {
  try {
    const { ticketId, comment } = req.body;

    if (!jiraService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Jira integration is not configured',
      });
    }

    const result = await jiraService.addComment(ticketId, comment);

    res.json({
      success: true,
      commentId: result.id,
      message: 'Comment added successfully to Jira ticket',
    });
  } catch (error: any) {
    console.error('Error adding comment to Jira:', error);
    next(error);
  }
});

/**
 * POST /api/jira/attachment
 * Add an attachment to a Jira ticket
 */
const AddAttachmentSchema = z.object({
  ticketId: z.string().min(1, 'Ticket ID is required'),
  filename: z.string().min(1, 'Filename is required'),
  fileData: z.string().min(1, 'File data is required'), // Base64 encoded file
});

router.post('/attachment', validate(AddAttachmentSchema), async (req, res, next) => {
  try {
    const { ticketId, filename, fileData } = req.body;

    if (!jiraService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Jira integration is not configured',
      });
    }

    // Decode base64 file data
    const fileBuffer = Buffer.from(fileData, 'base64');

    const result = await jiraService.addAttachment(ticketId, fileBuffer, filename);

    res.json({
      success: true,
      attachmentId: result.id,
      url: result.url,
      message: `Attachment "${filename}" added successfully to Jira ticket`,
    });
  } catch (error: any) {
    console.error('Error adding attachment to Jira:', error);
    next(error);
  }
});

export default router;
