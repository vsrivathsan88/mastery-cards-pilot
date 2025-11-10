# Multi-Layered Verification Testing Guide

## Overview

The multi-layered verification system ensures Pi accurately measures student understanding before awarding points. This guide provides exact test scenarios to validate the system works correctly.

---

## Test Suite 1: Basic Verification (Week 1)

### Test 1: Parroting Detection

**Objective:** Pi should NOT award points when student just repeats Pi's words

**Test Script - Card 1:**
```
1. Start session
2. Pi: "What do you notice about these cookies?"
3. Tester: "I notice there are cookies"
4. Pi should ask follow-up
5. Tester: "Four equal cookies" [repeats exact words from card title]
6. Pi: "What does 'equal' mean?"
7. Tester: "Um... equal means equal"
```

**Expected Result:** 
- ❌ NO POINTS awarded
- ✅ Pi moves to next card without awarding

**Pass Criteria:** 
- Pi detected parroting
- Pi asked clarifying question
- Pi moved on when clarification failed
- No false positive point award

---

### Test 2: Incomplete Answer Detection

**Objective:** Pi should ask follow-ups for incomplete answers, only award when complete

**Test Script - Card 1:**
```
1. Pi: "What do you notice about these cookies?"
2. Tester: "There's four cookies"
3. Pi should ask: "Tell me more about those cookies"
4. Tester: "They're cookies" [still incomplete]
5. Pi should ask one more follow-up
6. Tester: Still gives incomplete answer
```

**Expected Result:** 
- ❌ NO POINTS awarded
- ✅ Pi asked 1-2 follow-ups
- ✅ Pi moved to next card

**Pass Criteria:**
- Pi recognized incomplete answer
- Pi attempted to get complete information
- Pi didn't award points for partial understanding
- Pi moved on after 2-3 attempts

---

### Test 3: Confident Correct Answer

**Objective:** Pi awards points after proper verification for complete, confident answers

**Test Script - Card 1:**
```
1. Pi: "What do you notice about these cookies?"
2. Tester: "There's four cookies and they all look the same size" [complete, confident]
3. Pi: "What makes you say they're the same size?" [challenge question]
4. Tester: "They all take up the same amount of space" [explains reasoning]
```

**Expected Result:** 
- ✅ 30 POINTS awarded
- ✅ Pi celebrated appropriately
- ✅ Pi called show_next_card()
- ✅ Session progressed to Card 4

**Pass Criteria:**
- Pi asked challenge question (Layer 2)
- Pi verified reasoning
- Pi awarded points only after verification
- Tools fired correctly (award_mastery_points + show_next_card)

---

### Test 4: Uncertain/Questioning Tone

**Objective:** Pi should detect uncertainty and NOT award points for guessing

**Test Script - Card 4:**
```
1. Pi: "This brownie was split. What can you tell Pi about the two pieces?"
2. Tester: "They're... equal?" [questioning tone]
3. Pi: "You sound unsure - what are you thinking?"
4. Tester: "I don't know, maybe equal?"
```

**Expected Result:**
- ❌ NO POINTS awarded
- ✅ Pi detected uncertainty
- ✅ Pi moved to next card

**Pass Criteria:**
- Pi caught questioning tone (red flag)
- Pi attempted to clarify
- Pi didn't award points for guessing
- Pi moved on appropriately

---

### Test 5: Teaching Milestone - Basic Only

**Objective:** Pi awards basic points but NOT teaching points when application test fails

**Test Script - Card 13:**
```
1. Pi: "Pi thinks 1/6 is bigger than 1/3 because 6 > 3. Help!"
2. Tester: "1/3 is bigger"
3. Pi: "Why?" [challenge question]
4. Tester: "More pieces means smaller pieces" [explains]
5. Pi: "So would 1/10 be bigger or smaller than 1/6?" [application test]
6. Tester: "Um... bigger?" [WRONG application]
```

**Expected Result:**
- ✅ 50 POINTS awarded (basic only)
- ❌ NOT 150 points (teaching)
- ✅ Pi moved to next card

**Pass Criteria:**
- Pi went through Layer 2 (explanation)
- Pi went through Layer 3 (application)
- Pi detected failed application test
- Pi awarded partial credit (basic only)
- Teaching points withheld correctly

---

### Test 6: Teaching Milestone - Full Success

**Objective:** Pi awards full teaching points when all layers pass

**Test Script - Card 13:**
```
1. Pi: "Pi thinks 1/6 is bigger than 1/3. Help!"
2. Tester: "1/3 is bigger because there's fewer pieces so each piece is bigger" [complete explanation]
3. Pi: "Oh! So would 1/10 be bigger or smaller than 1/6?" [application]
4. Tester: "Smaller because 10 pieces is more than 6" [correct application]
```

**Expected Result:**
- ✅ 150 POINTS awarded (basic 50 + teaching 100)
- ✅ Celebrated highly
- ✅ Pi moved to next card

**Pass Criteria:**
- Pi verified explanation (Layer 2)
- Pi tested application (Layer 3)
- Pi awarded full teaching points
- Celebration matched point value

---

## Test Suite 2: Consistency Testing

### Test 7: Inter-Rater Reliability

**Objective:** Different Pi sessions judge same answers consistently

**Method:**
1. Record 5 student responses (text transcripts)
2. Test each response with 3 separate Pi sessions
3. Compare point awards

**Example Test Case:**
```
Card 1 - Response: "There's four cookies that are basically the same"
Expected: 30 points (said four, said same, "basically" shows natural language)
```

**Pass Criteria:**
- 90%+ agreement across 3 Pi instances
- Same responses get same points
- Point awards are consistent

---

