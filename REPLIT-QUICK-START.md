# 5-Minute Replit Deployment

## Quick Setup (Choose One)

### Option A: Upload Folder (Fastest - 2 minutes)

1. **Zip this directory** on your computer
2. Go to https://replit.com → **Create Repl** → **Import from Upload**
3. Upload the zip file
4. **Add API Key**: Click Tools → Secrets → Add:
   - Key: `VITE_GEMINI_API_KEY`
   - Value: [Your Gemini API key](https://aistudio.google.com/app/apikey)
5. Click **Run** (Replit auto-detects config)

### Option B: Import from GitHub (3 minutes)

1. Go to https://replit.com → **Create Repl** → **Import from GitHub**
2. URL: `https://github.com/Project-Simili/simili-v4`
3. Branch: `feat/outcome-tracking-pilot`
4. **After import**, open Shell and run:
   ```bash
   cp -r apps/mastery-cards-app/{*,.*} . && rm -rf apps packages pnpm-workspace.yaml
   ```
5. **Add API Key**: Tools → Secrets:
   - Key: `VITE_GEMINI_API_KEY`  
   - Value: [Your key](https://aistudio.google.com/app/apikey)
6. Click **Run**

---

## Share with Team

Once running:
1. Copy the URL from browser (format: `https://[name].repl.co`)
2. Send to team: "Test at [URL] - allow microphone when prompted"
3. They can use immediately (no Replit account needed)

---

## Quick Test

1. Allow microphone
2. Enter name → "Let's Go!"
3. Pi should speak automatically
4. Talk about the fractions
5. Complete 8 cards

**Working?** ✅ Share URL with team!

---

## Troubleshooting

- **Blank screen?** Hard refresh (Cmd+Shift+R)
- **No audio?** Check microphone permissions in browser
- **API error?** Verify key in Secrets is named exactly `VITE_GEMINI_API_KEY`
