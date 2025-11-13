#!/bin/bash

# Mastery Cards Backend Server startup script for Replit

echo "🚀 Starting Mastery Cards Backend Server on Replit..."

# Navigate to server directory
cd apps/mastery-cards-app/server || exit 1

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing server dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Check if required API keys are set
if [ -z "$CLAUDE_API_KEY" ]; then
    echo "⚠️  WARNING: CLAUDE_API_KEY not found!"
    echo "Please add your Claude API key to Replit Secrets:"
    echo "1. Click the 'Secrets' tab (lock icon)"
    echo "2. Add key: CLAUDE_API_KEY"
    echo "3. Add value: Your API key from https://console.anthropic.com/"
    echo ""
fi

if [ -z "$GEMINI_API_KEY" ]; then
    echo "⚠️  WARNING: GEMINI_API_KEY not found!"
    echo "Please add your Gemini API key to Replit Secrets:"
    echo "1. Click the 'Secrets' tab (lock icon)"
    echo "2. Add key: GEMINI_API_KEY"
    echo "3. Add value: Your API key from https://aistudio.google.com/app/apikey"
    echo ""
fi

# Set PORT if not already set
export PORT=${PORT:-3001}

echo "🎓 Starting Mastery Cards orchestration server..."
echo "📍 Server will be available at your Replit URL on port $PORT"
echo "🔗 WebSocket endpoint: /orchestrate"
echo "🔗 Health check: /health"
echo ""

# Start the server
node src/index.js
