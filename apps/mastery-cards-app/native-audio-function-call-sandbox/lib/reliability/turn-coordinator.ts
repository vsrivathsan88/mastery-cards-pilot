/**
 * Turn Coordinator - Atomic turn-based state management
 * Prevents race conditions by validating all operations against current turn
 */

export interface Turn {
  id: string;                    // UUID for this specific turn
  cardId: number;                // Which card this turn belongs to
  startTime: number;
  userTranscript: string;
  aiTranscript: string;
  evaluation?: any;
  status: 'active' | 'evaluating' | 'complete' | 'stale' | 'interrupted';
}

export class TurnCoordinator {
  private currentTurn: Turn | null = null;
  private pendingTurns = new Map<string, Turn>(); // Support concurrent/overlapping turns
  private turnHistory: Turn[] = [];
  private readonly maxHistorySize = 50; // Reduced from 100 to prevent memory leak
  private readonly EVALUATION_TIMEOUT = 15000; // 15 seconds max for evaluation
  private evaluationTimeouts = new Map<string, NodeJS.Timeout>();

  /**
   * Start a new turn for a specific card
   */
  startTurn(cardId: number): string {
    const turnId = this.generateId();
    
    // Archive previous turn
    if (this.currentTurn) {
      this.currentTurn.status = 'complete';
      this.turnHistory.push(this.currentTurn);
      
      // Remove from pending if it was there
      this.pendingTurns.delete(this.currentTurn.id);
      
      // Prune old history to prevent memory leak
      this.pruneHistory();
    }
    
    this.currentTurn = {
      id: turnId,
      cardId,
      startTime: Date.now(),
      status: 'active',
      userTranscript: '',
      aiTranscript: ''
    };
    
    console.log(`[TurnCoordinator] 🆕 New turn: ${turnId} for Card #${cardId}`);
    return turnId;
  }

  /**
   * CRITICAL: Validate if this turn is still current and active
   * Supports overlapping turns (interruptions)
   */
  isCurrentTurn(turnId: string): boolean {
    // Check current turn
    if (this.currentTurn?.id === turnId) {
      return this.currentTurn.status === 'active' || this.currentTurn.status === 'evaluating';
    }
    
    // Check pending turns (for interruption scenarios)
    const pendingTurn = this.pendingTurns.get(turnId);
    if (pendingTurn) {
      return pendingTurn.status === 'active' || pendingTurn.status === 'evaluating';
    }
    
    return false;
  }
  
  /**
   * Mark turn as interrupted (user interrupted AI response)
   */
  interruptTurn(turnId: string): void {
    if (this.currentTurn?.id === turnId) {
      console.log(`[TurnCoordinator] ⚠️ Turn ${turnId} interrupted`);
      this.currentTurn.status = 'interrupted';
      
      // Move to pending turns for potential recovery
      this.pendingTurns.set(turnId, this.currentTurn);
    }
  }

  /**
   * Check if turn belongs to specific card
   */
  isCurrentCard(cardId: number): boolean {
    return this.currentTurn?.cardId === cardId;
  }

  /**
   * Get current turn ID
   */
  getCurrentTurnId(): string | null {
    return this.currentTurn?.id || null;
  }

  /**
   * Get current card ID
   */
  getCurrentCardId(): number | null {
    return this.currentTurn?.cardId || null;
  }

  /**
   * Mark turn as stale (used when card changes)
   */
  invalidateTurn(turnId: string): void {
    if (this.currentTurn?.id === turnId) {
      console.log(`[TurnCoordinator] ❌ Invalidating turn: ${turnId}`);
      this.currentTurn.status = 'stale';
    }
  }

  /**
   * Invalidate all turns for a specific card (used when leaving card)
   */
  invalidateCard(cardId: number): void {
    if (this.currentTurn?.cardId === cardId) {
      console.log(`[TurnCoordinator] ❌ Invalidating all turns for Card #${cardId}`);
      this.currentTurn.status = 'stale';
    }
  }

  /**
   * Update user transcript for current turn
   */
  setUserTranscript(turnId: string, text: string): boolean {
    if (!this.isCurrentTurn(turnId)) {
      console.warn(`[TurnCoordinator] ⚠️ Cannot update transcript - stale turn: ${turnId}`);
      return false;
    }
    
    if (this.currentTurn) {
      this.currentTurn.userTranscript = text;
      return true;
    }
    return false;
  }

