# E2E Testing Guide for Mastery Cards App

## Overview

The Mastery Cards app is now ready for end-to-end testing with full voice integration, tool calling, and debug panel for eval analysis.

## Prerequisites

1. **Gemini API Key**: Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. **Environment Setup**:
   ```bash
   cp .env.template .env.local
   # Add your API key to .env.local:
   # VITE_GEMINI_API_KEY=your_key_here
   ```
3. **Start the app**:
   ```bash
   pnpm dev
   # App runs on http://localhost:5174
   ```

## Complete E2E Flow

### 1. **Session Start**
- Open app → Name prompt appears
- Enter student name (e.g., "Alex")
- Name is used by Pi throughout the session
- Session initializes with 10 scaffolded fraction cards

### 2. **Card Presentation**
- Card displays:
  - **Title**: "What Are Equal Parts?"
  - **Question**: "Look at these two circles. Which one is divided into equal parts? Why does that matter?"
  - **Points Badge**: 💎 +10
- Progress bar shows 0/10 cards
- Level 1, 0 points displayed in header

### 3. **Voice Interaction**
- Click **"Start Voice Session"** button
- Debug panel shows: "Connecting to Gemini Live..."
- When connected: "✅ Connected to Pi!"
- Pi introduces herself and asks about the card
- Student responds via microphone

### 4. **Pi Assessment**
Pi listens to student's explanation and makes a decision:

#### **Scenario A: Mastery** (swipe_right)
- Student explains correctly: "The left circle is divided into equal parts because both halves are the same size..."
- Pi calls `swipe_right` tool with:
  ```json
  {
    "cardId": "card-01-equal-parts-identify",
    "evidence": "Correctly explained equal partitioning",
    "confidence": 0.95
  }
  ```
- Debug panel logs:
  - Tool Call: `✅ swipe_right`
  - System: "Card mastered! +10 points"
- Card automatically transitions to next (1.5s delay)
- Points update: 0 → 10
- Streak: 0 → 1

#### **Scenario B: Needs Practice** (swipe_left)
- Student shows confusion: "Um, the right one because it has more parts?"
- Pi calls `swipe_left` tool with:
  ```json
  {
    "cardId": "card-01-equal-parts-identify",
    "reason": "Misunderstood what equal parts means",
    "difficulty": "hard"
  }
  ```
- Debug panel logs:
  - Tool Call: `📝 swipe_left`
  - System: "Card needs practice (hard)"
- Card transitions to next
- Streak resets to 0
- Card scheduled for spaced repetition (15 min)

### 5. **Progress Through Cards**
- Each card follows same pattern:
  1. Pi reads card question
  2. Student explains
  3. Pi assesses (swipe_right or swipe_left)
  4. Automatic transition
- Progress bar updates: 1/10 → 2/10 → ... → 10/10
- Points accumulate with bonuses:
  - Base points (10, 15, or 25 based on card)
  - Streak bonus (+2 to +10)
  - Speed bonus (+3 if under 30s)

### 6. **Session Complete**
- After 10th card, shows completion screen:
  - Pi avatar with excited expression
  - "🎉 Session Complete!"
  - Total points earned
  - "Start New Session" button

## Debug Panel Features

### Toggle Debug Panel
- Click **"🐛 Debug"** button (bottom-left)
- Panel opens showing 3 tabs

### Tab 1: 💬 Transcript
Shows full conversation with timestamps:
```
[4:15:23.456 PM]
👤 Student: The left circle because both parts are the same size

[4:15:25.789 PM]
🤖 Pi: Perfect! That's exactly right. Equal parts means each piece is the same size.
```

### Tab 2: 🔧 Tool Calls
Shows all Pi's decisions:
```
[4:15:26.123 PM]
✅ swipe_right
{
  "cardId": "card-01-equal-parts-identify",
  "evidence": "Correctly explained equal partitioning",
  "confidence": 0.95
}
```

### Tab 3: 📊 Session Stats
- Total Messages: 45
- Tool Calls: 10
- User Messages: 22
- Pi Messages: 23

### Export Logs
- Click **"💾 Export"** button
- Downloads `mastery-cards-debug-{timestamp}.json` with:
  - Full transcript
  - All tool calls with arguments
  - Session metadata
  - Timestamps for every event

## Running Evals

