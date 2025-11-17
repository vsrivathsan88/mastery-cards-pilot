# Critical Fixes: Warmup, Teacher Panel, and Tool Calls

**Issues Identified:**
1. Warmup milestone too long - no listening signal guidance
2. Teacher panel not updating
3. Tool calls still not working despite dependency fix

---

## Issue #1: Warmup Milestone Too Long

### Root Cause:
System prompt has NO guidance about:
- How to handle warmup/prerequisite checks
- When to move on quickly
- Recognizing listening signals ("uh-huh", "yes", "okay")
- Hidden milestones should be FAST

### Current Behavior:
- Milestone 0 is "hidden: true" (warmup)
- Keywords: ["different", "not the same", "bigger", "smaller"]
- Success: Student says "different" or "not the same"
- **BUT** Pi doesn't know to move on quickly

### Fix Required:
Add explicit warmup guidance to system prompt.

---

## Issue #2: Teacher Panel Not Updating

### Root Cause Investigation:

**Teacher Panel IS initialized:**
```typescript
// In loadLesson() - use-live-api.ts line 1016
useTeacherPanel.getState().startSession(lesson.id, lesson.title);

// In StreamingConsole.tsx line 312
startSession(currentLesson.id, currentLesson.title);
```

**Teacher Panel SHOULD receive updates from:**
1. `logMilestoneStart()` - When milestone begins
2. `logMilestoneProgress()` - When student makes progress
3. `logMilestoneComplete()` - When milestone completes
4. `syncAgentInsights()` - Emotional/misconception data

**Possible Issues:**
- Events not firing from PedagogyEngine
- Store updates not triggering re-renders
- Teacher panel component not mounted
- Console logs not showing updates

### Debugging Steps:
```javascript
// In browser console:
useTeacherPanel.getState().currentSession  // Should show session
useTeacherPanel.getState().milestoneLogs   // Should have entries
useLessonStore.getState().currentLesson    // Should have lesson data
```

---

## Issue #3: Tool Calls Still Not Working

### What We Already Fixed:
```typescript
// StreamingConsole.tsx line 451
}, [setConfig, systemPrompt, tools, voice]); // ✅ Added tools to deps
```

### Why It Might Still Be Broken:

#### Possibility A: Connection Not Re-established
**Problem:** If user was already connected when fix was deployed, the new config with tools was never sent.

**Solution:** Need to disconnect and reconnect to trigger new config.

#### Possibility B: Tools Not Loaded at Mount Time
**Problem:** Tools might load AFTER the first config is set.

**Evidence:**
```typescript
// StreamingConsole.tsx line 428
const { tools } = useTools();  // Gets tools from store

// But when does lesson load and populate tools?
```

**Timeline:**
1. Component mounts → config set with systemPrompt=""
2. Lesson loads → systemPrompt updates
3. Tools should be available, but...

#### Possibility C: Config Not Being Sent to Gemini
**Problem:** `setConfig()` might update local state but not send to Gemini Live.

**Check:** Does `setConfig` actually call `client.connect()` with new config?

---

## Comprehensive Fixes

### Fix #1: Add Warmup Guidance to System Prompt

**File:** `packages/agents/src/prompts/static-system-prompt.ts`

**Add section before "Using Visual Aids":**

```typescript
## Warmup and Prerequisite Checks

Some lessons start with a quick warmup or prerequisite check (marked as "hidden" in lesson context). These should be FAST - 1-2 exchanges max.

### For Hidden/Warmup Milestones:

**Goal:** Quickly verify student has prerequisite knowledge, then MOVE ON immediately.

**Timing:** 
- Ask ONE quick question
- Listen for key indicators (keywords from milestone)
- Move forward as soon as you hear evidence
- Don't linger or over-explain

**Listening Signals:**
Recognize these as "got it" signals:
- Agreement: "uh-huh", "yeah", "yep", "yes", "okay"
- Repetition: Student repeats your words back
- Quick correct answer: "different", "bigger", "smaller"
- Confident tone (even if words are minimal)

**What to Do:**
When you hear a listening signal + keyword match:
- Acknowledge briefly: "Great!"
- Call mark_milestone_complete with confidence 0.8+
- Move to next milestone immediately
- Don't ask follow-up questions unless confused

**Example - GOOD (Fast):**
```
You: "Look at these pieces - are they all the same size?"
Student: "No, that one's bigger"
You: "Perfect! [marks complete] Now let me tell you about Luna's birthday party..."
```

**Example - BAD (Too slow):**
```
You: "Look at these pieces - are they all the same size?"
Student: "No, that one's bigger"
You: "Exactly! Now which one is bigger? And which is smaller? Why do you think they're different sizes?"
❌ TOO MANY QUESTIONS - Just move on!
```

### For Regular Milestones:
Take your time, scaffold learning, ask probing questions. Regular milestones need deep understanding.
```

---

### Fix #2: Force Config Update on Connection

**File:** `apps/tutor-app/components/demo/streaming-console/StreamingConsole.tsx`

**Problem:** Config is set but connection might already be established with old config.

**Solution:** Force re-connection when tools/prompt change:

```typescript
// Around line 451
useEffect(() => {
  const enabledTools = tools.filter(tool => tool.isEnabled)...
  
  const config: any = {
    // ... existing config ...
  };
  
  console.log('[StreamingConsole] 🔍 Setting config with:', {
    promptLength: systemPrompt.length,
    toolCount: enabledTools.length,
    tools: enabledTools.map(t => t.functionDeclarations[0].name),
    isConnected: client.status === 'connected',
  });
  
  setConfig(config);
  
  // ✅ NEW: If already connected, reconnect to apply new config
  if (client.status === 'connected' && enabledTools.length > 0) {
    console.log('[StreamingConsole] 🔄 Reconnecting to apply new tool config...');
    disconnect();
    setTimeout(() => {
      connect();
      console.log('[StreamingConsole] ✅ Reconnected with', enabledTools.length, 'tools');
    }, 500);
  }
  
}, [setConfig, systemPrompt, tools, voice, client.status, disconnect, connect]);
```

**CAUTION:** This will reconnect every time tools change. Might be disruptive.

**Better approach:** Only reconnect if tools were previously empty:

```typescript
const prevToolCountRef = useRef(0);

useEffect(() => {
  const enabledTools = tools.filter(tool => tool.isEnabled)...
  const currentToolCount = enabledTools.length;
  
  // ... set config ...
  
  // Only reconnect if tools just became available (0 → N)
  if (prevToolCountRef.current === 0 && currentToolCount > 0 && client.status === 'connected') {
    console.log('[StreamingConsole] 🔄 Tools now available, reconnecting...');
    disconnect();
    setTimeout(() => connect(), 500);
  }
  
  prevToolCountRef.current = currentToolCount;
}, [setConfig, systemPrompt, tools, voice, ...]);
```

---

### Fix #3: Verify Tool Registration

**File:** `apps/tutor-app/hooks/media/use-live-api.ts`

**Add logging in connect() function:**

```typescript
// Around line 607
const connect = useCallback(async () => {
  if (!config) {
    throw new Error('config has not been set');
  }
  
  // ✅ ADD: Detailed config logging
  console.log('[useLiveApi] 🔌 Connecting with config:', {
    hasSystemInstruction: !!config.systemInstruction,
    promptLength: config.systemInstruction?.parts?.[0]?.text?.length || 0,
    toolsCount: config.tools?.length || 0,
    toolNames: config.tools?.map((t: any) => t.functionDeclarations?.[0]?.name) || [],
  });
  
  // Don't disconnect if already connected...
  if (client.status === 'connected') {
    console.log('[useLiveApi] Already connected');
    // ... existing code ...
  }
  
  // ... rest of connect logic ...
}, [client, config]);
```

---

### Fix #4: Teacher Panel Event Logging

**File:** `apps/tutor-app/hooks/media/use-live-api.ts`

**Add more explicit logging:**

```typescript
// Around line 873 (onMilestoneDetected)
const onMilestoneDetected = (milestone: any, transcription: string) => {
  console.log('[useLiveApi] 🎯 MILESTONE DETECTED EVENT:', {
    milestoneId: milestone.id,
    milestoneTitle: milestone.title,
    transcription: transcription.substring(0, 50),
    keywords: milestone.keywords,
  });
  
  // 📊 LOG TO TEACHER PANEL
  const { logMilestoneProgress } = require('../lib/teacher-panel-store').useTeacherPanel.getState();
  logMilestoneProgress(
    milestone.id,
    transcription,
    milestone.keywords || []
  );
  
  console.log('[useLiveApi] ✅ Teacher panel updated - milestone progress');
  
  // Verify it was logged
  const logs = require('../lib/teacher-panel-store').useTeacherPanel.getState().milestoneLogs;
  console.log('[useLiveApi] 📊 Total milestone logs:', logs.length);
};
```

---

## Testing Checklist

### After Applying Fixes:

1. **Warmup Speed:**
   - [ ] Start lesson
   - [ ] Pi asks ONE warmup question
   - [ ] Answer with "different" or similar
   - [ ] Pi should mark complete and move on immediately
   - [ ] No follow-up questions on warmup

2. **Tool Calls:**
   - [ ] Open console
   - [ ] Look for: `[StreamingConsole] ✅ Config set with X tools`
   - [ ] X should be > 0 (not 0!)
   - [ ] Look for: `[useLiveApi] 🔌 Connecting with config: { toolsCount: X }`
   - [ ] Ask Pi to "show me an image"
   - [ ] Look for: `[useLiveApi] 🖼️ TOOL CALL: show_image`
   - [ ] Image should change

3. **Teacher Panel:**
   - [ ] Open teacher panel (📊 icon)
   - [ ] Check "Milestones" tab
   - [ ] Should see milestone progress
   - [ ] Check "Transcript" tab
   - [ ] Should see student/Pi messages
   - [ ] Console should show: `[useLiveApi] ✅ Teacher panel updated - milestone progress`

---

## Quick Diagnosis Commands

```javascript
// In browser console:

// 1. Check if tools are loaded
useTools.getState().tools.length  // Should be > 0

// 2. Check if session started
useTeacherPanel.getState().currentSession  // Should have session object

// 3. Check milestone logs
useTeacherPanel.getState().milestoneLogs  // Should have entries

// 4. Check current lesson
useLessonStore.getState().currentLesson?.title  // Should show lesson

// 5. Check connection status
// (Look for global client reference or use React DevTools)

// 6. Force reload with clean state
localStorage.clear()
location.reload()
```

---

## Root Cause Summary

**Warmup Issue:** System prompt has no guidance about hidden/warmup milestones  
**Teacher Panel:** Events are firing but UI might not be updating (check React DevTools)  
**Tool Calls:** Config is set with tools, but connection might have been established with empty tools

**Most Likely Fix:** Disconnect and reconnect after tools become available.
