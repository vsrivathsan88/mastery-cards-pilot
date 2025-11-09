# Troubleshooting Current Issues

## Issue 1: show_image Tool Call Not Working

**Problem:** Image doesn't change when Pi calls `show_image` tool.

**Root Cause Investigation:**
The handler looks correct:
```typescript
if (fc.name === 'show_image') {
  const { imageId, context } = fc.args;
  useLessonStore.getState().setCurrentImage(imageId as string);
  // Response sent back to Gemini
}
```

**Debugging Steps:**
1. Check if tool is actually being called:
   ```
   Open browser console
   Look for: [useLiveApi] 🖼️ Showing image: <imageId>
   Look for: [LessonStore] 🖼️ Setting current image: <imageId>
   ```

2. Check if image is in lesson assets:
   ```javascript
   // In console:
   JSON.stringify(useLessonStore.getState().currentLesson?.assets?.map(a => a.id))
   ```

3. Check if LessonImage component is receiving the update:
   ```javascript
   // In console:
   useLessonStore.getState().currentImage
   ```

**Possible Fixes:**
- Ensure lesson has images in assets array
- Check if imageId matches exactly (case-sensitive)
- Verify LessonImage component is mounted and rendering

---

## Issue 2: Teacher Panel Not Updating

**Problem:** Milestone logs not appearing in teacher panel.

**Root Cause Investigation:**
Teacher panel requires a `currentSession` to display:
```typescript
if (!currentSession) {
  return <EmptyState />
}
```

Session is started when lesson loads:
```typescript
useTeacherPanel.getState().startSession(lesson.id, lesson.title);
```

**Debugging Steps:**
1. Check if session started:
   ```javascript
   // In browser console:
   useTeacherPanel.getState().currentSession
   ```

2. Check if milestone logs are being created:
   ```javascript
   useTeacherPanel.getState().milestoneLogs
   ```

3. Check console for milestone logging:
   ```
   Look for: [useLiveApi] 📝 Milestone progress logged to teacher panel
   Look for: [useLiveApi] ✅ Milestone completion logged to teacher panel
   Look for: [TeacherPanel] Session started
   ```

**Possible Fixes:**
- Ensure lesson is loaded before connecting
- Check if `logMilestoneStart` / `logMilestoneProgress` are being called
- Verify teacher panel is expanded (click 📊 tab)
- Check if milestone IDs match between pedagogy engine and logs

---

## Issue 3: Long Delay Before Lesson Starts

**Problem:** Takes too long to get to the lesson after connecting.

**Potential Causes:**
1. **Agent analysis during first transcription** (1-3s per agent)
2. **Lesson context sending** (could be large payload)
3. **Image loading** (if images are large)
4. **System prompt generation** (complex templates)
5. **Connection stabilization** (500ms wait)

**Debugging Steps:**
1. Time each step:
   ```
   Check console timestamps:
   [useLiveApi] 🔌 Connecting...
   [useLiveApi] ✅ Connected successfully!
   [useLiveApi] 📚 Loading lesson: <title>
   [useLiveApi] ✉️ Sending lesson context...
   [useLiveApi] ✅ Lesson context sent!
   ```

2. Check if agents are running on startup:
   ```
   Look for: [useLiveApi] 🔍 Sending to backend for analysis...
   Look for: [useLiveApi] ✅ Backend analysis received
   ```

3. Check lesson context size:
   ```typescript
   // In console during debugging:
   console.log('Lesson context size:', lessonContextMessage.length)
   ```

**Quick Fixes:**
1. **Disable agent analysis on first transcription:**
   ```typescript
   // In use-live-api.ts
   if (!isFinal || !currentLesson || text.trim().length === 0) {
     return; // Skip analysis for interim transcriptions
   }
   
   // Skip analysis if this is first transcription (greeting)
   if (turns.length < 2) {
     console.log('[useLiveApi] Skipping analysis for greeting');
     return;
   }
   ```

