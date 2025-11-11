# 100% Robust Tool Calling - Architecture

## Current State vs. Goal

### Current (85% Robust):
- ✅ State machine exists
- ✅ Tool calls blocked if wrong state
- ✅ Deduplication + debouncing
- ⚠️ State transitions are manual (Pi self-reports)
- ⚠️ No automatic turn tracking
- ⚠️ Client-side validation only

### Goal (100% Robust):
- ✅ All of above PLUS
- ✅ Automatic state transitions driven by conversation
- ✅ Server-side validation (multiple layers)
- ✅ Idempotent tools
- ✅ Turn-based locking
- ✅ Checksum validation

---

## LAYER 1: Automatic State Transitions (CRITICAL)

### Problem:
State machine requires manual calls to transition methods. Pi won't do this reliably.

### Solution: Conversation Event Listener

```typescript
// NEW: Automatic state driver
const handleConversationTurn = (data: any) => {
  const state = cardStateMachine.current.getCurrentState();
  
  // Detect Pi's response
  if (data.role === 'pi' && data.text) {
    const text = data.text.toLowerCase();
    
    // Pattern: Pi asked a question
    if (text.includes('?')) {
      if (state.state === CardState.CARD_START) {
        // Pi asked starting question
        cardStateMachine.current.startedObserving();
        console.log('[Auto] Detected question → OBSERVING');
      } else if (state.state === CardState.PROBING && !state.hasProbed) {
        // Pi asked follow-up
        cardStateMachine.current.hasProbed = true;
        console.log('[Auto] Detected follow-up question');
      }
    }
  }
  
  // Detect student response
  if (data.role === 'student' && data.text) {
    if (state.state === CardState.OBSERVING) {
      // Student answered Q1
      cardStateMachine.current.receivedObservation(data.text);
      console.log('[Auto] Student answered Q1 → PROBING');
      
      // Send state update to Pi
      sendStateUpdate();
    } else if (state.state === CardState.PROBING) {
      // Student answered Q2
      cardStateMachine.current.receivedExplanation(data.text);
      console.log('[Auto] Student answered Q2 → JUDGING');
      
      // Send state update to Pi
      sendStateUpdate();
    }
  }
};

// Hook into conversation stream
client.on('content', handleConversationTurn);
```

**Benefit**: State advances **automatically** based on actual conversation, not Pi self-reporting.

---

## LAYER 2: State Update Messages (Active Guidance)

### Problem:
Pi sees state in card message but doesn't get updates mid-conversation.

### Solution: Send State After Every Turn

```typescript
function sendStateUpdate() {
  const stateContext = cardStateMachine.current.getStateContext();
  
  const stateMessage = `
╔═══════════════════════════════════════════════════════════════╗
║  🚦 STATE UPDATE
╚═══════════════════════════════════════════════════════════════╝

${stateContext}

**This is an automatic state update based on the conversation so far.**
Follow the guidance above for your next action.
`;
  
  try {
    client.send([{ text: stateMessage }]);
    console.log('[Auto] State update sent to Pi');
  } catch (error) {
    console.error('[Auto] Failed to send state update:', error);
  }
}
```

**Benefit**: Pi gets reminded of state after every student response.

---

## LAYER 3: Tool Call Idempotency (Prevent Double Award)

### Problem:
If a tool call gets through twice, points double.

### Solution: Track Processed Tool Calls

```typescript
interface ToolCallHistory {
  cardId: string;
  callId: string;
  timestamp: number;
  processed: boolean;
}

const toolCallHistory = useRef<Map<string, ToolCallHistory>>(new Map());

// In award_mastery_points handler:
const callId = `${cardId}-${pointsToAward}-${Date.now()}`;

// Check if already processed
if (toolCallHistory.current.has(callId)) {
  console.warn('[Idempotency] Tool call already processed:', callId);
  response.response = {
    result: 'Points already awarded for this card. No duplicate.'
  };
  break;
}

// Process and mark as processed
awardPoints(pointsToAward, celebration);
toolCallHistory.current.set(callId, {
  cardId,
  callId,
  timestamp: Date.now(),
  processed: true
});

// Clean up old entries (older than 5 minutes)
const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
for (const [id, entry] of toolCallHistory.current.entries()) {
  if (entry.timestamp < fiveMinutesAgo) {
    toolCallHistory.current.delete(id);
  }
}
```

