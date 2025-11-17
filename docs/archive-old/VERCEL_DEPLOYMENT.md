# Vercel Deployment Guide

## Prerequisites
- Vercel account (sign up at https://vercel.com)
- GitHub repository (recommended) or Vercel CLI installed
- API keys for Gemini and Claude

## Deployment Options

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "feat: prepare for Vercel deployment"
   git push
   ```

2. **Import to Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Select the `apps/mastery-cards-app/native-audio-function-call-sandbox` directory as the root
   - Vercel will auto-detect it as a Vite project

3. **Configure Environment Variables**
   In Vercel dashboard, go to Settings > Environment Variables and add:

   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_CLAUDE_API_KEY=your_claude_api_key_here
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your app
   - You'll get a URL like: `https://your-app.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from project directory**
   ```bash
   cd native-audio-function-call-sandbox
   vercel
   ```

4. **Set environment variables**
   ```bash
   vercel env add VITE_GEMINI_API_KEY
   vercel env add VITE_CLAUDE_API_KEY
   ```

5. **Deploy to production**
   ```bash
   vercel --prod
   ```

## Environment Variables

### Required for Client

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `VITE_GEMINI_API_KEY` | Google Gemini API key | https://ai.google.dev/ |
| `VITE_CLAUDE_API_KEY` | Anthropic Claude API key | https://console.anthropic.com/ |

### Important Notes:
- All environment variables for Vite must be prefixed with `VITE_`
- Variables are embedded at build time (not runtime)
- Never commit `.env` files to git

## Server Deployment (Separate)

The orchestration server (`/server`) needs to be deployed separately because:
- It uses WebSockets (not supported well in Vercel serverless)
- It's a long-running Node.js server

### Recommended Options for Server:

1. **Railway** (Easiest)
   - Go to https://railway.app
   - Connect GitHub repo
   - Select `/server` directory
   - Add environment variable: `CLAUDE_API_KEY`
   - Railway will auto-deploy

2. **Render**
   - Go to https://render.com
   - Create new Web Service
   - Point to `/server` directory
   - Build: `pnpm build`
   - Start: `pnpm start`
   - Add environment variable: `CLAUDE_API_KEY`

3. **Fly.io** or **DigitalOcean App Platform**

### After deploying the server:
Update your client to point to the production server URL by modifying the `SERVER_URL` in your orchestration manager initialization.

## Build Configuration

The project is configured with:
- **Framework**: Vite
- **Build Command**: `pnpm run build`
- **Output Directory**: `dist`
- **Node Version**: 20.x (recommended)

## Troubleshooting

### Build fails with "Module not found"
- Make sure all dependencies are in `package.json`
- Run `pnpm install` locally to test

### Environment variables not working
- Make sure they're prefixed with `VITE_`
- Redeploy after adding env vars (build-time variables)

### CORS errors
- Make sure server is deployed and accessible
- Update CORS settings in server to allow your Vercel domain

### 404 on page refresh
- The `vercel.json` rewrite rules should handle this
- Make sure `vercel.json` is in the project root

## Post-Deployment

1. **Test the deployment**
   - Visit your Vercel URL
   - Test voice interaction
   - Verify evaluations are working

2. **Monitor**
   - Check Vercel dashboard for logs
   - Monitor server logs separately

3. **Custom Domain** (Optional)
   - Go to Vercel project settings
   - Add your custom domain
   - Update DNS records as instructed

## Continuous Deployment

Once connected to GitHub:
- Push to `main` branch = auto-deploy to production
- Push to other branches = preview deployments
- Pull requests get automatic preview URLs

## Security Notes

- Never commit API keys to git
- Use environment variables for all secrets
- Consider rate limiting for production
- Monitor API usage to avoid unexpected costs
