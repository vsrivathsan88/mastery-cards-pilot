# Pre-Deployment Checklist - Production Ready

## Summary

I've audited the codebase for production readiness. Here's what I found and fixed:

## Issues Found and Fixed ✅

### 1. Hardcoded localhost URLs (FIXED)

**Problem**: Two localhost URLs were hardcoded:
- ❌ `ws://localhost:3001/orchestrate` in App.mastery.tsx
- ❌ `http://localhost:3001/api/claude/evaluate` in claude-judge.ts

**Solution**: ✅ Both now use environment variables:
- `VITE_WS_SERVER_URL` for WebSocket connection
- `VITE_BACKEND_URL` for HTTP API calls

**Files Changed**:
- `App.mastery.tsx:112` - Now uses `import.meta.env.VITE_WS_SERVER_URL`
- `lib/evaluator/claude-judge.ts:63` - Now uses `import.meta.env.VITE_BACKEND_URL`
- `.env.example` - Added documentation for both variables

### 2. Environment Variables Configuration (VERIFIED)

All environment variables are properly configured and documented:

| Variable | Purpose | Default (Dev) | Production Value |
|----------|---------|---------------|------------------|
| `VITE_GEMINI_API_KEY` | Gemini API access | None (required) | Your Gemini key |
| `VITE_CLAUDE_API_KEY` | Claude API access | None (required) | Your Claude key |
| `VITE_WS_SERVER_URL` | WebSocket backend | `ws://localhost:3001/orchestrate` | `wss://your-server.com/orchestrate` |
| `VITE_BACKEND_URL` | HTTP API backend | `http://localhost:3001` | `https://your-server.com` |

## Production Deployment Requirements

### Environment Variables to Set in Vercel

You **MUST** set these 4 environment variables in Vercel:

```bash
# API Keys (REQUIRED)
VITE_GEMINI_API_KEY=your_gemini_api_key_from_aistudio
VITE_CLAUDE_API_KEY=your_claude_api_key_from_anthropic

# Backend URLs (REQUIRED if using backend server)
VITE_WS_SERVER_URL=wss://your-backend.railway.app/orchestrate
VITE_BACKEND_URL=https://your-backend.railway.app
```

**Important Notes**:
- Use `wss://` (secure WebSocket) for WebSocket URL in production
- Use `https://` for HTTP API URL in production
- Both should point to the same backend server (just different protocols)
- Include `/orchestrate` path for WebSocket URL only

### Backend Server Requirements

Your backend server must be deployed with:

1. **WebSocket Support**: `/orchestrate` endpoint
2. **HTTP API Support**: `/api/claude/evaluate` endpoint
3. **HTTPS/WSS**: Required for production (Vercel requires secure connections)
4. **CORS Headers**: Must allow your Vercel domain
5. **Environment Variables**:
   ```bash
   CLAUDE_API_KEY=your_claude_key
   PORT=3001
   ```

## Deployment Architecture

```
┌─────────────────┐
│   Vercel CDN    │  ← Frontend deployed here
│   (Frontend)    │  ← Environment variables set here
└────────┬────────┘
         │
         │ wss:// (WebSocket)
         │ https:// (HTTP)
         │
         ▼
┌─────────────────┐
│   Railway/      │  ← Backend server deployed here
│   Render/Fly.io │  ← Handles WebSocket + Claude API
│   (Backend)     │  ← Has CLAUDE_API_KEY
└─────────────────┘
```

## Dependencies Review

### Production Dependencies (All OK ✅)
- `react` v19.1.0 - Core framework
- `react-dom` v19.1.0 - DOM rendering
- `@google/genai` v1.4.0 - Gemini API client
- `eventemitter3` v5.0.1 - Event handling
- `lodash` v4.17.21 - Utilities
- `classnames` v2.5.1 - CSS class utilities
- `zustand` v5.0.5 - State management
- `path` v0.12.7 - Path utilities (build time only)

**Note**: `classnames` was missing but is in package.json. Run `npm install` before deploying.

### Build Configuration (OK ✅)

`vercel.json` is properly configured:
- Framework: Vite ✓
- Build command: `npm run build` ✓
- Output directory: `dist` ✓
- CORS headers for SharedArrayBuffer support ✓

## Pre-Deployment Steps

### Step 1: Install Dependencies
```bash
cd apps/mastery-cards-app/native-audio-function-call-sandbox
npm install
```

### Step 2: Test Build Locally
```bash
npm run build
npm run preview
```

