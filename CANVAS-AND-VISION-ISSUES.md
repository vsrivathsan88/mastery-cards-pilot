# Canvas & Vision Integration Issues

## Current Status

### ✅ What EXISTS:
1. **VisionService** - Full implementation ready (`apps/tutor-app/services/VisionService.ts`)
2. **analyzeVision** function - Available in useAgentContext hook
3. **Canvas formatting** - Context formatter for canvas state
4. **Canvas UI** - "Your Workspace" panel with drawing tools

### ❌ What's MISSING:

## Issue #1: Vision Analysis NEVER TRIGGERED 🚨

**Problem:** The `analyzeVision()` function exists but is **NEVER CALLED** anywhere in the codebase.

**Evidence:**
```bash
# Search for analyzeVision being called
grep -r "analyzeVision(" apps/tutor-app/
# Result: Only found in:
# - Definition in useAgentContext.ts
# - Definition in AgentService.ts
# - NO ACTUAL CALLS
```

**What this means:**
- Student can draw on canvas
- But Gemini NEVER sees what they drew
- Vision subagent never analyzes the drawings
- No feedback on visual work

**Where it SHOULD be called:**
1. After student finishes speaking and mentions "look" or "drawing"
2. Periodically while student is actively drawing (debounced)
3. When teacher triggers a vision check manually

## Issue #2: Prompt NEVER Mentions Canvas/Workspace 🚨

**Problem:** The system prompt doesn't tell Gemini about the canvas workspace.

**Current Prompt Structure:**
```
✅ Personality rules
✅ Pedagogy rules
✅ Response guidelines
✅ Image tool (show_image)
❌ Canvas/workspace - NOT MENTIONED
❌ Drawing encouragement - NOT MENTIONED
❌ Visual work validation - NOT MENTIONED
```

**What this means:**
- Gemini doesn't know students can draw
- Gemini doesn't encourage visual work
- Gemini doesn't ask students to "show your work on canvas"
- All the canvas UI is useless if Gemini never references it

## Issue #3: Vision Context NOT Sent to Gemini 🚨

**Problem:** Even if we call `analyzeVision()`, the results aren't sent to Gemini.

**Current Flow:**
```
Student draws → VisionService.analyzeCanvas() → Returns VisionContext
                                                ↓
                                                Stored in agent context
                                                ↓
                                                ??? (dead end)
```

**Missing Link:**
- Vision insights need to be formatted and sent to Gemini
- Either as JSON message or in next turn's context
- Currently: Vision context sits unused

---

## Fixes Needed

### Fix #1: Add Canvas Awareness to Prompt (CRITICAL)

Add to system prompt RIGHT AFTER critical pedagogy rules:

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 WORKSPACE & VISUAL LEARNING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Students have TWO learning tools:

1. **Today's Challenge Panel** (LEFT SIDE)
   - Shows the lesson image/problem
   - They can VIEW this to understand the challenge

2. **Your Workspace Panel** (RIGHT SIDE) 
   - Digital canvas for drawing
   - They can DRAW here to show their thinking
   - Use this to explore, experiment, visualize

## Encouraging Visual Work

✅ ALWAYS encourage students to use the workspace:
- "Can you draw that on your workspace?"
- "Show me what you're thinking by drawing it"
- "Let's try drawing [shape] on your workspace"
- "Sketch out how you'd divide this"

✅ Reference their drawings in conversation:
- "I see you drew [description]. Tell me about it!"
- "What do you notice about what you drew?"
- "That's a great start! Can you add [element]?"

✅ Validate visual thinking:
- Celebrate when they draw to show understanding
- Ask them to explain their drawings
- Build on visual work with verbal discussion

❌ NEVER skip the visual component:
- Don't just talk through problems
- Don't only use abstract language
- Math should be SEEN and DRAWN, not just spoken

## When You Receive Vision Analysis

You will receive JSON updates about their canvas work:

```json
{
  "type": "VISION_CONTEXT",
  "canvas": {
    "description": "Student drew a circle divided into 4 parts",
    "interpretation": "Attempting to show 1/4",
    "confidence": 0.8
  }
}
```

