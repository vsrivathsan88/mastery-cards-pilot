# 🚀 Cloud Run Deployment - Step by Step

This guide will help you deploy Mastery Cards to Google Cloud Run with **secure, keyless authentication**.

---

## ✅ Prerequisites

### 1. Install Google Cloud CLI

**Mac:**
```bash
brew install google-cloud-sdk
```

**Windows/Linux:**
Download from: https://cloud.google.com/sdk/docs/install

### 2. Verify Installation
```bash
gcloud --version
```

You should see version info.

---

## 🔧 One-Time Setup (15 minutes)

### Step 1: Authenticate with Google Cloud

```bash
gcloud auth login
```

This opens your browser to sign in with your Google account.

### Step 2: Create a Project (or use existing)

**Create new:**
```bash
gcloud projects create mastery-cards-prod --name="Mastery Cards Production"
gcloud config set project mastery-cards-prod
```

**Or use existing:**
```bash
gcloud config set project YOUR_PROJECT_ID
```

### Step 3: Enable Required APIs

```bash
# Enable Cloud Run
gcloud services enable run.googleapis.com

# Enable Cloud Build (for automated builds)
gcloud services enable cloudbuild.googleapis.com

# Enable Container Registry
gcloud services enable containerregistry.googleapis.com

# Enable Gemini API
gcloud services enable generativelanguage.googleapis.com
```

This takes ~30 seconds.

### Step 4: Grant Service Account Permissions

The Cloud Run service needs permission to call Gemini API:

```bash
# Get your project number
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')

# Grant AI Platform user role
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

### Step 5: Enable Billing (Required)

Cloud Run requires a billing account (but has a generous free tier).

1. Go to: https://console.cloud.google.com/billing
2. Link your project to a billing account
3. Free tier includes:
   - 2 million requests/month
   - 360,000 GB-seconds/month
   - **Your pilot will likely cost $0-5/month**

---

## 🚀 Deploy (3-5 minutes)

From the `native-audio-function-call-sandbox` directory:

```bash
./deploy.sh
```

That's it! The script will:
1. ✅ Build your Docker container
2. ✅ Push to Google Container Registry
3. ✅ Deploy to Cloud Run
4. ✅ Show you the URL

**First deployment:** ~5-7 minutes
**Subsequent deployments:** ~2-3 minutes

---

## 🌐 Your Production URL

After deployment, you'll get a URL like:
```
https://mastery-cards-XXXXXXXXX-uc.a.run.app
```

This is your **secure production URL**:
- ✅ No API key exposed
- ✅ Uses service account authentication
- ✅ Auto-scales to zero (saves money)
- ✅ HTTPS by default

---

## 🎯 Testing

After deployment:

1. **Open the URL** in your browser
2. **Test a session** - it should work perfectly
3. **Check logs:**
   ```bash
   gcloud run services logs read mastery-cards --region=us-central1
   ```

---

## 🔄 Updating Your App

Just run `./deploy.sh` again! It will:
- Build with latest code
- Deploy with zero downtime
- Keep previous version as backup

---

## 💰 Cost Monitoring

**Check usage:**
```bash
gcloud run services describe mastery-cards --region=us-central1
```

**Set budget alerts:**
1. Go to: https://console.cloud.google.com/billing
2. Click "Budgets & alerts"
3. Set alert at $10/month

---

## 🐛 Troubleshooting

### "Permission denied"
```bash
gcloud auth login
```

### "Project not found"
```bash
gcloud config get-value project  # Check current project
gcloud config set project YOUR_PROJECT_ID
```

### "API not enabled"
Run the enable commands from Step 3 above.

### "Billing not enabled"
Go to: https://console.cloud.google.com/billing

### Build fails
Check logs:
```bash
gcloud builds list --limit=5
gcloud builds log BUILD_ID
```

---

## 📊 Monitoring & Logs

**View logs:**
```bash
gcloud run services logs read mastery-cards --region=us-central1 --limit=50
```

**View in browser:**
https://console.cloud.google.com/run

**Stream logs in real-time:**
```bash
gcloud run services logs tail mastery-cards --region=us-central1
```

---

## 🎉 You're Done!

Your app is now:
- ✅ **Secure** - No API key to leak
- ✅ **Scalable** - Auto-scales with traffic
- ✅ **Fast** - Runs in Google's network
- ✅ **Cheap** - Pay only for what you use

**Share your Cloud Run URL with users - it will never get blocked!** 🚀
