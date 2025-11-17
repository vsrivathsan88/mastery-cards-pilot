# Image Switching Prompts - FIXED ✅

**Date:** 2025-11-09  
**Issue:** Pi didn't know when to switch images during milestone transitions  
**Status:** FIXED

---

## 🔍 Root Cause Analysis

### What Was Broken:

1. **Static System Prompt** ✅ Had guidance:
   - Explained when to use `show_image` tool
   - Provided examples of calling show_image
   - Said: "Check lesson context for available images and their usage hints"

2. **BUT Lesson Context** ❌ Never sent images:
   - `formatLessonContext()` didn't include `availableImages` array
   - Pi was told to "check lesson context" but context had no images!

3. **Milestone Transitions** ❌ Never reminded Pi:
   - `formatMilestoneTransition()` didn't list images for new milestone
   - No explicit instruction to call `show_image` when transitioning
   - Pi had to remember from initial lesson load (unreliable)

### The Gap:

**System Prompt:** "Check lesson context for available images"  
**Lesson Context:** _(no images sent)_ ❌  
**Milestone Transition:** _(no images, no reminder)_ ❌

**Result:** Pi never knew which images existed or when to switch them!

---

## ✅ Fixes Applied

### Fix #1: Add Images to Lesson Context

**File:** `packages/agents/src/prompts/lesson-context-formatter.ts`

**Before:**
```typescript
const contextData = {
  type: 'LESSON_CONTEXT',
  lesson: {
    id: lesson.id,
    title: lesson.title,
    // ... no images!
  },
  instructions: `Warmly greet the student...`
};
```

**After:**
```typescript
// Extract available images from lesson assets
const availableImages = (lesson as any).assets?.map((asset: any) => ({
  id: asset.id,
  description: asset.description || asset.alt,
  usage: asset.usage || 'general',
  difficulty: asset.difficulty,
})) || [];

const contextData = {
  type: 'LESSON_CONTEXT',
  lesson: {
    id: lesson.id,
    title: lesson.title,
    availableImages, // ✅ NOW Pi knows what images exist!
  },
  instructions: `Warmly greet the student... Use show_image() to display relevant visuals at key story moments.`
};
```

**Impact:** Pi now receives the complete image list when lesson starts.

---

### Fix #2: Add Image Suggestions to Milestone Transitions

**File:** `packages/agents/src/prompts/lesson-context-formatter.ts`

**Before:**
```typescript
export function formatMilestoneTransition(
  completedMilestone: Milestone,
  nextMilestone: Milestone,
  nextMilestoneIndex: number,
  totalMilestones: number
): string {
  const transitionData = {
    type: 'MILESTONE_TRANSITION',
    next: {
      title: nextMilestone.title,
      // ... no images!
    },
    instructions: `Enthusiastically celebrate... Guide them toward this new concept.`
  };
}
```

**After:**
```typescript
export function formatMilestoneTransition(
  completedMilestone: Milestone,
  nextMilestone: Milestone,
  nextMilestoneIndex: number,
  totalMilestones: number,
  availableImages?: Array<{ id: string; description: string; usage: string }>
): string {
  // Extract suggested images for next milestone based on usage hints
  const suggestedImages = availableImages?.filter(img => 
    img.usage === (nextMilestone as any).id || 
    img.usage?.includes(nextMilestone.title.toLowerCase()) ||
    img.description?.toLowerCase().includes(nextMilestone.title.toLowerCase().split(' ')[0])
  ) || [];

  const transitionData = {
    type: 'MILESTONE_TRANSITION',
    next: {
      title: nextMilestone.title,
      suggestedImages: suggestedImages.length > 0 ? suggestedImages : undefined, // ✅ NEW!
    },
    instructions: suggestedImages.length > 0
      ? `Enthusiastically celebrate... **Important: Call show_image() with one of the suggested images to provide visual support for this new milestone.** Guide them toward this new concept with fresh examples.`
      : `Enthusiastically celebrate... Guide them toward this new concept with fresh examples.`
  };
}
```

**Impact:** 
- Pi receives filtered image suggestions for each milestone
- Explicit instruction to call `show_image()` when images are available
- Smart filtering matches images to milestone based on:
  - Exact milestone ID match in `usage` field
  - Milestone title keywords in `usage` field
  - Milestone title keywords in image description

---

### Fix #3: Update Caller to Pass Images

**File:** `apps/tutor-app/hooks/media/use-live-api.ts`

**Before:**
```typescript
const transitionMessage = formatMilestoneTransition(
  milestone,
  nextMilestone,
  progress?.currentMilestoneIndex || 0,
  currentLesson.milestones.length
);
```

**After:**
```typescript
// Extract available images from lesson assets
const availableImages = (currentLesson as any).assets?.map((asset: any) => ({
  id: asset.id,
  description: asset.description || asset.alt,
  usage: asset.usage || 'general',
})) || [];

const transitionMessage = formatMilestoneTransition(
  milestone,
  nextMilestone,
  progress?.currentMilestoneIndex || 0,
  currentLesson.milestones.length,
  availableImages // ✅ NOW Pi knows which images to use!
);
```

