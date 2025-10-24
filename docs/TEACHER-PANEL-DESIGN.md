# Teacher Panel Design: Mastery & Misconception Tracking

## Overview
A minimizable teacher/parent panel that displays detailed learning analytics while students see only the fun milestone stars. Provides deep insight into standards mastery and misconception patterns.

**Date:** October 24, 2024

---

## Design Principles

### For Students 🧒
- ✨ **See only**: Milestone stars, celebrations, encouragement
- ✅ **Goal**: Stay motivated, feel successful
- 🚫 **Hidden**: Technical details, misconception labels, standards codes

### For Teachers/Parents 👩‍🏫
- 📊 **See everything**: Standards coverage, misconception patterns, exact progress
- 🎯 **Goal**: Understand learning deeply, intervene strategically
- 🔄 **Collapsible**: Can minimize to stay out of the way

---

## Visual Design

### Student View (Main UI)
```
┌────────────────────────────────────────────┐
│  ← The Equal Parts Challenge    ⭐ 5/10   │
├────────────────────────────────────────────┤
│                                             │
│  [Lesson Image]        [Canvas]            │
│                                             │
│  🎤 Pi: "Great job! That's one-third!"     │
└────────────────────────────────────────────┘

✨ Only milestone stars visible
🎉 Celebrations when milestones complete
💫 Micro sparkles for good attempts
```

### Teacher Panel (Minimized)
```
┌────────────────────────────────────────────┐
│  ← The Equal Parts Challenge    ⭐ 5/10   │
│                                             │
│  [📊 Teacher Panel ▼]  ← Click to expand  │
├────────────────────────────────────────────┤
│                                             │
│  [Student learning experience...]          │
│                                             │
└────────────────────────────────────────────┘

Subtle, unobtrusive when collapsed
```

### Teacher Panel (Expanded)
```
┌────────────────────────────────────────────┐
│  ← The Equal Parts Challenge    ⭐ 5/10   │
│                                             │
│  [📊 Teacher Panel ▲]  ← Click to minimize│
│  ┌──────────────────────────────────────┐  │
│  │ 📚 STANDARDS COVERAGE                │  │
│  │ 3.NF.A.1: Understanding Unit Fractions│  │
│  │ ████████░░ 80% Complete              │  │
│  │                                        │  │
│  │ ✓ Partition into equal parts          │  │
│  │ ✓ Recognize equal vs unequal          │  │
│  │ ○ Use fraction language (in progress) │  │
│  │ ○ Symbolic notation (not started)     │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │ 🎯 MASTERY MILESTONES                │  │
│  │                                        │  │
│  │ ✅ Act 1: What Makes Parts Equal?     │  │
│  │    Completed 2:15 PM                   │  │
│  │    Evidence: "They're not the same!"   │  │
│  │                                        │  │
│  │ ✅ Act 2a: Dividing a Circle          │  │
│  │    Completed 2:18 PM                   │  │
│  │    Evidence: Drew 3 equal parts        │  │
│  │                                        │  │
│  │ ⏳ Act 2b: Rectangle (in progress)    │  │
│  │    Started 2:20 PM                     │  │
│  │    Attempts: 2                         │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │ ⚠️ MISCONCEPTIONS DETECTED            │  │
│  │                                        │  │
│  │ 1. equal-count-not-size (Medium)      │  │
│  │    Detected: 2:16 PM                   │  │
│  │    Student said: "I made 4 pieces"    │  │
│  │    Issue: Counted pieces, not size    │  │
│  │    Correction: ✓ Pi addressed         │  │
│  │                                        │  │
│  │ 2. unequal-parts-as-fractions (High)  │  │
│  │    Detected: 2:19 PM                   │  │
│  │    Student said: "These are thirds"   │  │
│  │    Issue: Unequal pieces called thirds│  │
│  │    Correction: ✓ Pi addressed         │  │
│  └──────────────────────────────────────┘  │
├────────────────────────────────────────────┤
│  [Student learning experience...]          │
└────────────────────────────────────────────┘

Detailed analytics for teacher
Can minimize anytime
```

---

## Data Models

### 1. Standards Coverage Tracking

