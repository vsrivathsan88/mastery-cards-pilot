# 🏗️ MASTERY CARDS APP - ARCHITECTURE ANALYSIS

**Analysis Date:** 2025-11-11
**System:** Dual-LLM Educational Voice App for Young Children
**Target Age:** 8-10 years old (3rd grade)

---

## SYSTEM OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                    MASTERY CARDS APP                         │
│           Agentic Dual-LLM Educational System                │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  FRONTEND (React + TypeScript + Zustand)                     │
│                                                               │
│  Components:                                                  │
│  • NamePrompt → SessionHeader → MasteryCard → LevelUp       │
│  • PiAvatar (static, needs animation)                        │
│                                                               │
│  State Management (Zustand):                                 │
│  • session-store.ts (points, cards, progress)                │
│  • No Redux, clean and simple                                │
│                                                               │
│  Reliability Layer:                                          │
│  • TurnCoordinator (crypto UUIDs, state machine)            │
│  • TemporalGuard (clock skew protection)                     │
│  • CircuitBreaker (API failure protection)                   │
│  • ConnectionWatchdog (zombie detection)                     │
└──────────────────────────────────────────────────────────────┘
                             │
                             │ WebSocket + HTTP
                             ▼
┌──────────────────────────────────────────────────────────────┐
│  GEMINI LIVE API (Real-Time Voice)                          │
│                                                               │
│  • WebSocket streaming (audio in/out)                        │
│  • Native multimodal (sends images directly)                 │
│  • Voice Activity Detection (interruptions)                  │
│  • Auto-transcription                                        │
│                                                               │
│  Pi's Role:                                                   │
│  • Curious alien personality                                 │
│  • Open-ended probing (NO funneling)                         │
│  • NO decision-making about progression                      │
└──────────────────────────────────────────────────────────────┘
                             │
                             │ Conversation history (async)
                             ▼
┌──────────────────────────────────────────────────────────────┐
│  BACKEND PROXY (Express.js)                                  │
│                                                               │
│  Endpoints:                                                   │
│  • POST /api/claude/evaluate (mastery judgment)             │
│  • GET /api/claude/health (connection test)                  │
│                                                               │
│  Why needed:                                                  │
│  • Avoid CORS errors                                         │
│  • Hide Claude API key from frontend                         │
└──────────────────────────────────────────────────────────────┘
                             │
                             │ HTTP POST
                             ▼
┌──────────────────────────────────────────────────────────────┐
│  CLAUDE 4.5 HAIKU (Silent Background Judge)                 │
│                                                               │
│  • Evaluates mastery level (basic/advanced/teaching)        │
│  • Decides: continue | award_and_next | next_without_points │
│  • Awards points based on understanding                      │
│  • NEVER interrupts conversation                             │
│                                                               │
│  Evaluation Criteria:                                        │
│  • Requires 2+ complete exchanges                            │
│  • Looks for reasoning words ("because", "so")               │
│  • Checks for explanation (not just description)             │
└──────────────────────────────────────────────────────────────┘
```

---

## DUAL-LLM INNOVATION

### Why Two LLMs?

**Traditional Approach (Single LLM):**
```
User speaks → LLM responds + evaluates + decides
Problem: LLM tries to funnel child to "correct" answer
```

**Mastery Cards Approach (Dual LLM):**
```
User speaks → Gemini explores (Pi) → Claude judges (silent)
Benefit: Pi stays curious, Claude ensures rigor
```

### Separation of Concerns

| Responsibility | Who | Why |
|---------------|-----|-----|
| Conversation | Gemini (Pi) | Natural voice, fast, multimodal |
| Evaluation | Claude (Judge) | Reasoning, pedagogy, accuracy |
| Orchestration | App | Timing, non-interruption, transitions |

---

## DATA FLOW (Complete Sequence)

### 1. Session Start
```
User enters name
  ↓
startSession() → Generate 9-card deck
  ↓
Card 0 (Welcome) displays
  ↓
TTS welcome message plays
  ↓
User clicks "Start Learning"
  ↓
Create GeminiLiveClient ONE TIME
  ↓
Connect to Gemini Live API (WebSocket)
  ↓