**Impact:** Caller properly passes image data to the formatting function.

---

## 📊 Example Output

### Lesson Start Message (Now Includes Images):

```json
{
  "type": "LESSON_CONTEXT",
  "action": "START_LESSON",
  "lesson": {
    "id": "equal-parts-challenge",
    "title": "The Equal Parts Challenge",
    "availableImages": [
      {
        "id": "cover-birthday-party",
        "description": "Luna's birthday party with three friends gathered around a giant whole cookie",
        "usage": "act-1-curiosity",
        "difficulty": "very-easy"
      },
      {
        "id": "unequal-cookie-kids",
        "description": "Three kids looking at unequal cookie pieces",
        "usage": "act-1-curiosity",
        "difficulty": "easy"
      },
      {
        "id": "equal-unequal-comparison",
        "description": "Side-by-side comparison of equal vs unequal partitioning",
        "usage": "act-2a-circle",
        "difficulty": "medium"
      }
    ]
  },
  "currentMilestone": {
    "title": "Act 1: Luna's Birthday Cookie Challenge"
  },
  "instructions": "Warmly greet the student... Use show_image() to display relevant visuals at key story moments."
}
```

### Milestone Transition Message (Now Suggests Images):

```json
{
  "type": "MILESTONE_TRANSITION",
  "completed": {
    "title": "Act 1: Luna's Birthday Cookie Challenge"
  },
  "next": {
    "title": "Act 2a: Dividing a Circle (Cookie)",
    "suggestedImages": [
      {
        "id": "equal-unequal-comparison",
        "description": "Side-by-side comparison showing equal vs unequal partitioning",
        "usage": "act-2a-circle"
      },
      {
        "id": "1-3-notation-visual",
        "description": "Visual showing 1/3 notation with three equal parts",
        "usage": "act-2a-circle"
      }
    ]
  },
  "instructions": "Enthusiastically celebrate completing 'Act 1: Luna's Birthday Cookie Challenge', then transition to 'Act 2a: Dividing a Circle (Cookie)'. **Important: Call show_image() with one of the suggested images to provide visual support for this new milestone.** Guide them toward this new concept with fresh examples."
}
```

---

## 🎯 How It Works Now

### Lesson Start Flow:

1. **Lesson loads** → `formatLessonContext()` extracts all images from lesson.assets
2. **Context message sent** → Pi receives complete list of available images
3. **Pi knows** → "I have 15 images available: cover-birthday-party, unequal-cookie-kids, ..."

### Milestone Transition Flow:

1. **Student completes milestone** → Pedagogy engine triggers `milestone_completed` event
2. **`formatMilestoneTransition()` called** → Filters images based on next milestone
3. **Smart matching**:
   - Usage field matches milestone ID (`"usage": "act-2a-circle"` → milestone ID: `"act-2a-circle"`)
   - Usage field contains milestone keywords (`"usage": "circle"` → milestone: "Dividing a Circle")
   - Description contains milestone keywords (`"description": "Circle with equal parts"` → milestone: "Dividing a Circle")
4. **Transition message sent** → Pi receives:
   - List of suggested images for new milestone
   - **Explicit instruction** to call `show_image()`
5. **Pi responds** → "Great job! Now let's try dividing a circle... [calls show_image('equal-unequal-comparison')]"

---

## 🧪 Testing Instructions

### Test #1: Verify Images in Initial Context

1. Start a lesson with pilot mode enabled
2. Open browser console
3. Look for: `[useLiveApi] ✉️ Sending lesson context...`
4. Check the JSON message includes `availableImages` array
5. **Expected:** Array with all lesson images (id, description, usage)

### Test #2: Verify Images in Milestone Transition

1. Complete first milestone (trigger transition)
2. Check console for: `[useLiveApi] ✉️ Sending milestone transition...`
3. Look at the JSON message
4. **Expected:** `suggestedImages` array with filtered images for new milestone
5. **Expected:** Instructions include "**Important: Call show_image()...**"

### Test #3: Verify Pi Actually Calls show_image

1. Complete first milestone
2. Wait for Pi's response
3. Check console for: `[useLiveApi] 🖼️ TOOL CALL: show_image`
4. **Expected:** Pi calls show_image with imageId from suggestedImages
5. **Expected:** Image switches in UI

### Test #4: Manual Prompt Test

Test Pi's understanding with direct questions:
```
User: "What images do you have available?"
Pi: "I have images of Luna's birthday party, the unequal cookie pieces, ..."

User: "Can you show me the next image?"
Pi: [calls show_image with appropriate imageId]
```

---

## 🔍 Console Logging

### What to Look For:

**Lesson Start:**
```
[useLiveApi] 🚀 Initializing lesson: The Equal Parts Challenge
[useLiveApi] ✉️ Sending lesson context...
  availableImages: [
    { id: "cover-birthday-party", usage: "act-1-curiosity", ... },
    { id: "unequal-cookie-kids", usage: "act-1-curiosity", ... },
    ...
  ]
[useLiveApi] ✅ Lesson context sent!
```

