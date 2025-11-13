/**
 * Conversation Orchestrator
 *
 * Client-side orchestration that observes the conversation and decides when to:
 * - Request evaluation from Claude
 * - Advance to next card
 * - Inject contextual messages
 *
 * This replaces function calling with observation-based orchestration
 */

import type { MasteryCard } from '../mvp-cards-data';
import { evaluateMastery, type ConversationTurn, type MasteryEvaluation } from '../evaluator/claude-judge';

export interface TranscriptEntry {
  role: 'pi' | 'student' | 'system';
  text: string;
  timestamp: number;
  isFinal: boolean;
}

export class ConversationOrchestrator {
  private transcript: TranscriptEntry[] = [];
  private evaluationInProgress = false;
  private lastEvaluationTime = 0;
  private MIN_TIME_BETWEEN_EVALS = 10000; // 10 seconds minimum
  private MIN_TURNS_FOR_EVAL = 4; // At least 4 exchanges before evaluating
  private currentCard: MasteryCard | null = null;
  private claudeApiKey: string;
  private onEvaluationComplete: ((evaluation: MasteryEvaluation) => void) | null = null;
  private onEvaluationStart: (() => void) | null = null;

  constructor(claudeApiKey: string) {
    this.claudeApiKey = claudeApiKey;
  }

  /**
   * Set the evaluation callback
   */
  setEvaluationCallback(callback: (evaluation: MasteryEvaluation) => void) {
    this.onEvaluationComplete = callback;
    console.log('[Orchestrator] ✅ Evaluation callback registered');
  }

  /**
   * Set the evaluation start callback
   */
  setEvaluationStartCallback(callback: () => void) {
    this.onEvaluationStart = callback;
    console.log('[Orchestrator] ✅ Evaluation start callback registered');
  }

  /**
   * Set the current card context
   */
  setCurrentCard(card: MasteryCard) {
    this.currentCard = card;
    this.transcript = []; // Clear transcript for new card
    this.lastEvaluationTime = 0;
    console.log('[Orchestrator] 📋 New card set:', card.title);
  }

  /**
   * Add a turn to the transcript
   */
  addTranscriptEntry(entry: TranscriptEntry) {
    this.transcript.push(entry);
    console.log(`[Orchestrator] ${entry.role === 'pi' ? '🛸' : '👤'} ${entry.role}:`,
                entry.text.substring(0, 50) + '...');

    // Check if we should evaluate after student turns
    if (entry.role === 'student' && entry.isFinal) {
      this.checkForEvaluation();
    }
  }

  /**
   * Intelligently decide if it's time to evaluate
   */
  private async checkForEvaluation() {
    // Don't evaluate without a card
    if (!this.currentCard) {
      console.log('[Orchestrator] ⏸️  No card set, skipping evaluation');
      return;
    }

    // Don't evaluate too frequently
    const now = Date.now();
    if (now - this.lastEvaluationTime < this.MIN_TIME_BETWEEN_EVALS) {
      console.log('[Orchestrator] ⏱️  Too soon since last evaluation');
      return;
    }

    // Don't evaluate if already in progress
    if (this.evaluationInProgress) {
      console.log('[Orchestrator] ⏳ Evaluation already in progress');
      return;
    }

    // Need minimum exchanges
    const studentTurns = this.transcript.filter(t => t.role === 'student').length;
    const piTurns = this.transcript.filter(t => t.role === 'pi').length;

    if (studentTurns < 2 || piTurns < 2) {
      console.log('[Orchestrator] 💬 Not enough conversation yet');
      return;
    }

    // Look for evaluation triggers
    const shouldEvaluate = this.detectEvaluationTriggers();

    if (shouldEvaluate) {
      await this.requestEvaluation();
    }
  }

  /**
   * Smart heuristics for when to evaluate
   */
  private detectEvaluationTriggers(): boolean {
    const recentTranscript = this.transcript.slice(-6); // Last 6 turns

    // Check for explanation patterns
    const hasExplanation = recentTranscript.some(t =>
      t.role === 'student' && (
        t.text.toLowerCase().includes('because') ||
        t.text.toLowerCase().includes('i think') ||
        t.text.toLowerCase().includes('it looks like') ||
        t.text.toLowerCase().includes('that means') ||
        t.text.length > 50 // Longer responses often indicate explanation
      )
    );

    // Check for confidence indicators
    const hasConfidence = recentTranscript.some(t =>
      t.role === 'student' && (
        t.text.toLowerCase().includes('yes') ||
        t.text.toLowerCase().includes('exactly') ||
        t.text.toLowerCase().includes('i get it') ||
        t.text.toLowerCase().includes('oh!')
      )
    );

    // Check if conversation seems complete
    const conversationLength = this.transcript.length;
    const isLongConversation = conversationLength >= 8;

    console.log('[Orchestrator] 🔍 Evaluation triggers:', {
      hasExplanation,
      hasConfidence,
      isLongConversation,
      transcriptLength: conversationLength
    });

    return hasExplanation || (hasConfidence && conversationLength >= 6) || isLongConversation;
  }

