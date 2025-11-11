# Mastery Cards App

**Voice-based fraction learning with Pi (your friendly alien math tutor)**

## 🎯 Overview

A voice-first learning app where students explore fraction concepts through natural conversation with Pi, an enthusiastic alien from Planet Geometrica. Uses a **dual-LLM architecture** for reliable assessment:
- **Pi (OpenAI Realtime)**: Natural voice conversation with real-time audio
- **Claude Haiku**: Mastery evaluator
- **Simple orchestration**: No complex state machines

**Status:** Production-ready with OpenAI Realtime + Claude architecture

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up API Keys

Create a `.env` file:
```bash
# OpenAI API Key (for Pi's voice conversation)
VITE_OPENAI_API_KEY=your_openai_key_here

# Claude API Key (for mastery evaluation)
VITE_CLAUDE_API_KEY=your_claude_key_here
```

Get keys:
- **OpenAI**: https://platform.openai.com/api-keys
- **Claude**: https://console.anthropic.com/

### 3. Start Development Server
```bash
npm run dev
```

App runs on **http://localhost:3000**

## ✨ Features

### 🎯 Core Experience
- **15 Fraction Cards** - Scaffolded learning from equal parts → comparing fractions
- **Voice Conversation** - Natural dialogue with Pi (OpenAI Realtime API)
- **Smart Assessment** - Claude Haiku evaluates understanding after each exchange
- **Points & Levels** - Earn points for basic/advanced/teaching mastery
- **Level-Up Animations** - Celebrate progress with visual rewards

### 🏗️ Simplified Architecture
- **OpenAI Realtime** - Built-in voice-to-voice with no audio processing needed
- **No state machines** - Simple orchestration with clean code
- **LLM-based evaluation** - Context-aware assessment vs keyword matching
- **Minimal complexity** - Easier to maintain and debug

### 🎨 UI Components
- Session header (student name, points, level)
- Visual card display with images
- Pi avatar with speaking animation
- Voice controls (mute/unmute)
- Level-up celebration animations

## 🏗️ Architecture

### Dual-LLM Flow

```
Student speaks → OpenAI Realtime (Pi) → Claude Judge → App Decision
     ↓              ↓                      ↓              ↓
 "4 cookies"    "Tell me more!"      Evaluates      Award points
 transcribed    (natural voice)      mastery level   or continue
```

### File Structure
```
src/
├── App.tsx                        # Main orchestrator
├── components/
│   ├── cards/                     # MasteryCard component
│   ├── session/                   # SessionHeader component
│   └── PiAvatar, NamePrompt, etc. # UI components
├── lib/
│   ├── openai-realtime-client.ts  # OpenAI Realtime connection
│   ├── evaluator/
│   │   └── claude-judge.ts        # Mastery evaluation logic
│   ├── prompts/
│   │   └── simple-pi-prompt.ts    # Pi's conversational personality
│   ├── cards/                     # 15 fraction cards data
│   └── state/                     # Session store (Zustand)
```

## 🎮 How It Works

### Student Experience

1. **Enter name** → Start personalized session
2. **Card 0 (Welcome)** → Pi introduces itself
3. **Card 1+** → Pi asks about fraction image
4. **Student explains** → Natural voice conversation
5. **Pi probes deeper** → "Tell me more", "What makes you think that?"
6. **2+ exchanges** → Claude evaluates understanding
7. **Decision made**:
   - **Mastery achieved** → Award points + next card
   - **Need more** → Continue conversation
   - **Stuck (5+ exchanges)** → Move on without points
8. **Repeat** → Progress through 15 cards
9. **Session complete** → See total points and level

### Under the Hood

**After each student response:**
1. Transcription captured
2. Added to conversation history
3. Exchange count incremented
4. Pi responds naturally (no tools to call)
5. After 2s delay, Claude judge evaluates:
   - Reads conversation history
   - Checks against card learning goals
   - Returns: `{ ready, masteryLevel, confidence, suggestedAction }`
