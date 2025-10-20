# 🧪 Test Phase 3: Complete Multi-Agent System

## System Architecture

```
┌────────────────────────────────────────────────────────┐
│                    STUDENT                             │
│  - Speaks to microphone                                │
│  - Draws on canvas (Phase 3F - planned)                │
└──────────────────┬─────────────────────────────────────┘
                   │
                   ↓
┌────────────────────────────────────────────────────────┐
│              GEMINI LIVE API                           │
│  - Real-time voice conversation                        │
│  - Input/output transcription                          │
│  - Static system prompt (SIMILI_SYSTEM_PROMPT)         │
└──────────────────┬─────────────────────────────────────┘
                   │
                   ↓
┌────────────────────────────────────────────────────────┐
│              FRONTEND (use-live-api.ts)                │
│  - Captures transcriptions                             │
│  - Sends to backend for analysis                       │
│  - Receives multi-agent feedback                       │
│  - Injects context via JSON messages                   │
└──────────────────┬─────────────────────────────────────┘
                   │
                   ↓ POST /api/analyze
┌────────────────────────────────────────────────────────┐
│              BACKEND API SERVER                        │
│  - Privacy middleware (PII filtering)                  │
│  - Rate limiting (100/min)                             │
│  - Anonymous sessions                                  │
│  - LangGraph orchestration                             │
└──────────────────┬─────────────────────────────────────┘
                   │
                   ↓
┌────────────────────────────────────────────────────────┐
│              LANGGRAPH PIPELINE                        │
│                                                         │
│  1. Process Transcription                              │
│  2. Misconception Classifier ✓                         │
│  3. Emotional Classifier ✓                             │
│  4. Vision Agent (Phase 3F - planned)                  │
│  5. Format Context                                     │
└──────────────────┬─────────────────────────────────────┘
                   │
                   ↓ Response
┌────────────────────────────────────────────────────────┐
│              FRONTEND                                  │
│  - formatMisconceptionFeedback() ✓                     │
│  - formatEmotionalFeedback() ✓                         │
│  - Send to agent via sendTextMessage()                 │
└──────────────────┬─────────────────────────────────────┘
                   │
                   ↓
┌────────────────────────────────────────────────────────┐
│              AGENT (GEMINI LIVE)                       │
│  - Receives JSON context updates                       │
│  - Adapts teaching based on feedback                   │
│  - Responds with appropriate intervention              │
└────────────────────────────────────────────────────────┘
```

---

## Quick Start

### **Terminal 1: Backend**
```bash
cd /Users/vsrivathsan/Documents/simili-monorepo-v1
pnpm run api-server
```

### **Terminal 2: Frontend**
```bash
pnpm dev
```

### **Browser**
Open: http://localhost:5173

---

## Test Scenarios

### **Test 1: Misconception Detection** ⚠️

**Goal**: Test Phase 3D misconception detection

1. Start lesson: "Understanding Fractions..."
2. Connect
3. Say: **"I cut the chocolate into two pieces, so each is one half"**
   - *(Intentionally NOT mentioning "equal parts")*

**Expected:**
```
Console:
  [useLiveApi] 📝 Final transcription received: I cut the chocolate...
  [useLiveApi] 🔍 Sending to backend for analysis...
  [useLiveApi] ⚠️ Misconception detected: unequal-parts-as-fractions
  [useLiveApi] ✉️ Sending misconception feedback to agent...
  [useLiveApi] ✅ Misconception feedback sent!

UI:
  🔍 Detected: unequal-parts-as-fractions (87% confidence)

Agent Response:
  "That's a good start! But let me ask you something...
   What if one piece was bigger than the other?
   Would they still both be halves?"
```

---

### **Test 2: Emotional State - Frustration** 😤

**Goal**: Test Phase 3E emotional monitoring

1. Continue from Test 1
2. Say: **"I don't know... this is hard... I can't figure it out"**

**Expected:**
```
Console:
  [useLiveApi] 📝 Final transcription received: I don't know...
  [useLiveApi] 🔍 Sending to backend for analysis...
  [useLiveApi] 😊 Emotional state: frustrated
  [useLiveApi] ✉️ Sending emotional feedback to agent...
  [useLiveApi] ✅ Emotional feedback sent!

UI:
  😤 Student seems frustrated

Agent Response:
  "Hey, I know this can feel tricky at first - you're doing great!
   Let's break it down into smaller steps together..."
   (Uses encouragement, simplifies)
```

---

### **Test 3: Emotional State - Excited** 🎉

**Goal**: Test positive emotional detection

1. Continue lesson
2. Say: **"Oh! I get it now! Both pieces have to be the exact same size! That's cool!"**

**Expected:**
```
Console:
  [useLiveApi] 📝 Final transcription received: Oh! I get it now...
  [useLiveApi] 🔍 Sending to backend for analysis...
  [useLiveApi] 😊 Emotional state: excited
  [useLiveApi] ✉️ Sending emotional feedback to agent...

UI:
  (No UI indicator for positive states - by design)

Agent Response:
  "Yes! Exactly right! You've got it!
   So equal parts is the KEY to making fractions work.
   Let's build on this..."
   (Reinforces success, increases challenge slightly)
```

---

### **Test 4: Correct Understanding - No Flags** ✅

**Goal**: Verify system doesn't over-trigger

1. Say: **"To make one half, I need to divide it into 2 equal parts"**

**Expected:**
```
Console:
  [useLiveApi] 📝 Final transcription received: To make one half...
  [useLiveApi] 🔍 Sending to backend for analysis...
  [useLiveApi] ✅ No misconception detected
  (No emotional feedback - neutral state)

UI:
  (No system messages)

Agent Response:
  "Perfect! You've really understood that concept.
   Now let's try something a bit different..."
   (Continues lesson normally)
```

