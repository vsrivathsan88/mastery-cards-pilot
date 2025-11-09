# Complete System Audit - Finding All Broken Pieces

**Date:** 2025-11-09  
**Status:** COMPREHENSIVE AUDIT IN PROGRESS

---

## What's Actually Working vs Broken

### ✅ WORKING:
1. Audio capture and streaming
2. Transcription (shows in teacher panel transcript)
3. Voice synthesis (Pi talks)
4. UI rendering (components display)

### ❌ BROKEN:
1. **Tool calls NOT firing** (show_image, mark_milestone_complete)
2. **Teacher panel milestones NOT updating** (only transcript works)
3. **Images NOT switching** (stuck on cover image)
4. **Milestone detection NOT working** (no progress updates)
5. **Misconception/emotional logging NOT working**

---

## ROOT CAUSE HYPOTHESIS

**The central issue: TOOLS ARE NOT REGISTERED WITH GEMINI LIVE API**

If tools don't work, then:
- ❌ show_image won't be called → images don't switch
- ❌ mark_milestone_complete won't be called → milestones don't complete
- ❌ No milestone completion → no teacher panel updates
- ❌ No tool calls → no evidence of learning

**Everything downstream breaks if tool registration fails.**

---

## Complete Tool Registration Flow Audit

### Step 1: Tools Defined in State ✅

```typescript
// apps/tutor-app/lib/state.ts
export const useTools = create<{
  tools: FunctionCall[];
  // ...
}>((set) => ({
  tools: lessonTools,  // ✅ Imported from lesson-tools.ts
  // ...
}));
```

**Status:** ✅ Tools are defined (show_image, mark_milestone_complete, etc.)

---

### Step 2: Tools Loaded in Component ✅

```typescript
// StreamingConsole.tsx
const { tools } = useTools();  // ✅ Gets tools from store
```

**Status:** ✅ Component accesses tools

---

### Step 3: Tools Converted to Gemini Format ✅

```typescript
// StreamingConsole.tsx line 428
const enabledTools = tools
  .filter(tool => tool.isEnabled)
  .map(tool => ({
    functionDeclarations: [
      {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    ],
  }));
```

**Status:** ✅ Tools converted to Gemini function declaration format

---

### Step 4: Tools Added to Config ✅

```typescript
// StreamingConsole.tsx line 440
const config: any = {
  responseModalities: [Modality.AUDIO],
  // ...
  tools: enabledTools,  // ✅ Tools included in config
};
```

**Status:** ✅ Tools are in config object

---

### Step 5: Config Set with Tools ✅

```typescript
// StreamingConsole.tsx line 451
setConfig(config);
console.log('[StreamingConsole] ✅ Config set with', enabledTools.length, 'tools');
```

**Status:** ✅ setConfig called with tools in config

---

### Step 6: Config Passed to useLiveApi 🔍 NEEDS VERIFICATION

```typescript
// StreamingConsole.tsx
const { client, setConfig, connected, connect, disconnect } = useLiveAPIContext();

// setConfig is a prop from useLiveApi
// But does useLiveApi STORE the config correctly?
```

**Need to verify:** Does useLiveApi useState actually store the config?

---

### Step 7: Config Used in connect() ❌ PROBLEM FOUND!

```typescript
// use-live-api.ts line 632
const connect = useCallback(async () => {
  if (!config) {
    throw new Error('config has not been set');
  }
  // ... logging ...
  
  // Don't disconnect if already connected - just check for pending context
  if (client.status === 'connected') {
    console.log('[useLiveApi] Already connected');
    return;  // ❌ DOESN'T RECONNECT WITH NEW CONFIG!
  }
  
  // ... NEED TO SEE REST OF FUNCTION
```

**CRITICAL QUESTION:** When connect() is called, does it actually send the config to Gemini?

---

## The Missing Piece: Does connect() Send Config to Gemini?

### What SHOULD happen:

```typescript
const connect = useCallback(async () => {
  if (!config) throw new Error('config has not been set');
  
  // Send config with tools to Gemini Live API
  await client.connect(config);  // ← DOES THIS HAPPEN?
}, [client, config]);
```

### What we need to check:

1. Does `client.connect()` take a config parameter?
2. Is the config being passed to the Gemini SDK?
3. Does the SDK register the function declarations?

---

## Diagnosis Plan

### Immediate Checks:

1. **Check useLiveApi.ts connect() implementation**
   - Does it call `client.connect(config)`?
   - Or does it use a stale config from closure?

2. **Check GenAILiveClient implementation**
   - Does `connect()` method accept config?
   - Does it send tools to Gemini Live API?

3. **Check console logs on connect**
   - Look for: `[useLiveApi] 🔌 Connecting with config: { toolsCount: X }`
   - If X = 0, tools aren't loaded yet
   - If X > 0, tools are in config, but are they sent to Gemini?

4. **Check Gemini WebSocket messages**
   - Open Network tab
   - Filter by WS (WebSocket)
   - Look for setup message with `tools` or `function_declarations`

---

## Most Likely Issues

### Issue A: Config Not Sent to Gemini

**Problem:** Config is stored locally but never sent to Gemini Live API.

**Evidence:** 
- Tools logged in console
- But tool calls never fire
- Gemini doesn't know tools exist

**Fix:** Ensure `client.connect()` or similar method sends config with tools.

---

### Issue B: Connected Before Tools Loaded

**Problem:** User connects, THEN tools load.

**Timeline:**
1. User clicks "Start" → connect() called
2. Config has empty tools array
3. Lesson loads → tools populate
4. Config updates (due to our dependency fix)
5. But user is STILL connected with old config (no tools)

**Evidence:**
- Logs show: `toolsCount: 0` when connecting
- Later logs show: `✅ Config set with 4 tools`
- But user never reconnects

**Fix:** Force reconnection when tools become available.

---

### Issue C: Tool Handlers Not Registered

**Problem:** Even if Gemini calls tools, handlers don't exist.

**Evidence:**
- Gemini sends tool call event
- But no handler responds
- Tool call hangs

**Fix:** Verify `client.on('toolcall', onToolCall)` is registered.

---

## Complete Fix Strategy

### Fix 1: Force Reconnection When Tools Load

```typescript
// In StreamingConsole.tsx
const prevToolCountRef = useRef(0);

useEffect(() => {
  const enabledTools = tools.filter(tool => tool.isEnabled)...
  const currentToolCount = enabledTools.length;
  
  // ... set config ...
  
  // If tools just became available (0 → N) and we're connected
  if (prevToolCountRef.current === 0 && 
      currentToolCount > 0 && 
      client.status === 'connected') {
    console.log('[StreamingConsole] 🔄 Tools now available, forcing reconnect...');
    disconnect();
    setTimeout(() => {
      console.log('[StreamingConsole] 🔌 Reconnecting with tools...');
      connect();
    }, 1000);
  }
  
  prevToolCountRef.current = currentToolCount;
}, [setConfig, systemPrompt, tools, voice, client.status, disconnect, connect]);
```

---

### Fix 2: Verify Config Is Sent to Gemini

```typescript
// In use-live-api.ts connect()
const connect = useCallback(async () => {
  if (!config) throw new Error('config has not been set');
  
  const toolsArray = config.tools || [];
  const toolNames = toolsArray.map((t: any) => t.functionDeclarations?.[0]?.name).filter(Boolean);
  
  console.log('[useLiveApi] 🔌 Connecting with config:', {
    toolsCount: toolsArray.length,
    toolNames: toolNames,
  });
  
  if (toolsArray.length === 0) {
    console.error('[useLiveApi] ❌ ERROR: Connecting with ZERO tools!');
  }
  
  // Actually connect with config
  try {
    await client.connect(config);  // ← VERIFY THIS EXISTS AND WORKS
    console.log('[useLiveApi] ✅ Connected successfully with', toolsArray.length, 'tools');
  } catch (error) {
    console.error('[useLiveApi] ❌ Connection failed:', error);
    throw error;
  }
}, [client, config]);
```

---

### Fix 3: Add Tool Call Verification

