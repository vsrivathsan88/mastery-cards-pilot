# Description Card System - Quick Setup Guide

**Created:** 2025-11-09  
**Purpose:** Use text-based description cards as placeholder for images while testing pilot tools

---

## ✅ What's Been Created

### 1. **Description Card Data**
**File:** `apps/tutor-app/public/assets/fractions/image-descriptions.json`
- Contains all 15 image descriptions
- Structured JSON with title, description, math_question, type
- Each card has unique ID matching original image spec

### 2. **Card Display Component**
**File:** `apps/tutor-app/components/ImageDescriptionCard.tsx`
- React component that renders description cards beautifully
- Neo-brutalist styled cards with:
  - Type badge (color-coded)
  - Title
  - Description (with proper formatting)
  - Math question callout
  - Footer note indicating it's a placeholder

### 3. **Updated LessonImage Component**
**File:** `apps/tutor-app/components/LessonImage.tsx`
- Now checks if imageId is a description card
- If yes: Renders `ImageDescriptionCard` component
- If no: Renders actual image as before
- Seamless switching between cards and images

---

## 🚀 How to Use

### Current State (Description Cards Active)

The lesson JSON already has asset IDs that match the description cards. The system works like this:

```
Pi calls: show_image('prereq-unequal-pieces-obvious')
    ↓
LessonImage component checks description JSON
    ↓
Finds matching card → Renders ImageDescriptionCard
    ↓
Student sees beautiful formatted description card!
```

### Testing show_image Tool

1. **Start a lesson** with pilot mode enabled
2. **Pi calls** `show_image('prereq-unequal-pieces-obvious')` 
3. **Card appears** in the lesson panel
4. **Check console** for: `[LessonImage] 📝 Showing description card: prereq-unequal-pieces-obvious`

### Switching to Real Images Later

When you generate actual images:

1. **Save images** to: `apps/tutor-app/public/assets/fractions/[filename].svg`
2. **Update lesson JSON** URLs in assets array:
   ```json
   {
     "id": "prereq-unequal-pieces-obvious",
     "url": "/assets/fractions/prereq-unequal-pieces-obvious.svg",
     ...
   }
   ```
3. **No code changes needed** - LessonImage will automatically show real image instead of card

---

## 📊 All 15 Description Cards

| ID | Title | Type | Purpose |
|----|-------|------|---------|
| `prereq-unequal-pieces-obvious` | Cookie Size Comparison | prerequisite | Size comparison assessment |
| `prereq-fairness-kids-faces` | Is This Fair? | prerequisite | Emotional fairness check |
| `milestone0-identify-difference` | Three Circles | warmup | Equal vs unequal discrimination |
| `act2a-circle-template` | Blank Circle | practice | Student drawing template |
| `act2a-circle-thirds-model` | Circle Thirds Example | model | Worked example (3 parts) |
| `act2b-rectangle-template` | Blank Rectangle | practice | Student drawing template |
| `act2b-rectangle-fourths-model` | Rectangle Fourths Example | model | Worked example (4 parts) |
| `act2c-bar-sixths-model` | Sandwich Sixths Example | model | Worked example (6 parts) |
| `checkpoint-equal-unequal-comparison` | Assessment Checkpoint | checkpoint | Critical assessment |
| `act3b-notation-visual` | Fraction Notation | concept | Symbol-visual connection |
| `act3c-false-fraction-unequal` | Is This Correct? | critical-thinking | Error identification |
| `scaffolding-circle-halves-hint` | Hint: Halves | hint | Scaffolding support |
| `extension-irregular-shape` | Challenge: Hexagon | challenge | Advanced extension |
| `transfer-student-choice-shapes` | Pick a Shape! | choice | Student agency |
| `reflection-student-teaches-back` | Teach What You Learned | synthesis | Metacognitive reflection |

---

## 🎨 Card Appearance Example

```
┌─────────────────────────────────────────┐
│ [PREREQUISITE]                          │ <- Type badge (colored)
│                                         │
│ Cookie Size Comparison                  │ <- Title (24px bold)
│ ─────────────────────────────────────  │
│ ┌─────────────────────────────────────┐ │
│ │ Two rectangular cookies              │ │
│ │ side-by-side:                        │ │
│ │                                       │ │
│ │ Large Cookie (left):                 │ │ <- Description
│ │ 180px × 120px tan rectangle          │ │   (cream background box)
│ │ • 5 chocolate chips (12px each)      │ │
│ │ ...                                  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🤔 Think About It:                  │ │
│ │ Are these cookies the same size?    │ │ <- Math question
│ └─────────────────────────────────────┘ │   (colored border)
│                                         │
│ 📝 Description Card - Actual image     │ <- Footer
│    will be generated later              │
└─────────────────────────────────────────┘
```

---

## 🛠️ Technical Details

### How Detection Works

```typescript
// In LessonImage.tsx
const { description: descriptionCard } = useImageDescription(currentImage);

if (descriptionCard) {
  // Render description card
  return <ImageDescriptionCard {...descriptionCard} />;
}

// Otherwise render actual image
return <img src={image.url} ... />;
```

