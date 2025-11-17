# Mastery Cards - Native Audio Function Calling Edition

This is a **production-ready** rebuild of the Mastery Cards app using Google's official Gemini Live API sandbox with:

- ✅ **Native audio processing** (audio worklets) for high-quality voice interaction
- ✅ **Function calling** - Gemini explicitly calls tools to control the learning flow
- ✅ **Claude background evaluation** - Smart mastery assessment
- ✅ **Official SDK** - Built on `@google/genai` for long-term stability
- ✅ **All your custom features** - Card system, Pi personality, level-up animations, etc.

## What Changed from Main App?

### Architecture Improvements

**Before (main app):**
- Custom WebSocket client with manual audio handling
- Complex turn tracking to prevent stale decisions
- Gemini + Claude racing → timing issues
- sendText() for non-interrupting feedback (unreliable)

**After (sandbox app):**
- Official `@google/genai` SDK with native audio worklets
- **Function calling** - Gemini explicitly triggers evaluation when ready
- Clean separation: Gemini drives conversation → calls `request_evaluation()` → Claude judges → Gemini calls `advance_to_next_card()`
- No more stale decisions - functions are atomic operations!

### Key Benefits

1. **No More Timing Bugs**: Function calls are explicit actions, not race conditions
2. **Better Audio Quality**: Native audio worklets vs. manual AudioContext manipulation
3. **Future-Proof**: Official SDK gets updates, bug fixes, new features
4. **Simpler Code**: Less state management, no complex turn coordinators needed
5. **Scalable**: Easy to add new tools (hints, celebrations, analytics)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        User (Student)                        │
└───────────────────────────┬─────────────────────────────────┘
                            │ Voice
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                 Gemini Live API (Pi)                         │
│  - Native audio (worklets)                                   │
│  - Voice activity detection                                  │
│  - Real-time conversation                                    │
│  - Multimodal (sees card images!)                           │
│  - Receives card context JSON per card                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Function Calling
                  ↓
┌─────────────────────────────────────────────────────────────┐
│                   Function Call Handler                      │
│                                                              │
│  - request_evaluation() ────────────┐                       │
│  - advance_to_next_card()           │                       │
│  - give_hint()                      │                       │
│  - celebrate_breakthrough()         │                       │
│  - log_student_strategy()           │                       │
└─────────────────────────────────────┼───────────────────────┘
                                      │
                                      ↓
                            ┌──────────────────┐
                            │  Claude Judge    │
                            │  (Background)    │
                            │                  │
                            │  • Mastery level │
                            │  • Points        │
                            │  • Confidence    │
                            │  • Next action   │
                            └──────────────────┘