## Test Suite 3: Natural Conversation Flow

### Test 8: Doesn't Feel Like Interrogation

**Objective:** Verification feels natural, not like a test

**Test Method:**
1. Complete full session with tester
2. Tester provides honest feedback

**Questions to Ask Tester:**
- "Did it feel like a conversation or a test?"
- "Did Pi's questions feel natural?"
- "Were you stressed or enjoying it?"
- "Would you want to do it again?"

**Pass Criteria:**
- Tester says "conversation" not "test"
- Tester felt engaged, not stressed
- Tester would repeat experience
- Flow felt natural despite verification

---

## Test Suite 4: Edge Cases

### Test 9: Rapid Progression

**Objective:** Highly capable student can move quickly without feeling slowed down

**Test Script:**
```
Complete all 8 cards with perfect answers
Give complete, confident responses immediately
Answer challenge questions quickly and correctly
```

**Expected Result:**
- ✅ All cards completed in 8-12 minutes
- ✅ Maximum points achieved
- ✅ Student doesn't feel held back
- ✅ Verification feels like engaged conversation

**Pass Criteria:**
- Fast progression possible with real understanding
- Challenge questions feel like interest, not barriers
- Session doesn't drag unnecessarily

---

### Test 10: Struggling Student

**Objective:** Student who doesn't know material can move on gracefully

**Test Script:**
```
Give incomplete/uncertain answers to all cards
Show confusion and uncertainty throughout
Can't answer challenge questions
```

**Expected Result:**
- ✅ Pi moves on after 2-3 attempts per card
- ✅ Minimal or no points awarded
- ✅ Pi remains encouraging throughout
- ✅ Student doesn't feel judged or stupid

**Pass Criteria:**
- Pi doesn't get stuck trying to extract answers
- Pi remains supportive despite low performance
- Session completes reasonably (~10-15 min)
- Student feels okay about not knowing

---

## Success Metrics

### Required Benchmarks

Before system is ready for real kids:

1. **Parroting Test**: 100% pass rate (0% false positives from parroting)
2. **Incomplete Answer Test**: 100% pass rate (doesn't award for partial)
3. **Correct Answer Test**: 100% pass rate (awards after proper verification)
4. **Teaching Milestone Test**: 100% pass rate (distinguishes basic vs teaching)
5. **Consistency Test**: 90%+ agreement across Pi instances
6. **Experience Test**: 80%+ of testers say "conversation" not "test"
7. **False Positive Rate**: <5% across all tests
8. **False Negative Rate**: <10% (some valid answers not recognized)

### Testing Schedule

**Week 1: Internal Testing**
- Run Tests 1-6 (3 times each)
- Document all failures
- Update prompts based on failures
- Retest until 100% pass rate

**Week 2: Real Kid Testing**
- Test with 3-5 kids (different ability levels)
- Record all sessions
- Have observer validate Pi's judgments
- Calculate false positive/negative rates
- Get kid feedback
- Iterate based on findings

---

## Debugging Checklist

If tests fail, check:

### System Prompt Issues
- [ ] Challenge questions included for each card?
- [ ] Red flags/green flags documented?
- [ ] Layer-by-layer verification explained?
- [ ] Application tests defined for teaching milestones?

### Tool Calling Issues
- [ ] Tool responses include proper ID?
- [ ] Tool responses sent back via sendToolResponse()?
- [ ] Points awarded match criteria?
- [ ] show_next_card() called after awarding?

### Conversation Flow Issues
- [ ] Challenge questions sound natural?
- [ ] Verification doesn't feel like interrogation?
- [ ] Pi matches student energy?
- [ ] Pacing appropriate (not too slow)?

---

## Test Execution Log Template

```
TEST: [Test Name]
DATE: [Date]
RUN: [1/2/3]

SETUP:
- Pi version: [timestamp/version]
- Card tested: [Card number]
- Tester: [Name/ID]

EXECUTION:
[Paste conversation transcript]

RESULT:
- Points awarded: [actual]
- Points expected: [expected]
- Match: [YES/NO]

OBSERVATIONS:
[What worked well]
[What didn't work]
[Specific failures]

PASS/FAIL: [Status]
```

---

## Next Steps After Testing

1. **Document patterns**: What types of responses fool Pi?
2. **Update prompts**: Add specific examples from failures
3. **Retest failures**: Verify fixes work
4. **Validate with kids**: Real student testing
5. **Iterate**: Continuous improvement based on data

---

## Quick Reference: Expected Behavior

### ✅ GOOD - Pi Should Do This
- Ask 1-2 challenge questions before awarding
- Detect parroting and ask for rephrasing
- Notice uncertain/questioning tone
- Move on gracefully after 2-3 attempts
- Keep conversational energy throughout
- Award points only after verification
- Test application for teaching milestones

### ❌ BAD - Pi Should NOT Do This
- Award points on first response
- Accept vague/incomplete answers
- Miss parroting or memorized responses
- Get stuck on one card repeatedly
- Sound judgmental or impatient
- Lead student to answer (funnel)
- Award teaching points without application test

---

## Emergency Rollback Plan

If verification system causes major issues:

1. **Document the problem** (what broke, logs, examples)
2. **Revert system prompt** to previous version (git)
3. **Disable verification layers** temporarily
4. **Fix identified issues** offline
5. **Retest thoroughly** before redeploying
6. **Deploy with monitoring** and be ready to rollback again

---

## Contact & Support

For testing questions or issues:
- Check debug panel for Pi's reasoning
- Review console logs for tool calling
- Compare against calibration examples in prompt
- Document unexpected behavior with full transcript

**Remember:** The goal is <5% false positive rate. Better to be slightly too strict than give points away for free.
