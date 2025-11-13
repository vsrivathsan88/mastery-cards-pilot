# Complete Testing Guide - Verify Everything Works

**Purpose:** Step-by-step testing protocol with console verification  
**Date:** 2025-11-09

---

## 🚀 Pre-Flight Checklist

### Step 1: Enable Debug Mode

Edit `.env.local`:
```bash
VITE_PILOT_MODE=true
VITE_DEBUG_MODE=true  # ← ADD THIS for enhanced logging
GEMINI_API_KEY=your_actual_key_here
```

### Step 2: Start the App

```bash
cd apps/tutor-app
npm install  # If first time
npm run dev
```

**Expected:** Server starts on http://localhost:5173

---

## 📋 Console Verification Protocol

### Phase 1: Startup Checks (First 5 seconds)

**Open browser console (F12 → Console tab)**

#### Expected Console Output:

```
╔══════════════════════════════════════════════════════════╗
║       🧪 PILOT APP DEBUG MODE ENABLED 🧪                ║
╚══════════════════════════════════════════════════════════╝
📝 All system events will be logged below
⏱️ Session started at: 10:30:45 AM

[state] 🧪 Pilot mode ENABLED: Merging lesson + pilot tools
[state] 🔧 Lesson tools: 4 [show_image, mark_milestone_complete, ...]
[state] 🧪 Pilot tools: 5 [draw_on_canvas, add_canvas_label, ...]
[state] ✅ Total tools: 9 [show_image, mark_milestone_complete, ...]
[state] 📊 Tool status: 9 enabled, 0 disabled
```

#### ✅ Startup Checklist:

- [ ] "PILOT APP DEBUG MODE ENABLED" appears
- [ ] "Pilot mode ENABLED" message shows
- [ ] Total tools: 9 (not 0, not 4)
- [ ] All 9 tools listed by name
- [ ] "9 enabled, 0 disabled"

#### ❌ If You See This:

```
[state] ℹ️ Pilot mode DISABLED: Using only lesson tools
```

**Problem:** `.env.local` not configured correctly  
**Fix:** Check VITE_PILOT_MODE=true is set

---

### Phase 2: Lesson Load (When you start)

#### Click "Start Learning" or Connect

**Expected Console Output:**

```
[StreamingConsole] 🔍 Setting config with:
  promptLength: 7234
  toolCount: 9
  tools: Array(9) ['show_image', 'mark_milestone_complete', ...]
  isConnected: false
  prevToolCount: 0

[StreamingConsole] ✅ Config set with 9 tools
[StreamingConsole] 🎉 Perfect! All 9 tools loaded

[useLiveApi] 🔌 Connecting with config:
  toolsCount: 9
  toolNames: Array(9) ['show_image', 'mark_milestone_complete', ...]

[useLiveApi] ✅ Tools will be registered: show_image, mark_milestone_complete, ...
[useLiveApi] ✅ Connected successfully!
[useLiveApi] ✉️ Sending lesson context after connection...
[useLiveApi] ✅ Lesson context sent!
```

#### ✅ Connection Checklist:

- [ ] Config shows toolCount: 9
- [ ] "🎉 Perfect! All 9 tools loaded"
- [ ] Connection shows toolsCount: 9 (matches config)
- [ ] "✅ Connected successfully!"
- [ ] "✅ Lesson context sent!"

#### ❌ If You See This:

```
[StreamingConsole] ❌ CRITICAL: No tools in config!
```

**Problem:** Tools didn't load before config was set  
**Fix:** Refresh page, tools should auto-reconnect

```
[StreamingConsole] ⚠️ WARNING: Expected 9 tools, got 4
```

**Problem:** Pilot tools not merged  
**Fix:** Check pilot mode is enabled

---

### Phase 3: Milestone Detection (Say a keyword)

#### Say: "bigger" or "different"

**Expected Console Output:**

