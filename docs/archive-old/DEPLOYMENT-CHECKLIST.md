# Deployment Checklist - Quick Reference

**Print this or keep it open in a separate window!** ✅

---

## 🛡️ Safety First: You Can Always Rollback!

Vercel → Deployments → "..." → "Promote to Production"

**Nothing is permanent! Relax and take it step by step.** 😊

---

## Phase 1: Backend (Railway) ⏱️ 15 min

### Setup
- [ ] Sign up at https://railway.app (use GitHub)
- [ ] Create New Project → Deploy from GitHub
- [ ] Select: `vsrivathsan88/mastery-cards-pilot`
- [ ] Root Directory: `server`

### Environment Variables
- [ ] `CLAUDE_API_KEY` = `sk-ant-...`
- [ ] `PORT` = `3001`

### Get URL
- [ ] Settings → Networking → Generate Domain
- [ ] **WRITE IT DOWN**: `https://______________________.up.railway.app`

### Test Backend
```bash
# Test 1: Health check (open in browser)
https://YOUR-RAILWAY-URL.up.railway.app/health

# Test 2: WebSocket (in terminal)
npm install -g wscat
wscat -c wss://YOUR-RAILWAY-URL.up.railway.app/orchestrate?sessionId=test
```

- [ ] ✅ Both tests pass? Continue!

---

## Phase 2: Vercel Configuration ⏱️ 10 min

### Go to Settings
- [ ] https://vercel.com → Your Project
- [ ] Settings → Environment Variables

### Add Variables (4 total)

**Variable 1:**
```
Name:  VITE_GEMINI_API_KEY
Value: AIzaSy...
Envs:  ✅ Production ✅ Preview ✅ Development
```

**Variable 2:**
```
Name:  VITE_CLAUDE_API_KEY
Value: sk-ant-...
Envs:  ✅ Production ✅ Preview ✅ Development
```

**Variable 3:** ⚠️ Use YOUR Railway URL!
```
Name:  VITE_WS_SERVER_URL
Value: wss://YOUR-URL.railway.app/orchestrate
Envs:  ✅ Production ✅ Preview ✅ Development
```

**Variable 4:** ⚠️ Use YOUR Railway URL!
```
Name:  VITE_BACKEND_URL
Value: https://YOUR-URL.railway.app
Envs:  ✅ Production ✅ Preview ✅ Development
```

### Double-Check

| Variable | Starts With | Ends With |
|----------|-------------|-----------|
| `VITE_GEMINI_API_KEY` | `AIzaSy...` | (key) |
| `VITE_CLAUDE_API_KEY` | `sk-ant-...` | (key) |
| `VITE_WS_SERVER_URL` | `wss://` | `/orchestrate` |
| `VITE_BACKEND_URL` | `https://` | (no path) |

- [ ] ✅ All correct? Continue!

---

## Phase 3: Deploy ⏱️ 5 min

### Trigger Deployment

**Option A (Recommended):**
- [ ] Vercel → Deployments
- [ ] Click "..." on latest deployment
- [ ] Click "Redeploy"
- [ ] ⚠️ **UNCHECK** "Use existing Build Cache"
- [ ] Click "Redeploy"

**Option B (Alternative):**
```bash
git commit --allow-empty -m "trigger production deployment"
git push origin main
```

### Wait
- [ ] Watch build logs (2-3 minutes)
- [ ] ✅ Build succeeded?

---

## Phase 4: Verify ⏱️ 10 min

### Open App
- [ ] Visit production URL
- [ ] Press `F12` (open DevTools)
- [ ] Click "Console" tab

### Check Logs

**✅ SUCCESS:**
```
[App] 🔗 WebSocket server URL: wss://your-app.railway.app/orchestrate
[ServerConnection] Connected to orchestration server
```

**❌ FAILURE (localhost):**
```
[App] 🔗 WebSocket server URL: ws://localhost:3001/orchestrate
```
→ Go back to Phase 2, verify environment variables

**❌ FAILURE (connection error):**
```
[ServerConnection] WebSocket error: ...
```
→ Check Railway logs, verify backend is running

### Test User Flow
- [ ] Enter name
- [ ] Allow microphone
- [ ] Say "Hello"
- [ ] Hear Pi respond
- [ ] No errors in console

### ✅ Everything works?

---

## 🎉 You're Live!

**Production URL**: `https://your-app.vercel.app`

Test on:
- [ ] Your laptop
- [ ] Your phone
- [ ] Friend's device

---

## 🆘 Quick Troubleshooting

### See `localhost` in console?
→ Environment variables not set
→ Redeploy with correct variables

### WebSocket won't connect?
→ Check Railway logs
→ Verify `wss://` (not `ws://`)
→ Test with `wscat`

### Mixed content errors?
→ Use `wss://` and `https://` (secure)
→ Clear browser cache

### Build fails?
→ Check Vercel build logs
→ Redeploy without cache

---

## 📝 Write Down Your Info

**Backend Railway URL**: `https://_______________________.railway.app`

**Frontend Vercel URL**: `https://_______________________.vercel.app`

**Deployment Date**: ______________

**Status**: ⬜ Deploying | ⬜ Testing | ✅ Live

---

## Remember

- 🛡️ **You can always rollback** - Nothing is permanent!
- 🐌 **Take it slow** - Verify each step
- 📖 **Full guide** - See `SAFE-DEPLOYMENT-WALKTHROUGH.md` for details
- 🎯 **You got this!** - It's easier than it looks!

---

**Current Step**: _______________

**Next Step**: _______________

**Stuck?** Check the console, Railway logs, or full walkthrough guide.

**GOOD LUCK!** 🚀