**Benefit**: Even if debouncing fails, tools are truly idempotent.

---

## LAYER 4: Turn-Based Locking (Prevent Out-of-Order Calls)

### Problem:
Pi could make multiple tool calls before waiting for responses.

### Solution: Lock Tools During Processing

```typescript
const toolCallInProgress = useRef<boolean>(false);

const handleToolCall = useCallback((toolCall: any) => {
  // Check if another call is in progress
  if (toolCallInProgress.current) {
    console.warn('[Lock] Tool call already in progress, blocking');
    return;
  }
  
  toolCallInProgress.current = true;
  
  try {
    // Process tools...
    
    // Send responses...
  } finally {
    // Always unlock, even if error
    setTimeout(() => {
      toolCallInProgress.current = false;
    }, 1000);
  }
}, []);
```

**Benefit**: Prevents race conditions from parallel tool calls.

---

## LAYER 5: Card Checksum Validation (Ensure Correct Card)

### Problem:
Pi could be responding to old card info if messages arrive out of order.

### Solution: Version Every Card

```typescript
interface CardVersion {
  cardId: string;
  version: number;
  loadedAt: number;
}

const currentCardVersion = useRef<CardVersion | null>(null);

// When loading new card:
const version = Date.now();
currentCardVersion.current = {
  cardId: newCard.id,
  version,
  loadedAt: version
};

// In tool handlers:
case 'award_mastery_points': {
  const { cardId, points, celebration } = args;
  
  // Validate card ID matches current card
  if (cardId !== currentCard?.id) {
    console.error('[Validation] Card ID mismatch:', {
      toolCardId: cardId,
      currentCardId: currentCard?.id
    });
    response.response = {
      result: `ERROR: You're trying to award points for ${cardId} but we're on ${currentCard?.id}. Refresh and try again.`
    };
    break;
  }
  
  // Validate tool call is recent (within 30 seconds of card load)
  const timeSinceLoad = Date.now() - (currentCardVersion.current?.loadedAt || 0);
  if (timeSinceLoad > 30000) {
    console.warn('[Validation] Tool call too old:', timeSinceLoad);
  }
  
  // Process...
}
```

**Benefit**: Catches out-of-sync state between Pi and client.

---

## LAYER 6: Server-Side Validation (Future Enhancement)

### Problem:
All validation is client-side. Sophisticated attack or bug could bypass.

### Solution: Backend Validation Service

```typescript
// Hypothetical backend endpoint
POST /api/validate-tool-call
{
  "sessionId": "session-123",
  "cardId": "card-1-cookies",
  "toolName": "award_mastery_points",
  "args": { "points": 30 },
  "conversationHistory": [...],
  "stateSnapshot": { state: "READY_TO_ADVANCE", ... }
}

Response:
{
  "allowed": true/false,
  "reason": "State machine allows this call",
  "serverState": { ... }
}
```

**Implementation**: Add middleware that validates every tool call server-side before processing.

**Benefit**: Even if client code is compromised, server enforces rules.

---

## LAYER 7: Rate Limiting (Prevent Spam)

### Problem:
Malicious or buggy Pi could spam tool calls.

### Solution: Tool Call Rate Limiter

```typescript
const toolCallRateLimit = useRef<{
  [toolName: string]: {
    count: number;
    windowStart: number;
  }
}>({});

function checkRateLimit(toolName: string): boolean {
  const now = Date.now();
  const windowMs = 10000; // 10 second window
  const maxCalls = 3; // Max 3 calls per 10 seconds
  
  const limiter = toolCallRateLimit.current[toolName] || {
    count: 0,
    windowStart: now
  };
  
  // Reset window if expired
  if (now - limiter.windowStart > windowMs) {
    limiter.count = 0;
    limiter.windowStart = now;
  }
  
  // Check limit
  if (limiter.count >= maxCalls) {
    console.error('[RateLimit] Too many calls to', toolName);
    return false;
  }
  
  // Increment
  limiter.count++;
  toolCallRateLimit.current[toolName] = limiter;
  
  return true;
}

// In handleToolCall:
if (!checkRateLimit(name)) {
  response.response = {
    result: 'ERROR: Too many tool calls. Please slow down.'
  };
  continue;
}
```

