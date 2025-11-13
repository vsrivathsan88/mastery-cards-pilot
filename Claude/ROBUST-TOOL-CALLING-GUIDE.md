# ROBUST TOOL CALLING IMPLEMENTATION FOR PI

## 🚨 THE CORE PROBLEM

Based on extensive research, **Gemini Live API function calling is inherently unreliable**:

- Multiple GitHub issues reporting "inconsistent behavior" 
- Forum complaints about function calls being ignored
- Audio input/output negatively impacts function calling ability
- Model sometimes generates text instead of calling functions
- Timing issues with when functions are called

**Your experience ("Pi always gets this wrong") is not unique - it's a known limitation.**

---

## 🎯 MOST ROBUST SOLUTION: 4-LAYER DEFENSE

Don't rely solely on prompting. Use multiple layers of control:

### Layer 1: Application State Machine (MOST IMPORTANT)
### Layer 2: Forced Function Calling Mode  
### Layer 3: Validation Layer
### Layer 4: Prompt Engineering (your revised prompt)

---

## 🏗️ LAYER 1: APPLICATION STATE MACHINE (Critical)

**This is the KEY to reliability.** Don't let Gemini decide when to call tools - your application decides.

### Implementation Strategy

```typescript
/**
 * Card State Machine
 * The application tracks state and ENFORCES tool calling rules
 */

enum CardState {
  INTRO = 'intro',              // Card 0 special case
  EXPLORING = 'exploring',       // Having conversation
  READY_TO_ASSESS = 'ready',    // Met minimum exchanges
  AWAITING_TOOL = 'awaiting',   // Waiting for tool call
  COMPLETE = 'complete'          // Card finished
}

interface ConversationState {
  currentCardId: number;
  state: CardState;
  exchangeCount: number;          // Track back-and-forth exchanges
  evidenceFound: string[];        // Keywords detected
  lastUserMessage: string;
  lastPiMessage: string;
  toolCallRequested: boolean;
  masteryAchieved: boolean;
}

class PiStateManager {
  private state: ConversationState;
  private currentCard: MasteryCard;
  
  constructor(startingCard: MasteryCard) {
    this.state = {
      currentCardId: startingCard.id,
      state: startingCard.cardNumber === 0 ? CardState.INTRO : CardState.EXPLORING,
      exchangeCount: 0,
      evidenceFound: [],
      lastUserMessage: '',
      lastPiMessage: '',
      toolCallRequested: false,
      masteryAchieved: false
    };
    this.currentCard = startingCard;
  }
  
  /**
   * CRITICAL: Called after each user message
   * Decides what Pi should do next
   */
  async handleUserMessage(userMessage: string): Promise<Action> {
    this.state.lastUserMessage = userMessage;
    this.state.exchangeCount++;
    
    // Update evidence found
    this.detectEvidence(userMessage);
    
    // Special case: Card 0 (intro)
    if (this.state.state === CardState.INTRO) {
      return {
        type: 'show_next_card',
        reason: 'Intro card complete'
      };
    }
    
    // Check if we should transition states
    const newState = this.determineNextState();
    
    if (newState !== this.state.state) {
      console.log(`State transition: ${this.state.state} → ${newState}`);
      this.state.state = newState;
    }
    
    return this.getNextAction();
  }
  
  /**
   * Determines next state based on conversation progress
   */
  private determineNextState(): CardState {
    const { state, exchangeCount, evidenceFound } = this.state;
    
    switch (state) {
      case CardState.EXPLORING:
        // Move to ready after minimum exchanges with some evidence
        if (exchangeCount >= 2 && evidenceFound.length > 0) {
          return CardState.READY_TO_ASSESS;
        }
        return CardState.EXPLORING;
        
      case CardState.READY_TO_ASSESS:
        // Check if mastery achieved
        if (this.checkMasteryConditions()) {
          this.state.masteryAchieved = true;
          return CardState.AWAITING_TOOL;
        }
        // Move on without points after too many exchanges
        if (exchangeCount >= 5) {
          this.state.masteryAchieved = false;
          return CardState.AWAITING_TOOL;
        }
        return CardState.READY_TO_ASSESS;
        
      case CardState.AWAITING_TOOL:
        return CardState.AWAITING_TOOL;
        
      default:
        return state;
    }
  }
  
  /**
   * Decides what action Pi should take next
   */
  private getNextAction(): Action {
    const { state, masteryAchieved, exchangeCount } = this.state;
    
    switch (state) {
      case CardState.EXPLORING:
        return {
          type: 'continue_conversation',
          prompt: this.generateProbePrompt()
        };
        
      case CardState.READY_TO_ASSESS:
        return {
          type: 'continue_conversation',
          prompt: this.generateAssessmentPrompt()
        };
        
      case CardState.AWAITING_TOOL:
        if (masteryAchieved) {
          return {
            type: 'award_points_then_next',
            points: this.calculatePoints(),
            celebration: this.generateCelebration()
          };
        } else {
          return {
            type: 'show_next_card',
            reason: `Struggled after ${exchangeCount} exchanges`
          };
        }
        
      default:
        return { type: 'continue_conversation' };
    }
  }
  
  /**
   * Check if mastery conditions are met
   */
  private checkMasteryConditions(): boolean {
    const { evidenceFound, exchangeCount } = this.state;
    const { milestones } = this.currentCard;
    
    // Must have minimum exchanges
    if (exchangeCount < 2) return false;
    
    // Check evidence keywords
    const basicEvidence = milestones.basic.evidenceKeywords;
    const foundBasic = basicEvidence.some(keyword => 
      evidenceFound.some(found => 
        found.toLowerCase().includes(keyword.toLowerCase())
      )
    );
    
    // Must have explained reasoning (check for "because", "so", etc.)
    const hasReasoning = this.state.lastUserMessage.match(/because|so|that's why|if/i);
    
    return foundBasic && hasReasoning !== null;
  }
  
  /**
   * Detect evidence keywords in user message
   */
  private detectEvidence(message: string): void {
    const keywords = [
      ...this.currentCard.milestones.basic.evidenceKeywords,
      ...(this.currentCard.milestones.advanced?.evidenceKeywords || [])
    ];
    
    keywords.forEach(keyword => {
      if (message.toLowerCase().includes(keyword.toLowerCase())) {
        if (!this.state.evidenceFound.includes(keyword)) {
          this.state.evidenceFound.push(keyword);
        }
      }
    });
  }
  
  private calculatePoints(): number {
    // Determine if basic or advanced mastery
    const advancedEvidence = this.currentCard.milestones.advanced?.evidenceKeywords || [];
    const hasAdvanced = advancedEvidence.some(keyword =>
      this.state.evidenceFound.some(found =>
        found.toLowerCase().includes(keyword.toLowerCase())
      )
    );
    
    if (hasAdvanced) {
      return this.currentCard.milestones.basic.points + 
             (this.currentCard.milestones.advanced?.points || 0);
    }
    
    return this.currentCard.milestones.basic.points;
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
  
  private generateProbePrompt(): string {
    if (this.state.exchangeCount === 1) {
      return "Tell me more about that";
    } else {
      const probes = [
        "What makes you think that?",
        "Interesting - how did you figure that out?",
        "Can you explain that more?",
        "Hmm, so you're saying..."
      ];
      return probes[Math.floor(Math.random() * probes.length)];
    }
  }
  
  private generateAssessmentPrompt(): string {
    const prompts = [
      "Why does that matter?",
      "How would you explain this to someone else?",
      "What if I asked you to show me another example?"
    ];
    return prompts[Math.floor(Math.random() * prompts.length)];
  }
}

type Action = 
  | { type: 'continue_conversation'; prompt?: string }
  | { type: 'award_points_then_next'; points: number; celebration: string }
  | { type: 'show_next_card'; reason: string };
```

