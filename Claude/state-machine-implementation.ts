/**
 * PRACTICAL IMPLEMENTATION EXAMPLE
 * State Machine + Gemini Live API Integration
 * 
 * This shows how to implement the 4-layer defense system
 * in a real application
 */

import { genai, types } from 'google-genai';
import type { MasteryCard } from './types';

// ============================================================================
// LAYER 1: STATE MACHINE
// ============================================================================

enum CardState {
  INTRO = 'intro',
  EXPLORING = 'exploring',
  READY_TO_ASSESS = 'ready',
  AWAITING_TOOL = 'awaiting',
  COMPLETE = 'complete'
}

interface ConversationState {
  currentCardId: number;
  state: CardState;
  exchangeCount: number;
  evidenceFound: string[];
  lastUserMessage: string;
  lastPiMessage: string;
  masteryAchieved: boolean;
}

class CardStateManager {
  private state: ConversationState;
  private currentCard: MasteryCard;
  private cards: MasteryCard[];
  private currentIndex: number;
  
  constructor(cards: MasteryCard[], studentName: string) {
    this.cards = cards;
    this.currentIndex = 0;
    this.currentCard = cards[0];
    
    this.state = {
      currentCardId: this.currentCard.id,
      state: this.currentCard.cardNumber === 0 ? CardState.INTRO : CardState.EXPLORING,
      exchangeCount: 0,
      evidenceFound: [],
      lastUserMessage: '',
      lastPiMessage: '',
      masteryAchieved: false
    };
  }
  
  /**
   * Main decision point - called after each user message
   */
  shouldProgress(): ProgressDecision {
    const { exchangeCount, evidenceFound, state } = this.state;
    
    // Special case: Intro card
    if (state === CardState.INTRO) {
      return {
        action: 'next_card',
        reason: 'Intro complete',
        awardPoints: false
      };
    }
    
    // Check mastery conditions
    const hasMastery = this.checkMastery();
    
    // Ready to award points and progress
    if (hasMastery && exchangeCount >= 2) {
      return {
        action: 'award_then_next',
        reason: 'Mastery demonstrated',
        awardPoints: true,
        points: this.calculatePoints(),
        celebration: this.generateCelebration()
      };
    }
    
    // Stuck after many exchanges - move on without points
    if (!hasMastery && exchangeCount >= 5) {
      return {
        action: 'next_card',
        reason: 'Stuck after multiple attempts',
        awardPoints: false
      };
    }
    
    // Continue conversation
    return {
      action: 'continue',
      reason: `Need more exchanges (${exchangeCount}/2) or evidence`,
      suggestedPrompt: this.getSuggestedPrompt()
    };
  }
  
  /**
   * Update state with new user message
   */
  recordUserMessage(message: string) {
    this.state.lastUserMessage = message;
    this.state.exchangeCount++;
    this.detectEvidence(message);
  }
  
  /**
   * Update state with Pi's message
   */
  recordPiMessage(message: string) {
    this.state.lastPiMessage = message;
  }
  
  /**
   * Move to next card
   */
  moveToNextCard() {
    this.currentIndex++;
    if (this.currentIndex >= this.cards.length) {
      // Session complete
      return null;
    }
    
    this.currentCard = this.cards[this.currentIndex];
    
    // Reset state for new card
    this.state = {
      currentCardId: this.currentCard.id,
      state: CardState.EXPLORING,
      exchangeCount: 0,
      evidenceFound: [],
      lastUserMessage: '',
      lastPiMessage: '',
      masteryAchieved: false
    };
    
    return this.currentCard;
  }
  
  /**
   * Check if mastery conditions are met
   */
  private checkMastery(): boolean {
    const { evidenceFound, lastUserMessage } = this.state;
    const { milestones } = this.currentCard;
    
    // Check for evidence keywords
    const basicEvidence = milestones.basic.evidenceKeywords;
    const hasBasicEvidence = basicEvidence.some(keyword =>
      evidenceFound.some(found =>
        found.toLowerCase().includes(keyword.toLowerCase())
      )
    );
    
    // Check for reasoning (presence of "because", "so", etc.)
    const reasoningWords = ['because', 'so', "that's why", 'if', 'when', 'since'];
    const hasReasoning = reasoningWords.some(word =>
      lastUserMessage.toLowerCase().includes(word)
    );
    
    return hasBasicEvidence && hasReasoning;
  }
  
