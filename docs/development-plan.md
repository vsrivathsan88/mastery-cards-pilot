# Simili Monorepo Development Plan (Pragmatic Edition)

**Context**: Solo developer with AI assistance (Cursor/Claude Code), limited budget, need to validate architecture quickly.

**Philosophy**: Ship working prototype → validate architecture → add sophistication. Not the other way around.

**Current Status**: ✅ Phase 0 complete! Working Gemini Live integration exists in `native-audio-function-call-sandbox/`. This will serve as the foundation for the monorepo structure.

---

## Phase 0: Reality Check ✅ COMPLETE

**Status**: Working Gemini Live integration exists in `native-audio-function-call-sandbox/`

**What we have**:
- Vite + React app with Gemini Live WebSocket integration
- Working audio capture from microphone
- Real-time audio streaming to Gemini
- Transcription and audio response playback
- Function calling support
- Built with: React 19, @google/genai, eventemitter3, zustand

**Validation**: ✅ Gemini responds to voice input successfully

**Next step**: Use this as the foundation for the monorepo structure.

---

## 🎯 START HERE: Phase 1: Minimal Viable Monorepo (6-8 hours)

**Goal**: Get monorepo structure working with 3 packages and 1 app. Nothing fancy.

### Tasks

**1.1 Repository Setup** (1 hour)
```bash
# Initialize monorepo
pnpm init
mkdir -p packages/shared packages/core-engine packages/agents apps/tutor-app
```

**What to create**:
- Root `package.json` with workspaces
- `pnpm-workspace.yaml`
- Root `tsconfig.json`
- `.gitignore`

**AI prompt**: "Set up a pnpm monorepo with workspaces for packages/shared, packages/core-engine, packages/agents, and apps/tutor-app. Use TypeScript strict mode."

**1.2 Shared Package** (1 hour)
- Create basic TypeScript types (Event, State, AudioChunk, etc.)
- Export from `index.ts`
- Add package.json

**AI prompt**: "Create packages/shared with TypeScript types for: Event (with type and payload), SessionState, AudioChunk, LessonData. Export all from index.ts"

**1.3 Core Engine Package** (2-3 hours)
- Extract Gemini Live code from `native-audio-function-call-sandbox/`
- Wrap in class: `GeminiClient` 
- Add basic event emitter
- **Keep it simple** - no fancy state management yet
- Preserve existing functionality: audio capture, WebSocket management, function calling

**AI prompt**: "Create packages/core-engine with GeminiClient class that extracts the Gemini Live WebSocket code from native-audio-function-call-sandbox. It should have connect(), disconnect(), sendAudio(), and emit 'transcription' and 'response' events. Keep the existing function calling support."

**1.4 Agents Package Stub** (1 hour)
- Create `AgentOrchestrator` class
- Subscribe to core-engine events
- For now, just log events (no logic yet)

**AI prompt**: "Create packages/agents with AgentOrchestrator that subscribes to core-engine events and logs them. No pedagogy logic yet, just event wiring."

**1.5 Tutor App** (2 hours)
- Move `native-audio-function-call-sandbox/` to `apps/tutor-app/`
- Update package.json to import @simili/core-engine and @simili/agents
- Refactor existing Gemini Live code to use new core-engine package
- Keep existing UI (it already has connection, audio visualizer, transcription display)
- Wire up: use AgentOrchestrator from agents package

**AI prompt**: "Refactor the existing native-audio-function-call-sandbox app into apps/tutor-app. Extract Gemini Live logic to use @simili/core-engine package while keeping the existing UI components. Update imports to use new monorepo packages."

**Milestone checkpoint**: 
✅ Can you speak and see your words transcribed?
✅ Does Gemini respond with audio?
✅ Do packages import each other correctly?

**If NO**: Debug before proceeding. Get help if stuck >2 hours.

---

## Phase 2: Add Real Logic (8-10 hours)

**Goal**: Make it actually teach something. One simple lesson.

### Tasks

**2.1 Simple Lesson Structure** (1 hour)
- Create ONE lesson as JSON (fractions chocolate bar)
- Define schema: objectives, milestones, progression
- Load from `packages/lessons`

**AI prompt**: "Create a simple lesson JSON for teaching 1/2 using a chocolate bar. Include: learning objectives, 3 milestones (identify half, explain reasoning, apply to new scenario), and visual asset paths."

**2.2 Pedagogy Logic** (3-4 hours)
- Implement `PedagogyEngine` in agents package
- Load lesson, track current milestone
- Detect milestone completion from transcript (simple keyword matching for now)
- Emit `milestone_detected` event

**AI prompt**: "Implement PedagogyEngine in packages/agents that loads a lesson, tracks current milestone, and detects when student says keywords like 'one half' or 'equal parts'. Emit milestone_detected event."

**2.3 System Prompt Management** (2 hours)
- Create `PromptManager` that loads YAML templates
- Inject lesson context into prompt
- Send to Gemini at session start

