# Critical Pedagogy & Tracking Issues

## Issues Found

### 1. **GEMINI ISN'T SEEING THE PEDAGOGY INSTRUCTIONS** 🚨

**Problem:** The Gemini Live API config is set ONCE at connection time and NEVER UPDATES.

**Current Flow:**
```
1. Component mounts → systemPrompt = base prompt (no agent context)
2. Config is set with base prompt
3. User connects → Config is sent to Gemini (with base prompt only)
4. Lesson loads → systemPrompt updates with agent context
5. BUT: Config was already sent! Gemini never sees the updates!
```

**Result:** Gemini only sees the BASE prompt without:
- Current milestone info
- Mastery criteria
- Emotional state
- Misconception context
- **Most importantly: The pedagogy instructions are there BUT BURIED and NOT EMPHASIZED**

**Evidence:**
- File: `apps/tutor-app/components/demo/streaming-console/StreamingConsole.tsx:302`
- `useEffect([setConfig, systemPrompt])` - runs once, doesn't reconnect
- Gemini Live API doesn't support dynamic config updates after connection

### 2. **MILESTONE COMPLETIONS NOT LOGGED TO TEACHER PANEL** 🚨

**Problem:** PedagogyEngine emits milestone events but no one is listening!

**Current Flow:**
```
PedagogyEngine.completeMilestone()
  → emits 'milestone_completed' event
  → useLessonStore updates progress (✅ works)
  → Teacher Panel NOT notified (❌ missing)
```

**Evidence:**
- File: `apps/tutor-app/hooks/media/use-live-api.ts:366-384`
- Only listens to 'progress_update' event
- Doesn't listen to 'milestone_detected' or 'milestone_completed'
- Teacher Panel's `logMilestoneComplete()` is never called

### 3. **BASE PROMPT DOESN'T EMPHASIZE PEDAGOGY ENOUGH** ⚠️

**Problem:** The pedagogy instructions exist but are hidden in a long prompt.

**Current Prompt Structure:**
```
1. Personality (short)
2. Teaching Philosophy (short)
3. Teaching Methods (LONG - buried here)
   - Socratic Questioning
   - Scaffolding
   - Concrete Examples
   - Formative Assessment
   - **Wonder-First Pedagogy** ← BURIED!
4. Response Guidelines
5. Tool descriptions
```

**Result:** Gemini skims over the critical pedagogy section and defaults to:
- Yes/no questions (easier)
- Funneling (more direct)
- Math jargon (trained on math texts)

## Fixes Needed

### Fix 1: Emphasize Pedagogy at TOP of Prompt

**Move Wonder-First Pedagogy to BEGINNING**, make it BOLD and CRITICAL:

```markdown
# 🎯 CRITICAL PEDAGOGY RULES (FOLLOW THESE ABOVE ALL ELSE)

## Rule #1: NO YES/NO QUESTIONS
❌ NEVER ask: "Are these equal?" "Do you see...?" "Is this fair?"
✅ ALWAYS ask: "What do you notice?" "How would you feel?" "Why do you think that?"

## Rule #2: NO FUNNELING
❌ NEVER lead to specific answer: "Which piece is bigger?" "Should they be the same size?"
✅ ALWAYS open exploration: "What do you notice about the pieces?" "How would YOU solve this?"

## Rule #3: WONDER BEFORE MATH
❌ NEVER start with: "Ready to learn fractions?"
✅ ALWAYS start with: "What's your favorite cookie?" [WAIT] Then: "Well, Luna made a HUGE cookie..."

## Rule #4: KEEP IT SHORT (2-3 SENTENCES MAX)
❌ NEVER monologue multiple paragraphs
✅ ALWAYS: Say something brief → Ask question → STOP TALKING → WAIT

[Then rest of prompt...]
```

### Fix 2: Send Lesson Context as First Message (Not in Config)

**Problem:** Gemini Live API config can't be updated after connection.

