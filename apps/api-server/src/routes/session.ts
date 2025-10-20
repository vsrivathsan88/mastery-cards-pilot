/**
 * Session API Routes
 * Anonymous session management
 */

import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { sessionService } from '../services/session-service.js';
import type { SessionCreateResponse } from '../types/api.js';

const router: ExpressRouter = Router();

/**
 * POST /api/session
 * Create new anonymous session
 */
router.post('/session', (req: Request, res: Response) => {
  try {
    const sessionId = sessionService.createSession();

    res.json({
      sessionId,
      createdAt: Date.now(),
    } as SessionCreateResponse);
  } catch (error) {
    console.error('[API] Session creation error:', error);
    res.status(500).json({
      error: 'Failed to create session',
    });
  }
});

/**
 * DELETE /api/session/:sessionId
 * Delete session (right to be forgotten)
 */
router.delete('/session/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    sessionService.deleteSession(sessionId);

    res.json({
      success: true,
      message: 'Session deleted',
    });
  } catch (error) {
    console.error('[API] Session deletion error:', error);
    res.status(500).json({
      error: 'Failed to delete session',
    });
  }
});

export default router;
