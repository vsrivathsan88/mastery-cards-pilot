# 🎉 READY TO DEPLOY - NEXT STEPS

**Status:** ✅ All code changes committed locally  
**Commit:** `68d12ee` - feat: migrate mastery-cards to Vercel serverless architecture  
**Date:** 2024-11-14

---

## ✅ WHAT'S BEEN DONE (BY DROID)

### 1. Security ✅
- **Deleted exposed key file:** `server/.env` removed from repository
- **Cleaned documentation:** Removed API key references from docs
- **Verified commit:** No secrets in git diff

### 2. Code Changes ✅
- **Created Vercel serverless function:** `/api/claude-evaluate.ts`
- **Updated frontend:** Uses serverless function instead of backend
- **Forced client-side mode:** No WebSocket server needed
- **Fixed paths:** `vercel.json` points to correct directory
- **Added dependencies:** `@vercel/node` for TypeScript types
- **Tested build:** ✅ Success - 318KB bundle

### 3. Documentation ✅
- **Deployment guide:** Complete step-by-step instructions
- **Troubleshooting:** Common issues and fixes
- **Architecture diagram:** Shows new serverless setup

### 4. Git Commit ✅
```
Commit: 68d12ee
Message: feat: migrate mastery-cards to Vercel serverless architecture

Files Changed:
✅ 9 files changed
✅ 5010 insertions(+), 45 deletions(-)
✅ All secrets removed
✅ Build tested
```

---

## 🚨 YOUR TURN - 3 ACTIONS REQUIRED

### ACTION 1: Rotate Claude API Key (5 minutes) ⚠️ CRITICAL

**Why:** The old key was exposed in git history (now deleted but needs rotation)

