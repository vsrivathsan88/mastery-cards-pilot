/**
 * Card State Machine
 * Explicit states for Pi's assessment process per card
 */

export enum CardState {
  CARD_START = 'CARD_START',           // Just loaded, need to ask starting question
  OBSERVING = 'OBSERVING',             // Asked Q1, waiting for/processing A1
  PROBING = 'PROBING',                 // Got A1, need to ask follow-up Q2
  JUDGING = 'JUDGING',                 // Got A2, evaluating understanding
  FINAL_CHECK = 'FINAL_CHECK',         // Understanding unclear, asking final YES/NO
  READY_TO_ADVANCE = 'READY_TO_ADVANCE' // All checks passed, can call tools
}

export interface CardStateData {
  state: CardState;
  exchangeCount: number;           // Number of complete Q+A cycles
  studentResponses: string[];      // Track what student said
  hasAskedStartingQuestion: boolean;
  hasProbed: boolean;
  hasFinalCheck: boolean;
  canCallTools: boolean;           // Explicit permission flag
  transitionReason?: string;       // Why we're in this state
}

export class CardStateMachine {
  private stateData: CardStateData;

  constructor() {
    this.stateData = this.getInitialState();
  }

  getInitialState(): CardStateData {
    return {
      state: CardState.CARD_START,
      exchangeCount: 0,
      studentResponses: [],
      hasAskedStartingQuestion: false,
      hasProbed: false,
      hasFinalCheck: false,
      canCallTools: false,
      transitionReason: 'New card loaded'
    };
  }

  getCurrentState(): CardStateData {
    return { ...this.stateData };
  }

  // Transition: Pi asked starting question
  startedObserving(): void {
    if (this.stateData.state !== CardState.CARD_START) {
      console.warn('[StateMachine] Invalid transition: startedObserving from', this.stateData.state);
      return;
    }
    
    this.stateData = {
      ...this.stateData,
      state: CardState.OBSERVING,
      hasAskedStartingQuestion: true,
      transitionReason: 'Asked starting question, waiting for student observation'
    };
    
    console.log('[StateMachine] → OBSERVING');
  }

  // Transition: Student gave first answer
  receivedObservation(response: string): void {
    if (this.stateData.state !== CardState.OBSERVING) {
      console.warn('[StateMachine] Invalid transition: receivedObservation from', this.stateData.state);
      return;
    }
    
    this.stateData = {
      ...this.stateData,
      state: CardState.PROBING,
      exchangeCount: 1,
      studentResponses: [...this.stateData.studentResponses, response],
      transitionReason: 'Got first answer (Q1+A1), need to probe deeper'
    };
    
    console.log('[StateMachine] → PROBING (exchanges: 1)');
  }

  // Transition: Pi asked follow-up, student answered
  receivedExplanation(response: string): void {
    if (this.stateData.state !== CardState.PROBING) {
      console.warn('[StateMachine] Invalid transition: receivedExplanation from', this.stateData.state);
      return;
    }
    
    this.stateData = {
      ...this.stateData,
      state: CardState.JUDGING,
      exchangeCount: 2,
      hasProbed: true,
      studentResponses: [...this.stateData.studentResponses, response],
      transitionReason: 'Got explanation (Q2+A2), evaluate if mastery achieved'
    };
    
    console.log('[StateMachine] → JUDGING (exchanges: 2)');
  }

  // Transition: Mastery achieved, ready to award points
  masteryAchieved(): void {
    if (this.stateData.state !== CardState.JUDGING && this.stateData.state !== CardState.FINAL_CHECK) {
      console.warn('[StateMachine] Invalid transition: masteryAchieved from', this.stateData.state);
      return;
    }
    
    this.stateData = {
      ...this.stateData,
      state: CardState.READY_TO_ADVANCE,
      canCallTools: true,
      transitionReason: 'Student demonstrated understanding - award points and advance'
    };
    
    console.log('[StateMachine] → READY_TO_ADVANCE (mastery achieved)');
  }

  // Transition: Understanding unclear, need final check
  needsFinalCheck(): void {
    if (this.stateData.state !== CardState.JUDGING) {
      console.warn('[StateMachine] Invalid transition: needsFinalCheck from', this.stateData.state);
      return;
    }
    
    this.stateData = {
      ...this.stateData,
      state: CardState.FINAL_CHECK,
      transitionReason: 'Understanding unclear - asking final YES/NO question'
    };
    
    console.log('[StateMachine] → FINAL_CHECK');
  }

  // Transition: Student answered final check
  receivedFinalAnswer(response: string): void {
    if (this.stateData.state !== CardState.FINAL_CHECK) {
      console.warn('[StateMachine] Invalid transition: receivedFinalAnswer from', this.stateData.state);
      return;
    }
    
    this.stateData = {
      ...this.stateData,
      state: CardState.JUDGING,
      exchangeCount: 3,
      hasFinalCheck: true,
      studentResponses: [...this.stateData.studentResponses, response],
      transitionReason: 'Got final check answer - make final decision'
    };
    
    console.log('[StateMachine] → JUDGING (after final check)');
  }

