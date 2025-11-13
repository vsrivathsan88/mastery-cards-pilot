# Mastery Cards App - Comprehensive Architecture Plan

**Project:** Tinder-like Swipeable Cards for Math Mastery Assessment  
**Goal:** Quick, gamified checks for prerequisite → advanced mastery goals  
**Date:** 2025-11-09  
**Status:** Planning Phase

---

## 🎯 Executive Summary

### The Concept

A **mobile-first, swipe-based assessment tool** where students quickly demonstrate mastery of math concepts through voice interaction with Pi. Cards are swiped right (mastered) or left (needs practice), with spaced repetition bringing back unmastered concepts.

### Key Differentiators from Tutor App

| Aspect | Tutor App | Mastery Cards App |
|--------|-----------|-------------------|
| **Goal** | Deep conceptual learning | Quick mastery verification |
| **Interaction** | Linear story-driven lesson | Non-linear card deck |
| **Duration** | 15-20 minutes per lesson | 2-5 minutes per session |
| **UI Paradigm** | Desktop workspace | Mobile swipe interface |
| **Complexity** | Full canvas, milestones, images | Cards, voice, swipe |
| **Learning Model** | Socratic, scaffolded | Spaced repetition |
| **Output** | Rich session data | Binary mastery signals |

### Why Separate App?

✅ **Fundamentally different product**  
✅ **Different user mental model** (game vs. lesson)  
✅ **Simpler tech stack** (no canvas, no complex state)  
✅ **Mobile-first** (swipe is mobile UX)  
✅ **Faster iteration** (no risk to main app)  
✅ **Still shares 60% of codebase** (packages, voice, Pi logic)

---

## 🏗️ Architecture Overview

### Monorepo Structure

```
simili-monorepo/
├── apps/
│   ├── tutor-app/              # Existing full tutoring experience
│   └── mastery-cards-app/      # NEW: Swipeable assessment
│       ├── src/
│       │   ├── components/
│       │   │   ├── deck/       # Card deck UI
│       │   │   ├── cards/      # Individual card types
│       │   │   ├── shared/     # Reused from tutor-app
│       │   │   └── layout/     # App layout
│       │   ├── lib/
│       │   │   ├── state/      # Zustand stores
│       │   │   ├── tools/      # Swipe tools
│       │   │   ├── spaced-repetition/ # SR algorithm
│       │   │   └── scoring/    # Points system
│       │   ├── hooks/
│       │   │   ├── use-card-deck.ts
│       │   │   ├── use-live-api.ts  # Adapted from tutor-app
│       │   │   └── use-spaced-repetition.ts
│       │   └── App.tsx
├── packages/
│   ├── shared/                 # ✅ REUSE: Types, data structures
│   ├── agents/                 # ✅ REUSE: Pi logic (simplified)
│   └── lessons/                # ✅ REUSE: Mastery goals data
```

---

## 🔄 What We Reuse (60% of Codebase)

### From `packages/shared` ✅

```typescript
// Type definitions
import { 
  MasteryGoal,      // Existing type
  Standard,          // CCSS standards
  Misconception      // Misconception types
} from '@simili/shared';

// We'll extend with card-specific types
interface MasteryCard extends MasteryGoal {
  cardId: string;
  imageUrl?: string;
  textDescription: string;
  scaffoldLevel: 'foundational' | 'intermediate' | 'advanced';
  prerequisiteFor: string[];
  pointValue: number;
}
```

### From `packages/lessons` ✅

```typescript
// Extract mastery goals from lessons
import { LessonLoader } from '@simili/lessons';

const lesson = LessonLoader.getLesson('equal-parts-challenge');
const masteryGoals = lesson.masteryGoals; // We have these!

// Convert to cards
const cards = masteryGoals.map(goal => ({
  ...goal,
  cardId: `card-${goal.id}`,
  textDescription: goal.description,
  pointValue: calculatePointValue(goal.difficulty),
}));
```

### From `packages/agents` ✅

```typescript
// PedagogyEngine (simplified for quick assessment)
import { PedagogyEngine } from '@simili/agents';

class QuickAssessmentEngine extends PedagogyEngine {
  // Override with simpler logic
  assessResponse(transcript: string, masteryGoal: MasteryGoal) {
    // Quick binary decision: mastered or not?
    return { mastered: boolean, confidence: number, evidence: string };
  }
}
```

### From `apps/tutor-app` (Copy & Simplify) ✅

**Voice/Audio Infrastructure:**
- `hooks/media/use-live-api.ts` - Adapt for card context
- `lib/audio-recorder.ts` - Reuse as-is
- LiveAPI connection logic - Reuse pattern

**UI Components (Selectively):**
- `PiPresence.tsx` - Reuse Pi avatar
- `SpeechIndicator.tsx` - Voice activity indicator  
- Button styles - Reuse neo-brutalist design
- Loading states - Reuse cozy loading

