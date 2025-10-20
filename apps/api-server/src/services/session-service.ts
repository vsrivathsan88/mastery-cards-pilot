/**
 * Session Service
 * Manages encrypted session data for privacy
 */

import { LessonData } from '@simili/shared';
// Import server-only components directly from source (not exported to browser bundle)
import { MultiAgentGraph } from '../../../../packages/agents/dist/graph/agent-graph.js';
import { generateAnonymousId } from '../middleware/privacy.js';

export interface SessionData {
  sessionId: string;
  createdAt: number;
  lastActivity: number;
  lesson?: LessonData;
  milestoneIndex: number;
  attempts: number;
  milestoneStartTime?: number;
  // Note: No PII stored - just session state
}

/**
 * In-memory session store (use Redis in production)
 */
class SessionService {
  private sessions: Map<string, SessionData> = new Map();
  private agentGraphs: Map<string, MultiAgentGraph> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup old sessions every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 3600000); // 1 hour
  }

  /**
   * Create new anonymous session
   */
  createSession(): string {
    const sessionId = generateAnonymousId();
    
    const sessionData: SessionData = {
      sessionId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      milestoneIndex: 0,
      attempts: 0,
    };

    this.sessions.set(sessionId, sessionData);
    
    console.log(`[SessionService] Created anonymous session: ${sessionId}`);
    return sessionId;
  }

  /**
   * Get session data
   */
  getSession(sessionId: string): SessionData | null {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }

    // Update last activity
    session.lastActivity = Date.now();
    return session;
  }

  /**
   * Update session data
   */
  updateSession(sessionId: string, updates: Partial<SessionData>): void {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    Object.assign(session, updates, { lastActivity: Date.now() });
  }

  /**
   * Get or create agent graph for session
   */
  getAgentGraph(sessionId: string, apiKey: string): MultiAgentGraph {
    let graph = this.agentGraphs.get(sessionId);
    
    if (!graph) {
      graph = new MultiAgentGraph(apiKey);
      this.agentGraphs.set(sessionId, graph);
      console.log(`[SessionService] Created agent graph for session: ${sessionId}`);
    }

    return graph;
  }

  /**
   * Delete session (right to be forgotten)
   */
  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.agentGraphs.delete(sessionId);
    console.log(`[SessionService] Deleted session: ${sessionId}`);
  }

  /**
   * Cleanup expired sessions (privacy - data retention)
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const maxAge = parseInt(process.env.SESSION_MAX_AGE_MS || '3600000');
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > maxAge) {
        this.deleteSession(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[SessionService] Cleaned up ${cleaned} expired sessions`);
    }
  }

  /**
   * Get session statistics (for monitoring, no PII)
   */
  getStats() {
    return {
      activeSessions: this.sessions.size,
      activeGraphs: this.agentGraphs.size,
    };
  }
}

// Singleton instance
export const sessionService = new SessionService();