  /**
   * Detect evidence in user message
   */
  private detectEvidence(message: string) {
    const allKeywords = [
      ...this.currentCard.milestones.basic.evidenceKeywords,
      ...(this.currentCard.milestones.advanced?.evidenceKeywords || [])
    ];
    
    allKeywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      const messageLower = message.toLowerCase();
      
      if (messageLower.includes(keywordLower)) {
        if (!this.state.evidenceFound.includes(keyword)) {
          this.state.evidenceFound.push(keyword);
          console.log(`✓ Evidence detected: "${keyword}"`);
        }
      }
    });
  }
  
  /**
   * Calculate points based on evidence
   */
  private calculatePoints(): number {
    const { milestones } = this.currentCard;
    const advancedKeywords = milestones.advanced?.evidenceKeywords || [];
    
    const hasAdvanced = advancedKeywords.some(keyword =>
      this.state.evidenceFound.some(found =>
        found.toLowerCase().includes(keyword.toLowerCase())
      )
    );
    
    if (hasAdvanced) {
      return milestones.basic.points + (milestones.advanced?.points || 0);
    }
    
    return milestones.basic.points;
  }
  
  private generateCelebration(): string {
    const celebrations = [
      "Nice! You explained that clearly!",
      "Whoa! You really understand this!",
      "Yes! That makes so much sense!",
      "Exactly! You've got it!"
    ];
    return celebrations[Math.floor(Math.random() * celebrations.length)];
  }
  
  private getSuggestedPrompt(): string {
    const { exchangeCount } = this.state;
    
    if (exchangeCount === 1) {
      return "Tell me more about that";
    } else if (exchangeCount === 2) {
      return "What makes you think that?";
    } else {
      return "How did you figure that out?";
    }
  }
  
  // Getters
  getCurrentCard() { return this.currentCard; }
  getState() { return this.state; }
  getExchangeCount() { return this.state.exchangeCount; }
}

interface ProgressDecision {
  action: 'continue' | 'award_then_next' | 'next_card';
  reason: string;
  awardPoints?: boolean;
  points?: number;
  celebration?: string;
  suggestedPrompt?: string;
}

// ============================================================================
// LAYER 2: VALIDATION
// ============================================================================

class ToolCallValidator {
  static validate(
    toolName: string,
    args: any,
    state: ConversationState,
    card: MasteryCard
  ): ValidationResult {
    
    if (toolName === 'award_mastery_points') {
      return this.validateAwardPoints(args, state, card);
    }
    
    if (toolName === 'show_next_card') {
      return this.validateShowNext(state);
    }
    
    return { valid: true, errors: [] };
  }
  