### How to Use the State Machine

```typescript
// Initialize
const stateManager = new PiStateManager(cards[0]);

// After each user message
liveSession.on('user_message', async (message) => {
  const action = await stateManager.handleUserMessage(message.text);
  
  switch (action.type) {
    case 'continue_conversation':
      // Let Pi respond naturally, optionally guide with prompt
      await sendToPi(action.prompt || "Continue the conversation");
      break;
      
    case 'award_points_then_next':
      // FORCE the tool calls in sequence
      await forceToolCall('award_mastery_points', {
        cardId: stateManager.currentCard.id,
        points: action.points,
        celebration: action.celebration
      });
      
      await forceToolCall('show_next_card', {});
      
      // Move to next card in state manager
      stateManager.moveToNextCard(cards[currentIndex + 1]);
      break;
      
    case 'show_next_card':
      // Move on without points
      await forceToolCall('show_next_card', {});
      stateManager.moveToNextCard(cards[currentIndex + 1]);
      break;
  }
});
```

**Why this works:**
- ✅ Application decides when tools are called, not Gemini
- ✅ Tracks conversation state programmatically
- ✅ Validates mastery conditions in code
- ✅ Enforces minimum exchanges before progression
- ✅ Immune to Gemini's function calling flakiness

---

## 🔧 LAYER 2: FORCED FUNCTION CALLING MODE

