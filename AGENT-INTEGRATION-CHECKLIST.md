# Agent Integration Troubleshooting Checklist

## Current Status: 🔴 Backend Server NOT Running

Run this to verify:
```bash
lsof -ti:4000 || echo "Backend NOT running - START IT NOW!"
```

---

## Step-by-Step Fix

### 1. Start the Backend Server (REQUIRED)

```bash
# Open new terminal window
cd /Users/vsrivathsan/Documents/simili-monorepo-v1/apps/api-server

# Start server
npm run dev
```

**Expected output:**
```
[API Server] 🚀 Starting...
[API Server] 📡 Listening on port 4000
```

**Verify it's running:**
```bash
curl http://localhost:4000/api/health
# Should return: {"status":"healthy"}
```

### 2. Verify Tools Are Enabled

Open browser console and check:
```javascript
// After page loads, check:
console.log('Tools:', window.useTools?.getState?.().tools)
// Should show 4 tools with isEnabled: true
```

### 3. Test the Flow Step-by-Step

**A. Backend Health Check:**
```bash
curl http://localhost:4000/api/health
```
✅ Should return `{"status":"healthy"}`

**B. Start Frontend:**
```bash
cd apps/tutor-app
npm run dev
```

**C. Open Browser Console and Watch For:**

When you speak, you should see:
```
[useLiveApi] 📝 Final transcription received: "hello"
[useLiveApi] 🔍 Sending to backend for analysis...
[useLiveApi] ✅ Backend analysis received: { hasEmotional: true, ... }
[useLiveApi] 📊 Agent insights synced to teacher panel
```

**D. Check Teacher Panel:**
- Click "📊 Teacher Panel" button
- Should show "Milestones", "Issues", etc.
- Should populate as you talk

**E. Check for Tool Calls:**

When Pi wants to show an image:
```
Triggering function call: **show_image**
```

---

## Common Issues

### Issue 1: Backend Not Running ❌ (CURRENT ISSUE)
**Symptom:** 
```
[useLiveApi] ❌ Backend analysis failed: TypeError: Failed to fetch
⚠️ Agent analysis unavailable (backend offline)
```

**Fix:** Start backend server (see Step 1)

### Issue 2: Tools Not Registered
**Symptom:** Agent never calls tools

**Check:**
```javascript
// In browser console
console.log(window.useTools.getState().tools)
```

**Should see:**
```javascript
[
  { name: "show_image", isEnabled: true, ... },
  { name: "mark_milestone_complete", isEnabled: true, ... },
  { name: "update_milestone_progress", isEnabled: true, ... },
  { name: "highlight_canvas_area", isEnabled: true, ... }
]
```

### Issue 3: Teacher Panel Not Updating
**Symptom:** Panel shows empty state even during lesson

**Check:**
```javascript
// In browser console
console.log(window.useTeacherPanel.getState())
// Should show currentSession, milestoneLogs, etc.
```

**Fix:** Make sure backend is running and returning data

### Issue 4: Agent Not Adapting Behavior
**Symptom:** Agent doesn't respond to misconceptions or emotional state

**Root Cause:** Backend analysis isn't happening OR feedback isn't being sent

**Check logs for:**
```
[useLiveApi] ⚠️ Misconception detected: ...
[useLiveApi] ✉️ Sending misconception feedback to agent...
[useLiveApi] ✅ Misconception feedback sent!
```

**If missing:** Backend isn't detecting issues or connection is closed

---

## Test Commands

### Full System Test

```bash
# Terminal 1: Backend
cd apps/api-server
npm run dev

# Terminal 2: Frontend  
cd apps/tutor-app
npm run dev

# Terminal 3: Test API
curl -X POST http://localhost:4000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-123",
    "transcription": "I think one half is bigger than one third",
    "isFinal": true,
    "lessonContext": {
      "lessonId": "equal-parts-challenge",
      "milestoneIndex": 0,
      "attempts": 1,
      "timeOnMilestone": 5000
    }
  }'
```

**Expected:** JSON response with emotional/misconception data

---

## Debugging Tips

### Enable Verbose Logging

In browser console:
```javascript
localStorage.debug = '*'
```

### Check Network Tab

1. Open DevTools → Network tab
2. Filter by "api"
3. Look for POST to `/api/analyze`
4. Should see 200 status with response data

### Check Console for Key Messages

**Successful flow:**
```
✅ [useLiveApi] Sending to backend for analysis...
✅ [useLiveApi] Backend analysis received: { hasEmotional: true }
✅ [useLiveApi] Agent insights synced to teacher panel
✅ [useLiveApi] Misconception detected: fraction-comparison-error
✅ [useLiveApi] Sending misconception feedback to agent...
```

**Failed flow (backend offline):**
```
❌ [useLiveApi] Backend analysis failed: TypeError: Failed to fetch
💡 Make sure backend server is running
```

---

## Quick Verification Script

Save this as `test-backend.sh`:

```bash
#!/bin/bash
echo "🔍 Checking backend server..."

if lsof -ti:4000 > /dev/null 2>&1; then
  echo "✅ Backend is running on port 4000"
  
  if curl -s http://localhost:4000/api/health > /dev/null 2>&1; then
    echo "✅ Backend is responding to requests"
    echo ""
    echo "Backend is ready! ✨"
  else
    echo "❌ Backend is running but not responding"
    echo "💡 Check server logs for errors"
  fi
else
  echo "❌ Backend is NOT running"
  echo ""
  echo "Start it with:"
  echo "  cd apps/api-server && npm run dev"
fi
```

Run: `bash test-backend.sh`
