# Simili Agent Architecture

## Overview

Simili uses a **parallel agent architecture** where multiple specialized AI agents work together to provide personalized, adaptive tutoring. The system analyzes student emotions, detects misconceptions, and adjusts teaching strategies in real-time.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Student Input                          │
│                  (Voice/Text/Canvas)                        │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                   AgentService                              │
│            (Orchestrator & Coordinator)                     │
└───────┬───────────┬───────────┬─────────────────────────────┘
        │           │           │
        ▼           ▼           ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│Emotional │  │Misconcep.│  │ Vision   │
│Classifier│  │Classifier│  │ Service  │
└────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │              │
     └─────────────┴──────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  SessionContext      │
        │  (Unified Insights)  │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │   PromptBuilder      │
        │ (Dynamic Prompts)    │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │    Gemini Live       │
        │  (Main AI Tutor)     │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  Teacher Panel       │
        │  (Real-time Stats)   │
        └──────────────────────┘
```

---

## Core Services

### 1. AgentService

**Location**: `apps/tutor-app/services/AgentService.ts`

**Purpose**: Orchestrates all specialized agents and manages parallel execution.

**Key Methods**:
```typescript
analyzeStudentInput(
  transcription: string,
  context: Partial<SessionContext>
): Promise<AgentInsights>

analyzeCanvasWork(
  canvasSnapshot: string,
  imageUrl?: string
): Promise<VisionInsights>

initializeWithLesson(lesson: LessonData): void
```

**Responsibilities**:
- Run agents in parallel for fast response times
- Aggregate insights from all agents
- Emit events for UI updates
- Handle errors gracefully

**Event System**:
```typescript
agentService.on('context:updated', (context) => {})
agentService.on('insights:ready', (insights) => {})
agentService.on('agents:started', () => {})
agentService.on('agents:completed', () => {})
agentService.on('agent:error', (agentName, error) => {})
```

---

### 2. EmotionalClassifier

**Location**: `packages/agents/src/subagents/EmotionalClassifier.ts`

**Purpose**: Analyzes student emotional state from conversation patterns.

**Detection Capabilities**:
- **Engagement Level** (0-1): How invested the student is
- **Frustration Level** (0-1): Signs of struggle or annoyance
- **Confusion Level** (0-1): Uncertainty indicators
- **Confidence Level** (0-1): Self-assurance in responses
- **Emotional State**: happy, excited, neutral, frustrated, confused, bored, tired

**Analysis Triggers**:
- Every student response
- Canvas interaction patterns
- Response timing and hesitation
- Word choice and tone

**Output**:
```typescript
{
  state: 'frustrated' | 'confused' | 'excited' | ...,
  engagementLevel: 0.7,
  frustrationLevel: 0.4,
  confusionLevel: 0.3,
  confidence: 0.6,
  reasoning: "Student is showing signs of...",
  recommendation: "Consider providing..."
}
```

---

### 3. MisconceptionClassifier

**Location**: `packages/agents/src/subagents/MisconceptionClassifier.ts`

**Purpose**: Identifies conceptual errors in student understanding.

**Detection Capabilities**:
- **Misconception Types**:
  - Part-whole confusion
  - Counting vs. partitioning
  - Size vs. number confusion
  - Equal areas vs. equal parts
  - Fraction notation errors
  
**Analysis Method**:
- Examines student responses
- Compares against known misconception patterns
- Tracks recurrence across attempts
- Suggests targeted interventions

**Output**:
```typescript
{
  detected: true,
  type: 'part-whole-confusion',
  severity: 'medium',
  evidence: "Student said 'we need 3 pieces'...",
  correctiveConcept: "Equal parts means same size...",
  intervention: "Show visual comparison...",
  resolved: false,
  confidence: 0.85
}
```

---

### 4. VisionService

**Location**: `apps/tutor-app/services/VisionService.ts`

**Purpose**: Analyzes student canvas drawings to assess understanding.

**Analysis Capabilities**:
- Shape recognition
- Partitioning accuracy
- Equal parts verification
- Drawing completeness
- Conceptual understanding from visual work

**Integration**:
```typescript
const visionInsights = await visionService.analyzeCanvas(
  canvasSnapshot,    // base64 image
  currentImageUrl,   // reference image
  milestoneContext   // what we're checking for
);
```

**Output**:
```typescript
{
  hasDrawing: true,
  shapes: ['circle', 'lines'],
  partitioning: 'attempted',
  equalParts: false,
  conceptualUnderstanding: 'developing',
  needsVoiceOver: true,
  suggestedPrompt: "Can you tell me about..."
}
```

---

### 5. PromptBuilder

**Location**: `apps/tutor-app/services/PromptBuilder.ts`

**Purpose**: Dynamically constructs system prompts with real-time context.

**Features**:
- Injects agent insights into system prompt
- Personalizes with student name
- Includes lesson progress
- Adds priority instructions based on context

**Structure**:
```typescript
PromptBuilder.buildSystemPrompt(sessionContext)