Even with state machine, configure Gemini to prefer function calls when appropriate.

### Configuration

```typescript
import { genai, types } from 'google-genai';

const config = {
  // System instructions
  systemInstruction: getRevisedSystemPrompt(/* ... */),
  
  // Define tools
  tools: [
    types.Tool({
      functionDeclarations: [
        {
          name: "award_mastery_points",
          description: "Award points when student demonstrates understanding. ONLY call this when you're confident they understand the concept and can explain WHY, not just WHAT.",
          parameters: {
            type: "object",
            properties: {
              cardId: {
                type: "string",
                description: "ID of the current card"
              },
              points: {
                type: "number",
                description: "Points to award (30 for basic, 60 for advanced, 40 for teaching)"
              },
              celebration: {
                type: "string",
                description: "Brief celebration message (1 sentence max)"
              }
            },
            required: ["cardId", "points", "celebration"]
          }
        },
        {
          name: "show_next_card",
          description: "Move to the next learning card. Call this ONLY after awarding points OR after student is stuck for 4-5 exchanges.",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      ]
    })
  ],
  
  // CRITICAL: Force function calling when needed
  toolConfig: types.ToolConfig({
    functionCallingConfig: types.FunctionCallingConfig({
      mode: 'AUTO' // or 'ANY' to force always calling a function
    })
  }),
  
  // Voice configuration - USE HALF-CASCADE for better tool calling
  responseModalities: ["AUDIO"],
  
  // Lower temperature for more consistent behavior
  temperature: 0.3,
  
  // Optional: Enable thinking for better reasoning
  thinkingConfig: {
    thinkingBudget: 512,
    includeThoughts: false  // Keep thoughts internal
  }
};

const session = await client.aio.live.connect(
  model: "gemini-live-2.5-flash",  // NOT native-audio if using tools heavily
  config: config
);
```

### Important Model Choice

**For reliable tool calling:**
- ✅ Use: `gemini-live-2.5-flash` (half-cascade model)
- ❌ Avoid: `gemini-2.5-flash-native-audio-preview-*` 

**Why?** Half-cascade models convert audio→text internally, making function calling more reliable. Native audio is better for expressiveness but worse for tool use.

---

## 🛡️ LAYER 3: VALIDATION LAYER

Before executing any tool call, validate the conditions are actually met.