  private static validateAwardPoints(
    args: any,
    state: ConversationState,
    card: MasteryCard
  ): ValidationResult {
    const errors: string[] = [];
    
    if (state.exchangeCount < 2) {
      errors.push(`Only ${state.exchangeCount} exchanges (need 2+)`);
    }
    
    if (state.evidenceFound.length === 0) {
      errors.push('No evidence keywords detected');
    }
    
    if (!state.lastUserMessage.match(/because|so|that's why|if|since/i)) {
      errors.push('No reasoning detected in last message');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  private static validateShowNext(state: ConversationState): ValidationResult {
    // Allow if either:
    // 1. Just achieved mastery (normal progression)
    // 2. Stuck after many attempts (move on without points)
    
    const normalProgression = state.masteryAchieved;
    const stuckProgression = !state.masteryAchieved && state.exchangeCount >= 5;
    
    if (!normalProgression && !stuckProgression) {
      return {
        valid: false,
        errors: [`Invalid timing: exchanges=${state.exchangeCount}, mastery=${state.masteryAchieved}`]
      };
    }
    
    return { valid: true, errors: [] };
  }
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ============================================================================
// MAIN INTEGRATION
// ============================================================================

export class PiLiveSession {
  private client: genai.Client;
  private session: any; // Live API session
  private stateManager: CardStateManager;
  private validator = ToolCallValidator;
  private onPointsAwarded?: (points: number) => void;
  private onCardChanged?: (card: MasteryCard) => void;
  
  constructor(
    cards: MasteryCard[],
    studentName: string,
    apiKey: string
  ) {
    this.client = new genai.Client({ apiKey });
    this.stateManager = new CardStateManager(cards, studentName);
  }
  
  /**
   * Start the Live API session
   */
  async start() {
    const config = this.buildConfig();
    
    this.session = await this.client.aio.live.connect({
      model: 'gemini-live-2.5-flash', // Half-cascade for tool reliability
      config
    });
    
    // Handle incoming messages
    this.session.on('audio', (audio: any) => {
      // Handle audio output
      this.playAudio(audio);
    });
    
    this.session.on('text', (text: any) => {
      // Store Pi's message
      this.stateManager.recordPiMessage(text.content);
    });
    
    this.session.on('function_call', async (call: any) => {
      await this.handleFunctionCall(call);
    });
    
    // If Card 0 (intro), Pi speaks first
    if (this.stateManager.getCurrentCard().cardNumber === 0) {
      await this.handleIntroCard();
    }
  }
  
  /**
   * Handle user message
   */
  async sendUserMessage(message: string) {
    // Update state
    this.stateManager.recordUserMessage(message);
    
    console.log(`\n👤 User (exchange ${this.stateManager.getExchangeCount()}): ${message}`);
    console.log(`📊 Evidence found: ${this.stateManager.getState().evidenceFound.join(', ') || 'none'}`);
    
    // Check if we should progress
    const decision = this.stateManager.shouldProgress();
    
    console.log(`🤔 Decision: ${decision.action} - ${decision.reason}`);
    
    // Handle decision
    switch (decision.action) {
      case 'award_then_next':
        // FORCE tool calls in sequence (don't rely on Gemini)
        await this.forceAwardPoints(decision.points!, decision.celebration!);
        await this.forceShowNextCard();
        break;
        
      case 'next_card':
        // Move on without points
        await this.forceShowNextCard();
        break;
        
      case 'continue':
        // Let Pi respond naturally
        // Optionally provide guidance
        if (decision.suggestedPrompt) {
          await this.session.send({
            text: `[Internal guidance: ${decision.suggestedPrompt}]`
          });
        }
        break;
    }
    
    // Send user message to Gemini
    await this.session.send({
      text: message
    });
  }
  
  /**
   * FORCE tool calls (don't wait for Gemini to decide)
   */
  private async forceAwardPoints(points: number, celebration: string) {
    console.log(`🏆 Forcing award_mastery_points: ${points} points`);
    
    // Execute directly in your application
    if (this.onPointsAwarded) {
      this.onPointsAwarded(points);
    }
    
    // Tell Pi about it for conversational continuity
    await this.session.send({
      text: `[System: ${celebration} Awarded ${points} points.]`
    });
    
    // Update state
    this.stateManager.getState().masteryAchieved = true;
  }
  
  private async forceShowNextCard() {
    console.log(`➡️  Forcing show_next_card`);
    
    const nextCard = this.stateManager.moveToNextCard();
    
    if (!nextCard) {
      console.log('🎉 Session complete!');
      await this.session.close();
      return;
    }
    
    console.log(`\n📸 New Card: ${nextCard.title}`);
    
    // Notify application
    if (this.onCardChanged) {
      this.onCardChanged(nextCard);
    }
    
    // Tell Pi about new card
    await this.session.send({
      text: `[System: Moving to next card: ${nextCard.title}. Ask: "${nextCard.piStartingQuestion}"]`
    });
  }
  
  /**
   * Handle function calls from Gemini (if they happen)
   * These are mostly for logging/monitoring
   */
  private async handleFunctionCall(call: any) {
    const { name, args } = call;
    
    console.log(`🔧 Gemini requested tool: ${name}`);
    
    // Validate
    const validation = this.validator.validate(
      name,
      args,
      this.stateManager.getState(),
      this.stateManager.getCurrentCard()
    );
    
    if (!validation.valid) {
      console.warn(`⚠️  BLOCKED invalid tool call: ${validation.errors.join(', ')}`);
      
      // Respond to Gemini
      await this.session.send({
        functionResponse: {
          name,
          response: {
            error: 'Tool call blocked - conditions not met',
            reason: validation.errors.join('; ')
          }
        }
      });
      
      return;
    }
    
    // If valid, execute (though with forced mode, we usually call tools ourselves)
    console.log(`✅ Valid tool call - executing`);
    
    if (name === 'award_mastery_points') {
      await this.forceAwardPoints(args.points, args.celebration);
    } else if (name === 'show_next_card') {
      await this.forceShowNextCard();
    }
    
    // Acknowledge to Gemini
    await this.session.send({
      functionResponse: {
        name,
        response: { success: true }
      }
    });
  }
  
  /**
   * Handle Card 0 intro
   */
  private async handleIntroCard() {
    const intro = `Hey! I'm Pi - I'm from Planet Geometrica and I'm SO curious ` +
                 `about how you think about fractions! We're going to look at ` +
                 `some images together and explore. Ready to wonder with me?`;
    
    await this.session.send({
      text: intro
    });
    
    // Wait briefly, then auto-advance
    setTimeout(async () => {
      await this.forceShowNextCard();
    }, 3000);
  }
  
  /**
   * Build Gemini config
   */
  private buildConfig() {
    const systemPrompt = this.getSystemPrompt();
    
    return {
      systemInstruction: systemPrompt,
      
      tools: [
        types.Tool({
          functionDeclarations: [
            {
              name: 'award_mastery_points',
              description: 'Award points when student demonstrates understanding',
              parameters: {
                type: 'object',
                properties: {
                  cardId: { type: 'string' },
                  points: { type: 'number' },
                  celebration: { type: 'string' }
                },
                required: ['cardId', 'points', 'celebration']
              }
            },
            {
              name: 'show_next_card',
              description: 'Move to next card',
              parameters: {
                type: 'object',
                properties: {}
              }
            }
          ]
        })
      ],
      
      toolConfig: types.ToolConfig({
        functionCallingConfig: types.FunctionCallingConfig({
          mode: 'AUTO'
        })
      }),
      
      responseModalities: ['AUDIO'],
      temperature: 0.3,
      
      thinkingConfig: {
        thinkingBudget: 512,
        includeThoughts: false
      }
    };
  }
  
  private getSystemPrompt(): string {
    // Import your revised system prompt
    return getRevisedSystemPrompt(
      'Explorer',
      this.stateManager.getCurrentCard(),
      0,
      { level: 1, title: 'Explorer' }
    );
  }
  
  private playAudio(audio: any) {
    // Implement audio playback
    // This depends on your platform (web, mobile, etc.)
  }
  
  // Event handlers
  onPointsAwardedCallback(callback: (points: number) => void) {
    this.onPointsAwarded = callback;
  }
  
  onCardChangedCallback(callback: (card: MasteryCard) => void) {
    this.onCardChanged = callback;
  }
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

async function main() {
  const cards = loadMasteryCards(); // Your cards data
  
  const session = new PiLiveSession(
    cards,
    'Alex',
    process.env.GEMINI_API_KEY!
  );
  
  // Setup event handlers
  session.onPointsAwardedCallback((points) => {
    console.log(`🎉 Points awarded: ${points}`);
    updateUI({ pointsEarned: points });
  });
  
  session.onCardChangedCallback((card) => {
    console.log(`📸 New card: ${card.title}`);
    displayCard(card);
  });
  
  // Start session
  await session.start();
  
  // Handle user input (from microphone, text input, etc.)
  userInput.on('message', async (text: string) => {
    await session.sendUserMessage(text);
  });
}

// ============================================================================
// KEY TAKEAWAYS
// ============================================================================

/**
 * 1. STATE MACHINE controls when to progress (not Gemini)
 * 2. VALIDATION blocks invalid tool calls
 * 3. FORCE tool calls when conditions met (don't wait for Gemini)
 * 4. MONITOR everything for debugging
 * 
 * This approach gives you:
 * ✅ Predictable progression
 * ✅ Consistent behavior
 * ✅ Easy debugging
 * ✅ Immune to Gemini's function calling flakiness
 */
