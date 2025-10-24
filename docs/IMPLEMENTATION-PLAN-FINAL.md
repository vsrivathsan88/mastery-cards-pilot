# Implementation Plan: Wonder-First + Teacher Panel

## Executive Summary

**Goal:** Implement wonder-first lesson design with teacher analytics while maintaining 100% 3.NF.A.1 standards coverage.

**Components:**
1. ✅ Dynamic image switching (show_image tool)
2. ✅ Wonder-first lesson narrative
3. ✅ Teacher panel with mastery & misconception tracking
4. ✅ Full standards coverage verification

**Timeline:** 6 weeks
**Priority:** High - Core pedagogical improvement

---

## Standards Coverage Guarantee

### 3.NF.A.1: Full Coverage Maintained

```
Standard: "Understand a fraction 1/b as the quantity formed by 
          1 part when a whole is partitioned into b equal parts"

┌───────────────────────────────────────────────────┐
│ ✅ 100% COVERAGE WITH WONDER-FIRST APPROACH      │
├───────────────────────────────────────────────────┤
│                                                   │
│ Objective 1: Partition shapes into equal parts   │
│ ├─ Act 1: Fair sharing concept (intuitive)       │
│ ├─ Act 2a: Circle division (hands-on)            │
│ ├─ Act 2b: Rectangle division (transfer)         │
│ └─ Act 2c: Bar division (mastery)                │
│ Coverage: 100% ✓                                  │
│                                                   │
│ Objective 2: Equal = same size, not count        │
│ ├─ Act 1: Recognize unequal (visual)             │
│ └─ Act 2 Checkpoint: Discriminate equal/unequal  │
│ Coverage: 100% ✓                                  │
│                                                   │
│ Objective 3: Unit fraction language              │
│ └─ Act 3a: Naming (one-third, one-fourth)        │
│ Coverage: 100% ✓                                  │
│                                                   │
│ Objective 4: Symbolic notation (1/b)             │
│ ├─ Act 3b: Notation meaning                      │
│ └─ Act 3c: Critical evaluation                   │
│ Coverage: 100% ✓                                  │
│                                                   │
│ Objective 5: Explain reasoning                   │
│ ├─ Act 4a: Self-chosen context                   │
│ └─ Act 4b: Invariant principle                   │
│ Coverage: 100% ✓                                  │
│                                                   │
└───────────────────────────────────────────────────┘
```

**KEY INSIGHT:** Wonder-first IMPROVES standards mastery by building conceptual understanding before introducing formal terminology.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    STUDENT VIEW                         │
│  ┌───────────────────────────────────────────────┐     │
│  │  🎬 Dynamic Images (show_image tool)          │     │
│  │  ┌──────────────┐                             │     │
│  │  │ Cover Image  │  ← Auto-display on start    │     │
│  │  │ "Birthday!"  │                              │     │
│  │  └──────────────┘                              │     │
│  │         ↓                                       │     │
│  │  [Pi switches images via tool calls]          │     │
│  │         ↓                                       │     │
│  │  📝 Canvas + Instructions                      │     │
│  │  ⭐ Milestone Stars (5/10)                     │     │
│  │  ✨ Micro-celebrations                         │     │
│  └───────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                  TEACHER PANEL                          │
│  (Minimizable - Hidden by default)                     │
│  ┌───────────────────────────────────────────────┐     │
│  │  📚 Standards Coverage                        │     │
│  │  3.NF.A.1: ████████░░ 80%                    │     │
│  │  ✓ Partition shapes                           │     │
│  │  ✓ Recognize equal vs unequal                 │     │
│  │  ○ Fraction language (in progress)            │     │
│  │                                                │     │
│  │  🎯 Mastery Milestones                        │     │
│  │  ✅ Act 1 Complete (2:15 PM)                  │     │
│  │  ✅ Act 2a Complete (2:18 PM)                 │     │
│  │  ⏳ Act 2b In Progress                        │     │
│  │                                                │     │
│  │  ⚠️ Misconceptions                            │     │
│  │  1. equal-count-not-size (Medium)             │     │
│  │     "I made 4 pieces"                          │     │
│  │     ✓ Pi addressed & resolved                 │     │
│  └───────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                 AGENT SYSTEM                            │
│  ┌───────────────────────────────────────────────┐     │
│  │  MisconceptionClassifier                      │     │
│  │  ├─ Detects from lesson.scaffolding           │     │
│  │  └─ Logs to teacher panel                     │     │
│  │                                                │     │
│  │  EmotionalClassifier                          │     │
│  │  ├─ Tracks engagement                         │     │
│  │  └─ Triggers micro-celebrations               │     │
│  │                                                │     │
│  │  PedagogyEngine                               │     │
│  │  ├─ Tracks milestone completion               │     │
│  │  ├─ Updates standards coverage                │     │
│  │  └─ Logs to teacher panel                     │     │
│  └───────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

