# Fix: Connection Loss When Switching Cards

## Problem
After implementing the simplified prompt, the Vite dev server was crashing with "connection lost" when switching cards. The tool call would get suspended.

## Root Cause
The `useEffect` that builds the config had `currentCard` in its dependencies:

```typescript
useEffect(() => {
  const systemPrompt = getSimplifiedSystemPrompt(currentCard, ...);
  setConfig(config);
}, [currentCard, ...other deps]); // ❌ Runs every time card changes!
```

**Why this broke:**
1. When `show_next_card()` is called, `currentCard` changes
2. The useEffect sees the change and calls `setConfig()` with a new system prompt
3. **Gemini Live API doesn't support changing system prompts mid-session**
4. Trying to reconfigure an active session caused the connection to break

## Solution
**Static system prompt + Dynamic context messages**

### 1. Config Set Once Per Session ✅
```typescript
useEffect(() => {
  // Build INITIAL system prompt
  const systemPrompt = getSimplifiedSystemPrompt(...);
  setConfig(config);
}, [studentName, sessionId, setConfig]); // ✅ Only runs once when session starts
```

### 2. Card Changes Sent as Context Messages ✅
When `show_next_card()` is called:

```typescript
case 'show_next_card': {
  nextCard();
  const { currentCard: newCard } = useSessionStore.getState();
  
  // Send new card info as a text message, not a config update
  const cardContext = `
  NEW CARD: ${newCard.title}
  WHAT YOU SEE: ${newCard.imageDescription}
  MASTERY CRITERIA: ...
  `;
  
  client.send([{ text: cardContext }]); // ✅ Mid-session context update
}
```

### 3. Initial Card Sent After Connection ✅
```typescript
useEffect(() => {
  if (currentCard && client?.status === 'connected' && sessionId) {
    // Send first card context after connection establishes
    client.send([{ text: cardContext }]);
  }
}, [client?.status, sessionId]); // ✅ Runs once when connected
```

## Result
✅ System prompt set once at session start
✅ Card info sent as context messages during session  
✅ Connection stays stable when switching cards
✅ No more crashes or suspensions

## Key Insight
**Gemini Live API**:
- System prompt = Set at connection time, immutable
- Context updates = Send as regular messages during session

We were trying to update an immutable field, which broke the connection. Now we send card changes as dynamic context, which works perfectly.

## Files Modified
1. `src/App.tsx` - Config useEffect dependencies, card context sending
2. `src/hooks/media/use-live-api.ts` - Removed initial "start" trigger
