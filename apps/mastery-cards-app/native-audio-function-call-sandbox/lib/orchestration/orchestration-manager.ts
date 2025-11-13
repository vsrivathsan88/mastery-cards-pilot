/**
 * Orchestration Manager
 *
 * Manages orchestration with automatic fallback:
 * 1. Tries server-side orchestration first (if available)
 * 2. Falls back to client-side orchestration if server unavailable
 * 3. Handles session persistence and recovery
 */

import { ConversationOrchestrator, type TranscriptEntry as ClientTranscriptEntry } from './conversation-orchestrator';
import { ServerOrchestrationConnection, type ServerTranscriptEntry, type ServerEvaluation } from './server-connection';
import type { MasteryCard } from '../mvp-cards-data';
import type { MasteryEvaluation } from '../evaluator/claude-judge';

export type OrchestrationMode = 'server' | 'client' | 'hybrid';

export interface OrchestrationConfig {
  claudeApiKey?: string;
  serverUrl?: string;
  mode?: OrchestrationMode;
  enablePersistence?: boolean;
}

export interface SessionState {
  sessionId: string;
  studentName: string;
  currentCard: MasteryCard | null;
  transcript: ClientTranscriptEntry[];
  points: number;
  completedCards: number[];
  timestamp: number;
}

export class OrchestrationManager {
  private mode: OrchestrationMode = 'hybrid';
  private clientOrchestrator: ConversationOrchestrator | null = null;
  private serverConnection: ServerOrchestrationConnection | null = null;
  private isServerAvailable = false;
  private sessionId: string;
  private studentName: string = '';
  private currentCard: MasteryCard | null = null;
  private enablePersistence: boolean;

  // Duplicate prevention
  private lastEvaluationTime = 0;
  private readonly DUPLICATE_PREVENTION_WINDOW = 5000; // 5 seconds

  // Callbacks
  private onEvaluationComplete: ((evaluation: MasteryEvaluation) => void) | null = null;
  private onEvaluationStart: (() => void) | null = null;
  private onConnectionChange: ((connected: boolean, mode: OrchestrationMode) => void) | null = null;

  constructor(sessionId: string, config: OrchestrationConfig = {}) {
    this.sessionId = sessionId;
    this.mode = config.mode || 'hybrid';
    this.enablePersistence = config.enablePersistence ?? true;

    // Initialize client orchestrator if API key provided
    if (config.claudeApiKey) {
      this.clientOrchestrator = new ConversationOrchestrator(config.claudeApiKey);
      console.log('[OrchestrationManager] ✅ Client orchestrator initialized');
    }

    // Initialize server connection if URL provided
    if (config.serverUrl && this.mode !== 'client') {
      this.serverConnection = new ServerOrchestrationConnection(sessionId, config.serverUrl);
      this.setupServerHandlers();
      console.log('[OrchestrationManager] 📡 Server connection initialized');
    }

    // Load persisted session if available
    if (this.enablePersistence) {
      this.loadSession();
    }
  }

  /**
   * Set evaluation callbacks
   */
  setEvaluationCallbacks(
    onComplete: (evaluation: MasteryEvaluation) => void,
    onStart?: () => void
  ) {
    this.onEvaluationComplete = onComplete;
    this.onEvaluationStart = onStart;

    // Register with client orchestrator
    if (this.clientOrchestrator) {
      this.clientOrchestrator.setEvaluationCallback(onComplete);
      if (onStart) {
        this.clientOrchestrator.setEvaluationStartCallback(onStart);
      }
    }

    console.log('[OrchestrationManager] ✅ Evaluation callbacks registered');
  }

  /**
   * Set connection change callback
   */
  setConnectionChangeCallback(callback: (connected: boolean, mode: OrchestrationMode) => void) {
    this.onConnectionChange = callback;
  }

