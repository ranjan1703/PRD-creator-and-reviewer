import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { Session, LoginResponse, ValidateResponse } from '../../../shared/types';

interface SessionStore {
  [token: string]: Session;
}

export class AuthService {
  private static instance: AuthService;
  private sessions: SessionStore = {};
  private readonly SESSIONS_FILE: string;
  private readonly SESSION_DURATION_DAYS = 7;

  // Hardcoded credentials
  private readonly ADMIN_USERNAME = 'Admin';
  private readonly ADMIN_PASSWORD = 'Admin';

  private constructor() {
    // Store sessions in ~/.prd-system/sessions.json
    const appDir = path.join(os.homedir(), '.prd-system');
    if (!fs.existsSync(appDir)) {
      fs.mkdirSync(appDir, { recursive: true });
    }
    this.SESSIONS_FILE = path.join(appDir, 'sessions.json');
    this.loadSessions();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Load sessions from file storage
   */
  private loadSessions(): void {
    try {
      if (fs.existsSync(this.SESSIONS_FILE)) {
        const data = fs.readFileSync(this.SESSIONS_FILE, 'utf-8');
        this.sessions = JSON.parse(data);
        // Clean up expired sessions on load
        this.cleanupExpiredSessions();
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
      this.sessions = {};
    }
  }

  /**
   * Save sessions to file storage
   */
  private saveSessions(): void {
    try {
      fs.writeFileSync(this.SESSIONS_FILE, JSON.stringify(this.sessions, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save sessions:', error);
    }
  }

  /**
   * Remove expired sessions from memory and storage
   */
  private cleanupExpiredSessions(): void {
    const now = new Date();
    let hasChanges = false;

    for (const [token, session] of Object.entries(this.sessions)) {
      const expiresAt = new Date(session.expiresAt);
      if (expiresAt < now) {
        delete this.sessions[token];
        hasChanges = true;
      }
    }

    if (hasChanges) {
      this.saveSessions();
    }
  }

  /**
   * Login with username and password
   */
  login(username: string, password: string): LoginResponse {
    // Validate credentials
    if (username !== this.ADMIN_USERNAME || password !== this.ADMIN_PASSWORD) {
      return {
        success: false,
        error: 'Invalid username or password',
      };
    }

    // Generate session token
    const token = randomUUID();
    const createdAt = new Date();
    const expiresAt = new Date(createdAt);
    expiresAt.setDate(expiresAt.getDate() + this.SESSION_DURATION_DAYS);

    // Store session
    const session: Session = {
      token,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    this.sessions[token] = session;
    this.saveSessions();

    return {
      success: true,
      token,
    };
  }

  /**
   * Validate if a token is valid and not expired
   */
  validateToken(token: string): ValidateResponse {
    const session = this.sessions[token];

    if (!session) {
      return {
        valid: false,
        error: 'Invalid session token',
      };
    }

    const now = new Date();
    const expiresAt = new Date(session.expiresAt);

    if (expiresAt < now) {
      // Session expired, clean it up
      delete this.sessions[token];
      this.saveSessions();

      return {
        valid: false,
        error: 'Session expired',
      };
    }

    return {
      valid: true,
    };
  }

  /**
   * Logout and invalidate session
   */
  logout(token: string): boolean {
    if (this.sessions[token]) {
      delete this.sessions[token];
      this.saveSessions();
      return true;
    }
    return false;
  }

  /**
   * Get all active sessions (for debugging/admin purposes)
   */
  getActiveSessions(): Session[] {
    this.cleanupExpiredSessions();
    return Object.values(this.sessions);
  }
}

export const authService = AuthService.getInstance();
