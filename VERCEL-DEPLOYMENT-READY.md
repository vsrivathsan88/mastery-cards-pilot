# ✅ MASTERY CARDS - READY FOR VERCEL DEPLOYMENT

**Status:** All code changes complete. Ready to commit and deploy.  
**Date:** 2024-11-14  
**Architecture:** Full-stack on Vercel (Serverless Functions)

---

## 🎉 WHAT'S BEEN DONE

### Code Changes Completed ✅

1. **✅ Created Vercel Serverless Function**
   - File: `apps/mastery-cards-app/apps/mastery-cards-app/native-audio-function-call-sandbox/api/claude-evaluate.ts`
   - Handles Claude API calls securely server-side
   - No CORS issues (same domain)

2. **✅ Updated Frontend to Use Serverless Function**
   - File: `lib/evaluator/claude-judge.ts`
   - Changed from backend URL to `/api/claude-evaluate`
   - Removed dependency on separate backend server

3. **✅ Forced Client-Side Orchestration**
   - File: `App.mastery.tsx`
   - Removed WebSocket server dependency
   - No need for Railway/Replit backend

4. **✅ Updated Environment Configuration**
   - File: `.env.example`
   - Removed backend URL requirements
   - Clear instructions for Vercel setup

5. **✅ Fixed Vercel Config Paths**
   - File: `vercel.json` (root)
   - Corrected paths to actual app directory
   - Build tested and working

6. **✅ Added Type Definitions**
   - Installed: `@vercel/node`
   - Serverless function types included

7. **✅ Build Tested Successfully**
   - Local build: ✅ Success
   - Output: `dist/` folder created
   - No errors

---

## 🚨 SECURITY ALERT - ACTION REQUIRED

**⚠️ EXPOSED API KEY STILL EXISTS:**

File: `apps/mastery-cards-app/apps/mastery-cards-app/server/.env`
```
CLAUDE_API_KEY=<exposed_key_removed>
```

**YOU MUST:**
1. Go to https://console.anthropic.com
2. **Delete the exposed key immediately**
3. Create a new API key
4. Keep new key secure (only set in Vercel dashboard)
5. **DO NOT commit any .env files with real keys**

---

## 📝 FILES CHANGED (Safe to Commit)

### Modified Files:
```
apps/mastery-cards-app/apps/mastery-cards-app/native-audio-function-call-sandbox/
├── .env.example                    ✅ Safe (no real keys)
├── App.mastery.tsx                 ✅ Safe (removed backend deps)
├── lib/evaluator/claude-judge.ts   ✅ Safe (uses serverless function)
├── package.json                    ✅ Safe (added @vercel/node)
└── package-lock.json               ✅ Safe (dependency lockfile)

New Files:
├── api/claude-evaluate.ts          ✅ Safe (serverless function)
└── DEPLOYMENT-GUIDE.md             ✅ Safe (documentation)

Root:
└── vercel.json                     ✅ Safe (fixed paths)
```

### Files with Secrets (DO NOT COMMIT):
```
❌ apps/mastery-cards-app/apps/mastery-cards-app/server/.env
   (Contains exposed Claude API key)

❌ Any .env.local files
   (User-specific keys)
```

---

## 🚀 DEPLOYMENT STEPS

### STEP 1: Security First (5 minutes)

1. **Rotate Claude API Key:**
   ```bash
   # Go to: https://console.anthropic.com
   # 1. Find the exposed key (check logs above for reference)
   # 2. Delete it
   # 3. Create new key
   # 4. Copy and save new key securely
   ```

2. **Remove Exposed .env File:**
   ```bash
   cd apps/mastery-cards-app/apps/mastery-cards-app
   rm server/.env  # Delete file with exposed key
   # Or move it out of git:
   # mv server/.env ~/safe-location/.env.backup
   ```

### STEP 2: Commit Changes (2 minutes)

```bash
cd /Users/vsrivathsan/Documents/simili-monorepo-v1/apps/mastery-cards-app

# Check what's being committed
git status
git diff

# Verify NO API KEYS in diff
git diff | grep -E "(sk-ant-|AIzaSy)"
# Should return nothing!

# Add files
git add apps/mastery-cards-app/native-audio-function-call-sandbox/
git add vercel.json

# Commit
git commit -m "feat: migrate mastery-cards to Vercel serverless architecture

- Add Vercel serverless function for Claude evaluation
- Remove backend server dependency
- Force client-side orchestration mode
- Update environment configuration
- Fix vercel.json paths for deployment

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>"

# Push
git push origin main
```

### STEP 3: Deploy to Vercel (10 minutes)

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/new
   - Click "Import Git Repository"

2. **Configure Project:**
   - **Repository:** Select your GitHub repo
   - **Root Directory:** `apps/mastery-cards-app/apps/mastery-cards-app/native-audio-function-call-sandbox`
   - **Framework:** Vite (should auto-detect)

