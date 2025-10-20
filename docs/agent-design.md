# Simili Multi-Agent Architecture Design

**Status**: Design Phase - Awaiting approval before implementation  
**Date**: October 16, 2024  
**Context**: Phase 3 implementation - Moving from single-agent to multi-agent architecture

---

## Overview

Simili uses a **hub-and-spoke multi-agent architecture** where a main conversational agent (Gemini Live) orchestrates the dialogue while specialized sub-agents provide real-time analysis and context.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│         MAIN AGENT (Gemini Live)                │
│  - Drives dialogue                               │
│  - Has full context from all sources             │
│  - Consumes: vision + misconception +            │
│    emotional + lesson state                      │
└─────────────────────────────────────────────────┘
           ▲         ▲         ▲         ▲
           │         │         │         │
    ┌──────┘    ┌────┘    ┌────┘    └─────┐
    │           │         │               │
┌───┴───┐  ┌───┴────┐  ┌─┴──────┐  ┌────┴─────┐
│Vision │  │Misconcep│ │Emotional│  │Milestone │
│Agent  │  │Classifier│ │Classifier│ │Detector  │
│       │  │(Haiku/  │  │(Haiku/  │  │(TBD)     │
│(TBD)  │  │Gemini)  │  │Gemini)  │  │          │
└───────┘  └─────────┘  └─────────┘  └──────────┘
```

---

## Agent Roles

### 1. Main Agent (Gemini Live)
**Purpose**: Drive the teaching dialogue  
**Model**: Gemini Live (voice-in, voice-out)  
**Responsibilities**:
- Conduct conversational teaching
- Ask probing questions
- Provide scaffolding
- Adapt based on context from sub-agents
- Make pedagogical decisions in real-time

**Context Sources**:
- Lesson structure and current milestone
- Computer vision interpretation (from Vision Agent)
- Misconception analysis (from Misconception Classifier)
- Emotional state (from Emotional Classifier)
- Milestone mastery assessment (from Milestone Detector)

---

### 2. Vision Agent
**Purpose**: Interpret student's visual work (drawings, manipulatives, gestures)  
**Model**: TBD (Gemini Vision or GPT-4V)  
**Trigger Options**:
- **Option A**: Tool call from Main Agent ("capture_screen", "analyze_drawing")
- **Option B**: Continuous background capture every N seconds --> THIS SHOULD BE OUR OPTION (SNAPSHOTS OF THE IMAGE + CANVAS)
- **Option C**: Event-triggered when student says "look at this"

**Output Format**:
```json
{
  "timestamp": 1234567890,
  "description": "Student drew two unequal rectangles",
  "interpretation": "Attempting to show halves, but proportions incorrect",
  "suggestion": "Guide toward measuring equality",
  "confidence": 0.85
}
If confidence is <0.7>, then ask student to voice over their visual work.
```

**Status**: Deferred to later phase

---

### 3. Misconception Classifier
**Purpose**: Detect mathematical misconceptions in student utterances  
**Model**: Claude Haiku 4.5 or Gemini 2.5 Flash (text-only)  
**Trigger**: Runs async on every final user transcription  
**Latency Budget**: 100-200ms

**Input**:
- Student transcription
- Current lesson context
- Known misconceptions for this lesson

**Output Format**:
```json
{
  "misconception_detected": true,
  "misconception_type": "any_two_pieces_are_halves",
  "confidence": 0.87,
  "evidence": "Student said 'these two pieces are halves' about unequal parts",
  "intervention_suggestion": "Probe about equal size requirement",
  "corrective_concept": "Half means TWO EQUAL parts"
}
```
POSSIBILITY: Maybe we have the main agent sense something is off (like incorrect answer) and use some fillers to hold time till we get the misconception classified?

**Priority**: Phase 3B (first sub-agent to implement)

---

### 4. Emotional State Classifier
**Purpose**: Monitor student engagement, frustration, and confusion  
**Model**: Claude Haiku 4.5 or Gemini 2.5 Flash (text-only)  
**Trigger**: Runs async on every final user transcription + audio features (future)  
**Latency Budget**: 100-200ms

**Input**:
- Recent transcription history (last 3-5 turns)
- Response latency patterns
- Current milestone attempt count
- Audio features (tone, pace, pauses) - future enhancement

**Output Format**:
```json
{
  "current_state": "engaged_slight_confusion",
  "engagement_level": 0.75,
  "frustration_level": 0.20,
  "confusion_indicators": ["long pause", "repeated false starts"],
  "trend": "stable",
  "recommendation": "Continue current pace, offer hint if next attempt fails"
}
```
POSSIBILITY: Could Gemini Live support this live through system prompt or too much to handle in one agent? I believe gemini-flash-2.5-audio can also handle emotional tonality in response?


**Priority**: Phase 3C (second sub-agent to implement)

---

### 5. Milestone Detector
**Purpose**: Assess whether student has achieved mastery of current milestone  
**Approach Options**: --> @AGENT: WHAT DO YOU RECOMMEND? I THINK OPTION C?
- **Option A**: Main Agent self-monitors ("I think they got it")
- **Option B**: Dedicated sub-agent analyzes transcripts
- **Option C**: Hybrid - lightweight keyword detection + deep verification

**Recommended**: Option C (Hybrid)
1. Fast keyword matching triggers initial detection (current implementation)
2. Sub-agent verifies quality of understanding
3. Checks for:
   - Verbal articulation of concept
   - Absence of misconceptions
   - Application to examples

**Output Format**:
```json
{
  "milestone_id": "milestone-1",
  "mastery_achieved": true,
  "confidence": 0.92,
  "evidence": [
    "Student articulated 'half means two equal parts'",
    "Applied concept to pizza example",
    "No misconceptions detected"
  ],
  "recommendation": "Advance to next milestone"
}
```

**Priority**: Phase 3D (optional enhancement)

---

## Critical Design Decisions

### Decision 1: Context Injection Timing

**Options**:
- **A**: Buffer subagent results and inject into NEXT turn's system prompt
- **B**: Interrupt current turn and update context mid-flight  
- **C**: Wait for all subagents before Main Agent responds

**Recommendation**: **Option A** - Buffer for next turn --> @AGENT: I agree, but maybe Gemini Live (main agent) has some buffer things to say (like as an immediate response).
- Keeps latency low (Main Agent doesn't wait)
- Good enough for pedagogy (1-turn delay acceptable)
- Simpler state management

**Trade-off**: Main Agent won't have latest context in current response, but will have it for next turn.

---

### Decision 2: State Management & Source of Truth

**Proposed Architecture**:
- **AgentOrchestrator** maintains master session state
- Sub-agents are stateless (take input, return analysis)
- Main Agent context is derived from Orchestrator state
- **ContextManager** buffers and formats subagent outputs for injection

**State Flow**:
```
User speaks → Transcription
    ↓
