/**
 * Analysis API Route
 * Handles multi-agent analysis requests
 */

import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { sessionService } from '../services/session-service.js';
import { LessonLoader } from '@simili/lessons';
import type { AnalyzeRequest, AnalyzeResponse } from '../types/api.js';

const router: ExpressRouter = Router();

/**
 * POST /api/analyze
 * Analyze student transcription with multi-agent system
 */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { sessionId, transcription, isFinal, lessonContext }: AnalyzeRequest = req.body;

    // Validate request
    if (!sessionId || !transcription) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId, transcription',
      } as AnalyzeResponse);
    }

    // Get session
    const session = sessionService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or expired',
      } as AnalyzeResponse);
    }

    // Update session context if provided
    if (lessonContext) {
      const lesson = LessonLoader.getLesson(lessonContext.lessonId);
      if (lesson) {
        sessionService.updateSession(sessionId, {
          lesson,
          milestoneIndex: lessonContext.milestoneIndex,
          attempts: lessonContext.attempts,
          milestoneStartTime: Date.now() - lessonContext.timeOnMilestone,
        });
      }
    }

    // Only analyze final transcriptions
    if (!isFinal) {
      return res.json({
        success: true,
        sessionId,
      } as AnalyzeResponse);
    }

    // Get agent graph (with API key from env - never from client)
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      console.error('[API] Missing GOOGLE_GENERATIVE_AI_API_KEY');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error',
      } as AnalyzeResponse);
    }

    const graph = sessionService.getAgentGraph(sessionId, apiKey);

    // Run multi-agent analysis
    const result = await graph.run({
      transcription,
      isFinal: true,
      turnNumber: session.attempts,
      lesson: session.lesson,
      currentMilestone: session.lesson?.milestones[session.milestoneIndex],
      milestoneIndex: session.milestoneIndex,
      attempts: session.attempts,
      timeOnMilestone: session.milestoneStartTime 
        ? Date.now() - session.milestoneStartTime 
        : 0,
      sessionId,
    });

    // Return analysis (no PII included)
    return res.json({
      success: true,
      sessionId,
      misconception: result.misconception || undefined,
      emotional: result.emotional || undefined,
      contextForMainAgent: result.contextForMainAgent,
    } as AnalyzeResponse);

  } catch (error) {
    console.error('[API] Analysis error:', error);
    return res.status(500).json({
      success: false,
      error: 'Analysis failed',
    } as AnalyzeResponse);
  }
});

export default router;
