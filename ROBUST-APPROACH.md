# Robust Approach for Kid Testing

## Problem
Current system is fragile - "something or the other keeps failing"

## Root Issues
1. **Too many moving parts** - Context messages, scoring, tool sequences
2. **No error handling** - When something fails, everything stops
3. **Complex state management** - Cards, points, levels, connection state
4. **Dependency on Pi's judgment** - Scoring system needs Pi to be perfect
5. **Fragile connection** - One hiccup and session is lost

## Bulletproof Solution

### Approach 1: Static Everything (Recommended)
**Make the entire session config static at start**

```typescript
// At session start, build ONE prompt with ALL 9 cards
const systemPrompt = `
You are Pi. Here are ALL 9 cards you'll go through:

CARD 0: Welcome...
CARD 1: Four cookies (image: ..., goal: ..., criteria: ...)
CARD 2: Brownie (image: ..., goal: ..., criteria: ...)
...
CARD 8: Misconception (image: ..., goal: ..., criteria: ...)

Start with card 0. When done, call show_next_card() and move to card 1.
When you call show_next_card(), I'll tell you which card you're on now.
`;

// Never update config again
// Card changes via tool response only
```

**Benefits:**
- ✅ No context messages failing
- ✅ No mid-session config changes
- ✅ Everything known upfront
- ✅ Pi can see the full arc

### Approach 2: Fallback Mode
**If Gemini API acts up, fall back to text-only**

```typescript
// Detect if connection is unstable
if (consecutiveFailures > 2) {
  // Switch to text chat mode
  setMode('text');
  // Show typed interface instead of voice
}
```

### Approach 3: Simplify Scoring
**Remove 1-5 scale, just binary**

```
Did they get it? Yes/No
- Yes → Award points, next card
- No → One follow-up, then move on
```

Less room for Pi to be uncertain.

### Approach 4: Auto-Recovery
**Handle every error gracefully**

```typescript
// Tool call timeout
setTimeout(() => {
  if (!toolCalled) {
    // Auto-advance after 30s
    nextCard();
  }
}, 30000);

// Connection drop
client.on('close', () => {
  // Save state
  // Show "reconnecting..." UI
  // Auto-reconnect with session token
});
```

### Approach 5: Manual Override
**Give teacher/parent control**

```
Add UI buttons:
- [Next Card] - Force advance if stuck
- [Award Points] - Manual point control
- [Skip Card] - Jump ahead
- [Reset] - Start over
```

## Recommended Implementation

**Phase 1: Stabilize Connection**
1. ✅ Static config (done)
2. ✅ Context messages for cards (done)
3. 🔄 Add connection retry logic
4. 🔄 Add tool call timeouts

**Phase 2: Error Handling**
1. Try/catch around all tool handlers
2. Fallback responses if tools fail
3. Auto-advance after timeout
4. Show error states in UI

**Phase 3: Simplify**
1. Remove 1-5 scoring → Binary (got it / didn't)
2. Remove complex verification → Trust Pi's first judgment
3. Reduce prompt size → Only essentials

**Phase 4: Safety Net**
1. Manual override buttons
2. Session state persistence
3. Auto-reconnect logic
4. Graceful degradation

## Quick Wins (Do These Now)

### 1. Add Tool Call Timeout
```typescript
const toolCallTimeout = setTimeout(() => {
  console.warn('Tool call timeout - auto-advancing');
  nextCard();
}, 30000); // 30 seconds

// Clear on successful tool call
```

### 2. Add Error Boundaries
```typescript
try {
  client.send(...)
} catch (error) {
  console.error('Send failed:', error);
  // Show user-friendly error
  // Continue session
}
```

### 3. Add Connection Monitor
```typescript
const heartbeat = setInterval(() => {
  if (client.status !== 'connected') {
    attemptReconnect();
  }
}, 5000);
```

### 4. Simplify Prompt
Remove:
- Long examples
- Complex scoring rubric
- Multiple instruction layers

Keep:
- Card info
- Simple decision rule: "Got it? Award points and next card. Didn't get it? Ask once more, then next card."

## What to Test First

1. **Connection stability** - Can you go through all 9 cards without dropping?
2. **Tool reliability** - Do all tool calls succeed?
3. **Error recovery** - If something breaks, does it recover?
4. **User experience** - Can a kid actually use this without help?

## Decision Needed

Which approach should we implement?
1. Keep current (context messages) + add error handling?
2. Go fully static (all cards in one prompt)?
3. Add manual override buttons?
4. All of the above?
