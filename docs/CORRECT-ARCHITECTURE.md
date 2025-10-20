# Correct Architecture: Static Prompt + Dynamic Context

## The Problem

We've been trying to **replace the entire system prompt** when a lesson loads, which requires:
- Disconnecting from Gemini Live
- Reconnecting with new prompt
- This causes connection loops and instability

## The Right Way

### **Architecture:**

```
┌─────────────────────────────────────────┐
│  GEMINI LIVE CONNECTION                 │
│  System Prompt (SET ONCE, NEVER CHANGE)│
│                                         │
│  "You are Simili, an AI math tutor..."  │
│  [Base personality + pedagogy rules]    │
└─────────────────────────────────────────┘
                ↕
        Dynamic Updates via:
                ↕
┌─────────────────────────────────────────┐
│  1. Tool Calls (for real-time data)     │
│     - getCurrentLesson()                │
│     - getMilestone()                    │
│     - checkMisconception()              │
│                                         │
│  2. User Messages (for context)         │
│     - "Starting lesson: Fractions..."   │
│     - "Current milestone: Identify..."  │
│                                         │
│  3. Backend API (for analysis)          │
│     - POST /api/analyze                 │
│     - Returns: misconceptions, emotions │
└─────────────────────────────────────────┘
```

---

## Implementation Plan

### **Step 1: Static System Prompt**

Set this ONCE on app load, never change it:

```typescript
const SIMILI_SYSTEM_PROMPT = `
You are Simili, a warm and encouraging AI math tutor for elementary students.

# Your Personality
- Warm, patient, and enthusiastic about learning
- Never condescending, always age-appropriate
- Celebrate small wins and progress
- Ask guiding questions rather than giving direct answers

# Your Teaching Approach
- Use the Socratic method
- Build on what the student already knows
- Use concrete examples and visual imagery
- Break complex concepts into smaller steps
- Check for understanding frequently

# Available Tools
You have access to tools that provide:
- Current lesson context and objectives
- Student's progress and milestone status
- Misconception detection results
- Emotional state analysis
- Visual feedback from student's work

Use these tools to adapt your teaching in real-time.

# Response Guidelines
- Keep responses conversational and age-appropriate
- Use encouraging language
- Ask one question at a time
- Wait for student response before moving on
- Celebrate correct answers
- Gently guide when student struggles
`;
```

**This NEVER changes!** Set it once when app loads.

---

### **Step 2: Dynamic Lesson Context via Tools**

When lesson loads, provide context via **function declarations**:

```typescript
const lessonTools = [
  {
    name: "getCurrentLesson",
    description: "Get current lesson details and objectives",
    parameters: {},
  },
  {
    name: "getCurrentMilestone", 
    description: "Get current milestone student is working on",
    parameters: {},
  },
  {
    name: "getStudentProgress",
    description: "Get student's current progress and attempt count",
    parameters: {},
  },
  {
    name: "checkForMisconception",
    description: "Check if student's answer contains a common misconception",
    parameters: {
      type: "object",
      properties: {
        studentAnswer: { type: "string" }
      }
    }
  }
];
```

**When student starts a lesson**, the agent can call these tools to get context!

---

### **Step 3: Or Send Context as First Message**

Simpler approach: When lesson loads, send a **system message**:

```typescript
function startLesson(lesson: LessonData) {
  const contextMessage = {
    role: "user",
    parts: [{
      text: `[LESSON CONTEXT - Do not respond to this, just acknowledge]

Lesson: ${lesson.title}
Description: ${lesson.description}

Current Milestone: ${lesson.milestones[0].title}
Goal: ${lesson.milestones[0].description}
Keywords to listen for: ${lesson.milestones[0].keywords.join(', ')}

Please greet the student and introduce today's lesson on ${lesson.title}.`
    }]
  };
  
  client.send(contextMessage);
}
```

The agent reads this and understands the lesson context **without reconnecting**!

---

### **Step 4: Backend Multi-Agent Analysis**

When student speaks, send to backend:

```typescript
client.on('inputTranscription', async (text, isFinal) => {
  if (isFinal) {
    // Send to backend for analysis
    const analysis = await apiClient.analyze({
      transcription: text,
      isFinal: true,
      lessonContext: {
        lessonId: currentLesson.id,
        milestoneIndex: progress.currentMilestoneIndex,
        attempts: progress.attempts,
        timeOnMilestone: Date.now() - milestoneStartTime
      }
    });
    
    // If misconception detected, inject context
    if (analysis.misconception?.detected) {
      const contextUpdate = {
        role: "user",
        parts: [{
          text: `[PEDAGOGICAL INSIGHT - Use this to guide your next response]
          
Misconception detected: ${analysis.misconception.type}
Student said: "${text}"
Issue: ${analysis.misconception.evidence}
Corrective approach: ${analysis.misconception.intervention}

Please address this misconception gently in your response.`
        }]
      };
      
      client.send(contextUpdate);
    }
  }
});
```

---

## Benefits of This Approach

✅ **No reconnection needed** - Connection stays stable  
✅ **Dynamic updates** - Context changes without breaking connection  
✅ **Simpler** - Less complex state management  
✅ **More flexible** - Can update context anytime  
✅ **Backend analysis** - Multi-agent system runs server-side  
✅ **Tool calls** - Agent can request info as needed

---

## What We Need to Fix

### **1. Set Static System Prompt** (5 min)
```typescript
// apps/tutor-app/lib/state.ts
systemPrompt: SIMILI_SYSTEM_PROMPT, // Static, never changes
```

### **2. Remove Dynamic Prompt Logic** (10 min)
- Remove `PromptManager.generateSystemPrompt()` calls on lesson load
- Remove config updates on lesson change
- Remove reconnection logic

### **3. Send Lesson Context as Message** (15 min)
```typescript
function loadLesson(lesson: LessonData) {
  orchestrator.setLesson(lesson);
  
  // Send lesson context to connected agent
  if (connected) {
    client.send({
      role: "user", 
      parts: [{ text: formatLessonContext(lesson) }]
    });
  }
}
```

### **4. Tool Declarations for Agent** (20 min)
- Define tools for lesson/milestone/progress queries
- Implement tool call handlers
- Agent calls tools when it needs context

### **5. Backend Misconception Injection** (already done!)
- Backend API is ready (`/api/analyze`)
- Just need to send results back to agent as context

---

## Should We Pivot?

**Question**: Do you want me to:

**Option A**: Fix the current approach (dynamic system prompt with reconnection)  
- Will work but fragile
- Requires disconnect/reconnect on lesson change

**Option B**: Pivot to static prompt + dynamic context (what you described)  
- More stable
- Aligns with your original vision
- Takes ~1 hour to refactor

**Which approach do you prefer?**

---

I apologize for overcomplicating this. You had the right mental model all along. Let me know which way you want to go and I'll implement it properly.
