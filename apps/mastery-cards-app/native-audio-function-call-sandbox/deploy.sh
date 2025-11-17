#!/bin/bash
# Deploy Mastery Cards to Google Cloud Run

set -e  # Exit on error

echo "╔════════════════════════════════════════╗"
echo "║  🚀 Deploying Mastery Cards to Cloud  ║"
echo "║           Run (Secure Mode)            ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found."
    echo ""
    echo "📥 Install it with:"
    echo "   brew install google-cloud-sdk"
    echo ""
    echo "Or download from:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get current project
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    echo "❌ No Google Cloud project configured."
    echo ""
    echo "🔧 Set your project with:"
    echo "   gcloud config set project YOUR_PROJECT_ID"
    echo ""
    echo "Or create a new project at:"
    echo "   https://console.cloud.google.com/projectcreate"
    exit 1
fi

echo "📦 Project: $PROJECT_ID"
echo "🌍 Region:  us-central1"
echo "🔒 Auth:    Service Account (no API key!)"
echo ""

# Confirm deployment
read -p "🤔 Deploy to Cloud Run? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled."
    exit 0
fi

echo ""
echo "🔨 Building and deploying container..."
echo "⏱️  This will take ~3-5 minutes..."
echo ""

# Build and deploy using Cloud Build
gcloud builds submit --config cloudbuild.yaml

echo ""
echo "╔════════════════════════════════════════╗"
echo "║        ✅ Deployment Complete!         ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "🌐 Your app is live at:"
gcloud run services describe mastery-cards --region=us-central1 --format='value(status.url)' 2>/dev/null
echo ""
echo "🔍 View logs:"
echo "   gcloud run services logs read mastery-cards --region=us-central1"
echo ""
echo "📊 View in console:"
echo "   https://console.cloud.google.com/run?project=$PROJECT_ID"
echo ""