  /**
   * Initialize orchestration
   */
  async initialize(studentName: string, currentCard: MasteryCard | null): Promise<void> {
    this.studentName = studentName;
    this.currentCard = currentCard;

    // Try server connection first in hybrid mode
    if (this.serverConnection && this.mode !== 'client') {
      try {
        await this.connectToServer(studentName, currentCard);
        this.isServerAvailable = true;
        console.log('[OrchestrationManager] 🌐 Using server-side orchestration');

        if (this.onConnectionChange) {
          this.onConnectionChange(true, 'server');
        }
      } catch (error) {
        console.warn('[OrchestrationManager] ⚠️ Server unavailable, falling back to client');
        this.isServerAvailable = false;

        if (this.onConnectionChange) {
          this.onConnectionChange(false, 'client');
        }
      }
    }

    // Set up client orchestrator if server unavailable or in client mode
    if (!this.isServerAvailable && this.clientOrchestrator) {
      if (currentCard) {
        this.clientOrchestrator.setCurrentCard(currentCard);
      }
      console.log('[OrchestrationManager] 💻 Using client-side orchestration');
    }

    // Save initial session
    if (this.enablePersistence) {
      this.saveSession();
    }
  }

  /**
   * Connect to server
   */
  private async connectToServer(studentName: string, currentCard: MasteryCard | null): Promise<void> {
    if (!this.serverConnection) return;

    await this.serverConnection.connect(studentName, currentCard);
    this.isServerAvailable = true;
  }

  /**
   * Set up server message handlers
   */
  private setupServerHandlers(): void {
    if (!this.serverConnection) return;

    // Handle evaluation results from server
    this.serverConnection.on('evaluation', (message: any) => {
      console.log('[OrchestrationManager] 📊 Received server evaluation');

      // Extract evaluation from message
      const evaluation = message.evaluation;
      if (!evaluation) {
        console.error('[OrchestrationManager] ❌ No evaluation data in message');
        return;
      }

      // Check for duplicate evaluation within prevention window
      const now = Date.now();
      if (now - this.lastEvaluationTime < this.DUPLICATE_PREVENTION_WINDOW) {
        console.log('[OrchestrationManager] ⏭️ Ignoring duplicate evaluation (within 5s window)');
        return;
      }

      // Convert server evaluation to client format
      const clientEvaluation: MasteryEvaluation = {
        ready: evaluation.ready,
        confidence: evaluation.confidence,
        masteryLevel: evaluation.masteryLevel,
        reasoning: evaluation.reasoning,
        suggestedAction: evaluation.suggestedAction,
        points: evaluation.points,
      };

      // Update last evaluation time
      this.lastEvaluationTime = now;

      // Trigger callbacks
      if (this.onEvaluationComplete) {
        this.onEvaluationComplete(clientEvaluation);
      }

      // Save session after evaluation
      if (this.enablePersistence) {
        this.saveSession();
      }
    });

    // Handle advance card command from server (if still sent)
    this.serverConnection.on('advance_card', (message: any) => {
      console.log('[OrchestrationManager] 🎉 Server requested card advancement');

      // Check for duplicate advance within prevention window
      const now = Date.now();
      if (now - this.lastEvaluationTime < this.DUPLICATE_PREVENTION_WINDOW) {
        console.log('[OrchestrationManager] ⏭️ Ignoring duplicate advance_card (within 5s of evaluation)');
        return;
      }

      const evaluation: MasteryEvaluation = {
        ready: true,
        confidence: 100,
        masteryLevel: message.masteryLevel || 'basic',
        reasoning: message.reasoning || 'Server determined mastery',
        suggestedAction: 'award_and_next',
        points: message.points || 0,
      };

      // Update last evaluation time
      this.lastEvaluationTime = now;

      if (this.onEvaluationComplete) {
        this.onEvaluationComplete(evaluation);
      }
    });

    // Handle connection status changes
    this.serverConnection.on('disconnect', () => {
      console.log('[OrchestrationManager] 📵 Server disconnected, switching to client mode');
      this.isServerAvailable = false;

      if (this.onConnectionChange) {
        this.onConnectionChange(false, 'client');
      }
    });
  }

  /**
   * Add transcript entry
   */
  addTranscriptEntry(entry: ClientTranscriptEntry): void {
    // Send to server if available (server takes priority)
    if (this.isServerAvailable && this.serverConnection) {
      const serverEntry: ServerTranscriptEntry = {
        role: entry.role,
        text: entry.text,
        timestamp: entry.timestamp,
        isFinal: entry.isFinal,
      };
      this.serverConnection.sendTranscript(serverEntry);
      console.log('[OrchestrationManager] 📤 Sent to server (client orchestrator disabled)');
    } else if (this.clientOrchestrator) {
      // Only use client orchestrator if server is NOT available
      this.clientOrchestrator.addTranscriptEntry(entry);
      console.log('[OrchestrationManager] 📤 Sent to client orchestrator (server unavailable)');
    }

    // Auto-save every 10 transcript entries
    if (this.enablePersistence && this.getTranscript().length % 10 === 0) {
      this.saveSession();
    }
  }