```
[useLiveApi] 📝 Final transcription received: "bigger"
[useLiveApi] 🔄 Sending transcription to PedagogyEngine for keyword matching...

[PedagogyEngine] 🎯 Milestone progress: "Warm-Up: Spot the Difference"
[PedagogyEngine]   Keywords: bigger
[PedagogyEngine]   Student: "bigger"
[PedagogyEngine] 📊 Emitting progress update for UI...
[PedagogyEngine] ✅ Milestone complete!

[useLiveApi] 🎯 MILESTONE DETECTED EVENT:
  milestoneId: "milestone-0-warmup"
  milestoneTitle: "Warm-Up: Spot the Difference"
  keywordsMatched: ["bigger"]

[useLiveApi] ✅ Teacher panel updated - milestone progress
[useLiveApi] 📊 Total milestone logs in panel: 1
```

#### ✅ Milestone Checklist:

- [ ] Transcription received
- [ ] PedagogyEngine detects keyword
- [ ] "📊 Emitting progress update for UI"
- [ ] MILESTONE DETECTED EVENT fires
- [ ] Teacher panel log count increments
- [ ] Progress bar updates on screen

#### ❌ If You See This:

```
[useLiveApi] 📝 Final transcription received: "bigger"
(no further logs)
```

**Problem:** PedagogyEngine not processing transcription  
**Possible:** Wrong keywords or milestone not active

---

### Phase 4: Tool Calls (Pi calls a tool)

#### Wait for Pi to call a tool (mark_milestone_complete, show_image, etc.)

**Expected Console Output:**

```
[useLiveApi] 🔧 TOOL CALL RECEIVED:
  functionCallsCount: 1
  functionNames: ['mark_milestone_complete']

[useLiveApi] ✅ Milestone completed via tool call: milestone-0-warmup
[useLiveApi] 📝 Next milestone logged to teacher panel: Act 1: Luna's Birthday Cookie Challenge
[useLiveApi] 🎯 Moving to milestone 1: Act 1: Luna's Birthday Cookie Challenge
[useLiveApi] ✉️ Sending milestone transition...
[useLiveApi] ✅ Milestone transition sent!
```

**For show_image:**

```
[useLiveApi] 🔧 TOOL CALL RECEIVED:
  functionNames: ['show_image']

[useLiveApi] 🖼️ TOOL CALL: show_image
  imageId: "unequal-cookie-kids"
  context: "revealing the unfair cutting"

[LessonStore] 🖼️ Setting current image: unequal-cookie-kids
[useLiveApi] ✅ Current image set to: unequal-cookie-kids
```

**For pilot tools:**

```
[useLiveApi] 🔧 TOOL CALL RECEIVED:
  functionNames: ['draw_on_canvas']

[useLiveApi] 🎨 PILOT: Drawing on canvas
  shapeType: "circle"
  purpose: "highlight equal parts"

[useLiveApi] ✅ Drawing added to canvas: circle
```

#### ✅ Tool Call Checklist:

- [ ] "🔧 TOOL CALL RECEIVED" appears
- [ ] Tool name shown correctly
- [ ] Tool handler executes (see tool-specific logs)
- [ ] Function response sent back
- [ ] No errors in execution

#### ❌ If Tools Don't Fire:

**Problem:** Pi not calling tools  
**Possible reasons:**
1. Tools not registered with Gemini
2. System prompt doesn't mention tools
3. Pi doesn't know when to use tools

**Check:**
```
[useLiveApi] ✅ Tools will be registered: show_image, mark_milestone_complete, ...
```

If missing, tools weren't sent to Gemini API!

---

### Phase 5: Canvas Drawing (Pilot Feature)

#### Say: "Can you draw a circle?"

**Expected Console Output:**

```
[useLiveApi] 🎨 PILOT: Drawing on canvas
  shapeType: "circle"
  coordinates: { cx: 200, cy: 200, radius: 50 }
  purpose: "demonstration"

[CanvasManipulationService] Drawing circle at (200, 200)
[useLiveApi] ✅ Drawing added to canvas: circle
[useLiveApi] 🎨 Pi drew circle: demonstration
```

#### ✅ Canvas Checklist:

- [ ] Tool call received
- [ ] Canvas manipulation service executes
- [ ] Shape appears on canvas
- [ ] Teacher panel logs the action

---

