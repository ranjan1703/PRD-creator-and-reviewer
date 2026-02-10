import { Router, Request, Response } from 'express';
import { authDBService } from '../services/auth-db';
import { requireAuthDB } from '../middleware/auth-db';
import type { LoginRequest } from '../../../shared/types';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, username, password, name } = req.body;

    // Validate request
    if (!email || !username || !password) {
      res.status(400).json({
        success: false,
        error: 'Email, username, and password are required',
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
      return;
    }

    // Password validation (at least 6 characters)
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long',
      });
      return;
    }

    // Attempt registration
    const result = await authDBService.register(email, username, password, name);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      userId: result.userId,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during registration',
    });
  }
});

/**
 * POST /api/auth/login
 * Login with username/email and password
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body as LoginRequest;

    // Validate request
    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: 'Username/email and password are required',
      });
      return;
    }

    // Attempt login
    const result = await authDBService.login(username, password);

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
router.post('/logout', requireAuthDB, async (req: Request, res: Response): Promise<void> => {
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
    const success = await authDBService.logout(token);

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
router.get('/validate', requireAuthDB, (req: Request, res: Response): void => {
  try {
    // If we reach here, the requireAuthDB middleware has already validated the token
    res.status(200).json({
      valid: true,
      userId: req.userId,
    });
  } catch (error) {
    console.error('Validate error:', error);
    res.status(500).json({
      valid: false,
      error: 'Internal server error during validation',
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user info (requires authentication)
 */
router.get('/me', requireAuthDB, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
      return;
    }

    const user = await authDBService.getUserById(req.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