// Returns:
// 1. Base prompt (pedagogy + personality)
// 2. Real-time context:
//    - Lesson progress
//    - Emotional state
//    - Active misconceptions
//    - Vision insights
// 3. Priority instructions for next response
```

**Personalization**:
```typescript
PromptBuilder.setStudentName('Alex');
// All prompts will use "Alex" instead of "the student"
```

---

### 6. FillerService

**Location**: `apps/tutor-app/services/FillerService.ts`

**Purpose**: Provides natural conversational fillers while agents analyze.

**Filler Types**:
- **Acknowledgment**: "Mmm-hmm", "Okay", "I see"
- **Thinking**: "Let me think about that...", "Interesting..."
- **Encouraging**: "Good question!", "I'm glad you asked"

**Usage**:
```typescript
if (fillerService.shouldUseFiller()) {
  const filler = fillerService.getFiller();
  // Speak filler while agents process
}
```

**Timing**: Used when agent analysis takes >800ms to maintain conversation flow.

---

## Session Context

**Location**: `packages/agents/src/types.ts`

The `SessionContext` is the unified state that all agents contribute to:

```typescript
interface SessionContext {
  // Lesson state
  lesson: {
    currentMilestoneTitle: string;
    progress: string;
    attempts: number;
    timeOnMilestone: number;
    masteryCriteria: any;
  };
  
  // Agent insights
  emotional?: EmotionalContext;
  misconceptions?: MisconceptionContext[];
  vision?: VisionContext;
  
  // History
  conversationHistory: ConversationTurn[];
  lastStudentInput: string;
  lastAgentResponse: string;
}
```

---

## Integration with Gemini Live

### How Agents Enhance Gemini

1. **Before Gemini speaks**:
   - Agents analyze student input in parallel
   - Context is aggregated into SessionContext
   - PromptBuilder creates dynamic system prompt
   - Gemini receives enriched prompt with all insights

2. **Gemini's response**:
   - Uses agent insights to personalize response
   - Addresses detected misconceptions
   - Adapts to emotional state
   - References vision analysis

3. **After Gemini speaks**:
   - Teacher Panel updated with insights
   - Session context stored for next turn
   - Celebration triggers if milestones reached

### Prompt Injection Pattern

```typescript
// 1. Base prompt (static pedagogy)
const basePrompt = SIMILI_SYSTEM_PROMPT;

// 2. Real-time context (dynamic)
const context = agentService.getCurrentContext();

// 3. Combined prompt
const fullPrompt = PromptBuilder.buildSystemPrompt(context);

// 4. Sent to Gemini
geminiClient.updateSystemPrompt(fullPrompt);
```

---

## React Integration

### useAgentContext Hook

**Location**: `apps/tutor-app/hooks/useAgentContext.ts`

React hook that provides easy access to agent services:

```typescript
const {
  systemPrompt,          // Current dynamic prompt
  currentContext,        // Latest insights
  isAnalyzing,          // Are agents processing?
  analyzeTranscription, // Trigger analysis
  analyzeVision,        // Trigger vision analysis
  initializeLesson,     // Set up lesson context
  getShouldUseFiller,   // Check if filler needed
  getFiller,            // Get a filler phrase
  agentStats,           // Debug/monitoring
} = useAgentContext();
```

### Usage Example

```typescript
// In StreamingConsole.tsx
const { analyzeTranscription, currentContext, systemPrompt } = useAgentContext();

// When student speaks:
const onStudentSpeech = async (transcription: string) => {
  // Trigger parallel agent analysis
  const insights = await analyzeTranscription(transcription);
  
  // Agents update context automatically
  // PromptBuilder creates new system prompt
  // Gemini receives updated prompt
  
  // Send to Gemini with enriched context
  geminiClient.sendMessage(transcription);
};
```

---

## Teacher Panel Integration

The Teacher Panel displays real-time insights from the agent system:

**Location**: `apps/tutor-app/lib/teacher-panel-store.ts`

### Syncing Agent Insights

```typescript
// In StreamingConsole or useAgentContext
const { syncAgentInsights } = useTeacherPanel();

