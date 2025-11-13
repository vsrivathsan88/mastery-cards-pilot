#!/bin/bash

# Simili startup script for Replit

echo "🚀 Starting Simili on Replit..."

# Check if pnpm is available
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm@9.15.0
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies (this may take 2-3 minutes)..."
    pnpm install
else
    echo "✅ Dependencies already installed"
fi

# Check if GEMINI_API_KEY is set
if [ -z "$GEMINI_API_KEY" ]; then
    echo "⚠️  WARNING: GEMINI_API_KEY not found!"
    echo "Please add your Gemini API key to Replit Secrets:"
    echo "1. Click the 'Secrets' tab (lock icon)"
    echo "2. Add key: GEMINI_API_KEY"
    echo "3. Add value: Your API key from https://aistudio.google.com/app/apikey"
    echo ""
    echo "Continuing anyway for setup purposes..."
fi

# Build workspace packages
echo "🔨 Building workspace packages..."
pnpm --filter @simili/shared build || echo "Warning: shared build failed"
pnpm --filter @simili/agents build || echo "Warning: agents build failed"
pnpm --filter @simili/core-engine build || echo "Warning: core-engine build failed"
pnpm --filter @simili/lessons build || echo "Warning: lessons build failed"

# Start the dev server
echo "🎓 Starting Simili tutor app..."
echo "📍 App will be available at your Replit URL"
echo ""

cd apps/tutor-app && pnpm dev