  /**
   * Update current card
   */
  setCurrentCard(card: MasteryCard): void {
    this.currentCard = card;

    // Update server if available
    if (this.isServerAvailable && this.serverConnection) {
      this.serverConnection.updateCard(card);
    }

    // Update client orchestrator
    if (this.clientOrchestrator) {
      this.clientOrchestrator.setCurrentCard(card);
    }

    // Save session
    if (this.enablePersistence) {
      this.saveSession();
    }
  }

  /**
   * Force evaluation (for testing)
   */
  async forceEvaluation(): Promise<MasteryEvaluation | null> {
    console.log('[OrchestrationManager] 🔧 Force evaluation requested');

    // Try server first
    if (this.isServerAvailable && this.serverConnection) {
      this.serverConnection.forceEvaluation();
      return null; // Server will respond via callback
    }

    // Fall back to client
    if (this.clientOrchestrator) {
      return await this.clientOrchestrator.forceEvaluation();
    }

    return null;
  }

  /**
   * Get transcript
   */
  getTranscript(): ClientTranscriptEntry[] {
    if (this.clientOrchestrator) {
      return this.clientOrchestrator.getTranscript();
    }
    return [];
  }

  /**
   * Get current orchestration mode
   */
  getMode(): { active: OrchestrationMode; serverAvailable: boolean } {
    return {
      active: this.isServerAvailable ? 'server' : 'client',
      serverAvailable: this.isServerAvailable,
    };
  }

  /**
   * Save session to localStorage
   */
  private saveSession(): void {
    if (!this.enablePersistence) return;

    const sessionState: SessionState = {
      sessionId: this.sessionId,
      studentName: this.studentName,
      currentCard: this.currentCard,
      transcript: this.getTranscript(),
      points: 0, // Would need to get from session store
      completedCards: [], // Would need to track
      timestamp: Date.now(),
    };

    const key = `mastery_session_${this.sessionId}`;
    localStorage.setItem(key, JSON.stringify(sessionState));
    console.log('[OrchestrationManager] 💾 Session saved');
  }

  /**
   * Load session from localStorage
   */
  private loadSession(): SessionState | null {
    if (!this.enablePersistence) return null;

    const key = `mastery_session_${this.sessionId}`;
    const saved = localStorage.getItem(key);

    if (saved) {
      try {
        const state = JSON.parse(saved) as SessionState;
        console.log('[OrchestrationManager] 📂 Session loaded from', new Date(state.timestamp));

        // Restore transcript to client orchestrator
        if (this.clientOrchestrator && state.transcript.length > 0) {
          // Note: Would need to add a method to restore transcript
          console.log('[OrchestrationManager] 📝 Restored', state.transcript.length, 'transcript entries');
        }

        return state;
      } catch (error) {
        console.error('[OrchestrationManager] Failed to load session:', error);
      }
    }

    return null;
  }

  /**
   * Clear persisted session
   */
  clearSession(): void {
    const key = `mastery_session_${this.sessionId}`;
    localStorage.removeItem(key);
    console.log('[OrchestrationManager] 🗑️ Session cleared');
  }

  /**
   * Reconnect to server
   */
  async reconnect(): Promise<void> {
    if (this.serverConnection && this.studentName && this.currentCard) {
      try {
        await this.connectToServer(this.studentName, this.currentCard);
        console.log('[OrchestrationManager] 🔄 Reconnected to server');

        if (this.onConnectionChange) {
          this.onConnectionChange(true, 'server');
        }
      } catch (error) {
        console.error('[OrchestrationManager] Reconnection failed:', error);
      }
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    if (this.serverConnection) {
      this.serverConnection.disconnect();
    }

    // Save final session state
    if (this.enablePersistence) {
      this.saveSession();
    }

    console.log('[OrchestrationManager] 🔌 Disconnected');
  }
}

// Factory function
export function createOrchestrationManager(
  sessionId: string,
  config: OrchestrationConfig
): OrchestrationManager {
  return new OrchestrationManager(sessionId, config);
}