---

## 6-Week Implementation Plan

### Week 1: Dynamic Image Tool
**Goal:** Pi can control image display via function calls

**Tasks:**
- [ ] Create `show_image` tool definition
- [ ] Add tool handler in use-live-api.ts
- [ ] Update useLessonStore with currentImage state
- [ ] Modify LessonImage component for priority system
- [ ] Add coverImage support to lesson JSON
- [ ] Test tool calling with simple examples
- [ ] Handle edge cases (invalid imageId, missing assets)

**Deliverable:** Working show_image tool + cover image system

---

### Week 2: Teacher Panel UI
**Goal:** Minimizable panel showing standards, milestones, misconceptions

**Tasks:**
- [ ] Create data models (StandardsCoverage, MasteryMilestoneLog, MisconceptionLog)
- [ ] Build useTeacherPanel hook with Zustand
- [ ] Create TeacherPanelContainer component
- [ ] Build StandardsCoverageView
- [ ] Build MilestoneMasteryView
- [ ] Build MisconceptionLogView
- [ ] Add minimize/expand animation
- [ ] Style with cozy theme
- [ ] Add export functionality

**Deliverable:** Fully functional teacher panel (with mock data)

---

### Week 3: Agent Integration
**Goal:** Real-time logging of mastery and misconceptions

**Tasks:**
- [ ] Create standards mapping for 3.NF.A.1
- [ ] Hook up misconception logging to MisconceptionClassifier
- [ ] Hook up milestone logging to PedagogyEngine
- [ ] Implement standards coverage calculation
- [ ] Add real-time updates to teacher panel
- [ ] Test milestone detection and logging
- [ ] Test misconception detection and logging
- [ ] Verify standards coverage accuracy

**Deliverable:** Teacher panel showing live data from agents

---

### Week 4: Wonder-First Lesson Rewrite
**Goal:** Rewrite Equal Parts Challenge with story-driven approach

**Tasks:**
- [ ] Create birthday party cover image (SVG)
- [ ] Rewrite Act 1 with wonder-first narrative
- [ ] Rewrite Act 2a-c with exploration focus
- [ ] Rewrite Act 3a-c with naming approach
- [ ] Rewrite Act 4a-b with transfer tasks
- [ ] Update all milestone prompts
- [ ] Add show_image calls to milestone prompts
- [ ] Map milestones to standards objectives
- [ ] Verify 100% 3.NF.A.1 coverage

**Deliverable:** Complete wonder-first lesson JSON

---

### Week 5: System Prompt Update
**Goal:** Guide Pi to use wonder-first pedagogy and image tool

**Tasks:**
- [ ] Add wonder-first guidelines to system prompt
- [ ] Add show_image tool usage examples
- [ ] Include "everyday language first" instructions
- [ ] Add story-telling best practices
- [ ] Provide example dialogues
- [ ] Test Pi's adherence to guidelines
- [ ] Iterate based on Pi's responses
- [ ] Document prompt engineering decisions

**Deliverable:** Updated system prompt with pedagogy guidelines

---

### Week 6: Integration Testing & Polish
**Goal:** End-to-end testing and refinement

**Tasks:**
- [ ] Full lesson walkthrough with wonder-first
- [ ] Verify image switching at right moments
- [ ] Verify teacher panel logs correctly
- [ ] Check standards coverage calculation
- [ ] Test misconception detection accuracy
- [ ] Test milestone completion tracking
- [ ] User testing (if possible with kids)
- [ ] Polish UI/UX based on feedback
- [ ] Performance optimization
- [ ] Documentation updates

**Deliverable:** Production-ready wonder-first lesson + teacher panel

---

## Technical Components

