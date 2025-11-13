# End-to-End System Verification Guide

**Purpose:** Verify the ENTIRE system works after all fixes  
**Date:** 2025-11-09

---

## Expected Console Output (Complete Flow)

### 1. Initial Setup
```
[useLiveApi] 📚 Loading lesson: The Equal Parts Challenge
[useLiveApi] ✅ Teacher Panel session started: <session-id>
[useLiveApi] 📝 First milestone logged to teacher panel: Warm-Up: Spot the Difference
[StreamingConsole] 🚀 Initializing agents for lesson: The Equal Parts Challenge
[StreamingConsole] 📊 Starting teacher panel session
```

### 2. Config Setup with Tools
```
[StreamingConsole] 🔍 Setting config with: {
  promptLength: 7234,
  toolCount: 4,  // ✅ MUST BE > 0!
  tools: ['show_image', 'mark_milestone_complete', 'update_milestone_progress', 'highlight_canvas_area'],
  configUpdateCount: 0,
  isConnected: false,
  prevToolCount: 0
}
[StreamingConsole] ✅ Config set with 4 tools
```

### 3. Connection with Tools
```
[useLiveApi] 🔌 Connecting with config: {
  hasSystemInstruction: true,
  promptLength: 7234,
  toolsCount: 4,  // ✅ MUST BE > 0!
  toolNames: ['show_image', 'mark_milestone_complete', 'update_milestone_progress', 'highlight_canvas_area']
}
[useLiveApi] ✅ Tools will be registered: show_image, mark_milestone_complete, ...
[useLiveApi] ✅ Connected successfully!
[useLiveApi] ✉️ Sending lesson context after connection...
[useLiveApi] ✅ Lesson context sent!
```

### 4. Student Speaks (Transcription)
```
[useLiveApi] 📝 Final transcription received: "that one's bigger"
[useLiveApi] 🔄 Sending transcription to PedagogyEngine for keyword matching...
[PedagogyEngine] 🎯 Milestone progress: "Warm-Up: Spot the Difference"
[PedagogyEngine]   Keywords: bigger
[PedagogyEngine]   Student: "that one's bigger"
[PedagogyEngine] ✅ Milestone complete!
[useLiveApi] ✅ Transcription processed by PedagogyEngine
```

### 5. Milestone Detection Event
```
[useLiveApi] 🎯 MILESTONE DETECTED EVENT: {
  milestoneId: "milestone-0-warmup",
  milestoneTitle: "Warm-Up: Spot the Difference",
  transcription: "that one's bigger...",
  keywordsMatched: ["bigger"]
}
[useLiveApi] ✅ Teacher panel updated - milestone progress
[useLiveApi] 📊 Total milestone logs in panel: 1
```

### 6. Milestone Completion Event
```
[PedagogyEngine] Milestone completed: Warm-Up: Spot the Difference
[useLiveApi] 🧪 Outcome evidence collected: { ... }
[useLiveApi] ✅ Milestone completion logged to teacher panel: milestone-0-warmup
[useLiveApi] 📝 Next milestone logged to teacher panel: Act 1: Luna's Birthday Cookie Challenge
[useLiveApi] 🎯 Moving to milestone 1: Act 1: Luna's Birthday Cookie Challenge
[useLiveApi] ✉️ Sending milestone transition...
[useLiveApi] ✅ Milestone transition sent!
```

### 7. Tool Call (show_image)
```
[useLiveApi] 🔧 TOOL CALL RECEIVED: {
  functionCallsCount: 1,
  functionNames: ['show_image']
}
[useLiveApi] 🖼️ TOOL CALL: show_image { imageId: "unequal-cookie-kids", context: "..." }
[LessonStore] 🖼️ Setting current image: unequal-cookie-kids
[useLiveApi] ✅ Current image set to: unequal-cookie-kids
```

---

## Step-by-Step Testing Protocol

### Phase 1: Initial Verification

1. **Open browser console** (F12 → Console tab)
2. **Clear console** (to see fresh logs)
3. **Load the app**
4. **Look for:** `[useLiveApi] 📚 Loading lesson`
   - ✅ Should see lesson title
   - ✅ Should see teacher panel session started