**NOT Reused (Too Complex):**
- ❌ StreamingConsole (different layout)
- ❌ LessonCanvas (no canvas in cards)
- ❌ CozyWorkspace (different paradigm)
- ❌ Teacher panel (maybe simpler version later)

---

## 🎴 Core Components Architecture

### 1. Card Deck System

```typescript
// components/deck/CardDeck.tsx
interface CardDeckProps {
  cards: MasteryCard[];
  onSwipeRight: (card: MasteryCard) => void;
  onSwipeLeft: (card: MasteryCard) => void;
  currentIndex: number;
}

// Features:
// - Stack of cards (top 3 visible)
// - Swipe gesture detection
// - Smooth animations
// - Mobile-optimized touch
```

### 2. Individual Card Types

```typescript
// components/cards/MasteryCard.tsx
interface MasteryCardProps {
  card: MasteryCard;
  isCurrent: boolean;
  onSwipe: (direction: 'left' | 'right') => void;
}

// Variants:
// - TextCard (for now)
// - ImageCard (future)
// - ComparisonCard (e.g., "1/3 vs 1/2")
// - VisualCard (with SVG diagrams)
```

### 3. Session Management

```typescript
// lib/state/session-store.ts
interface SessionState {
  // Current session
  currentCardIndex: number;
  cardsInDeck: MasteryCard[];
  
  // Progress
  cardsReviewed: number;
  masteredToday: string[];
  needsPractice: string[];
  
  // Scoring
  points: number;
  streak: number;
  level: number;
  
  // Spaced repetition
  reviewQueue: ScheduledCard[];
}
```

### 4. Spaced Repetition Engine

```typescript
// lib/spaced-repetition/sr-engine.ts
class SpacedRepetitionEngine {
  scheduleReview(card: MasteryCard, difficulty: 'again' | 'hard' | 'good') {
    // Intervals: 5min, 15min, 1hour, 1day
    const intervals = {
      again: 5 * 60 * 1000,      // 5 minutes
      hard: 15 * 60 * 1000,      // 15 minutes  
      good: 60 * 60 * 1000,      // 1 hour
    };
    
    return {
      cardId: card.cardId,
      nextReviewAt: Date.now() + intervals[difficulty],
      reviewCount: card.reviewCount + 1,
    };
  }
  
  getDueCards(): MasteryCard[] {
    // Returns cards due for review based on timestamp
  }
}
```

### 5. Scoring System

```typescript
// lib/scoring/points-engine.ts
class PointsEngine {
  calculatePoints(action: 'swipe_right' | 'swipe_left', context: {
    isFirstAttempt: boolean;
    streak: number;
    cardDifficulty: string;
  }): number {
    // Base points
    let points = action === 'swipe_right' ? 10 : 0;
    
    // Bonuses
    if (context.isFirstAttempt) points += 5;        // First-try bonus
    if (context.streak >= 3) points += 2;           // Streak bonus
    if (context.cardDifficulty === 'advanced') points += 5; // Difficulty bonus
    
    return points;
  }
  
  getLevelForPoints(points: number): number {
    // Every 100 points = 1 level
    return Math.floor(points / 100) + 1;
  }
}
```

---

## 🛠️ Tools for Pi

### Simplified Tool Set (Just 2 Tools!)

```typescript
// lib/tools/swipe-tools.ts
export const swipeTools = [
  {
    name: 'swipe_right',
    description: `Call this when the student demonstrates mastery of the current card's concept.
    
Use when:
- Student explains the concept correctly
- Student shows clear understanding
- Evidence of mastery is strong

This awards points and moves the card to "mastered" pile.`,
    
    parameters: {
      type: 'OBJECT',
      properties: {
        cardId: {
          type: 'STRING',
          description: 'ID of the card being assessed',
        },
        evidence: {
          type: 'STRING',
          description: 'What the student said/did that shows mastery',
        },
        confidence: {
          type: 'NUMBER',
          description: 'How confident you are they mastered it (0.0-1.0)',
        },
      },
      required: ['cardId', 'evidence', 'confidence'],
    },
    isEnabled: true,
  },
  
  {
    name: 'swipe_left',
    description: `Call this when the student needs more practice with this concept.

Use when:
- Student shows confusion or misconception
- Answer is incorrect or incomplete
- They need to see this card again later

This adds the card to spaced repetition queue.`,
    
    parameters: {
      type: 'OBJECT',
      properties: {
        cardId: {
          type: 'STRING',
          description: 'ID of the card being assessed',
        },
        reason: {
          type: 'STRING',
          description: 'Why they need more practice (brief)',
        },
        difficulty: {
          type: 'STRING',
          enum: ['again', 'hard', 'good'],
          description: 'How soon should this card come back? (again=5min, hard=15min, good=1hour)',
        },
      },
      required: ['cardId', 'reason', 'difficulty'],
    },
    isEnabled: true,
  },
];
```

---

## 🧠 Simplified System Prompt