```typescript
// In use-live-api.ts
const onToolCall = (toolCall: LiveServerToolCall) => {
  console.log('[useLiveApi] 🔧 TOOL CALL RECEIVED:', {
    functionCallsCount: toolCall.functionCalls?.length || 0,
    functionNames: toolCall.functionCalls?.map(fc => fc.name) || [],
  });
  
  if (!toolCall.functionCalls || toolCall.functionCalls.length === 0) {
    console.error('[useLiveApi] ❌ Tool call received but no function calls!');
    return;
  }
  
  // ... rest of handler ...
};
```

---

### Fix 4: Teacher Panel Event Verification

```typescript
// Add to each event handler
const onMilestoneDetected = (milestone: any, transcription: string) => {
  console.log('[useLiveApi] 🎯 MILESTONE DETECTED EVENT FIRED');
  
  const store = useTeacherPanel.getState();
  console.log('[useLiveApi] 📊 Teacher panel state BEFORE update:', {
    milestoneLogs: store.milestoneLogs.length,
  });
  
  store.logMilestoneProgress(milestone.id, transcription, milestone.keywords || []);
  
  console.log('[useLiveApi] 📊 Teacher panel state AFTER update:', {
    milestoneLogs: store.milestoneLogs.length,
  });
};
```

---

## Testing Protocol

### Test 1: Tool Registration

```javascript
// In browser console AFTER connecting:

// 1. Check if tools were sent to Gemini
// Look for WebSocket message with tools/function_declarations

// 2. Check local config
window.__lastConfig = /* copy from console log */

// 3. Try manual tool call
// Ask Pi: "Can you show me an image?"
// Check console for: [useLiveApi] 🔧 TOOL CALL RECEIVED
```

### Test 2: Milestone Detection

```javascript
// 1. Say a keyword from warmup
// e.g., "that one's bigger"

// 2. Check console for:
// [PedagogyEngine] 🎯 Milestone progress: "Warm-Up: Spot the Difference"
// [PedagogyEngine]   Keywords: bigger
// [useLiveApi] 🎯 MILESTONE DETECTED EVENT FIRED

// 3. Check teacher panel
// Should see milestone log entry
```

### Test 3: Tool Call Flow

```javascript
// 1. Ask Pi to complete milestone
// Say the success criteria words

// 2. Pi should call mark_milestone_complete

// 3. Check console for:
// [useLiveApi] 🔧 TOOL CALL RECEIVED: { functionNames: ['mark_milestone_complete'] }
// [useLiveApi] ✅ Milestone completed via tool call

// 4. Check teacher panel
// Should see milestone completion log
```

---

## Expected Console Output (Working System)

```
[StreamingConsole] ✅ Config set with 4 tools
[useLiveApi] 🔌 Connecting with config: { toolsCount: 4, toolNames: [...] }
[useLiveApi] ✅ Connected successfully with 4 tools
[useLiveApi] 📝 Lesson context sent

// User speaks
[PedagogyEngine] 🎯 Milestone progress: "Warm-Up: Spot the Difference"
[useLiveApi] 🎯 MILESTONE DETECTED EVENT FIRED
[useLiveApi] 📊 Teacher panel state AFTER update: { milestoneLogs: 1 }

// Pi responds
[useLiveApi] 🔧 TOOL CALL RECEIVED: { functionNames: ['mark_milestone_complete'] }
[useLiveApi] ✅ Milestone completed via tool call: milestone-0-warmup
[useLiveApi] 📊 Teacher panel state AFTER update: { milestoneLogs: 2 }
```

---

## If Still Broken After Fixes

### Nuclear Option: Clear Everything and Restart

```javascript
// 1. Clear all state
localStorage.clear();
sessionStorage.clear();

// 2. Hard reload
location.reload();

// 3. Load lesson FIRST (before connecting)

// 4. Wait for tools to load (check console)

// 5. THEN connect
```

---

## Summary

**Core Issue:** Tools likely not registered with Gemini Live API  
**Cascade Effect:** No tools → No milestone completion → No teacher panel updates  
**Primary Fix:** Force reconnection when tools become available  
**Secondary Fix:** Verify config is actually sent to Gemini SDK  
**Verification:** Check WebSocket messages and console logs  

**Next Steps:**
1. Audit use-live-api.ts connect() implementation
2. Verify GenAILiveClient.connect() accepts config
3. Add reconnection logic when tools load
4. Add comprehensive logging at every step
5. Test end-to-end with verification at each stage
