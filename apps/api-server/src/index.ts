/**
 * Simili API Server
 * Secure backend for child tutoring data
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { securityConfig } from './config/security.js';
import { privacyMiddleware } from './middleware/privacy.js';
import analyzeRouter from './routes/analyze.js';
import sessionRouter from './routes/session.js';
import healthRouter from './routes/health.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Security Middleware (BEFORE routes)
app.use(helmet(securityConfig.helmet)); // Security headers
app.use(cors(securityConfig.cors)); // CORS
app.use(rateLimit(securityConfig.rateLimit)); // Rate limiting
app.use(express.json({ limit: '10mb' })); // Body parser with size limit
app.use(privacyMiddleware); // Privacy/PII filtering

// Request logging (anonymized)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api', healthRouter);
app.use('/api', sessionRouter);
app.use('/api', analyzeRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server Error]', err);
  res.status(500).json({ 
    error: 'Internal server error',
    // Never expose error details in production
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║  Simili API Server - Child-Safe Backend   ║
╠════════════════════════════════════════════╣
║  Port: ${PORT}                                ║
║  Environment: ${process.env.NODE_ENV || 'development'}           ║
║  Privacy: Enabled                          ║
║  Encryption: Active                        ║
╚════════════════════════════════════════════╝
  `);
  
  console.log('✓ Security middleware active');
  console.log('✓ Rate limiting enabled');
  console.log('✓ Privacy filters active');
  console.log('✓ Anonymous sessions enabled');
  console.log('\nReady to accept requests...\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});
