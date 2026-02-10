import { Router, Request, Response } from 'express';
import { authService } from '../services/auth';
import { requireAuth } from '../middleware/auth';
import type { LoginRequest } from '../../../shared/types';

const router = Router();

/**
 * POST /api/auth/login
 * Login with username and password
 */
router.post('/login', (req: Request, res: Response): void => {
  try {
    const { username, password } = req.body as LoginRequest;

    // Validate request
    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: 'Username and password are required',
      });
      return;
    }

    // Attempt login
    const result = authService.login(username, password);

    if (!result.success) {
      res.status(401).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during login',
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout and invalidate session (requires authentication)
 */
router.post('/logout', requireAuth, (req: Request, res: Response): void => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(400).json({
        success: false,
        error: 'No token provided',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const success = authService.logout(token);

    res.status(200).json({
      success,
      message: success ? 'Logged out successfully' : 'Session not found',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during logout',
    });
  }
});

/**
 * GET /api/auth/validate
 * Check if current session is valid (requires authentication)
 */
router.get('/validate', requireAuth, (req: Request, res: Response): void => {
  try {
    // If we reach here, the requireAuth middleware has already validated the token
    res.status(200).json({
      valid: true,
    });
  } catch (error) {
    console.error('Validate error:', error);
    res.status(500).json({
      valid: false,
      error: 'Internal server error during validation',
    });
  }
});

export default router;