**AI prompt**: "Create PromptManager in packages/agents that loads a YAML prompt template, injects current lesson context and milestone, and returns formatted system prompt for Gemini."

**2.4 UI Updates** (2 hours)
- Show current lesson
- Display milestone progress
- Visual celebration on milestone completion
- Show lesson image

**AI prompt**: "Update tutor-app to display current lesson name, progress indicator for milestones, and celebrate with animation when milestone is detected."

**Milestone checkpoint**:
✅ Can you complete a lesson milestone by speaking?
✅ Does the system know when you've completed it?
✅ Does the UI update appropriately?

**If YES**: You have a working proof-of-concept! Celebrate, then decide: keep building or validate with users first?

---

## Phase 3: Essential Instrumentation (6-8 hours)

**Goal**: Add observability so you can actually improve the pedagogy.

### Tasks

**3.1 Event Logging** (2 hours)
- Implement event logger in shared
- Write all events to console (structured JSON)
- Add timestamps, session IDs

**AI prompt**: "Create EventLogger in packages/shared that logs all events as structured JSON with timestamps and session IDs. Store logs in memory array."

**3.2 Session State Snapshots** (2 hours)
- Capture full state at key moments (milestone detected, lesson complete)
- Serialize to JSON
- Store in localStorage for now (Supabase later)

**AI prompt**: "Implement StateManager in packages/core-engine that captures state snapshots and stores them in localStorage. Include: session ID, timestamp, state blob."

**3.3 Basic Metrics** (2 hours)
- Measure latency: audio sent → transcription → response
- Count: milestones per session, time per milestone
- Display in UI (dev mode)

**AI prompt**: "Add metrics tracking to core-engine: measure latency from audio capture to response playback. Display metrics in tutor-app dev panel."

**3.4 Session Replay Viewer** (2 hours)
- Simple page that loads a session from localStorage
- Shows events timeline
- Can replay state changes

**AI prompt**: "Create a simple session replay viewer in tutor-app that loads event logs from localStorage and displays them as a timeline."

**Milestone checkpoint**:
✅ Can you see latency numbers?
✅ Can you replay a session to see what happened?
✅ Can you identify when students struggle?

---

## Phase 4: Content & Reporting (8-10 hours)

**Goal**: Add more lessons and basic teacher reporting.

### Tasks

**4.1 Lesson CMS (Simple Version)** (4 hours)
- Admin page to create/edit lessons
- JSON editor with validation
- Upload images to Supabase Storage
- Save lessons to Supabase

**AI prompt**: "Create a simple lesson editor in admin-dashboard with form fields for lesson data and JSON preview. Integrate with Supabase to save lessons."

**4.2 Socio-Emotional Tracking** (2-3 hours)
- Simple frustration detector (repeated attempts on same milestone)
- Engagement tracker (response latency, active participation)
- Emit `emotional_state_change` events

**AI prompt**: "Add EmotionalMonitor to packages/agents that detects frustration (3+ failed attempts on same milestone) and low engagement (long silences). Emit emotional_state_change events."

**4.3 Teacher Reports** (2-3 hours)
- Generate summary: milestones completed, struggles, emotional state
- Show in admin dashboard
- Export as PDF or JSON

**AI prompt**: "Create ReportGenerator in packages/agents that analyzes session events and produces a teacher report showing: milestones completed, areas of struggle, emotional states observed."

**Milestone checkpoint**:
✅ Can teachers create new lessons without code?
✅ Can teachers see how students are doing?
✅ Can you identify patterns across students?

---

## Phase 5: Polish & Scalability (10-12 hours)

**Goal**: Make it production-ready.

### Tasks

**5.1 Supabase Full Integration** (3 hours)
- Move from localStorage to Supabase for all persistence
- Set up proper schema (sessions, events, lessons, users)
- Implement repositories pattern

**5.2 Off-Topic Detection** (2 hours)
- Classify utterances as on-topic vs off-topic
- Allow brief off-topic (social connection)
- Gentle redirect back to lesson

**5.3 Error Handling** (2 hours)
- Graceful WebSocket disconnection recovery
- Audio device failure handling
- Network interruption resilience

**5.4 Testing** (3 hours)
- Write unit tests for core logic (pedagogy, milestones)
- Integration test for event flows
- E2E test for one complete lesson

**5.5 Documentation** (2 hours)
- Write README for each package
- Document key architectural decisions (ADRs)
- Create setup guide

---

## What's Explicitly DEFERRED

These are good ideas but NOT part of MVP:

❌ **Turborepo** - Use plain pnpm workspaces first, add Turborepo when build times hurt
❌ **Comprehensive CI/CD** - Run tests locally, add GitHub Actions later
❌ **80% test coverage** - Cover critical paths, expand later
❌ **Storybook** - Build components in-app first, extract to Storybook later
❌ **Visual regression testing** - Manual QA is fine for MVP
❌ **Telemetry export** - Local logs are fine, add external analytics later
❌ **TLDraw integration** - Add if lesson design demands it
❌ **Version control for lessons** - Git is your version control initially
❌ **A2A multi-agent** - Single agent is plenty for MVP
❌ **DSPy integration** - Validate basic prompts work first

