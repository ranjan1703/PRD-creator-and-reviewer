import dotenv from 'dotenv';

// Load environment variables FIRST, before any other imports
dotenv.config();

// Debug: Log what dotenv loaded
console.log('📋 Environment variables after dotenv.config():');
console.log('  - GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✓' : '✗');
console.log('  - JIRA_BASE_URL:', process.env.JIRA_BASE_URL || '(empty)');
console.log('  - JIRA_EMAIL:', process.env.JIRA_EMAIL || '(empty)');
console.log('  - JIRA_API_TOKEN:', process.env.JIRA_API_TOKEN ? '✓ Set' : '✗ Missing');

import express from 'express';
import cors from 'cors';
import prdRoutes from './routes/prd';
import jiraRoutes from './routes/jira';
import exportRoutes from './routes/export';

// Use database-backed services (with multi-user and encryption)
import authDBRoutes from './routes/auth-db';
import settingsDBRoutes from './routes/settings-db';
import { requireAuthDB } from './middleware/auth-db';
import { databaseService } from './services/database';
import { authDBService } from './services/auth-db';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize database on startup
async function initializeDatabase() {
  try {
    await databaseService.connect();
    await authDBService.ensureDefaultAdmin();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  }
}

// Health check (with database status)
app.get('/health', async (req, res) => {
  const dbHealthy = await databaseService.healthCheck();
  res.json({
    status: dbHealthy ? 'ok' : 'degraded',
    database: dbHealthy ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Public routes (no authentication required)
app.use('/api/auth', authDBRoutes);

// Protected routes (authentication required with database)
app.use('/api/settings', requireAuthDB, settingsDBRoutes);
app.use('/api/prd', requireAuthDB, prdRoutes);
app.use('/api/jira', requireAuthDB, jiraRoutes);
app.use('/api/export', requireAuthDB, exportRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server with database initialization
async function startServer() {
  await initializeDatabase();

  app.listen(PORT, () => {
    console.log(`🚀 PRD System Backend running on http://localhost:${PORT}`);
    console.log(`📝 Frontend URL: ${FRONTEND_URL}`);
    console.log(`🔐 Multi-user authentication: Enabled`);
    console.log(`🔒 API key encryption: Enabled`);
    console.log(`💾 Database: SQLite (${process.cwd()}/prisma/prd-system.db)`);
  });
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing database connection...');
  await databaseService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT received, closing database connection...');
  await databaseService.disconnect();
  process.exit(0);
});

// Start the server
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
