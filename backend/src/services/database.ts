import { PrismaClient } from '@prisma/client';

/**
 * Database service using Prisma ORM
 * Provides a singleton Prisma client instance
 */
class DatabaseService {
  private static instance: DatabaseService;
  public prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    console.log('🗄️  Database service initialized');
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Connect to the database
   */
  async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect from the database
   */
  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      console.log('🔌 Database disconnected');
    } catch (error) {
      console.error('Error disconnecting from database:', error);
      throw error;
    }
  }

  /**
   * Check if database is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

export const databaseService = DatabaseService.getInstance();
export const prisma = databaseService.prisma;