---

## Decision Points & Off-Ramps

**After Phase 0**: ✅ Complete
- Gemini integration is working
- Audio quality is acceptable
- Latency is reasonable

**After Phase 1**: 
- **Stop if**: Refactoring to monorepo breaks existing functionality
- **Stop if**: Package imports become too complex or fragile
- **Validate**: Ensure all existing features still work after restructuring

**After Phase 2**:
- **Stop if**: Pedagogy logic too complex, unclear how to detect learning
- **Validate**: Show to a teacher, get feedback on lesson design

**After Phase 3**:
- **Stop if**: Instrumentation shows fundamental issues (latency, detection accuracy)
- **Consider**: Hiring UX researcher to validate pedagogy approach

**After Phase 4**:
- **Stop if**: Teachers can't create lessons easily, reporting isn't actionable
- **Validate**: Run pilot with 5-10 students

---

## Time Estimates

**Optimistic** (experienced developer, no blockers):
- Phase 0: ✅ Complete (saved 2 hours)
- Phase 1: 6 hours
- Phase 2: 8 hours
- Phase 3: 6 hours
- Phase 4: 8 hours
- Phase 5: 10 hours
- **Total: 38 hours remaining**

**Realistic** (solo with AI assistance, normal blockers):
- Phase 0: ✅ Complete (saved 3 hours)
- Phase 1: 10 hours
- Phase 2: 12 hours
- Phase 3: 8 hours
- Phase 4: 12 hours
- Phase 5: 15 hours
- **Total: 57 hours remaining**

**Conservative** (learning as you go, significant debugging):
- Phase 0: ✅ Complete (saved 4 hours)
- Phase 1: 15 hours
- Phase 2: 18 hours
- Phase 3: 12 hours
- Phase 4: 18 hours
- Phase 5: 20 hours
- **Total: 83 hours remaining**

---

## Using AI Tools Effectively

### Cursor/Claude Code Workflow

**For each task**:
1. **Context**: Share project brief + current phase + specific task
2. **Request**: "Generate [component] that does [specific thing]"
3. **Validate**: Run it, test it, read the code
4. **Iterate**: "This breaks when X, fix by Y"
5. **Document**: Ask AI to write README/comments

**Example prompt**:
```
I'm building a voice AI math tutor using React + Gemini Live.
I'm in Phase 1 of this plan: [paste Phase 1]
I need to create packages/core-engine with a GeminiClient class.

Requirements:
- Connect to Gemini Live WebSocket
- Handle audio capture from browser microphone
- Stream audio to Gemini
- Emit 'transcription' and 'response' events
- Graceful error handling

Here's my Phase 0 working code: [paste]

Create the core-engine package structure and GeminiClient class.
```

### When AI Gets Stuck

**Pattern matching**:
- **"Module not found"** → Check package.json dependencies, pnpm install
- **"Type errors"** → Ask AI to fix with proper types
- **"Runtime errors"** → Share error stack trace, ask for diagnosis
- **"Works in one package, breaks when imported"** → Check tsconfig paths

**Escalation**:
- If stuck >1 hour on same issue → Search GitHub issues, Stack Overflow
- If stuck >2 hours → Post on Discord/Slack communities
- If stuck >4 hours → Consider hiring help for that specific blocker

---

## Success Metrics

You'll know this is working when:

✅ **Current**: Gemini Live responds to voice (Phase 0 complete)
🎯 **Week 1**: Monorepo builds, all packages work together, existing features preserved
🎯 **Week 2**: One complete lesson works end-to-end
🎯 **Week 3**: Can see what students struggle with
🎯 **Week 4**: Teachers can create lessons without you
🎯 **Week 6**: Pilot with 5 students yields actionable insights

---

## Final Reality Check

**This is still a lot of work** (38-83 hours remaining). With Phase 0 complete, you've already validated the hardest technical risk. If budget is <$500 total and you value your time at $50/hour, you're investing $1900-4150 of opportunity cost.

**Consider**:
- **Hire for Phase 1 only** (~$800-1200) → Gives you solid foundation
- **You do Phases 2-4** with AI assistance → Saves money, you learn
- **Decide on Phase 5** based on Phase 4 results

**Alternative path** (even simpler):
- Skip monorepo entirely for now
- Build all Phase 2 features directly in `native-audio-function-call-sandbox/`
- Prove pedagogy works first
- Refactor to monorepo only if you need modularity (multiple apps, shared packages)

**Recommendation**: Since Gemini Live is working, you could validate the tutoring approach in the existing app first, then refactor if successful. The best architecture is the one that helps you learn what actually works. Don't let perfect structure prevent good-enough validation.