**Solution:** Send lesson context as a regular message after connection:

```typescript
// After successful connection
client.sendTextMessage(JSON.stringify({
  type: "LESSON_CONTEXT",
  lesson: currentLesson,
  currentMilestone: currentMilestone,
  masteryCriteria: milestone.masteryCriteria,
  // This gets added to conversation history
}));

// Then on every student turn
client.sendTextMessage(JSON.stringify({
  type: "TURN_CONTEXT",
  emotional: emotionalState,
  misconceptions: recentMisconceptions,
  visionContext: canvasAnalysis,
}));
```

### Fix 3: Connect PedagogyEngine to Teacher Panel

**Add event listener in use-live-api.ts:**

```typescript
// Listen to PedagogyEngine events
useEffect(() => {
  const pedagogyEngine = orchestrator.getPedagogyEngine();
  const { logMilestoneStart, logMilestoneComplete, logMilestoneProgress } = useTeacherPanel.getState();
  
  const onMilestoneDetected = (milestone: Milestone, transcription: string) => {
    // Log that student is working on this milestone
    logMilestoneProgress(milestone.id, transcription, milestone.keywords || []);
  };
  
  const onMilestoneCompleted = (milestone: Milestone) => {
    // Log milestone completion to teacher panel
    logMilestoneComplete(
      milestone.id,
      `Student completed: ${milestone.title}`
    );
    console.log('[useLiveApi] ✅ Milestone completed and logged to teacher panel:', milestone.title);
  };
  
  pedagogyEngine.on('milestone_detected', onMilestoneDetected);
  pedagogyEngine.on('milestone_completed', onMilestoneCompleted);
  
  return () => {
    pedagogyEngine.off('milestone_detected', onMilestoneDetected);
    pedagogyEngine.off('milestone_completed', onMilestoneCompleted);
  };
}, [orchestrator]);
```

### Fix 4: Re-emphasize Pedagogy Every Few Turns

**Inject reminders into conversation:**

```typescript
// Every 5 turns, inject a reminder
if (turnNumber % 5 === 0) {
  client.sendTextMessage(`
REMINDER: Use OPEN questions (What do you notice?), NOT yes/no questions. 
Keep responses SHORT (2-3 sentences). Wonder before math.
  `);
}
```

## Implementation Priority

1. **IMMEDIATE (15 minutes):**
   - [ ] Fix 3: Connect PedagogyEngine events to Teacher Panel
   - [ ] Add logging to see what Gemini is receiving

2. **HIGH PRIORITY (30 minutes):**
   - [ ] Fix 1: Rewrite prompt with critical rules at top
   - [ ] Test with new prompt structure

3. **MEDIUM PRIORITY (1 hour):**
   - [ ] Fix 2: Send lesson context as messages instead of config
   - [ ] Fix 4: Add periodic pedagogy reminders

## Testing Checklist

After fixes:
- [ ] Gemini asks open questions (not yes/no)
- [ ] Gemini uses wonder hooks before math
- [ ] Gemini keeps responses short (2-3 sentences)
- [ ] Milestone completions appear in teacher panel
- [ ] Emotional state updates in teacher panel
- [ ] Misconceptions logged in teacher panel

## Files to Modify

1. `packages/agents/src/prompts/static-system-prompt.ts` - Rewrite prompt structure
2. `apps/tutor-app/hooks/media/use-live-api.ts` - Add PedagogyEngine event listeners
3. `apps/tutor-app/components/demo/streaming-console/StreamingConsole.tsx` - Send context as messages
4. `apps/tutor-app/services/PromptBuilder.ts` - Format context as JSON messages

---

**Bottom Line:** The pedagogy is THERE but Gemini isn't seeing it properly. We need to:
1. Make it impossible to miss (top of prompt, bold, explicit rules)
2. Send context dynamically (messages not config)
3. Connect milestone tracking to teacher panel (missing event listeners)