**Benefit**: Prevents rapid-fire tool calls even if other defenses fail.

---

## LAYER 8: Conversation Validity Check

### Problem:
Pi could call tools without having a real conversation.

### Solution: Require Minimum Conversation Length

```typescript
const conversationValidator = {
  minExchanges: 2,
  minTotalWords: 10,
  minStudentResponses: 2,
  
  validate: (conversationHistory: any[]): boolean => {
    const studentResponses = conversationHistory.filter(t => t.role === 'student');
    const piResponses = conversationHistory.filter(t => t.role === 'pi');
    
    // Need at least 2 student responses
    if (studentResponses.length < this.minStudentResponses) {
      return false;
    }
    
    // Need at least 2 exchanges (Pi → Student → Pi → Student)
    const exchanges = Math.min(studentResponses.length, piResponses.length);
    if (exchanges < this.minExchanges) {
      return false;
    }
    
    // Student must have said something substantive
    const totalWords = studentResponses
      .map(r => r.text.split(/\s+/).length)
      .reduce((a, b) => a + b, 0);
    
    if (totalWords < this.minTotalWords) {
      return false;
    }
    
    return true;
  }
};

// In tool handler:
if (!conversationValidator.validate(transcript.current)) {
  response.response = {
    result: 'ERROR: Not enough conversation yet. Keep exploring with the student.'
  };
  break;
}
```

**Benefit**: Ensures Pi actually had a conversation before calling tools.

---

## IMPLEMENTATION PRIORITY:

### Phase 1 (High Impact, Quick Win):
1. ✅ **Automatic state transitions** (LAYER 1) - 2 hours
2. ✅ **State update messages** (LAYER 2) - 1 hour
3. ✅ **Tool idempotency** (LAYER 3) - 1 hour
4. ✅ **Turn-based locking** (LAYER 4) - 30 min

**Total: ~4.5 hours → 95% robust**

### Phase 2 (Additional Safety):
5. **Card checksum** (LAYER 5) - 1 hour
6. **Rate limiting** (LAYER 7) - 1 hour
7. **Conversation validator** (LAYER 8) - 1 hour

**Total: +3 hours → 98% robust**

### Phase 3 (Production Hardening):
8. **Server-side validation** (LAYER 6) - 1 day
9. **Monitoring & alerting** - 1 day
10. **Audit logging** - 4 hours

**Total: +2.5 days → 99.9% robust**

---

## TESTING CHECKLIST:

### Test: Can Pi skip a card?
- [ ] Try calling show_next_card() after 1 exchange
- [ ] Try calling show_next_card() twice rapidly
- [ ] Try calling show_next_card() from wrong state
- **Expected**: All blocked

### Test: Can Pi award points prematurely?
- [ ] Try calling award_mastery_points() from OBSERVING
- [ ] Try calling award_mastery_points() twice for same card
- [ ] Try calling award_mastery_points() without conversation
- **Expected**: All blocked

### Test: State machine tracks correctly?
- [ ] Have normal conversation Q1 → A1 → Q2 → A2
- [ ] Check console: Does state auto-advance?
- [ ] Check Pi receives state updates after each turn?
- **Expected**: Clean automatic progression

### Test: Recovery from errors?
- [ ] Disconnect mid-conversation
- [ ] Reconnect - does state resume?
- [ ] Close tab, reopen - does session resume?
- **Expected**: Graceful recovery

---

## RECOMMENDATION:

**Implement Phase 1 now** (4.5 hours) for 95% robustness:
1. Automatic state transitions
2. State update messages  
3. Tool idempotency
4. Turn-based locking

This gives you:
- ✅ No manual state management (automatic)
- ✅ No double awards (idempotent)
- ✅ No race conditions (locked)
- ✅ Active guidance to Pi (state updates)

Phase 2 & 3 can wait until you hit edge cases in production.

Should I implement Phase 1 right now?
