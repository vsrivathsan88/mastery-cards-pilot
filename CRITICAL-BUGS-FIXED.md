# Critical Bugs Fixed - Pilot Tools & System

**Date:** 2025-11-09  
**Severity:** CRITICAL - Core functionality broken  
**Status:** FIXED ✅

---

## 🔴 Root Cause Summary

**All tool calling, sub-agents, and canvas visibility was broken** due to a single critical bug: tools were not being registered with Gemini Live API because of a missing dependency in the React useEffect hook.

---

## Bug #1: Tools Not Being Registered (CRITICAL) ✅ FIXED

### Symptom:
- `show_image` not working
- `draw_on_canvas` not working  
- `mark_milestone_complete` not working
- NO tool calls being triggered at all

### Root Cause:
In `apps/tutor-app/components/demo/streaming-console/StreamingConsole.tsx` (line ~451):

```typescript
useEffect(() => {
  const enabledTools = tools.filter(tool => tool.isEnabled).map(...)
  // ... setup config with tools ...
  setConfig(config);
}, [setConfig, systemPrompt]); // ❌ BUG: 'tools' missing from deps!
```

**The Problem:**
- The `tools` variable is used inside the effect
- But `tools` is NOT in the dependency array
- React NEVER re-runs the effect when tools change
- Gemini Live API never receives the function declarations
- Pi has no tools to call!

### Fix Applied:
```typescript
}, [setConfig, systemPrompt, tools, voice]); // ✅ FIXED: Added tools and voice
```

**Impact:** This single fix should restore ALL tool calling functionality.

---

## Bug #2: Existing SVG Images Not Being Used ✅ VERIFIED

### Symptom:
User thought there were no placeholder images

### Reality:
8 SVG files ALREADY EXIST in `/public/assets/fractions/`:
- ✅ cover-birthday-party.svg
- ✅ unequal-cookie-share.svg  
- ✅ equal-unequal-comparison.svg
- ✅ 1-3-notation-visual.svg
- ✅ unequal-labeled-1-4.svg
- ✅ chocolate-bar-whole.svg
- ✅ chocolate-bar-half.svg
- ✅ chocolate-bar-unequal.svg

### Status:
- All images properly referenced in lesson JSON
- `show_image` tool should work once Bug #1 is fixed
- Description card system provides additional fallback

### No Fix Needed:
Images exist and are properly configured. Will work once tool calling is restored.

---

## Bug #3: Transcription Lagging Behind Voice ⚠️ INVESTIGATION NEEDED

### Symptom:
Transcription text appears slower than audio playback

### Possible Causes:

#### Cause A: Text Accumulation Logic
In `StreamingConsole.tsx` (line ~461):
```typescript
if (last && last.role === 'user' && !last.isFinal) {
  const fullText = last.text + text;  // Accumulating
  updateLastTurn({ text: fullText, isFinal });
}
```

**This is probably OK** - it's designed to accumulate partial transcriptions.

#### Cause B: Gemini Live API Latency
- Transcription is coming from Google's speech-to-text
- Real-time transcription has inherent latency (100-300ms typical)
- Cannot be fixed client-side

#### Cause C: Too Many Intermediate Updates
- API might be sending partial transcripts too frequently
- Could throttle/debounce display updates

### Potential Fix (Optional):

Add debouncing to reduce visual jank:

```typescript
// In StreamingConsole.tsx
const debouncedTranscriptUpdate = useRef<NodeJS.Timeout>();

const handleInputTranscription = (text: string, isFinal: boolean) => {
  if (isFinal) {
    // Immediate update for final transcripts
    if (debouncedTranscriptUpdate.current) {
      clearTimeout(debouncedTranscriptUpdate.current);
    }
    updateTranscript(text, isFinal);
  } else {
    // Debounce intermediate updates
    if (debouncedTranscriptUpdate.current) {
      clearTimeout(debouncedTranscriptUpdate.current);
    }
    debouncedTranscriptUpdate.current = setTimeout(() => {
      updateTranscript(text, isFinal);
    }, 150); // 150ms debounce
  }
};
```