```typescript
/**
 * Validation layer - prevents invalid tool calls
 */
class ToolCallValidator {
  
  /**
   * Validate award_mastery_points call
   */
  static validateAwardPoints(
    args: any,
    state: ConversationState,
    card: MasteryCard
  ): ValidationResult {
    const errors: string[] = [];
    
    // Check exchange count
    if (state.exchangeCount < 2) {
      errors.push(`Only ${state.exchangeCount} exchanges, need at least 2`);
    }
    
    // Check evidence keywords
    const hasEvidence = card.milestones.basic.evidenceKeywords.some(keyword =>
      state.evidenceFound.some(found =>
        found.toLowerCase().includes(keyword.toLowerCase())
      )
    );
    
    if (!hasEvidence) {
      errors.push("No evidence keywords detected in student responses");
    }
    
    // Check reasoning present
    if (!state.lastUserMessage.match(/because|so|that's why|if/i)) {
      errors.push("Student didn't explain reasoning (no 'because', 'so', etc)");
    }
    
    // Validate points value
    const validPoints = [
      card.milestones.basic.points,
      card.milestones.basic.points + (card.milestones.advanced?.points || 0),
      card.misconception?.teachingMilestone.points
    ].filter(p => p !== undefined);
    
    if (!validPoints.includes(args.points)) {
      errors.push(`Invalid points: ${args.points}. Valid: ${validPoints.join(', ')}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate show_next_card call
   */
  static validateShowNext(
    state: ConversationState
  ): ValidationResult {
    const errors: string[] = [];
    
    // Either:
    // 1. Just awarded points (valid progression)
    // 2. Stuck after 4+ exchanges (valid move-on)
    
    const justAwardedPoints = state.masteryAchieved && state.toolCallRequested;
    const stuckAfterTrying = !state.masteryAchieved && state.exchangeCount >= 4;
    
    if (!justAwardedPoints && !stuckAfterTrying) {
      errors.push(
        `Invalid progression: ${state.exchangeCount} exchanges, ` +
        `mastery: ${state.masteryAchieved}`
      );
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}
```

### Using Validation

```typescript
// When Gemini requests a tool call
liveSession.on('function_call', async (call) => {
  const { name, args } = call;
  
  let validation: ValidationResult;
  
  if (name === 'award_mastery_points') {
    validation = ToolCallValidator.validateAwardPoints(
      args,
      stateManager.state,
      stateManager.currentCard
    );
  } else if (name === 'show_next_card') {
    validation = ToolCallValidator.validateShowNext(
      stateManager.state
    );
  }
  
  if (!validation.valid) {
    console.warn('⚠️ INVALID TOOL CALL BLOCKED:', validation.errors);
    
    // Don't execute the tool call
    // Instead, send feedback to Pi to try again
    await sendToPi(
      "Continue exploring this concept with the student. " +
      "You haven't gathered enough evidence yet."
    );
    
    return; // Block the tool call
  }
  
  // Valid - execute the tool
  await executeToolCall(name, args);
});
```

**Why this works:**
- ✅ Catches invalid tool calls before execution
- ✅ Prevents premature progression
- ✅ Logs violations for debugging
- ✅ Can provide feedback to model to try again

---

## 📝 LAYER 4: ENHANCED PROMPT (Your Revised Prompt)

With the above layers in place, your revised prompt provides the conversational quality. But add these explicit tool calling constraints:

```typescript
// Add to system prompt
const TOOL_CALLING_CONSTRAINTS = `

# 🔒 CRITICAL TOOL CALLING RULES

You have access to two tools, but the APPLICATION controls when you can use them.

## WHEN YOU SHOULD CALL award_mastery_points:

The application will only ALLOW this call when:
1. ✓ At least 2 exchanges have occurred
2. ✓ Student mentioned evidence keywords  
3. ✓ Student explained WHY/HOW (not just WHAT)
4. ✓ Explanation connects to learning goal

If you call this tool prematurely, it will be REJECTED.

## WHEN YOU SHOULD CALL show_next_card:

The application will only ALLOW this call when:
1. ✓ You just successfully called award_mastery_points
2. ✓ OR student is stuck after 4+ exchanges

If you call this tool at the wrong time, it will be REJECTED.

## SEQUENCE REQUIREMENT:

When student demonstrates understanding:
1. FIRST call: award_mastery_points
2. THEN call: show_next_card

NEVER call show_next_card without first calling award_mastery_points 
(unless student is genuinely stuck).

## IF YOUR TOOL CALL IS REJECTED:

Continue the conversation. Probe deeper. Gather more evidence.
The application will tell you when conditions are met.
`;

// Include in your system prompt
const systemPrompt = getRevisedSystemPrompt(/* ... */) + TOOL_CALLING_CONSTRAINTS;
```

---

## 🎬 SPECIAL HANDLING: CARD 0 (INTRO)

Since you added Card 0 as a "YouTube thumbnail for intros":

```typescript
class PiStateManager {
  
  handleCardZero(): Action {
    // Card 0: Pi speaks first, then immediately moves on
    return {
      type: 'intro_then_next',
      introMessage: this.generateIntro(),
      autoAdvance: true
    };
  }
  
  private generateIntro(): string {
    return `Hey ${this.studentName}! I'm Pi - I'm from Planet Geometrica ` +
           `and I'm SO curious about how you think about fractions and numbers! ` +
           `We're going to look at some images together and wonder about what we notice. ` +
           `No right or wrong answers - just exploring together! Ready?`;
  }
}

// In your session handler
if (currentCard.cardNumber === 0) {
  const action = stateManager.handleCardZero();
  
  // Pi speaks first
  await sendToPi(action.introMessage);
  
  // Wait for user acknowledgment (or timeout)
  const response = await waitForUserResponse({ timeout: 5000 });
  
  // Automatically advance regardless of response
  await forceToolCall('show_next_card', {});
  stateManager.moveToNextCard(cards[1]);
}
```

---

## 🔍 DEBUGGING & MONITORING

Essential logging to diagnose tool calling issues:

```typescript
class ToolCallMonitor {
  private callLog: ToolCallEvent[] = [];
  
  logToolCall(event: ToolCallEvent) {
    this.callLog.push({
      ...event,
      timestamp: Date.now()
    });
    
    console.log(`
🔧 TOOL CALL: ${event.name}
├─ State: ${event.state.state}
├─ Exchanges: ${event.state.exchangeCount}
├─ Evidence: ${event.state.evidenceFound.join(', ')}
├─ Valid: ${event.validation.valid}
${event.validation.errors.length > 0 ? 
  `└─ Errors: ${event.validation.errors.join(', ')}` : 
  '└─ ✓ Executed successfully'}
    `);
  }
  
  getStatistics() {
    const total = this.callLog.length;
    const blocked = this.callLog.filter(e => !e.validation.valid).length;
    const premature = this.callLog.filter(e => 
      e.name === 'award_mastery_points' && 
      e.state.exchangeCount < 2
    ).length;
    
    return {
      totalCalls: total,
      blockedCalls: blocked,
      prematureCalls: premature,
      blockRate: (blocked / total * 100).toFixed(1) + '%',
      averageExchangesBeforeCall: this.calculateAverage('exchangeCount')
    };
  }
}

interface ToolCallEvent {
  name: string;
  args: any;
  state: ConversationState;
  validation: ValidationResult;
  executed: boolean;
  timestamp: number;
}
```

---

## 📊 EXPECTED BEHAVIOR WITH THIS SYSTEM

### Before (Prompt-Only):
- ❌ Tool calls after 1 exchange
- ❌ show_next_card without award_mastery_points
- ❌ Points awarded without evidence
- ❌ Inconsistent between sessions

### After (4-Layer System):
- ✅ Tool calls only after 2+ exchanges (enforced by validation)
- ✅ show_next_card always follows award_mastery_points
- ✅ Points only awarded when evidence detected
- ✅ Consistent behavior (state machine enforces rules)

### Metrics to Track:
```typescript
{
  averageExchangesPerCard: 3.4,      // Target: 3-5
  toolCallBlockRate: 12%,            // % of invalid calls blocked
  prematureProgressionRate: 2%,      // % that moved too fast
  pointsAwardedWithoutEvidence: 0%,  // Should be 0%
  sequenceViolations: 0              // show_next before award_points
}
```

---

## 🚀 IMPLEMENTATION CHECKLIST

- [ ] Implement State Machine class
- [ ] Add Tool Validation layer
- [ ] Configure Forced Function Calling mode
- [ ] Use half-cascade model (not native audio)
- [ ] Add tool calling constraints to prompt
- [ ] Implement Card 0 special handling
- [ ] Add comprehensive logging
- [ ] Set up monitoring dashboard
- [ ] Test with 5-10 kids, log all tool calls
- [ ] Analyze blocked calls to tune validation rules

---

## 🎯 MINIMAL VIABLE IMPLEMENTATION

If you can only do ONE thing, do this:

```typescript
// Simplest robust implementation
let exchangeCount = 0;
let evidenceFound = [];

liveSession.on('user_message', async (msg) => {
  exchangeCount++;
  detectEvidence(msg.text); // Updates evidenceFound
  
  // APPLICATION decides when to progress
  if (exchangeCount >= 3 && evidenceFound.length >= 2) {
    // Force tool calls in sequence
    await forceAwardPoints();
    await forceShowNext();
    
    // Reset for next card
    exchangeCount = 0;
    evidenceFound = [];
  }
});

async function forceAwardPoints() {
  // Don't ask Gemini to call it - YOU call it
  await awardMasteryPoints({
    cardId: currentCard.id,
    points: calculatePoints(),
    celebration: "Nice! You explained that clearly!"
  });
}

async function forceShowNext() {
  // Don't ask Gemini to call it - YOU call it
  await showNextCard();
}
```

**This minimal version:**
- ✅ Removes unpredictability of when tools are called
- ✅ Enforces minimum exchanges
- ✅ Checks for evidence
- ✅ Forces correct sequencing
- ✅ Simple to implement and debug

---

## 💡 KEY INSIGHT

**The fundamental issue:** You're asking an LLM to make procedural decisions (when to call tools) that should be made by application logic.

**The solution:** Use Gemini for what it's good at (conversation, assessment, engagement) and use your application code for what it's good at (state management, validation, sequencing).

**Analogy:** You wouldn't let an LLM decide when to save data to your database based on prompt instructions. You write code to determine that. Tool calling should work the same way.

---

## 📚 Additional Resources

- **Forced Function Calling**: https://ai.google.dev/gemini-api/docs/function-calling/tutorial
- **Live API Docs**: https://ai.google.dev/gemini-api/docs/live-guide
- **Known Issues**: https://github.com/googleapis/python-genai/issues/843
- **Tool Config**: https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/function-calling

---

**Bottom line:** Don't fight Gemini's function calling unreliability. Work around it with application-level state management and validation. Your revised prompt handles the conversation quality; your application code handles the progression logic.

Let me know if you want help implementing any of these layers! 🛸