AgentOrchestrator dispatches to sub-agents (parallel)
    ↓
Sub-agents analyze → return structured output
    ↓
ContextManager buffers results
    ↓
Next turn: Main Agent receives updated context in system prompt
```

---

### Decision 3: System Prompt Structure for Main Agent

**Enhanced Prompt Format** (includes subagent context):

```markdown
# SYSTEM INSTRUCTION

You are Simili, a warm and encouraging AI math tutor...

[Personality and teaching approach - same as current]

---

# CURRENT CONTEXT (Updated each turn)

## Lesson State
Current Milestone: "Identify One Half"
Progress: 1/3 milestones complete
Attempts on current milestone: 2
Time on current milestone: 3m 24s

## Recent Misconceptions Detected
[From Misconception Classifier]
- Turn 5: "Student thinks any two pieces are halves" (confidence: 0.87)
  → Intervention: Probe about equal size requirement
  → Corrective concept: Half means TWO EQUAL parts
- Turn 8: Misconception resolved ✓

## Emotional State Analysis
[From Emotional Classifier]
- Current State: Engaged, slight confusion
- Engagement: 75% | Frustration: 20% | Confusion: 30%
- Trend: Engagement stable, frustration low
- Recommendation: Continue current pace, offer hint if next attempt fails

## Visual Context
[From Vision Agent - when available]
- Last capture: 12 seconds ago
- Student drew: Two unequal rectangles
- Interpretation: Attempting to show halves, but proportions are off
- Suggestion: Guide toward measuring equality

