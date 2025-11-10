# Quick Start - Mastery Cards Pilot

## 🚀 For Team Members

### Setup in 5 Minutes

1. **Go to Replit**
   - Visit: https://replit.com
   - Sign in with GitHub

2. **Import the Repo**
   - Click "+ Create Repl"
   - Select "Import from GitHub"
   - URL: `https://github.com/Project-Simili/simili-v4`
   - Branch: `feat/outcome-tracking-pilot`

3. **Add API Key**
   - Click "Tools" → "Secrets" (lock icon)
   - Add: `VITE_GEMINI_API_KEY` = [your key from https://aistudio.google.com/app/apikey]

4. **Configure Replit**
   - Create `.replit` file with:
   ```toml
   run = "cd apps/mastery-cards-app && npm install && npm run dev -- --host 0.0.0.0 --port 3000"
   ```

5. **Run the App**
   - Click "Run" button
   - Allow microphone when prompted
   - Test with your name!

**That's it!** 🎉

---

## 📋 Daily Testing Checklist

Before each pilot session:

- [ ] App loads successfully
- [ ] Microphone permission granted
- [ ] Pi speaks greeting automatically
- [ ] Can respond and hear Pi's response
- [ ] Cards advance properly
- [ ] Points update correctly
- [ ] Level-up animation appears (at 100/250/500 pts)
- [ ] Transcript downloads at end

---

## 🎯 For Student Testing

Share this with students:

```
Mastery Cards - Fraction Practice

1. Go to: [YOUR_REPL_URL]
2. Click "Allow" when asked for microphone
3. Enter your name
4. Click "Let's Go!"
5. Talk to Pi about the pictures

Use Chrome browser for best results!
```

---

## 📊 After Each Session

1. **Download transcript** - Saves automatically as JSON
2. **Check console** - Press F12, look for errors
3. **Note issues** - Write down any bugs or confusion
4. **Check quota** - Go to https://aistudio.google.com/app/apikey

---

## 🐛 Common Fixes

**Microphone not working?**
- Check browser permissions (click lock icon in address bar)
- Use Chrome (recommended)
- Open in new tab (not preview pane)

**API key error?**
- Verify spelling: `VITE_GEMINI_API_KEY`
- Stop and Run again (restart Repl)
- Check key at https://aistudio.google.com/app/apikey

**App won't start?**
```bash
cd apps/mastery-cards-app
rm -rf node_modules
npm install
npm run dev -- --host 0.0.0.0 --port 3000
```

---

## 📚 Full Documentation

**For detailed guides, see:**

| Guide | Purpose |
|-------|---------|
| `REPLIT-SETUP.md` | Complete deployment guide |
| `E2E-TESTING-GUIDE.md` | Testing procedures |
| `MULTI-STUDENT-GUIDE.md` | Session tracking |
| `ROBUSTNESS-IMPLEMENTATION.md` | Gaming detection |
| `LEVEL-UP-FEATURE.md` | Animation details |

---

## 🆘 Need Help?

1. Check console for errors (F12)
2. Review relevant guide above
3. Ask in team channel

---

## ✅ Success = All 8 Steps Work

1. ✅ App loads
2. ✅ Mic granted
3. ✅ Pi speaks first
4. ✅ Student responds
5. ✅ Card advances
6. ✅ Points update
7. ✅ Level-up appears
8. ✅ Transcript downloads

**If all 8 work, you're ready for pilot testing!** 🎉
