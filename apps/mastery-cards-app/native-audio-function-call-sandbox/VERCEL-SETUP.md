# Vercel Deployment Setup

## Quick Deploy

1. **Go to Vercel Dashboard**: https://vercel.com/new

2. **Import Repository**: `vsrivathsan88/mastery-cards-pilot`

3. **Configure Project**:
   - Framework Preset: **Vite**
   - Root Directory: **apps/mastery-cards-app/native-audio-function-call-sandbox**
   - Build Command: `npm run build` (or leave default)
   - Output Directory: `dist` (or leave default)
   - Install Command: `npm install` (or leave default)

4. **Add Environment Variables**:
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_CLAUDE_API_KEY=your_claude_api_key_here
   VITE_WS_SERVER_URL=wss://your-backend-server.com/orchestrate
   ```

   **Important**: Replace `wss://your-backend-server.com/orchestrate` with your actual deployed backend WebSocket URL. Use `wss://` (secure WebSocket) for production, not `ws://`.

5. **Deploy!**

## Important Notes

- The `vercel.json` in this directory is already configured
- All dependencies will be installed fresh in this directory
- No monorepo/workspace dependencies needed
- The backend server needs to be deployed separately (Railway, Render, etc.)

## After Deployment

1. Verify the WebSocket connection in the browser console
2. You should see: `[App] 🔗 WebSocket server URL: wss://your-backend-server.com/orchestrate`
3. If you see `ws://localhost:3001/orchestrate` in production, you forgot to set `VITE_WS_SERVER_URL`!

## Backend Server Deployment

The backend WebSocket server needs to be deployed separately to a service that supports WebSocket connections:
- **Railway**: https://railway.app (recommended for Node.js WebSocket servers)
- **Render**: https://render.com
- **Fly.io**: https://fly.io

Make sure your backend server:
1. Supports WebSocket connections (`/orchestrate` endpoint)
2. Has HTTPS/WSS enabled (required for secure WebSocket connections from Vercel)
3. Has proper CORS headers configured to accept connections from your Vercel domain
