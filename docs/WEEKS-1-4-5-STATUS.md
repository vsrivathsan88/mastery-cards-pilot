# Weeks 1, 4, 5 Implementation Status

## Overview
Starting with core pedagogy and tools first: dynamic images (Week 1), lesson redesign (Week 4), system prompts (Week 5). Teacher panel (Weeks 2-3) deferred to later phase.

**Date:** October 24, 2024

---

## ✅ WEEK 1: DYNAMIC IMAGE TOOL - **COMPLETE**

### Implemented
1. ✅ **show_image Tool Created**
   - File: `apps/tutor-app/lib/tools/lesson-tools.ts`
   - Parameters: imageId (required), context (optional)
   - Returns success response with confirmation

2. ✅ **Tool Handler Added**
   - File: `apps/tutor-app/hooks/media/use-live-api.ts`
   - Handles show_image function calls from Gemini
   - Updates lesson store with current image
   - Logs image switches for debugging

3. ✅ **Lesson State Updated**
   - File: `apps/tutor-app/lib/state.ts`
   - Added `currentImage?: string` to useLessonStore
   - Added `setCurrentImage(imageId)` action
   - Clears on lesson end

4. ✅ **LessonImage Component Enhanced**
   - File: `apps/tutor-app/components/LessonImage.tsx`
   - **4-Tier Priority System:**
     1. Tool-selected image (Pi's show_image call) - HIGHEST
     2. Cover image (lesson start, milestone 0)
     3. Milestone-based image (default behavior)
     4. First available asset (fallback)
   - Logs which priority is being used
   - Supports coverImage in lesson JSON

### How It Works
```
Pi starts lesson:
└─ LessonImage checks: milestoneIndex === 0 && coverImage exists?
   └─ YES: Show cover image automatically

Pi calls: show_image("unequal-cookie-kids")
└─ Tool handler: useLessonStore.setCurrentImage("unequal-cookie-kids")
└─ LessonImage re-renders
└─ Priority 1 activates: Shows tool-selected image
└─ Returns to Pi: "Image 'unequal-cookie-kids' is now displayed"

Student progresses to milestone 2:
└─ LessonImage checks: currentImage set?
   └─ NO: Falls back to Priority 3 (milestone-based)
```

### Testing
```bash
# Build successful ✓
cd apps/tutor-app && pnpm run build
# Result: ✓ built in 2.44s

# Next: Manual test with revised lesson
```

---

## 🚧 WEEK 4: LESSON REWRITE - **IN PROGRESS**

### What's Needed

#### 1. Cover Image (SVG)
**File to create:** `apps/tutor-app/public/assets/fractions/cover-birthday-party.svg`

**Design Spec:**
- Three kids (Luna, Maya, Carlos) sitting at table
- Giant cookie in center (uncut, whole)
- Excited/anticipatory expressions
- Birthday party setup (balloons, decorations optional)
- Simple, kid-friendly illustration
- Size: ~400x300px viewport

**Quick Creation Options:**
- Use Figma/Canva with simple shapes
- AI generation (Midjourney, DALL-E with prompt)
- Commission on Fiverr ($5-20)
- Use placeholder for now, create later

#### 2. Lesson JSON Rewrite
**File to update:** `packages/lessons/src/definitions/fractions/lesson-equal-parts-challenge.json`

**Changes Needed:**

**A. Add Cover Image:**
```json
{
  "id": "equal-parts-challenge",
  "title": "The Equal Parts Challenge",
  "coverImage": {
    "id": "cover-birthday-party",
    "url": "/assets/fractions/cover-birthday-party.svg",
    "alt": "Luna's birthday party with friends around a giant cookie",
    "description": "Hook image showing Luna, Maya, and Carlos excited around a whole giant cookie before the cutting challenge"
  },
  ...
}
```

**B. Rewrite Act 1 Milestone:**
```json
{
  "id": "act-1-curiosity",
  "order": 1,
  "title": "Act 1: Luna's Birthday Cookie Challenge",
  "description": "Student discovers the concept of fairness through Luna's cookie-sharing story",
  "keywords": [
    "fair",
    "not fair",
    "same amount",
    "more",
    "less",
    "bigger",
    "smaller"
  ],
  "prompt": "It's Luna's birthday! 🎂 She baked the BIGGEST chocolate chip cookie ever - like, pizza-sized! Her best friends Maya and Carlos are coming over... and they're SO excited.\n\n[Image will auto-display: cover-birthday-party]\n\nBut then Luna realizes... three friends, ONE giant cookie. Uh oh! What do you think happens next?\n\n[Wait for response, then...]\n\nLuna tries to cut it! [You should call show_image('unequal-cookie-kids') here]\n\nLook at everyone's faces! See Carlos on the left? Maya in the middle? Luna on the right? Look at the pieces they got... what do you notice?",
  "expectedConcepts": [
    "Fair sharing means everyone gets the same amount",
    "Unequal pieces aren't fair - some got more, some got less",
    "Same amount is different from same number of pieces"
  ],
  "completed": false
}
```

**C. Update Other Milestones:**
- Act 2a: Keep "Now draw a circle..." (exploration)
- Act 2b: Keep "Draw a rectangle..." (transfer)
- Act 3a: Add "You've been saying 'same amount' - mathematicians call that EQUAL..."
- Act 3b: Keep notation teaching
- Act 4: Keep transfer tasks

**D. Map show_image Calls:**
Update asset usage hints so Pi knows when to use each image:
```json
"assets": [
  {
    "id": "cover-birthday-party",
    "url": "/assets/fractions/cover-birthday-party.svg",
    "description": "Birthday party setup - use at lesson start",
    "usage": "lesson-start"
  },
  {
    "id": "unequal-cookie-kids",  
    "url": "/assets/fractions/unequal-cookie-share.svg",
    "description": "Unequal cookie pieces and reactions - use when revealing the cutting problem",
    "usage": "act-1-curiosity"
  },
  {
    "id": "equal-unequal-comparison",
    "url": "/assets/fractions/equal-unequal-comparison.svg", 
    "description": "Three shapes comparison - use for checkpoint",
    "usage": "act-2-checkpoint"
  },
  {
    "id": "notation-visual",
    "url": "/assets/fractions/1-3-notation-visual.svg",
    "description": "1/3 notation explained - use when teaching symbolic notation",
    "usage": "act-3b-notation"
  },
  {
    "id": "false-fraction",
    "url": "/assets/fractions/unequal-labeled-1-4.svg",
    "description": "Unequal parts wrongly labeled - use for critical thinking",
    "usage": "act-3c-retrieval"
  }
]
```

---

## 🚧 WEEK 5: SYSTEM PROMPT UPDATE - **PENDING**

### What's Needed

**File to update:** `packages/agents/src/prompts/static-system-prompt.ts`

**Sections to Add:**

#### 1. Wonder-First Pedagogy Guidelines
```markdown
# Teaching Philosophy: Wonder First, Math Second

Your goal is to make students CARE before they LEARN.

## The Three-Phase Approach

### PHASE 1: WONDER & CURIOSITY (Always start here!)
- Begin with a story or real scenario  
- Use names and emotions (Luna, Maya, Carlos)
- Ask "How would YOU feel?"
- Build curiosity: "Uh oh! What happens next?"
- Use ONLY everyday language
- NO math terms yet (no "equal", "fractions", "divide")

**Examples:**
✅ GOOD: "Luna's birthday! She made a HUGE cookie... but THREE friends. Uh oh!"
❌ BAD: "Let's learn about equal parts and fractions"

✅ GOOD: "If YOU got the tiny piece, how would you feel?"
❌ BAD: "Are these pieces equal in size?"

### PHASE 2: EXPLORATION & INTUITION
- Guide discovery through questions
- "What do you notice?" not "What is..."
- Let them try, adjust, explore
- Build on intuitive understanding
- Use familiar comparisons (pizza, sharing, fair/unfair)
- Still avoid formal math terms

**Examples:**
✅ GOOD: "How would you cut it so everyone's happy?"
❌ BAD: "Partition the shape into equal parts"

✅ GOOD: "Would everyone get the SAME AMOUNT?"
❌ BAD: "Are the parts equal?"

### PHASE 3: NAMING & FORMALIZING (Only after intuition!)
- Introduce math terminology
- Connect to what they discovered
- "We call this..." not "This is called..."
- Math words as labels for concepts they understand

**Examples:**
✅ GOOD: "You've been saying 'same amount' - mathematicians call that EQUAL. Equal means same. You've been finding equal parts!"
❌ BAD: "Equal means the same size"

## Critical Rules

1. **Start with emotion, not analysis**
   - Hook them with a story problem
   - Make them care about the outcome
   - THEN teach the concept

2. **Everyday language first**
   - fair/unfair before equal/unequal
   - same amount before equal parts
   - sharing before partitioning
   - pieces before fractions

3. **Math terms are the ENDING, not the beginning**
   - Build understanding FIRST
   - Name it LAST
   - "You've been doing [math concept] this whole time!"

4. **Ask, don't tell**
   - Socratic method throughout
   - Guide with questions
   - Let them discover

## Story-Telling Best Practices

- Use names (Luna, Maya, Carlos) not "Person A, Person B"
- Create stakes (birthday, friends, fairness)
- Show emotions (sad face, excited, disappointed)
- Make it relatable (sharing food, parties, friends)
- Build suspense ("Uh oh!", "What happens next?")
```

#### 2. Using the show_image Tool
```markdown
# Using Visual Aids: show_image Tool

You have access to images that support the lesson. Use the show_image tool
to display images at key story moments.

## When to Use show_image

1. **Lesson start** - Cover image sets the scene
2. **Story progression** - "Look what happened!" (reveal problem)
3. **Teaching concepts** - "Let me show you..." (visual explanation)
4. **Checkpoints** - "Compare these..." (assessment task)

## How to Use

Call show_image with the imageId from the lesson's assets:
- Check lesson context for available images
- Use imageId that matches the current moment
- Add context parameter explaining why

**Example Flow:**

Pi: "It's Luna's birthday! She made the biggest cookie ever..."
[Cover image already showing from lesson start]

Pi: "But then... Luna tries to cut it! Look what happened!"
[Call: show_image(imageId: "unequal-cookie-kids", context: "revealing the unfair cutting")]

Pi: "See their faces? Which piece would YOU want?"
[Student responds]

Pi: "Now let's see if YOU can do better! Challenge time..."
[Call: show_image(imageId: "equal-unequal-comparison", context: "checkpoint comparison task")]

## Important

- Only use imageIds that exist in current lesson
- Don't switch images too frequently (let them absorb)
- Match image to story moment
- Images should SUPPORT dialogue, not replace it
```

#### 3. Integration with Existing Prompt

Add these sections AFTER the existing prompt content, before the milestone context section.

---

## File Status Summary

| File | Status | Next Action |
|------|--------|-------------|
| `lesson-tools.ts` | ✅ Created | None - complete |
| `state.ts` | ✅ Updated | None - complete |
| `use-live-api.ts` | ✅ Updated | None - complete |
| `LessonImage.tsx` | ✅ Enhanced | None - complete |
| `cover-birthday-party.svg` | ❌ Not created | **CREATE THIS** |
| `lesson-equal-parts-challenge.json` | ⚠️ Needs update | **REWRITE** |
| `static-system-prompt.ts` | ⚠️ Needs update | **ADD SECTIONS** |

---

## Testing Plan

### After Week 4 Complete:
```bash
# 1. Verify cover image displays
# 2. Start Equal Parts Challenge
# 3. Check: Cover image shows automatically
# 4. Progress through Act 1
# 5. Watch console for: "🖼️ Showing image: unequal-cookie-kids"
# 6. Verify image switches when Pi calls show_image
```

### After Week 5 Complete:
```bash
# 1. Start lesson
# 2. Listen to Pi's opening
# 3. Verify: Uses story language (Luna, birthday, cookie)
# 4. Verify: NO math terms upfront (no "equal", "fractions")
# 5. Progress through exploration
# 6. Verify: Math terms introduced later (Act 3)
# 7. Check: Images switch at appropriate story moments
```

---

## Implementation Order

### Recommended Sequence:

**NEXT: Week 4 Part 1 - Cover Image**
1. Create cover-birthday-party.svg (15 min - 2 hours depending on method)
2. Place in `apps/tutor-app/public/assets/fractions/`
3. Test that it loads correctly

**THEN: Week 4 Part 2 - Lesson JSON**
1. Update lesson-equal-parts-challenge.json
2. Add coverImage field
3. Rewrite Act 1 milestone with story approach
4. Update asset descriptions with usage hints
5. Build and test

**THEN: Week 5 - System Prompt**
1. Update static-system-prompt.ts
2. Add wonder-first pedagogy section
3. Add show_image usage section
4. Test Pi's adherence to guidelines
5. Iterate if needed

**FINALLY: Integration Test**
1. Full lesson walkthrough
2. Verify wonder-first flow
3. Verify image switching
4. Verify standards coverage (3.NF.A.1 still 100%)
5. Document any issues

---

## Quick Start Commands

### Create Cover Image (Placeholder)
```bash
# If you want to start testing with a placeholder:
cd apps/tutor-app/public/assets/fractions
# Create a simple SVG placeholder manually or use this:
cat > cover-birthday-party.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#FFE5B4"/>
  <circle cx="200" cy="150" r="80" fill="#D2691E"/>
  <text x="200" y="160" font-size="16" text-anchor="middle">
    🎂 Luna's Birthday Party! 🍪
  </text>
  <text x="200" y="250" font-size="12" text-anchor="middle">
    (Placeholder - replace with real illustration)
  </text>
</svg>
EOF
```

### Build and Test
```bash
cd /Users/vsrivathsan/Documents/simili-monorepo-v1
pnpm run build --filter @simili/lessons
cd apps/tutor-app && pnpm run dev

# Then test in browser:
# 1. Select Equal Parts Challenge
# 2. Watch console for image logs
# 3. Verify cover image appears
```

---

## Success Criteria

### Week 1 ✅
- [x] show_image tool exists
- [x] Tool handler works
- [x] LessonImage has priority system
- [x] Build succeeds
- [x] Committed to git

### Week 4 (In Progress)
- [ ] Cover image created
- [ ] Lesson JSON has coverImage field
- [ ] Act 1 rewritten with story approach
- [ ] Assets have usage hints
- [ ] Lesson builds successfully
- [ ] Manual test shows cover image
- [ ] Manual test shows image switching

### Week 5 (Pending)
- [ ] System prompt has wonder-first section
- [ ] System prompt has show_image guidance
- [ ] Pi uses story language in Act 1
- [ ] Pi calls show_image appropriately
- [ ] Math terms come later (Act 3+)
- [ ] Full lesson maintains 3.NF.A.1 coverage

---

## Current Status: Week 1 Complete ✓

**What Works:**
- ✅ show_image tool ready for Pi to use
- ✅ Image priority system handles tool calls
- ✅ Cover image support built-in
- ✅ State management for current image
- ✅ Tool responses to Gemini

**What's Needed:**
- 🎨 Create cover image SVG
- 📝 Rewrite lesson JSON with wonder-first
- 🤖 Update system prompt with pedagogy

**Estimated Time Remaining:**
- Cover image: 30 min - 2 hours (depending on creation method)
- Lesson JSON: 1-2 hours (careful rewriting)
- System prompt: 30 min - 1 hour (add sections)
- Testing: 1 hour (thorough walkthrough)
- **Total: 3-6 hours**

**Ready to proceed to Week 4!** 🚀
