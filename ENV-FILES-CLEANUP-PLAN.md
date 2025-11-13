# .env Files Cleanup Plan

## 🚨 CRITICAL: API Keys Are Currently Exposed!

I found your API keys in **3 files with actual secrets**:

1. `/native-audio-function-call-sandbox/.env.local` ⚠️ **HAS KEYS**
2. `/.env` ⚠️ **HAS KEYS**
3. `/server/.env` ⚠️ **HAS KEYS**

Plus **8 template/example files** (these are okay, they're examples).

---

## Current Situation (11 Files Total)

### Files WITH Actual Secrets (DANGER!) 🔴

| File | Purpose | Status | Action Needed |
|------|---------|--------|---------------|
| `native-audio-function-call-sandbox/.env.local` | Frontend dev keys | ✅ In .gitignore | Keep (update keys) |
| `.env` | Root monorepo keys | ⚠️ Might be tracked | **DELETE or move** |
| `server/.env` | Backend dev keys | ⚠️ Might be tracked | **DELETE or move** |
| `gemini-live-reference/.env.local` | Old reference app | ❓ Unknown | Check & delete |

### Template Files (Safe) 🟢

| File | Purpose | Status | Action |
|------|---------|--------|--------|
| `.env.example` | Root template | ✅ Safe | Keep |
| `apps/mastery-cards-app/.env.example` | App template | ✅ Safe | Keep |
| `apps/mastery-cards-app/native-audio-function-call-sandbox/.env.example` | Frontend template | ✅ Safe | Keep |
| `apps/mastery-cards-app/native-audio-function-call-sandbox/.env.local.example` | Duplicate template | 🔄 Redundant | Delete |
| `apps/mastery-cards-app/server/.env.example` | Backend template | ✅ Safe | Keep |
| `apps/tutor-app/.env.template` | Old app | 🗑️ Unused | Delete |
| `apps/api-server/.env.template` | Old app | 🗑️ Unused | Delete |

---

## Recommended Structure (Clean & Simple)

### What You Actually Need

```
apps/mastery-cards-app/
├── apps/mastery-cards-app/
│   ├── native-audio-function-call-sandbox/
│   │   ├── .env.local              ← Your actual frontend keys (gitignored)
│   │   └── .env.example            ← Template for others
│   └── server/
│       ├── .env                    ← Your actual backend keys (gitignored)
│       └── .env.example            ← Template for others
└── .gitignore                      ← Ensures .env* are ignored
```

### What to Delete

```
/.env                                    ← DELETE (duplicate)
/gemini-live-reference/.env.local        ← DELETE (old reference app)
/apps/tutor-app/.env.template            ← DELETE (unused app)
/apps/api-server/.env.template           ← DELETE (unused app)
/apps/mastery-cards-app/.env.example     ← DELETE (duplicate)
/apps/mastery-cards-app/native-audio-function-call-sandbox/.env.local.example  ← DELETE (redundant)
```

---

## Step-by-Step Cleanup (15 minutes)

### Step 1: Check What's Tracked in Git 🔍

```bash
cd /Users/vsrivathsan/Documents/simili-monorepo-v1/apps/mastery-cards-app

# Check if any .env files are tracked
git ls-files | grep -E "\.env$|\.env\.local$"
```

**Expected**: Should return NOTHING (empty output)

**If you see files**: Those files are in git and MUST be removed!

---

### Step 2: Generate Fresh API Keys 🔑

Since your keys are exposed in multiple files, **generate ALL new keys**:

#### Gemini API Key
1. Go to: https://aistudio.google.com/apikey
2. Delete old key or create new one
3. Copy new key: `AIzaSy...`

#### Claude API Key
1. Go to: https://console.anthropic.com/settings/keys
2. Create new key (or use existing if not exposed)
3. Copy key: `sk-ant-...`

#### OpenAI API Key (if needed)
1. Go to: https://platform.openai.com/api-keys
2. Create new key
3. Copy key: `sk-proj-...`

---

### Step 3: Create Clean .env Files 📝

#### Frontend: `apps/mastery-cards-app/native-audio-function-call-sandbox/.env.local`

```bash
cd apps/mastery-cards-app/native-audio-function-call-sandbox
cat > .env.local << 'EOF'
# Mastery Cards Frontend - Local Development
# NEVER commit this file to git!

# Gemini API Key (required)
VITE_GEMINI_API_KEY=AIzaSy_YOUR_NEW_KEY_HERE

# Claude API Key (required for evaluation)
VITE_CLAUDE_API_KEY=sk-ant-YOUR_NEW_KEY_HERE

# Backend URLs (optional - for production)
# VITE_WS_SERVER_URL=wss://your-backend.railway.app/orchestrate
# VITE_BACKEND_URL=https://your-backend.railway.app
EOF
```

#### Backend: `server/.env`

```bash
cd ../../server
cat > .env << 'EOF'
# Orchestration Server - Local Development
# NEVER commit this file to git!

# Server Port
PORT=3001

# Claude API Key (for evaluation)
CLAUDE_API_KEY=sk-ant-YOUR_NEW_KEY_HERE

# Debug logging
DEBUG=true
EOF
```

---

### Step 4: Delete Unsafe/Redundant Files 🗑️

```bash
cd /Users/vsrivathsan/Documents/simili-monorepo-v1/apps/mastery-cards-app

# Delete root .env (duplicate)
rm .env

# Delete old reference app env
rm gemini-live-reference/.env.local

# Delete unused app templates
rm apps/tutor-app/.env.template
rm apps/api-server/.env.template

# Delete duplicate examples
rm apps/mastery-cards-app/.env.example
rm apps/mastery-cards-app/native-audio-function-call-sandbox/.env.local.example

# Verify deletion
git status
```

---

### Step 5: Verify .gitignore is Correct ✅

```bash
cat .gitignore | grep env
```

**Should include**:
```
.env
.env.local
.env*.local
.env.development
.env.test
.env.production
*.key
```

**If missing, add them**:
```bash
cat >> .gitignore << 'EOF'

# Environment variables (NEVER commit these!)
.env
.env.local
.env*.local
.env.development
.env.test
.env.production
EOF
```

---

### Step 6: Commit the Cleanup 📦

```bash
# Stage deletions
git add -A

# Commit
git commit -m "security: clean up duplicate .env files and remove unused templates

- Deleted duplicate .env files that had exposed keys
- Removed old app templates (tutor-app, api-server)
- Removed redundant .env.example files
- Kept only necessary .env.example templates

All actual keys are now in .env.local (gitignored)
"

# Push
git push origin main
```

---

### Step 7: Verify Nothing is Tracked ✅

```bash
# Check git doesn't track any actual env files
git ls-files | grep -E "\.env$|\.env\.local$"
```

**Expected**: Empty output (nothing found)

**If files found**: They're still tracked! Remove them:
```bash
git rm --cached .env
git rm --cached server/.env
git commit -m "security: remove tracked .env files"
git push origin main
```

---

### Step 8: Update Vercel Environment Variables 🚀

Since you have new keys:

1. Go to https://vercel.com
2. Project → Settings → Environment Variables
3. Update:
   - `VITE_GEMINI_API_KEY` = Your NEW Gemini key
   - `VITE_CLAUDE_API_KEY` = Your NEW Claude key
4. Redeploy: Deployments → ... → Redeploy

---

## Final Structure (Clean!)

After cleanup, you'll have:

```
apps/mastery-cards-app/
├── .gitignore                      ✅ Ignores all .env files
├── .env.example                    ✅ Root template (safe)
│
├── apps/mastery-cards-app/
│   ├── native-audio-function-call-sandbox/
│   │   ├── .env.local              🔒 YOUR KEYS (gitignored)
│   │   └── .env.example            ✅ Template (safe)
│   │
│   └── server/
│       ├── .env                    🔒 YOUR KEYS (gitignored)
│       └── .env.example            ✅ Template (safe)
│
└── DELETED:
    ✗ /.env                         (was duplicate)
    ✗ /gemini-live-reference/.env.local
    ✗ /apps/tutor-app/.env.template
    ✗ /apps/api-server/.env.template
    ✗ /apps/mastery-cards-app/.env.example
    ✗ /apps/mastery-cards-app/native-audio-function-call-sandbox/.env.local.example
```

**Total**: **2 files with secrets** (both gitignored) + **3 safe templates**

---

## Why This Matters

### Before (Messy & Dangerous)
- ❌ 11 .env files (confusing!)
- ❌ Keys in 3 different places
- ❌ Duplicate templates
- ❌ Keys might be in git history
- ❌ Hard to know which file to use

### After (Clean & Safe)
- ✅ 2 files with secrets (both gitignored)
- ✅ 3 templates for documentation
- ✅ Clear structure
- ✅ New keys (old ones exposed)
- ✅ Easy to understand

---

## Prevention: Never Commit Keys Again!

### Pre-Commit Checklist
Before every `git commit`:
```bash
# 1. Check status
git status

# 2. Check diff
git diff

# 3. Look for these patterns (BAD if found):
# - .env.local in red or green
# - AIzaSy... anywhere
# - sk-ant-... anywhere
# - sk-proj-... anywhere
```

### Use a Git Hook (Advanced)
```bash
# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
if git diff --cached --name-only | grep -E "\.env$|\.env\.local$"; then
    echo "ERROR: Attempting to commit .env file!"
    exit 1
fi
EOF

chmod +x .git/hooks/pre-commit
```

---

## Checklist

### Immediate Actions
- [ ] Generate new Gemini API key
- [ ] Generate new Claude API key
- [ ] Create clean `.env.local` (frontend)
- [ ] Create clean `.env` (backend)
- [ ] Delete duplicate/unsafe .env files (6 files)
- [ ] Verify .gitignore includes .env patterns
- [ ] Commit cleanup
- [ ] Push to GitHub
- [ ] Verify no .env files are tracked

### Update Production
- [ ] Update Vercel with new API keys
- [ ] Redeploy Vercel
- [ ] Test production app
- [ ] Verify no "key leaked" errors

---

## Summary

**Problem**: 11 .env files, keys in 3 files, potential git exposure
**Solution**: 2 gitignored files with new keys, 3 safe templates
**Time**: ~15 minutes
**Risk**: 🟢 LOW (just follow the steps!)

---

**Remember**: When in doubt, DON'T commit .env files! Only commit .env.example templates!

---

Generated: 2025-11-13
Status: 🚨 ACTION REQUIRED
Priority: 🔴 HIGH (Security)
