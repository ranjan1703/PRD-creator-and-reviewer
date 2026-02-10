import { Request, Response, NextFunction } from 'express';
import { authDBService } from '../services/auth-db';

// Extend Express Request type to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Middleware to require authentication for protected routes (database version)
 */
export const requireAuthDB = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Authentication required. Please provide a valid Bearer token.',
      });
      return;
    }

    // Extract the token (remove "Bearer " prefix)
    const token = authHeader.substring(7);

    // Validate the token
    const validation = await authDBService.validateToken(token);

    if (!validation.valid) {
      res.status(401).json({
        success: false,
        error: validation.error || 'Invalid or expired session',
      });
      return;
    }

    // Attach userId to request for downstream handlers
    req.userId = validation.userId;

    // Token is valid, proceed to the next middleware/route handler
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during authentication',
    });
  }
};
