# E2E Test Plan - Real Agent Integration

**Date**: 2025-10-25  
**Status**: ✅ Ready for Testing  
**Build**: Production build successful

---

## 🎯 What Was Connected

### Real LLM Agents Now Active

**1. EmotionalClassifier** ✅
- Uses Gemini 2.0 Flash Experimental
- Analyzes student speech for emotional state
- Returns: engagement, frustration, confusion levels
- Processing time: ~100-200ms

**2. MisconceptionClassifier** ✅
- Uses Gemini 2.0 Flash Experimental
- Detects mathematical misconceptions
- Returns: type, evidence, intervention suggestions
- Processing time: ~150-250ms

### Integration Points

```
Student Speech → Gemini Live STT →
  ↓
AgentService.analyzeTranscription() →
  ├─ EmotionalClassifier.analyze()     [REAL LLM]
  ├─ MisconceptionClassifier.analyze() [REAL LLM]
  └─ Results aggregated
  ↓
TeacherPanel.syncAgentInsights() →
  ├─ Misconception logged with evidence
  ├─ Emotional state updated
  └─ UI displays real insights
```

---

## 📋 Pre-Test Checklist

### Environment Setup

- [ ] `.env.local` has valid `GEMINI_API_KEY`
- [ ] Dev server running: `pnpm run dev`
- [ ] Browser console open (for agent logs)
- [ ] Teacher panel visible (click folder tab on right)

### Verification Commands

```bash
# Check API key is loaded
cd apps/tutor-app
cat .env.local | grep GEMINI_API_KEY

# Start dev server
pnpm run dev

# In another terminal - watch for errors
tail -f apps/tutor-app/dist/assets/*.js
```

---

## 🧪 Test Scenarios

### Test 1: Emotional State Detection (Basic)

**Objective**: Verify EmotionalClassifier detects emotions

**Steps**:
1. Start lesson (Equal Parts Challenge)
2. Say: "I love this! This is so cool!"
3. Check console logs for `[AgentService] ✅ LLM emotional analysis complete`
4. Open teacher panel → Emotional tab
5. Verify engagement level is high (~80-90%)

**Expected Results**:
- Console shows: `state: 'excited'` or `state: 'confident'`
- Teacher panel shows high engagement (green bar)
- Frustration/confusion low

**Fallback**:
- If LLM fails, should show fallback neutral state
- Console shows: `[AgentService] ❌ EmotionalClassifier failed`

---

### Test 2: Frustration Detection

**Objective**: Verify frustration is detected

**Steps**:
1. Say: "I don't know... this is too hard..."
2. Say: "I can't figure this out"
3. Check emotional state in teacher panel

**Expected Results**:
- Console shows: `state: 'frustrated'`
- Teacher panel shows:
  - Frustration level HIGH (~60-80%)
  - Engagement level drops
  - Color changes to orange/red
- Recommendation: "Consider providing additional scaffolding"

---

### Test 3: Misconception Detection

**Objective**: Verify MisconceptionClassifier detects errors

**Steps**:
1. When asked about fractions, say: "I think one half equals zero"
2. Or say: "Three fourths is the same as 0.3"
3. Check console for misconception detection
4. Open teacher panel → Misconceptions tab

**Expected Results**:
- Console shows: `[AgentService] ⚠️ LLM detected misconception!`
- Log includes:
  - `type: "fraction_to_decimal"` or similar
  - `confidence: 0.7+`
- Teacher panel shows:
  - New misconception card
  - Student's exact quote
  - Suggested intervention
  - Severity badge (likely "high")

---

### Test 4: No False Positives

**Objective**: Verify correct answers aren't flagged

**Steps**:
1. Say: "One half is 0.5, or 50 percent"
2. Say: "Three equal parts means each part is one third"
3. Check for misconception detection

**Expected Results**:
- Console shows: `No misconceptions detected by LLM`
- Teacher panel Misconceptions tab stays empty or unchanged
- No false positive cards

---

### Test 5: Confusion Detection

**Objective**: Verify confusion state works

**Steps**:
1. Say: "Wait, I'm not sure... what do you mean?"
2. Say: "I'm confused about this"
3. Check emotional state

**Expected Results**:
- Console shows: `state: 'confused'`
- Teacher panel shows:
  - Confusion level HIGH (~60-80%)
  - Recommendation: "Clarify current concept"

---

### Test 6: Multi-Turn Tracking

**Objective**: Verify insights update over time

**Steps**:
1. Start excited: "This looks fun!"
2. Get confused: "Wait, I don't get it"
3. Show frustration: "This is hard..."
4. Recover: "Oh I see now!"
5. Check teacher panel tracks progression

**Expected Results**:
- Emotional state changes reflected in real-time
- Emotional tab shows current state (not cumulative)
- Each misconception gets separate card with timestamp

---

### Test 7: Evidence Snippets Display

**Objective**: Verify teacher panel shows agent outputs

**Steps**:
1. Trigger a misconception (say something wrong)
2. Open Misconceptions tab
3. Verify card shows:
   - Type (e.g., "fraction_to_decimal")
   - Student quote ("I think 1/2 equals 0")
   - Detection source ("Agent analysis")
   - Suggested intervention
   - Severity badge

