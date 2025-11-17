# Production Deployment Guide - Mastery Cards App

## Overview

This guide walks you through deploying the Mastery Cards app to production with a robust, working WebSocket connection.

## Architecture

```
┌──────────────┐         ┌──────────────────┐         ┌───────────────┐
│   Frontend   │  WSS    │   Backend        │         │   Gemini &    │
│   (Vercel)   │◄───────►│   WebSocket      │◄───────►│   Claude APIs │
│              │         │   (Railway/etc)  │         │               │
└──────────────┘         └──────────────────┘         └───────────────┘
```

## Step 1: Deploy Backend Server

The backend handles WebSocket orchestration and Claude evaluations.

### Option A: Railway (Recommended)

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository and choose the `server` directory
4. Configure environment variables:
   ```
   CLAUDE_API_KEY=your_claude_api_key
   PORT=3001
   ```
5. Deploy and note the URL (e.g., `https://your-app.railway.app`)

### Option B: Render

1. Go to https://render.com
2. Create new "Web Service"
3. Connect your repository
4. Set Root Directory: `server`
5. Build Command: `npm install && npm run build`
6. Start Command: `npm start`
7. Add environment variables (same as Railway)

### Option C: Fly.io

1. Install Fly CLI: `brew install flyctl`
2. Navigate to `server` directory
3. Run `fly launch`
4. Follow prompts and set environment variables

### Verify Backend is Working

Once deployed, test the WebSocket endpoint:

```bash
# Install wscat if you don't have it
npm install -g wscat

# Test connection (replace with your actual URL)
wscat -c wss://your-backend-url.railway.app/orchestrate?sessionId=test123
```

You should see a connection established. Press Ctrl+C to exit.

## Step 2: Deploy Frontend to Vercel

### 2.1 Push Your Changes

Make sure all your changes are committed and pushed to GitHub:

```bash
git status  # Verify clean state
git push origin main
```

### 2.2 Configure Vercel Project

1. Go to https://vercel.com/new
2. Import your GitHub repository: `vsrivathsan88/mastery-cards-pilot`
3. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `apps/mastery-cards-app/native-audio-function-call-sandbox`
   - **Build Command**: `npm run build` (default is fine)
   - **Output Directory**: `dist` (default is fine)
   - **Install Command**: `npm install` (default is fine)

### 2.3 Set Environment Variables

Click "Environment Variables" and add:

```
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_CLAUDE_API_KEY=your_claude_api_key_here
VITE_WS_SERVER_URL=wss://your-backend-url.railway.app/orchestrate
```

**Critical Notes:**
- Use `wss://` (WebSocket Secure) not `ws://`
- Include the `/orchestrate` path
- Example: `wss://mastery-cards-backend.railway.app/orchestrate`

### 2.4 Deploy

Click "Deploy" and wait for the build to complete.

## Step 3: Verify Production Deployment

### 3.1 Open Your App

Visit your Vercel URL (e.g., `https://your-app.vercel.app`)

### 3.2 Check Browser Console

Open Developer Tools (F12) and check the Console tab:

#### Good Signs ✅
```
[App] 🔗 WebSocket server URL: wss://your-backend-url.railway.app/orchestrate
[ServerConnection] Connecting to wss://your-backend-url.railway.app/orchestrate?sessionId=...
[ServerConnection] Connected to orchestration server
```

#### Bad Signs ❌
```
[App] 🔗 WebSocket server URL: ws://localhost:3001/orchestrate  ← WRONG!
```

If you see `localhost`, you forgot to set `VITE_WS_SERVER_URL` in Vercel!

### 3.3 Test the App

1. Enter a student name
2. Start a learning session
3. Talk to Pi (the AI tutor)
4. Verify that evaluations work and cards advance

## Troubleshooting

### Problem: WebSocket Won't Connect

**Symptom**: Console shows connection errors or timeouts

**Solutions**:
1. Verify backend is running: Visit `https://your-backend-url.railway.app/health` (if you have a health endpoint)
2. Check backend logs in Railway/Render dashboard
3. Ensure `VITE_WS_SERVER_URL` uses `wss://` not `ws://`
4. Verify CORS is configured on backend to allow your Vercel domain

### Problem: Still Connecting to Localhost

**Symptom**: Console shows `ws://localhost:3001/orchestrate`

**Solutions**:
1. Go to Vercel → Your Project → Settings → Environment Variables
2. Verify `VITE_WS_SERVER_URL` is set correctly
3. Redeploy the project (Deployments → ... → Redeploy)
4. Clear browser cache and reload

### Problem: Mixed Content Errors

**Symptom**: Browser blocks WebSocket connection due to mixed content

**Solutions**:
1. Ensure backend uses HTTPS/WSS (Railway/Render do this automatically)
2. Verify `VITE_WS_SERVER_URL` starts with `wss://` not `ws://`

### Problem: Backend Authentication Fails

**Symptom**: Backend connects but evaluations don't work

**Solutions**:
1. Verify `CLAUDE_API_KEY` is set in backend environment
2. Check backend logs for API errors
3. Ensure Claude API key is valid and has credits

## Performance Optimization

### Enable Caching

Add to `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Monitor Performance

1. Vercel → Your Project → Analytics
2. Check Web Vitals (LCP, FID, CLS)
3. Monitor function execution times

## Monitoring & Debugging

### Frontend Logs

View in Vercel:
1. Go to your project → Deployments → Latest deployment
2. Click "Functions" tab
3. View real-time logs

### Backend Logs

View in Railway/Render:
1. Go to your project dashboard
2. Click "Logs" or "Deploy Logs"
3. Monitor WebSocket connections and errors

### Browser DevTools

Press F12 and check:
- **Console**: Application logs and errors
- **Network**: WebSocket connection status (filter by "WS")
- **Application**: Local storage and session data

## Security Considerations

### API Keys

- Never commit API keys to version control
- Always use environment variables
- Rotate keys regularly
- Monitor API usage in provider dashboards

### CORS Configuration

Backend should allow your Vercel domain:

```javascript
// server/src/index.ts
const allowedOrigins = [
  'https://your-app.vercel.app',
  'http://localhost:5173', // For local dev
];
```

### Rate Limiting

Consider adding rate limiting to prevent abuse:

```javascript
// Example with express-rate-limit
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/orchestrate', limiter);
```

## Scaling Considerations

### Frontend (Vercel)

- Automatically scales with traffic
- No configuration needed
- Monitor in Vercel Analytics

### Backend (Railway/Render)

- **Railway**: Auto-scales based on usage
- **Render**: Choose appropriate plan
- Monitor memory and CPU usage
- Consider Redis for session storage at scale

## Maintenance

### Updating Dependencies

```bash
# Frontend
cd apps/mastery-cards-app/native-audio-function-call-sandbox
npm update

# Backend
cd server
npm update
```

### Monitoring

Set up alerts for:
- High error rates
- Slow response times
- API quota exhaustion
- Backend downtime

## Support & Resources

- **GitHub Repository**: https://github.com/vsrivathsan88/mastery-cards-pilot
- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **Render Docs**: https://render.com/docs

## Next Steps

1. Set up custom domain in Vercel
2. Configure monitoring and alerts
3. Add analytics (Vercel Analytics, Posthog, etc.)
4. Implement user authentication if needed
5. Add database for progress tracking
6. Set up CI/CD pipeline for automated deployments

---

Need help? Check the GitHub issues or create a new one!
