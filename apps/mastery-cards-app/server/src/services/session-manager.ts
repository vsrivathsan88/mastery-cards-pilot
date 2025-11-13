/**
 * Session Manager
 *
 * Manages session state and transcript storage for each student
 */

import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';

export interface TranscriptEntry {
  role: 'pi' | 'student' | 'system';
  text: string;
  timestamp: number;
  isFinal: boolean;
}

export interface MasteryCard {
  cardId: string;
  title: string;
  cardNumber: number;
  learningGoal: string;
  imageDescription: string;
  milestones: {
    basic: {
      description: string;
      points: number;
      evidenceKeywords?: string[];
    };
    advanced?: {
      description: string;
      points: number;
      evidenceKeywords?: string[];
    };
  };
  misconception?: {
    piWrongThinking: string;
    correctConcept: string;
    teachingMilestone: {
      description: string;
      points: number;
    };
  };
  piStartingQuestion: string;
}

export interface Session {
  sessionId: string;
  studentName: string;
  currentCard: MasteryCard | null;
  transcript: TranscriptEntry[];
  evaluationCount: number;
  lastEvaluationTime: number;
  totalPoints: number;
  ws: WebSocket | null;
  createdAt: Date;
  updatedAt: Date;
}

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  constructor() {
    // Clean up old sessions periodically
    setInterval(() => this.cleanupSessions(), 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Get or create a session
   */
  getOrCreateSession(sessionId?: string): Session {
    const id = sessionId || uuidv4();

    if (!this.sessions.has(id)) {
      const session: Session = {
        sessionId: id,
        studentName: '',
        currentCard: null,
        transcript: [],
        evaluationCount: 0,
        lastEvaluationTime: 0,
        totalPoints: 0,
        ws: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.sessions.set(id, session);
      console.log(`[SessionManager] Created new session: ${id}`);
    }

    return this.sessions.get(id)!;
  }

  /**
   * Get a session by ID
   */
  getSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.updatedAt = new Date();
    }
    return session || null;
  }

  /**
   * Add transcript entry to session
   */
  addTranscriptEntry(sessionId: string, entry: TranscriptEntry): boolean {
    const session = this.getSession(sessionId);
    if (!session) {
      console.error(`[SessionManager] Session not found: ${sessionId}`);
      return false;
    }

    session.transcript.push(entry);
    session.updatedAt = new Date();

    console.log(`[SessionManager] Added ${entry.role} entry to session ${sessionId}: ${entry.text.substring(0, 50)}...`);
    return true;
  }

  /**
   * Get transcript for evaluation
   */
  getTranscriptForEvaluation(sessionId: string): TranscriptEntry[] {
    const session = this.getSession(sessionId);
    if (!session) return [];

    // Only return final transcript entries for evaluation
    return session.transcript.filter(t => t.isFinal);
  }

  /**
   * Update evaluation info
   */
  updateEvaluation(sessionId: string, points: number): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    session.evaluationCount++;
    session.lastEvaluationTime = Date.now();
    session.totalPoints += points;
    session.updatedAt = new Date();
  }

  /**
   * Clear transcript for new card
   */
  clearTranscript(sessionId: string): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    session.transcript = [];
    session.updatedAt = new Date();
    console.log(`[SessionManager] Cleared transcript for session ${sessionId}`);
  }

  /**
   * Get active sessions
   */
  getActiveSessions(): Session[] {
    return Array.from(this.sessions.values()).filter(s => s.ws !== null);
  }

  /**
   * Clean up old sessions
   */
  private cleanupSessions(): void {
    const now = Date.now();
    const sessionsToDelete: string[] = [];

    this.sessions.forEach((session, id) => {
      const age = now - session.updatedAt.getTime();
      if (age > this.SESSION_TIMEOUT && !session.ws) {
        sessionsToDelete.push(id);
      }
    });

    sessionsToDelete.forEach(id => {
      this.sessions.delete(id);
      console.log(`[SessionManager] Cleaned up old session: ${id}`);
    });

    if (sessionsToDelete.length > 0) {
      console.log(`[SessionManager] Cleaned up ${sessionsToDelete.length} old sessions`);
    }
  }

  /**
   * Get session stats
   */
  getStats(): any {
    return {
      totalSessions: this.sessions.size,
      activeSessions: this.getActiveSessions().length,
      totalTranscriptEntries: Array.from(this.sessions.values())
        .reduce((sum, s) => sum + s.transcript.length, 0)
    };
  }
}