**Expected Results**:
- All fields populated
- Student quote matches what was said
- Intervention is actionable
- Severity matches context (high for clear errors)

---

### Test 8: Parallel Agent Execution

**Objective**: Verify agents run in parallel (performance)

**Steps**:
1. Say a short sentence
2. Check console timing: `duration: XXXms`
3. Verify both agents completed

**Expected Results**:
- Total processing time <400ms
- Console shows both:
  - `hasEmotional: true`
  - `hasMisconception: true/false`
- No sequential waiting (agents run in parallel)

---

### Test 9: Error Handling

**Objective**: Verify graceful degradation if LLM fails

**Steps**:
1. Temporarily disable network (airplane mode) OR
2. Use invalid API key (edit .env.local)
3. Try to use the app

**Expected Results**:
- App doesn't crash
- Console shows: `[AgentService] ❌ EmotionalClassifier failed, falling back to neutral`
- Teacher panel shows fallback data:
  - Engagement: 50%
  - State: "Engaged & Positive"
  - Note about inferred metrics

---

### Test 10: Full Session Flow

**Objective**: Complete end-to-end session

**Steps**:
1. Complete onboarding
2. Start Equal Parts Challenge
3. Have a natural conversation with Pi:
   - Show excitement
   - Make a mistake
   - Ask questions
   - Show understanding
4. Complete lesson
5. Review teacher panel data

**Expected Results**:
- Multiple emotional states tracked
- At least 1 misconception logged (if errors made)
- Evidence snippets populate
- Export buttons work (JSON/CSV)

---

## 🔍 What to Watch in Console

### Successful Agent Analysis
```javascript
[AgentService] 📊 Starting agent analysis { text: "..." }
[AgentService] ✅ LLM emotional analysis complete { 
  state: 'excited',
  engagement: 0.85,
  confidence: 0.9
}
[AgentService] ⚠️ LLM detected misconception! { 
  type: 'fraction_to_decimal',
  confidence: 0.8
}
[AgentService] 📊 Agent analysis complete {
  duration: 250,
  hasEmotional: true,
  hasMisconception: true
}
[StreamingConsole] ✅ Agents complete: ...
[StreamingConsole] 📊 TEACHER PANEL: Sync agent insights
[TeacherPanel] Syncing agent insights { 
  hasEmotional: true,
  hasMisconception: true
}
```

### Error Handling
```javascript
[AgentService] ❌ EmotionalClassifier failed ...
[AgentService] 📊 Agent analysis complete {
  duration: 100,
  hasEmotional: false,  // Failed, no data
  hasMisconception: true  // This one worked
}
```

---

## 📊 Success Criteria

### Must Pass ✅
- [ ] At least 8 out of 10 test scenarios pass
- [ ] No TypeScript errors
- [ ] No runtime crashes
- [ ] Teacher panel displays real insights
- [ ] Emotional states detected accurately (>70%)
- [ ] Misconceptions detected when present
- [ ] No false positives on correct answers
- [ ] Fallback works when LLM fails

### Nice to Have 🎯
- [ ] Processing time consistently <300ms
- [ ] Misconception confidence >0.8 for clear errors
- [ ] Export functions work
- [ ] UI updates smoothly (no lag)

---

## 🐛 Known Limitations

1. **Mock Lesson Misconceptions**: `LessonData` may not have `misconceptions` field yet
   - Workaround: Uses `(lesson as any).misconceptions || []`
   - Impact: Agent works but may not have lesson-specific misconceptions

2. **No Vision Integration**: Vision analysis still mocked
   - Impact: Can't analyze canvas drawings yet

3. **No Filler Speech**: Filler text selected but not spoken
   - Impact: Silent pauses instead of "Hmm, let me think..."

---

## 📝 Test Results Template

```markdown
## Test Results - [DATE]

**Tester**: [NAME]
**Environment**: Dev server / Production build
**API Key**: Valid ✅ / Invalid ❌

### Test 1: Emotional Detection
- Status: ✅ PASS / ❌ FAIL
- Notes: 

### Test 2: Frustration Detection
- Status: ✅ PASS / ❌ FAIL
- Notes:

[... continue for all tests]

### Issues Found:
1. 
2. 

### Recommendations:
1. 
2. 
```

---

## 🚀 Next Steps After Testing

1. **If tests pass**: Deploy to staging, monitor real usage
2. **If agents too slow**: Optimize prompts, cache results
3. **If false positives**: Tune confidence thresholds
4. **If insights useful**: Add more agent types (attention, metacognition)

---

## 📞 Debug Commands

```bash
# Check agent exports
cd packages/agents
grep "export.*Classifier" src/index.ts

# Verify API key loaded
cd apps/tutor-app
node -e "console.log(process.env.GEMINI_API_KEY?.substring(0,10))"

# Check build artifacts
ls -lh apps/tutor-app/dist/assets/

# Test LLM directly (optional)
cd packages/agents
node -e "
const { EmotionalClassifier } = require('./dist/index.js');
const classifier = new EmotionalClassifier(process.env.GEMINI_API_KEY);
classifier.analyze('I love this!').then(console.log);
"
```

---

**Ready for E2E Testing!** 🎉

All agents connected, TypeScript clean, production build successful.
