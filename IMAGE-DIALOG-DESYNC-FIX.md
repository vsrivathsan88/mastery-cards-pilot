# Image-Dialog Desynchronization - ROOT CAUSE & FIX

**Issue:** Images don't match dialog. Cover image stays up when Pi talks about "cakes cut differently."

**Date:** 2025-11-09  
**Severity:** CRITICAL - Core UX broken

---

## Root Cause Analysis

### What Pi Receives:

Currently, `formatLessonContext()` sends:

```typescript
currentMilestone: {
  title: "Act 1: Luna's Birthday Cookie Challenge",
  description: "Student discovers fairness concept...",
  keywords: ["fair", "not fair", "same amount", ...],
  // ❌ NO PROMPT FIELD!
}
```

### What Pi SHOULD Receive:

The lesson JSON has a **detailed `prompt` field** with story beats and image switching instructions:

```json
{
  "id": "act-1-curiosity",
  "prompt": "It's Luna's birthday! 🎂 She baked the BIGGEST chocolate chip cookie ever...\n\n[Cover image shows: Three friends around whole cookie]\n\nBut then Luna realizes... three friends, ONE giant cookie. Uh oh!\n\nWhat do you think happens next?\n\n[Wait for student response]\n\nLuna tries to cut it! [Call show_image('unequal-cookie-kids') here to reveal the problem]\n\nLook at their faces! See Carlos on the left? Maya in the middle? Look at the pieces they got... what do you notice?"
}
```

**This prompt is NEVER sent to Pi!**

### Consequence:

Pi has NO IDEA:
- ❌ What the story narrative is
- ❌ When to switch images during the story
- ❌ What to say at each story beat
- ❌ That there's even a connection between dialog and images

**Result:** Pi improvises the story WITHOUT knowing to switch images.

---

## Why This Happened

**Original Design Assumption:**
The `prompt` field was intended as a **curriculum design guide** for humans, not for the AI.

**Reality:**
The prompts contain CRITICAL information:
1. Story narrative structure
2. Image switching timing (`[Call show_image(...)]`)
3. Teaching moments and questions
4. Story beats with student interaction points

**Without these prompts, Pi is flying blind!**

---

## The Fix

### Option A: Send Full Prompt (RECOMMENDED)

**File:** `packages/agents/src/prompts/lesson-context-formatter.ts`

Add `prompt` to milestone data:

```typescript
currentMilestone: {
  title: milestone.title,
  description: milestone.description,
  keywords: milestone.keywords || [],
  prompt: (milestone as any).prompt || undefined,  // ✅ ADD THIS
  index: milestoneIndex,
  total: lesson.milestones.length,
  teachingTips: (milestone as any).teachingTips || [],
},
```

**Pros:**
- Pi gets complete story with timing
- Image switching instructions are embedded
- Pi knows exactly when to call show_image

**Cons:**
- Prompts have bracketed meta-instructions like `[Wait for student response]`
- Need to clean these up or teach Pi to interpret them

---

### Option B: Extract Image Cues

Parse the prompt and extract image switching cues:

```typescript
// Extract image switching instructions from prompt
function extractImageCues(prompt: string): Array<{ trigger: string; imageId: string }> {
  const regex = /\[Call show_image\('([^']+)'\)([^\]]*)\]/g;
  const cues = [];
  let match;
  
  while ((match = regex.exec(prompt)) !== null) {
    cues.push({
      imageId: match[1],
      context: match[2].replace('here to', '').trim(),
    });
  }
  
  return cues;
}

// Then add to milestone data:
currentMilestone: {
  // ... existing fields ...
  imageCues: extractImageCues((milestone as any).prompt || ''),
}
```

**Pros:**
- Cleaner data for Pi
- No meta-instructions to interpret

**Cons:**
- Loses story context
- Pi still doesn't know the narrative flow
- More complex parsing logic

---

### Option C: Clean Prompt + Image Map (BEST)

Send cleaned prompt + explicit image mapping:

```typescript
function cleanPrompt(prompt: string): string {
  // Remove bracketed meta-instructions
  return prompt
    .replace(/\[Call show_image[^\]]+\]/g, '') // Remove show_image instructions
    .replace(/\[Wait for student response\]/g, '**[Pause and wait for student]**')
    .replace(/\[(Cover|Story) image shows:[^\]]+\]/g, '') // Remove image descriptions
    .trim();
}

function extractStoryBeats(prompt: string, milestoneId: string): string {
  const cleaned = cleanPrompt(prompt);
  
  // Add image switching guidance at natural story beats
  let enhanced = cleaned;
  
  // If prompt mentions "Look at" or "See", add show_image reminder
  if (enhanced.includes('Look at their faces')) {
    enhanced = enhanced.replace(
      'Look at their faces',
      '[Use show_image to show unequal pieces now] Look at their faces'
    );
  }
  
  return enhanced;
}

currentMilestone: {
  // ... existing fields ...
  storyScript: extractStoryBeats((milestone as any).prompt || '', milestone.id),
  suggestedImages: [
    { imageId: 'unequal-cookie-kids', when: 'when revealing the cutting result' }
  ],
}
```

**Pros:**
- Pi gets clean story script
- Explicit image switching guidance
- No ambiguous meta-instructions