### Manual Eval Flow
1. Start session with test student name
2. Go through cards with deliberate responses (correct, incorrect, confused)
3. Monitor Debug Panel for Pi's decisions
4. Export logs after session
5. Analyze tool calls for accuracy

### Key Metrics to Track
- **Accuracy**: Does Pi correctly identify mastery vs. needs practice?
- **Confidence calibration**: Are confidence scores (0.0-1.0) reasonable?
- **Evidence quality**: Does Pi capture what student said?
- **Consistency**: Similar responses → similar decisions?
- **Edge cases**: How does Pi handle partial understanding, misconceptions?

### Example Eval Scenarios

#### Test Case 1: Perfect Understanding
- **Card**: "What does 1/2 mean?"
- **Response**: "It means one part when you divide something into two equal pieces"
- **Expected**: `swipe_right`, confidence ≥ 0.9
- **Check**: Evidence mentions "equal parts" and "two pieces"

#### Test Case 2: Misconception
- **Card**: "Which is bigger - 1/3 or 1/2?"
- **Response**: "1/3 because 3 is bigger than 2"
- **Expected**: `swipe_left`, difficulty "hard" or "again"
- **Check**: Reason mentions "denominator misconception"

#### Test Case 3: Partial Understanding
- **Card**: "What does 2/3 mean?"
- **Response**: "Um, two of something divided by three?"
- **Expected**: `swipe_left`, difficulty "good" (close but not quite)
- **Check**: Confidence 0.4-0.6 range

## Troubleshooting

### Voice not working
- Check `.env.local` has valid API key
- Check browser console for errors
- Ensure microphone permissions granted
- Try disconnecting and reconnecting

### Tool calls not firing
- Check Debug Panel → System tab for errors
- Verify system prompt was loaded (check console)
- Check tool definitions in swipe-tools.ts

### Cards not transitioning
- Tool calls trigger 1.5s delayed transition
- Check Debug Panel for successful tool call
- Check session store state in React DevTools

## Next Steps for Production

### Audio Output (Currently Disabled)
- Audio playback of Pi's voice responses
- Requires AudioStreamer integration
- Currently text-only (transcription works)

### Spaced Repetition
- Cards marked "needs practice" should return
- Currently: cards just noted, not rescheduled
- Need to implement review queue

### Multi-Session Persistence
- Save student progress across sessions
- Require database/localStorage integration
- Currently: session resets on refresh

### Enhanced Debug Panel
- Real-time transcript (currently logs final only)
- Audio waveform visualization
- Confidence score graphs
- Export formats (CSV, JSON, PDF)

## Technical Architecture

```
User → Voice Input
  ↓
Gemini Live API (voice → text transcription)
  ↓
Pi (LLM) processes student response
  ↓
Tool Call Decision (swipe_right or swipe_left)
  ↓
Tool Handler (use-live-api.ts)
  ↓
Session Store Update (points, streak, progress)
  ↓
Debug Store Log (transcript + tool call)
  ↓
UI Update (card transition)
```

## File Structure

```
src/
├── hooks/
│   └── use-live-api.ts          # Voice connection & tool handlers
├── lib/
│   ├── genai-live-client.ts     # Gemini Live wrapper
│   ├── state/
│   │   ├── session-store.ts     # Session progress
│   │   └── debug-store.ts       # Transcript & tool calls
│   ├── prompts/
│   │   └── cards-system-prompt.ts  # Pi's instructions
│   └── tools/
│       └── swipe-tools.ts       # Tool definitions
├── components/
│   ├── DebugPanel.tsx           # Eval testing UI
│   ├── NamePrompt.tsx           # Student name input
│   └── ControlTray.tsx          # Voice controls
└── App.tsx                      # Main orchestration
```

## Success Criteria

✅ **E2E Flow Complete** when:
1. Student can enter name and start session
2. Pi connects via voice successfully
3. Pi asks questions about cards via voice
4. Student can respond via voice (transcribed correctly)
5. Pi makes swipe_right/swipe_left decisions
6. Tool calls execute and cards transition
7. Points, streak, and progress update correctly
8. Debug Panel captures full transcript and tool calls
9. Logs can be exported for analysis
10. Session completes after 10 cards

---

**Ready to test!** Open http://localhost:5174 and start a session. Use the Debug Panel to monitor Pi's decisions and export logs for eval analysis.
