/**
 * Mastery Cards Orchestration Server
 *
 * Server-side orchestration that observes Gemini conversations,
 * manages evaluation timing, and coordinates with Claude judge.
 */

import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { SessionManager } from './services/session-manager';
import { OrchestrationService } from './services/orchestration-service';
import { ClaudeEvaluator } from './services/claude-evaluator';
import { GeminiProxy } from './services/gemini-proxy';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = createServer(app);

// Initialize services
const sessionManager = new SessionManager();
const claudeEvaluator = new ClaudeEvaluator(process.env.CLAUDE_API_KEY || '');
const orchestrationService = new OrchestrationService(sessionManager, claudeEvaluator);
const geminiProxy = new GeminiProxy();

// WebSocket server for real-time orchestration
const wss = new WebSocketServer({ server, path: '/orchestrate' });

wss.on('connection', (ws: WebSocket, req) => {
  const sessionId = req.url?.split('?sessionId=')[1] || '';

  console.log(`[Server] New orchestration connection for session: ${sessionId}`);

  // Create or get session
  const session = sessionManager.getOrCreateSession(sessionId);
  session.ws = ws;

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'init':
          // Initialize session with student info
          session.studentName = message.studentName;
          session.currentCard = message.currentCard;
          console.log(`[Server] Session ${sessionId} initialized for ${message.studentName}`);
          break;

        case 'transcript':
          // Add transcript entry
          await orchestrationService.handleTranscript(sessionId, message.entry);
          break;

        case 'card_change':
          // Update current card
          session.currentCard = message.card;
          session.transcript = []; // Reset transcript for new card
          console.log(`[Server] Card changed for session ${sessionId}: ${message.card.title}`);
          break;

        case 'force_evaluation':
          // Manual evaluation trigger
          const evaluation = await orchestrationService.forceEvaluation(sessionId);
          ws.send(JSON.stringify({
            type: 'evaluation',
            evaluation
          }));
          break;

        default:
          console.warn(`[Server] Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('[Server] WebSocket message error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Failed to process message'
      }));
    }
  });

  ws.on('close', () => {
    console.log(`[Server] Session ${sessionId} disconnected`);
    session.ws = null;
  });

  ws.on('error', (error) => {
    console.error(`[Server] WebSocket error for session ${sessionId}:`, error);
  });
});

// REST API Endpoints

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    sessions: sessionManager.getActiveSessions().length
  });
});

// Get session info
app.get('/session/:sessionId', (req, res) => {
  const session = sessionManager.getSession(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({
    sessionId: session.sessionId,
    studentName: session.studentName,
    currentCard: session.currentCard?.title,
    transcriptLength: session.transcript.length,
    evaluationCount: session.evaluationCount,
    totalPoints: session.totalPoints
  });
});

// Inject message to Gemini (for server-controlled messages)
app.post('/inject-message', async (req, res) => {
  const { sessionId, message } = req.body;

  try {
    // Send to Gemini through proxy
    await geminiProxy.injectMessage(sessionId, message);

    // Also send to client via WebSocket
    const session = sessionManager.getSession(sessionId);
    if (session?.ws) {
      session.ws.send(JSON.stringify({
        type: 'inject_message',
        message
      }));
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Server] Message injection error:', error);
    res.status(500).json({ error: 'Failed to inject message' });
  }
});

// Get transcript
app.get('/transcript/:sessionId', (req, res) => {
  const session = sessionManager.getSession(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({
    sessionId: session.sessionId,
    transcript: session.transcript
  });
});

// Manual evaluation trigger (for testing)
app.post('/evaluate/:sessionId', async (req, res) => {
  try {
    const evaluation = await orchestrationService.forceEvaluation(req.params.sessionId);
    res.json(evaluation);
  } catch (error) {
    console.error('[Server] Evaluation error:', error);
    res.status(500).json({ error: 'Evaluation failed' });
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`
🚀 Mastery Cards Orchestration Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server running on http://localhost:${PORT}
🔌 WebSocket endpoint: ws://localhost:${PORT}/orchestrate
📊 Health check: http://localhost:${PORT}/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});