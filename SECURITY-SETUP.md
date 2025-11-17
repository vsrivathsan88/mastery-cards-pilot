# 🔒 API Key Security Setup

## ⚠️ Important: Protecting Your Gemini API Key

Your Gemini API key is **visible in the browser** because this is a client-side app. To prevent abuse:

### ✅ Apply These Restrictions

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com/apis/credentials

2. **Click on your API key** to edit it

3. **Set Application Restrictions:**
   - Select: **"HTTP referrers (web sites)"**
   - Add these referrers:
     ```
     https://*.vercel.app/*
     https://*.repl.co/*
     http://localhost:*
     ```

4. **Set API Restrictions:**
   - Select: **"Restrict key"**
   - Enable only: **"Generative Language API"**

5. **Click "Save"**

### 🎯 What This Does

- ✅ Only your domains can use the key
- ✅ Prevents use of key for other Google services
- ✅ Reduces risk if key is discovered
- ✅ Google won't block it as "leaked"

### 📋 Where to Store Your Key

**Vercel (Production):**
- Settings → Environment Variables
- Add: `VITE_GEMINI_API_KEY=your_key`
- Redeploy after changing

**Local Development:**
- File: `native-audio-function-call-sandbox/.env.local`
- Add: `VITE_GEMINI_API_KEY=your_key`
- This file is in `.gitignore` (never committed)

### ⚠️ Never Commit API Keys

`.gitignore` already protects:
- `.env`
- `.env.local`
- `.env*.local`

Always double-check before committing!

---

## 🚨 If Your Key Gets Leaked Again

1. **Revoke it immediately** in Google Cloud Console
2. **Create a new key**
3. **Apply restrictions** (steps above)
4. **Update Vercel** and local `.env.local`
5. **Redeploy**

---

## 📊 Monitoring Usage

Check your API usage:
- https://console.cloud.google.com/apis/dashboard

Set up quota alerts to catch unusual activity.
