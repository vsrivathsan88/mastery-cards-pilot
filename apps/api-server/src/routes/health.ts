/**
 * Health Check Routes
 */

import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { sessionService } from '../services/session-service.js';
import type { HealthResponse } from '../types/api.js';

const router: ExpressRouter = Router();

/**
 * GET /api/health
 * Health check endpoint (no sensitive data)
 */
router.get('/health', (req: Request, res: Response) => {
  const stats = sessionService.getStats();

  res.json({
    status: 'ok',
    timestamp: Date.now(),
    activeSessions: stats.activeSessions,
  } as HealthResponse);
});

export default router;
