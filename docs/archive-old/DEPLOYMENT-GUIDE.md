# Mastery Cards App - Vercel Deployment Guide

**Architecture:** Full-stack on Vercel (Frontend + Serverless Functions)

---

## 🎯 What We're Deploying

- **Frontend:** React + Vite app (static files)
- **Backend:** Vercel Serverless Function at `/api/claude-evaluate`
- **No separate backend server needed** ✅

---

## 🔐 STEP 1: Security - Rotate Claude API Key

**⚠️ CRITICAL:** The Claude API key in `/server/.env` was exposed.

1. Go to: https://console.anthropic.com
2. Delete the old exposed key (check your server/.env backup if needed)
3. Create new API key
4. **Save it** - you'll need it for Vercel

---

## 🚀 STEP 2: Deploy to Vercel

### A. Connect Repository

1. Go to: https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub repo
4. **Root Directory:** `apps/mastery-cards-app/apps/mastery-cards-app/native-audio-function-call-sandbox`
5. **Framework Preset:** Vite
6. Click "Continue"

### B. Configure Environment Variables

Add these in Vercel's environment variables section:

```
VITE_GEMINI_API_KEY=your_gemini_api_key_here
CLAUDE_API_KEY=your_new_claude_api_key_here
```

**Important Notes:**
- `VITE_GEMINI_API_KEY` - Frontend uses this (with VITE_ prefix)
- `CLAUDE_API_KEY` - Backend serverless function uses this (NO VITE_ prefix)
- Get Gemini key: https://aistudio.google.com/apikey
- Get Claude key: https://console.anthropic.com (use NEW rotated key)

### C. Build Settings (Should Auto-Detect)

Vercel will use settings from `vercel.json`:
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

If not auto-detected:
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### D. Deploy

1. Click "Deploy"
2. Wait 2-3 minutes for build
3. Get production URL: `https://your-app.vercel.app`

---

## ✅ STEP 3: Test Deployment

### Check Frontend
1. Open your Vercel URL: `https://your-app.vercel.app`
2. Open browser DevTools (F12) → Console
3. Look for:
   - ✅ "Orchestration mode: client-side (no backend server)"
   - ✅ No errors about missing backend
   - ❌ Should NOT see "ws://localhost:3001"

### Test Full Flow
1. Enter name → Start session
2. Speak/interact with Pi
3. Check evaluation happens (card progresses)
4. Swipe card → Next card loads
5. Complete session → Points awarded

### Check Serverless Function
1. In browser DevTools → Network tab
2. Look for request to `/api/claude-evaluate`
3. Should return 200 OK (not 404 or 500)
4. Response should have Claude evaluation data

---

## 🐛 Troubleshooting

### Build Fails: "Cannot resolve module"

**Problem:** Dependencies not installed

**Fix:**
```bash
# Locally test:
cd apps/mastery-cards-app/apps/mastery-cards-app/native-audio-function-call-sandbox
npm install
npm run build
```

If local build works, check Vercel build logs for specific error.

---

### API Error: 500 from /api/claude-evaluate

**Problem:** Claude API key not set or invalid

**Fix:**
1. Go to Vercel → Project Settings → Environment Variables
2. Verify `CLAUDE_API_KEY` is set (without VITE_ prefix)
3. Check key is valid at https://console.anthropic.com
4. Redeploy after changing env vars

---

### Frontend Error: "Failed to fetch /api/claude-evaluate"

**Problem:** Serverless function not deployed or wrong path

**Fix:**
1. Check `/api/claude-evaluate.ts` exists in repo
2. Vercel auto-detects `/api/*` folder as serverless functions
3. Check Vercel Functions tab to see if function deployed
4. Try redeploying

---

### CORS Errors

**Problem:** Cross-origin request blocked

**Fix:** Shouldn't happen since frontend and API are same domain. If it does:
1. Check you're calling `/api/claude-evaluate` (relative path)
2. Not calling `http://localhost:3001/api/...`
3. Check browser console for actual error

---

## 📊 Architecture Diagram

```
Browser
  ↓
Vercel Domain (https://your-app.vercel.app)
  ↓
  ├─→ / (Frontend - React App)
  │     └─→ dist/index.html
  │
  └─→ /api/claude-evaluate (Serverless Function)
        └─→ Calls Anthropic API with CLAUDE_API_KEY
```

**Key Points:**
- ✅ Everything on one domain (no CORS)
- ✅ Claude API key stays server-side
- ✅ No separate backend to manage
- ✅ Scales automatically

---

## 🎛️ Environment Variables Reference

| Variable | Where Used | Description |
|----------|-----------|-------------|
| `VITE_GEMINI_API_KEY` | Frontend | Voice AI (Gemini Live API) |
| `CLAUDE_API_KEY` | Serverless Function | Mastery evaluation (server-side only) |

**Not Needed Anymore:**
- ❌ `VITE_BACKEND_URL` - Using same domain
- ❌ `VITE_WS_SERVER_URL` - Client-side orchestration
- ❌ `VITE_CLAUDE_API_KEY` - Moved to server-side

---

## 🔄 Redeploying

### Automatic Deploys
- Every push to `main` branch triggers automatic deployment
- Vercel builds and deploys in ~2-3 minutes

### Manual Deploys
1. Go to Vercel dashboard
2. Select your project
3. Click "Deployments"
4. Click "Redeploy" on latest deployment

### Environment Variable Changes
**Important:** Changing env vars requires redeployment:
1. Update variable in Vercel dashboard
2. Go to Deployments → Click "..." → Redeploy

---

## 📝 Post-Deployment Checklist

- [ ] Claude API key rotated (old one deleted)
- [ ] Both env vars set in Vercel
- [ ] Production URL loads without errors
- [ ] Browser console shows "client-side mode"
- [ ] Can start session and interact with Pi
- [ ] Evaluation works (cards progress)
- [ ] No 404 errors on `/api/claude-evaluate`
- [ ] Full user flow completes successfully

---

## 🎉 Success!

Your Mastery Cards app is now live on Vercel with:
- ✅ Secure backend (Claude key server-side)
- ✅ Single deployment platform
- ✅ No separate backend to manage
- ✅ Automatic HTTPS and global CDN

**Next Steps:**
1. Share production URL with testers
2. Monitor Vercel Analytics for usage
3. Check Vercel Function logs for errors
4. Iterate based on feedback

---

## 📞 Support

**Vercel Issues:**
- Check build logs in Vercel dashboard
- Review function logs for API errors
- Use Vercel preview deployments for testing

**App Issues:**
- Check browser console for frontend errors
- Test serverless function in Vercel dashboard
- Verify environment variables are set correctly

---

**Deployment Date:** 2024-11-14  
**App Path:** `apps/mastery-cards-app/apps/mastery-cards-app/native-audio-function-call-sandbox`  
**Deployment Type:** Vercel (Full-stack with Serverless Functions)