### Phase 2: Tool Registration Verification

5. **DO NOT CONNECT YET**
6. **Look for:** `[StreamingConsole] 🔍 Setting config with: { toolCount: X }`
   - ✅ toolCount should be 4 (or more)
   - ✅ tools array should list: show_image, mark_milestone_complete, etc.
   - ❌ If toolCount is 0, STOP - tools didn't load!

### Phase 3: Connection Verification

7. **Click "Start" / "Connect"**
8. **Look for:** `[useLiveApi] 🔌 Connecting with config`
   - ✅ toolsCount: 4 (must match above)
   - ✅ "Tools will be registered: show_image, ..."
9. **Look for:** `[useLiveApi] ✅ Connected successfully!`
10. **Look for:** `[useLiveApi] ✅ Lesson context sent!`

### Phase 4: Milestone Detection Verification

11. **Say a keyword** from warmup milestone
    - Options: "different", "bigger", "smaller", "not the same"
12. **Look for:** `[PedagogyEngine] 🎯 Milestone progress`
    - ✅ Should show milestone title
    - ✅ Should show matched keywords
13. **Look for:** `[useLiveApi] 🎯 MILESTONE DETECTED EVENT`
    - ✅ Should show milestone details
14. **Look for:** `[useLiveApi] 📊 Total milestone logs in panel: 1`
    - ✅ Number should increase

### Phase 5: Teacher Panel Verification

15. **Open teacher panel** (click 📊 icon)
16. **Go to "Milestones" tab**
    - ✅ Should see at least 1 entry
    - ✅ Entry should show keyword and transcription
17. **Go to "Transcript" tab**
    - ✅ Should see your speech transcribed
    - ✅ Should see Pi's responses

### Phase 6: Tool Call Verification

18. **Wait for Pi to respond to your warmup answer**
19. **Pi should call mark_milestone_complete**
20. **Look for:** `[useLiveApi] 🔧 TOOL CALL RECEIVED`
    - ✅ functionNames should include 'mark_milestone_complete'
21. **Look for:** `[useLiveApi] ✅ Milestone completed via tool call`

### Phase 7: Image Switching Verification

22. **Pi should now start Act 1 story**
23. **Listen for:** "Luna tries to cut it..." or similar
24. **Look for:** `[useLiveApi] 🔧 TOOL CALL RECEIVED: { functionNames: ['show_image'] }`
25. **Look for:** `[useLiveApi] 🖼️ TOOL CALL: show_image { imageId: "unequal-cookie-kids" }`
26. **Watch screen:** Image should change from cover to unequal cookies
    - ✅ Image switches in sync with Pi's words

---

## Common Issues and Fixes

### Issue: toolCount is 0

**Symptom:**
```
[StreamingConsole] ✅ Config set with 0 tools
```

**Cause:** Tools haven't loaded yet

**Fix:**
1. Refresh page
2. Wait for lesson to fully load
3. Check console for tool loading messages
4. Then connect

---

### Issue: Connected with 0 tools, then tools load

**Symptom:**
```
[useLiveApi] 🔌 Connecting with config: { toolsCount: 0 }
... later ...
[StreamingConsole] ✅ Config set with 4 tools
```

**What happens:** Our fix should auto-reconnect!

**Look for:**
```
[StreamingConsole] 🔄 CRITICAL: Tools just loaded but already connected!
[StreamingConsole] 🔄 Forcing reconnection to register tools with Gemini...
[StreamingConsole] 🔌 Reconnecting with 4 tools...
```

**Expected:** Audio will cut out briefly, then reconnect

---

### Issue: No milestone detection

**Symptom:**
- You say keywords
- Nothing happens in console
- No `[PedagogyEngine] 🎯 Milestone progress`

**Debug:**
```javascript
// In console:
const engine = window.__orchestra Human: tor?.getPedagogyEngine();
console.log('Current milestone:', engine?.getCurrentMilestone());
console.log('Keywords:', engine?.getCurrentMilestone()?.keywords);
```