```typescript
// lib/prompts/cards-system-prompt.ts
export const MASTERY_CARDS_SYSTEM_PROMPT = `You are Pi, helping students quickly check their math mastery through a fun card game.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎴 CARD GAME RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**INTERACTION PATTERN:**
1. A card appears with a mastery goal
2. You ask the student to explain it (1-2 questions MAX)
3. Based on their response, you IMMEDIATELY call a tool:
   - \`swipe_right\` if they demonstrate mastery → Award points! 🎉
   - \`swipe_left\` if they need more practice → We'll see this again!

**CRITICAL: KEEP IT FAST**
- This is QUICK ASSESSMENT, not deep tutoring
- Ask 1-2 questions max per card
- Make a decision quickly
- Move on to next card

**VOICE CONVERSATION RULES:**
- Short responses (1-2 sentences)
- Ask question → STOP and WAIT
- No monologues

**TOOLS:**
- \`swipe_right(cardId, evidence, confidence)\` - They mastered it!
- \`swipe_left(cardId, reason, difficulty)\` - Need more practice

**ENCOURAGEMENT:**
- Celebrate swipe_right with energy: "YES! That's perfect! +10 points!"
- Be encouraging on swipe_left: "No worries! We'll come back to this one!"
- Mention points and streaks to motivate

**EXAMPLE FLOW:**

Card: "1/2 means one part when divided into 2 equal parts"

You: "Can you explain what 1/2 means?"
[STOP. WAIT for response.]

Student: "It's when you split something into two equal pieces and take one"

You: "Perfect! That's exactly right!" 
[Call: swipe_right(cardId: "card-123", evidence: "Correctly explained equal partitioning and unit fraction", confidence: 0.95)]
You: "+10 points! Great job! 🎉"
[Next card appears automatically]

---

ALTERNATIVE EXAMPLE:

Card: "1/3 is bigger than 1/2 - True or False?"

You: "Is 1/3 bigger than 1/2?"
[STOP. WAIT.]

Student: "True, because 3 is bigger than 2"

You: "Hmm, let me ask it differently - if you split a cookie into 3 pieces vs 2 pieces, which piece is bigger?"
[STOP. WAIT.]

Student: "Oh... the 2 pieces? Because you're cutting it into fewer pieces?"

You: "Exactly! So 1/2 is actually bigger. We'll practice this more!"
[Call: swipe_left(cardId: "card-456", reason: "Common misconception about denominators", difficulty: "hard")]
You: "This card will come back in a bit - we'll get it next time!"
[Next card appears]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Remember: 
- FAST assessment (not deep teaching)
- 1-2 questions per card
- Call a tool EVERY TIME (swipe_right or swipe_left)
- Celebrate successes
- Stay encouraging on mistakes
`;
```

---

## 📊 Data Models

### Core Data Structures

```typescript
// lib/types/cards.ts

interface MasteryCard {
  // Identity
  cardId: string;
  masteryGoalId: string;
  standard: string; // "3.NF.A.1"
  
  // Content
  title: string;
  description: string;
  textPrompt: string; // "Explain what 1/2 means"
  imageUrl?: string; // For future
  
  // Hierarchy
  scaffoldLevel: 'foundational' | 'intermediate' | 'advanced';
  prerequisiteFor: string[]; // Other card IDs
  dependsOn: string[];       // Prerequisite card IDs
  
  // Assessment
  successCriteria: string;
  commonMisconceptions: string[];
  
  // Gamification
  pointValue: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface ScheduledCard {
  cardId: string;
  nextReviewAt: number; // timestamp
  reviewCount: number;
  lastAttemptSuccessful: boolean;
  intervalMultiplier: number; // For adaptive spacing
}

interface CardSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  
  // Progress
  cardsReviewed: number;
  totalCards: number;
  
  // Results
  masteredCards: string[];
  needsPracticeCards: string[];
  
  // Scoring
  pointsEarned: number;
  currentStreak: number;
  maxStreak: number;
  level: number;
  
  // Analytics
  averageTimePerCard: number;
  totalInteractions: number;
}

interface UserProgress {
  userId: string;
  
  // Overall stats
  totalPoints: number;
  currentLevel: number;
  totalCardsReviewed: number;
  totalCardsMastered: number;
  
  // Card history
  masteredCards: Set<string>;
  inProgressCards: Map<string, ScheduledCard>;
  
  // Session history
  sessions: CardSession[];
  
