# Teacher Panel Week 3: Agent Integration Guide

## Status: Week 2 Complete ✅

**What's Working:**
- ✅ Data models (StandardsCoverage, MasteryMilestoneLog, MisconceptionLog)
- ✅ Zustand store (useTeacherPanel with all actions)
- ✅ UI components (Standards, Milestones, Misconceptions views)
- ✅ Minimize/expand functionality
- ✅ Export (JSON/CSV)
- ✅ Session starts when lesson loads
- ✅ Panel displays at bottom of CozyWorkspace

**What's Next: Week 3 - Real-Time Data Integration**

---

## Week 3 Tasks

### 1. Connect Misconception Logging

**Where:** `packages/agents/src/subagents/MisconceptionClassifier.ts`

**What to Add:**
```typescript
import { useTeacherPanel } from 'apps/tutor-app/lib/teacher-panel-store';

// In MisconceptionClassifier.classify() method:
if (detectedMisconception) {
  // Log to Teacher Panel
  useTeacherPanel.getState().logMisconception({
    misconceptionType: detectedMisconception.type,
    severity: detectedMisconception.severity,
    description: detectedMisconception.description,
    studentSaid: transcription,
    trigger: context.lastPiMessage || '',
    status: 'detected',
    milestoneId: context.currentMilestone?.id,
    relatedObjectives: detectedMisconception.affectedObjectives || [],
  });
}
```

**Testing:**
- Say something wrong during lesson
- Check Teacher Panel → Misconceptions tab
- Should see entry with student quote

---

### 2. Connect Milestone Logging

**Where:** `packages/agents/src/subagents/PedagogyEngine.ts`

**Milestone Start:**
```typescript
// When milestone starts:
useTeacherPanel.getState().logMilestoneStart(
  milestone.id,
  milestone.title
);
```

**Milestone Progress:**
```typescript
// When student responds:
useTeacherPanel.getState().logMilestoneProgress(
  milestone.id,
  studentResponse,
  detectedConcepts  // Array of concept strings
);
```

**Milestone Complete:**
```typescript
// When milestone completes:
useTeacherPanel.getState().logMilestoneComplete(
  milestone.id,
  evidenceOfMastery  // Student's final response showing understanding
);
```

**Testing:**
- Complete a milestone
- Check Teacher Panel → Milestones tab
- Should see timeline entry with timestamp, evidence

---

### 3. Standards Coverage Calculation

**Where:** Create `apps/tutor-app/lib/standards-calculator.ts`

**Logic:**
```typescript
import { LessonData } from '@simili/shared';
import { StandardsCoverage, ObjectiveCoverage } from './teacher-panel-types';

export function calculateStandardsCoverage(
  lesson: LessonData,
  completedMilestones: string[]
): StandardsCoverage[] {
  const coverage: StandardsCoverage[] = [];
  
  // For each standard in the lesson
  lesson.standards.forEach(standard => {
    const objectives: ObjectiveCoverage[] = lesson.objectives.map((obj, i) => {
      // Map objectives to milestones
      const relevantMilestones = getMilestonesForObjective(lesson, i);
      const completed = relevantMilestones.filter(m => 
        completedMilestones.includes(m)
      );
      
      let status: ObjectiveCoverage['status'];
      if (completed.length === 0) status = 'not-started';
      else if (completed.length === relevantMilestones.length) status = 'mastered';
      else status = 'in-progress';
      
      return {
        id: `objective-${i}`,
        description: obj,
        status,
        milestonesCompleted: completed,
      };
    });
    
    const mastered = objectives.filter(o => o.status === 'mastered').length;
    const percentComplete = Math.round((mastered / objectives.length) * 100);
    
    coverage.push({
      standardCode: standard.code,
      standardDescription: standard.description,
      framework: standard.framework,
      percentComplete,
      objectives,
    });
  });
  
  return coverage;
}

// Helper: Map objectives to milestone IDs
function getMilestonesForObjective(lesson: LessonData, objectiveIndex: number): string[] {
  // Implementation depends on lesson structure
  // For Equal Parts Challenge:
  // Objective 0 (partition) → Act 2a, 2b, 2c
  // Objective 1 (equal=size) → Act 1, 2checkpoint
  // Objective 2 (language) → Act 3a
  // Objective 3 (notation) → Act 3b, 3c
  // Objective 4 (reasoning) → Act 4a, 4b
  
  // This mapping should be in lesson JSON or derived from milestone expectedConcepts
  return [];  // TODO: Implement mapping logic
}
```