// After agent analysis
syncAgentInsights(
  currentContext.emotional,      // Emotional state
  currentContext.misconceptions, // Detected issues
  studentTranscription           // What student said
);
```

### What Gets Tracked

1. **Milestone Progress**: Completion, time spent, attempts
2. **Standards Coverage**: Which learning objectives are addressed
3. **Misconceptions**: Type, severity, status, interventions
4. **Emotional State**: Engagement, frustration, confusion levels

---

## Performance Considerations

### Parallel Execution

Agents run in parallel for fast response times:

```typescript
// BAD (Sequential - slow)
const emotional = await emotionalClassifier.analyze();
const misconception = await misconceptionClassifier.analyze();
const vision = await visionService.analyze();
// Total time: ~2.5s

// GOOD (Parallel - fast)
const [emotional, misconception, vision] = await Promise.all([
  emotionalClassifier.analyze(),
  misconceptionClassifier.analyze(),
  visionService.analyze()
]);
// Total time: ~800ms
```

### Caching

- Session context cached between turns
- Lesson data loaded once at initialization
- Vision analysis only on canvas changes

### Debouncing

- Canvas analysis debounced (500ms)
- Filler service prevents over-eagerness
- Agent calls throttled to prevent overload

---

## Error Handling

### Graceful Degradation

If an agent fails, the system continues:

```typescript
try {
  insights = await agent.analyze();
} catch (error) {
  console.error('[Agent] Failed:', error);
  // Use default/fallback insights
  insights = getDefaultInsights();
}
```

### Error Events

```typescript
agentService.on('agent:error', (agentName, error) => {
  console.error(`[${agentName}] Error:`, error);
  // Log to monitoring service
  // Continue with other agents
});
```

---

## Testing Agents

### Unit Testing

```typescript
describe('EmotionalClassifier', () => {
  it('detects frustration from repeated errors', async () => {
    const context = createTestContext({
      lastStudentInput: "I don't get it!",
      attempts: 5
    });
    
    const result = await classifier.analyze(context);
    
    expect(result.emotional.state).toBe('frustrated');
    expect(result.emotional.frustrationLevel).toBeGreaterThan(0.6);
  });
});
```

### Integration Testing

```typescript
describe('AgentService', () => {
  it('runs agents in parallel and aggregates results', async () => {
    const insights = await agentService.analyzeStudentInput(
      "I think we need 3 pieces",
      testContext
    );
    
    expect(insights.emotional).toBeDefined();
    expect(insights.misconception).toBeDefined();
    expect(insights.processingTime).toBeLessThan(1000);
  });
});
```

---

## Monitoring & Debugging

### Agent Stats

```typescript
const { agentStats } = useAgentContext();

console.log(agentStats);
// {
//   totalAnalyses: 42,
//   avgProcessingTime: 750,
//   fillersUsed: 3
// }
```

### Debug Logging

All agent services include detailed logging:

```bash
[AgentService] 🎯 Analyzing student input
[EmotionalClassifier] 😊 State: excited, engagement: 0.9
[MisconceptionClassifier] ❌ No misconception detected
[VisionService] 👁️ Canvas: circles with 4 equal parts
[AgentService] ✅ Analysis complete in 820ms
```

---

## Configuration

### Agent Settings

```typescript
// In packages/agents/src/config.ts
export const AGENT_CONFIG = {
  parallel: true,              // Run agents in parallel
  timeout: 5000,               // Max time per agent
  retryAttempts: 2,           // Retry on failure
  enableVision: true,         // Vision analysis on/off
  emotionalUpdateFrequency: 1 // Analyze every N turns
};
```

---

## Future Enhancements

- [ ] **Learning Style Adaptation**: Adjust teaching based on visual/auditory/kinesthetic preferences
- [ ] **Difficulty Adjustment**: Dynamic difficulty based on performance
- [ ] **Peer Comparison**: Anonymous benchmarking against age group
- [ ] **Parent Insights**: Weekly summary reports
- [ ] **Multi-modal Analysis**: Combine voice tone, timing, and content
- [ ] **Predictive Interventions**: Anticipate struggles before they happen
- [ ] **A/B Testing**: Test different pedagogical approaches

---

## Related Documentation

- [Gemini Live Setup](./GEMINI-LIVE-SETUP.md) - How to integrate with Gemini
- [Design System](./DESIGN-SYSTEM.md) - UI for Teacher Panel
- [Repository Setup](./REPOSITORY-SETUP.md) - Development environment