  // Achievements
  streakRecord: number;
  fastestSession: number;
  perfectSessions: number;
}
```

---

## 🎨 UI/UX Design

### Mobile-First Layout

```
┌─────────────────────────────────┐
│  ⚡ Level 3    🔥 Streak: 5    │  ← Header (sticky)
│  Points: 145                    │
├─────────────────────────────────┤
│                                 │
│   ┌─────────────────────────┐  │  
│   │                         │  │  ← Card Stack
│   │  "What does 1/2 mean?"  │  │    (top 3 visible)
│   │                         │  │
│   │  [Description text]     │  │
│   │                         │  │
│   └─────────────────────────┘  │
│     ←swipe left  swipe right→  │
│                                 │
├─────────────────────────────────┤
│                                 │
│  🎤 Pi: "Tell me what 1/2      │  ← Pi voice section
│         means in your own       │    (speech bubble)
│         words..."               │
│                                 │
│  👤 You: [Speaking...]          │  ← Student speaking
│     ▁▂▃▅▇ [Waveform]           │    indicator
│                                 │
├─────────────────────────────────┤
│  [Hint Button]  [Skip Button]  │  ← Actions (optional)
└─────────────────────────────────┘
```

### Desktop Adaptation

```
┌───────────────────────────────────────────────────────────┐
│  ⚡ Level 3  🔥 Streak: 5  Points: 145     [Progress: 5/20] │
├───────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────────┐                                         │
│   │   Card #1    │     ┌────────────────────────────┐    │
│   │  (preview)   │     │                            │    │
│   └──────────────┘     │  "What does 1/2 mean?"     │    │
│                        │                            │    │
│   ┌──────────────┐     │  [Description text about   │    │
│   │   Card #2    │     │   unit fractions...]       │    │
│   │  (current)   │     │                            │    │
│   └──────────────┘     │  📊 Difficulty: Easy       │    │
│                        │  🎯 Points: +10            │    │
│   ┌──────────────┐     └────────────────────────────┘    │
│   │   Card #3    │              ↓                         │
│   │  (preview)   │     [⬅️ Needs Practice] [Mastered ➡️]  │
│   └──────────────┘                                        │
│                                                             │
│  ────────────────────────────────────────────────────────  │
│                                                             │
│  🎤 Pi: "Tell me what 1/2 means..."                        │
│  👤 You: [Speaking...] ▁▂▃▅▇                              │
│                                                             │
└───────────────────────────────────────────────────────────┘
```

---

## 🔢 Spaced Repetition Algorithm

### SM-2 Algorithm (Simplified)

```typescript
// lib/spaced-repetition/sm2-algorithm.ts

interface RepetitionData {
  easeFactor: number;    // 1.3 to 2.5
  interval: number;      // Days until next review
  repetitions: number;   // Number of successful reviews
}

class SM2Algorithm {
  private defaultEase = 2.5;
  private minEase = 1.3;
  
  calculateNextReview(
    currentData: RepetitionData,
    quality: 0 | 1 | 2 | 3 | 4 | 5 // 0=complete fail, 5=perfect
  ): RepetitionData {
    let { easeFactor, interval, repetitions } = currentData;
    
    // Update ease factor
    easeFactor = Math.max(
      this.minEase,
      easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );
    
    // Update interval and repetitions
    if (quality < 3) {
      // Failed - restart
      repetitions = 0;
      interval = 1;
    } else {
      // Success - increase interval
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions++;
    }
    
    return { easeFactor, interval, repetitions };
  }
  
  // For quick sessions (minutes, not days)
  calculateQuickReview(
    quality: 'again' | 'hard' | 'good' | 'easy'
  ): number {
    const intervals = {
      again: 5 * 60 * 1000,      // 5 minutes
      hard: 15 * 60 * 1000,      // 15 minutes
      good: 60 * 60 * 1000,      // 1 hour
      easy: 24 * 60 * 60 * 1000, // 1 day (graduate)
    };
    
    return Date.now() + intervals[quality];
  }
}
```

---

## 🎯 Scoring & Gamification

### Points System

```typescript
// lib/scoring/points-calculator.ts

class PointsCalculator {
  calculateCardPoints(params: {
    swipeDirection: 'right' | 'left';
    cardDifficulty: 'easy' | 'medium' | 'hard';
    isFirstAttempt: boolean;
    currentStreak: number;
    timeToAnswer: number; // seconds
  }): {
    basePoints: number;
    bonuses: { name: string; points: number }[];
    total: number;
  } {
    let basePoints = 0;
    const bonuses: { name: string; points: number }[] = [];
    
    // Base points for correct answer
    if (params.swipeDirection === 'right') {
      basePoints = {
        easy: 10,
        medium: 15,
        hard: 25,
      }[params.cardDifficulty];
      
      // First attempt bonus
      if (params.isFirstAttempt) {
        bonuses.push({ name: 'First Try!', points: 5 });
      }
      
      // Streak bonus
      if (params.currentStreak >= 3) {
        const streakPoints = Math.min(10, params.currentStreak);
        bonuses.push({ name: `🔥 Streak x${params.currentStreak}`, points: streakPoints });
      }
      
      // Speed bonus (under 30 seconds)
      if (params.timeToAnswer < 30) {
        bonuses.push({ name: '⚡ Lightning Fast', points: 3 });
      }
    }
    
    const total = basePoints + bonuses.reduce((sum, b) => sum + b.points, 0);
    
    return { basePoints, bonuses, total };
  }
  
  getLevelForPoints(points: number): {
    level: number;
    pointsInLevel: number;
    pointsToNextLevel: number;
  } {
    const pointsPerLevel = 100;
    const level = Math.floor(points / pointsPerLevel) + 1;
    const pointsInLevel = points % pointsPerLevel;
    const pointsToNextLevel = pointsPerLevel - pointsInLevel;
    
    return { level, pointsInLevel, pointsToNextLevel };
  }
}
```

### Achievement System (Future)

```typescript
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: (progress: UserProgress) => boolean;
}

