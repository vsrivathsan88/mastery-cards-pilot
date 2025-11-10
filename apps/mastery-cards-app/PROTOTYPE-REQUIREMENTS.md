# Mastery Cards Prototype Requirements

## Overview
A voice-first flashcard review app using Gemini Live API for real-time voice interaction with swipe gestures to indicate mastery levels.

## Core User Experience

### Student Flow
1. **Launch**: Student enters their name
2. **Session Start**: Click "Start Voice Session" button
3. **Card Review**: 
   - Pi (voice agent) reads the card question/prompt aloud
   - Student responds verbally
   - Pi provides feedback (correct/encouragement/hints)
4. **Swipe Decision**:
   - Student swipes **RIGHT** → "I know this well" (card mastered)
   - Student swipes **LEFT** → "I need more practice" (card for review)
5. **Session Complete**: Review stats and mastery levels

### Voice Interaction Pattern
```
Pi: "Let's review counting! Can you count from 1 to 5?"
Student: "One, two, three, four, five!"
Pi: "Perfect! That was excellent counting. You got all five numbers in order!"
Student: [swipes right]
Pi: "Great! Moving on to the next card..."
```

## Technical Requirements

### 1. Gemini Live Connection (PRIORITY 1)
**Must Work:**
- ✅ Stable WebSocket connection with Gemini Live API
- ✅ Voice-to-voice mode (audio input → audio output)
- ✅ Real-time bidirectional audio streaming
- ✅ Connection stays open throughout session (no premature closes)

**Configuration:**
```typescript
{
  responseModalities: [Modality.AUDIO],
  speechConfig: {
    voiceConfig: {
      prebuiltVoiceConfig: {
        voiceName: 'Puck'  // Friendly, encouraging voice
      }
    }
  },
  inputAudioTranscription: {},   // For debugging/eval
  outputAudioTranscription: {},  // For debugging/eval
  systemInstruction: {
    parts: [{ text: CARDS_SYSTEM_PROMPT }]
  },
  tools: [
    {
      functionDeclarations: [
        { name: 'swipe_right', description: 'Student knows this card well' },
        { name: 'swipe_left', description: 'Student needs more practice' }
      ]
    }
  ]
}
```

### 2. Audio I/O (PRIORITY 1)
**Required:**
- Microphone input → Gemini Live (streaming PCM16 audio)
- Gemini Live output → Speaker playback (AudioStreamer)
- Volume meter visualization (optional but nice)
- Push-to-talk OR continuous listening (start with continuous)

**From tutor-app, we need:**
- `lib/audio-streamer.ts` - Handles audio output playback
- `lib/audio-recorder.ts` - Handles microphone capture
- `lib/worklets/vol-meter.ts` - Volume visualization

### 3. Card Data Structure
```typescript
interface MasteryCard {
  id: string;
  type: 'counting' | 'phonics' | 'addition' | 'sight-words' | 'shapes';
  question: string;          // What Pi asks
  expectedResponse: string;  // What we're listening for
  hints?: string[];          // Progressive hints if student struggles
  masteryLevel: 0 | 1 | 2;  // 0=new, 1=learning, 2=mastered
  lastReviewed?: Date;
  timesCorrect: number;
  timesReviewed: number;
}
```

### 4. Tool Handlers (PRIORITY 2)
Pi can call these tools via Gemini Live function calling:

**`swipe_right(cardId: string, confidence: string)`**
- Mark card as mastered (masteryLevel = 2)
- Log to debug panel for eval
- Move to next card

**`swipe_left(cardId: string, reason: string)`**
- Keep card in review pool (masteryLevel stays 0 or 1)
- Log reason for later analysis
- Move to next card

**Implementation:**
```typescript
client.on('toolcall', (toolCall) => {
  for (const fc of toolCall.functionCalls) {
    if (fc.name === 'swipe_right') {
      const { cardId, confidence } = fc.args;
      markCardMastered(cardId);
      moveToNextCard();
    } else if (fc.name === 'swipe_left') {
      const { cardId, reason } = fc.args;
      keepCardInReview(cardId, reason);
      moveToNextCard();
    }
  }
  client.sendToolResponse({ functionResponses });
});
```