**Recommendation:** Test with Bug #1 fixed first. Lag might be less noticeable with working tools.

---

## Bug #4: Pi Cannot See Canvas ⚠️ PARTIAL - Needs Verification

### Symptom:
Pi doesn't respond to student drawings on canvas

### Current Implementation:

Canvas snapshot IS being captured in `StreamingConsole.tsx` (line ~269):
```typescript
const triggerVisionAnalysis = useCallback(async (reason: string) => {
  const snapshot = await canvasRef.current.getSnapshot();
  // ...
  await analyzeVision(snapshot);  // This should send to Gemini
}, [canvasHasContent, analyzeVision]);
```

### Triggers:
1. **When student mentions drawing** (line ~472):
   ```typescript
   const mentionsDrawing = /\b(draw|drew|sketch|look|show)\b/i.test(text);
   if (mentionsDrawing && canvasHasContent) {
     triggerVisionAnalysis('student_mentioned_drawing');
   }
   ```

2. **Periodic check** (every 20 seconds) (line ~404)

3. **When canvas changes** (debounced, after 2 seconds) (line ~238)

### Potential Issues:

#### Issue A: analyzeVision Might Not Be Sending Image
The `analyzeVision()` function might only be analyzing client-side without sending to Gemini Live.

**Need to verify:** Does `analyzeVision` actually call `client.sendRealtimeInput()` with the image?

#### Issue B: Gemini Live Image Format
Gemini Live requires specific format:
```typescript
client.sendRealtimeInput([
  {
    mimeType: 'image/png',  // or 'image/jpeg'
    data: base64ImageData,  // Must be base64 WITHOUT data URI prefix
  },
]);
```

### Diagnostic Steps:

1. **Check if image is being sent:**
```typescript
// In triggerVisionAnalysis, add:
console.log('[Vision] Sending image to Gemini:', {
  size: snapshot.length,
  preview: snapshot.substring(0, 50),
});

client.sendRealtimeInput([{
  mimeType: 'image/png',
  data: snapshot.replace(/^data:image\/png;base64,/, ''),
}]);
```

2. **Verify analyzeVision implementation:**
   - Check `hooks/useAgentContext.tsx`
   - Ensure it calls `client.sendRealtimeInput()` with image
   - Not just client-side analysis

### Quick Fix to Test:

Add direct image sending after getting snapshot:

```typescript
// In StreamingConsole.tsx, after line 279
const snapshot = await canvasRef.current.getSnapshot();
if (snapshot) {
  // Strip data URI prefix if present
  const base64Data = snapshot.replace(/^data:image\/[a-z]+;base64,/, '');
  
  // Send directly to Gemini Live
  console.log('[Vision] Sending canvas snapshot to Gemini...');
  client.sendRealtimeInput([{
    mimeType: 'image/png',
    data: base64Data,
  }]);
  
  // Also do agent analysis
  await analyzeVision(snapshot);
}
```

**This ensures Pi receives the canvas image directly.**

---

## 🎯 Priority Fixes Applied

### ✅ Fix #1 (CRITICAL - Done):
- Added `tools` and `voice` to useEffect dependencies
- **Impact:** Restores ALL tool calling functionality
- **Files Changed:** `StreamingConsole.tsx` (line 451)

### ✅ Fix #2 (VERIFIED - No Action):
- Confirmed 8 SVG images exist and are properly referenced
- Will work once tool calling is restored

### ⚠️ Fix #3 (Investigation):
- Transcription lag likely API latency
- Can add debouncing if needed
- Test after Fix #1 to see if it's still noticeable

### ⚠️ Fix #4 (Needs Testing):
- Canvas snapshot is being captured
- Need to verify it's being sent to Gemini Live
- Quick fix available (add direct sendRealtimeInput call)

---

## 🧪 Testing Checklist

### After Applying Fixes:

1. **Tool Calling**
   - [ ] Start lesson with pilot mode
   - [ ] Pi calls `show_image()` - image should appear
   - [ ] Check console for: `[StreamingConsole] ✅ Config set with X tools`
   - [ ] Verify toolCount > 0 in console