const achievements: Achievement[] = [
  {
    id: 'first-master',
    name: 'First Mastery',
    description: 'Master your first card',
    icon: '🎓',
    requirement: (p) => p.totalCardsMastered >= 1,
  },
  {
    id: 'streak-master',
    name: 'Streak Master',
    description: 'Get a 10-card streak',
    icon: '🔥',
    requirement: (p) => p.streakRecord >= 10,
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Complete a session in under 2 minutes',
    icon: '⚡',
    requirement: (p) => p.fastestSession < 120,
  },
];
```

---

## 📦 Implementation Phases

### Phase 1: Core Infrastructure (Week 1)

**Goal:** Bare-bones working app with voice + swipe

**Tasks:**
- [ ] Create `apps/mastery-cards-app` folder structure
- [ ] Setup Vite + React + TypeScript
- [ ] Copy voice infrastructure from tutor-app
  - [ ] `use-live-api.ts` (simplified)
  - [ ] Audio recorder
  - [ ] LiveAPI connection
- [ ] Create basic card component (text only)
- [ ] Implement swipe detection (touch + mouse)
- [ ] Create simplified system prompt
- [ ] Implement 2 tools: swipe_right, swipe_left
- [ ] Basic state management (current card, score)
- [ ] Test with 3-5 sample cards

**Success Criteria:**
- Can swipe cards left/right
- Pi responds via voice
- Pi calls swipe tools based on assessment
- Points increment on right swipe

---

### Phase 2: Spaced Repetition (Week 2)

**Goal:** Cards that were swiped left come back

**Tasks:**
- [ ] Implement SR algorithm (SM-2 simplified)
- [ ] Create review queue system
- [ ] Add card scheduling on swipe_left
- [ ] Implement "cards due now" logic
- [ ] Show review queue in UI
- [ ] Test with 10+ cards over multiple sessions

**Success Criteria:**
- Swiped-left cards reappear at correct intervals
- Queue shows upcoming reviews
- Can complete multiple sessions

---

### Phase 3: Gamification (Week 3)

**Goal:** Points, streaks, levels

**Tasks:**
- [ ] Implement points calculator
- [ ] Add streak tracking
- [ ] Implement level system
- [ ] Create celebration animations
  - [ ] Right swipe → +points animation
  - [ ] Level up → big celebration
  - [ ] Streak milestone → fire emoji
- [ ] Add progress indicators
- [ ] Create session summary screen

**Success Criteria:**
- Points awarded correctly with bonuses
- Streak tracked across cards
- Level up triggers celebration
- Summary shows session stats

---

### Phase 4: Polish & Testing (Week 4)

**Goal:** Production-ready MVP

**Tasks:**
- [ ] Mobile responsive design
- [ ] Swipe gesture refinement
- [ ] Loading states
- [ ] Error handling
- [ ] Add 20-30 cards from mastery goals
- [ ] Test with 5-10 users
- [ ] Fix bugs
- [ ] Performance optimization
- [ ] Analytics tracking

**Success Criteria:**
- Works smoothly on mobile
- No crashes during 10-minute session
- User feedback positive
- Analytics collecting data

---

### Phase 5: Advanced Features (Future)

- [ ] Image cards (with generated images)
- [ ] Comparison cards (side-by-side)
- [ ] Multi-step cards (progressive reveal)
- [ ] Achievement system
- [ ] Leaderboard (optional)
- [ ] Parent/teacher dashboard
- [ ] Export progress reports

---

## 📂 File Structure (Detailed)

```
apps/mastery-cards-app/
├── public/
│   └── assets/
│       └── cards/          # Card images (future)
├── src/
│   ├── components/
│   │   ├── deck/
│   │   │   ├── CardDeck.tsx           # Main deck container
│   │   │   ├── CardStack.tsx          # Visual card stack
│   │   │   ├── SwipeableCard.tsx      # Individual swipeable card
│   │   │   └── CardDeck.css
│   │   ├── cards/
│   │   │   ├── MasteryCard.tsx        # Base card component
│   │   │   ├── TextCard.tsx           # Text-only card
│   │   │   ├── ImageCard.tsx          # Image + text (future)
│   │   │   └── ComparisonCard.tsx     # Side-by-side (future)
│   │   ├── session/
│   │   │   ├── SessionHeader.tsx      # Level, points, streak
│   │   │   ├── SessionSummary.tsx     # End-of-session stats
│   │   │   └── ProgressBar.tsx        # Cards completed
│   │   ├── pi/
│   │   │   ├── PiAvatar.tsx           # Reused from tutor-app
│   │   │   ├── PiVoiceIndicator.tsx   # Speech bubble
│   │   │   └── PiReactions.tsx        # Emoji reactions
│   │   ├── shared/
│   │   │   ├── Button.tsx             # Reused
│   │   │   ├── Loading.tsx            # Reused
│   │   │   └── Celebration.tsx        # Reused + adapted
│   │   └── layout/
│   │       ├── AppLayout.tsx          # Main layout
│   │       └── MobileLayout.tsx       # Mobile-specific
│   ├── hooks/
│   │   ├── use-live-api.ts            # Adapted from tutor-app
│   │   ├── use-card-deck.ts           # Deck state management
│   │   ├── use-spaced-repetition.ts   # SR logic
│   │   ├── use-swipe-gesture.ts       # Swipe detection
│   │   └── use-session-tracking.ts    # Session stats
│   ├── lib/
│   │   ├── state/
│   │   │   ├── session-store.ts       # Zustand: current session
│   │   │   ├── progress-store.ts      # Zustand: user progress
│   │   │   └── cards-store.ts         # Zustand: card data
│   │   ├── tools/
│   │   │   └── swipe-tools.ts         # 2 tool definitions
│   │   ├── spaced-repetition/
│   │   │   ├── sm2-algorithm.ts       # SR algorithm
│   │   │   ├── review-scheduler.ts    # Schedule management
│   │   │   └── queue-manager.ts       # Review queue
│   │   ├── scoring/
│   │   │   ├── points-calculator.ts   # Points logic
│   │   │   └── level-system.ts        # Level progression
│   │   ├── prompts/
│   │   │   └── cards-system-prompt.ts # Simplified prompt
│   │   ├── cards/
│   │   │   ├── card-loader.ts         # Load from lessons package
│   │   │   └── card-generator.ts      # Generate from mastery goals
│   │   └── audio/
│   │       └── audio-recorder.ts      # Copied from tutor-app
│   ├── types/
│   │   ├── cards.ts                   # Card types
│   │   ├── session.ts                 # Session types
│   │   └── scoring.ts                 # Scoring types
│   ├── App.tsx                        # Main app
│   ├── main.tsx                       # Entry point
│   └── index.css                      # Global styles
├── .env.template
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🔌 LiveAPI Integration