### 5. System Prompt (PRIORITY 2)
**Pi's Role:**
- Encouraging tutor for young learners (K-2)
- Reads card questions clearly
- Listens to student responses
- Provides immediate feedback (positive reinforcement)
- Calls `swipe_right` or `swipe_left` based on student performance
- Moves conversation forward smoothly

**Prompt Template:**
```
You are Pi, a friendly and encouraging tutor helping a {grade} student review {subject}.

INTERACTION PATTERN:
1. Read the current card question aloud clearly
2. Wait for student to respond verbally
3. Provide encouraging feedback on their answer
4. Decide if they've mastered this card (call swipe_right or swipe_left)
5. Move to next card

CURRENT CARD:
{card.question}

Expected: {card.expectedResponse}

TOOLS:
- swipe_right: Student demonstrated mastery, move on
- swipe_left: Student needs more practice with this card

Be warm, patient, and celebrate every effort!
```

### 6. UI Components (PRIORITY 3)

**Minimal MVP UI:**
- Name prompt (one-time)
- Connection status indicator (green = connected, red = disconnected)
- Start/Stop voice session button
- Current card display (visual only, Pi reads it aloud)
- Session stats (cards reviewed, mastery count)
- Debug panel (for eval: transcripts, tool calls, timing)

**NOT needed for MVP:**
- Manual swipe gestures (Pi handles swiping via tools)
- Progress bars
- Fancy animations
- Settings panel

### 7. Session Flow (PRIORITY 2)

```typescript
// 1. Initialize session
function startSession(studentName: string) {
  const cards = generateSessionCards(studentName, 10); // 10 cards per session
  sessionStore.init(studentName, cards);
}

// 2. Setup Gemini Live config with system prompt
function buildLiveConfig(currentCard: MasteryCard) {
  return {
    responseModalities: [Modality.AUDIO],
    speechConfig: { /* voice config */ },
    systemInstruction: {
      parts: [{ text: generateCardPrompt(currentCard) }]
    },
    tools: [{ functionDeclarations: SWIPE_TOOLS }]
  };
}

// 3. Connect and start interaction
await client.connect(config);
// Pi automatically starts talking based on system prompt

// 4. Handle tool calls to progress through cards
client.on('toolcall', handleCardToolCalls);

// 5. End session when all cards reviewed
if (allCardsReviewed) {
  showSessionSummary();
  client.disconnect();
}
```

## What We're Copying from tutor-app

### Core Infrastructure (Keep As-Is)
- ✅ `contexts/LiveAPIContext.tsx` - Context provider
- ✅ `hooks/media/use-live-api.ts` - Main hook (simplified)
- ✅ `lib/genai-live-client.ts` - GenAI client wrapper
- ✅ `lib/audio-streamer.ts` - Audio output
- ✅ `lib/audio-recorder.ts` - Audio input
- ✅ `lib/worklets/vol-meter.ts` - Volume meter
- ✅ `lib/audioworklet-registry.ts` - Worklet loading

### What We're Removing/Replacing
- ❌ Lesson system → Card generator
- ❌ Multi-agent orchestrator → Simple card progression
- ❌ Pedagogy engine → Mastery tracking
- ❌ Canvas/drawing → Not needed
- ❌ Milestone tracking → Card completion tracking
- ❌ Teacher panel → Debug panel (simpler)

### What We're Adding
- ➕ Card generator (generates 10 review cards per session)
- ➕ Mastery tracking (0/1/2 levels)
- ➕ Swipe tool handlers
- ➕ Session summary stats
- ➕ Card-specific system prompts

## Implementation Phases

### Phase 1: Stable Connection (MUST WORK FIRST)
1. Copy working tutor-app connection code
2. Strip out lesson/agent complexity
3. Verify connection stays open with audio config
4. Test microphone input → audio output loop
5. **Success Criteria**: Can talk to Pi and get voice responses