**Milestone Transition:**
```
[useLiveApi] ✅ Milestone completed: act-1-curiosity
[useLiveApi] 🎯 Moving to milestone 1: Act 2a: Dividing a Circle (Cookie)
[useLiveApi] 📝 Extracted 2 suggested images for next milestone
[useLiveApi] ✉️ Sending milestone transition...
  suggestedImages: [
    { id: "equal-unequal-comparison", usage: "act-2a-circle" },
    { id: "1-3-notation-visual", usage: "act-2a-circle" }
  ]
  instructions: "... **Important: Call show_image()..."
[useLiveApi] ✅ Milestone transition sent!
```

**Pi Calls show_image:**
```
[useLiveApi] 🖼️ TOOL CALL: show_image { imageId: "equal-unequal-comparison", ... }
[useLiveApi] ✅ Current image set to: equal-unequal-comparison
```

---

## ⚠️ Potential Issues

### Issue #1: No Images in suggestedImages Array

**Symptom:** Milestone transition has empty suggestedImages  
**Cause:** Image `usage` field doesn't match milestone ID/title  
**Fix:** Update lesson JSON to add proper `usage` tags to images:

```json
{
  "type": "image",
  "id": "circle-equal-parts",
  "usage": "act-2a-circle",  // ✅ Matches milestone ID
  "description": "Circle divided into equal parts"
}
```

### Issue #2: Pi Still Not Switching Images

**Symptom:** Images are sent but Pi doesn't call show_image  
**Possible Causes:**
1. **Tool calling still broken** → Verify Bug #1 fix (tools dependency)
2. **Pi ignoring instructions** → Check if instruction is **bold** in JSON
3. **Tool not registered** → Check console for toolCount > 0

**Debug:**
```javascript
// In browser console:
const { tools } = useTools.getState();
console.log('Enabled tools:', tools.filter(t => t.isEnabled).map(t => t.name));
// Should include: show_image
```

### Issue #3: Wrong Image Suggested

**Symptom:** Pi calls show_image but with wrong imageId  
**Cause:** Filtering logic too aggressive or not specific enough  
**Fix:** Adjust filtering in `formatMilestoneTransition()`:

```typescript
const suggestedImages = availableImages?.filter(img => 
  // Option 1: Exact match (most reliable)
  img.usage === (nextMilestone as any).id
  
  // Option 2: Partial match (more flexible)
  || img.usage?.includes(nextMilestone.id)
  
  // Option 3: Keyword match (fallback)
  || img.description?.toLowerCase().includes(nextMilestone.title.toLowerCase().split(' ')[0])
) || [];
```

---

## 📝 Files Modified

1. **`packages/agents/src/prompts/lesson-context-formatter.ts`**
   - Added `availableImages` extraction in `formatLessonContext()`
   - Added `availableImages` parameter to `formatMilestoneTransition()`
   - Added image filtering logic to suggest relevant images
   - Added explicit instruction to call `show_image()`

2. **`apps/tutor-app/hooks/media/use-live-api.ts`**
   - Extract availableImages from lesson assets
   - Pass availableImages to `formatMilestoneTransition()` call

---

## ✅ Expected Behavior After Fixes

1. **Lesson Start:**
   - Pi receives complete list of all lesson images
   - Pi can reference images by ID in conversations
   - Pi knows which images match which story moments

2. **Milestone Transitions:**
   - Pi receives filtered list of images for NEW milestone
   - Pi gets explicit instruction: "Call show_image() with suggested image"
   - Pi proactively switches images when milestone changes

3. **Mid-Conversation:**
   - Pi can call show_image based on story progression
   - Student can ask "show me an image" and Pi knows what's available
   - Images match pedagogical moments (curiosity, explanation, checkpoint)

4. **Teacher Panel:**
   - Tool calls logged (show_image appears in activity log)
   - Image switches visible in timeline
   - Evidence of visual aid usage tracked

---

## 🎉 Success Criteria

- [ ] Initial lesson context includes `availableImages` array in JSON
- [ ] Milestone transitions include `suggestedImages` for next milestone
- [ ] Transition instructions explicitly mention "Call show_image()"
- [ ] Pi actually calls `show_image()` during milestone transitions
- [ ] Images switch automatically when milestones complete
- [ ] Console shows: `[useLiveApi] 🖼️ TOOL CALL: show_image`
- [ ] UI displays new image after tool call
- [ ] Teacher panel logs image switches

---

## 🔗 Related Fixes

This fix works in conjunction with:

1. **Bug #1 Fix** (CRITICAL-BUGS-FIXED.md)
   - Tools must be registered with Gemini (dependency fix)
   - Without this, NO tool calls work (including show_image)

2. **Description Card System** (DESCRIPTION-CARDS-GUIDE.md)
   - Provides text-based fallback if images not generated yet
   - Works seamlessly with show_image tool

3. **Gemini-Optimized Prompts** (GEMINI-FLASH-OPTIMIZED-PROMPTS.md)
   - Image generation prompts for when ready to create actual images
   - Description cards → Real images migration path

---

**Bottom Line:** Pi now receives explicit, context-aware instructions about when and which images to display. The prompts are no longer vague ("check lesson context") but specific ("use these 2 suggested images for this milestone").