### Simplified API Hook

```typescript
// hooks/use-live-api.ts (adapted from tutor-app)

export function useLiveAPI() {
  const { connect, disconnect, client } = useLiveAPIContext();
  const [isConnected, setIsConnected] = useState(false);
  
  // Tool handlers
  useEffect(() => {
    if (!client) return;
    
    client.on('toolcall', async (toolCall) => {
      const { name, args, id } = toolCall;
      
      if (name === 'swipe_right') {
        const { cardId, evidence, confidence } = args;
        
        // Update state
        useSessionStore.getState().masteredCard(cardId);
        
        // Award points
        const points = usePointsCalculator().calculate({
          swipeDirection: 'right',
          cardDifficulty: getCurrentCard().difficulty,
          // ... other params
        });
        
        useSessionStore.getState().addPoints(points.total);
        
        // Celebration!
        showCelebration('+${points.total} points! 🎉');
        
        // Move to next card
        useCardDeck().getState().nextCard();
        
        // Send response
        client.sendToolResponse({
          functionResponses: [{
            id,
            name,
            response: { success: true, pointsAwarded: points.total },
          }],
        });
      }
      
      else if (name === 'swipe_left') {
        const { cardId, reason, difficulty } = args;
        
        // Schedule for review
        useSREngine().scheduleReview(cardId, difficulty);
        
        // Update state
        useSessionStore.getState().needsPractice(cardId);
        
        // Move to next card
        useCardDeck().getState().nextCard();
        
        // Send response
        client.sendToolResponse({
          functionResponses: [{
            id,
            name,
            response: { success: true, reviewScheduled: true },
          }],
        });
      }
    });
  }, [client]);
  
  return { connect, disconnect, isConnected };
}
```

---

## 🎴 Card Generation from Mastery Goals

### Extract Cards from Lesson Data

