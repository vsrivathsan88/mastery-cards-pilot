# Setting Up Simili on Replit

This guide will help you get Simili running on Replit.

---

## Prerequisites

- Replit account
- Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

---

## Setup Steps

### 1. Import Repository to Replit

**Option A: Import from GitHub**
1. Go to [Replit](https://replit.com)
2. Click "Create Repl"
3. Choose "Import from GitHub"
4. Paste: `https://github.com/Project-Simili/simili-v4`
5. Click "Import from GitHub"

**Option B: Upload Files**
1. Create new Repl with Node.js template
2. Delete default files
3. Upload all project files

---

### 2. Install Dependencies

Replit will automatically detect the project, but if not:

```bash
# Install pnpm globally (if not available)
npm install -g pnpm

# Install all dependencies
pnpm install
```

**Note**: This may take 2-3 minutes on first run.

---

### 3. Set Environment Variables

1. Click the **"Secrets"** tab (lock icon) in Replit sidebar
2. Add a new secret:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: Your Gemini API key (starts with `AIza...`)
3. Click "Add Secret"

**Important**: Replit secrets are automatically injected as environment variables - no `.env` file needed!

---

### 4. Start the Development Server

Click the **"Run"** button at the top of Replit.

The app will:
1. Install dependencies (if needed)
2. Build the packages
3. Start the dev server on port 5173
4. Open in Replit's webview

**URL**: Your app will be available at `https://your-repl-name.your-username.repl.co`

---

## Configuration Files

The following files have been configured for Replit:

### `.replit`
```
run = "cd apps/tutor-app && npm run dev -- --host 0.0.0.0"
```
Tells Replit how to start the app.

### `replit.nix`
```nix
deps = [
  pkgs.nodejs-20_x
  pkgs.nodePackages.pnpm
]
```
Specifies system dependencies (Node.js 20, pnpm).

### `vite.config.ts`
```typescript
server: {
  port: 5173,
  host: '0.0.0.0',
  hmr: {
    clientPort: 443, // For Replit's proxy
  }
}
```
Configured for Replit's port forwarding and hot module reloading.

---

## Troubleshooting

### Issue: "Module not found" errors

**Solution**: Reinstall dependencies
```bash
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

### Issue: Port already in use

**Solution**: Replit should handle this automatically, but if not:
```bash
# Stop the current process (Ctrl+C in shell)
# Then restart with Run button
```

### Issue: API key not working

**Solution**: Check secrets configuration
1. Open Secrets tab
2. Verify `GEMINI_API_KEY` exists and is correct
3. Restart the Repl (Stop + Run)

### Issue: "Cannot find module" for @simili/* packages

**Solution**: Build workspace packages first
```bash
# Build all packages
pnpm build

# Or build specific package
cd packages/agents && pnpm build
```

### Issue: Changes not reflecting

**Solution**: Hard refresh or clear cache
1. In Replit webview: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. Or restart the dev server

### Issue: Slow performance

**Solution**: Replit's free tier has limited resources. Consider:
1. Using Replit's "Boost" feature for more CPU/RAM
2. Upgrading to Replit's paid tier
3. Deploying to production (Vercel, Netlify) for better performance

---

## Running Commands Manually

If you need to run commands manually, use the Shell tab:

```bash
# Install dependencies
pnpm install

# Build packages
pnpm build

# Start dev server
cd apps/tutor-app && pnpm dev

# Type check
pnpm typecheck

# Lint
pnpm lint
```

---

## Production Deployment from Replit

### Option 1: Replit Deployments

1. Click "Deploy" button in Replit
2. Choose "Autoscale Deployment" or "Reserved VM"
3. Set environment variables in deployment settings
4. Deploy!

**Cost**: Paid feature (starts at $7/month)

### Option 2: Export to Vercel/Netlify

1. Build the project:
```bash
cd apps/tutor-app
pnpm build
```

2. Download the `dist` folder
3. Upload to Vercel/Netlify
4. Set `GEMINI_API_KEY` in hosting platform's environment variables

---

## Development Tips

### Use Replit's Shell

The Shell tab gives you full terminal access:
- Run custom commands
- Debug issues
- Check logs

### Enable Always On (Paid)

For continuous development:
1. Go to Repl settings
2. Enable "Always On"
3. Your Repl stays active 24/7

### Collaborate

Invite team members:
1. Click "Invite" button
2. Share link or add by username
3. Collaborate in real-time!

---

## Replit-Specific Features

### Multiplayer Editing

Multiple developers can code simultaneously with live cursors.

### Built-in Database

If you add user data storage later, Replit offers:
- Key-value database (Replit DB)
- PostgreSQL
- MongoDB

### Version Control

Replit has built-in Git:
1. Click "Version Control" tab
2. Commit changes
3. Push to GitHub

---

## Performance Considerations

### Free Tier Limitations

- CPU: Shared
- RAM: ~500MB-1GB
- Storage: ~1GB
- Always-on: Not available

### Optimization Tips

1. **Exclude heavy dependencies** from Vite's optimizeDeps
2. **Use production build** for testing performance
3. **Minimize console logs** in production
4. **Close unused tabs** in Replit editor

---

## Security Notes

### Environment Variables

- Never commit API keys to code
- Always use Replit Secrets for sensitive data
- Secrets are encrypted at rest

### Exposing Ports

- Replit automatically handles HTTPS
- All traffic is encrypted
- No need to configure SSL certificates

---

## Getting Help

### Replit Community

- [Replit Ask Forum](https://ask.replit.com)
- [Replit Discord](https://replit.com/discord)
- [Replit Documentation](https://docs.replit.com)

### Simili Project

- GitHub Issues: Report bugs specific to the app
- This documentation: Technical implementation questions

---

## Quick Reference

| Task | Command |
|------|---------|
| Install deps | `pnpm install` |
| Start dev | Click "Run" or `pnpm dev` |
| Build | `pnpm build` |
| Type check | `pnpm typecheck` |
| Open shell | Click "Shell" tab |
| View logs | Check Console tab |
| Add secrets | Secrets tab (lock icon) |

---

## Next Steps

Once your Repl is running:

1. Complete the onboarding flow to create a student profile
2. Click "Start Learning" to begin the Equal Parts lesson
3. Test voice interaction (grant microphone permissions)
4. Draw on the canvas
5. Check the Teacher Panel for real-time insights

---

## Success Checklist

- [ ] Dependencies installed (`pnpm install`)
- [ ] `GEMINI_API_KEY` added to Secrets
- [ ] Dev server running (green dot in Replit)
- [ ] App loads in webview
- [ ] Microphone permissions granted
- [ ] Voice interaction working
- [ ] Canvas drawing responsive
- [ ] No errors in Console tab

---

**Happy building on Replit! 🚀**

For more detailed documentation, see:
- [Repository Setup](./REPOSITORY-SETUP.md)
- [Gemini Live Setup](./GEMINI-LIVE-SETUP.md)
- [Design System](./DESIGN-SYSTEM.md)
