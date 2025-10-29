# Prerequisite Check Simplification - FAST PATH

## 🎯 The 2-3 Things We ACTUALLY Need Before Starting

### For Fractions Lesson:

**1. Can they spot "different sizes"?** ✅ CRITICAL
   - **Check via:** Milestone 0 warmup (keyword detection - instant)
   - **Question:** "Look at these cookie pieces - are they the same size?"
   - **Pass:** Says "different", "bigger", "smaller", "not the same"
   - **Time:** 5-10 seconds

**2. Do they understand "fairness"?** ✅ IMPORTANT
   - **Check via:** Act 1 story (natural conversation)
   - **Question:** "Look at their faces - Carlos got tiny, Maya got huge. Fair?"
   - **Pass:** Says "not fair", "unfair", "Carlos got less"
   - **Time:** 10-15 seconds

**3. That's it!** Everything else checks DURING the lesson naturally.

---

## ❌ What We're Doing WRONG Now

### Current Flow (TOO SLOW):
1. Lesson starts
2. Run LLM prerequisite check for "equal-different" (500-2000ms)
3. Run LLM prerequisite check for "fairness-sharing" (500-2000ms)
4. Wait for results
5. **TOTAL: 1-4 seconds BEFORE anything happens** ❌

### Why It's Slow:
- 7 prerequisites defined (overkill!)
- Each one requires LLM API call
- Running sequentially or parallel (still slow)
- Most prerequisites aren't needed at START

---

## ✅ The FAST Path

### New Flow (INSTANT):
1. Lesson starts → Show Milestone 0 warmup image immediately
2. Ask: "What do you notice? Are they the same size?"
3. Student responds (5-10 seconds)
4. **Keyword detection** (0ms) checks for "different", "bigger", "smaller"
5. If PASS → Start Act 1 immediately
6. If FAIL → 30-second micro-lesson, retry once

**Total time to start lesson:** 15-30 seconds max ✅

---

## 🎓 What About Other Prerequisites?

### Don't Check Them Upfront!

**Counting (1-10):**
- Check WHEN they need to count ("3 friends")
- Natural part of conversation
- If they can't count to 3, help them inline

**Shapes (circle, rectangle):**
- Check WHEN shapes appear in lesson
- Point and say "this is a circle"
- No upfront test needed

**Half concept:**
- Teach DURING the lesson
- That's literally what the lesson is for!

**Partitioning:**
- This IS the lesson objective
- Don't need to know it before starting

---

## 🚀 Implementation: Remove Slow Checks

### Change 1: Disable LLM Prerequisite Checks at Start

**File:** `apps/tutor-app/hooks/media/use-live-api.ts`

```typescript
// BEFORE (SLOW):
if (shouldCheckPrerequisites) {
  console.log('[useLiveApi] 🔍 Checking prerequisites for milestone:', currentMilestone.title);
  
  const prerequisitesToCheck = (currentMilestone as any).assessedPrerequisites || [];
  
  for (const prereqId of prerequisitesToCheck) {
    // Calls LLM - SLOW!
    const result = await agentService.checkPrerequisite(text, prereqId, true);
  }
}

// AFTER (FAST):
// DO NOTHING! Milestone 0 keywords ARE the prerequisite check
// No LLM call needed
```

### Change 2: Trust Milestone 0 Keyword Detection

**Milestone 0 already has the right keywords:**
```json
{
  "id": "milestone-0-warmup",
  "keywords": [
    "different",
    "not the same", 
    "bigger",
    "smaller",
    "tiny",
    "huge",
    "unequal"
  ]
}
```

**When student says ANY of these → they pass!**

### Change 3: Handle Failure Inline (Optional)

If student doesn't say the keywords after 2 attempts:
```typescript
// In PedagogyEngine.ts
if (attempts > 2 && !milestone.completed) {
  console.log('[PedagogyEngine] Student struggling with warmup - triggering hint');
  // Show hint: "Look at the sizes - is this one bigger or smaller?"
}
```

---

## 📊 Speed Comparison

### OLD WAY (Slow):
```
Lesson Start
  ↓ 500-2000ms (LLM call for prereq 1)
  ↓ 500-2000ms (LLM call for prereq 2)
  ↓ Process results
  ↓ 1-4 seconds total
Show Milestone 0
```

### NEW WAY (Fast):
```
Lesson Start
  ↓ 0ms (just show image!)
Show Milestone 0
  ↓ Student responds (5-10s)
  ↓ 0ms (keyword detection)
Pass/Fail instantly
```

**Speed improvement: 1-4 seconds → instant!** 🚀

---

## 🎯 Design Principle: Just-In-Time Assessment

**Don't check things you don't need yet!**

- Upfront checks = delay + frustration
- Inline checks = natural + fast
- Failed checks = teachable moments

**Example:**
```
BAD: "Before we start, let me test if you can count to 10..."
GOOD: "Luna invited 3 friends! Can you hold up 3 fingers?" [natural check]
```

---

## ✅ Implementation Steps

1. **Remove LLM prerequisite checks from lesson start** (5 min)
2. **Trust Milestone 0 keyword detection** (already works!)
3. **Add inline hints if student stuck** (optional, 10 min)
4. **Test: Lesson should start in <30 seconds** ✅

---

## 🧪 Testing

### Before Fix:
- Start lesson
- Wait 2-4 seconds for prerequisite checks
- Finally see content

### After Fix:
- Start lesson
- **Immediately** see Milestone 0 warmup image
- Student answers in 5-10 seconds
- Move to Act 1

**Student experience: "Wow, that was fast!"** ✅

---

## 💡 Key Insight

**The warmup milestone IS the prerequisite check!**

We already designed it perfectly:
- Shows visual prompt
- Asks simple question  
- Requires specific keywords
- Takes 10-20 seconds

Adding LLM prerequisite checks ON TOP of this is:
- Redundant (checking same thing twice)
- Slow (1-4 second delay)
- Unnecessary (keywords work fine)

**Solution: Trust the design we already have!**
