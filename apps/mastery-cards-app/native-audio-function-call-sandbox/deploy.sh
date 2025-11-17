#!/bin/bash
# Deploy to Google Cloud Run

set -e  # Exit on error

echo "🚀 Deploying Mastery Cards to Google Cloud Run..."
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install it first:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get current project
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    echo "❌ No Google Cloud project configured."
    echo "   Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "📦 Project: $PROJECT_ID"
echo "🌍 Region: us-central1"
echo ""

# Build and deploy
echo "🔨 Building container..."
gcloud builds submit --config cloudbuild.yaml

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your app will be available at:"
gcloud run services describe mastery-cards --region=us-central1 --format='value(status.url)'
echo ""