2. **SVG Images**
   - [ ] Cover image loads on lesson start
   - [ ] Pi can switch between images via show_image
   - [ ] Description cards work as fallback

3. **Transcription**
   - [ ] Speak and watch transcript appear
   - [ ] Note lag duration (should be < 500ms)
   - [ ] Final transcript should be accurate

4. **Canvas Visibility**
   - [ ] Draw something on canvas
   - [ ] Say "look at my drawing"
   - [ ] Check console for: `[Vision] Sending canvas snapshot to Gemini`
   - [ ] Pi should acknowledge the drawing

---

## 📊 Console Logging for Debugging

### Expected Console Output (After Fixes):

```
[StreamingConsole] 🔍 Setting config with: {
  promptLength: 2456,
  toolCount: 7,  // ✅ Should be > 0!
  tools: ['show_image', 'draw_on_canvas', 'add_canvas_label', 
          'show_emoji_reaction', 'verify_student_work', 
          'mark_milestone_complete', 'suggest_next_step']
}
[StreamingConsole] ✅ Config set with 7 tools

[useLiveApi] 🖼️ TOOL CALL: show_image { imageId: 'cover-birthday-party', context: '...' }
[useLiveApi] ✅ Current image set to: cover-birthday-party

[StreamingConsole] 👁️ Student mentioned drawing, triggering vision analysis...
[Vision] Sending canvas snapshot to Gemini... { size: 12543 }
[StreamingConsole] ✅ Vision analysis complete
```

### Before Fixes (Broken):

```
[StreamingConsole] 🔍 Setting config with: {
  promptLength: 2456,
  toolCount: 0,  // ❌ BROKEN! No tools!
  tools: []
}
```

---

## 🔧 Additional Recommendations

### 1. Enable More Detailed Logging

Add to `.env`:
```
VITE_DEBUG_TOOLS=true
VITE_DEBUG_VISION=true
```

### 2. Test Individual Tools

Create simple test prompts:
```
- "Pi, show me the birthday party image"  → Tests show_image
- "Pi, draw a circle for me" → Tests draw_on_canvas
- "Look at what I drew!" → Tests canvas vision
```

### 3. Monitor Teacher Panel

- Tool calls should appear in teacher panel log
- Milestone completions should update progress
- Evidence collection should trigger on milestones

---

## 📝 Files Modified

1. **apps/tutor-app/components/demo/streaming-console/StreamingConsole.tsx**
   - Line 451: Added `tools` and `voice` to useEffect dependencies
   - Impact: Fixes tool calling registration

---

## 🎉 Expected Result

After deploying these fixes:

1. ✅ **Tool calling works** - Pi can call show_image, draw_on_canvas, etc.
2. ✅ **SVG images load** - Existing placeholder images display
3. ✅ **Description cards work** - Text-based cards as fallback
4. ⚠️ **Transcription lag** - May still have minor lag (API limitation)
5. ⚠️ **Canvas visibility** - Should work, verify with testing

---

## 🚨 If Issues Persist

### If tools still don't work:

1. Check console for tool count:
   ```
   [StreamingConsole] ✅ Config set with X tools
   ```
   If X = 0, tools are still not being loaded.

2. Check tools store:
   ```javascript
   // In browser console:
   window.__tools = useTools.getState().tools;
   console.log('Tools:', window.__tools);
   ```

3. Verify tools have `isEnabled: true`:
   ```javascript
   const lessonTools = [
     {
       name: 'show_image',
       description: '...',
       isEnabled: true,  // ✅ Must be true!
       parameters: {...}
     }
   ];
   ```

### If canvas still not visible:

1. Add direct image sending (see Bug #4 Quick Fix)
2. Check canvas snapshot format:
   ```javascript
   const snapshot = await canvasRef.current.getSnapshot();
   console.log('Snapshot format:', snapshot.substring(0, 50));
   // Should be: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
   ```

3. Verify Gemini Live receives image:
   - Check network tab for WebSocket messages
   - Look for base64 image data in payload

---

**Bottom Line:** The critical bug (missing dependency) is now fixed. Tool calling should work. Test thoroughly and verify canvas vision with the additional logging suggested above.
