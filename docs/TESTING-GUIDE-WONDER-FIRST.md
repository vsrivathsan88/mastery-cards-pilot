# Testing Guide: Wonder-First Lesson Implementation

## Overview
This guide walks through testing the complete Wonder-First implementation:
- Week 1: Dynamic image switching (show_image tool)
- Week 4: Story-driven lesson narrative with placeholder SVGs
- Week 5: System prompt with pedagogy guidelines

**Date Created:** October 24, 2024

---

## Pre-Testing Checklist

### Build Status
- [x] `packages/agents` - Built successfully ✓
- [x] `packages/lessons` - Built successfully ✓
- [x] `apps/tutor-app` - Built successfully ✓

### Git Status
- [x] Week 1 committed: `fbaeb82` - Dynamic image switching
- [x] Week 4 committed: `e530f66` - Wonder-first lesson redesign
- [ ] Week 5 committed: Pending - System prompt updates

### Files Modified
- [x] `apps/tutor-app/lib/tools/lesson-tools.ts` - show_image tool
- [x] `apps/tutor-app/lib/state.ts` - currentImage state
- [x] `apps/tutor-app/hooks/media/use-live-api.ts` - Tool handler
- [x] `apps/tutor-app/components/LessonImage.tsx` - Priority system
- [x] `apps/tutor-app/public/assets/fractions/*.svg` - 5 SVG placeholders
- [x] `packages/lessons/src/definitions/fractions/lesson-equal-parts-challenge.json` - Redesigned
- [x] `packages/agents/src/prompts/static-system-prompt.ts` - Updated

---

## Testing Phases

### Phase 1: Visual Inspection (5 minutes)

**Purpose:** Verify placeholder SVGs display correctly with descriptions.

**Steps:**
1. Start dev server: `cd apps/tutor-app && pnpm run dev`
2. Open browser to dev server URL
3. Navigate to Equal Parts Challenge lesson
4. Check for each SVG:

**Expected Results:**

✅ **Cover Image** (`cover-birthday-party.svg`)
- Shows at lesson start (milestone 0)
- Displays: Luna, Maya, Carlos around giant cookie
- Has colored box at bottom with description text
- Text readable and explains what final artwork should show

✅ **Unequal Cookie** (`unequal-cookie-share.svg`)
- Red description box at bottom
- Text: "PLACEHOLDER - Final: Show Luna's attempted cookie cutting"
- Character expressions visible

✅ **Comparison Shapes** (`equal-unequal-comparison.svg`)
- Blue description box
- Text: "Three shapes side-by-side comparison..."
- Three shapes visible with parts

✅ **Notation Visual** (`1-3-notation-visual.svg`)
- Blue description box
- Text: "Circle divided into 3 equal parts..."
- 1/3 notation visible

✅ **False Fraction** (`unequal-labeled-1-4.svg`)
- Red description box
- Text: "Rectangle with 4 UNEQUAL parts..."
- Warning symbol visible

**Pass Criteria:** All 5 SVGs load without errors and description boxes are clearly readable.

---

### Phase 2: Cover Image Auto-Display (3 minutes)

**Purpose:** Verify cover image shows automatically at lesson start.

**Steps:**
1. Start Equal Parts Challenge lesson
2. Wait for lesson to load (milestone 0)
3. Observe which image displays

**Expected Results:**
- ✅ Cover image (`cover-birthday-party.svg`) displays automatically
- ✅ Console log: `[LessonImage] 🖼️ Showing cover image`
- ✅ No manual show_image call needed from Pi

**Pass Criteria:** Cover image appears immediately when lesson starts.

---

### Phase 3: System Prompt Loading (2 minutes)

**Purpose:** Verify updated system prompt loads correctly.

**Steps:**
1. Open browser dev tools → Console
2. Filter logs for "system" or "prompt"
3. Look for system prompt initialization

**Expected Results:**
- ✅ System prompt contains "Wonder-First Pedagogy"
- ✅ System prompt contains "show_image Tool"
- ✅ No errors during prompt loading

**Console Commands to Check:**
```javascript
// In browser console (if system prompt is accessible)
// Check if wonder-first section exists
console.log(SIMILI_SYSTEM_PROMPT.includes("Wonder-First"));
// Should return: true
```

**Pass Criteria:** System prompt loads without errors.

---

### Phase 4: Live Conversation Testing (15-20 minutes)

**Purpose:** Test Pi's adherence to wonder-first approach and show_image usage.

#### Test 4A: Story-Driven Opening

**Setup:**
1. Start Equal Parts Challenge lesson
2. Wait for Pi to begin

**What to Listen For:**

✅ **GOOD - Wonder-First Opening:**
- Pi starts with emotion/story: "It's Luna's birthday!"
- Uses everyday language: "huge cookie", "three friends", "uh oh!"
- Builds suspense: "What do you think happens next?"
- NO math terms in opening (no "equal", "fractions", "partition")

