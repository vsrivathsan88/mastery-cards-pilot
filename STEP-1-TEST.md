# Step 1: Static System Prompt - Test Plan

## What We Changed

1. ✅ Created `static-system-prompt.ts` with the complete Simili tutor prompt
2. ✅ Exported `SIMILI_SYSTEM_PROMPT` from agents package
3. ✅ Set as default in `useSettings` store
4. ✅ Build passes

---

## Test Plan

### Test 1: Verify Prompt Loads on App Start

**Steps:**
1. Start dev server: `pnpm dev`
2. Open http://localhost:3000
3. Open browser DevTools Console

**Expected Console Logs:**
```
[StreamingConsole] 🔍 SYSTEM PROMPT FROM STATE: You are Simili, a warm and encouraging AI math tutor...
[StreamingConsole] 🔍 Setting config with prompt length: 2XXX
```

✅ **Pass Criteria**: 
- Prompt length should be **~2000-3000 chars** (not 75!)
- Prompt preview should start with **"You are Simili, a warm and encouraging AI math tutor"**

---

### Test 2: Verify in Sidebar

**Steps:**
1. With app running, click **☰ Hamburger menu** (top left)
2. Scroll down to **"System Instruction"** section
3. Read the content in the textarea

**Expected Content:**
```
You are Simili, a warm and encouraging AI math tutor for elementary students.

# Your Personality
- Warm, patient, and enthusiastic about learning
...
```

✅ **Pass Criteria**:
- Should show full Simili prompt
- Should NOT show "You are a helpful and friendly AI assistant"

---

### Test 3: Verify Prompt Does NOT Change on Lesson Load

**Steps:**
1. With app running, note the prompt length in console
2. Click **"Start: Understanding One Half 🍫"**
3. Check console logs

**Expected Behavior:**
- Should see: `[AgentOrchestrator] Lesson loaded`
- Should NOT see: `[StreamingConsole] Setting config` again
- Prompt length should remain the same (~2000-3000)

✅ **Pass Criteria**:
- Config is NOT recreated when lesson loads
- System prompt stays static

---

### Test 4: Connect and Verify Agent Uses Static Prompt

**Steps:**
1. After loading lesson, click **Connect** button (or it auto-connects)
2. Wait for connection
3. Say "Hello" into microphone

**Expected Logs:**
```
[useLiveApi] Connecting with config: {promptLength: 2XXX, promptPreview: "You are Simili..."}
[useLiveApi] Connected successfully! {promptLength: 2XXX, hasTranscription: true}
[AgentOrchestrator] Input transcription {text: "Hello", isFinal: true}
```

**Expected Agent Response:**
Agent should respond as **Simili tutor** (warm, encouraging), not generic assistant.

Example: 
- ✅ "Hi there! I'm so excited to work on math with you today!"
- ❌ "Hello! How can I help you?"

✅ **Pass Criteria**:
- Connection successful with static prompt
- Agent personality matches Simili tutor
- Transcription working

---

## Run These Tests Now

**Terminal:**
```bash
cd /Users/vsrivathsan/Documents/simili-monorepo-v1
pnpm dev
```

**Browser:**
1. Open http://localhost:3000
2. Open DevTools Console
3. Run Tests 1-4 above

---

## What to Report

For each test, report:
- ✅ PASS or ❌ FAIL
- Any unexpected behavior
- Console logs if test fails

**Once all 4 tests pass, we'll move to Step 2.**

---

## Expected Results Summary

✅ Test 1: Static prompt loads (~2000-3000 chars)  
✅ Test 2: Sidebar shows full Simili prompt  
✅ Test 3: Prompt doesn't change on lesson load  
✅ Test 4: Agent uses Simili personality

If all pass → Ready for Step 2: Dynamic Lesson Context
