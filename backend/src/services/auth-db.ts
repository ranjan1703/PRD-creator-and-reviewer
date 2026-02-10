import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { prisma } from './database';
import type { LoginResponse, ValidateResponse } from '../../../shared/types';

/**
 * Database-backed authentication service with multi-user support
 */
export class AuthDBService {
  private static instance: AuthDBService;
  private readonly SESSION_DURATION_DAYS = 7;
  private readonly SALT_ROUNDS = 10;

  private constructor() {
    console.log('🔐 AuthDB Service initialized');
  }

  static getInstance(): AuthDBService {
    if (!AuthDBService.instance) {
      AuthDBService.instance = new AuthDBService();
    }
    return AuthDBService.instance;
  }

  /**
   * Hash a password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verify a password against a hash
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Register a new user
   */
  async register(
    email: string,
    username: string,
    password: string,
    name?: string
  ): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      });

      if (existingUser) {
        return {
          success: false,
          error: 'User with this email or username already exists',
        };
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          name,
        },
      });

      return {
        success: true,
        userId: user.id,
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Failed to register user',
      };
    }
  }

  /**
   * Login with email/username and password
   */
  async login(usernameOrEmail: string, password: string): Promise<LoginResponse> {
    try {
      // Find user by username or email
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
        },
      });

      if (!user) {
        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      // Verify password
      const isPasswordValid = await this.verifyPassword(password, user.password);

      if (!isPasswordValid) {
        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      // Generate session token
      const token = randomUUID();
      const createdAt = new Date();
      const expiresAt = new Date(createdAt);
      expiresAt.setDate(expiresAt.getDate() + this.SESSION_DURATION_DAYS);

      // Create session in database
      await prisma.session.create({
        data: {
          token,
          userId: user.id,
          createdAt,
          expiresAt,
        },
      });

      // Clean up expired sessions for this user
      await this.cleanupExpiredSessions(user.id);

      return {
        success: true,
        token,
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed',
      };
    }
  }

  /**
   * Validate a session token
   */
  async validateToken(token: string): Promise<ValidateResponse & { userId?: string }> {
    try {
      const session = await prisma.session.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!session) {
        return {
          valid: false,
          error: 'Invalid session token',
        };
      }

      const now = new Date();
      const expiresAt = new Date(session.expiresAt);

      if (expiresAt < now) {
        // Session expired, delete it
        await prisma.session.delete({
          where: { token },
        });

        return {
          valid: false,
          error: 'Session expired',
        };
      }

      return {
        valid: true,
        userId: session.userId,
      };
    } catch (error: any) {
      console.error('Token validation error:', error);
      return {
        valid: false,
        error: 'Token validation failed',
      };
    }
  }

  /**
   * Logout and invalidate session
   */
  async logout(token: string): Promise<boolean> {
    try {
      const result = await prisma.session.delete({
        where: { token },
      });

      return !!result;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  /**
   * Clean up expired sessions for a user
   */
  private async cleanupExpiredSessions(userId: string): Promise<void> {
    try {
      const now = new Date();

      await prisma.session.deleteMany({
        where: {
          userId,
          expiresAt: {
            lt: now,
          },
        },
      });
    } catch (error) {
      console.error('Session cleanup error:', error);
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        createdAt: true,
      },
    });
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, newPassword: string): Promise<boolean> {
    try {
      const hashedPassword = await this.hashPassword(newPassword);

      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      // Invalidate all sessions for this user (force re-login)
      await prisma.session.deleteMany({
        where: { userId },
      });

      return true;
    } catch (error) {
      console.error('Password update error:', error);
      return false;
    }
  }

  /**
   * Create default admin user if it doesn't exist
   */
  async ensureDefaultAdmin(): Promise<void> {
    try {
      const admin = await prisma.user.findFirst({
        where: { username: 'Admin' },
      });

      if (!admin) {
        console.log('📝 Creating default admin user...');
        await this.register('admin@prd-system.local', 'Admin', 'Admin', 'Administrator');
        console.log('✅ Default admin user created (Admin/Admin)');
      }
    } catch (error) {
      console.error('Error creating default admin:', error);
    }
  }
}

export const authDBService = AuthDBService.getInstance();