❌ **BAD - Math-Heavy Opening:**
- "Today we'll learn about equal parts"
- "Let's talk about fractions"
- Analytical questions upfront: "What makes parts equal?"

**Student Response Test:**
- Say something like: "I don't know" or "Three kids?"
- Check if Pi builds curiosity before teaching

**Pass Criteria:** Pi hooks with story before teaching concepts.

---

#### Test 4B: show_image Tool Usage

**Setup:**
1. Continue conversation from Test 4A
2. Listen for Pi to say "Look what happened!" or similar

**What to Watch For:**

✅ **GOOD - Proper show_image Call:**
- Pi says: "Luna tries to cut it! Look what happened!"
- Console shows: `[useLiveApi] 🖼️ Showing image: unequal-cookie-kids`
- Image switches from cover to unequal-cookie-share.svg
- Console shows: `[LessonImage] 🎬 Showing tool-selected image: unequal-cookie-kids`

❌ **BAD - No Image Switch:**
- Pi mentions cutting but image doesn't change
- No console log for show_image call
- Error in console about missing imageId

**Testing Commands:**
```
# Watch console logs in real-time
# Filter: show_image OR LessonImage
```

**Pass Criteria:** Image switches when Pi calls show_image.

---

#### Test 4C: Everyday Language → Math Terms Progression

**Setup:**
1. Continue through Act 1 and Act 2
2. Pay attention to vocabulary progression

**Act 1 (Curiosity Phase):**

✅ **GOOD - Everyday Language:**
- "fair" / "not fair"
- "same amount"
- "bigger" / "smaller"
- "everyone gets the same"
- Personal questions: "How would YOU feel?"

❌ **BAD - Premature Math Terms:**
- Using "equal" in Act 1
- Using "fractions" before Act 3
- Using "partition" before hands-on exploration

**Act 2 (Exploration Phase):**

✅ **GOOD - Guided Discovery:**
- "What do you notice?"
- "How would you cut it?"
- "Would everyone be happy?"
- Still using everyday language

**Act 3 (Formalization Phase):**

✅ **GOOD - Math Terms Introduced:**
- "You've been saying 'same amount' - mathematicians call that EQUAL"
- "Equal means same"
- "We call this 'one-third'"
- Celebrating: "You've been finding equal parts this whole time!"

❌ **BAD - Abrupt Terminology:**
- "Equal means..." (without connecting to their language)
- Introducing terms without building intuition first

**Pass Criteria:** Pi uses everyday language in Acts 1-2, introduces math terms in Act 3.

---

#### Test 4D: Image Switching Throughout Lesson

**Setup:**
1. Progress through all acts
2. Watch for image switches at key moments

**Expected Image Sequence:**

1. **Lesson Start** → Cover image (auto)
2. **Act 1 - "Look what happened!"** → unequal-cookie-kids (show_image call)
3. **Act 2 Checkpoint** → equal-unequal-comparison (show_image call)
4. **Act 3b Notation** → notation-visual (show_image call)
5. **Act 3c Challenge** → false-fraction (show_image call)

**For Each Switch:**
- ✅ Console shows show_image call
- ✅ Image changes to correct asset
- ✅ Pi discusses what's shown in image
- ✅ Image stays visible during discussion

**Pass Criteria:** Pi calls show_image at appropriate story moments.

---

### Phase 5: Misconception Handling (5 minutes)

**Purpose:** Test if Pi handles misconceptions with wonder-first approach.

**Test Scenario:**
1. When asked about fair sharing, say: "They can each get 1 piece, so it's fair!"
2. (This is the "same count ≠ same amount" misconception)

**Expected Pi Response:**

✅ **GOOD - Wonder-First Correction:**
- "Interesting thinking! Let's look closer..."
- "Even if everyone gets 1 piece, look at the SIZES..."
- Shows image and asks: "Would you want the small piece?"
- Builds intuition before correcting

❌ **BAD - Direct Correction:**
- "No, that's wrong"
- "Equal means same size, not same count"
- Technical explanation without emotional connection

**Pass Criteria:** Pi addresses misconceptions warmly with questions and visuals.

---

### Phase 6: Milestone Completion & Celebrations (3 minutes)

**Purpose:** Verify celebrations work with new lesson flow.

**Steps:**
1. Complete Act 1 milestone (recognize unfair pieces)
2. Watch for celebration

**Expected Results:**
- ✅ Star burst animation appears
- ✅ 12-15 particles (70% stars, 30% emojis)
- ✅ Pi celebrates: "Great noticing!" or similar
- ✅ Milestone marked complete in UI

**Pass Criteria:** Celebrations trigger at milestone completion.

---