```typescript
// packages/shared/src/types.ts

export interface StandardsCoverage {
  standard: {
    framework: 'CCSS' | 'NGSS' | 'state';
    code: string;  // "3.NF.A.1"
    description: string;
  };
  objectives: ObjectiveProgress[];
  overallProgress: number;  // 0-100%
  lastUpdated: Date;
}

export interface ObjectiveProgress {
  objective: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'mastered';
  evidence: string[];  // Student quotes/actions showing progress
  completedAt?: Date;
  milestonesContributing: string[];  // Which milestones hit this objective
}
```

### 2. Mastery Milestone Logging

```typescript
export interface MasteryMilestoneLog {
  milestoneId: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed' | 'mastered';
  
  // Timestamps
  startedAt?: Date;
  completedAt?: Date;
  
  // Progress tracking
  attempts: number;
  timeSpent: number;  // seconds
  
  // Evidence of mastery
  evidence: {
    type: 'transcription' | 'canvas-action' | 'agent-detection';
    timestamp: Date;
    content: string;
  }[];
  
  // Keywords detected
  keywordsDetected: string[];
  
  // Agent insights
  emotionalState?: string;
  confidenceLevel?: number;
  misconceptionsEncountered?: string[];
}
```

### 3. Misconception Logging

```typescript
export interface MisconceptionLog {
  id: string;
  type: string;  // "equal-count-not-size"
  severity: 'low' | 'medium' | 'high';
  
  // Detection details
  detectedAt: Date;
  milestoneId: string;
  
  // Evidence
  studentUtterance: string;
  detectionKeywords: string[];
  agentConfidence: number;
  
  // Context
  lessonContext: {
    milestoneIndex: number;
    attemptNumber: number;
    timeInLesson: number;
  };
  
  // Intervention
  correctionAttempted: boolean;
  correctionStrategy: string;
  resolved: boolean;
  resolvedAt?: Date;
  
  // Standards alignment
  alignedToStandard: string;  // "3.NF.A.1"
}
```

### 4. Teacher Panel State

```typescript
export interface TeacherPanelState {
  isExpanded: boolean;
  activeTab: 'standards' | 'milestones' | 'misconceptions' | 'timeline';
  
  // Data
  standardsCoverage: StandardsCoverage[];
  milestoneLogs: MasteryMilestoneLog[];
  misconceptionLogs: MisconceptionLog[];
  
  // Settings
  autoMinimize: boolean;  // Auto-minimize when student connects
  realTimeUpdates: boolean;
}
```

---

## Component Architecture

### Component Structure
```
TeacherPanel/
├── TeacherPanelContainer.tsx       // Main container with minimize/expand
├── StandardsCoverageView.tsx       // 3.NF.A.1 progress visualization
├── MilestoneMasteryView.tsx        // Milestone progress timeline
├── MisconceptionLogView.tsx        // Misconception pattern analysis
├── TeacherInsightsTimeline.tsx     // Chronological event log
└── TeacherPanelControls.tsx        // Minimize, export, settings
```

### TeacherPanelContainer
```typescript
// apps/tutor-app/components/teacher/TeacherPanelContainer.tsx

import { useState } from 'react';
import { useTeacherPanel } from '../../hooks/useTeacherPanel';

export function TeacherPanelContainer() {
  const {
    isExpanded,
    toggleExpanded,
    standardsCoverage,
    milestoneLogs,
    misconceptionLogs,
  } = useTeacherPanel();

  return (
    <div className="teacher-panel">
      {/* Header - always visible */}
      <button
        onClick={toggleExpanded}
        className="teacher-panel-toggle"
      >
        📊 Teacher Panel {isExpanded ? '▲' : '▼'}
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="teacher-panel-content">
          <div className="teacher-panel-tabs">
            <button>📚 Standards</button>
            <button>🎯 Milestones</button>
            <button>⚠️ Misconceptions</button>
            <button>⏰ Timeline</button>
          </div>

          <div className="teacher-panel-body">
            <StandardsCoverageView data={standardsCoverage} />
            <MilestoneMasteryView logs={milestoneLogs} />
            <MisconceptionLogView logs={misconceptionLogs} />
          </div>

          <div className="teacher-panel-footer">
            <button>📥 Export Data</button>
            <button>⚙️ Settings</button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### StandardsCoverageView
```typescript
// apps/tutor-app/components/teacher/StandardsCoverageView.tsx