```

## Card Context & System Prompt Architecture

### Data Flow: MVP_CARDS → Gemini

```
┌─────────────────────────────────────────────────────────────┐
│  lib/mvp-cards-data.ts                                       │
│  └─ MVP_CARDS: MasteryCard[]                                 │
│     - Card metadata (title, learning goals, milestones)     │
│     - Image URLs and descriptions                            │
│     - Mastery criteria and points                            │
└──────────────────────┬───────────────────────────────────────┘
                       │ Import
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  lib/state/session-store.ts                                 │
│  └─ useSessionStore (Zustand)                               │
│     - startSession() loads MVP_CARDS                         │
│     - currentCard = MVP_CARDS[currentCardIndex]             │
│     - Provides currentCard to React components              │
└──────────────────────┬───────────────────────────────────────┘
                       │ React Hook
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  App.mastery.tsx                                             │
│  └─ formatCardContext(currentCard)                          │
│     - Formats card metadata as JSON                          │
│     - Includes: title, learning_goal, image_description     │
│     - Includes: mastery_goals (basic/advanced)              │
│     - Prepends [CARD_CONTEXT] marker                        │
└──────────────────────┬───────────────────────────────────────┘
                       │ Send to Gemini
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  Gemini Live API                                             │
│  Receives per card:                                          │
│  1. Image (visual)                                           │
│  2. [CARD_CONTEXT] JSON (metadata)                          │
│  3. Pi's starting question                                   │
└─────────────────────────────────────────────────────────────┘
```

### System Prompt Structure

The system prompt has **two parts**:

#### 1. Static System Instruction (Set Once)
Location: `lib/tools/mastery-cards.ts` → `MASTERY_SYSTEM_PROMPT(studentName)`

**Contains:**
- Pi's personality and role
- Conversation guidelines
- Card context usage instructions
- Function calling guide
- Important rules (no funneling, no leading questions)

**Set when:** Session starts, sent to Gemini config

#### 2. Dynamic Card Context (Per Card)
Location: `App.mastery.tsx` → `formatCardContext()`

**Contains (JSON format):**
```json
{
  "card_number": 1,
  "title": "Equal Cookies",
  "learning_goal": "Recognize equal groups and one-to-one correspondence",
  "image_description": "Four round chocolate chip cookies arranged in a row...",
  "mastery_goals": {
    "basic": {
      "description": "Student MUST mention BOTH: (1) the number 4, AND (2) equal/same size",
      "points": 30
    }
  }
}
```

**Sent when:** Each new card loads, as first message with image

### Separation of Concerns: Gemini vs Claude

| Information | Gemini (Pi) | Claude (Judge) |
|------------|-------------|----------------|
| **Visual Image** | ✅ Sees image visually | ❌ Text description only |
| **Image Description** | ✅ Via [CARD_CONTEXT] | ✅ Via evaluation prompt |
| **Learning Goal** | ✅ Via [CARD_CONTEXT] | ✅ Via evaluation prompt |
| **Mastery Criteria** | ✅ Via [CARD_CONTEXT] | ✅ Via evaluation prompt |
| **Points Values** | ✅ Via [CARD_CONTEXT] | ✅ Via evaluation prompt |
| **Student Name** | ✅ In system prompt | ❌ Not needed |
| **Conversation History** | ✅ Full context | ✅ Last 10 turns |
| **Role** | Drive conversation | Judge mastery |

**Why this separation?**
- **Gemini (Pi)** needs context to guide conversation naturally without revealing answers
- **Claude (Judge)** needs context to evaluate objectively against learning criteria
- Both get the same card metadata, ensuring consistent evaluation
- Image description helps Claude understand what student saw (since it can't see images)

## Function Calling Flow

### Example: Student masters a card

1. **Card loads**: Gemini receives image + [CARD_CONTEXT] JSON with learning goals
2. **Gemini (Pi)** asks starting question from context
3. **Student** explains their reasoning verbally
4. **Gemini (Pi)** engages in conversation, probes deeper (guided by mastery goals in context)
5. **Gemini** decides student is ready: calls `request_evaluation({ reasoning: "Student explained part-whole clearly" })`
6. **Handler** sends conversation history + card context to **Claude**
7. **Claude** returns: `{ masteryLevel: "basic", points: 30, suggestedAction: "award_and_next" }`
8. **Handler** awards 30 points, shows celebration
9. **Gemini** calls `advance_to_next_card({ transition_message: "Great! Let's try something new!" })`
10. **Handler** loads next card, sends new [CARD_CONTEXT] with new image
11. **Cycle repeats!**

### Why This Works Better

- **Explicit control**: Gemini decides when to evaluate (not a timer or exchange count)
- **No race conditions**: Functions execute sequentially, not in parallel
- **Natural flow**: Gemini can explore deeply before evaluating
- **Atomic operations**: Card changes happen cleanly after Gemini finishes speaking
- **Context-aware Pi**: Gemini knows learning goals and can guide conversation strategically
- **Consistent evaluation**: Claude receives same card metadata for objective assessment
- **No prompt bloat**: Card context updates per card, system prompt stays lean

## Getting Started

### Prerequisites

- Node.js 18+ (for native ES modules)
- Gemini API key: https://aistudio.google.com/apikey
- Claude API key (optional): https://console.anthropic.com/

### Setup

1. **Install dependencies** (from monorepo root):
   ```bash
   pnpm install
   ```

2. **Set up environment variables**:
   ```bash
   cd apps/mastery-cards-app/native-audio-function-call-sandbox
   cp .env.local.example .env.local
   ```

3. **Add your API keys** to `.env.local`:
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_CLAUDE_API_KEY=your_claude_api_key_here
   ```

4. **Run the app**:
   ```bash
   npm run dev
   ```

5. **Open**: http://localhost:5173

### Testing

1. Enter your name
2. Allow microphone access
3. Click "Start Learning!" after Pi introduces herself
4. Talk about the fraction image you see
5. Watch the flow in the console:
   ```
   [App] ✅ Setup complete - ready to send messages
   [App] 📸 Sending card to Gemini: Equal Cookies
   [App] ✅ Card sent with image and context
   [App] 👤 User: There are four cookies
   [App] 🤖 Pi: Cool! What else do you notice?
   [App] 👤 User: They're all the same size
   [App] 🔧 Tool call received: request_evaluation
   [ClaudeJudge] Evaluation: { masteryLevel: "basic", points: 30, action: "award_and_next" }
   [App] 🔧 Tool call received: advance_to_next_card
   [App] 📸 Sending card to Gemini: Brownie Halves
   ```

## Tools Available to Gemini

### `request_evaluation(reasoning)`
Triggers Claude to evaluate student's understanding. Gemini provides reasoning for why it thinks student is ready.

**When to call**: After substantive exploration (3-4+ exchanges)

### `advance_to_next_card(transition_message?)`
Moves to next card. Only called after Claude approves.

**When to call**: After receiving `award_and_next` or `next_without_points` from Claude

### `give_hint(hint_level, hint_content)`
Provides scaffolded hint when student is stuck.

**Levels**: `gentle` | `moderate` | `strong`

