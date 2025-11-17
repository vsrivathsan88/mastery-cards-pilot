# 🚀 Complete Google Cloud Run Setup Guide

**For users who already have gcloud installed for work and want to add a personal project.**

This guide walks you through:
1. ✅ Installing gcloud CLI (if needed)
2. ✅ Setting up separate work and personal profiles
3. ✅ Creating a personal Google Cloud project
4. ✅ Deploying Mastery Cards to Cloud Run
5. ✅ Managing both accounts easily

---

## 📋 Table of Contents

1. [Install Google Cloud SDK](#1-install-google-cloud-sdk)
2. [Create Work and Personal Profiles](#2-create-work-and-personal-profiles)
3. [Set Up Personal Project](#3-set-up-personal-project)
4. [Enable Billing](#4-enable-billing)
5. [Enable Required APIs](#5-enable-required-apis)
6. [Grant Service Account Permissions](#6-grant-service-account-permissions)
7. [Deploy to Cloud Run](#7-deploy-to-cloud-run)
8. [Switching Between Profiles](#8-switching-between-profiles)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Install Google Cloud SDK

### Option A: Fresh Install (Recommended)

If you're having issues with Homebrew, use the official installer:

```bash
# Download and install
curl https://sdk.cloud.google.com | bash

# Restart your shell
exec -l $SHELL

# Verify installation
gcloud --version
```

You should see:
```
Google Cloud SDK 547.0.0 (or newer)
```

### Option B: Using Homebrew (If Working)

```bash
brew install google-cloud-sdk

# Add to PATH if needed
echo 'export PATH="/opt/homebrew/share/google-cloud-sdk/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

---

## 2. Create Work and Personal Profiles

This lets you easily switch between your work and personal Google Cloud accounts.

### Step 1: List Existing Configurations

```bash
gcloud config configurations list
```

You'll see something like:
```
NAME     IS_ACTIVE  ACCOUNT                    PROJECT
default  True       you@work.com               work-project-123
```

### Step 2: Create Personal Configuration

```bash
# Create a new configuration called "personal"
gcloud config configurations create personal
```

Output:
```
Created [personal].
Activated [personal].
```

### Step 3: Create Work Configuration (If Needed)

If you don't have a dedicated work config:

```bash
# Switch back to default
gcloud config configurations activate default

# Copy the default config to a new config called "work"
gcloud config configurations create work

# (Optional) Set the same project/account/etc. in "work" as in "default", if needed.

# (Optional) If you don't want to keep "default", you can delete it:
# gcloud config configurations delete default
```
_Note: The `gcloud config configurations rename` command is not supported. Instead, you need to create a new configuration with the desired name and copy any necessary settings._
```

### Step 4: Verify Configurations

```bash
gcloud config configurations list
```

Now you should see:
```
NAME      IS_ACTIVE  ACCOUNT           PROJECT
work      False      you@work.com      work-project-123
personal  True       (not set)         (not set)
```

---

## 3. Set Up Personal Project

Make sure you're in the `personal` configuration:

```bash
# Activate personal profile
gcloud config configurations activate personal

# Verify
gcloud config configurations list
# Should show personal with IS_ACTIVE = True
```

### Step 1: Authenticate with Personal Google Account

```bash
gcloud auth login
```

This will:
1. Open your browser
2. Ask you to sign in
3. **Important:** Sign in with your **PERSONAL** Google account (not work!)
4. Grant permissions

### Step 2: Create a New Project

```bash
# Create project (choose a unique ID)
# 1. Create your new project (remember the ID must be globally unique)
gcloud projects create mastery-cards-prod --name="Mastery Cards Personal"

# 2. Wait until the project creation completes above (watch terminal for "done.")

# 3. Enable necessary APIs (required for most features, including Cloud Run):
gcloud services enable cloudapis.googleapis.com

# 4. (Recommended) Add an environment tag for best practices.
#    You can set 'Production', 'Development', etc.
gcloud resource-manager tags bindings create \
  --tag-value=environment/Production \
  --parent=projects/mastery-cards-prod

# 5. Set the new project as active for this config:
gcloud config set project mastery-cards-prod

# 6. Verify your current project:
gcloud config get-value project

# Output should be:
# mastery-cards-prod

# Set as active project
gcloud config set project mastery-cards-prod

# Verify
gcloud config get-value project
```

Output should be:
```
mastery-cards-prod
```

### Step 3: Set Your Personal Account

```bash
# Set account for this configuration
gcloud config set account YOUR_PERSONAL_EMAIL@gmail.com

# Verify configuration
gcloud config list
```

You should see:
```
[core]
account = YOUR_PERSONAL_EMAIL@gmail.com
project = mastery-cards-prod
```

---

## 4. Enable Billing

Cloud Run requires billing to be enabled (but has a generous free tier).

### Option A: Via Browser (Easier)

1. Go to: https://console.cloud.google.com/billing
2. Click **"Link a billing account"**
3. Create a new billing account or select existing
4. Link it to `mastery-cards-prod` project
5. Add a payment method (credit card)

**Important:** Set up budget alerts!
- Go to: https://console.cloud.google.com/billing/budgets
- Click **"Create Budget"**
- Set amount: **$10/month**
- Set alert at: **50%, 90%, 100%**

### Option B: Via Command Line

```bash
# List billing accounts
gcloud billing accounts list

# Link billing account to project
gcloud billing projects link mastery-cards-prod \
  --billing-account=BILLING_ACCOUNT_ID
```

### Verify Billing is Enabled

```bash
gcloud billing projects describe mastery-cards-prod
```

Should show:
```
billingEnabled: true
```

---

## 5. Enable Required APIs

```bash
# Make sure you're in personal profile
gcloud config configurations activate personal

# Enable Cloud Run API
gcloud services enable run.googleapis.com

# Enable Cloud Build API (for automated builds)
gcloud services enable cloudbuild.googleapis.com

# Enable Container Registry API
gcloud services enable containerregistry.googleapis.com

# Enable Generative Language API (Gemini)
gcloud services enable generativelanguage.googleapis.com

# Enable IAM API (for permissions)
gcloud services enable iam.googleapis.com
```

**This takes ~30-60 seconds per API.**

### Verify APIs are Enabled

```bash
gcloud services list --enabled
```

You should see all the APIs listed above.

---

## 6. Grant Service Account Permissions

Your Cloud Run service needs permission to call the Gemini API.

```bash
# Get your project number
PROJECT_NUMBER=$(gcloud projects describe mastery-cards-prod \
  --format='value(projectNumber)')

# Show the project number (just to verify)
echo "Project Number: $PROJECT_NUMBER"

# Grant AI Platform User role to the default compute service account
gcloud projects add-iam-policy-binding mastery-cards-prod \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

Output should say:
```
Updated IAM policy for project [mastery-cards-prod].
```

### Verify Permissions

```bash
# List IAM policies for your project
gcloud projects get-iam-policy mastery-cards-prod \
  --flatten="bindings[].members" \
  --format='table(bindings.role)' \
  --filter="bindings.members:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
```

You should see `roles/aiplatform.user` in the list.

---

## 7. Deploy to Cloud Run

Now we're ready to deploy!

### Step 1: Navigate to Your App Directory

```bash
cd /path/to/apps/mastery-cards-app/native-audio-function-call-sandbox
```

### Step 2: Run the Deploy Script

```bash
./deploy.sh
```

The script will:
1. ✅ Check you're logged in
2. ✅ Verify project is set
3. ✅ Build your Docker container (~3-5 minutes)
4. ✅ Push to Google Container Registry
5. ✅ Deploy to Cloud Run
6. ✅ Show your production URL

### Expected Output

```
╔════════════════════════════════════════╗
║        ✅ Deployment Complete!         ║
╚════════════════════════════════════════╝

🌐 Your app is live at:
https://mastery-cards-XXXXXXXXX-uc.a.run.app
```

### Step 3: Test Your Deployment

Open the URL in your browser. You should see your app load!

**Important:** No API key needed - it uses service account authentication! 🎉

---

## 8. Switching Between Profiles

### Quick Switch Commands

**Switch to Personal (Mastery Cards):**
```bash
gcloud config configurations activate personal
```

**Switch to Work:**
```bash
gcloud config configurations activate work
```

### Check Current Profile

```bash
# See which profile is active
gcloud config configurations list

# See current account and project
gcloud config list
```

### Pro Tip: Add Aliases to Your Shell

Add to `~/.zshrc` (or `~/.bashrc`):

```bash
# Google Cloud profile shortcuts
alias gcloud-personal='gcloud config configurations activate personal'
alias gcloud-work='gcloud config configurations activate work'
alias gcloud-current='gcloud config list'
```

Then reload:
```bash
source ~/.zshrc
```

Now you can just type:
```bash
gcloud-personal
gcloud-work
gcloud-current
```

---

## 9. Troubleshooting

### Problem: "gcloud: command not found"

**Solution:**

```bash
# Add to PATH
echo 'export PATH="$HOME/google-cloud-sdk/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Or if using Homebrew install
echo 'export PATH="/opt/homebrew/share/google-cloud-sdk/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Problem: "Permission Denied" Errors

**Solution:**

```bash
# Re-authenticate
gcloud auth login

# Make sure you're in the right configuration
gcloud config configurations activate personal

# Verify account
gcloud config get-value account
```

### Problem: "Billing Not Enabled"

**Solution:**

1. Go to: https://console.cloud.google.com/billing
2. Link billing account to `mastery-cards-prod`
3. Verify:
   ```bash
   gcloud billing projects describe mastery-cards-prod
   ```

### Problem: "API Not Enabled"

**Solution:**

```bash
# Enable the specific API that's missing
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
# etc.
```

### Problem: Build Fails During Deployment

**Solution:**

```bash
# Check build logs
gcloud builds list --limit=5

# Get detailed logs for specific build
gcloud builds log BUILD_ID

# Common fixes:
# 1. Make sure you're in the right directory (native-audio-function-call-sandbox)
# 2. Check that Dockerfile exists
# 3. Verify package.json has all dependencies
```

### Problem: "Service Account Permissions" Error

**Solution:**

```bash
# Re-run the permission grant command
PROJECT_NUMBER=$(gcloud projects describe mastery-cards-prod --format='value(projectNumber)')
gcloud projects add-iam-policy-binding mastery-cards-prod \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

### Problem: Deployment Succeeds But App Shows Errors

**Solution:**

```bash
# Check Cloud Run logs
gcloud run services logs read mastery-cards --region=us-central1 --limit=50

# Stream logs in real-time
gcloud run services logs tail mastery-cards --region=us-central1
```

---

## 📊 Monitoring & Management

### View Your Deployments

```bash
# List Cloud Run services
gcloud run services list --region=us-central1

# Get details about your service
gcloud run services describe mastery-cards --region=us-central1
```

### View Logs

```bash
# Recent logs
gcloud run services logs read mastery-cards --region=us-central1 --limit=100

# Live logs
gcloud run services logs tail mastery-cards --region=us-central1
```

### Check Costs

**Via Browser:**
- Go to: https://console.cloud.google.com/billing
- Select your billing account
- View detailed usage

**Via Command:**
```bash
# Get current month's costs (approximate)
gcloud billing accounts list
```

### Update Your Deployment

Just run the deploy script again:

```bash
cd /path/to/native-audio-function-call-sandbox
./deploy.sh
```

It will:
- Build with latest code
- Deploy with zero downtime
- Keep previous version as backup

---

## 💰 Cost Expectations

### Free Tier (Monthly)
- **2 million requests**
- **360,000 GB-seconds** of memory
- **180,000 vCPU-seconds**

### For Your Pilot
With moderate usage (50-100 users testing):
- **Estimated cost:** $0-5/month
- Cloud Run scales to zero when idle (saves money!)
- Only pay when app is actively serving requests

### Set Budget Alerts
1. Go to: https://console.cloud.google.com/billing/budgets
2. Create budget: **$10/month**
3. Set alerts at: **50%, 90%, 100%**
4. Get email notifications if you're approaching limit

---

## 🎉 You're Done!

Your app is now deployed with:
- ✅ **No API key exposure** (uses service account)
- ✅ **Auto-scaling** (scales to zero when idle)
- ✅ **Production-ready security**
- ✅ **Separate work/personal profiles**
- ✅ **HTTPS by default**

### Your URLs

**Production (Cloud Run):**
```
https://mastery-cards-XXXXXXXXX-uc.a.run.app
```
→ Share this with users!

**Testing (Vercel):**
```
https://mastery-cards-pilot.vercel.app
```
→ Keep for quick testing

---

## 📚 Useful Resources

**Google Cloud Console:**
- Projects: https://console.cloud.google.com/home
- Cloud Run: https://console.cloud.google.com/run
- Billing: https://console.cloud.google.com/billing
- Logs: https://console.cloud.google.com/logs

**Documentation:**
- Cloud Run Docs: https://cloud.google.com/run/docs
- gcloud CLI: https://cloud.google.com/sdk/gcloud
- Gemini API: https://ai.google.dev/gemini-api/docs

**Support:**
- Stack Overflow: https://stackoverflow.com/questions/tagged/google-cloud-run
- Community: https://www.googlecloudcommunity.com/gc/Cloud-Run/bd-p/cloud-run

---

## 🔄 Quick Reference Commands

```bash
# Switch profiles
gcloud config configurations activate personal
gcloud config configurations activate work

# Check current setup
gcloud config list
gcloud config get-value project
gcloud config get-value account

# Deploy
cd native-audio-function-call-sandbox
./deploy.sh

# View logs
gcloud run services logs read mastery-cards --region=us-central1

# Check service status
gcloud run services describe mastery-cards --region=us-central1

# Get service URL
gcloud run services describe mastery-cards --region=us-central1 --format='value(status.url)'
```

---

**Need help? Check the Troubleshooting section above or reach out!** 🚀