**Steps:**
1. Open: https://console.anthropic.com
2. Go to API Keys section
3. Find and DELETE the exposed key
4. Click "Create Key"
5. **Copy and save the new key** (you'll need it for Vercel)

**Example key format:** `sk-ant-api03-...` (but yours will be different)

---

### ACTION 2: Push to GitHub (1 minute)

**Command:**
```bash
cd /Users/vsrivathsan/Documents/simili-monorepo-v1/apps/mastery-cards-app
git push origin main
```

**What this does:**
- Uploads your local commit to GitHub
- Makes code available for Vercel deployment
- Triggers any CI/CD pipelines (if configured)

**Expected output:**
```
Enumerating objects: X, done.
Counting objects: 100% (X/X), done.
...
To github.com:your-username/your-repo.git
   985efb2..68d12ee  main -> main
```

---

### ACTION 3: Deploy to Vercel (10 minutes)

#### Step 3.1: Go to Vercel
Open: https://vercel.com/new

#### Step 3.2: Import Repository
1. Click "Import Git Repository"
2. Select your GitHub repo
3. Click "Import"

#### Step 3.3: Configure Project

**Framework Preset:** Vite (should auto-detect)

**Root Directory:**
```
apps/mastery-cards-app/apps/mastery-cards-app/native-audio-function-call-sandbox
```

**Build Settings:**
- Build Command: `npm run build` (auto-detected)
- Output Directory: `dist` (auto-detected)
- Install Command: `npm install` (auto-detected)

#### Step 3.4: Environment Variables

Click "Environment Variables" and add:

**Variable 1:**
```
Name:  VITE_GEMINI_API_KEY
Value: [your Gemini API key]
```
Get from: https://aistudio.google.com/apikey

**Variable 2:**
```
Name:  CLAUDE_API_KEY
Value: [your NEW Claude API key from ACTION 1]
```
**Important:** NO `VITE_` prefix! This keeps it server-side only.

#### Step 3.5: Deploy

1. Click "Deploy"
2. Wait 2-3 minutes (watch build logs)
3. Get your production URL: `https://your-app.vercel.app`

---

## ✅ VERIFICATION CHECKLIST

After deployment, verify everything works:

### Frontend Check
- [ ] Open production URL
- [ ] Open browser DevTools (F12) → Console
- [ ] Should see: "Orchestration mode: client-side (no backend server)"
- [ ] Should NOT see: "ws://localhost:3001"
- [ ] No errors in console

### Serverless Function Check
- [ ] Open DevTools → Network tab
- [ ] Interact with app (start session)
- [ ] Look for request to `/api/claude-evaluate`
- [ ] Should return 200 OK (not 404 or 500)

### Full User Flow
- [ ] Enter name → Start session
- [ ] Speak/interact with Pi
- [ ] Card progresses (evaluation works)
- [ ] Swipe card → Next card loads
- [ ] Complete session → Points awarded

---

## 📊 WHAT YOU'RE DEPLOYING

### Architecture
```
Vercel (single platform)
├── Frontend (React + Vite)
│   └── Static files + JavaScript
│
└── Backend (/api/claude-evaluate)
    └── Serverless function
        └── Calls Anthropic API
```

### Benefits
- ✅ No Railway needed
- ✅ No Replit needed
- ✅ No separate backend server
- ✅ Claude key secure server-side
- ✅ Single deployment
- ✅ Free tier generous
- ✅ Auto-scaling

### Files Deployed
```
apps/mastery-cards-app/apps/mastery-cards-app/native-audio-function-call-sandbox/
├── src/                      ← React frontend
├── api/                      ← Serverless function
│   └── claude-evaluate.ts
├── dist/                     ← Build output (auto-generated)
├── package.json
└── vite.config.ts
```

---

## 🐛 TROUBLESHOOTING

### Problem: Git push rejected

**Error:** `! [rejected] main -> main (fetch first)`

**Fix:**
```bash
git pull origin main --rebase
git push origin main
```

---

### Problem: Vercel build fails

**Error:** "Cannot resolve module" or similar

**Check:**
1. Root directory is correct (copy-paste from this doc)
2. package.json exists in root directory
3. Build logs for specific error

**Fix:**
- Test build locally first:
  ```bash
  cd apps/mastery-cards-app/apps/mastery-cards-app/native-audio-function-call-sandbox
  npm install
  npm run build
  ```

---

### Problem: /api/claude-evaluate returns 500

**Error:** Function execution error

**Check:**
1. `CLAUDE_API_KEY` is set in Vercel (not `VITE_CLAUDE_API_KEY`)
2. Key is the NEW one (not the old exposed one)
3. Vercel Function logs for details

**Fix:**
1. Go to Vercel → Project Settings → Environment Variables
2. Verify `CLAUDE_API_KEY` exists and is correct
3. Redeploy: Deployments → "..." → Redeploy

---

### Problem: Frontend shows "backend error"

**Symptoms:** App loads but evaluation doesn't work

**Check:**
1. Browser DevTools → Network tab
2. Look for failed requests to `/api/claude-evaluate`
3. Check response body for error message

**Fix:**
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Check Vercel Function logs
- Verify environment variables set correctly

---

## 📚 ADDITIONAL RESOURCES

**Full Documentation:**
- `VERCEL-DEPLOYMENT-READY.md` - Quick reference
- `apps/.../DEPLOYMENT-GUIDE.md` - Detailed guide with troubleshooting

**Vercel Resources:**
- Serverless Functions: https://vercel.com/docs/functions
- Environment Variables: https://vercel.com/docs/projects/environment-variables
- Build Configuration: https://vercel.com/docs/build-step

**API Key Management:**
- Gemini API Keys: https://aistudio.google.com/apikey
- Claude API Keys: https://console.anthropic.com

---

## 🎯 QUICK COMMAND SUMMARY

```bash
# ACTION 1: Rotate API key
# → Do this manually at console.anthropic.com

# ACTION 2: Push to GitHub
cd /Users/vsrivathsan/Documents/simili-monorepo-v1/apps/mastery-cards-app
git push origin main

# ACTION 3: Deploy to Vercel
# → Do this manually at vercel.com/new
# → Set environment variables:
#   - VITE_GEMINI_API_KEY=your_gemini_key
#   - CLAUDE_API_KEY=your_new_claude_key
```

---

## 🎉 AFTER DEPLOYMENT

### Monitor
- Vercel Analytics (free): Track usage
- Vercel Function Logs: Check for errors
- Browser Console: User-side errors

### Share
- Production URL is shareable
- Works on mobile devices
- HTTPS by default

### Iterate
- Push to GitHub = auto-deploy
- Use preview deployments for testing
- Rollback available in Vercel dashboard

---

## 📞 NEED HELP?

**If stuck:**
1. Check browser console for errors
2. Check Vercel build logs
3. Check Vercel function logs
4. Review troubleshooting section above
5. Verify environment variables

**Common fixes:**
- Hard refresh browser: Cmd+Shift+R
- Redeploy on Vercel after env var changes
- Verify root directory path is correct

---

## ✅ SUCCESS CRITERIA

**You'll know it's working when:**
- ✅ Production URL loads
- ✅ Console shows "client-side mode"
- ✅ Can start and complete session
- ✅ Evaluation works (cards progress)
- ✅ No errors in browser console
- ✅ `/api/claude-evaluate` returns 200

**Deployment time:** ~15 minutes total
- ACTION 1: 5 minutes (rotate key)
- ACTION 2: 1 minute (push)
- ACTION 3: 10 minutes (Vercel setup)

---

**Ready to go!** Follow the 3 actions above in order. 🚀

---

**Generated:** 2024-11-14  
**Commit:** 68d12ee  
**Status:** Ready for deployment
