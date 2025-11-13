# Safe Deployment Walkthrough - Hand-Holding Guide

**Current Status**: Your app is on Vercel but connecting to localhost (which doesn't exist in production)
**Goal**: Update it to use a real backend server safely
**Time Required**: ~30-45 minutes
**Risk Level**: 🟢 LOW (We have rollback options!)

---

## 🛡️ Safety Net: You Can Always Rollback!

**IMPORTANT**: Vercel keeps all your previous deployments. If something goes wrong:
1. Go to Vercel Dashboard → Your Project → Deployments
2. Find your last working deployment
3. Click "..." → "Promote to Production"
4. You're back to the old version instantly!

**This is a safety net - nothing we do is permanent!** 🎯

---

## 📋 Pre-Flight Checklist

Before we start, let's gather what we need:

### ✅ What You Already Have:
- [ ] Vercel account and project deployed
- [ ] GitHub repository with latest code
- [ ] This guide open

### 🔑 What You Need to Get:
- [ ] Railway account (or Render/Fly.io - we'll use Railway)
- [ ] Your Gemini API key (from https://aistudio.google.com/apikey)
- [ ] Your Claude API key (from https://console.anthropic.com)

**Stop here and gather these if you don't have them yet!**

---

## Phase 1: Deploy Backend to Railway (15 min)

### Why Backend First?
We need the backend URL **before** we can configure Vercel. Otherwise, frontend won't know where to connect!

### Step 1.1: Sign Up for Railway

1. Go to https://railway.app
2. Click "Login" (top right)
3. Choose "Login with GitHub"
4. Authorize Railway to access your GitHub

**✅ Checkpoint**: You should see the Railway dashboard

---

### Step 1.2: Create New Project

1. Click "New Project" button
2. Select "Deploy from GitHub repo"
3. Find and select: `vsrivathsan88/mastery-cards-pilot`

**⚠️ IMPORTANT**: Railway might ask for repository permissions. Click "Configure GitHub App" and grant access.

**✅ Checkpoint**: You should see your repository selected

---

### Step 1.3: Configure Deployment Settings

Railway will ask what to deploy:

1. **Root Directory**: Type `server` (this is where your backend code lives)
2. **Start Command**: Leave empty (Railway auto-detects from package.json)
3. Click "Deploy"

Railway will now:
- Install dependencies (`npm install`)
- Build your backend
- Start the server

**⏱️ This takes 2-3 minutes**

**✅ Checkpoint**: You should see "Building..." in Railway dashboard

---

### Step 1.4: Add Environment Variables

While it's building:

1. In Railway, click your service
2. Go to "Variables" tab
3. Click "New Variable"
4. Add these one by one:

   | Name | Value |
   |------|-------|
   | `CLAUDE_API_KEY` | `sk-ant-...` (your Claude key) |
   | `PORT` | `3001` |

5. Click "Add" for each

**✅ Checkpoint**: You should see both variables in the Variables tab

---

### Step 1.5: Get Your Railway URL

After deployment completes (2-3 minutes):

1. Go to "Settings" tab
2. Scroll to "Networking" section
3. Click "Generate Domain"
4. Railway will give you a URL like: `your-app-production.up.railway.app`

**📝 COPY THIS URL! Write it down:**

```
My Railway URL: https://_________________________________.up.railway.app
```

**✅ Checkpoint**: Your backend is now deployed and running!

---

### Step 1.6: Test Your Backend (CRITICAL!)

Before we connect the frontend, let's verify the backend works:

#### Test 1: Health Check

Open this URL in your browser:
```
https://YOUR-RAILWAY-URL.up.railway.app/health
```

**Expected**: Should return something like `{"status":"ok"}` or similar
**If Error**: Check Railway logs (Deployments → Click deployment → Logs)

#### Test 2: WebSocket Connection

Install `wscat` (one-time setup):
```bash
npm install -g wscat
```

Then test:
```bash
wscat -c wss://YOUR-RAILWAY-URL.up.railway.app/orchestrate?sessionId=test123
```

**Expected**: Connection opens, you might see `Connected` or a welcome message
**To Exit**: Press `Ctrl+C`

**✅ Checkpoint**: Both tests pass? Great! Backend is ready.

**❌ If Tests Fail**:
- Check Railway logs for errors
- Verify `CLAUDE_API_KEY` is set correctly
- Check that Railway generated a domain

---

## Phase 2: Update Vercel Configuration (10 min)

Now we'll point your Vercel frontend to your new Railway backend.

### Step 2.1: Go to Vercel Project Settings

1. Go to https://vercel.com
2. Click on your project: `mastery-cards-pilot`
3. Click "Settings" tab (top)
4. Click "Environment Variables" (left sidebar)

**✅ Checkpoint**: You should see a list of your current environment variables (if any)

---

### Step 2.2: Add/Update Environment Variables

We need to add **4 variables**. For each one:
1. Click "Add New"
2. Fill in Name and Value
3. Select "Production" (and optionally "Preview" and "Development")
4. Click "Save"

**Variable 1**:
```
Name:  VITE_GEMINI_API_KEY
Value: [Your Gemini API key from https://aistudio.google.com/apikey]
Environments: ✅ Production ✅ Preview ✅ Development
```

**Variable 2**:
```
Name:  VITE_CLAUDE_API_KEY
Value: [Your Claude API key from https://console.anthropic.com]
Environments: ✅ Production ✅ Preview ✅ Development
```

**Variable 3** (⚠️ CRITICAL - Use YOUR Railway URL):
```
Name:  VITE_WS_SERVER_URL
Value: wss://YOUR-RAILWAY-URL.up.railway.app/orchestrate
Environments: ✅ Production ✅ Preview ✅ Development
```

**⚠️ IMPORTANT**:
- Use `wss://` (secure WebSocket), NOT `ws://`
- Include `/orchestrate` at the end
- Example: `wss://mastery-cards-production.up.railway.app/orchestrate`

**Variable 4** (⚠️ CRITICAL - Use YOUR Railway URL):
```
Name:  VITE_BACKEND_URL
Value: https://YOUR-RAILWAY-URL.up.railway.app
Environments: ✅ Production ✅ Preview ✅ Development
```

**⚠️ IMPORTANT**:
- Use `https://` (secure HTTP), NOT `http://`
- NO `/orchestrate` or `/api` at the end
- Example: `https://mastery-cards-production.up.railway.app`

**✅ Checkpoint**: You should see all 4 variables in Vercel now

---

### Step 2.3: Double-Check Your Variables

Let's verify everything is correct:

| Variable | Should Start With | Should End With |
|----------|-------------------|-----------------|
| `VITE_GEMINI_API_KEY` | `AIzaSy...` | (just the key) |
| `VITE_CLAUDE_API_KEY` | `sk-ant-...` | (just the key) |
| `VITE_WS_SERVER_URL` | `wss://` | `/orchestrate` |
| `VITE_BACKEND_URL` | `https://` | (no path) |

**⚠️ Common Mistakes to Avoid**:
- ❌ Using `ws://` instead of `wss://` for WebSocket
- ❌ Using `http://` instead of `https://` for backend
- ❌ Forgetting `/orchestrate` on WebSocket URL
- ❌ Adding `/orchestrate` or `/api` on backend URL

**✅ Checkpoint**: All 4 variables correct? Moving on!

---

## Phase 3: Deploy to Production (5 min)

### Step 3.1: Trigger a New Deployment

You have two options:

**Option A: Redeploy from Vercel Dashboard**
1. Go to "Deployments" tab
2. Click the "..." menu on latest deployment
3. Click "Redeploy"
4. Make sure "Use existing Build Cache" is **UNCHECKED** ⚠️
5. Click "Redeploy"

**Option B: Push a Commit to GitHub** (Git will auto-deploy)
```bash
# Add a dummy change to trigger deployment
git commit --allow-empty -m "trigger production deployment"
git push origin main
```

**⏱️ Deployment takes 2-3 minutes**

**✅ Checkpoint**: You should see "Building..." in Vercel dashboard

---

### Step 3.2: Wait for Deployment to Complete

Watch the build logs in Vercel:
1. Click on the deployment (in Deployments tab)
2. Watch the "Building" logs

**What You Should See**:
```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

**✅ Checkpoint**: Build succeeded? Great! Now for the moment of truth...

---

## Phase 4: Verification (10 min)

This is where we carefully verify everything works!

### Step 4.1: Open Your Production App

1. Go to your Vercel project
2. Click "Visit" button (or copy the URL)
3. Your production URL will be like:
   ```
   https://mastery-cards-pilot.vercel.app
   ```

**✅ Checkpoint**: Page loads without errors?

---

### Step 4.2: Open Browser Developer Tools

**CRITICAL STEP**: This is how we verify the backend connection!

1. Right-click on the page
2. Click "Inspect" or press `F12`
3. Click "Console" tab at the top
4. **Keep this open while testing!**

**✅ Checkpoint**: Console is open and ready

---

### Step 4.3: Check the Logs (THE MOMENT OF TRUTH!)

In the Console, look for these lines:

**✅ SUCCESS LOOKS LIKE**:
```
[App] 🔗 WebSocket server URL: wss://your-app.railway.app/orchestrate
[ServerConnection] Connecting to wss://your-app.railway.app/orchestrate?sessionId=...
[ServerConnection] Connected to orchestration server
```

**❌ FAILURE LOOKS LIKE**:
```
[App] 🔗 WebSocket server URL: ws://localhost:3001/orchestrate  ← BAD!
```

Or:
```
[ServerConnection] WebSocket error: ...
[ServerConnection] Connection failed
```

---

### Step 4.4: Interpret the Results

#### ✅ If You See Success (Railway URL in logs):

**CONGRATULATIONS!** 🎉 Your app is now production-ready!

**Continue to Step 4.5 to test the full flow**

---

#### ❌ If You See `localhost` in Console:

**Don't Panic!** This means environment variables didn't get picked up.

**Fix**:
1. Go back to Vercel → Settings → Environment Variables
2. Verify all 4 variables are set correctly
3. Make sure they're applied to "Production"
4. Redeploy again (Step 3.1) - this time they'll be picked up

---

#### ❌ If You See Connection Errors:

**Possible Issues**:

**Issue 1**: "Mixed content" or "blocked by CORS"
- **Cause**: Using `ws://` or `http://` instead of secure versions
- **Fix**: Update variables to use `wss://` and `https://`

**Issue 2**: "Connection timeout" or "Connection refused"
- **Cause**: Railway backend not running
- **Fix**: Check Railway logs, verify backend deployed correctly

**Issue 3**: "Failed to connect to wss://..."
- **Cause**: Wrong URL in environment variable
- **Fix**: Double-check Railway URL, verify `/orchestrate` path for WebSocket

---

### Step 4.5: Test the Full User Flow

Now let's test the app end-to-end:

1. **Enter Your Name**
   - Type your name in the input
   - Click "Start Learning" or similar button
   - ✅ Should proceed without error

2. **Grant Microphone Permission**
   - Browser will ask for microphone access
   - Click "Allow"
   - ✅ Should see microphone activated

3. **Talk to Pi**
   - Say something like "Hello" or "Hi Pi"
   - Wait for Pi to respond
   - ✅ Should hear Pi's voice response

4. **Check Console Again**
   - Look for these logs:
     ```
     [App] 👤 USER: Hello (final)
     [App] 🛸 PI: Hi there! (final)
     ```
   - ✅ Conversation is being tracked

5. **Complete a Card** (Optional - takes a few minutes)
   - Answer Pi's questions
   - Eventually you should advance to next card
   - ✅ Points awarded, card changes

**✅ Checkpoint**: All tests pass? YOU DID IT! 🎉

---

## Phase 5: Final Checks & Cleanup (5 min)

### Step 5.1: Update Your Production URL

Vercel likely generated a cleaner URL. Let's use that:

1. Go to Vercel → Your Project → Settings → Domains
2. You should see something like:
   ```
   mastery-cards-pilot.vercel.app
   ```
3. This is your clean, permanent URL!

**📝 Save This URL**:
```
My Production URL: https://___________________________________.vercel.app
```

---

### Step 5.2: Document Your Deployment

Create a file to remember your setup:

```bash
cd /path/to/your/project
```

Create `PRODUCTION-INFO.txt`:
```
Production Deployment Info
==========================

Frontend URL: https://mastery-cards-pilot.vercel.app
Backend URL: https://your-app.railway.app

Deployed: 2025-11-13
Status: ✅ LIVE

Environment Variables (Vercel):
- VITE_GEMINI_API_KEY: Set ✓
- VITE_CLAUDE_API_KEY: Set ✓
- VITE_WS_SERVER_URL: wss://your-app.railway.app/orchestrate ✓
- VITE_BACKEND_URL: https://your-app.railway.app ✓

Backend (Railway):
- Service: mastery-cards-backend
- Environment: CLAUDE_API_KEY set ✓

Last Verified: 2025-11-13
```

---

### Step 5.3: Share Your Success!

Your app is live! Test it on:
- [ ] Your laptop
- [ ] Your phone
- [ ] A friend's device

**Share the URL**: `https://your-app.vercel.app`

---

## 🆘 Troubleshooting Guide

### Problem: "I see localhost in console"

**Solution**:
1. Vercel → Settings → Environment Variables
2. Check `VITE_WS_SERVER_URL` is set to `wss://...` (not `ws://localhost`)
3. Check `VITE_BACKEND_URL` is set to `https://...`
4. Redeploy (Deployments → ... → Redeploy)

---

### Problem: "WebSocket connection failed"

**Solution**:
1. Check Railway logs (Railway → Your Service → Deployments → Logs)
2. Verify backend is running (should see "Server running on port 3001")
3. Test WebSocket manually: `wscat -c wss://your-url.railway.app/orchestrate?sessionId=test`
4. Check CORS settings in backend code

---

### Problem: "Mixed content blocked"

**Solution**:
1. Ensure using `wss://` (not `ws://`)
2. Ensure using `https://` (not `http://`)
3. Clear browser cache: `Ctrl+Shift+Delete`
4. Try incognito/private window

---

### Problem: "API keys don't work"

**Solution**:
1. Verify Gemini key: https://aistudio.google.com/apikey
2. Verify Claude key: https://console.anthropic.com
3. Check key quotas (might be out of credits)
4. Re-enter keys in Vercel (typo?)

---

### Problem: "Build fails on Vercel"

**Solution**:
1. Check build logs for specific error
2. Likely missing dependency: `npm install` in root directory
3. Check Vercel root directory setting: should be `apps/mastery-cards-app/native-audio-function-call-sandbox`
4. Try: Deployments → ... → Redeploy (without cache)

---

## 🎉 Success Criteria

You know it's working when:

✅ Browser console shows Railway URL (not localhost)
✅ WebSocket connects successfully
✅ You can talk to Pi and hear responses
✅ No errors in browser console
✅ App works on multiple devices
✅ You can share the URL with others

---

## 📞 Need Help?

If you're stuck:

1. **Check the console** - 90% of issues show up there
2. **Check Railway logs** - Backend issues will be there
3. **Check Vercel build logs** - Build issues will be there
4. **Try rollback** - Go to previous working deployment
5. **Ask for help** - GitHub issues or developer community

---

## 🎓 What You've Accomplished

By following this guide, you've:

✅ Deployed a backend server to production (Railway)
✅ Configured environment variables correctly
✅ Connected frontend to backend over secure WebSocket
✅ Verified a full production deployment
✅ Learned how to troubleshoot production issues

**This is real DevOps work!** You should be proud! 🌟

---

## Next Steps (After Success)

1. **Monitor**: Check Vercel Analytics for traffic
2. **Iterate**: Fix any bugs reported by users
3. **Scale**: Railway auto-scales, no action needed
4. **Enhance**: Add features from your roadmap

---

**Remember**: You can always rollback if something goes wrong. Nothing is permanent! 🛡️

**Take it slow, verify each step, and you'll be fine!** 💪

Good luck! 🚀
