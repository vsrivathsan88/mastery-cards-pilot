# Card Assessment State Machine

## Overview

Pi now follows an **explicit state machine** for each card assessment. This eliminates ambiguity about when to move to the next card.

## State Flow Diagram

```
CARD_START
    ↓ (Pi asks starting question)
OBSERVING
    ↓ (Student answers Q1)
PROBING
    ↓ (Student answers Q2)
JUDGING
    ├→ READY_TO_ADVANCE (mastery achieved ✅)
    ├→ FINAL_CHECK (unclear ❓)
    │     ↓ (Student answers final question)
    │   JUDGING (decide again)
    │     └→ READY_TO_ADVANCE
    └→ READY_TO_ADVANCE (stuck after 3-4 tries ❌)
```

## States Explained

### CARD_START
- **Triggered**: New card loaded
- **Pi must**: Ask the starting question for this card
- **Tools allowed**: None
- **Next state**: OBSERVING (after asking question)

### OBSERVING
- **Triggered**: Pi asked starting question
- **Pi must**: Wait for student's first answer
- **Tools allowed**: None
- **Next state**: PROBING (after hearing A1)

### PROBING
- **Triggered**: Student gave first answer (Q1+A1 = 1 exchange)
- **Pi must**: Ask follow-up question to probe deeper
  - "Tell me more about that"
  - "What makes you say that?"
  - "Why is that?"
- **Tools allowed**: None
- **Next state**: JUDGING (after hearing A2)

### JUDGING
- **Triggered**: Got explanation (Q1+A1+Q2+A2 = 2 exchanges)
- **Pi must**: Evaluate understanding against scorecard:
  - ✅ Exchanges: 2+
  - ✅ Understanding: Explained WHY/HOW
  - ✅ Reasoning: Shows concept grasp
  - ✅ Confidence: Not guessing
- **Tools allowed**: None (still evaluating)
- **Next states**:
  - READY_TO_ADVANCE if all ✅
  - FINAL_CHECK if partially ✅
  - Back to PROBING if need more info (only if < 3 exchanges)

### FINAL_CHECK
- **Triggered**: Understanding unclear after 2 exchanges
- **Pi must**: Ask ONE final YES/NO question
  - "If one piece was bigger, would they still be equal?"
  - "Would this work if the pieces were different sizes?"
- **Tools allowed**: None
- **Next state**: JUDGING (after hearing answer, then decide)

### READY_TO_ADVANCE
- **Triggered**: One of:
  - Mastery achieved (passed all scorecard checks)
  - Student stuck (3-4 exchanges, no understanding)
- **Pi must**: Call tools NOW
  - If mastery: `award_mastery_points()` → `show_next_card()`
  - If stuck: `show_next_card()` only
- **Tools allowed**: ✅ YES - ONLY state where tools work
- **Next state**: CARD_START (for next card)

## Tool Call Protection

Both tools check the state machine:

```typescript
// award_mastery_points
if (!canCallTools || state !== READY_TO_ADVANCE) {
  return ERROR: "Cannot award points yet. Complete assessment first."
}

// show_next_card
if (!canCallTools || state !== READY_TO_ADVANCE) {
  return ERROR: "Cannot advance yet. Complete assessment first."
}
```

**Result**: Pi CANNOT skip cards or award points prematurely.

## State Context Sent to Pi

Every card includes state information:

```
╔═══════════════════════════════════════════════════════════════╗
║  🚦 CURRENT STATE: PROBING
╚═══════════════════════════════════════════════════════════════╝

🚦 STATE: PROBING → Ask follow-up: "Tell me more" (Exchange count: 1)

**Progress Tracking:**
- Exchange Count: 1 / 2-3 required
- Asked Starting Question: ✅
- Probed Deeper: ❌ <- Do this next
- Used Final Check: ❌
- Can Call Tools: ❌ NO

**What You Should Do Next:**
Ask a follow-up question to go deeper.

⚠️ DO NOT CALL TOOLS YET - You must reach READY_TO_ADVANCE first!
```

## Benefits

### 1. Eliminates Ambiguity
- **Before**: "2-3 exchanges" (vague range, Pi guesses)
- **After**: Explicit state with clear next action

### 2. Prevents Premature Tool Calls
- **Before**: Pi could call `show_next_card()` after 1 exchange
- **After**: Tool calls blocked until state = READY_TO_ADVANCE

### 3. Tracks Progress Explicitly
- Pi sees: "Exchange count: 1 / 2-3 required"
- Knows exactly where it is in the flow

### 4. Clear Error Messages
If Pi tries to skip:
```
ERROR: Cannot advance yet. You are in state PROBING. 
Got first answer (Q1+A1), need to probe deeper.
```

## Console Logs

Watch for these messages:

```
[StateMachine] → OBSERVING
[StateMachine] → PROBING (exchanges: 1)
[StateMachine] → JUDGING (exchanges: 2)
[StateMachine] → READY_TO_ADVANCE (mastery achieved)
[StateMachine] ↺ RESET to CARD_START

[App] ⚠️ show_next_card blocked: State machine not ready
[App] ⚠️ award_mastery_points blocked: State machine not ready
```

## Testing the State Machine

### Test 1: Normal Flow
1. Start session
2. Pi asks Q1 (OBSERVING)
3. You answer → Pi asks Q2 (PROBING)
4. You explain → Pi evaluates (JUDGING)
5. Pi awards points → advances (READY_TO_ADVANCE)

**Expected**: Console shows clean state transitions

### Test 2: Try to Skip
1. Pi asks Q1
2. You give vague answer
3. Watch: Pi should NOT call tools
4. Console: "⚠️ show_next_card blocked: State machine not ready"

**Expected**: Pi stays on card, asks follow-up

### Test 3: Unclear Case
1. Normal flow through Q1+Q2
2. Your answers are partial/unclear
3. Pi should enter FINAL_CHECK
4. Asks one YES/NO question
5. Then decides based on answer

**Expected**: Console shows JUDGING → FINAL_CHECK → JUDGING → READY_TO_ADVANCE

## Implementation Files

- `src/lib/state/card-state-machine.ts` - State machine logic
- `src/App.tsx` - Integration with tool handlers
- `src/lib/prompts/mission-first-prompt.ts` - Prompt references states

## Future Enhancements

Possible additions:
1. **Timeout transitions**: Auto-advance if stuck too long
2. **State persistence**: Save state to localStorage
3. **State visualization**: Show state diagram in UI
4. **Analytics**: Track which states cause problems