```typescript
// lib/cards/card-generator.ts

import { LessonLoader } from '@simili/lessons';
import type { MasteryGoal } from '@simili/shared';
import type { MasteryCard } from '../types/cards';

export class CardGenerator {
  static generateFromLesson(lessonId: string): MasteryCard[] {
    const lesson = LessonLoader.getLesson(lessonId);
    
    if (!lesson || !lesson.masteryGoals) {
      console.warn(`No mastery goals found for lesson: ${lessonId}`);
      return [];
    }
    
    return lesson.masteryGoals.map((goal, index) => {
      return this.masteryGoalToCard(goal, index);
    });
  }
  
  private static masteryGoalToCard(
    goal: MasteryGoal,
    index: number
  ): MasteryCard {
    return {
      // Identity
      cardId: `card-${goal.id}`,
      masteryGoalId: goal.id,
      standard: goal.standard || '3.NF.A.1',
      
      // Content
      title: goal.title,
      description: goal.description,
      textPrompt: this.generatePrompt(goal),
      
      // Hierarchy
      scaffoldLevel: this.inferScaffoldLevel(goal),
      prerequisiteFor: goal.prerequisiteFor || [],
      dependsOn: goal.dependsOn || [],
      
      // Assessment
      successCriteria: goal.successCriteria || 'Student explains correctly',
      commonMisconceptions: goal.commonMisconceptions || [],
      
      // Gamification
      pointValue: this.calculatePointValue(goal),
      difficulty: this.inferDifficulty(goal),
    };
  }
  
  private static generatePrompt(goal: MasteryGoal): string {
    // Convert mastery goal into a prompt
    // e.g., "Understands 1/2 means one part of two equal parts"
    //    → "Explain what 1/2 means"
    
    const prompts: Record<string, string> = {
      'unit-fraction-understanding': 'Explain what 1/2 means in your own words',
      'equal-parts-requirement': 'Why do the parts need to be equal?',
      'denominator-meaning': 'What does the bottom number tell you?',
      // ... etc
    };
    
    return prompts[goal.id] || `Explain: ${goal.title}`;
  }
  
  private static inferScaffoldLevel(goal: MasteryGoal): 'foundational' | 'intermediate' | 'advanced' {
    if (goal.dependsOn && goal.dependsOn.length === 0) return 'foundational';
    if (goal.prerequisiteFor && goal.prerequisiteFor.length > 2) return 'advanced';
    return 'intermediate';
  }
  
  private static inferDifficulty(goal: MasteryGoal): 'easy' | 'medium' | 'hard' {
    const level = this.inferScaffoldLevel(goal);
    return {
      foundational: 'easy',
      intermediate: 'medium',
      advanced: 'hard',
    }[level];
  }
  
  private static calculatePointValue(goal: MasteryGoal): number {
    const difficulty = this.inferDifficulty(goal);
    return {
      easy: 10,
      medium: 15,
      hard: 25,
    }[difficulty];
  }
}

// Usage:
const cards = CardGenerator.generateFromLesson('equal-parts-challenge');
// Returns 10-15 cards from the mastery goals in that lesson
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// lib/spaced-repetition/__tests__/sm2-algorithm.test.ts

describe('SM2Algorithm', () => {
  it('should schedule "again" for 5 minutes', () => {
    const algo = new SM2Algorithm();
    const nextReview = algo.calculateQuickReview('again');
    const fiveMinutes = 5 * 60 * 1000;
    
    expect(nextReview - Date.now()).toBeCloseTo(fiveMinutes, -2);
  });
  
  it('should increase interval on success', () => {
    const algo = new SM2Algorithm();
    const initial = { easeFactor: 2.5, interval: 1, repetitions: 0 };
    const result = algo.calculateNextReview(initial, 5);
    
    expect(result.interval).toBeGreaterThan(initial.interval);
    expect(result.repetitions).toBe(1);
  });
});

// lib/scoring/__tests__/points-calculator.test.ts

describe('PointsCalculator', () => {
  it('should award base points for correct answer', () => {
    const calc = new PointsCalculator();
    const result = calc.calculateCardPoints({
      swipeDirection: 'right',
      cardDifficulty: 'medium',
      isFirstAttempt: false,
      currentStreak: 0,
      timeToAnswer: 60,
    });
    
    expect(result.basePoints).toBe(15);
  });
  
  it('should add first-try bonus', () => {
    const calc = new PointsCalculator();
    const result = calc.calculateCardPoints({
      swipeDirection: 'right',
      cardDifficulty: 'easy',
      isFirstAttempt: true,
      currentStreak: 0,
      timeToAnswer: 60,
    });
    
    expect(result.bonuses).toContainEqual({ name: 'First Try!', points: 5 });
  });
});
```

### Integration Tests

```typescript
// __tests__/card-flow.test.tsx

describe('Card Flow', () => {
  it('should complete a card successfully', async () => {
    const { getByText, getByRole } = render(<App />);
    
    // Wait for card to load
    await waitFor(() => {
      expect(getByText(/What does 1\/2 mean/)).toBeInTheDocument();
    });
    
    // Simulate Pi asking question
    // Simulate user response
    // Verify swipe_right was called
    // Verify points were awarded
    // Verify next card appeared
  });
});
```

### Manual Testing Protocol

```
1. Load app → Should see first card
2. Say correct answer → Pi should swipe right, award points
3. Say incorrect answer → Pi should swipe left, card returns later
4. Complete 5 cards → Should see progress
5. Wait 5 minutes → Swiped-left card should reappear
6. Complete 10 cards → Should level up with celebration
7. Check session summary → Should show stats
```

---

## 📊 Analytics & Metrics

### What to Track