2. **Reduce lesson context size:**
   - Remove verbose descriptions
   - Send only essential milestone info
   - Lazy-load full lesson details

3. **Pre-load images:**
   - Add image preloading in lesson load
   - Use smaller image sizes
   - Lazy load non-essential images

4. **Remove connection wait:**
   ```typescript
   // In connect(), remove or reduce:
   await new Promise(resolve => setTimeout(resolve, 500)); // Reduce to 100ms
   ```

**Recommended Immediate Fix:**
Add check to skip analysis on first few turns:

```typescript
// In handleInputTranscription function:
const handleInputTranscription = async (text: string, isFinal: boolean) => {
  if (!isFinal || text.trim().length === 0) {
    return;
  }

  console.log('[useLiveApi] 📝 Final transcription received:', text);

  // Pass to pedagogy engine for milestone detection
  orchestrator.getPedagogyEngine().processTranscription(text, isFinal);

  const currentLesson = orchestrator.getPedagogyEngine().getCurrentLesson();
  if (!currentLesson) {
    console.log('[useLiveApi] No lesson active, skipping analysis');
    return;
  }

  // ⚡ PERFORMANCE: Skip heavy agent analysis for first 2 turns (greetings)
  const turns = useLogStore.getState().turns;
  if (turns.length < 3) {
    console.log('[useLiveApi] ⚡ Skipping agent analysis for greeting (turn ${turns.length})');
    return;
  }

  // Now do the heavy analysis...
  try {
    const analysis = await apiClient.analyze({...});
    // ... rest of analysis
  }
}
```

---

## Testing Checklist

After applying fixes, verify:

**show_image:**
- [ ] Console shows: `[useLiveApi] 🖼️ Showing image: <id>`
- [ ] Console shows: `[LessonStore] 🖼️ Setting current image: <id>`
- [ ] Image actually changes on screen
- [ ] Tool response sent back to Gemini

**Teacher Panel:**
- [ ] Console shows: `[TeacherPanel] Session started`
- [ ] Console shows: `[useLiveApi] 📝 Milestone progress logged`
- [ ] Teacher panel (📊) shows milestone logs
- [ ] Milestone status updates (started → in-progress → completed)

**Startup Performance:**
- [ ] Connection < 1 second
- [ ] Lesson context sent < 500ms
- [ ] First Pi response < 3 seconds
- [ ] No agent analysis on first 2 turns
- [ ] Total time to first interaction < 5 seconds

---

## Quick Diagnostic Script

Add this to browser console to diagnose all issues:

```javascript
// Diagnostic check
const diagnostic = {
  pilotMode: window.localStorage.getItem('VITE_PILOT_MODE') || import.meta.env.VITE_PILOT_MODE,
  lessonLoaded: !!useLessonStore.getState().currentLesson,
  lessonId: useLessonStore.getState().currentLesson?.id,
  currentImage: useLessonStore.getState().currentImage,
  imageAssets: useLessonStore.getState().currentLesson?.assets?.map(a => a.id),
  teacherPanelSession: !!useTeacherPanel.getState().currentSession,
  milestoneLogs: useTeacherPanel.getState().milestoneLogs.length,
  transcriptTurns: useLogStore.getState().turns.length,
  canvasServiceReady: canvasManipulationService?.isReady(),
};

console.table(diagnostic);

// Check for specific issues
if (!diagnostic.teacherPanelSession) {
  console.error('❌ Teacher Panel session not started!');
} else {
  console.log('✅ Teacher Panel session active');
}

if (diagnostic.imageAssets?.length > 0 && !diagnostic.currentImage) {
  console.warn('⚠️ Images available but none displayed');
  console.log('Available images:', diagnostic.imageAssets);
}

if (diagnostic.transcriptTurns > 5 && diagnostic.milestoneLogs === 0) {
  console.error('❌ No milestone logs despite activity!');
}
```