### Phase 6: Emoji Reactions (Pilot Feature)

#### Wait for Pi to send encouragement

**Expected Console Output:**

```
[useLiveApi] 😊 PILOT: Showing emoji reaction
  emoji: "🎉"
  intensity: "celebration"
  reason: "Great work spotting the difference!"

[EmojiReactionStore] Showing reaction: 🎉
[useLiveApi] ✅ Emoji reaction shown: 🎉
```

#### ✅ Emoji Checklist:

- [ ] Tool call received
- [ ] Emoji appears on screen
- [ ] Animation plays
- [ ] Auto-dismisses after duration

---

### Phase 7: Canvas Analysis (Pilot Feature)

#### Draw something, then say: "Look at my drawing"

**Expected Console Output:**

```
[useLiveApi] 👁️ PILOT: Analyzing canvas
  purpose: "Student requested feedback"
  lookingFor: "equal partitioning"

[useLiveApi] 📸 Getting canvas snapshot...
[useLiveApi] ✅ Canvas analysis complete (placeholder)
[useLiveApi] 👁️ Pi analyzed canvas: Student requested feedback

Response to Pi:
{
  success: true,
  description: "Canvas analysis not yet implemented - using placeholder",
  interpretation: "Looking for: equal partitioning",
  confidence: 0.5
}
```

#### ✅ Vision Checklist:

- [ ] Tool call triggered by student request
- [ ] Canvas snapshot obtained
- [ ] Analysis results returned
- [ ] Pi responds based on results

**Note:** Vision analysis is placeholder - returns mock data

---

### Phase 8: Teacher Panel (Real-time Updates)

#### Click the 📊 icon to open teacher panel

**Expected Console Output:**

```
[TeacherPanel] 📊 Opening panel
[TeacherPanel] Current state:
  milestoneLogs: 3
  outcomeEvidence: 12
  totalTranscripts: 45

[TeacherPanel] Tab switched to: progress
```

#### ✅ Teacher Panel Checklist:

- [ ] Panel opens smoothly
- [ ] Milestone logs visible
- [ ] Transcription log updating
- [ ] Progress tab shows milestones
- [ ] Export button works

---

### Phase 9: Complete Flow Test (End-to-End)

#### Full Interaction Test:

1. **Start lesson** → Check: 9 tools loaded
2. **Say warmup keyword** → Check: Progress updates
3. **Pi calls show_image** → Check: Image switches
4. **Draw on canvas** → Check: Canvas ready
5. **Pi draws on canvas** → Check: Shape appears
6. **Complete milestone** → Check: Celebration fires
7. **Open teacher panel** → Check: Data populated
8. **Say "look at my drawing"** → Check: Vision tool fires

**Expected:** All phases pass without errors

---

## 🎯 System Health Summary

### At end of session, console should show:

```
═══════════════════════════════════════
🔍 SYSTEM CHECK RESULTS
═══════════════════════════════════════
✅ Pilot Mode Enabled
✅ All 9 Tools Loaded
✅ Connection Successful
✅ Tools Registered with Gemini
✅ Milestone Detection Working
✅ Progress Updates Real-time
✅ Tool Calls Firing
✅ Canvas Drawing Available
✅ Emoji Reactions Working
✅ Vision Analysis Available
✅ Teacher Panel Updating
✅ Image Switching Working
═══════════════════════════════════════
🎉 ALL SYSTEMS GO! Ready for pilot study!

📊 DEBUG SESSION STATS
   Total logs: 247
   Session time: 5m 32s
```

---

## ⚠️ Common Issues & Fixes

### Issue 1: No tools loaded (0 tools)

**Symptoms:**
```
[state] ℹ️ Pilot mode DISABLED: Using only lesson tools
```

**Fix:**
```bash
# Check .env.local
cat apps/tutor-app/.env.local

# Should contain:
VITE_PILOT_MODE=true
```

**Restart app after fixing**

---

### Issue 2: Only 4 tools instead of 9

**Symptoms:**
```
[StreamingConsole] ⚠️ WARNING: Expected 9 tools, got 4
```

**Cause:** Pilot tools not merged