**When to Update:**
```typescript
// In PedagogyEngine, after milestone completes:
const completedMilestones = getCompletedMilestones();
const coverage = calculateStandardsCoverage(currentLesson, completedMilestones);

coverage.forEach(c => {
  useTeacherPanel.getState().updateStandardsCoverage(c);
});
```

**Testing:**
- Complete several milestones
- Check Teacher Panel → Standards tab
- Should see progress bars updating

---

### 4. Misconception Resolution Tracking

**Where:** When Pi addresses a misconception

**In Orchestrator or PedagogyEngine:**
```typescript
// After Pi responds to misconception:
if (misconceptionWasAddressed) {
  useTeacherPanel.getState().updateMisconceptionStatus(
    misconceptionId,
    'addressed',
    piResponse
  );
}

// After student shows corrected understanding:
if (studentShowsCorrectUnderstanding) {
  useTeacherPanel.getState().updateMisconceptionStatus(
    misconceptionId,
    'resolved',
    studentCorrectResponse
  );
}
```

**Testing:**
- Trigger misconception
- Pi addresses it
- Give correct answer
- Check Misconceptions tab → should move to "Resolved" section

---

## Integration Points Summary

| Component | Action | Where to Call |
|-----------|--------|---------------|
| **Lesson Load** | `startSession()` | ✅ Done in use-live-api.ts |
| **Milestone Start** | `logMilestoneStart()` | PedagogyEngine.advanceMilestone() |
| **Milestone Progress** | `logMilestoneProgress()` | After student response analysis |
| **Milestone Complete** | `logMilestoneComplete()` | PedagogyEngine.completeMilestone() |
| **Misconception Detect** | `logMisconception()` | MisconceptionClassifier.classify() |
| **Misconception Address** | `updateMisconceptionStatus('addressed')` | After Pi intervention |
| **Misconception Resolve** | `updateMisconceptionStatus('resolved')` | After student correction |
| **Standards Update** | `updateStandardsCoverage()` | After any milestone complete |
| **Session End** | `endSession()` | When lesson ends |

---

## Testing Checklist

### After Integration:

**Misconceptions:**
- [ ] Say wrong answer → appears in panel
- [ ] Pi corrects → status changes to "addressed"
- [ ] Give right answer → moves to "Resolved"
- [ ] Multiple mistakes → recurrence count increases

**Milestones:**
- [ ] Milestone starts → timeline entry created
- [ ] Give response → evidence appears
- [ ] Complete milestone → marked as ✅ with time spent
- [ ] All milestones → chronological order

**Standards:**
- [ ] Start lesson → 0% complete
- [ ] Complete objectives → progress bar fills
- [ ] Different milestones → different objectives update
- [ ] 100% → all checkmarks green

**Export:**
- [ ] Click JSON → downloads file
- [ ] Click CSV → downloads spreadsheet
- [ ] Contains all data → milestones, misconceptions, standards

---

## Mock Data for Testing (Optional)

If you want to test UI without agent integration first:

```typescript
// In TeacherPanelContainer or a test button:
const populateMockData = () => {
  const { logMilestoneComplete, logMisconception, updateStandardsCoverage } = useTeacherPanel.getState();
  
  // Mock milestone
  logMilestoneComplete('act-1', 'Student said: "They each get the same amount!"');
  
  // Mock misconception
  logMisconception({
    misconceptionType: 'equal-count-not-size',
    severity: 'medium',
    description: 'Student thinks equal means same number, not same size',
    studentSaid: 'I made 4 pieces',
    trigger: 'How would you divide this?',
    status: 'detected',
    milestoneId: 'act-2a',
    relatedObjectives: ['partition-shapes'],
  });
  
  // Mock standards
  updateStandardsCoverage({
    standardCode: '3.NF.A.1',
    standardDescription: 'Understand unit fractions...',
    framework: 'CCSS',
    percentComplete: 40,
    objectives: [
      { id: 'obj-1', description: 'Partition shapes', status: 'mastered', milestonesCompleted: ['act-2a'] },
      { id: 'obj-2', description: 'Recognize equal', status: 'in-progress', milestonesCompleted: [] },
    ],
  });
};
```

---

## Estimated Time

**Week 3 Integration:** 6-8 hours
- Misconception logging: 2 hours
- Milestone logging: 2 hours
- Standards calculation: 2-3 hours
- Testing & debugging: 1-2 hours

---

## Current Status

✅ **Week 2 Complete:**
- Full UI built
- Session starts automatically
- Panel renders and minimizes
- Export functionality works
- All views display (with empty states)

⏳ **Week 3 Pending:**
- Connect to agent detections
- Real-time data population
- Standards mapping logic
- Integration testing

---

**Ready to proceed with Week 3 when needed!** The foundation is solid and the UI is fully functional - it just needs live data from the agent system.
