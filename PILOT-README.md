# Outcome Tracking Pilot Study

## Overview

This branch (`feat/outcome-tracking-pilot`) contains experimental tools and infrastructure for a pilot study to measure **math outcomes** (procedural competence and correct answers) alongside conceptual understanding.

**Key Innovation:** Measure outcomes through embedded formative assessment without disrupting the wonder-first, Socratic pedagogy.

---

## What's New

### 1. **Pilot Tools** (4 new function calls for Pi)

**Canvas Interaction:**
- `draw_on_canvas` - Pi can draw shapes/lines on student canvas to demonstrate or guide
- `add_canvas_label` - Pi can add text annotations (fractions, questions, celebrations)

**Engagement:**
- `show_emoji_reaction` - Pi can send visual emoji reactions (🎉, 💡, 🤔, etc.)
- `verify_student_work` - Pi prompts student self-assessment and verification

### 2. **Outcome Evidence Tracking**

Data structures to collect:
- **Procedural accuracy**: Did they partition/identify/create correctly?
- **Talk-out-loud metrics**: How often do they explain their thinking?
- **Transfer indicators**: Can they apply to novel problems?
- **Correctness assessment**: Correct, partial, or incorrect

### 3. **Enhanced Teacher Panel** (Coming Soon)

- Outcomes Summary view showing procedural vs conceptual mastery
- Talk-out-loud engagement scores
- Transfer task performance
- Per-student outcome reports

---

## Quick Start

### Enable Pilot Mode

```bash
# In apps/tutor-app/.env
VITE_PILOT_MODE=true

# Or copy from template
cp apps/tutor-app/.env.template apps/tutor-app/.env
# Then edit and set VITE_PILOT_MODE=true
```

### Run Development Server

```bash
pnpm dev
```

### Verify Pilot Tools Loaded

Check the console for:
```
🧪 PILOT MODE ENABLED
Features: canvasDrawingTool, canvasLabelTool, emojiReactionTool, ...
[state] 🧪 Pilot mode: Adding pilot tools to lesson tools
```

### Test Tools

1. Start a lesson
2. Watch the console for Pi's tool calls:
   - `🎨 PILOT: Drawing on canvas`
   - `🏷️ PILOT: Adding canvas label`
   - `😊 PILOT: Showing emoji reaction`
   - `✅ PILOT: Verification prompt`

---

## Implementation Status

### ✅ Phase 1: Foundation (COMPLETE)
- [x] Pilot branch created
- [x] Feature flag system (`pilot-config.ts`)
- [x] Data types (`pilot-types.ts`)
- [x] Tool definitions (`pilot-tools.ts`)

### ✅ Phase 2: Tool Integration (COMPLETE)
- [x] Tools registered in state management
- [x] Tool call handlers in `use-live-api.ts`
- [x] Logging and acknowledgment

### 🚧 Phase 3: Full Implementation (IN PROGRESS)
- [ ] Canvas manipulation service (draw shapes)
- [ ] Canvas text/label rendering
- [ ] Emoji display component
- [ ] Canvas highlight effect

### 📋 Phase 4: Outcome Tracking (TODO)
- [ ] `OutcomeTrackerService` for evidence collection
- [ ] Evidence aggregation from canvas + transcripts
- [ ] Outcome analysis and scoring
- [ ] Teacher panel outcomes view

### 📋 Phase 5: Assessment Checkpoints (TODO)
- [ ] Verification question prompts
- [ ] Transfer task injection
- [ ] Novel problem generation
- [ ] Rubric-based assessment

---

## File Structure

```
apps/tutor-app/
├── lib/
│   ├── pilot-config.ts              # Feature flags
│   ├── pilot-types.ts               # Data structures
│   ├── tools/
│   │   ├── lesson-tools.ts          # Existing tools
│   │   └── pilot-tools.ts           # NEW: Pilot tools
│   └── state.ts                     # Modified: Conditional tool loading
├── hooks/media/
│   └── use-live-api.ts              # Modified: Tool call handlers
└── services/
    └── OutcomeTrackerService.ts     # TODO: Evidence collection

packages/agents/src/
└── pedagogy/
    └── OutcomeCollector.ts          # TODO: Outcome aggregation
```

---

## How It Works

### Tool Call Flow

1. **Gemini decides** to use a pilot tool (e.g., `draw_on_canvas`)
2. **Tool call received** in `use-live-api.ts`
3. **Handler executes**:
   - Logs to console: `🎨 PILOT: Drawing on canvas`
   - Logs to teacher panel: "Pi drew line: Showing equal thirds"
   - TODO: Actually draws on canvas via service
4. **Response sent** back to Gemini: `{ success: true, message: "..." }`
5. **Pi continues** conversation based on tool execution

### Pilot Mode Toggle

```typescript
// pilot-config.ts
export const PILOT_MODE = {
  enabled: import.meta.env.VITE_PILOT_MODE === 'true',
  features: {
    canvasDrawingTool: true,
    emojiReactionTool: true,
    outcomeTracking: true,
    ...
  }
};

// state.ts
const getLessonTools = () => {
  if (PILOT_MODE.enabled) {
    return [...lessonTools, ...pilotTools]; // Add pilot tools
  }
  return lessonTools; // Standard tools only
};
```

---

## Testing Strategy

### Manual Testing (Now)

1. Enable pilot mode
2. Start a lesson
3. Monitor console for tool calls
4. Verify tools appear in transcript/logs

### 10-Kid Pilot (Coming Soon)

**Data to collect:**
- Session transcripts
- Canvas snapshots at checkpoints
- Tool usage frequency
- Outcome evidence per milestone
- Talk-out-loud metrics

**Analysis questions:**
- Do students with high talk-out-loud engagement have better procedural accuracy?
- Does conceptual mastery predict procedural success?
- Which tools correlate with better outcomes?

---

## Development Workflow

### Adding a New Tool

1. Define in `pilot-tools.ts`:
   ```typescript
   {
     name: 'my_new_tool',
     description: '...',
     parameters: { ... },
     isEnabled: true,
   }
   ```

2. Add handler in `use-live-api.ts`:
   ```typescript
   else if (fc.name === 'my_new_tool') {
     // Implementation
     functionResponses.push({ ... });
   }
   ```

3. Test with pilot mode enabled

### Disabling a Tool

```typescript
// pilot-config.ts
features: {
  myNewTool: false, // Disable
}
```

### Branching Strategy

- **Main branch**: Stable, production-ready
- **feat/outcome-tracking-pilot**: Experimental pilot features
- Cherry-pick validated changes back to main

---

## Next Steps

### Immediate (This Week)
1. ✅ Tool definitions and handlers
2. Implement canvas drawing service
3. Implement emoji display
4. Test with one lesson flow

### Pilot Prep (Next Week)
1. Outcome tracker service
2. Teacher panel outcomes view
3. Assessment checkpoints
4. Export functionality

### Pilot Study (Week After)
1. Test with 10 students
2. Collect outcome data
3. Analyze correlations
4. Generate reports for consultants

---

## Questions?

See:
- `pilot-config.ts` - Feature flags
- `pilot-types.ts` - Data structures
- `pilot-tools.ts` - Tool definitions
- `use-live-api.ts` - Tool handlers (search for "PILOT TOOLS")

---

## Important Notes

⚠️ **API Keys:** Never commit `.env` file (it's git-ignored)

✅ **Non-Breaking:** Pilot mode is opt-in, doesn't affect main codebase

🧪 **Experimental:** This is research code - expect TODOs and iteration
