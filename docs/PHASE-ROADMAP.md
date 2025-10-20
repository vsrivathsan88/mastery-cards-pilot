# Simili Phase Roadmap

## Phase Overview

```
Phase 1 ✅ → Phase 2 ✅ → Phase 3 (Current) → Phase 4 → Phase 5
```

---

## **Phase 1: Foundation** ✅ COMPLETE

**Goal**: Monorepo structure, basic UI, lesson system

**Deliverables**:
- ✅ Monorepo setup (pnpm workspaces)
- ✅ Basic React app with TypeScript
- ✅ Lesson data structure
- ✅ Simple UI components

**Status**: Committed (`50dcaa5`)

---

## **Phase 2: Gemini Live API Integration** ✅ COMPLETE

**Goal**: Real-time voice conversation with Gemini

**Deliverables**:
- ✅ Gemini Live API connection
- ✅ Real-time audio streaming (input/output)
- ✅ Transcription support
- ✅ WebRTC-based communication
- ✅ Basic system prompts

**Status**: Working connection, stable audio

---

## **Phase 3: Multi-Agent Tutoring System** 🔄 IN PROGRESS

### **Phase 3A: Infrastructure** ✅ COMPLETE
**Goal**: Build foundation for multi-agent coordination

**Deliverables**:
- ✅ ContextManager (buffer subagent results)
- ✅ FillerManager (conversational fillers)
- ✅ Enhanced AgentOrchestrator
- ✅ Static system prompt (SIMILI_SYSTEM_PROMPT)
- ✅ JSON context formatters

---

### **Phase 3B: Backend Migration** ✅ COMPLETE
**Goal**: Secure backend for child data protection + LangGraph integration

**Deliverables**:
- ✅ Express.js API server (`apps/api-server`)
- ✅ Security-first architecture (anonymous sessions, PII filtering)
- ✅ LangGraph multi-agent orchestration
- ✅ MisconceptionClassifier (first subagent)
- ✅ Browser-safe package split
- ✅ Vite proxy configuration

---

### **Phase 3C: Code Cleanup** ✅ COMPLETE
**Goal**: Remove old dynamic prompt logic

**Deliverables**:
- ✅ Removed system prompt replacement on milestone transitions
- ✅ Deprecated old `generateSystemPrompt()` method
- ✅ Verified only intentional `setSystemPrompt()` usage remains
- ✅ Clean architecture: static prompt + JSON messages

---

### **Phase 3D: Subagent Integration** ⏳ NEXT
**Goal**: Wire backend analysis to frontend

**Planned Deliverables**:
- [ ] Connect frontend to backend `/api/analyze` endpoint
- [ ] Send transcripts to MisconceptionClassifier
- [ ] Receive misconception feedback
- [ ] Send feedback to agent via `formatMisconceptionFeedback()`
- [ ] Test full round-trip: student speaks → backend analyzes → agent responds

---

### **Phase 3E: Emotional State Monitoring** 📋 PLANNED
**Goal**: Detect and respond to student emotional state

**Planned Deliverables**:
- [ ] EmotionalClassifier subagent (backend)
- [ ] Detect: frustrated, confused, excited, bored
- [ ] Send updates via `formatEmotionalFeedback()`
- [ ] Agent adjusts teaching style based on state

---

### **Phase 3F: Vision Agent** 📋 PLANNED
**Goal**: Analyze student's canvas work

**Planned Deliverables**:
- [ ] Canvas snapshot capture (every 15s)
- [ ] VisionAgent subagent (uses Gemini Flash vision)
- [ ] Detect: correct drawings, incomplete work, misconceptions in visual form
- [ ] Send visual feedback to Main Agent

---

### **Phase 3G: Milestone Verification** 📋 PLANNED
**Goal**: Automated mastery detection

**Planned Deliverables**:
- [ ] MilestoneVerifier subagent
- [ ] Hybrid approach: keyword detection + LLM verification
- [ ] Automatic milestone progression
- [ ] Confidence scoring

---

## **Phase 4: Polish & Production** 📋 PLANNED

**Goal**: Make it production-ready

**Planned Deliverables**:
- [ ] Error handling and retry logic
- [ ] Loading states and UI polish
- [ ] Session persistence (Redis)
- [ ] Logging and monitoring
- [ ] Performance optimization
- [ ] Mobile responsiveness
- [ ] Accessibility (WCAG 2.1)

---

## **Phase 5: Content & Scale** 📋 PLANNED

**Goal**: Expand lesson library, deploy

**Planned Deliverables**:
- [ ] Complete 3.NF.A.2 lesson (fractions on number line)
- [ ] Complete 3.NF.A.3 lesson (equivalent fractions)
- [ ] Lesson authoring tools
- [ ] Teacher dashboard
- [ ] Deployment (Vercel + Railway/Render)
- [ ] Analytics and insights

---

## Current Status

### **You are here**: Phase 3C → 3D transition

```
Phase 1 ✅ ━━━━━━━━━━━━━━━━━ Complete
Phase 2 ✅ ━━━━━━━━━━━━━━━━━ Complete
Phase 3A ✅ ━━━━━━━━━━━━━━━━ Complete
Phase 3B ✅ ━━━━━━━━━━━━━━━━ Complete
Phase 3C ✅ ━━━━━━━━━━━━━━━━ Complete (just finished!)
Phase 3D ⏳ ░░░░░░░░░░░░░░░░░ NEXT
Phase 3E 📋 ░░░░░░░░░░░░░░░░░ Planned
Phase 3F 📋 ░░░░░░░░░░░░░░░░░ Planned
Phase 3G 📋 ░░░░░░░░░░░░░░░░░ Planned
Phase 4  📋 ░░░░░░░░░░░░░░░░░ Planned
Phase 5  📋 ░░░░░░░░░░░░░░░░░ Planned
```

---

## Phase 3D Preview: Subagent Integration

### **What We'll Build**:

1. **Frontend → Backend Connection**
   ```typescript
   // Send transcription to backend for analysis
   const analysis = await apiClient.analyze({
     sessionId: 'anon_123',
     transcript: "I divided the chocolate into two pieces",
     lessonContext: currentLesson
   });
   ```

2. **Backend Analysis** (already built!)
   ```typescript
   // LangGraph orchestrates MisconceptionClassifier
   const result = await multiAgentGraph.invoke({
     transcript: "...",
     lessonId: "fractions-3-nf-a-1"
   });
   ```

3. **Feedback to Agent**
   ```typescript
   // Send misconception feedback as JSON message
   if (analysis.misconceptions.length > 0) {
     const feedback = formatMisconceptionFeedback(analysis.misconceptions);
     client.sendTextMessage(feedback);
   }
   ```

---

## Want to:
- **A)** Move to Phase 3D (wire backend analysis)?
- **B)** Test Phase 3C changes first?
- **C)** Jump to a different phase?
- **D)** Something else?

Let me know! 🚀