Send system instruction (Pi's personality)
  ↓
Wait for 'ready' event
  ↓
Start audio input (microphone)
  ↓
Move to Card 1 (first learning card)
```

### 2. Learning Loop (Per Card)
```
┌──────────────────────────────────────────┐
│ 1. CARD PRESENTED                         │
│    • Image loads                          │
│    • Pi receives image + learning goal    │
│    • System instruction updated           │
└────────────┬─────────────────────────────┘
             ▼
┌──────────────────────────────────────────┐
│ 2. PI ASKS STARTING QUESTION              │
│    • Gemini generates audio               │
│    • "What do you notice?"               │
│    • Audio streams to browser             │
└────────────┬─────────────────────────────┘
             ▼
┌──────────────────────────────────────────┐
│ 3. CHILD RESPONDS                         │
│    • Mic captures audio                   │
│    • Gemini transcribes                   │
│    • exchangeCount++                      │
└────────────┬─────────────────────────────┘
             ▼
┌──────────────────────────────────────────┐
│ 4. PI PROBES DEEPER                       │
│    • "Tell me more about that"           │
│    • "What makes you think that?"        │
│    • Conversation continues               │
└────────────┬─────────────────────────────┘
             ▼
┌──────────────────────────────────────────┐
│ 5. BACKGROUND EVALUATION (IF ≥2 exchanges)│
│    • Claude receives conversation history │
│    • Analyzes for mastery                 │
│    • Returns decision + points            │
│    • Decision QUEUED (not executed yet)   │
└────────────┬─────────────────────────────┘
             ▼
┌──────────────────────────────────────────┐
│ 6. PI CONTINUES CONVERSATION              │
│    • Child responds again                 │
│    • Conversation flows naturally         │
│    • Pi finishes thought                  │
└────────────┬─────────────────────────────┘
             ▼
┌──────────────────────────────────────────┐
│ 7. TURN COMPLETE                          │
│    • Gemini signals 'turnComplete'        │
│    • App checks for pending decision      │
│    • Validates turnId (not stale)         │
└────────────┬─────────────────────────────┘
             ▼
┌──────────────────────────────────────────┐
│ 8. EXECUTE DECISION                       │
│                                            │
│ If "award_and_next":                      │
│   • awardPoints(points)                   │
│   • Send celebration text (non-interrupt) │
│   • Wait 2 seconds                        │
│   • nextCard()                            │
│                                            │
│ If "continue":                            │
│   • Loop back to step 3                   │
│   • Keep exploring                        │
│                                            │
│ If "next_without_points":                 │
│   • Student struggled, move on            │
│   • No points awarded                     │
└────────────┬─────────────────────────────┘
             ▼
        (Next card or session end)
```

---

## RELIABILITY ARCHITECTURE

### 8 Production-Grade Controls

#### 1. TurnCoordinator
**Purpose:** Prevents race conditions, stale decisions

```typescript
Turn Lifecycle:
  create() → active → evaluating → complete
                   ↘ interrupted → stale

Validations:
  • isCurrentTurn(turnId) - Check if still valid
  • Crypto UUID generation - No collisions
  • 15-second evaluation timeout
  • Pending turns map - Support interruptions
```

**Example Flow:**
```
User speaks (turn_abc)
  ↓
startEvaluation(turn_abc) → status: evaluating
  ↓
Claude responds in 2s
  ↓
Decision queued for turn_abc
  ↓
User interrupts (creates turn_xyz)
  ↓
turn_abc marked as 'interrupted'
  ↓
turnComplete for turn_abc
  ↓
isCurrentTurn(turn_abc) → false (stale)
  ↓
Decision discarded (correct!)
```

#### 2. TemporalGuard
**Purpose:** Protects against clock skew

```typescript
Features:
  • Track clock offset
  • Detect backward jumps > 5s
  • Auto-calibrate every 60s
  • All timestamps use calibrated time

Math:
  realTime = Date.now() + clockOffset

  if (systemTime < lastSystemTime) {
    clockOffset += difference
  }
```

**Example:**
```
System time: 10:00:00
App starts: offset = 0

User changes clock to 9:59:50 (back 10s)
  ↓
Next calibration detects jump
  ↓
offset = +10000ms
  ↓
All future timestamps adjusted
```

#### 3. CircuitBreaker
**Purpose:** Prevent cascading API failures

```typescript
States:
  CLOSED (normal) →[3 failures in 60s]→ OPEN →[wait 30s]→ HALF-OPEN
                                           ↓
                                      [success]
                                           ↓
                                    CLOSED (with jitter)

Jitter:
  • Random 0-5s delay before closing
  • Prevents thundering herd
  • Staggers recovery load
```

**Example:**
```
Claude API goes down
  ↓
Failure 1 → state: closed
Failure 2 → state: closed
Failure 3 → state: OPEN (circuit opens)
  ↓
All future requests → immediate fallback
  ↓
Wait 30 seconds
  ↓
state: HALF-OPEN (test one request)
  ↓
Success? → Wait random 0-5s → state: CLOSED
Failure? → state: OPEN again
```

#### 4. ConnectionWatchdog
**Purpose:** Detect zombie connections

```typescript
Monitoring:
  • Tracks lastActivityTime
  • Checks every 5 seconds
  • Timeout: 15 seconds

Flow:
  ping() called on every message

  if (now - lastActivityTime > 15000) {
    onStale() // Trigger reconnection
  }
```

#### 5. Heartbeat System
**Purpose:** Bi-directional keepalive

```typescript
Every 30 seconds:
  1. waitingForPong = true
  2. Send empty message to Gemini
  3. Wait 5 seconds
  4. If still waitingForPong → reconnect()

Any message received:
  waitingForPong = false
```

#### 6. Transition Lock
**Purpose:** Prevent spam clicking

```typescript
const [isTransitioning, setIsTransitioning] = useState(false);

if (!isTransitioning) {
  setIsTransitioning(true);
  setTimeout(() => {
    nextCard();
    setTimeout(() => setIsTransitioning(false), 1000);
  }, 2000);
}
```

#### 7. Memory Management
**Purpose:** Prevent unbounded growth

```typescript
Pruning:
  • Conversation history: Max 100 exchanges
  • Turn history: Max 50 turns
  • Pending turns: Remove if > 30s old

Auto-prune after every add:
  if (history.length > MAX) {
    history = history.slice(-MAX)
  }
```

#### 8. Reconnection Strategy
**Purpose:** Recover from connection loss

```typescript
Exponential backoff:
  Attempt 1: 1 second
  Attempt 2: 2 seconds
  Attempt 3: 4 seconds
  Attempt 4: 8 seconds
  Attempt 5: 10 seconds (max)

  After 5 attempts → emit permanentFailure
```

---

## STATE MANAGEMENT (Zustand)

```typescript
SessionStore {
  // Identity
  studentName: string | null
  sessionId: string | null

  // Cards
  currentCardIndex: number
  currentCard: MasteryCard | null
  cardsInDeck: MasteryCard[] (9 cards)

  // Progress
  cardsReviewed: number
  masteredToday: string[]
  needsPractice: string[]

  // Gamification
  points: number
  streak: number
  currentLevel: Level

  // Timing
  sessionStartTime: number
  currentCardStartTime: number
}

Operations:
  • startSession(name, cards) - Initialize
  • nextCard() - Progress (linear, no loops)
  • awardPoints(amount) - Add points, check level-up
  • masteredCard(cardId) - Track success
  • needsPracticeCard(cardId) - Track struggle
  • endSession() - Generate summary
```

---

## CARD PROGRESSION SYSTEM

### Card Data
```typescript
MasteryCard {
  cardNumber: number
  title: string
  imageUrl: string
  imageDescription: string (for Pi)
  learningGoal: string
  piStartingQuestion: string

  // Mastery tracking
  milestones: {
    basic: { description, points }
    advanced?: { description, points }
    teaching?: { description, points } // Misconception cards
  }

  misconception?: {
    piWrongThinking: string
    wrongBecause: string
  }
}
```

### 9 Cards in MVP Deck
```
Card 0: Welcome (0 pts, auto-advance)
Card 1: Equal Cookies (30 pts basic)
Card 4: Brownie Halves (50 basic + 30 advanced = 80 max)
Card 7: Half Ribbon (40 pts)
Card 8: Third Pancake (40 pts)
Card 10: Five Sixths Pizza (50 basic + 40 advanced = 90 max)
Card 11: Three Fourths Garden (50 pts)
Card 13: Misconception - Bigger Denominator (50 + 100 = 150 max)
Card 14: Misconception - Unequal Parts (50 + 100 = 150 max)

Total possible: 620 points
```

### Level System
```
Level 1: Explorer (0-99 pts) - "Just getting started!"
Level 2: Discoverer (100-249 pts) - "You're catching on!"
Level 3: Pattern Finder (250-499 pts) - "You see connections!"
Level 4: Fraction Master (500+ pts) - "You're a master!"
```

---

## EVALUATION LOGIC (Claude Judge)

### When Evaluation Happens
```typescript
Conditions:
  1. exchangeCount >= 2 (minimum conversation)
  2. !evaluating (not already evaluating)
  3. Client is connected
  4. Circuit not open

Timing:
  • Runs ASYNC (doesn't block conversation)
  • Decision queued for later execution
  • Executed only after Pi finishes (turnComplete)
```

### Evaluation Prompt Structure
```typescript
Context sent to Claude:
  • Card learning goal
  • Card milestones (basic/advanced/teaching)
  • Full conversation history (student + Pi)
  • Number of exchanges

Evaluation criteria:
  • Has student EXPLAINED (not just described)?
  • Used reasoning words? ("because", "so", "if")
  • Demonstrated understanding vs memorization?
  • Short "I don't know" → not ready
  • Silence/confusion → not ready
```

### Response Format
```typescript
{
  ready: boolean,
  confidence: number (0-100),
  masteryLevel: 'none' | 'basic' | 'advanced' | 'teaching',
  reasoning: string (1 sentence),
  suggestedAction: 'continue' | 'award_and_next' | 'next_without_points',
  points?: number (if ready)
}
```

### Decision Execution
```typescript
App receives Claude decision:
  1. Queue decision with turnId
  2. Wait for 'turnComplete' from Gemini
  3. Validate turnId is still current
  4. Execute decision:

  award_and_next:
    • awardPoints(points)
    • Send celebration text to Pi (non-interrupt)
    • Wait 2 seconds
    • nextCard()

  continue:
    • Keep conversation going
    • No action needed

  next_without_points:
    • Student struggled (5+ exchanges)
    • Move to next card
    • No points awarded
```

### Fallback Strategy
```typescript
If Claude API fails (circuit open):
  if (exchangeCount >= 3) {
    return { suggestedAction: 'next_without_points' }
  } else {
    return { suggestedAction: 'continue' }
  }
```

---

## PI'S PERSONALITY (System Instruction)

### Core Identity
```
"You're an enthusiastic alien from Planet Geometrica
studying how Earth kids think about fractions."
```

### Communication Style
- **1-2 sentences per turn** (short attention span)
- **Everyday words** (no jargon)
- **Think out loud together** (collaborative)
- **Conversational** ("Whoa!", "Tell me more!", "Hmm...")

### Critical Rules

**❌ NEVER Do:**
- Funnel to specific answers
- Use yes/no questions
- Give away answers
- Teach or explain concepts
- Reference other cards

**✅ ALWAYS Do:**
- Ask open-ended questions
- Probe deeper ("Tell me more", "Why?")
- Stay curious, not pushy
- Focus on THIS image only
- Let child do 80% of talking

### Example Comparison

**BAD (Funneling):**
```
Pi: What do you notice?
Kid: Four cookies
Pi: Are they the same size? ← LEADING
Kid: Yeah
Pi: If four people, how many each? ← FUNNELING
Kid: One?
Pi: Yes! That's 1/4, a fraction! ← GAVE AWAY
```

**GOOD (Open Exploration):**
```
Pi: What do you notice?
Kid: Four cookies
Pi: Tell me more about them
Kid: They're all the same
Pi: Same how?
Kid: Same size, so it's fair if we share
Pi: Why fair?
Kid: Nobody gets more
Pi: Ohhh! So equal size means...
Kid: Everyone gets the same!
```

---

## TIMING & SYNCHRONIZATION

### Critical Timing Flow
```
User speaks
  ↓
Transcript received
  ↓
exchangeCount++
  ↓
If ≥2: evaluateMastery() ASYNC
  ↓                         ↓
Pi continues              Claude
speaking                  evaluates
  ↓                         ↓
[Decision queued]       [Returns decision]
  ↓
Pi finishes
  ↓
'turnComplete' event
  ↓
Check pendingDecision
  ↓
Validate turnId
  ↓
Execute decision
```

**Key Insight:** Evaluation happens DURING conversation, execution happens AFTER Pi finishes.

### Why Non-Interruption Matters
```
Wrong approach (interrupts):
  Pi: "So what do you think ab—"
  App: "Great job! Here's 50 points!"
  (Pi's sentence cut off)

Correct approach (waits):
  Pi: "So what do you think about those equal parts?"
  [Decision queued]
  Pi: [finishes speaking]
  'turnComplete' event
  App: "Great job! Here's 50 points!"
```

---

## AUDIO PIPELINE

### Input (Microphone → Gemini)
```
Microphone (browser getUserMedia)
  ↓
AudioContext (16kHz, mono, 1 channel)
  ↓
MediaStreamSource
  ↓
AudioWorkletNode (new, replaces ScriptProcessorNode)
  ↓
Float32 PCM
  ↓
Convert to PCM16 (Int16Array)
  ↓
Base64 encode
  ↓
WebSocket send to Gemini
```

**Recent Fix:** Replaced deprecated ScriptProcessorNode with AudioWorkletNode

### Output (Gemini → Speaker)
```
Gemini WebSocket
  ↓
Base64 audio chunks (PCM16)
  ↓
Base64 decode → ArrayBuffer
  ↓
AudioStreamer (custom class)
  ↓
PCM16 → Float32 conversion
  ↓
AudioContext (24kHz)
  ↓
Browser speakers
```

---

## CURRENT GAPS & WEAKNESSES

### 🔴 Critical Gaps
1. **No React Error Boundary** - Uncaught errors crash app
2. **No evaluation feedback** - 2-15s silent period (child thinks it's frozen)
3. **No mic permission UI** - Permission denied = silent failure
4. **No progress persistence** - Refresh = lose everything

### 🟡 High-Impact UX Gaps
5. **No animated Pi avatar** - Static, no speaking indicator
6. **No sound effects** - Points/level-up silent
7. **Welcome audio lock** - Can't skip intro
8. **No "your turn" prompt** - Child doesn't know to speak

### 🟢 Nice-to-Have Improvements
9. **No session summary** - No closure or parent visibility
10. **No image loading states** - Blank if image fails
11. **No accessibility** - No keyboard nav, ARIA labels
12. **No testing** - Zero unit/E2E tests

---

## STRENGTHS

### ✅ Technical Excellence
- 8 production-grade reliability controls
- Comprehensive edge case handling
- Auto-recovery from failures
- Memory leak prevention
- Clock skew protection

### ✅ Pedagogical Innovation
- Dual-LLM architecture (conversation ≠ judgment)
- Open-ended exploration (no funneling)
- Mastery-based progression
- Misconception cards (teach Pi)
- Multimodal learning (image + voice)

### ✅ Clean Architecture
- Zustand (simple state management)
- TypeScript (type safety)
- Modular reliability controls
- Separation of concerns

---

## RECOMMENDED NEXT STEPS

### Phase 1: Fix Critical Gaps (2-3 days)
1. Add ErrorBoundary
2. Add "thinking" indicator during evaluation
3. Add microphone permission UI
4. Add progress persistence (localStorage)

### Phase 2: Polish UX (1 week)
5. Animate Pi avatar (pulsing during speech)
6. Add sound effects (points, level-up)
7. Add skip button for welcome screen
8. Add "your turn to speak" prompt

### Phase 3: Testing & Accessibility (2 weeks)
9. Add unit tests (reliability controls)
10. Add E2E tests (full user flow)
11. Add keyboard navigation
12. Add ARIA labels and screen reader support

### Phase 4: Observability (1 week)
13. Add session summary screen
14. Add parent dashboard
15. Add analytics/telemetry
16. Add error reporting (Sentry)

---

## FINAL ASSESSMENT

| Category | Grade | Reasoning |
|----------|-------|-----------|
| **Technical Reliability** | A+ | 8 production controls, comprehensive |
| **Architecture** | A | Clean, modular, well-separated concerns |
| **Pedagogical Design** | A | Innovative dual-LLM, sound theory |
| **Child UX** | C+ | Lacks feedback, error recovery, celebrations |
| **Accessibility** | D | No keyboard nav, ARIA, or captions |
| **Testing** | F | Zero unit/E2E tests |
| **Overall** | B | Excellent backend, needs UX polish |

---

**Bottom Line:**

You've built a **technically robust, pedagogically innovative system** with production-grade reliability. The architecture is sound and the AI interactions are sophisticated.

However, for the **target audience (8-10 year olds)**, you need more **visible feedback, graceful error handling, and celebratory UX**. Kids have low tolerance for confusion and failures feel personal.

**Recommendation:** Spend 2-3 days implementing the critical UX fixes (Error Boundary, thinking indicator, mic permission UI, progress persistence). This will transform the experience from "technically impressive" to "child-friendly."

The foundation is strong. Polish the surface.

---

**Analysis Complete** ✅
