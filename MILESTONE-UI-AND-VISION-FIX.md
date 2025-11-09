# Milestone UI Updates & Vision Analysis - Complete Fix

**Issues:**
1. Milestone tracker UI not updating when student makes progress
2. Teacher dashboard not showing milestone updates
3. Vision analysis not working (not a tool call)

---

## Issue #1: Milestone UI Not Updating

### Root Cause:

**Progress updates only fire on COMPLETION, not on DETECTION**

Current flow:
```
Student speaks → keyword detected → milestone_detected event fires ✅
BUT progress_update event does NOT fire ❌
```

The `PedagogyEngine` only calls `emitProgress()` when:
- Milestone COMPLETES (line 136)
- NOT when keywords are detected

**Result:** UI doesn't update to show "you're working on milestone X"

### The Fix:

Emit `progress_update` on EVERY keyword match, not just completion:

```typescript
// In PedagogyEngine.ts processTranscription()
if (matchedKeywords.length > 0) {
  console.log(`[PedagogyEngine] 🎯 Milestone progress: "${currentMilestone.title}"`);
  
  // Emit detection event
  this.emit('milestone_detected', currentMilestone, text);
  
  // ✅ NEW: Emit progress update so UI updates
  this.emitProgress();  // ← ADD THIS!
  
  // Then check if complete
  if (isWarmup || hasStrongKeyword || matchedKeywords.length >= 2) {
    this.completeMilestone();
  }
}
```

---

## Issue #2: Teacher Dashboard Not Updating

### Root Cause:

Events ARE firing, store IS updating, but **React components may not be re-rendering**.

Possible issues:
1. Teacher panel component not subscribed correctly to zustand
2. Component not mounted when events fire
3. State updates not triggering renders

### Debug Steps:

```typescript
// Add to onMilestoneDetected in use-live-api.ts
const onMilestoneDetected = (milestone: any, transcription: string) => {
  console.log('[useLiveApi] 🎯 MILESTONE DETECTED EVENT');
  
  const store = useTeacherPanel.getState();
  console.log('[useLiveApi] 📊 Teacher panel BEFORE:', {
    milestoneLogs: store.milestoneLogs.length,
    isExpanded: store.isExpanded,
  });
  
  store.logMilestoneProgress(milestone.id, transcription, milestone.keywords || []);
  
  const storeAfter = useTeacherPanel.getState();
  console.log('[useLiveApi] 📊 Teacher panel AFTER:', {
    milestoneLogs: storeAfter.milestoneLogs.length,
    logJustAdded: storeAfter.milestoneLogs[storeAfter.milestoneLogs.length - 1],
  });
  
  // Force UI update
  store.togglePanel(); // Close
  setTimeout(() => store.togglePanel(), 10); // Reopen (forces re-render)
};
```

### The Fix:

Ensure teacher panel store triggers re-renders:

```typescript
// In teacher-panel-store.ts
export const useTeacherPanel = create<TeacherPanelStore>((set, get) => ({
  // ...
  logMilestoneProgress: (milestoneId: string, evidence: string, concepts: string[]) => {
    const log: MasteryMilestoneLog = {
      milestoneId,
      timestamp: Date.now(),
      evidence,
      concepts,
      status: 'in_progress',
    };
    
    set((state) => ({
      milestoneLogs: [...state.milestoneLogs, log],  // ✅ Create new array
    }));
    
    // ✅ Force notification (if using subscribers)
    console.log('[TeacherPanel] 📊 Milestone log added:', {
      total: get().milestoneLogs.length,
      latest: log,
    });
  },
}));
```

---

## Issue #3: Vision Analysis Not Working

### Root Cause:

Vision analysis is currently:
- ❌ NOT a tool call Pi can trigger
- ✅ Only triggered automatically on canvas changes
- ❌ Automatic triggers may not be firing

### The Problem:

Pi should be able to:
1. **Explicitly look at student's drawing** ("Let me see what you drew")
2. **Comment on their work** based on what's on canvas
3. **Verify correctness** of their partitioning

Currently, Pi has NO WAY to intentionally analyze the canvas!

### The Solution: Add Canvas Vision Tool

Create a new tool Pi can call:

```typescript
// In lesson-tools.ts or pilot-tools.ts
{
  name: 'analyze_student_canvas',
  description: `Look at and analyze what the student has drawn on their canvas.