  /**
   * Update AI transcript for current turn
   */
  setAiTranscript(turnId: string, text: string): boolean {
    if (!this.isCurrentTurn(turnId)) {
      console.warn(`[TurnCoordinator] ⚠️ Cannot update transcript - stale turn: ${turnId}`);
      return false;
    }
    
    if (this.currentTurn) {
      this.currentTurn.aiTranscript = text;
      return true;
    }
    return false;
  }

  /**
   * Mark turn as evaluating
   */
  startEvaluation(turnId: string): boolean {
    if (!this.isCurrentTurn(turnId)) {
      console.warn(`[TurnCoordinator] ⚠️ Cannot start evaluation - stale turn: ${turnId}`);
      return false;
    }
    
    if (this.currentTurn) {
      this.currentTurn.status = 'evaluating';
      
      // Set timeout to prevent stuck evaluation
      const timeoutId = setTimeout(() => {
        if (this.currentTurn?.id === turnId && this.currentTurn.status === 'evaluating') {
          console.error(`[TurnCoordinator] ⏰ Evaluation timeout for ${turnId} - forcing back to active`);
          this.currentTurn.status = 'active';
          this.evaluationTimeouts.delete(turnId);
        }
      }, this.EVALUATION_TIMEOUT);
      
      this.evaluationTimeouts.set(turnId, timeoutId);
      
      return true;
    }
    return false;
  }

  /**
   * Store evaluation result
   */
  setEvaluation(turnId: string, evaluation: any): boolean {
    if (!this.isCurrentTurn(turnId) && this.currentTurn?.id !== turnId) {
      console.warn(`[TurnCoordinator] ⚠️ Cannot set evaluation - wrong turn: ${turnId}`);
      return false;
    }
    
    if (this.currentTurn?.id === turnId) {
      this.currentTurn.evaluation = evaluation;
      this.currentTurn.status = 'active'; // Back to active after evaluation
      
      // Clear timeout since evaluation completed
      const timeoutId = this.evaluationTimeouts.get(turnId);
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.evaluationTimeouts.delete(turnId);
      }
      
      return true;
    }
    return false;
  }

  /**
   * Get current turn data (for debugging)
   */
  getCurrentTurn(): Turn | null {
    return this.currentTurn;
  }

  /**
   * Get turn history
   */
  getHistory(): Turn[] {
    return [...this.turnHistory];
  }

  /**
   * Reset coordinator (used when session ends)
   */
  reset(): void {
    console.log('[TurnCoordinator] 🔄 Resetting coordinator');
    this.cleanupTimeouts();
    this.currentTurn = null;
    this.turnHistory = [];
  }

  /**
   * Generate unique turn ID using crypto for collision resistance
   */
  private generateId(): string {
    // Use crypto.randomUUID() if available (modern browsers)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `turn_${crypto.randomUUID()}`;
    }
    
    // Fallback: Use crypto.getRandomValues for better randomness
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint32Array(3);
      crypto.getRandomValues(array);
      return `turn_${Date.now()}_${Array.from(array, num => num.toString(36)).join('')}`;
    }
    
    // Last resort fallback (less secure but won't crash)
    return `turn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Cleanup all timeouts
   */
  private cleanupTimeouts(): void {
    for (const timeoutId of this.evaluationTimeouts.values()) {
      clearTimeout(timeoutId);
    }
    this.evaluationTimeouts.clear();
  }
  
  /**
   * Prune old history to prevent memory leak
   */
  private pruneHistory(): void {
    if (this.turnHistory.length > this.maxHistorySize) {
      const toRemove = this.turnHistory.length - this.maxHistorySize;
      this.turnHistory.splice(0, toRemove);
      console.log(`[TurnCoordinator] 🧹 Pruned ${toRemove} old turns from history`);
    }
    
    // Also prune pending turns older than 30 seconds
    const now = Date.now();
    for (const [turnId, turn] of this.pendingTurns.entries()) {
      if (now - turn.startTime > 30000) {
        console.log(`[TurnCoordinator] 🧹 Removing stale pending turn: ${turnId}`);
        this.pendingTurns.delete(turnId);
      }
    }
  }
}