**Fix:**
1. Check pilot-config.ts: `enabled: true`
2. Check state.ts: Uses `getLessonTools()`
3. Restart app

---

### Issue 3: Tools not firing

**Symptoms:**
```
[useLiveApi] 📝 Final transcription received
(but no tool calls)
```

**Possible causes:**
1. Tools not registered: Check for "✅ Tools will be registered"
2. Pi doesn't know when to use: Check system prompt
3. Connection issue: Try reconnecting

**Fix:**
- Disconnect and reconnect
- Should see auto-reconnect if tools loaded after connection

---

### Issue 4: Milestone UI not updating

**Symptoms:**
- Say keyword but progress bar doesn't move
- Console shows keyword detected but no UI change

**Check for:**
```
[PedagogyEngine] 📊 Emitting progress update for UI...
```

**If missing:**
- PedagogyEngine not emitting progress on detection
- Check PedagogyEngine.ts has `this.emitProgress()`

---

### Issue 5: Canvas tools not working

**Symptoms:**
```
[useLiveApi] ❌ PILOT: Canvas not ready yet
```

**Cause:** Canvas not initialized

**Fix:**
- Wait a few seconds after page load
- Canvas needs to mount first
- Try again after lesson starts

---

### Issue 6: Image not switching

**Symptoms:**
- Pi talks about different image but display doesn't change
- Tool call fires but image same

**Check for:**
```
[LessonStore] 🖼️ Setting current image: unequal-cookie-kids
```

**If missing:**
- show_image tool not firing
- Check tool is in registered tools list

---

## 🧪 Advanced Debugging

### Enable ALL Debug Features:

```bash
# .env.local
VITE_PILOT_MODE=true
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=verbose  # If supported
```

### Chrome DevTools Tips:

1. **Filter Console:**
   - Type `PILOT` to see only pilot tool logs
   - Type `ERROR` to see only errors
   - Type `🔧` to see only tool calls

2. **Preserve Logs:**
   - Right-click console → "Preserve log"
   - Keeps logs across page refreshes

3. **Save Logs:**
   - Right-click console → "Save as..."
   - Export for debugging later

4. **Network Tab:**
   - Watch WebSocket connection
   - See messages sent to Gemini API
   - Verify tool responses

---

## 📊 Success Criteria

### Before Pilot Launch:

All must be ✅:

- [ ] Console shows "PILOT APP DEBUG MODE ENABLED"
- [ ] 9 tools loaded (4 lesson + 5 pilot)
- [ ] Connection successful
- [ ] Milestone detection working
- [ ] Progress bar updates in real-time
- [ ] Images switch with story
- [ ] Canvas drawing works (student)
- [ ] Canvas manipulation works (Pi)
- [ ] Emoji reactions appear
- [ ] Canvas analysis triggers
- [ ] Teacher panel updates
- [ ] No critical errors in console

### Optional but Recommended:

- [ ] Test with 1-2 kids informally
- [ ] Verify celebrations feel rewarding
- [ ] Check button text is kid-friendly
- [ ] Verify error messages are clear

---

## 🎉 You're Ready When...

**Console shows:**
```
🎉 ALL SYSTEMS GO! Ready for pilot study!
```

**And you've tested:**
- Complete lesson flow
- Tool calls work
- Canvas features work
- Teacher panel updates
- No errors during 5-minute session

**Then:** Launch the 10-kid pilot study! 🚀

---

## 📝 Testing Checklist Template

Print this and check off during testing:

```
[ ] App starts without errors
[ ] Pilot mode enabled in console
[ ] 9 tools loaded
[ ] Connection successful
[ ] Lesson context sent
[ ] Warmup keyword detected
[ ] Progress bar updates
[ ] Milestone completes
[ ] Image switches
[ ] Canvas ready for drawing
[ ] Pi can draw on canvas
[ ] Emoji reactions work
[ ] Canvas analysis triggers
[ ] Teacher panel opens
[ ] Teacher panel has data
[ ] Export works
[ ] No console errors
[ ] Session runs 5+ minutes smoothly
```

**All checked?** → Ready for pilot! ✅
