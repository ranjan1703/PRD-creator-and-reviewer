import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth';

/**
 * Middleware to require authentication for protected routes
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
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
    const validation = authService.validateToken(token);

    if (!validation.valid) {
      res.status(401).json({
        success: false,
        error: validation.error || 'Invalid or expired session',
      });
      return;
    }

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