```typescript
// lib/analytics/events.ts

interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  timestamp: number;
}

const trackCardPresented = (card: MasteryCard) => {
  track({
    event: 'card_presented',
    properties: {
      cardId: card.cardId,
      difficulty: card.difficulty,
      scaffoldLevel: card.scaffoldLevel,
    },
  });
};

const trackCardSwipe = (
  card: MasteryCard,
  direction: 'left' | 'right',
  timeSpent: number
) => {
  track({
    event: 'card_swiped',
    properties: {
      cardId: card.cardId,
      direction,
      timeSpent,
      isFirstAttempt: !hasSeenCardBefore(card.cardId),
    },
  });
};

const trackSessionComplete = (session: CardSession) => {
  track({
    event: 'session_complete',
    properties: {
      duration: session.endTime - session.startTime,
      cardsReviewed: session.cardsReviewed,
      pointsEarned: session.pointsEarned,
      masteryRate: session.masteredCards.length / session.cardsReviewed,
    },
  });
};
```

### Key Metrics

- **Engagement**:
  - Sessions per day
  - Cards per session
  - Average session duration
  - Return rate (day 1, day 7)

- **Learning**:
  - Mastery rate (% swiped right)
  - Time to mastery per card
  - Prerequisite correlation (do foundational cards predict advanced?)
  - Misconception detection rate

- **System**:
  - Tool call accuracy (Pi's assessment vs. actual mastery)
  - Average time per card
  - Spaced repetition effectiveness (do cards stick after N reviews?)

---

## 🚀 Deployment

### Build Configuration

```typescript
// vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@simili/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@simili/agents': path.resolve(__dirname, '../../packages/agents/src'),
      '@simili/lessons': path.resolve(__dirname, '../../packages/lessons/src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

### Environment Variables

```bash
# .env.template

# Gemini API
VITE_GEMINI_API_KEY=

# App config
VITE_APP_NAME=Mastery Cards
VITE_APP_VERSION=1.0.0

# Feature flags
VITE_ENABLE_ACHIEVEMENTS=false
VITE_ENABLE_LEADERBOARD=false

# Analytics
VITE_ANALYTICS_ENABLED=false
```

---

## 🎯 Success Criteria

### MVP Launch Criteria

- [ ] Can swipe through 20+ cards
- [ ] Pi voice assessment works
- [ ] Tools (swipe_right/left) fire correctly
- [ ] Points system functional
- [ ] Spaced repetition works (cards return)
- [ ] Mobile responsive
- [ ] No crashes during 10-minute session
- [ ] Session summary shows stats

### Pilot Study Success

- [ ] 10 students complete 5 sessions each
- [ ] 80% find it "fun" or "very fun"
- [ ] Average session: 3-5 minutes
- [ ] Mastery rate: 60-80% (not too easy, not too hard)
- [ ] Technical issues < 5%
- [ ] Data collected on all metrics

---

## 📝 Next Steps

### Immediate Actions

1. **Get approval** on this plan
2. **Create new app scaffold**:
   ```bash
   cd apps
   pnpm create vite mastery-cards-app --template react-ts
   ```
3. **Copy reusable components** from tutor-app
4. **Extract mastery goals** from lessons package
5. **Implement Phase 1** (Core Infrastructure)

### Timeline

- **Week 1**: Core infrastructure (voice + swipe)
- **Week 2**: Spaced repetition
- **Week 3**: Gamification
- **Week 4**: Polish + pilot testing

**Total: 4 weeks to production-ready MVP**

---

## 🤔 Open Questions

1. **Image vs. Text Cards:**
   - Start with text only, or generate images?
   - If images: Use description cards from tutor-app?

2. **Session Length:**
   - Fixed number of cards (e.g., 10 per session)?
   - Or time-based (e.g., 5 minutes)?

3. **Difficulty Adaptation:**
   - Should the deck adapt based on performance?
   - Or stick to linear scaffolding (foundational → advanced)?

4. **Social Features:**
   - Leaderboard? (Motivating but could be stressful)
   - Share achievements? (Optional social proof)

5. **Teacher Dashboard:**
   - Simple view of student progress?
   - Or keep it student-only for now?

---

## 🎉 Why This is a Great Idea

1. **Lower Friction**: 2-minute session vs. 15-minute lesson
2. **Mobile-First**: Swipe is natural on phones
3. **Gamification**: Points/streaks are motivating
4. **Spaced Repetition**: Proven learning technique
5. **Clear Metrics**: Binary mastery signals (swipe right/left)
6. **Reuses 60% of Code**: Packages, voice, Pi logic
7. **Fast to Build**: 4 weeks to MVP
8. **Complements Tutor App**: Quick checks + deep learning

---

## 📚 References

- **Spaced Repetition**: [SM-2 Algorithm](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2)
- **Gamification**: [Duolingo's Streak System](https://blog.duolingo.com/streaks/)
- **Swipe UX**: [Tinder Design Patterns](https://lawsofux.com/)
- **Mastery Learning**: [Bloom's 2 Sigma Problem](https://en.wikipedia.org/wiki/Bloom%27s_2_sigma_problem)

---

**Ready to build?** Let me know and I'll start scaffolding the new app! 🚀
