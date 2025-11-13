# 🚨 URGENT: API Key Leaked - Immediate Action Required

**Status**: Your Gemini API key was exposed and Google has disabled it.

---

## What Happened

Google detected that your API key was publicly exposed (likely committed to GitHub) and automatically disabled it for security. This is actually **good** - it means their security systems are working!

The error message in your console:
```
Your API key was reported as leaked. Please use another API key.
```

---

## Immediate Actions Required

### Step 1: Generate a New Gemini API Key (2 minutes)

1. Go to https://aistudio.google.com/apikey
2. Find your old key (it will show as "disabled" or "restricted")
3. Click "Create API Key"
4. **COPY THE NEW KEY IMMEDIATELY**
5. Save it somewhere safe (password manager, secure note)

**New Key**: `AIzaSy___________________________________`

---

### Step 2: Check GitHub for Exposed Keys (5 minutes)

Your API key might be in your GitHub repository history. Let's check:

1. Go to https://github.com/vsrivathsan88/mastery-cards-pilot
2. Use GitHub's search: Press `/` then search for `AIzaSy`
3. If you find the key in any files or commits:

**Option A: If Key Found in Current Files**
```bash
# Remove the file with the key
git rm apps/mastery-cards-app/native-audio-function-call-sandbox/.env.local
git commit -m "security: remove leaked API key file"
git push origin main
```

**Option B: If Key is in Git History** (More serious)
You need to remove it from history:
```bash
# This is complex - consider making the repo private instead
# Go to GitHub → Settings → Change visibility → Make private
```

---

### Step 3: Update Local .env File (1 minute)

Update your local `.env.local` file with the NEW key:

```bash
cd apps/mastery-cards-app/native-audio-function-call-sandbox
```

Edit `.env.local`:
```
VITE_GEMINI_API_KEY=AIzaSy_YOUR_NEW_KEY_HERE
VITE_CLAUDE_API_KEY=sk-ant-YOUR_EXISTING_KEY
```

**Verify it's in .gitignore**:
```bash
# Check that .env.local is ignored
git status
# Should NOT show .env.local in red (unstaged) or green (staged)
```

---

### Step 4: Update Vercel Environment Variables (2 minutes)

**CRITICAL**: You also need to update Vercel!

1. Go to https://vercel.com
2. Go to your project → Settings → Environment Variables
3. Find `VITE_GEMINI_API_KEY`
4. Click "Edit" (pencil icon)
5. Paste your **NEW** API key
6. Click "Save"
7. Redeploy:
   - Go to Deployments tab
   - Click "..." on latest deployment
   - Click "Redeploy"

---

## Secondary Issue: Still Using Localhost

I also see this in your logs:
```
[App] 🔗 WebSocket server URL: ws://localhost:3001/orchestrate
```

This means the `VITE_WS_SERVER_URL` environment variable is **NOT set** in Vercel.

### Fix for Localhost Issue

**Option 1: Set Environment Variable (Recommended)**
1. Deploy backend to Railway first (see `SAFE-DEPLOYMENT-WALKTHROUGH.md`)
2. Add `VITE_WS_SERVER_URL` and `VITE_BACKEND_URL` to Vercel
3. Redeploy

**Option 2: Use Without Backend (Temporary)**
- The app will work in "client-side only" mode
- Evaluation happens locally in the browser
- WebSocket errors are expected and harmless (it falls back gracefully)

---

## Prevention: Never Commit API Keys Again

### Check Before Every Commit

```bash
# Before git add, check what you're adding:
git status
git diff

# Make sure you NEVER see:
# - .env.local
# - Any file with "AIzaSy" or "sk-ant-"
```

### Use This Pre-Commit Checklist

Before `git commit`:
- [ ] Run `git status` - no .env files shown?
- [ ] Run `git diff` - no API keys visible?
- [ ] Double-check `.gitignore` includes `.env.local`

---

## How Keys Get Leaked (Learn from This)

**Common Ways**:
1. ❌ Committing `.env` or `.env.local` files
2. ❌ Hardcoding keys in source code
3. ❌ Pasting keys in documentation that gets committed
4. ❌ Accidentally `git add .` without checking

**How to Prevent**:
1. ✅ Always use `.env.local` (ignored by git)
2. ✅ Use `import.meta.env.VITE_*` in code (never hardcode)
3. ✅ Use placeholders in documentation (`your_key_here`)
4. ✅ Check `git status` and `git diff` before committing

---

## Current Status Checklist

- [ ] Generated new Gemini API key
- [ ] Updated local `.env.local` with new key
- [ ] Verified `.env.local` is in `.gitignore`
- [ ] Updated Vercel environment variable with new key
- [ ] Redeployed Vercel app
- [ ] Tested app - Gemini connection works?
- [ ] (Optional) Made GitHub repo private
- [ ] (Optional) Removed key from git history

---

## Test That It's Fixed

After completing the steps above:

1. **Test Locally**:
```bash
cd apps/mastery-cards-app/native-audio-function-call-sandbox
npm run dev
```
Open http://localhost:3000 and check console - should NOT see "key leaked" error

2. **Test Production**:
- Open your Vercel URL
- Press F12 → Console
- Should see "Connected to Gemini Live" without errors

---

## Important Notes

### About the Leaked Key

- ✅ Google disabled it automatically (good security!)
- ✅ Attackers can't use it anymore
- ✅ Your new key is safe (if you don't commit it!)
- ✅ This is a common mistake - you're not alone!

### About API Key Security

**Client-Side Keys** (like Gemini):
- Exposed to users in browser (this is normal)
- Protected by domain restrictions and usage quotas
- Still shouldn't be in GitHub though

**Server-Side Keys** (like Claude):
- NEVER exposed to browser
- Only used on backend server
- Much more critical to keep secret

---

## Future Best Practices

1. **Use Environment Variables** (you're already doing this! ✅)
2. **Never commit .env files** (check .gitignore ✅)
3. **Use GitHub Secrets** for sensitive automation
4. **Rotate keys regularly** (every few months)
5. **Monitor API usage** (to detect unauthorized use)

---

## Summary

**What to do RIGHT NOW**:
1. Get new Gemini API key
2. Update local `.env.local`
3. Update Vercel environment variable
4. Redeploy Vercel

**Time required**: ~10 minutes

**Risk level**: 🟡 MEDIUM (fixable quickly)

---

## Need Help?

If you're stuck:
1. Check Google AI Studio for your API key status
2. Verify Vercel environment variables are saved
3. Check browser console after redeploying
4. Ask me for help with specific error messages!

---

**Remember**: This is a learning experience! Every developer makes this mistake once. The important thing is you know how to fix it now! 💪

---

Generated: 2025-11-13
Status: 🚨 ACTION REQUIRED
