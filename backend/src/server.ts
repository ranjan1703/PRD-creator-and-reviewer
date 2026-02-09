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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/prd', prdRoutes);
app.use('/api/jira', jiraRoutes);
app.use('/api/export', exportRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`🚀 PRD System Backend running on http://localhost:${PORT}`);
  console.log(`📝 Frontend URL: ${FRONTEND_URL}`);
  console.log(`🤖 Gemini API Key: ${process.env.GEMINI_API_KEY ? '✓ Configured' : '✗ Missing'}`);
});