6. App takes action:
   - `award_and_next`: Give points + move to next card
   - `continue`: Keep talking
   - `next_without_points`: Move on (stuck)

## 🎯 Learning Cards

**15 scaffolded fraction cards:**
- **Card 0**: Welcome (Pi introduces itself)
- **Cards 1-3**: Equal parts foundation (4 cookies, 2 brownies, 3 sandwiches)
- **Cards 4-6**: Part-whole relationships (1/2 ribbon, 1/3 pancake, 2/3 pizza slices)
- **Cards 7-9**: Unit fractions (1/4, 1/5, 1/6 water glasses)
- **Cards 10-12**: Numerator/denominator (5/6 pizza, 3/4 garden)
- **Cards 13-14**: Misconception cards (Pi has wrong thinking, student teaches Pi)
- **Card 15**: End of session celebration

## 📊 Mastery Levels

**Basic (30 points)**: Student explains the concept clearly
- Example: "There are 4 cookies and they're all equal size"

**Advanced (30 + 30 = 60 points)**: Deeper reasoning and connections
- Example: "Equal sizes matter because if we share them, everyone gets the same amount"

**Teaching (40 points)**: Correcting Pi's misconceptions
- Example: "No Pi, 1/8 is smaller than 1/4 because when you cut something into more pieces, each piece gets smaller"

## 💰 Cost

Per session (15 cards, ~4 exchanges each):
- OpenAI Realtime: ~$0.06/minute (varies by usage)
- Claude Haiku evaluations: ~$0.006 (60 calls × $0.0001)
- **Total: ~$0.10-0.20 per session**

Very affordable for production use!

## 🔧 Key Technical Decisions

### Why Dual-LLM?

**Approach:**
- **OpenAI Realtime** handles natural voice conversation (what it's built for)
- **Claude judges** understanding with context-aware evaluation
- **App orchestrates** the learning flow (what code is good at)
- Clean separation of concerns, easy to maintain

### Architecture Benefits

✅ **Simplicity**: Clean, maintainable code
✅ **Real-time voice**: Built-in audio processing with OpenAI Realtime
✅ **Flexibility**: LLM understands context vs keywords
✅ **Debuggability**: Clear logs, judge reasoning visible
✅ **Cost-effective**: ~$0.10-0.20 per session

## 🧪 Testing

```bash
# Start app
npm run dev

# Check console for logs:
[App] 🔧 Initializing OpenAI Realtime...
[App] 👤 Student (exchange 1): ...
[Judge] 🔍 Evaluating mastery...
[Judge] 📊 Evaluation result: ...
[App] ✨ Awarding X points
```

## 🐛 Troubleshooting

**"Claude API key not configured"**
- Check `.env` file exists and has valid key
- Restart dev server after adding key

**"Evaluation error"**
- Check Claude API key is valid
- Check API status (rate limits on free tier)
- Fallback: app will continue after 3 exchanges

**Pi not responding**
- Check OpenAI API key is valid
- Check browser console for WebSocket errors
- Try refreshing the page

## 🚀 Deployment

Ready for production! Just:
1. Set up environment variables
2. Build: `npm run build`
3. Deploy `dist/` folder
4. Monitor Claude judge accuracy

## 📝 Development

**Tech Stack:**
- React 19 + TypeScript
- Zustand (state management)
- OpenAI Realtime API (voice)
- Claude API (evaluation)
- Vite (build tool)

**Key Files:**
- `src/App.tsx` - Main orchestrator
- `src/lib/openai-realtime-client.ts` - OpenAI Realtime connection
- `src/lib/evaluator/claude-judge.ts` - Assessment logic
- `src/lib/prompts/simple-pi-prompt.ts` - Pi's personality
- `src/lib/cards/mvp-cards-data.ts` - Card content

---

**Built with ❤️ for curious math learners**
