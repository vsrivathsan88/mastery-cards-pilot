# How to Start the Backend Server

## Quick Start

```bash
# Terminal 1: Start backend (required for agent analysis)
cd apps/api-server
npm run dev

# Terminal 2: Start frontend  
cd apps/tutor-app
npm run dev
```

## Setup (First Time Only)

### 1. Create Environment File

Create `apps/api-server/.env`:

```env
# Required: Gemini API Key for agent classifiers
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here

# Optional: Server port (default: 4000)
PORT=4000
```

### 2. Install Dependencies

```bash
cd apps/api-server
npm install
```

## Start the Server

```bash
cd apps/api-server
npm run dev
```

**Expected Output**:
```
[API Server] 🚀 Starting...
[API Server] 📡 Listening on port 4000
[API Server] ✓ Ready to handle requests
```

## Verify It's Working

```bash
# Health check
curl http://localhost:4000/api/health

# Should return:
{"status":"healthy","timestamp":1234567890}
```

## What the Backend Does

The backend server runs the multi-agent system that analyzes student responses:

1. **Emotional Classifier** - Detects frustration, confusion, engagement
2. **Misconception Classifier** - Identifies misunderstandings
3. **Prerequisite Detector** - Checks for knowledge gaps

These insights are sent to:
- **Teacher Panel** - Real-time monitoring
- **Gemini Agent** - Adapts teaching approach

## Troubleshooting

### Port Already in Use

```bash
# Find what's using port 4000
lsof -ti:4000

# Kill the process
kill $(lsof -ti:4000)
```

### Missing API Key

```
Error: Missing GOOGLE_GENERATIVE_AI_API_KEY
```

**Solution**: Create `.env` file with your API key (see Setup step 1)

### Module Not Found

```bash
# Reinstall dependencies
cd apps/api-server
rm -rf node_modules
npm install
```

## Development Mode

The server uses `tsx watch` which automatically restarts when you edit files in `apps/api-server/src/`.

**Hot reload enabled** for:
- Routes (`src/routes/*.ts`)
- Services (`src/services/*.ts`)
- Middleware (`src/middleware/*.ts`)

## Production Build

```bash
cd apps/api-server
npm run build  # Compiles TypeScript to dist/
npm start      # Runs compiled JavaScript
```

## Architecture

```
Frontend (tutor-app:5173)
    │
    │ POST /api/analyze
    ▼
Backend (api-server:4000)
    │
    ├─ EmotionalClassifier
    ├─ MisconceptionClassifier  
    └─ PrerequisiteDetector
    │
    ▼ Returns insights
Teacher Panel + Gemini Agent
```

## Related Files

- `apps/api-server/src/index.ts` - Server entry point
- `apps/api-server/src/routes/analyze.ts` - Analysis endpoint
- `apps/tutor-app/lib/api-client.ts` - Frontend client
- `apps/tutor-app/hooks/media/use-live-api.ts` - Calls backend
