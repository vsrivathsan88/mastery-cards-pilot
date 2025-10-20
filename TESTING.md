# Testing Phase 3B: Browser Compatibility Fix

## Quick Start

### 1. Setup API Key

```bash
# Copy example and add your key
cp apps/api-server/.env.example apps/api-server/.env

# Edit and add your key
nano apps/api-server/.env
# GOOGLE_GENERATIVE_AI_API_KEY=your_actual_key_here
```

### 2. Start Servers

```bash
pnpm dev
```

**Expected Output:**
```
[API] ╔════════════════════════════════════════════╗
[API] ║  Simili API Server - Child-Safe Backend   ║
[API] ╠════════════════════════════════════════════╣
[API] ║  Port: 4000                                ║
[API] ║  Environment: development                  ║
[API] ║  Privacy: Enabled                          ║
[API] ║  Encryption: Active                        ║
[API] ╚════════════════════════════════════════════╝
[API] ✓ Security middleware active
[API] ✓ Rate limiting enabled
[API] ✓ Privacy filters active
[API] ✓ Anonymous sessions enabled

[APP] VITE v6.4.0  ready in 427 ms
[APP] ➜  Local:   http://localhost:3000/
```

### 3. Test Frontend (Critical Check)

1. **Open browser**: http://localhost:3000
2. **Open DevTools Console**: `Cmd+Option+J` (Mac) or `F12` (Windows)
3. **Check for errors**:

**❌ OLD ERRORS (Should NOT see these):**
```
Uncaught SyntaxError: The requested module 'p-queue' does not provide an export named 'default'
Uncaught Error: winston requires Node.js modules
```

**✅ EXPECTED (Should see this):**
```javascript
[AgentOrchestrator] Initialized (Browser Mode - Multi-agent via API)
```

### 4. Test Backend API

```bash
# Test 1: Health Check
curl http://localhost:4000/api/health

# Expected:
# {"status":"ok","timestamp":1729195200000,"activeSessions":0}

# Test 2: Create Session
curl -X POST http://localhost:4000/api/session \
  -H "Content-Type: application/json"

# Expected:
# {"sessionId":"anon_lkj4h2_5g9d8f","createdAt":1729195200123}
```

---

## Detailed Testing Checklist

### ✅ Build Tests

```bash
# Clean build
pnpm clean
pnpm install
pnpm build

# Should complete without errors
# Check bundle sizes:
# - packages/agents: Should build successfully
# - apps/api-server: Should build successfully
# - apps/tutor-app: Should build ~528 KB (NOT 1389 KB)
```

### ✅ Browser Console Tests

1. Start dev servers: `pnpm dev`
2. Open: http://localhost:3000
3. Open Console
4. Look for initialization messages:

```javascript
// ✅ Expected messages:
[AgentOrchestrator] Initialized (Browser Mode - Multi-agent via API)

// ❌ Should NOT see:
// - Any p-queue errors
// - Any winston errors
// - Any LangGraph errors
// - Any @langchain errors
```

### ✅ Network Tests

1. Open Network tab in DevTools
2. Filter: `api`
3. Should see NO requests yet (API only called during lesson)

### ✅ Backend API Tests

```bash
# Test all endpoints
curl -v http://localhost:4000/api/health
curl -X POST http://localhost:4000/api/session
curl -X POST http://localhost:4000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test_123",
    "transcription": "I think we have one half",
    "isFinal": true
  }'

# All should return JSON (no errors)
```

---

## Common Issues & Fixes

### Issue 1: Still seeing p-queue errors

**Cause**: Browser cache or old build  
**Fix**:
```bash
# 1. Clear browser cache (Cmd+Shift+R)
# 2. Rebuild from scratch
pnpm clean
rm -rf node_modules
pnpm install
pnpm build
pnpm dev
```

### Issue 2: Backend import errors

**Error**: `Cannot find module '@simili/agents'`  
**Fix**:
```bash
# Build agents package first
cd packages/agents
pnpm build
cd ../..
pnpm build
```

### Issue 3: API server won't start

**Error**: `Missing GOOGLE_GENERATIVE_AI_API_KEY`  
**Fix**:
```bash
# Make sure .env exists with key
ls apps/api-server/.env
cat apps/api-server/.env | grep GOOGLE_GENERATIVE_AI_API_KEY
```

### Issue 4: Frontend blank/white screen

**Fix**:
1. Check console for errors
2. Verify both servers running
3. Check Vite proxy configuration:
```typescript
// apps/tutor-app/vite.config.ts should have:
proxy: {
  '/api': {
    target: 'http://localhost:4000',
    changeOrigin: true,
  },
}
```

---

## Success Indicators

### ✅ Phase 3B is working if:

1. **Build succeeds** without errors
2. **Bundle size** is ~528 KB (not 1389 KB)
3. **No p-queue errors** in browser console
4. **Backend starts** and shows security banner
5. **Frontend loads** without errors
6. **API endpoints respond** with JSON

### ❌ Phase 3B needs fixing if:

1. **p-queue errors** still appear
2. **winston/Node errors** in browser
3. **Backend won't build** (import errors)
4. **Bundle size still large** (>1000 KB)

---

## Next Phase (After Success)

Once all tests pass, proceed to **Phase 3C**:

1. Wire `use-live-api.ts` to use backend API
2. Call `/api/analyze` on final transcriptions
3. Pass analysis results to ContextManager
4. Test end-to-end with voice

---

## Manual Test Script

Run this after servers start:

```bash
# Save as test-phase3b.sh
echo "Testing Phase 3B..."

# Test 1: Backend health
echo "\n1. Backend Health Check:"
curl -s http://localhost:4000/api/health | jq '.'

# Test 2: Create session
echo "\n2. Creating Session:"
SESSION_ID=$(curl -s -X POST http://localhost:4000/api/session | jq -r '.sessionId')
echo "Session ID: $SESSION_ID"

# Test 3: Analyze (will fail without lesson, but should not error)
echo "\n3. Test Analysis:"
curl -s -X POST http://localhost:4000/api/analyze \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION_ID\",\"transcription\":\"test\",\"isFinal\":true}" | jq '.'

echo "\n✅ Backend tests complete!"
echo "Now check browser console at http://localhost:3000"
```

---

**Last Updated**: October 16, 2024  
**Status**: Ready for testing ✅