Use this when:
- Student says "look at my drawing" or "what do you think?"
- You need to verify their partitioning is correct
- You want to comment on their work specifically
- Checking if they divided a shape into equal parts
- Student asks "is this right?"

IMPORTANT:
- This gives you a detailed description of what they drew
- Use it before giving feedback on their drawing
- Don't assume what they drew - actually look!
- Canvas might be empty (they haven't drawn yet)

Examples:
- "Let me look at what you drew..." → call analyze_student_canvas
- "I want to check your work" → call this first
- Student: "Did I do it right?" → call this to see their work
- "Show me your circle divided into thirds" → call this to verify`,
  
  parameters: {
    type: 'OBJECT',
    properties: {
      purpose: {
        type: 'STRING',
        description: 'Why you\'re analyzing the canvas. Examples: "Verifying equal parts", "Checking circle division", "Student asked for feedback"',
      },
      lookingFor: {
        type: 'STRING',
        enum: ['shapes', 'partitioning', 'equality', 'completeness', 'errors'],
        description: 'What aspect of the drawing you want to focus on',
      },
    },
    required: ['purpose', 'lookingFor'],
  },
  isEnabled: true,
}
```

### Implementation:

```typescript
// In use-live-api.ts onToolCall handler
else if (fc.name === 'analyze_student_canvas') {
  const { purpose, lookingFor } = fc.args;
  
  console.log(`[useLiveApi] 👁️ PILOT: Analyzing student canvas`, { purpose, lookingFor });
  
  // Get canvas snapshot
  const canvasRef = /* get canvas ref */;
  const snapshot = await canvasRef?.getSnapshot();
  
  if (!snapshot) {
    functionResponses.push({
      id: fc.id,
      name: fc.name,
      response: {
        success: false,
        error: 'Canvas is empty or unavailable',
        description: 'No drawing detected on canvas yet.',
      },
    });
    continue;
  }
  
  // Run vision analysis
  try {
    const analysis = await analyzeVision(snapshot);
    
    functionResponses.push({
      id: fc.id,
      name: fc.name,
      response: {
        success: true,
        description: analysis.description,
        interpretation: analysis.interpretation,
        suggestion: analysis.suggestion,
        confidence: analysis.confidence,
        findings: {
          hasShapes: analysis.hasShapes || false,
          shapeCount: analysis.shapeCount || 0,
          appearsEqual: analysis.appearsEqual || null,
          completeness: analysis.completeness || 'unknown',
        },
      },
    });
    
    console.log('[useLiveApi] ✅ Canvas analysis complete:', {
      confidence: analysis.confidence,
      hasShapes: analysis.hasShapes,
    });
  } catch (error) {
    console.error('[useLiveApi] ❌ Canvas analysis failed:', error);
    
    functionResponses.push({
      id: fc.id,
      name: fc.name,
      response: {
        success: false,
        error: 'Analysis failed',
        description: 'Could not analyze canvas at this time.',
      },
    });
  }
}
```

---

## Why Canvas Vision Should Be a Tool Call

### Option A: ONLY Automatic (Current - BROKEN)

**Pros:**
- No explicit tool call needed
- Happens in background

**Cons:**
- ❌ Pi doesn't know when vision analysis happens
- ❌ Pi can't request analysis when needed
- ❌ Pi might comment on drawings without seeing them
- ❌ No feedback loop (Pi doesn't get results)

### Option B: ONLY Tool Call

**Pros:**
- ✅ Pi explicitly requests when needed
- ✅ Pi gets analysis results to inform response
- ✅ Clear timing - Pi knows what it sees

**Cons:**
- Pi must remember to call it
- Extra tool call overhead

### Option C: BOTH (RECOMMENDED) ✅

**Automatic:**
- Trigger when canvas changes significantly
- Update Pi's context silently in background

**Tool Call:**
- Pi can explicitly request analysis
- Gets detailed results to inform response
- Used when Pi needs to comment on drawing

**Best of both worlds!**

---

## Implementation Plan

### Step 1: Fix Progress Updates

```typescript
// packages/agents/src/pedagogy/PedagogyEngine.ts
public processTranscription(text: string, isFinal: boolean): void {
  // ... existing code ...
  
  if (matchedKeywords.length > 0) {
    console.log(`[PedagogyEngine] 🎯 Milestone progress`);
    
    // Emit detection
    this.emit('milestone_detected', currentMilestone, text);
    
    // ✅ NEW: Emit progress update for UI
    this.emitProgress();  // ← ADD THIS LINE
    
    // Check if complete
    if (isWarmup || hasStrongKeyword || matchedKeywords.length >= 2) {
      this.completeMilestone();
    }
  }
}
```

### Step 2: Add Canvas Vision Tool

```typescript
// apps/tutor-app/lib/tools/pilot-tools.ts
export const pilotTools: FunctionCall[] = [
  // ... existing pilot tools ...
  {
    name: 'analyze_student_canvas',
    description: `Look at and analyze what the student has drawn...`,
    parameters: { /* as shown above */ },
    isEnabled: true,
  },
];
```

### Step 3: Implement Tool Handler

```typescript
// apps/tutor-app/hooks/media/use-live-api.ts
// In onToolCall handler, add case for analyze_student_canvas
// (as shown above in implementation section)
```

### Step 4: Merge Pilot Tools with Lesson Tools

```typescript
// apps/tutor-app/lib/state.ts
import { lessonTools } from './tools/lesson-tools';
import { pilotTools } from './tools/pilot-tools';
import { PILOT_MODE } from './pilot-config';

export const useTools = create<{
  tools: FunctionCall[];
}>((set) => ({
  tools: PILOT_MODE.enabled 
    ? [...lessonTools, ...pilotTools]  // ✅ Include pilot tools
    : lessonTools,
}));
```

---

## Testing Protocol

### Test 1: Milestone Progress Updates

1. Start lesson
2. Say a keyword (e.g., "bigger")
3. **Check console:**
   ```
   [PedagogyEngine] 🎯 Milestone progress
   [PedagogyEngine] Emitting progress update  ← NEW
   [useLiveApi] 📊 Teacher panel AFTER: { milestoneLogs: 1 }
   ```
4. **Check UI:**
   - Progress bar should update
   - Milestone indicator should highlight
   - Teacher panel should show log entry

### Test 2: Canvas Vision Tool

1. Draw something on canvas
2. Say "Look at my drawing"
3. **Pi should call analyze_student_canvas**
4. **Check console:**
   ```
   [useLiveApi] 👁️ PILOT: Analyzing student canvas
   [useLiveApi] ✅ Canvas analysis complete
   ```
5. **Pi should respond** based on what's actually on canvas

### Test 3: Teacher Dashboard

1. Open teacher panel (📊)
2. Go to Milestones tab
3. Say milestone keywords
4. **Should see:**
   - New log entry appears immediately
   - Timestamp updates
   - Evidence shows transcription

---

## Expected Console Output

```
# Student says "bigger"
[PedagogyEngine] 🎯 Milestone progress: "Warm-Up"
[PedagogyEngine] Keywords: bigger
[PedagogyEngine] Emitting progress update  ← NEW!
[useLiveApi] 🎯 MILESTONE DETECTED EVENT
[useLiveApi] 📊 Teacher panel BEFORE: { milestoneLogs: 0 }
[useLiveApi] 📊 Teacher panel AFTER: { milestoneLogs: 1 }

# Progress bar updates in UI ✅
# Milestone tracker highlights current milestone ✅
# Teacher panel shows log entry ✅

# Student draws and says "look at this"
[useLiveApi] 🔧 TOOL CALL RECEIVED: { functionNames: ['analyze_student_canvas'] }
[useLiveApi] 👁️ PILOT: Analyzing student canvas { purpose: "Student requested feedback" }
[useLiveApi] ✅ Canvas analysis complete: { confidence: 0.85, hasShapes: true }

# Pi responds: "I see you drew a circle with three sections..."
```

---

## Summary of Changes

1. ✅ **PedagogyEngine:** Emit progress_update on milestone detection (not just completion)
2. ✅ **Teacher Panel:** Verify store updates trigger re-renders
3. ✅ **Canvas Vision Tool:** Add analyze_student_canvas tool for Pi to call
4. ✅ **Tool Handler:** Implement canvas analysis in onToolCall
5. ✅ **Tool Loading:** Ensure pilot tools are loaded alongside lesson tools

**Result:** UI updates in real-time, Pi can see student drawings!