**Possible causes:**
1. Wrong keywords (check what milestone expects)
2. processTranscription not being called
3. Transcription not final (isFinal=false)

---

### Issue: Teacher panel not updating

**Symptom:**
- Console shows events firing
- Teacher panel stays empty

**Debug:**
```javascript
// In console:
const panel = useTeacherPanel.getState();
console.log('Session:', panel.currentSession);
console.log('Milestone logs:', panel.milestoneLogs);
console.log('Is expanded:', panel.isExpanded);
```

**Possible causes:**
1. Panel not mounted (click 📊 to open it)
2. React not re-rendering (UI issue)
3. Events firing but not updating store

---

### Issue: Tool calls not firing

**Symptom:**
- Pi responds
- No `[useLiveApi] 🔧 TOOL CALL RECEIVED`

**Debug:**
1. Check connection: Was it made with tools?
   ```
   [useLiveApi] ✅ Connected successfully!
   // Look back - did it say "toolsCount: 4"?
   ```

2. Check WebSocket (Network tab):
   - Filter by WS
   - Look for setup message
   - Should have `tools` or `function_declarations` field

**Fix:** Disconnect and reconnect

---

## Success Criteria Checklist

- [ ] Tools count > 0 before connecting
- [ ] Connected with tools (toolsCount > 0 in log)
- [ ] Lesson context sent after connection
- [ ] Student speech transcribed
- [ ] PedagogyEngine processes transcription
- [ ] Milestone detection event fires
- [ ] Teacher panel milestone log increments
- [ ] Pi calls mark_milestone_complete tool
- [ ] Milestone completion event fires
- [ ] Pi calls show_image tool during story
- [ ] Image switches on screen
- [ ] Teacher panel shows all activity

---

## Quick Diagnostic Commands

```javascript
// === Tools ===
useTools.getState().tools.length
// Expected: > 0

// === Lesson ===
useLessonStore.getState().currentLesson?.title
// Expected: "The Equal Parts Challenge"

// === Teacher Panel ===
useTeacherPanel.getState().currentSession
// Expected: { id, lessonId, lessonTitle, startTime }

useTeacherPanel.getState().milestoneLogs
// Expected: Array with entries

// === Connection ===
// (Check console for client.status logs)

// === Current Image ===
useLessonStore.getState().currentImage
// Expected: imageId string (e.g., "cover-birthday-party")
```

---

## Expected Timeline (Success Case)

```
0:00 - App loads, lesson loads, tools load
0:02 - User clicks "Connect"
0:03 - Connected with 4 tools
0:04 - Lesson context sent
0:05 - Pi starts speaking (warmup question)
0:08 - User says "bigger"
0:09 - Milestone detected event
0:09 - Teacher panel updates (1 log)
0:10 - Pi calls mark_milestone_complete
0:11 - Milestone completed event
0:12 - Milestone transition sent
0:13 - Pi starts Act 1 story
0:20 - Pi says "Luna tries to cut it..."
0:21 - Pi calls show_image('unequal-cookie-kids')
0:21 - Image switches on screen ✅
0:22 - Pi continues: "Look at their faces!"
```

**Total time from connect to image switch: ~18 seconds**

---

## If Nothing Works

### Nuclear Option:

1. **Close browser tab**
2. **Clear all data:**
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```
3. **Open new tab**
4. **Load app fresh**
5. **DO NOT CONNECT until:**
   - Lesson loads
   - Console shows: `✅ Config set with X tools` (X > 0)
6. **THEN connect**
7. **Watch for auto-reconnect** if tools load after connect

---

## What Fixed Today

1. ✅ **Tool registration** - Added tools & voice to useEffect deps
2. ✅ **Auto-reconnection** - Force reconnect when tools load
3. ✅ **Story guides** - Added milestone prompts for image timing
4. ✅ **Warmup speed** - Added listening signal recognition
5. ✅ **Comprehensive logging** - Track every step of data flow

**Everything should work now!**
