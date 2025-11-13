/**
 * Orchestration Service
 *
 * Core orchestration logic - decides when to evaluate and coordinates actions
 */

import { SessionManager, TranscriptEntry, Session } from './session-manager';
import { ClaudeEvaluator, MasteryEvaluation } from './claude-evaluator';

export class OrchestrationService {
  private MIN_EXCHANGES_FOR_EVAL = 2; // Minimum Pi-Student exchanges (reduced for faster evaluation)
  private MIN_TIME_BETWEEN_EVALS = 8000; // 8 seconds (reduced from 15 for more responsive evaluation)
  private evaluationQueue: Set<string> = new Set();

  constructor(
    private sessionManager: SessionManager,
    private claudeEvaluator: ClaudeEvaluator
  ) {}

  /**
   * Handle incoming transcript entry
   */
  async handleTranscript(sessionId: string, entry: TranscriptEntry): Promise<void> {
    // Add to session transcript
    if (!this.sessionManager.addTranscriptEntry(sessionId, entry)) {
      return;
    }

    // Only check for evaluation on final student turns
    if (entry.role === 'student' && entry.isFinal) {
      await this.checkForEvaluation(sessionId);
    }
  }

  /**
   * Smart evaluation decision logic
   */
  private async checkForEvaluation(sessionId: string): Promise<void> {
    const session = this.sessionManager.getSession(sessionId);
    if (!session || !session.currentCard) {
      console.log(`[Orchestration] Skipping evaluation - no session or card`);
      return;
    }

    // Check if already evaluating
    if (this.evaluationQueue.has(sessionId)) {
      console.log(`[Orchestration] Already evaluating session ${sessionId}`);
      return;
    }

    // Check time since last evaluation
    const timeSinceLastEval = Date.now() - session.lastEvaluationTime;
    if (timeSinceLastEval < this.MIN_TIME_BETWEEN_EVALS) {
      console.log(`[Orchestration] Too soon since last evaluation (${timeSinceLastEval}ms)`);
      return;
    }

    // Check if enough exchanges
    const transcript = session.transcript.filter(t => t.isFinal);
    const studentTurns = transcript.filter(t => t.role === 'student').length;
    const piTurns = transcript.filter(t => t.role === 'pi').length;

    if (studentTurns < 2 || piTurns < 2) {
      console.log(`[Orchestration] Not enough exchanges (${studentTurns} student, ${piTurns} pi)`);
      return;
    }

    // Check for evaluation triggers
    if (this.shouldEvaluate(session)) {
      await this.performEvaluation(sessionId);
    }
  }

  /**
   * Determine if we should evaluate based on conversation patterns
   * SIMPLIFIED: Evaluate more frequently to check understanding as soon as student explains
   */
  private shouldEvaluate(session: Session): boolean {
    const finalTranscript = session.transcript.filter(t => t.isFinal);
    const studentTurns = finalTranscript.filter(t => t.role === 'student');
    const totalExchanges = studentTurns.length;

    // Check if student has provided any substantive responses (> 15 chars, not just noise)
    const hasSubstantiveResponse = studentTurns.some(t =>
      t.text.trim().length > 15 &&
      !t.text.toLowerCase().includes('<noise>')
    );

    // Check if student is struggling (multiple very short or confused responses)
    const hasStruggle = studentTurns.filter(t =>
      t.text.toLowerCase().includes("i don't know") ||
      t.text.toLowerCase().includes("confused") ||
      t.text.toLowerCase().includes("not sure") ||
      (t.text.trim().length < 10 && !t.text.toLowerCase().includes('<noise>'))
    ).length >= 2;

    // Evaluate after just 2-3 substantive exchanges, or if struggling
    const shouldEval = (totalExchanges >= 2 && hasSubstantiveResponse) || hasStruggle || totalExchanges >= 4;

    console.log(`[Orchestration] Evaluation check for ${session.sessionId}:`, {
      totalExchanges,
      hasSubstantiveResponse,
      hasStruggle,
      shouldEval
    });

    return shouldEval;
  }

  /**
   * Perform the actual evaluation
   */
  private async performEvaluation(sessionId: string): Promise<MasteryEvaluation | null> {
    const session = this.sessionManager.getSession(sessionId);
    if (!session || !session.currentCard) return null;

    this.evaluationQueue.add(sessionId);

    try {
      console.log(`[Orchestration] 🧠 Starting evaluation for session ${sessionId}`);

      // Get evaluation from Claude
      const evaluation = await this.claudeEvaluator.evaluate(
        session.currentCard,
        session.transcript.filter(t => t.isFinal),
        session.studentName
      );

      console.log(`[Orchestration] 📊 Evaluation complete:`, {
        sessionId,
        ready: evaluation.ready,
        confidence: evaluation.confidence,
        masteryLevel: evaluation.masteryLevel,
        suggestedAction: evaluation.suggestedAction,
        points: evaluation.points
      });

      // Update session
      this.sessionManager.updateEvaluation(sessionId, evaluation.points || 0);

      // Send to client via WebSocket
      if (session.ws) {
        const message = {
          type: 'evaluation',
          evaluation: {
            ...evaluation,
            timestamp: Date.now()
          }
        };

        session.ws.send(JSON.stringify(message));

        // Client handles advancement based on evaluation.suggestedAction
        // No need for separate advance_card message
      }

      return evaluation;
    } catch (error) {
      console.error(`[Orchestration] Evaluation error:`, error);
      return null;
    } finally {
      this.evaluationQueue.delete(sessionId);
    }
  }

  /**
   * Force an evaluation (for testing)
   */
  async forceEvaluation(sessionId: string): Promise<MasteryEvaluation | null> {
    console.log(`[Orchestration] Forcing evaluation for session ${sessionId}`);
    const session = this.sessionManager.getSession(sessionId);
    if (!session) return null;

    // Temporarily bypass time check
    session.lastEvaluationTime = 0;
    return this.performEvaluation(sessionId);
  }

  /**
   * Inject a message to the conversation
   */
  injectMessage(sessionId: string, message: string): void {
    const entry: TranscriptEntry = {
      role: 'system',
      text: message,
      timestamp: Date.now(),
      isFinal: true
    };

    this.sessionManager.addTranscriptEntry(sessionId, entry);

    // Send to client
    const session = this.sessionManager.getSession(sessionId);
    if (session?.ws) {
      session.ws.send(JSON.stringify({
        type: 'inject_message',
        message
      }));
    }
  }
}