### Card Data Structure

```json
{
  "id": "prereq-unequal-pieces-obvious",
  "title": "Cookie Size Comparison",
  "description": "Two rectangular cookies...\n\n[multiline text]",
  "math_question": "Are these cookies the same size?",
  "type": "prerequisite"
}
```

### Color Coding by Type

- `prerequisite` → Warm orange (#FFB84D)
- `warmup` → Mint green (#7DCCB8)
- `practice` → Light blue (#A8D5E5)
- `model` → Mint green (#7DCCB8)
- `checkpoint` → Warm orange (#FFB84D)
- `concept` → Purple (#9B8FD9)
- `critical-thinking` → Coral red (#FF6B6B)
- `hint` → Light yellow (#FFD97D)
- `challenge` → Coral red (#FF6B6B)
- `choice` → Purple (#9B8FD9)
- `synthesis` → Mint green (#7DCCB8)

---

## ✅ Benefits of This Approach

### 1. **Immediate Testing**
- No waiting for image generation
- Test `show_image` tool right now
- Verify pilot infrastructure works

### 2. **Pedagogically Valid**
- Text descriptions force visualization (active learning)
- Students read and construct mental models
- Actually might be BETTER for some students!

### 3. **Easy Iteration**
- Change description text instantly
- No need to regenerate images
- Quick experimentation with wording

### 4. **Clear Math Focus**
- Description emphasizes mathematical relationships
- No decorative elements to distract
- Measurements and angles clearly stated

### 5. **Simple Migration Path**
- Generate images when ready
- Update URLs in lesson JSON
- No code changes needed
- Description cards remain available as fallback

---

## 🧪 Testing Checklist

### Verify Description Cards Work:

1. **Start lesson** in pilot mode
   - [ ] Lesson loads without errors

2. **Pi calls show_image**
   - [ ] Console shows: `[LessonImage] 📝 Showing description card: [id]`
   - [ ] Card renders with proper styling
   - [ ] Title, description, and question all visible

3. **Card displays correctly**
   - [ ] Type badge shows with correct color
   - [ ] Neo-brutalist styling (thick borders, shadows)
   - [ ] Description text formatted properly
   - [ ] Math question highlighted in colored box
   - [ ] Footer note present

4. **Multiple cards work**
   - [ ] Pi can switch between different cards
   - [ ] Each card displays its unique content
   - [ ] No flickering or loading issues

5. **Teacher panel**
   - [ ] Tool calls logged correctly
   - [ ] Image changes tracked

---

## 🔄 Migration to Real Images (Later)

### Step 1: Generate Images
Using prompts from `GEMINI-FLASH-OPTIMIZED-PROMPTS.md`:
```bash
# Generate for each image
# Save to: apps/tutor-app/public/assets/fractions/[id].svg
```

### Step 2: Update Lesson JSON
In `packages/lessons/src/definitions/fractions/lesson-equal-parts-challenge.json`:
```json
{
  "id": "prereq-unequal-pieces-obvious",
  "url": "/assets/fractions/prereq-unequal-pieces-obvious.svg",  <- Change this
  "alt": "...",
  "description": "..."
}
```

### Step 3: Test
- Image should appear instead of card
- If image fails to load, falls back to showing nothing (as before)
- Description card remains available if you revert URL

### Step 4: Keep Cards as Backup
- Don't delete `image-descriptions.json`
- Useful for testing, debugging
- Can switch back anytime by changing URLs

---

## 📝 Adding New Description Cards

If you need to add more:

1. **Add to JSON** (`image-descriptions.json`):
```json
{
  "id": "new-card-id",
  "title": "New Card Title",
  "description": "Multiline description...",
  "math_question": "Question?",
  "type": "practice"
}
```

2. **Add to lesson** (`lesson-equal-parts-challenge.json`):
```json
{
  "id": "new-card-id",
  "type": "image",
  "url": "description-card",  // Special marker (or anything)
  "alt": "...",
  "usage": "..."
}
```

3. **Pi can now call**: `show_image('new-card-id')`

---

## 💡 Pro Tips

1. **Rich descriptions are good** - Students benefit from detailed text
2. **Math questions drive discussion** - Pi can reference these in conversation
3. **Type badges provide context** - Students know what kind of activity it is
4. **Keep cards even after images** - Useful for accessibility/testing
5. **Test tool calls early** - Better to find issues now than during pilot

---

## 🎯 Next Steps

1. ✅ **Description cards created** (Done!)
2. ✅ **Components implemented** (Done!)
3. ✅ **LessonImage updated** (Done!)
4. 🔲 **Test show_image tool** - Start lesson and verify cards display
5. 🔲 **Test tool switching** - Pi changes cards during conversation
6. 🔲 **Verify teacher panel** - Tool calls logged correctly
7. 🔲 **Generate real images** - When ready, using optimized prompts
8. 🔲 **Update URLs** - Swap to real images seamlessly

---

**Bottom line:** You can now test the entire pilot WITHOUT waiting for image generation. When ready, swap in real images with zero code changes!
