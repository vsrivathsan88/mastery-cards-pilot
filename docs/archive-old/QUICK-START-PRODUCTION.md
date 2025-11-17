# Quick Start: Production Deployment Baby Steps

## The Problem You Had

Your app was trying to connect to `ws://localhost:3001` even in production on Vercel. FACEPALM indeed! 😅

## The Fix (Already Applied)

The code now reads from `VITE_WS_SERVER_URL` environment variable instead of hardcoded localhost.

## Baby Steps to Get This Working in Production

### Step 1: Deploy Your Backend Server (5-10 minutes)

**Choose Railway (easiest):**

1. Go to https://railway.app and sign in with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select: `vsrivathsan88/mastery-cards-pilot`
4. Railway will ask which folder → Choose `server`
5. Add environment variables in Railway dashboard:
   - `CLAUDE_API_KEY` = (your Claude API key)
   - `PORT` = `3001`
6. Deploy! Railway will give you a URL like: `https://your-app.up.railway.app`
7. **SAVE THIS URL!** You'll need it in the next step

**Verify it works:**
```bash
# Install wscat
npm install -g wscat

# Test (replace with YOUR Railway URL)
wscat -c wss://your-app.up.railway.app/orchestrate?sessionId=test
```

If it connects, you're good! Press Ctrl+C to exit.

---

### Step 2: Configure Vercel (5 minutes)

1. Go to https://vercel.com and sign in
2. Go to your project (or import `vsrivathsan88/mastery-cards-pilot` if new)
3. Go to: **Settings** → **Environment Variables**
4. Add THREE variables:

   | Name | Value |
   |------|-------|
   | `VITE_GEMINI_API_KEY` | Your Gemini API key from https://aistudio.google.com/apikey |
   | `VITE_CLAUDE_API_KEY` | Your Claude API key from https://console.anthropic.com |
   | `VITE_WS_SERVER_URL` | `wss://your-app.up.railway.app/orchestrate` ← USE YOUR RAILWAY URL |

   **CRITICAL**:
   - Use `wss://` (secure WebSocket), NOT `ws://`
   - Include `/orchestrate` at the end
   - Example: `wss://mastery-cards-production.up.railway.app/orchestrate`

5. Click "Save"

---

### Step 3: Deploy/Redeploy Frontend (2 minutes)

If you already have a Vercel project:
1. Go to **Deployments** tab
2. Click the "..." menu on the latest deployment
3. Click **"Redeploy"**
4. Check "Use existing Build Cache" (optional)
5. Click **Redeploy**

If this is your first deployment:
1. From Vercel dashboard, click "Add New..." → "Project"
2. Import `vsrivathsan88/mastery-cards-pilot`
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `apps/mastery-cards-app/native-audio-function-call-sandbox`
   - Leave build/install commands as default
4. Add the environment variables from Step 2
5. Click "Deploy"

---

### Step 4: Verify It Works (1 minute)

1. Open your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Press F12 to open Developer Tools
3. Go to the **Console** tab
4. Look for this line:
   ```
   [App] 🔗 WebSocket server URL: wss://your-app.up.railway.app/orchestrate
   ```

**✅ If you see your Railway URL** → SUCCESS! 🎉

**❌ If you see `ws://localhost:3001`** → You forgot to set `VITE_WS_SERVER_URL` in Vercel. Go back to Step 2.

---

## Quick Troubleshooting

### "I see localhost in the console!"

→ Go to Vercel → Your Project → Settings → Environment Variables
→ Verify `VITE_WS_SERVER_URL` is set correctly
→ Redeploy the project

### "WebSocket connection failed"

→ Check if backend is running: Open `https://your-railway-url.com` in browser
→ Verify Railway logs for errors
→ Make sure you used `wss://` not `ws://`

### "It works locally but not in production"

→ Double-check ALL THREE environment variables are set in Vercel
→ Verify the Railway backend is deployed and running
→ Check Vercel function logs for errors

---

## That's It!

Your app should now:
- Connect to localhost when developing locally
- Connect to Railway when deployed on Vercel
- NOT have that embarrassing localhost facepalm moment anymore 😎

## Need More Details?

See the full guide: `PRODUCTION-DEPLOYMENT-GUIDE.md`

---

## Summary Checklist

- [ ] Backend deployed to Railway with `CLAUDE_API_KEY` set
- [ ] Saved Railway URL (e.g., `https://your-app.up.railway.app`)
- [ ] Added `VITE_WS_SERVER_URL=wss://your-app.up.railway.app/orchestrate` to Vercel
- [ ] Added `VITE_GEMINI_API_KEY` to Vercel
- [ ] Added `VITE_CLAUDE_API_KEY` to Vercel
- [ ] Redeployed Vercel project
- [ ] Verified WebSocket URL in browser console (should NOT be localhost)
- [ ] Tested the app end-to-end

You got this! 🚀