### `celebrate_breakthrough(breakthrough_type, celebration_message)`
Celebrates significant insights.

**Types**: `deep_insight` | `connection` | `perseverance`

### `log_student_strategy(strategy_name, description)`
Logs interesting problem-solving approaches for analytics.

## Configuration

### Changing Pi's Voice

In [lib/state.ts](lib/state.ts), modify `DEFAULT_VOICE`:

```typescript
export const DEFAULT_VOICE = 'Puck'; // Options: Puck, Charon, Kore, Fenrir, Aoede
```

### Changing Gemini Model

```typescript
export const DEFAULT_LIVE_API_MODEL = 'models/gemini-2.0-flash-exp';
```

### Customizing System Prompt

Edit [lib/tools/mastery-cards.ts](lib/tools/mastery-cards.ts) → `MASTERY_SYSTEM_PROMPT()`

### Adding Cards

Edit [lib/mvp-cards-data.ts](lib/mvp-cards-data.ts) → `MVP_CARDS` array

**Important fields for each card:**
- `imageUrl`: Path to the card image (Gemini sees this visually)
- `imageDescription`: What the image shows (sent to both Gemini and Claude)
- `learningGoal`: What concept this card teaches
- `piStartingQuestion`: Pi's opening question
- `milestones.basic`: Required understanding + points
- `milestones.advanced`: Optional deeper understanding + bonus points

**The card context is automatically formatted and sent to Gemini** via `formatCardContext()` in App.mastery.tsx. No need to modify this unless you're adding new card fields.

## Troubleshooting

### "Missing VITE_GEMINI_API_KEY"
- Make sure `.env.local` exists with your API key
- Restart the dev server after adding keys

### Microphone not working
- Check browser permissions (chrome://settings/content/microphone)
- Try HTTPS (mic requires secure context)
- Check console for getUserMedia errors

### Build warnings about chunk size
- Normal! The app includes the full Gemini SDK
- For production, consider code splitting:
  ```typescript
  // Lazy load heavy components
  const ClaudeEvaluator = lazy(() => import('./lib/evaluator/claude-judge'));
  ```

### Function calls not working
- Check console for `[App] 🔧 Tool call received`
- Verify tools are enabled in [lib/state.ts](lib/state.ts)
- Make sure `systemPrompt` includes function calling instructions

## Deployment

### Build for production:
```bash
npm run build
```

Output: `dist/` folder

### Deploy to Vercel/Netlify:
1. Connect GitHub repo
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variables in dashboard:
   - `VITE_GEMINI_API_KEY`
   - `VITE_CLAUDE_API_KEY`

### Deploy with Docker:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "run", "preview"]
```

## Contributing

### Project Structure

```
native-audio-function-call-sandbox/
├── App.mastery.tsx              # Main app (replaces original sandbox App.tsx)
├── lib/
│   ├── tools/
│   │   └── mastery-cards.ts     # Function definitions for Gemini
│   ├── state/
│   │   └── session-store.ts     # Card session state (zustand)
│   ├── evaluator/
│   │   └── claude-judge.ts      # Claude evaluation logic
│   ├── mvp-cards-data.ts        # Card content
│   └── genai-live-client.ts     # SDK client wrapper
├── components/
│   ├── cards/                   # Card UI components
│   ├── session/                 # Session header, progress
│   └── ...                      # Other UI components
└── contexts/
    └── LiveAPIContext.tsx       # React context for Gemini client
```

### Adding a New Tool

1. **Define tool** in [lib/tools/mastery-cards.ts](lib/tools/mastery-cards.ts):
   ```typescript
   {
     name: 'my_new_tool',
     description: 'What this tool does',
     parameters: { /* schema */ },
     isEnabled: true,
     scheduling: FunctionResponseScheduling.NONE,
   }
   ```

2. **Add handler** in [App.mastery.tsx](App.mastery.tsx):
   ```typescript
   case 'my_new_tool':
     handleMyNewTool(fc.args);
     break;
   ```

3. **Update prompt** to teach Pi when to call it

## Comparison with Main App

| Feature | Main App | Sandbox App |
|---------|----------|-------------|
| Audio | Custom AudioContext | Native worklets ✅ |
| Client | Custom WebSocket | Official SDK ✅ |
| Control Flow | Turn tracking + timing | Function calling ✅ |
| Stale Decisions | Complex guards needed | Impossible (atomic) ✅ |
| Multimodal | Text only | Images + audio ✅ |
| Future Updates | Manual | Automatic ✅ |
| Code Complexity | High | Low ✅ |

## License

Apache 2.0 (inherited from Google's sandbox)

## Credits

- **Google Gemini Team**: Original sandbox architecture
- **Anthropic**: Claude evaluation system
- **Your Team**: Mastery cards concept, Pi personality, UI design

---

**Built with ❤️ using Gemini 2.0 Flash + Claude Sonnet**