### 1. show_image Tool
```typescript
// lib/tools/lesson-tools.ts
export const lessonTools: FunctionCall[] = [{
  name: 'show_image',
  description: 'Display image to support explanation',
  parameters: {
    imageId: { type: 'string' },
    context: { type: 'string' }
  }
}];
```

### 2. Teacher Panel State
```typescript
// lib/state.ts
interface TeacherPanelState {
  isExpanded: boolean;
  standardsCoverage: StandardsCoverage[];
  milestoneLogs: MasteryMilestoneLog[];
  misconceptionLogs: MisconceptionLog[];
  
  logMilestoneProgress: (log) => void;
  logMisconception: (log) => void;
  updateStandardsCoverage: (coverage) => void;
  exportData: () => void;
}
```

### 3. Standards Mapping
```typescript
// packages/lessons/src/standards/standards-mapping.ts
export const STANDARD_3_NF_A_1_MAPPING = {
  standard: { code: '3.NF.A.1', ... },
  objectives: [
    {
      id: 'obj-1',
      objective: 'Partition shapes...',
      contributingMilestones: ['act-2a-circle', 'act-2b-rectangle'],
      evidenceKeywords: ['same size', 'equal', 'divide']
    }
  ]
};
```

### 4. Lesson JSON Updates
```json
{
  "coverImage": {
    "id": "cover-birthday-party",
    "url": "/assets/fractions/birthday-party-cover.svg"
  },
  "milestones": [{
    "prompt": "It's Luna's birthday! She made...",
    "expectedConcepts": [
      "Fair sharing requires same amount",
      "Equal means same size"
    ]
  }]
}
```

---

## Standards Coverage Tracking

### Automatic Calculation
```typescript
// When milestone completes
pedagogyEngine.on('milestone_completed', (milestone) => {
  // Calculate new standards coverage
  const coverage = calculateStandardsCoverage(
    completedMilestones,
    detectedKeywords
  );
  
  // Update teacher panel
  useTeacherPanel.getState().updateStandardsCoverage(coverage);
});

// Coverage calculation
function calculateStandardsCoverage(milestones, keywords) {
  // Check which objectives are satisfied
  // Based on: milestone completion + keyword detection
  // Return percentage per objective + overall
}
```

### Real-Time Display
```
Teacher Panel:

📚 STANDARDS COVERAGE
3.NF.A.1: Understanding Unit Fractions
████████░░ 80% Complete

✓ Partition shapes into equal parts (100%)
✓ Recognize equal vs unequal (100%)  
○ Use fraction language (50%)
○ Symbolic notation (0%)
```

---

## Wonder-First Example (Act 1)

### OLD (Math-Heavy)
```
🖼️ Static image: Unequal cookie

Pi: "Look at this picture of kids sharing a cookie. 
What do you notice about these pieces? Would you 
want the smallest one? How would you make all 
the pieces equal in size?"

❌ Uses "equal" immediately
❌ Analytical question
❌ No emotional hook
```

### NEW (Wonder-First)
```
🎬 Cover image: Birthday party, whole cookie

Pi: "It's Luna's birthday! 🎂 She made the BIGGEST 
chocolate chip cookie ever - like, pizza-sized! 
Her best friends Maya and Carlos come over... 
Three friends... one cookie... uh oh!"

[Student: "They have to share!"]

🎬 show_image("unequal-cookie-kids")

Pi: "Luna tried to cut it! But look at everyone's 
faces... see Carlos? Which piece do you think 
HE got?"

[Student: "The tiny one! He looks sad!"]

Pi: "Yeah! 😢 If YOU got the tiny piece and your 
friend got the giant one, how would YOU feel?"

[Student: "Mad! Not fair!"]

Pi: "NOT FAIR! Why isn't it fair?"

[Student: "Some got more!"]

Pi: "Exactly! Everyone should get the SAME AMOUNT. 
That's what fair means - same amount for everyone."

✅ Story creates emotion
✅ "Fair" before "equal"
✅ Student discovers problem
✅ Math terms come LATER

[Teacher Panel Logs]
✅ Milestone: Act 1 complete
✅ Evidence: "Some got more!" "Not fair!"
✅ Standards: Obj 1 (40%), Obj 2 (50%)
✅ No misconceptions detected
```

---

## Misconception Logging Example

