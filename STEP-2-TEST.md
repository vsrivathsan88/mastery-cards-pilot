# Step 2: Dynamic Lesson Context via Messages - Test Plan

## What We Changed

1. ✅ Created `lesson-context-formatter.ts` with functions to format lesson info as messages
2. ✅ Added `sendTextMessage()` method to GenAILiveClient
3. ✅ Updated `loadLesson()` to send context as message (not system prompt)
4. ✅ System prompt stays static (Simili tutor personality)
5. ✅ Lesson context sent after connection via message
6. ✅ Build passes

---

## Test Plan

### Test 1: System Prompt Stays Static

**Steps:**
1. Start: `pnpm dev`
2. Open http://localhost:3000
3. Check console logs

**Expected:**
```
[StreamingConsole] 🔍 SYSTEM PROMPT FROM STATE: You are Simili, a warm and encouraging AI math tutor...
[StreamingConsole] 🔍 Setting config with prompt length: 2XXX
```

✅ **Pass**: Prompt is still ~2000-3000 chars (static Simili prompt)

---

### Test 2: Lesson Loads WITHOUT Changing Prompt

**Steps:**
1. With app running, click **"Start: Understanding One Half 🍫"**
2. Check console logs

**Expected Logs:**
```
[WelcomeScreen] 📚 Starting lesson...
[useLiveApi] 📚 Loading lesson: Understanding One Half with Chocolate
[useLiveApi] 📝 Formatted lesson context: [LESSON CONTEXT - Please read and acknowledge...
[useLiveApi] ⏳ Will send lesson context after connection
[WelcomeScreen] ✅ Lesson ready! Click Connect to begin.
```

✅ **Pass Criteria**:
- Lesson loads successfully
- Formatted lesson context message created
- Marked as pending (will send after connect)
- System prompt does NOT change (no new StreamingConsole config log)

---

### Test 3: Connect Sends Lesson Context

**Steps:**
1. After loading lesson (Test 2), click **Connect** button
2. Watch console logs carefully

**Expected Logs:**
```
[useLiveApi] 🔌 Connecting...
[AgentOrchestrator] Connection opened
[useLiveApi] ✅ Connected successfully!
[useLiveApi] ✉️ Sending lesson context after connection...
[useLiveApi] ✅ Lesson context sent!
```

✅ **Pass Criteria**:
- Connection successful
- Lesson context sent as message after connection
- Agent receives the lesson information

---

### Test 4: Agent Has Lesson Context

**Steps:**
1. After connecting (Test 3), say **"Hello"** into microphone
2. Listen to agent's response

**Expected Agent Behavior:**
Agent should:
- ✅ Greet warmly (Simili personality)
- ✅ Mention the lesson: "Understanding One Half with Chocolate"
- ✅ Ask about fractions or chocolate bars
- ✅ Show it knows the lesson context

Example good response:
> "Hi there! I'm so excited to work with you today! We're going to explore fractions together using a chocolate bar. Have you ever split a chocolate bar before?"

❌ **Fail if**: Agent gives generic greeting without mentioning lesson

---

### Test 5: Alternate Flow - Connect First, Then Load Lesson

**Steps:**
1. Refresh page
2. Click **Connect** button FIRST (before loading lesson)
3. Wait for connection
4. Then click **"Start: Understanding One Half"**
5. Check console

**Expected Logs:**
```
[useLiveApi] 🔌 Connecting...
[useLiveApi] ✅ Connected successfully!

(user clicks Start Lesson)

[useLiveApi] 📚 Loading lesson...
[useLiveApi] 📝 Formatted lesson context...
[useLiveApi] ✉️ Sending lesson context to connected agent...
[useLiveApi] ✅ Lesson context sent!
```

✅ **Pass**: Lesson context sent immediately when already connected

---

### Test 6: Check UI Conversation Log

**Steps:**
1. After Test 4, check the conversation transcript in the UI
2. Look for lesson start message

**Expected in UI:**
- Should see: "📚 Starting lesson: Understanding One Half with Chocolate"
- Should see your "Hello" transcribed
- Should see agent's response mentioning the lesson

✅ **Pass**: Lesson context visible in conversation

---

## What to Report

For each test:
- ✅ PASS or ❌ FAIL
- Console logs if unexpected
- Agent's first response (Test 4)

---

## Expected Full Flow

### Perfect Test Sequence:

```
1. Page loads
   → Static Simili prompt set (2500 chars)

2. Click "Start Lesson"
   → Lesson loaded
   → Context formatted
   → Marked as pending

3. Click Connect
   → Connection opens
   → Lesson context sent as message
   → Agent receives lesson info

4. Say "Hello"
   → Agent responds with lesson context
   → Mentions fractions/chocolate bar
   → Warm Simili personality
```

---

## Key Success Indicators

✅ System prompt never changes (~2500 chars always)  
✅ Lesson context sent as MESSAGE not system prompt  
✅ No reconnection when lesson loads  
✅ Agent knows lesson context after connection  
✅ Stable connection throughout

---

**Run these tests and report results!**

If all pass → Step 2 is complete, ready for Step 3.
