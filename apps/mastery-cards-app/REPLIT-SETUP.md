# Replit Setup Guide - Mastery Cards App

## 🎯 Overview

This guide shows how to deploy the **mastery-cards-app prototype** to Replit for team collaboration and pilot testing.

**Important:** We're deploying **only** the mastery-cards-app, not the entire monorepo.

---

## 📋 Prerequisites

1. **Replit Account** - Sign up at https://replit.com
2. **Gemini API Key** - Get from https://aistudio.google.com/app/apikey
3. **GitHub Access** - Access to https://github.com/Project-Simili/simili-v4

---

## 🚀 Method 1: Import from GitHub (Recommended)

### Step 1: Create New Repl

1. Go to https://replit.com
2. Click **"+ Create Repl"**
3. Select **"Import from GitHub"**
4. Enter repository URL: `https://github.com/Project-Simili/simili-v4`
5. Select branch: `feat/outcome-tracking-pilot`
6. Click **"Import from GitHub"**

### Step 2: Configure Repl for Subdirectory

**Problem:** Replit will import the entire monorepo, but we only need `apps/mastery-cards-app`.

**Solution:** Configure Replit to run from subdirectory.

1. Open `.replit` file (create if it doesn't exist)
2. Add this configuration:

```toml
run = "cd apps/mastery-cards-app && npm install && npm run dev -- --host 0.0.0.0 --port 3000"

[nix]
channel = "stable-23_11"

[deployment]
deploymentTarget = "static"
publicDir = "apps/mastery-cards-app/dist"
build = ["cd apps/mastery-cards-app && npm install && npm run build"]
```

### Step 3: Set Environment Variables

1. Click **"Tools"** → **"Secrets"** (lock icon in left sidebar)
2. Add new secret:
   - **Key:** `VITE_GEMINI_API_KEY`
   - **Value:** Your Gemini API key from https://aistudio.google.com/app/apikey
3. Click **"Add new secret"**

**Important:** Each team member should use their own API key to avoid quota issues.

### Step 4: Install Dependencies

Open Shell and run:

```bash
cd apps/mastery-cards-app
npm install
```

### Step 5: Run the App

Click **"Run"** button or use Shell:

```bash
cd apps/mastery-cards-app
npm run dev -- --host 0.0.0.0 --port 3000
```

### Step 6: Access the App

- Replit will show the preview in the right panel
- Click **"Open in new tab"** for full-screen experience
- Share the URL with team members for testing

**Important:** Make sure your browser allows microphone access when prompted!

---

## 🚀 Method 2: Copy Just the Prototype

If you want a **standalone Repl** without the monorepo structure:

### Step 1: Create Blank Repl

1. Go to https://replit.com
2. Click **"+ Create Repl"**
3. Select **"Node.js"** template
4. Name it: `mastery-cards-pilot`
5. Click **"Create Repl"**

### Step 2: Copy App Files

In Replit Shell, run:

```bash
# Clone the repo
git clone -b feat/outcome-tracking-pilot https://github.com/Project-Simili/simili-v4 temp

# Copy only mastery-cards-app
cp -r temp/apps/mastery-cards-app/* .

# Clean up
rm -rf temp
```

### Step 3: Configure Environment

1. Click **"Tools"** → **"Secrets"**
2. Add secret:
   - **Key:** `VITE_GEMINI_API_KEY`
   - **Value:** Your Gemini API key

### Step 4: Install and Run

```bash
npm install
npm run dev -- --host 0.0.0.0 --port 3000
```

---

## 🔧 Replit Configuration File

Create `.replit` in root of your Repl:

```toml
# Replit Configuration for Mastery Cards App

run = "npm run dev -- --host 0.0.0.0 --port 3000"

[env]
# Environment variables can be set in Replit Secrets UI

[nix]
channel = "stable-23_11"

[deployment]
deploymentTarget = "static"
publicDir = "dist"
build = ["npm install", "npm run build"]

[languages.javascript]
pattern = "**/*.{js,jsx,ts,tsx}"

[languages.javascript.languageServer]
start = "typescript-language-server --stdio"
```

---

## 🌐 Browser Requirements

**Critical for Audio Features:**

1. **Modern Browser Required:**
   - Chrome 89+ (Recommended)
   - Edge 89+
   - Safari 15.4+
   - Firefox 88+

2. **Microphone Access:**
   - Browser must have microphone permissions
   - Click "Allow" when prompted
   - Check browser settings if blocked

3. **HTTPS Required:**
   - Replit provides HTTPS automatically
   - Microphone only works over HTTPS
   - Local `http://localhost` also works

4. **WebAudio Support:**
   - Required for real-time audio streaming
   - All modern browsers support this

---

## 👥 Team Member Access

### Option A: Invite to Repl (Collaborative)

1. In your Repl, click **"Invite"** button (top right)
2. Enter team member's email or username
3. Select permission level:
   - **Edit:** Can modify code
   - **View:** Read-only access
4. Click **"Send Invite"**

**Benefits:**
- Real-time collaboration
- Shared environment
- Everyone sees same code

**Drawbacks:**
- Shared API quota (use same key)
- Can accidentally overwrite changes
- Only one person can run at a time

---

### Option B: Fork the Repl (Independent)

1. Each team member forks your Repl
2. Steps for team members:
   - Go to your Repl URL
   - Click **"Fork"** button (top right)
   - Add their own API key in Secrets
   - Run independently

**Benefits:**
- Independent API quotas
- Can modify without affecting others
- Multiple people can test simultaneously

**Drawbacks:**
- Code changes don't sync automatically
- Need to manually merge improvements

---

## 🔑 API Key Management

### Option 1: Individual Keys (Recommended for Pilot)

**Each team member gets their own key:**

1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key
4. Add to their Repl's Secrets

**Benefits:**
- Independent quotas (60 requests/minute per key)
- Usage tracking per person
- No conflicts

**Free Tier Limits:**
- 60 requests per minute
- 1,500 requests per day
- Plenty for pilot testing!

---

### Option 2: Shared Key (Quick Start)

**Use one key for all team members:**

1. Create API key
2. Share key securely (Slack DM, 1Password, etc.)
3. Each person adds same key to their Secrets

**Drawbacks:**
- Shared quota (60 req/min total)
- Hard to track individual usage
- Rate limits hit faster

---

## 📊 Testing the Setup

### Quick Verification Checklist

Run this in Replit Shell:

```bash
# 1. Check Node version (should be 18+)
node --version

# 2. Check npm version
npm --version

# 3. Verify dependencies installed
ls node_modules | wc -l
# Should show ~50+ packages

# 4. Check environment variable
echo $VITE_GEMINI_API_KEY
# Should show your API key (or "undefined" if using Secrets)

# 5. Check build works
npm run build
# Should complete without errors

# 6. Check dev server
npm run dev -- --host 0.0.0.0 --port 3000
# Should start without errors
```

### E2E Test Flow

1. **Start the app** - Click Run or `npm run dev`
2. **Allow microphone** - Click "Allow" when browser prompts
3. **Enter student name** - Type any name and click "Let's Go!"
4. **Wait for Pi to speak** - Should hear greeting automatically
5. **Respond verbally** - Say something about the image
6. **Check card advances** - Should progress through cards
7. **Complete session** - Finish all 8 cards
8. **Check transcript downloads** - JSON file should download

**If all 8 steps work, setup is successful!** ✅

---

## 🐛 Common Issues & Fixes

### Issue 1: "Cannot find module" errors

**Symptom:** Build fails with missing module errors

**Fix:**
```bash
cd apps/mastery-cards-app  # If in monorepo
rm -rf node_modules package-lock.json
npm install
```

---

### Issue 2: Microphone not working

**Symptom:** Audio button stays red, no recording

**Fixes:**
1. Check browser permissions (click lock icon in address bar)
2. Ensure you're using HTTPS (Replit does this automatically)
3. Try different browser (Chrome recommended)
4. Check Replit preview → Click "Open in new tab"

---

### Issue 3: API key not found

**Symptom:** Console shows "API key required" error

**Fix:**
1. Verify secret is named exactly `VITE_GEMINI_API_KEY`
2. Restart the Repl (Stop and Run again)
3. Check the key has no extra spaces
4. Verify key works at https://aistudio.google.com/app/apikey

---

### Issue 4: Port already in use

**Symptom:** "Port 3000 already in use" error

**Fix:**
```bash
# Kill existing process
killall node

# Or use different port
npm run dev -- --host 0.0.0.0 --port 3001
```

---

### Issue 5: Build succeeds but preview blank

**Symptom:** Build completes but screen is white

**Fixes:**
1. Check browser console for errors (F12)
2. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. Clear Replit cache: Stop → Clear → Run
4. Check if microphone permission was denied

---

### Issue 6: "WebSocket connection failed"

**Symptom:** Console shows WebSocket errors

**Fix:**
1. Check API key is valid
2. Verify Gemini API is enabled for your key
3. Check quota limits at https://aistudio.google.com
4. Wait a minute and try again (temporary rate limit)

---

## 📦 What's Included

When you import/copy the mastery-cards-app, you get:

```
mastery-cards-app/
├── public/
│   ├── images/                  # 9 card images + Level-Up.png
│   └── pi.png                   # Pi avatar
├── src/
│   ├── components/              # UI components
│   ├── contexts/                # React context providers
│   ├── hooks/                   # Custom hooks
│   ├── lib/                     # Core logic
│   │   ├── audio-recorder.ts
│   │   ├── audio-streamer.ts
│   │   ├── genai-live-client.ts
│   │   ├── cards/               # Card data and levels
│   │   ├── prompts/             # System prompts
│   │   ├── state/               # State management
│   │   └── worklets/            # Audio processing
│   ├── types/                   # TypeScript types
│   ├── App.tsx                  # Main app
│   └── main.tsx                 # Entry point
├── package.json                 # Dependencies
├── vite.config.ts              # Build config
├── tsconfig.json               # TypeScript config
└── *.md                        # Documentation (9 guides)
```

**Total size:** ~15 MB (including images)

---

## 🎓 Team Workflow

### Recommended Workflow for Pilot

1. **Lead Developer:**
   - Imports repo to Replit
   - Sets up configuration
   - Tests full flow
   - Invites team as "View" access

2. **Team Members:**
   - Fork the Repl
   - Add own API key
   - Test independently
   - Report issues in shared doc

3. **Student Testing:**
   - Use lead's Repl URL
   - Students don't need Replit accounts
   - Just visit URL and start testing

4. **Data Collection:**
   - Each Repl generates transcripts
   - Download JSON files after sessions
   - Share via Slack/Drive for analysis

---

## 📊 Monitoring Usage

### Check API Quota

1. Go to https://aistudio.google.com/app/apikey
2. Click on your API key
3. View "Quota & system limits"
4. Monitor:
   - Requests per minute (60 max)
   - Requests per day (1,500 max)

### Check Replit Resources

1. In Repl, click "Resources" tab
2. Monitor:
   - CPU usage
   - Memory usage
   - Storage usage

**Typical usage for pilot:**
- CPU: 10-30% (during active sessions)
- Memory: 100-200 MB
- Storage: 15 MB (app) + transcripts

---

## 🚀 Going Live for Students

### Step 1: Get Permanent URL

1. In Replit, ensure app is running
2. Copy the URL from address bar
3. Format: `https://mastery-cards-pilot-{username}.repl.co`

### Step 2: Share with Students

**Create a simple landing page or doc:**

```
Mastery Cards Pilot - Testing Instructions

1. Go to: [YOUR_REPL_URL]
2. Allow microphone when asked
3. Enter your name
4. Click "Let's Go!"
5. Talk to Pi about fractions

Note: Use Chrome browser for best experience.
Parent permission required for microphone access.
```

### Step 3: Monitor Sessions

- Check Replit console for logs
- Download transcripts after each session
- Track issues in shared spreadsheet

---

## 🔒 Privacy & Security

### Microphone Access

- Audio is streamed to Gemini API
- Not recorded to Repl storage
- Not stored on Gemini servers (per API terms)

### Student Names

- Stored in browser localStorage only
- Not sent to any server
- Included in downloaded transcripts (JSON files)

### Transcripts

- Downloaded to researcher's computer only
- Not uploaded anywhere
- Contains: Name, conversation, timestamps, scores

### API Keys

- Never commit to git
- Store in Replit Secrets only
- Don't share publicly

---

## 🎯 Success Metrics

**Your setup is successful if:**

- ✅ App loads in Replit preview
- ✅ Microphone permission granted
- ✅ Pi speaks automatically on start
- ✅ Student can respond vocally
- ✅ Cards advance properly
- ✅ Points update on screen
- ✅ Level-up animation appears
- ✅ Transcript downloads at end
- ✅ Multiple students can test sequentially
- ✅ No crashes or errors

**Pilot is ready when:**
- ✅ 3+ team members tested successfully
- ✅ Each completed full session (8 cards)
- ✅ Transcripts reviewed and look good
- ✅ No API quota issues
- ✅ Microphone works for everyone
- ✅ URL is sharable and stable

---

## 📞 Support Resources

### Documentation in Repo

- `README.md` - Overview
- `E2E-TESTING-GUIDE.md` - Testing instructions
- `ROBUSTNESS-IMPLEMENTATION.md` - Gaming detection
- `MULTI-STUDENT-GUIDE.md` - Session tracking
- `LEVEL-UP-FEATURE.md` - Animation details

### External Resources

- Replit Docs: https://docs.replit.com
- Gemini API Docs: https://ai.google.dev/gemini-api/docs
- Vite Docs: https://vitejs.dev

### Getting Help

1. Check console for error messages (F12 in browser)
2. Review relevant documentation guide
3. Check Replit community forums
4. Contact repo maintainer

---

## ✅ Quick Start Checklist

**For Team Lead:**
- [ ] Import repo to Replit
- [ ] Configure `.replit` file
- [ ] Add Gemini API key to Secrets
- [ ] Test full E2E flow
- [ ] Invite team members
- [ ] Document stable URL
- [ ] Create testing schedule

**For Team Members:**
- [ ] Fork lead's Repl (or get invite)
- [ ] Add own API key to Secrets
- [ ] Run `npm install`
- [ ] Test microphone access
- [ ] Complete one full session
- [ ] Verify transcript downloads
- [ ] Report any issues

**For Student Pilot:**
- [ ] Test with 2-3 friendly students first
- [ ] Verify different browsers work
- [ ] Check different devices (laptop/tablet)
- [ ] Monitor API quota usage
- [ ] Collect feedback
- [ ] Adjust based on results
- [ ] Scale to full pilot

---

## 🎉 You're Ready!

Once setup is complete, your team can:
- ✅ Test the prototype collaboratively
- ✅ Run pilot sessions with students
- ✅ Collect transcript data
- ✅ Iterate based on feedback

**The system is production-ready for classroom pilot testing!**

---

## 🔄 Updating the Code

If code is updated in GitHub:

**In Replit:**
```bash
cd apps/mastery-cards-app
git pull origin feat/outcome-tracking-pilot
npm install  # If dependencies changed
npm run dev
```

**Or fork a fresh copy** if major changes were made.

---

**Questions? Issues? Check the documentation guides or reach out to the team!**