## Testing Checklist Summary

Use this quick checklist during testing:

### Visual Tests
- [ ] All 5 SVG placeholders load correctly
- [ ] Description boxes are readable on all SVGs
- [ ] Cover image shows at lesson start
- [ ] Images switch when Pi calls show_image

### Conversation Tests
- [ ] Pi starts with story (Luna's birthday)
- [ ] Pi uses everyday language in Act 1
- [ ] Pi calls show_image at key moments
- [ ] Pi introduces math terms in Act 3
- [ ] Pi handles misconceptions warmly

### Technical Tests
- [ ] Console shows show_image calls
- [ ] Console shows LessonImage priority logs
- [ ] No errors in console
- [ ] Star celebrations work
- [ ] Milestone progression tracks correctly

---

## Common Issues & Solutions

### Issue 1: Cover Image Not Showing
**Symptoms:** First image is milestone-based, not cover
**Check:**
- LessonImage component receiving milestoneIndex=0?
- coverImage field exists in lesson JSON?
**Fix:** Verify coverImage structure in lesson JSON

### Issue 2: show_image Calls Not Working
**Symptoms:** Image doesn't switch when Pi says "Look!"
**Check:**
- Console shows tool call?
- imageId matches asset id in lesson JSON?
**Fix:** Check lesson-tools.ts and use-live-api.ts integration

### Issue 3: Pi Uses Math Terms Too Early
**Symptoms:** Pi says "equal" in Act 1
**Check:**
- System prompt loaded correctly?
- Lesson prompt has wonder-first language?
**Fix:** Verify system prompt contains wonder-first section

### Issue 4: Images Switch Too Frequently
**Symptoms:** Image changes mid-sentence
**Check:**
- Pi calling show_image multiple times?
**Possible Cause:** System prompt not emphasizing "don't switch too frequently"

### Issue 5: Description Boxes Cut Off
**Symptoms:** Can't read placeholder text
**Check:**
- SVG viewport height accommodates box?
**Fix:** Adjust y-position or SVG viewBox height

---

## Success Criteria

### Minimum Viable Test (Must Pass)
- ✅ Cover image displays at start
- ✅ Pi starts with story language
- ✅ At least 1 show_image call works
- ✅ No console errors

### Full Success (All Should Pass)
- ✅ All 5 SVGs display correctly
- ✅ Pi uses wonder-first flow (emotion → intuition → terms)
- ✅ Images switch at all key moments
- ✅ Math terms appear only in Act 3+
- ✅ Celebrations work
- ✅ Standards coverage remains 100%

---

## Reporting Results

### If Tests Pass
Document:
- Which tests passed
- Any observations about Pi's language
- Image switching timing
- Student engagement feel

### If Tests Fail
Document:
- Which test failed
- Console errors (copy full error)
- Expected vs. actual behavior
- Steps to reproduce

### Feedback Areas
1. **Pedagogy:** Does wonder-first feel natural?
2. **Timing:** Do images switch at right moments?
3. **Clarity:** Are placeholder descriptions clear?
4. **Engagement:** Would this hook a 3rd grader?

---

## Next Steps After Testing

### If All Tests Pass:
1. Commit Week 5 changes
2. Update WEEKS-1-4-5-STATUS.md with results
3. Consider pilot testing with actual students
4. Plan artwork creation for placeholder SVGs

### If Tests Reveal Issues:
1. Document specific failures
2. Prioritize fixes (critical vs. nice-to-have)
3. Iterate on system prompt or lesson prompts
4. Re-test after fixes

---

## Manual Testing Commands

### Start Dev Server
```bash
cd /Users/vsrivathsan/Documents/simili-monorepo-v1/apps/tutor-app
pnpm run dev
```

### Watch Console Logs
```bash
# In browser console, filter by:
show_image
LessonImage
useLiveApi
```

### Check Lesson Data
```bash
# In browser console:
console.log(useLessonStore.getState().currentLesson);
console.log(useLessonStore.getState().currentImage);
```

---

## Estimated Testing Time

- **Phase 1:** 5 minutes (visual inspection)
- **Phase 2:** 3 minutes (cover image)
- **Phase 3:** 2 minutes (system prompt)
- **Phase 4:** 15-20 minutes (conversation)
- **Phase 5:** 5 minutes (misconceptions)
- **Phase 6:** 3 minutes (celebrations)

**Total:** ~30-40 minutes for thorough testing

---

## Final Notes

This implementation represents a significant pedagogical shift:

**Old Approach:**
- Math concepts upfront
- Analytical from the start
- Images static, milestone-based

**New Approach:**
- Story hooks emotion first
- Intuition before terminology
- Images dynamic, narrative-driven

The goal: Make students CARE before they LEARN.

Test with this lens: Would a 3rd grader be excited to continue after the opening?