  // Transition: Student stuck, move on without points
  studentStuck(): void {
    if (this.stateData.exchangeCount < 3) {
      console.warn('[StateMachine] Cannot mark stuck before 3 exchanges');
      return;
    }
    
    this.stateData = {
      ...this.stateData,
      state: CardState.READY_TO_ADVANCE,
      canCallTools: true,
      transitionReason: 'Student stuck after multiple tries - advance without points'
    };
    
    console.log('[StateMachine] → READY_TO_ADVANCE (stuck, no points)');
  }

  // Check if tools can be called
  canCallTools(): boolean {
    return this.stateData.canCallTools && this.stateData.state === CardState.READY_TO_ADVANCE;
  }

  // Reset for new card
  reset(): void {
    this.stateData = this.getInitialState();
    console.log('[StateMachine] ↺ RESET to CARD_START');
  }

  // Get instruction for current state
  getStateInstruction(): string {
    switch (this.stateData.state) {
      case CardState.CARD_START:
        return '🚦 STATE: CARD_START → Ask your starting question now';
      
      case CardState.OBSERVING:
        return '🚦 STATE: OBSERVING → Listening for student\'s first observation (A1)';
      
      case CardState.PROBING:
        return `🚦 STATE: PROBING → Ask follow-up: "Tell me more" / "Why?" / "What makes you say that?" (Exchange count: ${this.stateData.exchangeCount})`;
      
      case CardState.JUDGING:
        return `🚦 STATE: JUDGING → Evaluate understanding. Check scorecard:\n   - ${this.stateData.exchangeCount} exchanges ✅\n   - Did they explain WHY/HOW?\n   - Do they understand the concept?\n   → If YES: Call masteryAchieved\n   → If UNCLEAR: Call needsFinalCheck\n   → If NO (and 3+ exchanges): Call studentStuck`;
      
      case CardState.FINAL_CHECK:
        return '🚦 STATE: FINAL_CHECK → Ask ONE final YES/NO question to test concept understanding';
      
      case CardState.READY_TO_ADVANCE:
        return `🚦 STATE: READY_TO_ADVANCE → ${this.stateData.transitionReason}\n   ✅ YOU CAN NOW CALL TOOLS\n   → award_mastery_points() then show_next_card()\n   OR just show_next_card() if stuck`;
      
      default:
        return '🚦 STATE: UNKNOWN';
    }
  }

  // Get state context for Pi
  getStateContext(): string {
    const { state, exchangeCount, hasAskedStartingQuestion, hasProbed, hasFinalCheck, canCallTools, transitionReason } = this.stateData;
    
    return `
╔═══════════════════════════════════════════════════════════════╗
║  🚦 CURRENT STATE: ${state}
╚═══════════════════════════════════════════════════════════════╝

${this.getStateInstruction()}

**Progress Tracking:**
- Exchange Count: ${exchangeCount} / 2-3 required
- Asked Starting Question: ${hasAskedStartingQuestion ? '✅' : '❌'}
- Probed Deeper: ${hasProbed ? '✅' : '❌'}
- Used Final Check: ${hasFinalCheck ? '✅' : '❌'}
- Can Call Tools: ${canCallTools ? '✅ YES' : '❌ NO - must complete state transitions first'}

**Transition Reason:** ${transitionReason}

**What You Should Do Next:**
${this.getNextActionGuidance()}

${canCallTools ? '' : '⚠️ DO NOT CALL TOOLS YET - You must reach READY_TO_ADVANCE state first!'}
`;
  }

  private getNextActionGuidance(): string {
    switch (this.stateData.state) {
      case CardState.CARD_START:
        return 'Ask the starting question shown above for this card.';
      
      case CardState.OBSERVING:
        return 'Wait for student to respond to your question. Listen carefully to what they observe.';
      
      case CardState.PROBING:
        return 'Ask a follow-up question to go deeper: "Tell me more", "Why is that?", "What makes you say that?"';
      
      case CardState.JUDGING:
        if (this.stateData.exchangeCount < 2) {
          return 'You need at least 2 exchanges before judging. Ask another question.';
        }
        return 'Evaluate their understanding:\n   - If they explained the concept clearly → Ready to award points\n   - If partially there but unclear → Ask final check question\n   - If stuck/off-topic after 3+ exchanges → Ready to move on (no points)';
      
      case CardState.FINAL_CHECK:
        return 'Ask ONE simple YES/NO question that directly tests if they understand the concept.';
      
      case CardState.READY_TO_ADVANCE:
        return 'Call tools now:\n   - If mastery achieved: award_mastery_points() → show_next_card()\n   - If stuck: show_next_card() only';
      
      default:
        return 'Invalid state - contact system administrator';
    }
  }
}