## Mastery Criteria for Current Milestone
- Student must articulate: "Half means two equal parts"
- Must apply concept to at least one example
- No active misconceptions about size requirements

---

# YOUR GOAL FOR THIS TURN

Based on the context above, guide the student toward understanding that 
half means TWO EQUAL parts. Use probing questions. If misconceptions are 
detected, gently correct them. If student shows frustration, provide 
encouragement and simpler examples.
```

---

### Decision 4: Latency Budget & Parallel Execution

**Target Total Response Time**: < 1.5-2.0 seconds

**Component Breakdown**:
- Gemini Live baseline: ~500-800ms
- Misconception Classifier: ~100-200ms (parallel)
- Emotional Classifier: ~100-200ms (parallel)
- Vision Agent: ~300-500ms (when triggered, parallel)

**Total with parallel execution**: ~800-1200ms ✅ Acceptable  
**If sequential**: 1000-1700ms ⚠️ Pushing limit

**Requirement**: Sub-agents must execute in parallel, not sequentially.

**Implementation**:
```typescript
// Parallel execution
const [misconception, emotional] = await Promise.all([
  misconceptionClassifier.analyze(transcription, lessonContext),
  emotionalClassifier.analyze(recentHistory, metrics)
]);
```

---

## Implementation Plan

### Phase 3A: Foundation
**Goal**: Prepare infrastructure for multi-agent system

**Tasks**:
1. ✅ Fix language issue (already done - `en-US` set)
2. Create **ContextManager** class
   - Buffers subagent outputs
   - Formats context for Main Agent prompt
   - Manages context updates per turn
3. Restructure Main Agent prompt template
   - Add placeholder sections for subagent outputs
   - Maintain conversational tone
4. Add session state tracking in AgentOrchestrator
   - Track attempt counts, timing, milestone history

**Deliverable**: Infrastructure ready for subagents

---

### Phase 3B: First Subagent (Misconception Classifier)
**Goal**: Detect and surface mathematical misconceptions

**Tasks**:
1. Create `MisconceptionClassifier` class
2. Choose model: Claude Haiku 4.5 or Gemini 2.5 Flash
3. Define prompt for classifier:
   - Input: transcription + lesson context + known misconceptions
   - Output: structured JSON
4. Wire into AgentOrchestrator
   - Trigger on every final transcription
   - Run async, don't block Main Agent
5. Feed results into ContextManager
6. Update Main Agent prompt with misconception context
7. Test: Speak misconceptions, verify detection and context injection

**Deliverable**: Working misconception detection feeding into Main Agent

---

### Phase 3C: Second Subagent (Emotional Classifier)
**Goal**: Monitor student emotional state and engagement

**Tasks**:
1. Create `EmotionalClassifier` class
2. Use same model as Misconception Classifier (consistency)
3. Define prompt for classifier:
   - Input: recent history + metrics + attempt counts
   - Output: structured JSON with state + recommendations
4. Wire into AgentOrchestrator (parallel with Misconception)
5. Feed results into ContextManager
6. Update Main Agent prompt with emotional context
7. Test: Simulate frustration patterns, verify detection

**Deliverable**: Emotional state monitoring active

---

### Phase 3D: Enhanced Milestone Detection (Optional)
**Goal**: Deep verification of milestone mastery

**Tasks**:
1. Create `MilestoneVerifier` subagent
2. Triggered when keyword detection fires
3. Analyzes:
   - Quality of verbal explanation
   - Absence of misconceptions
   - Application to examples
4. Confirms or rejects milestone completion
5. If rejected, provides reason to Main Agent

**Deliverable**: Higher confidence milestone completions

---

### Phase 3E: Vision Integration (Deferred)
**Goal**: Add computer vision interpretation

**Tasks**:
1. Add screen capture tool call to Main Agent
2. Create `VisionAgent` class
3. Choose model: Gemini Vision or GPT-4V
4. Wire into context flow
5. Test with student drawings

**Deliverable**: Main Agent can "see" student's work

---

## Open Questions (Awaiting Decisions)

### 1. Context Injection Timing
**Question**: Buffer for next turn (A) or wait for subagents (C)?  
**Recommendation**: Option A (buffer for next turn)  
**Decision**: _Pending_

### 2. Milestone Detection Approach
**Question**: Hybrid (keywords + verification) or pure subagent?  
**Recommendation**: Hybrid (Option C)  
**Decision**: _Pending_

### 3. Model Choice for Classifiers
**Question**: Claude Haiku 4.5 or Gemini 2.5 Flash?  
**Considerations**:
- Cost per call
- Latency
- API availability
- Output quality

**Decision**: _Pending_

### 4. Vision Implementation Priority
**Question**: Include in Phase 3 or defer to Phase 4?  
**Recommendation**: Defer - prove text-based agents first  
**Decision**: _Pending_

### 5. Implementation Order
**Question**: Implement all subagents or start with just Misconception Classifier?  
**Recommendation**: Start with Misconception Classifier, validate, then add others  
**Decision**: _Pending_

---

## Success Metrics

We'll know this architecture works when:

✅ **Phase 3A Complete**:
- ContextManager buffers and formats subagent outputs
- Main Agent prompt includes structured context sections
- System still works as before (no regression)

✅ **Phase 3B Complete**:
- Misconception Classifier detects test cases accurately
- Main Agent responses adapt based on detected misconceptions
- Latency stays under 1.5s

✅ **Phase 3C Complete**:
- Emotional state tracked across conversation
- Main Agent modulates teaching based on emotional signals
- Can detect frustration and engagement patterns

✅ **Phase 3D Complete**:
- Milestone completions are higher quality
- False positives reduced
- System provides clear evidence for mastery claims

---

## Risk Mitigation

### Risk 1: Increased Latency
**Mitigation**:
- Parallel execution of subagents
- Async/non-blocking architecture
- Monitor latency metrics in real-time
- Fall back to Main Agent only if subagent calls fail

### Risk 2: Context Window Bloat
**Mitigation**:
- Limit context history (last N turns only)
- Summarize older context
- Prune irrelevant details
- Monitor token usage

### Risk 3: Subagent Hallucination/Errors
**Mitigation**:
- Include confidence scores
- Main Agent can override subagent suggestions
- Log all subagent outputs for debugging
- Add validation layer for structured outputs

### Risk 4: Cost Escalation
**Mitigation**:
- Use cheaper models (Haiku/Flash, not Opus/Pro)
- Only trigger subagents on final transcriptions
- Cache repeated analyses
- Monitor costs per session

---

## Next Steps

1. **Review this document** with stakeholders
2. **Make decisions** on open questions
3. **Start with Phase 3A**: Build ContextManager infrastructure
4. **Implement Phase 3B**: Misconception Classifier
5. **Test thoroughly** before adding more subagents
6. **Iterate** based on real usage data

---

## Appendix: Alternative Architectures Considered

### Alt 1: Single Agent with Structured Output
**Description**: Main Agent does everything, uses JSON mode  
**Rejected because**: Too much cognitive load on one agent, slower responses

### Alt 2: Sequential Pipeline
**Description**: Subagents run in sequence, each enhancing context  
**Rejected because**: Latency compounds, too slow for real-time

### Alt 3: Consensus Voting
**Description**: Multiple agents vote on decisions  
**Rejected because**: Overkill for pedagogy, adds latency

---

**End of Document**