### Phase 2: Card System
1. Create `MasteryCard` data structure
2. Build card generator (10 cards per session)
3. Session state management
4. Update system prompt with current card
5. **Success Criteria**: Pi reads first card question aloud

### Phase 3: Tool Integration
1. Add `swipe_right` and `swipe_left` tool declarations
2. Implement tool call handlers
3. Card progression logic (move to next after swipe)
4. Update system prompt on card change
5. **Success Criteria**: Pi can progress through all 10 cards

### Phase 4: Session Management
1. Session initialization
2. End-of-session summary
3. Mastery level updates
4. Debug panel for evaluation
5. **Success Criteria**: Complete full 10-card session

### Phase 5: Polish (Nice-to-Have)
1. Better error handling
2. Connection retry logic
3. Audio quality improvements
4. UI polish
5. **Success Criteria**: Smooth, reliable experience

## Success Metrics

### Must Have (MVP)
- ✅ Connection stays open for full 10-card session
- ✅ Student can speak and Pi responds with audio
- ✅ Pi reads each card question
- ✅ Pi calls swipe tools to progress through cards
- ✅ Session completes successfully

### Nice to Have
- Volume visualization works
- Transcripts visible in debug panel
- Session can be paused/resumed
- Error recovery is graceful

## Technical Constraints

1. **No server-side required** - Client-side only (using API key directly)
2. **React 18** with Vite
3. **TypeScript** for type safety
4. **Zustand** for state management (already used)
5. **@google/genai** SDK for Gemini Live
6. **Web Audio API** for audio I/O

## Known Issues to Avoid

### From Current Implementation
- ❌ Re-renders destroying event listeners
- ❌ Config not set before connection
- ❌ Event listener cleanup timing issues
- ❌ Missing audio modality config
- ❌ React StrictMode causing double-mounts

### Solutions (from tutor-app)
- ✅ Clean event listener pattern with proper cleanup
- ✅ Config validation before connect
- ✅ Memoized client instance
- ✅ Proper audio config with Modality.AUDIO array
- ✅ No StrictMode in production

## File Structure (Target)

```
mastery-cards-app/
├── src/
│   ├── main.tsx                        # Entry point with LiveAPIProvider
│   ├── App.tsx                         # Main app component
│   ├── contexts/
│   │   └── LiveAPIContext.tsx          # [FROM tutor-app]
│   ├── hooks/
│   │   └── use-live-api.ts             # [FROM tutor-app, simplified]
│   ├── lib/
│   │   ├── genai-live-client.ts        # [FROM tutor-app]
│   │   ├── audio-streamer.ts           # [FROM tutor-app]
│   │   ├── audio-recorder.ts           # [FROM tutor-app]
│   │   ├── audioworklet-registry.ts    # [FROM tutor-app]
│   │   ├── worklets/
│   │   │   └── vol-meter.ts            # [FROM tutor-app]
│   │   ├── cards/
│   │   │   └── card-generator.ts       # [NEW] Generate review cards
│   │   ├── prompts/
│   │   │   └── cards-system-prompt.ts  # [NEW] Pi's instructions
│   │   └── state/
│   │       ├── session-store.ts        # [NEW] Session state
│   │       └── debug-store.ts          # [NEW] Debug logs
│   └── components/
│       ├── NamePrompt.tsx              # [NEW] Student name
│       ├── ControlTray.tsx             # [NEW] Start/stop controls
│       ├── cards/
│       │   └── MasteryCard.tsx         # [NEW] Card display
│       └── DebugPanel.tsx              # [NEW] Eval/debug view
```

## Next Steps

1. **Copy tutor-app foundation** into mastery-cards-app
2. **Remove** lesson/agent/canvas complexity
3. **Verify** connection works with clean setup
4. **Add** card system on top
5. **Test** full 10-card session flow

---

**Last Updated**: 2025-11-10
**Status**: Ready to rebuild on tutor-app foundation
