# 🔬 Teacher Panel Agent Monitoring - Setup Complete

**Date:** 2025-10-28  
**Status:** ✅ Panels Built | ⚠️ Data Wiring Needed  

---

## 🎯 What's Built

### **2 New Debug Panels Added to Teacher Panel:**

1. **🤖 Agent Activity Panel**
   - Location: `apps/tutor-app/components/teacher-panel/AgentActivityView.tsx`
   - Shows: All 3 agents (Misconception, Emotional, Prerequisite) running in parallel
   - Displays: Agent status (running/complete/error), duration, results
   - Stats: Total runs, average duration per agent
   - Timeline: Last 20 agent activities

2. **🎯 Prerequisite Detection Panel**
   - Location: `apps/tutor-app/components/teacher-panel/PrerequisiteDetectionView.tsx`
   - Shows: Prerequisite gaps detected by invisible assessment
   - Displays: Gap status (detected/met/unclear), confidence, evidence
   - Alerts: Critical gaps that need intervention
   - Summary: Total checked, gaps found, resolved

3. **Updated Teacher Panel Container**
   - Location: `apps/tutor-app/components/teacher-panel/TeacherPanelContainer.tsx`
   - Added: 2 new collapsible sections (Agent Activity, Prerequisite Detection)
   - Styled: Green "LIVE" and "INVISIBLE" badges

---

## ✅ What Works Now

### **Frontend:**
- ✅ Panels render and collapse/expand
- ✅ UI shows empty states when no data
- ✅ Styling matches teacher panel design system
- ✅ TypeScript compiles without errors

### **Backend (Agent System):**
- ✅ PrerequisiteDetector agent exists
- ✅ 3-way parallel execution (Misconception + Emotional + Prerequisite)
- ✅ ContextManager tracks prerequisite gaps
- ✅ Agent graph runs analysis on student responses

---

## ⚠️ What Needs Wiring (To See Real Data)

### **Problem:**
The panels exist but show **empty data** because:
1. Agent events aren't being emitted from backend → frontend
2. No state store to capture and hold agent activity
3. Teacher panel components receive empty arrays

### **Solution (3 Steps):**

#### **Step 1: Emit Agent Events from Backend** (30 min)

Add event emitters to `MultiAgentGraph` and `ContextManager`:

```typescript
// In packages/agents/src/graph/agent-graph.ts

import { EventEmitter } from 'events';

export class MultiAgentGraph extends EventEmitter {
  // ... existing code
  
  private async analyzeMisconception(state: AgentStateType) {
    const startTime = Date.now();
    
    // Emit START event
    this.emit('agent:start', {
      turn: state.turnNumber,
      agent: 'misconception',
      timestamp: startTime,
    });
    
    // ... existing analysis code
    
    const duration = Date.now() - startTime;
    
    // Emit COMPLETE event
    this.emit('agent:complete', {
      turn: state.turnNumber,
      agent: 'misconception',
      timestamp: Date.now(),
      duration,
      result,
    });
    
    return { misconception: result };
  }
  
  // Same for analyzeEmotional and analyzePrerequisite
}

// In packages/agents/src/context/ContextManager.ts

export class ContextManager extends EventEmitter {
  public addPrerequisiteGap(gap: PrerequisiteGapContext): void {
    gap.turn = this.turnNumber;
    this.sessionContext.prerequisiteGaps.push(gap);
    
    // Emit event
    this.emit('prerequisite:gap', gap);
    
    // ... rest of code
  }
}
```

#### **Step 2: Create Agent Activity Store** (20 min)

Create new Zustand store to capture and hold agent events:

```typescript
// In apps/tutor-app/lib/agent-activity-store.ts

import { create } from 'zustand';

interface AgentActivity {
  turn: number;
  timestamp: number;
  agent: 'misconception' | 'emotional' | 'prerequisite';
  status: 'running' | 'complete' | 'error';
  duration?: number;
  result?: any;
}

interface PrerequisiteGap {
  turn: number;
  timestamp: number;
  prerequisiteId: string;
  concept: string;
  status: 'GAP_DETECTED' | 'PREREQUISITE_MET' | 'UNCLEAR';
  confidence: number;
  evidence?: string;
  // ... other fields
}

interface AgentActivityStore {
  activities: AgentActivity[];
  prerequisiteGaps: PrerequisiteGap[];
  
  addActivity: (activity: AgentActivity) => void;
  addPrerequisiteGap: (gap: PrerequisiteGap) => void;
  
  clearActivities: () => void;
  clearPrerequisiteGaps: () => void;
}

export const useAgentActivityStore = create<AgentActivityStore>((set) => ({
  activities: [],
  prerequisiteGaps: [],
  
  addActivity: (activity) => set((state) => ({
    activities: [...state.activities, activity]
  })),
  
  addPrerequisiteGap: (gap) => set((state) => ({
    prerequisiteGaps: [...state.prerequisiteGaps, gap]
  })),
  
  clearActivities: () => set({ activities: [] }),
  clearPrerequisiteGaps: () => set({ prerequisiteGaps: [] }),
}));
```

#### **Step 3: Wire Events → Store → UI** (20 min)

Listen to agent events and populate store:

```typescript
// In apps/tutor-app/hooks/media/use-live-api.ts (or wherever orchestrator is initialized)

import { useAgentActivityStore } from '@/lib/agent-activity-store';

// When initializing orchestrator
const orchestrator = new AgentOrchestrator(geminiApiKey);
const multiAgentGraph = orchestrator.getMultiAgentGraph();

if (multiAgentGraph) {
  // Listen to agent events
  multiAgentGraph.on('agent:start', (data) => {
    useAgentActivityStore.getState().addActivity({
      ...data,
      status: 'running',
    });
  });
  
  multiAgentGraph.on('agent:complete', (data) => {
    useAgentActivityStore.getState().addActivity({
      ...data,
      status: 'complete',
    });
  });
  
  // Listen to prerequisite gap events
  const contextManager = orchestrator.getContextManager();
  contextManager.on('prerequisite:gap', (gap) => {
    useAgentActivityStore.getState().addPrerequisiteGap({
      ...gap,
      timestamp: Date.now(),
    });
  });
}
```

Then update the Teacher Panel components to use the store:

```typescript
// In apps/tutor-app/components/teacher-panel/TeacherPanelContainer.tsx

import { useAgentActivityStore } from '@/lib/agent-activity-store';

export function TeacherPanelContainer() {
  const activities = useAgentActivityStore(state => state.activities);
  const prerequisiteGaps = useAgentActivityStore(state => state.prerequisiteGaps);
  
  // ... rest of code
  
  <AgentActivityView activities={activities} />
  <PrerequisiteDetectionView gaps={prerequisiteGaps} isActive={true} />
}
```

---

## 🧪 How to Test Once Wired

### **Test 1: Agent Activity Monitoring**

1. Start a lesson (Equal Parts Challenge)
2. Open Teacher Panel → Agent Activity section
3. Student speaks → Should see 3 agents fire simultaneously:
   - 🧠 Misconception Classifier (~200ms)
   - 😊 Emotional Classifier (~250ms)
   - 🎯 Prerequisite Detector (~300ms)
4. Check stats: Should show run count and average duration

### **Test 2: Prerequisite Gap Detection**

1. Start Equal Parts Challenge lesson
2. Open Teacher Panel → Prerequisite Detection section
3. **Wonder Hook:** "What do you notice about Luna's cookie pieces?"
4. **Student (GAP):** "I don't know" or "They're the same"
5. **Expected:**
   - ⚠️ Critical Gap Alert appears
   - Gap entry shows:
     - Concept: "Equal vs. Different"
     - Status: GAP_DETECTED
     - Confidence: ~85%
     - Evidence: Student's quote
     - Next Action: TEACH_PREREQUISITE
6. **Main Agent Response:** Should deliver micro-lesson
7. **After Micro-Lesson:** Gap marked as "Resolved ✅"

### **Test 3: Prerequisite Met (Happy Path)**

1. Same wonder hook
2. **Student (MET):** "They're different!" or "One is bigger"
3. **Expected:**
   - ✅ Status shows "Prerequisite Met"
   - Green badge
   - Next Action: CONTINUE_LESSON
4. **Main Agent:** Continues with lesson (no micro-lesson)

---

## 📊 What You'll See (Once Wired)

### **Agent Activity Panel:**

```
🤖 Agent Activity             [LIVE]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ 3 Agents Running

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AGENT STATS:
┌─────────────────┐
│ 🧠 Misconception │
│ 15 runs • ~230ms │
└─────────────────┘

┌─────────────────┐
│ 😊 Emotional     │
│ 15 runs • ~260ms │
└─────────────────┘

┌─────────────────┐
│ 🎯 Prerequisite  │
│  7 runs • ~310ms │
└─────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TIMELINE:
• 🎯 prerequisite    Turn 7    just now
  Status: complete • ⏱️ 285ms
  Checked 2 prerequisites | 1 gap

• 😊 emotional       Turn 7    2s ago
  Status: complete • ⏱️ 245ms
  State: engaged | Engagement: 85%

• 🧠 misconception   Turn 7    2s ago
  Status: complete • ⏱️ 220ms
  ✓ No misconceptions detected
```

### **Prerequisite Detection Panel:**

```
🎯 Prerequisite Detection      [INVISIBLE ASSESSMENT]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 Checking Prerequisites  ⚠️ 1 Critical Gap

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUMMARY:
Total Checked: 7
Gaps Found: 1
Resolved: 0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GAP LOG:

⚠️ Equal vs. Different                Turn 7
┌─────────────────────────────────┐
│ GAP DETECTED • 87% confident    │
│ critical                        │
├─────────────────────────────────┤
│ Evidence: "I don't know"        │
├─────────────────────────────────┤
│ Type: UNKNOWN_CONCEPT           │
│ Recommendation: Pause and teach │
│ comparison (same vs different)  │
│ before continuing with equal    │
│ parts concept                   │
├─────────────────────────────────┤
│ Next Action: TEACH_PREREQUISITE │
└─────────────────────────────────┘

✅ Counting 1-10                      Turn 5
┌─────────────────────────────────┐
│ PREREQUISITE MET • 92% confident│
├─────────────────────────────────┤
│ Evidence: "three!"              │
├─────────────────────────────────┤
│ Next Action: CONTINUE_LESSON    │
└─────────────────────────────────┘
```

---

## 🎯 Summary

### **✅ Done:**
- Frontend panels built and styled
- Backend agents compile and run
- Architecture is correct

### **⚠️ Next (1-2 hours):**
- Add EventEmitter to agent graph (30 min)
- Create agent activity store (20 min)
- Wire events → store → UI (20 min)
- Test with real student interactions (20 min)

### **🚀 Outcome:**
You'll be able to watch in real-time:
- All 3 agents running in parallel
- Prerequisite gaps being detected invisibly
- Student responses triggering agent analysis
- Micro-lessons being deployed for gaps
- Gaps being resolved after intervention

**This gives you X-ray vision into the pedagogy system!** 🔬

---

**Ready to wire it up?** We can do the 3 steps above in ~1 hour total.