3. **Set Environment Variables:**
   
   Add in Vercel dashboard:
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   CLAUDE_API_KEY=your_new_claude_api_key_here
   ```
   
   **Important:**
   - Get Gemini key: https://aistudio.google.com/apikey
   - Use NEW rotated Claude key (not the exposed one!)
   - `CLAUDE_API_KEY` has NO `VITE_` prefix (server-side only)

4. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Get production URL

### STEP 4: Test (5 minutes)

1. **Open Production URL**
2. **Check Browser Console (F12):**
   - ✅ Should see: "Orchestration mode: client-side"
   - ❌ Should NOT see: "ws://localhost:3001"
   - ❌ Should NOT see any errors

3. **Test Full Flow:**
   - Enter name → Start session
   - Speak/interact with Pi
   - Check card progresses (evaluation works)
   - Complete session

4. **Verify Serverless Function:**
   - Browser DevTools → Network tab
   - Look for request to `/api/claude-evaluate`
   - Should return 200 OK

---

## ✅ SUCCESS CHECKLIST

### Pre-Deployment
- [ ] Claude API key rotated (old key deleted)
- [ ] server/.env file removed or moved out of git
- [ ] No API keys in git diff
- [ ] Changes committed to git
- [ ] Changes pushed to GitHub

### Vercel Setup
- [ ] Repository connected to Vercel
- [ ] Root directory set correctly
- [ ] VITE_GEMINI_API_KEY set in Vercel
- [ ] CLAUDE_API_KEY set in Vercel (no VITE_ prefix)
- [ ] Deployment started

### Testing
- [ ] Production URL loads
- [ ] Console shows "client-side mode"
- [ ] No localhost URLs in console
- [ ] Can start and complete session
- [ ] Evaluation works (cards progress)
- [ ] /api/claude-evaluate returns 200

---

## 📊 WHAT CHANGED - ARCHITECTURE

### Before (Broken):
```
Frontend (Vercel)
    ↓
Backend Server (Railway) ← Never deployed
    ↓
Claude API
```

### After (Working):
```
Frontend (Vercel)
    ↓
/api/claude-evaluate (Vercel Serverless)
    ↓
Claude API
```

**Benefits:**
- ✅ Single deployment platform
- ✅ No separate backend to manage
- ✅ Secure (Claude key server-side)
- ✅ No CORS issues
- ✅ Simpler architecture

---

## 🐛 TROUBLESHOOTING

### Build Fails on Vercel

**Check:**
1. Root directory is correct
2. package.json exists in root directory
3. Build logs for specific error

**Fix:**
- Verify path: `apps/mastery-cards-app/apps/mastery-cards-app/native-audio-function-call-sandbox`
- Test build locally first

### /api/claude-evaluate Returns 500

**Check:**
1. CLAUDE_API_KEY is set in Vercel
2. Key is valid (not the old exposed one)
3. Function logs in Vercel dashboard

**Fix:**
- Verify env var name: `CLAUDE_API_KEY` (not `VITE_CLAUDE_API_KEY`)
- Redeploy after setting env vars

### Frontend Shows Backend Errors

**Check:**
1. App.mastery.tsx changes committed
2. Not using old cached build
3. Console for actual error

**Fix:**
- Hard refresh (Cmd+Shift+R)
- Check Network tab for /api/claude-evaluate request

---

## 📞 SUPPORT RESOURCES

**Vercel Documentation:**
- Serverless Functions: https://vercel.com/docs/functions/serverless-functions
- Environment Variables: https://vercel.com/docs/projects/environment-variables
- Build Configuration: https://vercel.com/docs/build-step

**Deployment Guide:**
- Full guide: `DEPLOYMENT-GUIDE.md` (in app directory)

**If Stuck:**
1. Check Vercel build logs
2. Check Vercel function logs
3. Check browser console
4. Verify environment variables

---

## 🎯 WHAT'S NOT DEPLOYED

**These stay local (not affected):**
- ❌ tutor-app (different app)
- ❌ api-server (not needed)
- ❌ packages/* (used by apps, not deployed separately)
- ❌ server/ folder (replaced by Vercel serverless function)

**Only deploying:**
- ✅ `apps/mastery-cards-app/apps/mastery-cards-app/native-audio-function-call-sandbox/`

---

## 🎉 NEXT STEPS AFTER DEPLOYMENT

1. **Monitor Usage:**
   - Vercel Analytics (free)
   - Check function logs for errors

2. **Share with Testers:**
   - Production URL is shareable
   - Works on mobile devices

3. **Iterate:**
   - Push to GitHub = auto-deploy to Vercel
   - Use preview deployments for testing

4. **Scale:**
   - Vercel handles scaling automatically
   - No server management needed

---

**Ready to deploy!** Follow the steps above in order. Good luck! 🚀

---

**Generated:** 2024-11-14  
**Repository:** simili-monorepo-v1  
**App:** mastery-cards-app  
**Deployment Target:** Vercel (Full-stack with Serverless Functions)
