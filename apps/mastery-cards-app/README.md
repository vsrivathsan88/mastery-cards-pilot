# Mastery Cards App

**Tinder-like swipeable cards for quick math mastery assessment**

## 🎯 Overview

A mobile-first, gamified assessment tool where students quickly demonstrate mastery of math concepts through voice interaction with Pi. Cards are swiped right (mastered) or left (needs practice), with spaced repetition bringing back unmastered concepts.

**Status:** Phase 1 MVP Complete (Basic UI + State Management)

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

App runs on **http://localhost:5174** (port 5174 to avoid conflict with tutor-app)

## 📦 What's Implemented (Phase 1)

### ✅ Complete Features:

- **10 Sample Cards** - Fractions (3.NF.A.1) scaffolded from foundational → advanced
- **State Management** - Zustand stores for session tracking
- **Points System** - Base points + bonuses (first try, streak, speed)
- **Spaced Repetition** - SM-2 algorithm for review scheduling
- **Neo-Brutalist UI** - Matching tutor-app design aesthetic
- **Session Tracking** - Progress, points, streak, level
- **Card Generation** - Extract from mastery goals

### 🎴 Current UI:

- Session header (level, points, streak, progress bar)
- Card display with difficulty badges
- Manual swipe buttons (for testing)
- Session complete screen
- Responsive mobile design

## 🏗️ Architecture

```
src/
├── components/
│   ├── cards/          # MasteryCard component
│   └── session/        # SessionHeader component
├── lib/
│   ├── state/          # Zustand stores
│   ├── tools/          # swipe_right, swipe_left tools
│   ├── cards/          # Card generation from mastery goals
│   ├── scoring/        # Points calculator
│   ├── spaced-repetition/ # SR algorithm
│   └── prompts/        # System prompt for Pi
└── types/              # TypeScript types
```

## 📋 Next Phases

### Phase 2: Swipe Gestures (Week 1)
- [ ] Install @use-gesture/react
- [ ] Implement touch/mouse swipe detection
- [ ] Card animations (swipe left/right)
- [ ] Stack of cards (preview next 2-3)

### Phase 3: Voice Integration (Week 1-2)
- [ ] Copy LiveAPI infrastructure from tutor-app
- [ ] Connect Pi voice assessment
- [ ] Implement tool handlers (swipe_right/left)
- [ ] Test Pi assessment accuracy

### Phase 4: Spaced Repetition UI (Week 2)
- [ ] Review queue display
- [ ] Cards due indicator
- [ ] Multi-session support

### Phase 5: Polish (Week 3-4)
- [ ] Celebration animations
- [ ] Level-up effects
- [ ] Sound effects
- [ ] Mobile gestures refinement

## 🎮 How It Works (Design)

1. **Card Presented** → Student sees mastery goal
2. **Pi Asks** → "Explain what 1/2 means"
3. **Student Responds** → Voice explanation
4. **Pi Assesses** → Calls swipe_right or swipe_left
5. **Points Awarded** → Base + bonuses for streak/speed
6. **Next Card** → Continue or show review queue

## 🎯 Sample Cards

Currently includes 10 cards:
- Foundational: 1/2, equal parts requirement
- Intermediate: 1/3, 1/4, denominator/numerator meaning
- Advanced: Comparing fractions, building 2/3, 3/4, whole as fraction

## 🔧 Tools for Pi

**Just 2 tools:**

1. `swipe_right(cardId, evidence, confidence)` - Mastered!
   - Awards points
   - Adds to mastered pile
   - Continues streak

2. `swipe_left(cardId, reason, difficulty)` - Needs practice
   - Schedules review (5min, 15min, 1hour)
   - Resets streak
   - Queues for spaced repetition

## 📊 Scoring System

**Base Points:**
- Easy card: 10 points
- Medium: 15 points
- Hard: 25 points

**Bonuses:**
- First try: +5
- Streak (3+): +2 to +10
- Speed (<30s): +3

**Levels:** Every 100 points

## 🎨 Design System

Matches tutor-app neo-brutalist aesthetic:
- Thick borders (4px)
- Offset shadows (6px 6px 0)
- Chunky, playful style
- Bold colors
- High contrast

## 🧪 Testing (Current)

```bash
# Start app
pnpm dev

# Manual test:
1. Click through cards with swipe buttons
2. Watch points/streak increase
3. Complete session → see summary
4. Start new session
```

## 📚 References

- **Plan**: `/MASTERY-CARDS-APP-PLAN.md` (1,429 lines)
- **Tutor App**: `../tutor-app` (for reusable components)
- **Packages**: `../../packages/shared`, `../../packages/lessons`

## 🚧 Known Limitations (MVP)

- ❌ No swipe gestures yet (using buttons)
- ❌ No voice/Pi integration yet
- ❌ No spaced repetition queue UI
- ❌ No celebrations/animations
- ❌ Cards hardcoded (not from lessons package yet)
- ❌ No multi-session persistence

**These are all planned for future phases!**

## 🎉 MVP Demo Flow

1. Open app → See first card
2. Read the prompt
3. Click "Mastered!" → See points awarded
4. Click through 10 cards
5. See session summary
6. Start new session

**This validates the core card → assessment → points flow!**

## 📝 Development Notes

**Environment:**
- Port: 5174 (tutor-app uses 5173)
- Packages: Reuses shared, agents, lessons
- State: Zustand (same as tutor-app)
- Styling: CSS modules + global styles

**Key Files:**
- `App.tsx` - Main app component
- `session-store.ts` - Session state management
- `card-generator.ts` - 10 sample cards
- `swipe-tools.ts` - Tool definitions for Pi
- `cards-system-prompt.ts` - Simplified prompt

---

Built with ❤️ as part of the Simili monorepo