### Detection Flow
```
1. Student says: "I divided it into 4 pieces"
   
2. MisconceptionClassifier detects:
   Type: equal-count-not-size
   Keywords: ["4 pieces", "divided"]
   Confidence: 0.85
   
3. Log to teacher panel:
   {
     type: "equal-count-not-size",
     severity: "medium",
     studentUtterance: "I divided it into 4 pieces",
     milestoneId: "act-2b-rectangle",
     correctionStrategy: "Guide to check SIZE not COUNT",
     alignedToStandard: "3.NF.A.1"
   }
   
4. Pi responds with correction:
   "You're right that you have 4 pieces! But for 
   fractions, we need something more: all 4 pieces 
   must be EXACTLY the same SIZE..."
   
5. Update log:
   correctionAttempted: true
   
6. Student adjusts drawing
   
7. Update log:
   resolved: true
   resolvedAt: timestamp
```

### Teacher Panel Display
```
⚠️ MISCONCEPTIONS DETECTED

1. equal-count-not-size (Medium)
   Detected: 2:16 PM
   Student said: "I divided it into 4 pieces"
   Issue: Focused on count, not size
   Correction: ✓ Pi addressed
   Status: ✓ Resolved (2:17 PM)
   
   Related to: 3.NF.A.1 Objective 2
```

---

## Success Metrics

### For Students
- ✅ Engagement score (via EmotionalClassifier)
- ✅ Milestone completion rate
- ✅ Time to complete lesson
- ✅ Misconceptions encountered vs resolved
- ✅ Transfer task success (Act 4)

### For Teachers
- ✅ Standards coverage percentage
- ✅ Objective-by-objective progress
- ✅ Misconception patterns identified
- ✅ Evidence of student reasoning
- ✅ Exportable data for records

### For Standards
- ✅ 100% 3.NF.A.1 coverage maintained
- ✅ All 5 objectives measurable
- ✅ Evidence-based mastery tracking
- ✅ Aligned misconception detection

---

## Next Steps

### Immediate Actions
1. **Get approval** on this implementation plan
2. **Prioritize** which week to start with
3. **Assign resources** (who builds what)

### Week 1 Kickoff
1. Set up development branches
2. Create task board (GitHub issues)
3. Start with show_image tool implementation
4. Daily standups for coordination

### Ongoing
- Weekly demos of progress
- User testing sessions (if possible)
- Iterate based on feedback
- Document learnings

---

## Risk Mitigation

### Risk: Standards coverage drops
**Mitigation:** 
- Map every milestone to objectives upfront
- Test coverage calculation frequently
- Manual verification against rubric

### Risk: Teacher panel overwhelming
**Mitigation:**
- Default to minimized
- Gradual reveal of features
- User testing with actual teachers
- Simplify if needed

### Risk: Wonder-first takes too long
**Mitigation:**
- Time-box wonder phase (5-7 min)
- Can be shortened if student engaged
- Monitor lesson completion times
- Adjust pacing based on data

### Risk: Pi doesn't follow wonder-first
**Mitigation:**
- Strong system prompt with examples
- Few-shot demonstrations
- Monitor and iterate prompt
- Fallback to standard prompts if needed

---

## Documentation Deliverables

### For Developers
- [ ] Technical architecture diagram
- [ ] API documentation (show_image tool)
- [ ] Data model specifications
- [ ] Component implementation guide

### For Educators
- [ ] Standards alignment rubric
- [ ] Teacher panel user guide
- [ ] Interpreting misconception data
- [ ] Best practices for intervention

### For Product
- [ ] Feature specifications
- [ ] User stories and acceptance criteria
- [ ] Testing protocols
- [ ] Launch checklist

---

## Conclusion

**This implementation delivers:**

1. ✅ **Wonder-first pedagogy** - Story-driven, engaging learning
2. ✅ **Dynamic visuals** - Pi controls image switching
3. ✅ **Teacher insights** - Deep analytics on mastery & misconceptions
4. ✅ **Standards coverage** - 100% 3.NF.A.1 maintained
5. ✅ **Student experience** - Fun, encouraging, supportive
6. ✅ **Teacher experience** - Informative, actionable, unobtrusive

**Timeline:** 6 weeks to production-ready
**Outcome:** Better engagement + deeper learning + comprehensive tracking

**Ready to start Week 1!** 🚀
