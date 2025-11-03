# Agent Architecture Overview

## Current Setup (No Separate Backend Server Needed)

### Architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                     pnpm dev                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────┐      ┌─────────────────────┐      │
│  │   API Server        │      │   Frontend (Vite)   │      │
│  │   Port 4000         │      │   Port 5173         │      │
│  └─────────────────────┘      └─────────────────────┘      │
│           │                             │                    │
│           │                             │                    │
│           ▼                             ▼                    │
│  ┌─────────────────────┐      ┌─────────────────────┐      │
│  │  Vision API         │      │  AgentService       │      │
│  │  /api/vision/analyze│      │  (Browser-side)     │      │
│  │                     │      │                     │      │
│  │  - Gemini Vision    │      │  - EmotionalClass.  │      │
│  │  - Canvas analysis  │      │  - MisconceptClass. │      │
│  │  - Image caption    │      │  - PrerequisiteDet. │      │
│  └─────────────────────┘      │  - VisionService    │      │
│                                └─────────────────────┘      │
│                                         │                    │
│                                         ▼                    │
│                                ┌─────────────────────┐      │
│                                │  Gemini Live API    │      │
│                                │  (WebSocket)        │      │
│                                └─────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## What Runs Where:

### Frontend (tutor-app) - Port 5173
**Agents run IN THE BROWSER:**
- `AgentService` (apps/tutor-app/services/AgentService.ts)
  - Orchestrates all agent analysis
  - Calls Gemini API directly from browser
  - EmotionalClassifier
  - MisconceptionClassifier  
  - PrerequisiteDetector
  - VisionService (calls backend API)

**Why browser-side?**
- Real-time analysis (no network latency)
- Direct Gemini Live WebSocket connection
- Immediate UI updates
- Lower backend load

### API Server (api-server) - Port 4000
**Only handles vision analysis:**
- `/api/vision/analyze` endpoint
  - Takes canvas snapshot + lesson image
  - Calls Gemini Vision API
  - Returns detailed analysis
  
**Why backend for vision?**
- Large image processing
- Gemini Vision multimodal API
- Better error handling

## What `pnpm dev` Starts:

```bash
pnpm dev
```

This runs:
1. **API Server** (port 4000)
   - Express backend
   - Vision analysis endpoint
   - Health checks, session management
   
2. **Frontend** (port 5173)
   - Vite dev server
   - React app with agents running in browser
   - Gemini Live WebSocket connection

**That's it!** No separate agent backend server is needed.

## Agent Execution Flow:

### When Student Speaks:

1. **Audio → Gemini Live** (WebSocket, browser)
2. **Transcription received** in StreamingConsole
3. **AgentService.analyzeTranscription()** called
4. **Agents run in parallel** (browser-side):
   - EmotionalClassifier → Gemini API
   - MisconceptionClassifier → Gemini API
   - (PrerequisiteDetector if needed)
5. **Context updated** in ContextManager
6. **UI updates** (badges, teacher panel)
7. **PromptBuilder creates update**
8. **GenAILiveClient.sendContextUpdate()** to Gemini
9. **Gemini adapts response** based on context

### When Student Draws:

1. **Canvas change detected**
2. **Snapshot captured** (base64 image)
3. **VisionService.analyzeCanvas()** called
4. **Backend API called**: POST /api/vision/analyze
5. **Gemini Vision analyzes**:
   - Canvas description
   - Stroke details
   - Lesson image caption
6. **Vision context updated**
7. **Sent to Gemini Live** as context update
8. **Tutor references drawing** in response

## Environment Variables Needed:

### Frontend (.env in apps/tutor-app):
```bash
GEMINI_API_KEY=your_api_key_here
API_URL=http://localhost:4000  # Optional, defaults to localhost:4000
```

### Backend (.env in apps/api-server):
```bash
GEMINI_API_KEY=your_api_key_here
PORT=4000  # Optional
NODE_ENV=development  # Optional
```

## Files in Stash (agent-setup branch):

The stash contains:
- `packages/agents/src/server.ts` - A separate backend server (NOT USED)
- `packages/agents/src/subagents/VisionAnalyzer.ts` - Old vision implementation

**These are NOT needed** in the current architecture. We use:
- Browser-side agents for real-time analysis
- Backend vision API endpoint for image processing

## Summary:

✅ **`pnpm dev` starts everything you need**
✅ **Agents run in browser** (faster, real-time)
✅ **Vision analysis in backend** (better for images)
✅ **No separate agent server** required

---

## If You Want a Separate Agent Backend (Future):

You could move agents to a dedicated backend server:
- Better control over API keys
- Centralized rate limiting
- Reduced browser load
- But adds network latency

For now, the browser-side approach works great!