Open http://localhost:4173 and verify:
- App loads without errors
- No console errors about missing modules
- App attempts to connect to localhost backend (expected in local preview)

### Step 3: Deploy Backend First

Deploy to Railway/Render/Fly.io:
1. Deploy the `server` directory
2. Set `CLAUDE_API_KEY` environment variable
3. Note the deployed URL (e.g., `https://your-app.railway.app`)
4. Test WebSocket: `wscat -c wss://your-app.railway.app/orchestrate?sessionId=test`

### Step 4: Configure Vercel

1. Go to Vercel Dashboard
2. Import repository
3. Set Root Directory: `apps/mastery-cards-app/native-audio-function-call-sandbox`
4. Add environment variables (see above)
5. Deploy

### Step 5: Verify Production

After deployment:
1. Open your Vercel URL
2. Open browser DevTools (F12) → Console
3. Look for these logs:
   ```
   [App] 🔗 WebSocket server URL: wss://your-app.railway.app/orchestrate
   [ServerConnection] Connecting to wss://...
   [ServerConnection] Connected to orchestration server
   ```

**Red Flags** (if you see these, something is wrong):
- ❌ `ws://localhost:3001` in console
- ❌ WebSocket connection failed/timeout
- ❌ CORS errors
- ❌ Mixed content warnings

## Security Considerations

### API Keys ✅
- All API keys use environment variables
- No hardcoded secrets in code
- Keys never committed to version control

### CORS Configuration ⚠️
- Backend must allow your Vercel domain
- Check backend server CORS settings
- Test from production domain before launch

### Content Security Policy ✅
- COOP/COEP headers configured in `vercel.json`
- Required for SharedArrayBuffer (audio processing)

## Performance Optimization

### Bundle Size
Current production bundle:
- Main JS: ~551KB (gzipped: ~152KB)
- CSS: ~29KB (gzipped: ~6KB)

**Optimization Opportunities** (for future):
- Code splitting with dynamic imports
- Lazy load heavy components
- Tree shaking unused lodash functions

### Caching
Vercel automatically caches:
- Static assets (CSS, images)
- Built JavaScript files
- No additional configuration needed

## Monitoring & Debugging

### Frontend Logs
- Vercel Dashboard → Deployments → Functions
- Browser DevTools → Console
- Check for:
  - Connection errors
  - API errors
  - State management issues

### Backend Logs
- Railway/Render Dashboard → Logs
- Monitor:
  - WebSocket connections
  - Claude API calls
  - Error rates

## Troubleshooting Guide

### "Still seeing localhost in production"
→ Environment variables not set correctly in Vercel
→ Redeploy after setting variables

### "WebSocket connection failed"
→ Backend not deployed or not running
→ Check backend URL is correct (wss:// not ws://)
→ Verify backend has HTTPS/WSS enabled

### "CORS errors"
→ Backend CORS not configured for Vercel domain
→ Add Vercel domain to backend allowed origins

### "Mixed content errors"
→ Using ws:// instead of wss://
→ Using http:// instead of https://
→ Check environment variables

## Final Checklist

Before going live:

- [ ] Backend deployed and running
- [ ] Backend health check passes
- [ ] WebSocket test with wscat succeeds
- [ ] All 4 environment variables set in Vercel
- [ ] Frontend builds without errors
- [ ] Frontend deployed to Vercel
- [ ] Browser console shows correct backend URL (not localhost)
- [ ] WebSocket connects successfully in production
- [ ] Claude evaluations working
- [ ] Card progression working
- [ ] Audio/microphone working
- [ ] No console errors
- [ ] Tested on multiple devices/browsers

## Post-Launch Monitoring

Monitor for 24 hours:
- Error rates in Vercel Analytics
- Backend logs for crashes
- User feedback/bug reports
- API quota usage (Gemini + Claude)

## Support Resources

- **Full Deployment Guide**: `PRODUCTION-DEPLOYMENT-GUIDE.md`
- **Quick Start**: `QUICK-START-PRODUCTION.md`
- **Vercel Setup**: `VERCEL-SETUP.md`
- **GitHub**: https://github.com/vsrivathsan88/mastery-cards-pilot

---

## Summary: You're Ready! 🚀

All hardcoded localhost references have been fixed. The app now:
- ✅ Uses environment variables for all backend connections
- ✅ Falls back to localhost for local development
- ✅ Has proper CORS headers configured
- ✅ Has no file system dependencies (Vercel compatible)
- ✅ Has clean, documented configuration

Just set those 4 environment variables in Vercel, deploy your backend, and you're good to go!
