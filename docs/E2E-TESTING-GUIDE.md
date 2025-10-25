# 🧪 End-to-End Testing Guide

## Quick Start

```bash
cd apps/tutor-app
pnpm run dev
```

Then open: http://localhost:5173

---

## 🔄 Fresh Start (Reset Everything)

**Option 1: Use Reset Button**
- Look for the red "🔄 Reset" button in top-right corner
- Click it to clear all data and restart onboarding

**Option 2: Manual Reset**
- Open browser console (F12)
- Run: `localStorage.clear()`
- Refresh page

---

## 📋 Complete E2E Test Flow

### **1. Onboarding Experience** ✅

**Step 1: Parent Consent**
- Should see warm beige background (#F5F1E8)
- Clean neobrutalist cards with bold borders
- Three consent points with icons
- "I Agree" button at bottom

**What to Check:**
- [ ] Design is clean and kid-friendly
- [ ] All text is readable
- [ ] Button has bold border and shadow
- [ ] Hover effects work (button lifts on hover)

---

**Step 2: Avatar Selection**
- Grid of avatars (should be 4-8 options)
- Each avatar in a card with border
- Selection highlights chosen avatar

**What to Check:**
- [ ] Avatars load (if using memojis)
- [ ] Can select an avatar
- [ ] Selected avatar has highlighted border
- [ ] "Next" button appears after selection

---

**Step 3: Name Entry**
- Input field for student name
- Clean styling with border
- Character limit indicator (optional)

**What to Check:**
- [ ] Can type name
- [ ] Input has focus styling
- [ ] "Continue" button enabled after entering name

---

**Step 4: Welcome/Confirmation**
- Shows selected avatar + name
- Welcoming message
- "Start Learning" button

**What to Check:**
- [ ] Avatar displays correctly
- [ ] Name appears in welcome message
- [ ] Button leads to lesson selection

---

### **2. Lesson Selection (WelcomeScreen)** ✅

**What You Should See:**
- Featured lesson card (large, prominent)
  - Lesson title in big bold text
  - Grade level and duration
  - Thumbnail with emoji icon
  - "▶ Start Adventure" button
- "Up Next" section with smaller lesson cards
  - Scrollable horizontally
  - Each card shows lesson info

**What to Check:**
- [ ] Featured lesson displays correctly
- [ ] "NOW PLAYING" badge if lesson already loaded
- [ ] Can click lesson cards
- [ ] Smooth hover effects (cards lift slightly)
- [ ] Emoji icons visible in thumbnails

**Actions:**
- Click "▶ Start Adventure" on any lesson

---

### **3. Lesson Workspace (CozyWorkspace)** 🎯

**Initial State (Not Connected):**

**Layout Check:**
- [ ] **Header**: Back button (←) + Lesson title (centered) + spacer
- [ ] **Main Area**: Two panels side-by-side
  - Left: "Today's Challenge" (🔍 icon) - lesson image
  - Right: "Your Workspace" (✏️ icon) - canvas for drawing
- [ ] **Bottom Bar**: Pi avatar (left) + Controls (center) + Student avatar (right)
- [ ] Everything fits in viewport (no scrolling needed)

**Visual Design:**
- [ ] All panels have 4px bold borders (#1A1D2E)
- [ ] Panels have shadow offset (neobrutalist style)
- [ ] Background is warm beige (#F5F1E8)
- [ ] Avatars are circular with DiceBear images

**Bottom Control Bar:**
- [ ] Pi avatar shows (robot style from DiceBear)
- [ ] Pi status: "😴 Resting"
- [ ] "🎮 Start Learning" button (orange #FFB84D)
- [ ] Student avatar shows (adventurer style from DiceBear)
- [ ] Student status: "🎮 Ready!"

---

### **4. Connecting to Gemini Live** 🎤

**Action:** Click "🎮 Start Learning"

**What Should Happen:**
- Button changes to "⏸️ Pause" and "🎤 Mic On"
- Pi status changes to "👀 Watching"
- Browser may ask for microphone permission (grant it)

**Console Logs to Look For:**
```javascript
[StreamingConsole] 🚀 Initializing agents for lesson: [Lesson Name]
[AgentService] 📊 Initialized
[LiveAPIContext] Connecting...
[LiveAPIContext] Connected
```

**What to Check:**
- [ ] Connection successful
- [ ] Mic permission granted
- [ ] No console errors
- [ ] Pi status updates

---

### **5. First Interaction - Agent Testing** 🧠

**Action:** Say something to the tutor

**Example 1: Simple Greeting**
- Say: "Hi, I'm ready to learn!"

**Console Logs to Look For:**
```javascript
[StreamingConsole] 🧠 Student finished speaking, running agents...
[AgentService] 📊 Starting agent analysis
[AgentService] 📊 Agent analysis complete (duration: XXXms)
[StreamingConsole] ✅ Agents complete: {
  duration: 250,
  hasEmotional: true,
  hasMisconception: false
}
```

**What to Check:**
- [ ] Transcription appears in console
- [ ] Agents run (see logs above)
- [ ] Processing time is reasonable (<500ms)
- [ ] Gemini responds appropriately
- [ ] Pi status shows "💬 Helping!" while speaking

---

**Example 2: Intentional Misconception**
- Say: "I think 1/2 equals zero"

**What Should Happen:**
- Agents detect misconception
- Console shows:
  ```javascript
  [MisconceptionClassifier] ⚠️ DETECTED: fraction_to_decimal
  ```
- Gemini's response should:
  - Be encouraging (not harsh)
  - Address the misconception
  - Use an analogy (e.g., pizza analogy)

**What to Check:**
- [ ] Misconception detected in logs
- [ ] Agent context includes misconception
- [ ] Gemini's response is pedagogically appropriate
- [ ] No system errors

---

**Example 3: Show Frustration**
- Say: "This is too hard, I don't understand!"

**What Should Happen:**
- EmotionalClassifier detects frustration
- Console shows:
  ```javascript
  [EmotionalClassifier] Analyzing emotional state...
  [EmotionalClassifier] Frustration: 0.7, Confusion: 0.6
  ```
- Gemini should be extra encouraging

**What to Check:**
- [ ] Emotional analysis runs
- [ ] High frustration score logged
- [ ] Gemini is more supportive in tone
- [ ] Maybe uses a filler if agents take time

---

### **6. Canvas Drawing (Optional)** 🎨

**Action:** Use the canvas to draw

**What to Check:**
- [ ] Can draw on canvas (if tldraw is working)
- [ ] Canvas is responsive
- [ ] Drawing tools visible (if in draw mode)
- [ ] Canvas content persists

**Note:** Vision analysis not yet connected, so drawing won't be analyzed yet.

---

### **7. Progress Tracking** 📊

**What to Check:**
- [ ] If lesson has milestones, progress badge shows (⭐ X/Y)
- [ ] PedagogyEngine tracks attempts
- [ ] Milestone completion triggers celebration (if implemented)

**Console Logs:**
```javascript
[PedagogyEngine] Milestone detected
[PedagogyEngine] Progress: 2/5 milestones
```

---

### **8. System Prompt Verification** 🔍

**Action:** Check if dynamic prompts are working

**In Console, run:**
```javascript
// This will show you the current system prompt
console.log('Prompt length:', [check in Network tab or logs])
```

**Look for in console:**
```javascript
[StreamingConsole] 🔍 Setting config with prompt length: [number]
[PromptBuilder] 🏗️ Built system prompt
```

**Expected:**
- Prompt length should be > 2000 chars (base + context)
- Should update after each student turn

---

### **9. Filler Dialogue Testing** 💬

**How to Trigger:**
- Speak to tutor
- If agents take >500ms, filler should appear

**Console Logs:**
```javascript
[FillerService] 💬 Should use filler: true
[StreamingConsole] 💬 Using filler: "Hmm, let me think..."
```

**Note:** Filler is currently only logged, not spoken (Phase 3 feature)

**What to Check:**
- [ ] Filler decision logged
- [ ] Filler text appropriate for context
- [ ] Rate limiting works (not too many fillers)

---

### **10. Session Controls** 🎮

**Test Each Control:**

**Pause Button:**
- [ ] Click "⏸️ Pause"
- [ ] Should disconnect
- [ ] Button changes back to "🎮 Start Learning"

**Mic Toggle:**
- [ ] Click "🔇 Unmute" / "🎤 Mic On"
- [ ] Should toggle microphone
- [ ] Icon changes

**Help Button:**
- [ ] Click "💬 Help"
- [ ] Should trigger help (currently may show popup)

**Export Button:**
- [ ] Click "💾"
- [ ] Should download conversation log (JSON)
- [ ] File should contain turns and context

**Reset Button:**
- [ ] Click "🔄"
- [ ] Should clear conversation
- [ ] Should stay on same lesson

---

### **11. Back Navigation** ⬅️

**Action:** Click back button (←) in header

**What Should Happen:**
- Returns to WelcomeScreen
- Conversation cleared
- Can select different lesson

**What to Check:**
- [ ] Back button works
- [ ] Conversation state reset
- [ ] Can start new lesson

---

### **12. Reset & Restart** 🔄

**Action:** Click red "🔄 Reset" button (top-right corner)

**What Should Happen:**
- Confirmation dialog appears
- If confirmed:
  - LocalStorage cleared
  - Page reloads
  - Returns to onboarding

**What to Check:**
- [ ] Confirmation dialog shows
- [ ] Can cancel
- [ ] If confirmed, onboarding restarts
- [ ] All previous data cleared

---

## 🎯 Key Success Criteria

### **Must Work:**
- [x] Onboarding flow completes
- [x] Lesson loads successfully
- [x] Can connect to Gemini Live
- [x] Audio transcription works
- [x] Agents run on each turn
- [x] System prompt updates dynamically
- [x] No critical console errors

### **Should Work:**
- [x] Misconception detection (basic keywords)
- [x] Emotional analysis (mock data)
- [x] Filler logic executes (logged)
- [x] Progress tracking
- [x] All controls functional

### **Not Yet Working (Phase 3):**
- [ ] Real LLM agent analysis (using mocks)
- [ ] Fillers spoken by Gemini
- [ ] Vision analysis of canvas
- [ ] Advanced misconception detection

---

## 🐛 Common Issues & Fixes

### **Issue: No agent logs appearing**
**Fix:** Agents are running silently. Check:
```javascript
[AgentService] 📊 Starting agent analysis
```
If missing, agents aren't initialized properly.

---

### **Issue: System prompt not updating**
**Symptom:** Prompt length always same in logs  
**Fix:** Check if `useAgentContext` hook is being used  
**Verify:** Look for `[PromptBuilder]` logs

---

### **Issue: Microphone not working**
**Fix:** 
- Grant microphone permission in browser
- Check browser compatibility (Chrome recommended)
- Ensure HTTPS or localhost

---

### **Issue: Canvas not drawing**
**Symptom:** Click on canvas, nothing happens  
**Note:** Canvas might need draw mode activated  
**Check:** Look for drawing tools in UI

---

### **Issue: Connection fails**
**Fix:** 
- Check `.env` file has `GEMINI_API_KEY`
- Restart dev server
- Check API key is valid

---

## 📊 Agent Debug Checklist

**Open Console Before Testing!**

### **When student speaks, you should see:**

1. **Transcription:**
   ```
   [LiveAPIContext] Input transcription: "I think..."
   ```

2. **Agent Analysis Starts:**
   ```
   [StreamingConsole] 🧠 Student finished speaking, running agents...
   [AgentService] 📊 Starting agent analysis
   ```

3. **Agents Complete:**
   ```
   [AgentService] 📊 Agent analysis complete (duration: 250ms)
   [StreamingConsole] ✅ Agents complete: {...}
   ```

4. **Context Update:**
   ```
   [PromptBuilder] 🏗️ Built system prompt
   ```

5. **Config Update:**
   ```
   [StreamingConsole] 🔍 Setting config with prompt length: 3456
   ```

**If any of these are missing, something's not wired correctly!**

---

## 🎓 What to Look For (Agent Behavior)

### **Emotional Analysis:**
- Mock data returns neutral state
- Should see engagement/frustration scores in logs
- Future: Real LLM will detect actual emotional state

### **Misconception Detection:**
- Currently basic keyword matching
- Will detect "equals 0" patterns
- Future: Real LLM will detect conceptual errors

### **Pedagogy Engine:**
- Tracks milestone attempts
- Updates progress
- Should work in real-time

---

## 📹 Ideal Test Recording

**Record your screen showing:**
1. Fresh onboarding completion
2. Lesson selection
3. Connection to Gemini
4. Speaking 3-5 different inputs
5. Console showing agent logs
6. Gemini's responses
7. Controls working (pause, reset, etc.)

**Share recording to identify any issues!**

---

## ✅ E2E Test Completion Checklist

- [ ] Completed onboarding (all 4 steps)
- [ ] Selected and loaded a lesson
- [ ] Connected to Gemini Live successfully
- [ ] Spoke to tutor and got response
- [ ] Saw agent logs in console
- [ ] Tested intentional misconception
- [ ] Tested emotional expression
- [ ] System prompt updated after each turn
- [ ] All controls work (pause, mic, help, export, reset)
- [ ] Back navigation works
- [ ] Reset button clears everything
- [ ] No critical errors in console

---

## 🚀 Ready to Test!

```bash
cd apps/tutor-app
pnpm run dev
```

**Then:** Follow this guide step-by-step and check off items as you go!

**Report any issues you find!** 🐛