  /**
   * Request evaluation from Claude
   */
  private async requestEvaluation(): Promise<MasteryEvaluation | null> {
    if (!this.currentCard) return null;

    this.evaluationInProgress = true;
    this.lastEvaluationTime = Date.now();

    console.log('[Orchestrator] 🧠 Requesting Claude evaluation...');
    console.log('[Orchestrator] 📊 Transcript length:', this.transcript.length);

    // Notify that evaluation is starting
    if (this.onEvaluationStart) {
      console.log('[Orchestrator] 📢 Notifying App that evaluation is starting');
      this.onEvaluationStart();
    }

    try {
      // Convert to Claude format
      const claudeTurns: ConversationTurn[] = this.transcript
        .filter(t => t.isFinal) // Only final turns
        .map(t => ({
          role: t.role,
          text: t.text,
          timestamp: t.timestamp
        }));

      // Count exchanges (pi + student pairs)
      const exchangeCount = Math.floor(claudeTurns.filter(t => t.role === 'student').length);

      // Call Claude judge with correct parameters
      const evaluation = await evaluateMastery(
        this.currentCard,
        claudeTurns,
        exchangeCount,
        this.claudeApiKey
      );

      console.log('[Orchestrator] ✅ Evaluation complete:', {
        ready: evaluation.ready,
        confidence: evaluation.confidence,
        masteryLevel: evaluation.masteryLevel,
        suggestedAction: evaluation.suggestedAction
      });

      // Handle the evaluation result
      await this.handleEvaluationResult(evaluation);

      return evaluation;
    } catch (error) {
      console.error('[Orchestrator] ❌ Evaluation failed:', error);
      return null;
    } finally {
      this.evaluationInProgress = false;
    }
  }

  /**
   * Handle evaluation results
   */
  private async handleEvaluationResult(evaluation: MasteryEvaluation) {
    // Log the decision
    if (evaluation.suggestedAction === 'award_and_next') {
      console.log('[Orchestrator] 🎉 Ready to advance to next card!');
      console.log('[Orchestrator] 🏆 Points to award:', evaluation.points);
      console.log('[Orchestrator] 📈 Mastery level:', evaluation.masteryLevel);
    } else if (evaluation.suggestedAction === 'next_without_points') {
      console.log('[Orchestrator] ➡️ Moving to next card without points');
    } else {
      console.log('[Orchestrator] 💭 Continue conversation...');
      console.log('[Orchestrator] 📊 Current confidence:', evaluation.confidence + '%');
    }

    // IMPORTANT: Call the callback so the App can handle the evaluation
    if (this.onEvaluationComplete) {
      console.log('[Orchestrator] 📢 Notifying App of evaluation result');
      this.onEvaluationComplete(evaluation);
    } else {
      console.warn('[Orchestrator] ⚠️  No evaluation callback registered!');
    }
  }

  /**
   * Get current transcript for debugging
   */
  getTranscript(): TranscriptEntry[] {
    return [...this.transcript];
  }

  /**
   * Clear orchestrator state
   */
  reset() {
    this.transcript = [];
    this.evaluationInProgress = false;
    this.lastEvaluationTime = 0;
    this.currentCard = null;
    console.log('[Orchestrator] 🔄 Reset complete');
  }

  /**
   * Force an evaluation (for testing)
   */
  async forceEvaluation(): Promise<MasteryEvaluation | null> {
    if (!this.currentCard) {
      console.log('[Orchestrator] Cannot force evaluation without a card');
      return null;
    }

    this.lastEvaluationTime = 0; // Reset timer
    this.evaluationInProgress = false; // Reset lock
    return this.requestEvaluation();
  }
}

// Singleton instance
let orchestratorInstance: ConversationOrchestrator | null = null;

export function getOrchestrator(claudeApiKey?: string): ConversationOrchestrator {
  if (!orchestratorInstance && claudeApiKey) {
    orchestratorInstance = new ConversationOrchestrator(claudeApiKey);
  }
  if (!orchestratorInstance) {
    throw new Error('Orchestrator not initialized. Provide Claude API key.');
  }
  return orchestratorInstance;
}