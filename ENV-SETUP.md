# Environment Setup Guide

## Single Source of Truth

All API keys and secrets are now managed in **one secure location**:

```
/simili-monorepo-v1/.env
```

## Why Consolidate?

✅ **Security**: One file to secure, one file in `.gitignore`  
✅ **Simplicity**: No need to manage multiple `.env` files  
✅ **Consistency**: All apps use the same keys  
✅ **Easy Updates**: Change key once, applies everywhere

## Setup Instructions

### 1. Check Root .env File

The root `.env` file should already exist with your keys:

```bash
cd /Users/vsrivathsan/Documents/simili-monorepo-v1
cat .env
```

You should see:
```env
VITE_GEMINI_API_KEY=your_actual_key_here
VITE_PILOT_MODE=true
VITE_DEBUG_MODE=true
# ... other settings
```

### 2. How Apps Load Environment Variables

Both `tutor-app` and `mastery-cards-app` are configured to load from the root `.env`:

**vite.config.ts** (both apps):
```typescript
// Load env from monorepo root (../../.env)
const env = loadEnv(mode, path.resolve(__dirname, '../..'), '');

// Set environment directory to root
envDir: path.resolve(__dirname, '../..'),
```

This means:
- ✅ Apps automatically load from root `.env`
- ✅ No need for app-level `.env` files
- ✅ Changes to root `.env` apply to all apps

### 3. Template Files (.env.template)

Each app has a `.env.template` for **reference only**:
- `apps/mastery-cards-app/.env.template`
- `apps/tutor-app/.env.template`

These files:
- ❌ Do **NOT** contain real API keys
- ✅ Show what variables are available
- ✅ Safe to commit to git
- ℹ️ For documentation purposes only

### 4. Security Checklist

✅ Root `.env` file is in `.gitignore`  
✅ Template files have placeholder keys (`your_api_key_here`)  
✅ No real keys in any `.template` files  
✅ Apps load from root `.env` via Vite config

### 5. Adding a New API Key

To add a new environment variable:

1. **Add to root `.env`**:
   ```bash
   echo "VITE_NEW_API_KEY=your_key_here" >> .env
   ```

2. **Update template files** (optional, for documentation):
   ```bash
   # In apps/*/_.env.template
   VITE_NEW_API_KEY=your_api_key_here
   ```

3. **Restart dev server**:
   ```bash
   # The app will pick up the new variable
   pnpm dev
   ```

### 6. Troubleshooting

#### Environment variable not found

```bash
# Check if it's in root .env
grep VITE_GEMINI_API_KEY /Users/vsrivathsan/Documents/simili-monorepo-v1/.env

# Restart dev server
cd apps/mastery-cards-app
pnpm dev
```

#### Want to override for one app only

Create a local override (won't be committed):

```bash
cd apps/mastery-cards-app
echo "VITE_GEMINI_API_KEY=different_key" > .env.local
```

`.env.local` takes precedence over root `.env` (but root is still loaded first).

## File Structure

```
simili-monorepo-v1/
├── .env                    # ✅ ACTUAL KEYS HERE (gitignored)
├── .env.example            # Reference for root env
├── .gitignore             # Ensures .env is never committed
│
├── apps/
│   ├── mastery-cards-app/
│   │   ├── .env.template  # Reference only (no real keys)
│   │   └── vite.config.ts # Loads from ../../.env
│   │
│   └── tutor-app/
│       ├── .env.template  # Reference only (no real keys)
│       └── vite.config.ts # Loads from ../../.env
```

## Current Environment Variables

### Required (Both Apps)
- `VITE_GEMINI_API_KEY` - Gemini API key for voice/LLM

### Optional Flags
- `VITE_PILOT_MODE` - Enable pilot tools (tutor-app)
- `VITE_DEBUG_MODE` - Enable debug logging
- `VITE_APP_NAME` - App display name (mastery-cards)
- `VITE_APP_VERSION` - Version number

### Future Feature Flags
- `VITE_ENABLE_ACHIEVEMENTS` - Gamification
- `VITE_ENABLE_LEADERBOARD` - Competitive features
- `VITE_ENABLE_IMAGES` - Image generation
- `VITE_ANALYTICS_ENABLED` - Usage tracking

## Best Practices

1. **Never commit** the root `.env` file
2. **Always use** `VITE_` prefix for Vite apps
3. **Document** new variables in template files
4. **Rotate keys** regularly for security
5. **Use `.env.local`** for temporary overrides only

## Getting a Gemini API Key

1. Visit: https://aistudio.google.com/app/apikey
2. Create a new API key
3. Copy the key
4. Paste into root `.env`:
   ```bash
   VITE_GEMINI_API_KEY=AIzaSy...your_key_here
   ```
5. Restart dev servers

---

✅ **Setup Complete!** All apps now use the secure root `.env` file.
