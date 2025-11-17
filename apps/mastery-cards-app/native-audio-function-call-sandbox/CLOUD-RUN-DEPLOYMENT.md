# 🚀 Cloud Run Deployment Guide

## ✅ Prerequisites

You need:
1. ✅ Google Cloud account
2. ✅ `gcloud` CLI installed
3. ✅ A Google Cloud project created
4. ✅ Required APIs enabled

---

## 📝 Setup Steps (One-Time)

### 1. Install Google Cloud CLI

**Mac:**
```bash
brew install google-cloud-sdk
```

**Other OS:**
- Download from: https://cloud.google.com/sdk/docs/install

### 2. Authenticate
```bash
gcloud auth login
```

### 3. Create/Select Project
```bash
# Create new project
gcloud projects create mastery-cards-prod --name="Mastery Cards"

# Or select existing project
gcloud config set project YOUR_PROJECT_ID
```

### 4. Enable Required APIs
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable generativelanguage.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### 5. Grant Service Account Permissions

The Cloud Run service needs permission to access Gemini API:

```bash
# Get your project number
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')

# Grant permissions
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

---

## 🚀 Deploy

From the `native-audio-function-call-sandbox` directory:

```bash
./deploy.sh
```

That's it! The script will:
1. Build your Docker container
2. Push it to Google Container Registry
3. Deploy to Cloud Run
4. Show you the URL

**First deploy takes ~5-10 minutes. Subsequent deploys: ~2-3 minutes.**

---

## 🌐 Your App URL

After deployment, you'll get a URL like:
```
https://mastery-cards-XXXXXXXXX-uc.a.run.app
```

This is your production URL! 🎉

---

## 💰 Cost Estimate

Cloud Run free tier includes:
- 2 million requests/month
- 360,000 GB-seconds/month
- 180,000 vCPU-seconds/month

**For your pilot:** Likely **$0-5/month**

---

## 🔧 Troubleshooting

### Build fails with "permission denied"
```bash
# Make sure you're authenticated
gcloud auth login
```

### "Project not found"
```bash
# Verify project ID
gcloud config get-value project

# Set correct project
gcloud config set project YOUR_PROJECT_ID
```

### "API not enabled"
Run the enable commands from step 4 above.

---

## 📊 Monitoring

View logs:
```bash
gcloud run services logs read mastery-cards --region=us-central1
```

View deployment details:
```bash
gcloud run services describe mastery-cards --region=us-central1
```

---

## 🔄 Update Deployment

Just run `./deploy.sh` again! It will:
- Build new container with latest code
- Deploy with zero downtime
- Keep previous version as backup

---

## 🎉 Benefits

✅ **No API key needed** - Uses service account authentication
✅ **Auto-scaling** - Scales to zero when not used
✅ **Fast** - Low latency to Gemini API
✅ **Secure** - Runs in Google's infrastructure
✅ **Simple** - One command deployment

---

## Need Help?

Check the official docs:
- Cloud Run: https://cloud.google.com/run/docs
- Gemini API: https://ai.google.dev/gemini-api/docs
