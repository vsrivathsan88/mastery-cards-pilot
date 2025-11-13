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
   ```

5. **Deploy!**

## Important Notes

- The `vercel.json` in this directory is already configured
- All dependencies will be installed fresh in this directory
- No monorepo/workspace dependencies needed
- The backend server needs to be deployed separately (Railway, Render, etc.)

## After Deployment

Update the server URL in your code if needed to point to the deployed backend.