---

### **Test 5: Multiple Issues at Once** 😕⚠️

**Goal**: Test combined misconception + emotional detection

1. Say: **"I think 1/8 is bigger than 1/2 because 8 is more than 2... wait, that doesn't seem right..."**

**Expected:**
```
Console:
  [useLiveApi] ⚠️ Misconception detected: larger-denominator-means-larger-fraction
  [useLiveApi] 😊 Emotional state: confused

UI:
  🔍 Detected: larger-denominator-means-larger-fraction
  😕 Student seems confused

Agent Response:
  "I can see you're thinking really carefully about this!
   Let me help clarify with a visual example.
   Imagine cutting a pizza into 2 pieces vs 8 pieces..."
   (Addresses both confusion and misconception)
```

---

### **Test 6: Backend Failure Graceful** 🛡️

**Goal**: Test resilience

1. **Stop backend** (Terminal 1: Ctrl+C)
2. Say anything

**Expected:**
```
Console:
  [useLiveApi] ❌ Backend analysis failed: fetch failed

UI:
  (No error shown to user)

Agent:
  (Continues conversation normally, just without subagent insights)
```

✅ **System degrades gracefully** - conversation never stops

---

### **Test 7: Milestone Transition** 🎯

**Goal**: Test milestone context updates

1. Complete first milestone correctly
2. Agent should guide to next milestone

**Expected:**
```
Console:
  [useLiveApi] 🎯 Moving to milestone 1: Equal Partitioning Requirement
  [useLiveApi] ✉️ Sending milestone transition...

UI:
  🎉 Great job! You've mastered understanding unit fractions!
  📍 Moving to: Equal Partitioning Requirement

Agent:
  "Fantastic work on unit fractions!
   Now let's explore something important...
   What happens if the parts aren't equal?"
```

---

### **Test 8: Comprehensive Flow** 🔄

**Full Journey:**

1. **Start** → Lesson loads
2. **Student speaks** → Misconception detected
3. **Agent responds** → Addresses gently
4. **Student struggles** → Frustration detected
5. **Agent encourages** → Simplifies approach
6. **Student succeeds** → Excitement detected
7. **Agent celebrates** → Increases challenge
8. **Milestone complete** → Transition to next

**This tests the complete multi-agent pipeline!**

---

## What's Working (Phase 3A-3E)

✅ **Phase 3A: Infrastructure**
- ContextManager buffering
- FillerManager (not yet used, but ready)
- Static system prompt
- JSON context formatters

✅ **Phase 3B: Backend**
- Secure API server (port 4000)
- Privacy middleware
- Anonymous sessions
- LangGraph orchestration

✅ **Phase 3C: Cleanup**
- Removed old dynamic prompts
- Clean architecture

✅ **Phase 3D: Misconception Detection**
- MisconceptionClassifier subagent
- Real-time analysis
- Feedback to agent
- 5 misconceptions defined for 3.NF.A.1

✅ **Phase 3E: Emotional Monitoring**
- EmotionalClassifier subagent
- 6 states: frustrated, confused, excited, confident, bored, neutral
- Engagement/frustration/confusion levels
- Adaptive recommendations

---

## What's Planned (Phase 3F-3G)

📋 **Phase 3F: Vision Agent** (Deferred for testing)
- Canvas snapshot capture
- Visual misconception detection
- Drawing analysis

📋 **Phase 3G: Milestone Verification** (Built, not integrated yet)
- MilestoneVerifier created
- Hybrid keyword + LLM approach
- Ready to integrate with PedagogyEngine

---

## Debug Console Commands

### **Check Backend Health**
```bash
curl http://localhost:4000/api/health
```

### **Check Session**
```javascript
// In browser console
console.log(window.localStorage)
```

### **Force Misconception**
Say exact phrases from lesson definition:
- "I divided it into pieces" (unequal parts)
- "The top number is how many parts to divide into" (numerator confusion)
- "1/8 is bigger than 1/2" (denominator confusion)

---

## Success Criteria

### **Phase 3D (Misconception Detection)**
- [ ] Backend receives transcripts
- [ ] MisconceptionClassifier runs
- [ ] High-confidence detections sent to agent
- [ ] Agent responds with correction
- [ ] Low-confidence detections ignored

### **Phase 3E (Emotional Monitoring)**
- [ ] EmotionalClassifier runs on every turn
- [ ] Frustrated/confused states detected
- [ ] Excited/confident states detected
- [ ] Agent adjusts teaching style
- [ ] UI shows significant emotional changes

### **System Health**
- [ ] No crashes or errors
- [ ] Graceful degradation if backend fails
- [ ] Privacy: No PII stored
- [ ] Performance: <300ms backend latency
- [ ] Connection stays stable (no reconnections)

---

## Common Issues & Fixes

### **Backend not starting**
- Check port 4000: `lsof -i :4000`
- Check `GEMINI_API_KEY` in `.env`
- Run: `pnpm install`

### **No transcriptions**
- Check microphone permissions
- Enable transcription in sidebar
- Check browser console for errors

### **Backend not called**
- Check network tab: `/api/analyze` requests
- Verify proxy: http://localhost:5173/api/health
- Check `isFinal === true` in logs

### **No detections**
- Use exact misconception phrases
- Check backend logs for analysis results
- Verify confidence > 0.7 threshold

---

## Next Steps After Testing

1. **Adjust confidence thresholds** based on real data
2. **Tune emotional classifier** prompts
3. **Add Phase 3F** (vision) if needed
4. **Integrate Phase 3G** (milestone verification)
5. **Add analytics/telemetry**
6. **Production deployment**

---

**Ready to test the full multi-agent system!** 🚀

Run both servers and work through the test scenarios above.
