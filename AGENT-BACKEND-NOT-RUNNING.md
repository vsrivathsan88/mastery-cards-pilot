# Agent Backend Server Not Running - Root Cause Analysis

**Status**: 🔴 **CRITICAL ISSUE FOUND**

## TL;DR

**The Problem**: The backend API server (`apps/api-server`) that runs the agent classifiers is **NOT RUNNING**, which means:
- ❌ Emotional analysis doesn't happen
- ❌ Misconception detection doesn't work  
- ❌ Agent insights never reach the teacher panel
- ❌ The AI tutor never changes its approach based on student state

**The Solution**: Start the backend server on port 4000

---

## How the System is Supposed to Work

```
┌─────────────┐
│   Student   │
│   speaks    │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Frontend (tutor-app)                                     │
│  ┌────────────────────────────────────────────────┐      │
│  │ use-live-api.ts (line 483)                     │      │
│  │                                                 │      │
│  │ apiClient.analyze({                            │      │
│  │   transcription: text,                         │      │
│  │   lessonContext: { ... }                       │      │
│  │ })                                              │      │
│  └────────────┬───────────────────────────────────┘      │
│               │ POST /api/analyze                        │
└───────────────┼──────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────────────┐
│  Backend API Server (apps/api-server) PORT 4000          │
│  🔴 NOT RUNNING                                           │
│  ┌────────────────────────────────────────────────┐      │
│  │ routes/analyze.ts                              │      │
│  │                                                 │      │
│  │ → EmotionalClassifier.analyze()                │      │
│  │ → MisconceptionClassifier.analyze()            │      │
│  │ → Returns insights                             │      │
│  └────────────┬───────────────────────────────────┘      │
│               │                                           │
└───────────────┼───────────────────────────────────────────┘
                │
                ▼ (never happens)
┌──────────────────────────────────────────────────────────┐
│  Frontend receives analysis                               │
│  ┌────────────────────────────────────────────────┐      │
│  │ useTeacherPanel.syncAgentInsights()            │      │
│  │ → Updates teacher panel with insights          │      │
│  │                                                 │      │
│  │ formatMisconceptionFeedback()                  │      │
│  │ → Sends to Gemini agent                        │      │
│  │ → Agent changes approach                       │      │
│  └────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────┘
```

---

## Evidence

### 1. API Client Configuration
**File**: `apps/tutor-app/lib/api-client.ts` (line 44)
```typescript
constructor(baseUrl: string = '/api') {
  this.baseUrl = baseUrl;
}
```
☑️ Client configured correctly to call `/api/analyze`

### 2. Frontend Calls Backend
**File**: `apps/tutor-app/hooks/media/use-live-api.ts` (line 483)
```typescript
const analysis = await apiClient.analyze({
  transcription: text,
  isFinal: true,
  lessonContext: {
    lessonId: currentLesson.id,
    milestoneIndex: progress?.currentMilestoneIndex || 0,
    attempts: progress?.attempts || 0,
    timeOnMilestone: progress?.timeOnMilestone || 0,
  },
});
```
☑️ Frontend code calls the API correctly

### 3. Backend Server Exists
**File**: `apps/api-server/src/index.ts`
```typescript
const app = express();
const PORT = process.env.PORT || 4000;
// ... routes setup ...
app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
});
```
☑️ Backend server exists and would run on port 4000

### 4. Backend NOT Running
**Check**: `lsof -ti:4000`
```
Port 4000 not in use
```
🔴 **PROBLEM**: No process listening on port 4000

---

## What Happens Now (Without Backend)

1. **Frontend makes API call** to `http://localhost:5173/api/analyze` (or wherever Vite dev server is)
2. **Vite dev server returns 404** (no backend proxy configured)
3. **Frontend catches error** and continues without insights
4. **Teacher panel never updates** - no data to display
5. **Agent never adapts** - no misconception/emotional feedback sent

---

## How to Fix

### Option 1: Start the Backend Server (Recommended)

```bash
# Terminal 1: Start backend server
cd apps/api-server
npm install
npm run dev  # or: npm start

# Terminal 2: Start frontend
cd apps/tutor-app  
npm run dev
```

**Required Environment Variable**:
```bash
# In apps/api-server/.env
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

### Option 2: Configure Vite Proxy (if not already done)

**File**: `apps/tutor-app/vite.config.ts`
```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
```

### Option 3: Use Frontend-Only Mode (Fallback)

The system has `AgentService.ts` in the frontend that can run agents directly in the browser, but it requires refactoring to not depend on the backend API call.

**Current Issue**: `use-live-api.ts` always calls `apiClient.analyze()` and expects a response. We'd need to:
1. Check if backend is available (health check)
2. Fall back to frontend `AgentService` if backend unavailable
3. Update teacher panel from frontend analysis

---

## Testing After Fix

1. **Start backend server**: `cd apps/api-server && npm run dev`
2. **Verify it's running**:
   ```bash
   curl http://localhost:4000/api/health
   # Should return: {"status":"healthy"}
   ```
3. **Start frontend**: `cd apps/tutor-app && npm run dev`
4. **Open teacher panel** and speak to Pi
5. **Check console logs**:
   ```
   [useLiveApi] 🔍 Sending to backend for analysis...
   [useLiveApi] ✅ Backend analysis received: {...}
   [useLiveApi] 📊 Agent insights synced to teacher panel
   ```
6. **Verify teacher panel updates** with emotional state and misconceptions

---

## Files Involved

### Backend (Not Running)
- `apps/api-server/src/index.ts` - Express server
- `apps/api-server/src/routes/analyze.ts` - Analysis endpoint
- `apps/api-server/src/services/session-service.ts` - Session management

### Frontend (Working)
- `apps/tutor-app/lib/api-client.ts` - API client
- `apps/tutor-app/hooks/media/use-live-api.ts` - Calls backend
- `apps/tutor-app/lib/teacher-panel-store.ts` - Receives insights

### Agents (Backend Only)
- `packages/agents/src/subagents/EmotionalClassifier.ts` - Runs on backend
- `packages/agents/src/subagents/MisconceptionClassifier.ts` - Runs on backend
- `packages/agents/src/graph/agent-graph.ts` - Orchestrates agents

---

## Next Steps

1. ✅ **Verify backend package.json has start scripts**
2. ✅ **Check for .env file with API key**
3. ✅ **Start backend server**
4. ✅ **Test with frontend**
5. ✅ **Confirm teacher panel updates**
6. ✅ **Verify agent changes behavior**

---

## Alternative: Frontend-Only Architecture

If you don't want to run a backend server, you could refactor to:

1. Import agent classifiers directly in frontend
2. Run agents in browser (slower, exposes API key)
3. Update `use-live-api.ts` to call agents directly instead of API

**Trade-offs**:
- ✅ No backend server needed
- ✅ Simpler deployment
- ❌ API key exposed in frontend bundle
- ❌ Slower (no parallel processing)
- ❌ Blocks UI during analysis

The current architecture with backend is better for production.