export function StandardsCoverageView({ data }: { data: StandardsCoverage[] }) {
  return (
    <div className="standards-coverage">
      {data.map(standard => (
        <div key={standard.standard.code} className="standard-card">
          <div className="standard-header">
            <h3>{standard.standard.code}: {standard.standard.description}</h3>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${standard.overallProgress}%` }}
              />
            </div>
            <span className="progress-text">{standard.overallProgress}% Complete</span>
          </div>

          <div className="objectives-list">
            {standard.objectives.map(obj => (
              <div key={obj.objective} className="objective-item">
                <span className={`status-icon status-${obj.status}`}>
                  {obj.status === 'completed' ? '✓' : 
                   obj.status === 'in-progress' ? '○' : '□'}
                </span>
                <span className="objective-text">{obj.objective}</span>
                
                {obj.evidence.length > 0 && (
                  <div className="evidence-preview">
                    💬 "{obj.evidence[0]}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### MilestoneMasteryView
```typescript
// apps/tutor-app/components/teacher/MilestoneMasteryView.tsx

export function MilestoneMasteryView({ logs }: { logs: MasteryMilestoneLog[] }) {
  return (
    <div className="milestone-mastery">
      <div className="milestone-timeline">
        {logs.map(log => (
          <div key={log.milestoneId} className={`milestone-log milestone-${log.status}`}>
            <div className="milestone-header">
              <span className="milestone-status-icon">
                {log.status === 'completed' ? '✅' : 
                 log.status === 'in-progress' ? '⏳' : '○'}
              </span>
              <h4>{log.title}</h4>
            </div>

            <div className="milestone-meta">
              {log.completedAt && (
                <div className="completed-time">
                  ✓ Completed at {formatTime(log.completedAt)}
                </div>
              )}
              {log.status === 'in-progress' && (
                <div className="in-progress-stats">
                  ⏱️ Time: {formatDuration(log.timeSpent)} | 
                  🔄 Attempts: {log.attempts}
                </div>
              )}
            </div>

            {log.evidence.length > 0 && (
              <div className="milestone-evidence">
                <strong>Evidence:</strong>
                <ul>
                  {log.evidence.map((ev, i) => (
                    <li key={i}>
                      <span className="evidence-type">{ev.type}:</span>
                      "{ev.content}"
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {log.misconceptionsEncountered && log.misconceptionsEncountered.length > 0 && (
              <div className="milestone-misconceptions">
                ⚠️ Misconceptions: {log.misconceptionsEncountered.join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### MisconceptionLogView
```typescript
// apps/tutor-app/components/teacher/MisconceptionLogView.tsx

export function MisconceptionLogView({ logs }: { logs: MisconceptionLog[] }) {
  // Group by type for pattern analysis
  const groupedByType = logs.reduce((acc, log) => {
    if (!acc[log.type]) acc[log.type] = [];
    acc[log.type].push(log);
    return acc;
  }, {} as Record<string, MisconceptionLog[]>);

  return (
    <div className="misconception-log">
      <div className="misconception-summary">
        <h4>Patterns Detected</h4>
        <div className="misconception-patterns">
          {Object.entries(groupedByType).map(([type, instances]) => (
            <div key={type} className="pattern-card">
              <div className="pattern-header">
                <span className={`severity-badge severity-${instances[0].severity}`}>
                  {instances[0].severity}
                </span>
                <h5>{formatMisconceptionName(type)}</h5>
                <span className="pattern-count">×{instances.length}</span>
              </div>
              <div className="pattern-stats">
                <div>First: {formatTime(instances[0].detectedAt)}</div>
                <div>
                  Resolved: {instances.filter(i => i.resolved).length}/{instances.length}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="misconception-timeline">
        <h4>Detection Log</h4>
        {logs.map(log => (
          <div key={log.id} className={`misconception-entry severity-${log.severity}`}>
            <div className="entry-header">
              <span className="entry-time">{formatTime(log.detectedAt)}</span>
              <span className="entry-type">{formatMisconceptionName(log.type)}</span>
              <span className={`entry-severity ${log.severity}`}>{log.severity}</span>
            </div>

            <div className="entry-evidence">
              <strong>Student said:</strong> "{log.studentUtterance}"
            </div>

            <div className="entry-context">
              <span>Milestone: {log.milestoneId}</span> | 
              <span>Attempt #{log.attemptNumber}</span> |
              <span>Confidence: {(log.agentConfidence * 100).toFixed(0)}%</span>
            </div>

            <div className={`entry-correction ${log.correctionAttempted ? 'attempted' : 'pending'}`}>
              {log.correctionAttempted ? (
                <>
                  ✓ Pi addressed: "{log.correctionStrategy}"
                  {log.resolved && (
                    <span className="resolved-badge">✓ Resolved</span>
                  )}
                </>
              ) : (
                <span className="pending-badge">⏳ Not yet addressed</span>
              )}
            </div>

            <div className="entry-standard">
              Related to: {log.alignedToStandard}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatMisconceptionName(type: string): string {
  return type
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
```

---

## Hook Implementation

### useTeacherPanel Hook
```typescript
// apps/tutor-app/hooks/useTeacherPanel.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TeacherPanelStore {
  isExpanded: boolean;
  activeTab: 'standards' | 'milestones' | 'misconceptions' | 'timeline';
  
  // Data
  standardsCoverage: StandardsCoverage[];
  milestoneLogs: MasteryMilestoneLog[];
  misconceptionLogs: MisconceptionLog[];
  
  // Actions
  toggleExpanded: () => void;
  setActiveTab: (tab: string) => void;
  
  // Logging actions
  logMilestoneProgress: (log: MasteryMilestoneLog) => void;
  logMisconception: (log: MisconceptionLog) => void;
  updateStandardsCoverage: (coverage: StandardsCoverage) => void;
  
  // Export
  exportData: () => void;
  clearLogs: () => void;
}

export const useTeacherPanel = create<TeacherPanelStore>()(
  persist(
    (set, get) => ({
      isExpanded: false,
      activeTab: 'standards',
      standardsCoverage: [],
      milestoneLogs: [],
      misconceptionLogs: [],

      toggleExpanded: () => set(state => ({ isExpanded: !state.isExpanded })),
      
      setActiveTab: (tab) => set({ activeTab: tab as any }),

      logMilestoneProgress: (log) => {
        set(state => {
          const existing = state.milestoneLogs.findIndex(
            l => l.milestoneId === log.milestoneId
          );
          
          if (existing >= 0) {
            const updated = [...state.milestoneLogs];
            updated[existing] = log;
            return { milestoneLogs: updated };
          } else {
            return { milestoneLogs: [...state.milestoneLogs, log] };
          }
        });
      },

      logMisconception: (log) => {
        set(state => ({
          misconceptionLogs: [...state.misconceptionLogs, log]
        }));
      },

      updateStandardsCoverage: (coverage) => {
        set(state => {
          const existing = state.standardsCoverage.findIndex(
            c => c.standard.code === coverage.standard.code
          );
          
          if (existing >= 0) {
            const updated = [...state.standardsCoverage];
            updated[existing] = coverage;
            return { standardsCoverage: updated };
          } else {
            return { standardsCoverage: [...state.standardsCoverage, coverage] };
          }
        });
      },

      exportData: () => {
        const data = {
          lesson: useLessonStore.getState().currentLesson?.title,
          timestamp: new Date().toISOString(),
          standardsCoverage: get().standardsCoverage,
          milestoneLogs: get().milestoneLogs,
          misconceptionLogs: get().misconceptionLogs,
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `teacher-panel-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },

      clearLogs: () => set({
        milestoneLogs: [],
        misconceptionLogs: [],
        standardsCoverage: [],
      }),
    }),
    {
      name: 'teacher-panel-storage',
    }
  )
);
```

---

## Integration with Agent System

### Agent Event Logging
```typescript
// apps/tutor-app/hooks/media/use-live-api.ts

// When agent analysis completes
analyzeTranscription(text).then(insights => {
  // Log to teacher panel
  if (insights.misconception?.detected) {
    useTeacherPanel.getState().logMisconception({
      id: Date.now().toString(),
      type: insights.misconception.type,
      severity: insights.misconception.severity || 'medium',
      detectedAt: new Date(),
      milestoneId: progress.currentMilestoneId,
      studentUtterance: text,
      detectionKeywords: insights.misconception.keywords || [],
      agentConfidence: insights.misconception.confidence || 0,
      lessonContext: {
        milestoneIndex: progress.currentMilestoneIndex,
        attemptNumber: progress.attempts,
        timeInLesson: Date.now() - lessonStartTime,
      },
      correctionAttempted: true,
      correctionStrategy: insights.misconception.intervention || '',
      resolved: false,
      alignedToStandard: '3.NF.A.1',
    });
  }
});

// When milestone completes
pedagogyEngine.on('milestone_completed', (milestone) => {
  useTeacherPanel.getState().logMilestoneProgress({
    milestoneId: milestone.id,
    title: milestone.title,
    status: 'completed',
    startedAt: milestoneStartTime,
    completedAt: new Date(),
    attempts: progress.attempts,
    timeSpent: Date.now() - milestoneStartTime,
    evidence: collectedEvidence,
    keywordsDetected: detectedKeywords,
    emotionalState: lastEmotionalState,
    confidenceLevel: lastConfidenceScore,
    misconceptionsEncountered: misconceptionsInMilestone,
  });
  
  // Update standards coverage
  updateStandardsCoverageForMilestone(milestone);
});
```

---

## Standards Coverage Mapping

### 3.NF.A.1 Coverage Matrix

```typescript
// packages/lessons/src/standards/standards-mapping.ts

export const STANDARD_3_NF_A_1_MAPPING = {
  standard: {
    framework: 'CCSS',
    code: '3.NF.A.1',
    description: 'Understand a fraction 1/b as the quantity formed by 1 part when a whole is partitioned into b equal parts',
  },
  
  objectives: [
    {
      id: 'obj-1',
      objective: 'Partition different shapes into equal-sized parts',
      contributingMilestones: [
        'act-1-curiosity',
        'act-2a-circle',
        'act-2b-rectangle',
        'act-2c-bar',
      ],
      evidenceKeywords: ['same size', 'equal', 'divide', 'cut', 'fair', 'same amount'],
    },
    {
      id: 'obj-2',
      objective: 'Recognize that equal parts must be same size, not just same count',
      contributingMilestones: [
        'act-1-curiosity',
        'act-2-checkpoint',
      ],
      evidenceKeywords: ['not just count', 'same size', 'bigger', 'smaller', 'unequal'],
    },
    {
      id: 'obj-3',
      objective: 'Use unit fraction language (one-third, one-fourth)',
      contributingMilestones: [
        'act-3a-naming',
      ],
      evidenceKeywords: ['one third', 'one fourth', 'one sixth', 'thirds', 'fourths'],
    },
    {
      id: 'obj-4',
      objective: 'Represent unit fractions symbolically (1/b)',
      contributingMilestones: [
        'act-3b-notation',
        'act-3c-retrieval',
      ],
      evidenceKeywords: ['1/3', '1/4', '1/6', 'numerator', 'denominator', 'top number', 'bottom number'],
    },
    {
      id: 'obj-5',
      objective: 'Explain equal partitioning using visual or verbal reasoning',
      contributingMilestones: [
        'act-2-checkpoint',
        'act-4a-transfer',
        'act-4b-reflection',
      ],
      evidenceKeywords: ['because', 'same size', 'fair', 'equal', 'how I know', 'checked'],
    },
  ],
};

export function calculateStandardsCoverage(
  completedMilestones: string[],
  detectedKeywords: string[]
): StandardsCoverage {
  const objectives = STANDARD_3_NF_A_1_MAPPING.objectives.map(obj => {
    // Check if milestones contributing to this objective are completed
    const milestonesCompleted = obj.contributingMilestones.filter(
      m => completedMilestones.includes(m)
    ).length;
    
    const totalMilestones = obj.contributingMilestones.length;
    const milestoneProgress = milestonesCompleted / totalMilestones;
    
    // Check if evidence keywords have been detected
    const keywordsDetected = obj.evidenceKeywords.filter(
      k => detectedKeywords.some(dk => dk.toLowerCase().includes(k.toLowerCase()))
    ).length;
    
    const totalKeywords = obj.evidenceKeywords.length;
    const keywordProgress = keywordsDetected / totalKeywords;
    
    // Status based on combined progress
    const progress = (milestoneProgress * 0.7) + (keywordProgress * 0.3);
    let status: ObjectiveProgress['status'];
    
    if (progress === 0) status = 'not-started';
    else if (progress < 0.5) status = 'in-progress';
    else if (progress < 1.0) status = 'completed';
    else status = 'mastered';
    
    return {
      objective: obj.objective,
      status,
      evidence: [], // Filled in by actual student utterances
      milestonesContributing: obj.contributingMilestones,
    };
  });
  
  const overallProgress = Math.round(
    (objectives.filter(o => o.status === 'completed' || o.status === 'mastered').length / 
     objectives.length) * 100
  );
  
  return {
    standard: STANDARD_3_NF_A_1_MAPPING.standard,
    objectives,
    overallProgress,
    lastUpdated: new Date(),
  };
}
```

---

## Wonder-First + Standards Coverage

### How Wonder-First Still Covers 3.NF.A.1

```
Standard: "Understand a fraction 1/b as the quantity formed by 
          1 part when a whole is partitioned into b equal parts"

┌─────────────────────────────────────────────────────┐
│ WONDER PHASE: "Luna's birthday cookie!"            │
│                                                     │
│ Coverage: Building intuition for "equal parts"     │
│ ✓ Fair sharing = same amount (conceptual)          │
│ ✓ Recognizing unequal vs equal (visual)            │
│                                                     │
│ Standards objective 1 & 2: 40% progress            │
└─────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────┐
│ EXPLORATION PHASE: Hands-on partitioning           │
│                                                     │
│ Coverage: Partitioning shapes into equal parts     │
│ ✓ Draw circle, divide for 3 friends                │
│ ✓ Draw rectangle, divide for 4 friends             │
│ ✓ Draw bar, divide for 6 friends                   │
│                                                     │
│ Standards objective 1: 100% progress               │
└─────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────┐
│ NAMING PHASE: Fraction terminology                 │
│                                                     │
│ Coverage: Unit fraction language & notation        │
│ ✓ "We call this one-third" (language)              │
│ ✓ "We write it as 1/3" (symbolic)                  │
│ ✓ "Bottom = parts total, top = parts we have"      │
│                                                     │
│ Standards objectives 3 & 4: 100% progress          │
└─────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────┐
│ TRANSFER PHASE: Apply & explain                    │
│                                                     │
│ Coverage: Reasoning about equal parts              │
│ ✓ Choose own shape, show 1/4                       │
│ ✓ Explain how they know parts are equal            │
│ ✓ Articulate invariant principle                   │
│                                                     │
│ Standards objective 5: 100% progress               │
└─────────────────────────────────────────────────────┘

RESULT: 100% standards coverage with better engagement!
```

### Key Insight
**Wonder-first doesn't compromise standards - it ENHANCES mastery by building deeper conceptual understanding before introducing formal terminology.**

---

## Implementation Checklist

### Phase 1: Data Models & Logging (Week 1)
- [ ] Add StandardsCoverage types to shared package
- [ ] Add MasteryMilestoneLog types
- [ ] Add MisconceptionLog types
- [ ] Create standards mapping for 3.NF.A.1
- [ ] Implement useTeacherPanel hook
- [ ] Add logging to agent analysis flow
- [ ] Add logging to milestone completion

### Phase 2: UI Components (Week 2)
- [ ] Create TeacherPanelContainer
- [ ] Build StandardsCoverageView
- [ ] Build MilestoneMasteryView
- [ ] Build MisconceptionLogView
- [ ] Add minimize/expand animation
- [ ] Style with cozy theme
- [ ] Add export functionality

### Phase 3: Integration (Week 3)
- [ ] Integrate panel into StreamingConsole
- [ ] Hook up real-time data updates
- [ ] Test milestone logging
- [ ] Test misconception logging
- [ ] Test standards coverage calculation
- [ ] Add keyboard shortcuts (T to toggle)

### Phase 4: Wonder-First Lesson (Week 4-5)
- [ ] Implement show_image tool
- [ ] Create cover images
- [ ] Rewrite lesson with wonder-first
- [ ] Update system prompt
- [ ] Test full flow
- [ ] Verify standards coverage still 100%

---

## Example Teacher Panel Session

### Session Timeline
```
2:00 PM - Lesson starts
├─ 2:00 PM: Cover image shown "Birthday party"
├─ 2:02 PM: Act 1 complete ✅
│  Evidence: "Not fair! Some got more!"
│  Standards: Objective 1 (40%), Objective 2 (50%)
│
├─ 2:05 PM: Act 2a in progress...
├─ 2:06 PM: ⚠️ Misconception detected
│  Type: equal-count-not-size
│  Student: "I made 4 pieces"
│  Pi addressed: ✓ "But are they the same SIZE?"
│
├─ 2:08 PM: Act 2a complete ✅
│  Evidence: Drew 3 equal parts on canvas
│  Standards: Objective 1 (70%)
│
├─ 2:12 PM: Act 2b complete ✅
│  Evidence: "They're all the same size"
│  Standards: Objective 1 (100%), Objective 2 (100%)
│
├─ 2:18 PM: Act 3a complete ✅
│  Evidence: "One-third means one out of three"
│  Standards: Objective 3 (100%)
│
└─ 2:25 PM: Lesson complete 🎉
   Overall: 3.NF.A.1 - 100% mastery
   Misconceptions: 2 detected, 2 resolved
   Time: 25 minutes
```

---

## Export Format

### JSON Export Example
```json
{
  "session": {
    "lessonId": "equal-parts-challenge",
    "lessonTitle": "The Equal Parts Challenge",
    "studentId": "student-123",
    "startTime": "2024-10-24T14:00:00Z",
    "endTime": "2024-10-24T14:25:00Z",
    "duration": 1500
  },
  
  "standardsCoverage": [{
    "standard": {
      "code": "3.NF.A.1",
      "description": "Understand fraction 1/b..."
    },
    "overallProgress": 100,
    "objectives": [
      {
        "objective": "Partition shapes into equal parts",
        "status": "mastered",
        "evidence": [
          "They should all be the same size",
          "I divided it into three equal parts"
        ]
      }
    ]
  }],
  
  "milestones": [
    {
      "id": "act-1-curiosity",
      "title": "Act 1: What Makes Parts Equal?",
      "status": "completed",
      "completedAt": "2024-10-24T14:02:00Z",
      "attempts": 1,
      "timeSpent": 120,
      "evidence": [{
        "type": "transcription",
        "content": "Not fair! Some people got more!"
      }]
    }
  ],
  
  "misconceptions": [
    {
      "type": "equal-count-not-size",
      "severity": "medium",
      "detectedAt": "2024-10-24T14:06:00Z",
      "studentUtterance": "I made 4 pieces",
      "correctionAttempted": true,
      "resolved": true,
      "resolvedAt": "2024-10-24T14:07:00Z"
    }
  ]
}
```

---

## Summary

### What Teachers See
- 📊 Standards coverage percentage (3.NF.A.1: 80%)
- 🎯 Milestone completion timeline
- ⚠️ Misconception patterns and resolution
- 💬 Evidence quotes from student
- 📥 Exportable data for records

### What Students See
- ⭐ Milestone stars (5/10)
- 🎉 Big celebrations when complete
- ✨ Micro sparkles for good work
- 🖼️ Engaging lesson visuals
- 🎤 Friendly Pi conversation

### Integration Points
- ✅ Agent system logs all detections
- ✅ Standards mapped to milestones
- ✅ Real-time updates as lesson progresses
- ✅ Minimizable - stays out of the way
- ✅ Exportable for record-keeping

**Ready to build when you are!** 🚀