When you get this:
1. Acknowledge what they drew: "I see you divided it into 4 parts!"
2. Ask about their thinking: "Why did you divide it that way?"
3. Guide improvement if needed: "Can you make sure all parts are the same size?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Fix #2: Trigger Vision Analysis (CRITICAL)

**Where to add:**

In `StreamingConsole.tsx` or `use-live-api.ts`, add vision triggers:

```typescript
// After student finishes speaking
if (isFinal && text.trim().length > 0) {
  // Check if they mentioned their drawing
  const mentionsDrawing = /draw|drew|sketch|look|show|canvas|workspace/i.test(text);
  
  if (mentionsDrawing) {
    // Get canvas snapshot
    const canvas = getCanvasSnapshot(); // TODO: implement
    if (canvas) {
      console.log('[Vision] Student mentioned drawing, analyzing...');
      await analyzeVision(canvas);
    }
  }
}

// Periodic vision check (every 15 seconds of drawing activity)
useEffect(() => {
  const interval = setInterval(async () => {
    if (isConnected && !isAnalyzing) {
      const canvas = getCanvasSnapshot();
      if (canvas && canvasHasContent(canvas)) {
        console.log('[Vision] Periodic canvas check...');
        await analyzeVision(canvas);
      }
    }
  }, 15000); // Every 15 seconds
  
  return () => clearInterval(interval);
}, [isConnected, isAnalyzing]);
```

### Fix #3: Send Vision Context to Gemini (CRITICAL)

**Modify PromptBuilder to include vision context:**

```typescript
// In PromptBuilder.formatAgentContext()

if (context.vision) {
  sections.push(this.formatVisionContext(context.vision));
}

// And in formatVisionContext():
private static formatVisionContext(vision: VisionContext): string {
  return `
## 👁️ What Student Drew on Canvas

\`\`\`json
{
  "description": "${vision.description}",
  "interpretation": "${vision.interpretation}",
  "confidence": ${vision.confidence},
  "suggestion": "${vision.suggestion}"
}
\`\`\`

**IMPORTANT:** Reference their drawing in your response! Acknowledge what they drew and build on it.
${vision.confidence < 0.6 ? '⚠️ Low confidence - Ask them to explain their drawing verbally.' : ''}
`;
}
```

### Fix #4: Connect Canvas to Vision Service (MEDIUM)

**Add helper to get canvas snapshot:**

```typescript
// In StreamingConsole or new CanvasHelper
function getCanvasSnapshot(): string | null {
  // TODO: Get actual tldraw canvas snapshot
  // For now, placeholder:
  try {
    const canvasElement = document.querySelector('canvas[data-tldraw]');
    if (canvasElement && canvasElement instanceof HTMLCanvasElement) {
      return canvasElement.toDataURL('image/png');
    }
  } catch (e) {
    console.error('[Canvas] Failed to get snapshot:', e);
  }
  return null;
}

function canvasHasContent(snapshot: string): boolean {
  // Check if canvas is not blank
  // Simple heuristic: check data URL length
  return snapshot && snapshot.length > 5000; // More than blank canvas
}
```

---

## Implementation Priority

1. **IMMEDIATE (15 min):** Fix #1 - Add canvas awareness to prompt
2. **HIGH (30 min):** Fix #2 - Trigger vision on "draw" keywords  
3. **HIGH (30 min):** Fix #3 - Send vision context to Gemini
4. **MEDIUM (1 hour):** Fix #4 - Connect to actual canvas element

## Testing After Fixes

After implementation, you should see:

**In conversation:**
- [ ] Gemini says "Can you draw that on your workspace?"
- [ ] Gemini references "I see you drew..."
- [ ] Gemini validates visual work

**In console:**
- [ ] `[Vision] Student mentioned drawing, analyzing...`
- [ ] `[VisionService] Starting canvas analysis`
- [ ] `[VisionService] Canvas analysis complete`

**In teacher panel:**
- [ ] Vision insights logged (future enhancement)

---

## Bottom Line

Right now:
- ❌ Gemini doesn't know the canvas exists
- ❌ Vision analysis never runs
- ❌ Students aren't encouraged to draw
- ❌ Visual work is completely ignored

This is a **major pedagogy gap** because visual/spatial learning is critical for elementary math!
