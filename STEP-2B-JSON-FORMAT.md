# Step 2B Complete: JSON-Formatted Lesson Context

## What Changed

✅ **System Prompt Updated**
- Agent now expects structured JSON messages
- Knows about 3 types: `LESSON_CONTEXT`, `MISCONCEPTION_DETECTED`, `EMOTIONAL_STATE`
- Instructed to acknowledge internally but not mention receiving data

✅ **All Context Formatters Now Output JSON**
- `formatLessonContext()` → JSON
- `formatMilestoneTransition()` → JSON
- `formatMisconceptionFeedback()` → JSON
- `formatEmotionalFeedback()` → JSON

---

## Example JSON Messages

### 1. Lesson Context (Sent when lesson starts)

```json
{
  "type": "LESSON_CONTEXT",
  "action": "START_LESSON",
  "lesson": {
    "id": "fractions-chocolate-bar-1",
    "title": "Understanding One Half with Chocolate",
    "description": "Learn what one half means using a chocolate bar divided into equal pieces",
    "objectives": [
      "Understand that 'one half' means dividing something into 2 equal parts",
      "Identify when something is divided into halves",
      "Recognize that both pieces must be equal in size"
    ]
  },
  "currentMilestone": {
    "title": "Identify One Half",
    "description": "Student should identify what one half looks like",
    "keywords": ["half", "equal", "same size", "two pieces"],
    "index": 0,
    "total": 3,
    "teachingTips": []
  },
  "instructions": "Warmly greet the student and introduce the lesson \"Understanding One Half with Chocolate\". Guide them toward understanding \"Identify One Half\" using concrete examples."
}
```

### 2. Milestone Transition (When student progresses)

```json
{
  "type": "MILESTONE_TRANSITION",
  "completed": {
    "title": "Identify One Half",
    "description": "Student identified what one half looks like"
  },
  "next": {
    "title": "Create One Half",
    "description": "Student divides objects into equal halves",
    "keywords": ["divide", "split", "share equally"],
    "index": 1,
    "total": 3
  },
  "instructions": "Enthusiastically celebrate completing \"Identify One Half\", then transition to \"Create One Half\". Guide them toward this new concept with fresh examples."
}
```

### 3. Misconception Detected (From backend analysis)

```json
{
  "type": "MISCONCEPTION_DETECTED",
  "misconception": "unequal-parts-as-half",
  "studentSaid": "I split it into two pieces so they're both halves",
  "issue": "This indicates a common misconception about the concept.",
  "intervention": "Guide student to recognize that halves must be EQUAL in size, not just two pieces",
  "correctiveConcept": "One half means dividing into 2 pieces that are exactly the same size",
  "instructions": "Acknowledge their thinking warmly, ask probing questions, and guide them toward correct understanding using concrete examples. Never say \"that's wrong\"."
}
```

### 4. Emotional State Update (From backend monitoring)

```json
{
  "type": "EMOTIONAL_STATE",
  "state": "frustrated",
  "engagement": 6,
  "frustration": 8,
  "confusion": 7,
  "recommendation": "Break problem into smaller steps, offer more support",
  "suggestedAdjustment": "Offer more support, break problems into smaller steps"
}
```

---

## Benefits of JSON Format

### ✅ **Structured Data**
- Easy to parse and validate
- Clear field names and types
- Can include nested data

### ✅ **Extensible**
- Add new fields without breaking existing ones
- Different message types clearly identified
- Version control possible

### ✅ **Backend Integration Ready**
- Backend can easily generate these
- Frontend can parse and validate
- Can store in database as-is

### ✅ **Model-Friendly**
- LLMs are trained on JSON
- Can reference specific fields
- Better than unstructured text

---

## How Agent Uses JSON

### Agent System Prompt Says:

> "When you receive these JSON messages, **acknowledge them internally but don't explicitly mention receiving data**. Instead, naturally incorporate the information into your teaching."

### Example Agent Behavior:

**Receives:**
```json
{"type": "LESSON_CONTEXT", "lesson": {"title": "Understanding One Half with Chocolate"}, ...}
```

**Agent Response (Good):**
> "Hi there! I'm so excited to work with you today! We're going to explore fractions using a chocolate bar. Have you ever had to share chocolate with someone?"

**Agent Response (Bad - Don't do this):**
> "I received the lesson context about chocolate fractions. Let me now teach you..."

---

## Adding Dynamic Lessons

### Option 1: TypeScript Files (Current)
```typescript
// packages/lessons/src/data/my-lesson.ts
export const myLesson: LessonData = {
  id: 'my-lesson',
  title: 'My Lesson',
  // ...
};
```

### Option 2: JSON Files (Easy to add)
```json
// packages/lessons/data/my-lesson.json
{
  "id": "my-lesson",
  "title": "My Lesson",
  "description": "...",
  "objectives": ["..."],
  "milestones": [...]
}
```

### Option 3: API/Database (Future)
```typescript
// Load from backend
const lesson = await fetch('/api/lessons/my-lesson-id');
```

---

## Test Now

```bash
cd /Users/vsrivathsan/Documents/simili-monorepo-v1
pnpm dev
```

**Then:**
1. Refresh page
2. Click "Start: Understanding One Half"
3. Click Connect
4. Say "Hello"

**Expected:**
- Agent mentions **chocolate bar** (not pizza!)
- Agent uses **Simili personality** (warm, encouraging)
- Console shows JSON being sent

---

## Next Steps

**If this test works:**
- ✅ Step 2B Complete (JSON context format)
- → Move to Step 3: Remove old dynamic prompt logic
- → Then Step 4: Wire backend analysis injection

**If you want to add more lessons:**
- Tell me which format you prefer (TypeScript, JSON files, or API)
- I can set up the loader for you

---

**Please test and confirm the agent now mentions chocolate bar!** 🍫