**Cons:**
- Most complex implementation
- Requires careful parsing

---

## IMMEDIATE FIX (Simplest)

### Step 1: Add Prompt to Milestone Context

```typescript
// In lesson-context-formatter.ts
currentMilestone: {
  title: milestone.title,
  description: milestone.description,
  keywords: milestone.keywords || [],
  storyGuide: (milestone as any).prompt || '',  // ✅ ADD THIS
  index: milestoneIndex,
  total: lesson.milestones.length,
  teachingTips: (milestone as any).teachingTips || [],
},
```

### Step 2: Update System Prompt

Tell Pi how to interpret the story guide:

```
## Story Guides and Image Switching

You'll receive a `storyGuide` field with each milestone. This shows the intended story flow and includes bracketed instructions like:

- `[Call show_image('image-id') here to reveal X]` → Call show_image at this point
- `[Wait for student response]` → Pause and wait (you already do this!)
- `[Cover image shows: ...]` → Description (ignore, for reference only)

**How to Use:**
1. Follow the story beats in the guide
2. When you see `[Call show_image('...')...]`, call that tool at that moment
3. Adapt the wording to be natural and age-appropriate
4. Don't read the bracketed instructions aloud - they're for you

**Example:**
```
storyGuide: "Luna tries to cut it! [Call show_image('unequal-cookie-kids') here] Look at their faces!"

Your speech: "So Luna tries to cut it... [calls show_image('unequal-cookie-kids')] ...oh wow, look at their faces! What do you notice?"
```
```

---

## Testing After Fix

1. **Start lesson** → Should see cover image
2. **Pi starts story** → "It's Luna's birthday..."
3. **Pi builds suspense** → "What do you think happens next?"
4. **Student responds**
5. **Pi reveals** → "Luna tries to cut it!" + **[calls show_image('unequal-cookie-kids')]**
6. **Image should switch** → From cover to unequal pieces
7. **Pi continues** → "Look at their faces! What do you notice?"

**Expected:** Images change in sync with story beats ✅

---

## Why This Wasn't Caught Earlier

**The Disconnect:**
- Lesson JSON was designed with detailed `prompt` fields
- But the code only sent `title`, `description`, `keywords`
- The `prompt` was treated as documentation, not runtime data
- Nobody connected the dots until now

**The Assumption:**
We assumed Pi would improvise the story based on:
- Milestone title: "Act 1: Luna's Birthday Cookie Challenge"
- Description: "Student discovers fairness concept..."
- Keywords: ["fair", "not fair", "same amount"]

**The Reality:**
Pi DID improvise... but without knowing:
- The specific story (Luna, Maya, Carlos)
- The narrative beats (cookie, cutting, unequal pieces)
- When to switch images

---

## Severity Assessment

**Impact:** HIGH - Core learning experience broken
- Students see wrong images
- Story doesn't make sense
- Visual aids don't support learning

**Effort:** LOW - Add one field to context formatter
**Risk:** LOW - Prompt is already in JSON, just need to include it

**Priority:** CRITICAL - Fix immediately

---

## Implementation Steps

1. ✅ Add `prompt` (or `storyGuide`) to `formatLessonContext()`
2. ✅ Update system prompt to explain how to interpret bracketed instructions
3. ✅ Test with Act 1 milestone to verify image switching
4. ✅ Verify all milestones have prompts (some might be missing)
5. ✅ Document this pattern for future lesson authors

---

## Alternative: Manual Image Switching

If we can't fix the prompt issue quickly, we could:

**Quick Hack:**
Manually trigger `show_image` when milestone transitions happen:

```typescript
// In use-live-api.ts, onMilestoneCompleted
if (nextMilestone.id === 'act-1-curiosity') {
  // Force show the unequal cookie image
  setTimeout(() => {
    useLessonStore.getState().setCurrentImage('unequal-cookie-kids');
  }, 3000); // 3 seconds into story
}
```

**Cons:**
- Hardcoded timing
- Brittle
- Doesn't scale
- Not synchronized with actual dialog

**Only use as emergency stopgap!**

---

## Long-Term Fix

**Better Lesson Structure:**

Instead of embedding image switching in free-form prompts, use structured data:

```json
{
  "id": "act-1-curiosity",
  "storyBeats": [
    {
      "text": "It's Luna's birthday! She baked the BIGGEST chocolate chip cookie ever...",
      "image": "cover-birthday-party",
      "action": "show_image",
      "waitForResponse": false
    },
    {
      "text": "But then Luna realizes... three friends, ONE giant cookie. Uh oh! What do you think happens next?",
      "waitForResponse": true
    },
    {
      "text": "Luna tries to cut it!",
      "image": "unequal-cookie-kids",
      "action": "show_image",
      "waitForResponse": false
    },
    {
      "text": "Look at their faces! What do you notice?",
      "waitForResponse": true
    }
  ]
}
```

**Pros:**
- Machine-readable story structure
- Explicit image timing
- Clear interaction points
- Pi can't misinterpret

**Cons:**
- Requires lesson JSON refactor
- More complex authoring
- Not backward compatible

**Recommendation:** Do immediate fix now, consider structured beats for v2.
