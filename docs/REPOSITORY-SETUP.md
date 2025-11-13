# Repository Setup Guide

## Overview

This guide covers setting up the Simili monorepo for local development. The repository uses **pnpm workspaces** with a clean separation between frontend (tutor-app) and backend packages (agents, shared).

---

## Prerequisites

### Required

- **Node.js**: v18.x or higher
- **pnpm**: v8.x or higher
- **Git**: v2.30 or higher

### Optional

- **VS Code**: Recommended IDE with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/Project-Simili/simili-v4.git
cd simili-v4

# Install dependencies
pnpm install

# Set up environment variables
cp apps/tutor-app/.env.example apps/tutor-app/.env
# Edit .env and add your GEMINI_API_KEY

# Start development server
pnpm dev
```

The app will be available at `http://localhost:5173`

---

## Repository Structure

```
simili-monorepo-v1/
├── apps/
│   └── tutor-app/           # React frontend application
│       ├── components/      # UI components
│       │   ├── cozy/       # Design system components
│       │   ├── game/       # Game UI (header, HUD)
│       │   ├── onboarding/ # Onboarding flow
│       │   └── teacher-panel/ # Teacher analytics
│       ├── contexts/        # React contexts
│       │   ├── LiveAPIContext.tsx  # Gemini Live connection
│       │   └── UserContext.tsx     # User data (name/avatar)
│       ├── hooks/           # Custom React hooks
│       │   └── useAgentContext.ts  # Agent integration
│       ├── lib/             # State management
│       │   ├── state.ts    # Zustand stores
│       │   └── teacher-panel-store.ts
│       ├── services/        # Business logic
│       │   ├── AgentService.ts     # Agent orchestration
│       │   ├── FillerService.ts    # Conversational fillers
│       │   ├── PromptBuilder.ts    # Dynamic prompts
│       │   └── VisionService.ts    # Canvas analysis
│       ├── styles/          # Global styles
│       │   ├── cozy-theme.css      # Design system
│       │   └── onboarding.css
│       └── index.tsx        # App entry point
│
├── packages/
│   ├── agents/              # AI agent system
│   │   └── src/
│   │       ├── context/     # Context management
│   │       ├── graph/       # Agent orchestration
│   │       ├── subagents/   # Specialized agents
│   │       └── index.ts     # Package exports
│   │
│   └── shared/              # Shared types and utilities
│       └── src/
│           ├── lessons/     # Lesson definitions
│           └── types/       # TypeScript types
│
├── docs/                    # Documentation
├── pnpm-workspace.yaml      # Workspace configuration
├── package.json             # Root package.json
└── tsconfig.json           # TypeScript configuration
```

---

## Environment Setup

### Environment Variables

Create `apps/tutor-app/.env`:

```bash
# Required: Gemini API Key
GEMINI_API_KEY=your_api_key_here

# Optional: Development settings
VITE_DEV_MODE=true
VITE_LOG_LEVEL=debug
```

### Getting a Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key to your `.env` file

---

## Development Commands

### Root Level

```bash
# Install all dependencies
pnpm install

# Start dev server (tutor-app)
pnpm dev

# Build all packages
pnpm build

# Run linting
pnpm lint

# Type checking
pnpm typecheck

# Clean all build artifacts
pnpm clean
```

### Tutor App

```bash
# Navigate to tutor app
cd apps/tutor-app

# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Type check
pnpm typecheck
```

### Agents Package

```bash
cd packages/agents

# Build package
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck
```

---

## Workspace Configuration

### pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### Package Dependencies

The workspace uses internal package references:

```json
// apps/tutor-app/package.json
{
  "dependencies": {
    "@simili/agents": "workspace:*",
    "@simili/shared": "workspace:*"
  }
}
```

When you run `pnpm install`, it automatically links local packages.

---

## Key Technologies

### Frontend (tutor-app)

- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Zustand**: State management
- **TLDraw**: Canvas drawing library
- **Gemini Live API**: Voice interaction

### Agents Package

- **TypeScript**: Type safety
- **LangGraph**: Agent orchestration (optional)
- **EventEmitter**: Agent communication

### Shared Package

- **TypeScript**: Shared types
- **Lesson definitions**: JSON-based lessons

---

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feat/your-feature-name
```

### 2. Make Changes

Edit files in `apps/tutor-app` or `packages/`:

```bash
# Auto-reload on changes
pnpm dev
```

### 3. Test Your Changes

- **Manual testing**: Use the app in browser
- **Type checking**: `pnpm typecheck`
- **Linting**: `pnpm lint`

### 4. Commit Changes

```bash
git add .
git commit -m "feat: your feature description

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>"
```

### 5. Push and Create PR

```bash
git push -u origin feat/your-feature-name
```

Then create a pull request on GitHub.

---

## Common Issues & Solutions

### Issue: `pnpm install` fails

**Solution**: Ensure you're using pnpm v8+
```bash
npm install -g pnpm@latest
pnpm install
```

### Issue: Vite port already in use

**Solution**: Change port in `vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    port: 5174, // Change port
  }
});
```

### Issue: TypeScript errors in IDE

**Solution**: Reload VS Code TypeScript server
1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
2. Type "TypeScript: Restart TS Server"
3. Press Enter

### Issue: Changes not reflecting

**Solution**: Clear Vite cache
```bash
rm -rf node_modules/.vite
pnpm dev
```

### Issue: Gemini API not working

**Solution**: Check API key
```bash
# Verify .env file exists and has correct key
cat apps/tutor-app/.env
```

---

## Project Structure Best Practices

### Component Organization

```
components/
├── cozy/                  # Design system components
│   ├── CozyWorkspace.tsx
│   └── CozyCelebration.tsx
├── game/                  # Game-specific UI
│   └── GameHeader.tsx
└── teacher-panel/         # Feature modules
    ├── TeacherPanelContainer.tsx
    ├── MilestoneMasteryView.tsx
    └── TeacherPanel.css
```

### Service Layer

```
services/
├── AgentService.ts        # Agent orchestration
├── PromptBuilder.ts       # Dynamic prompts
└── FillerService.ts       # Conversation management
```

### State Management

```
lib/
├── state.ts               # Global Zustand stores
└── teacher-panel-store.ts # Feature-specific stores
```

---

## Adding New Packages

### Create New Package

```bash
mkdir -p packages/my-package/src
cd packages/my-package

# Initialize package.json
pnpm init

# Add to workspace
# (automatically detected by pnpm-workspace.yaml)
```

### Package Template

```json
{
  "name": "@simili/my-package",
  "version": "0.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

### Reference from Apps

```json
// apps/tutor-app/package.json
{
  "dependencies": {
    "@simili/my-package": "workspace:*"
  }
}
```

Then run:
```bash
pnpm install
```

---

## Testing Strategy

### Manual Testing

1. Start dev server: `pnpm dev`
2. Complete onboarding flow
3. Test voice interaction
4. Test canvas drawing
5. Check teacher panel

### Type Safety

```bash
# Check all packages
pnpm typecheck

# Check specific package
cd apps/tutor-app && pnpm typecheck
```

### Linting

```bash
# Lint all packages
pnpm lint

# Auto-fix issues
pnpm lint --fix
```

---

## Building for Production

### Local Production Build

```bash
# Build all packages
pnpm build

# Preview tutor-app
cd apps/tutor-app
pnpm preview
```

### Build Output

```
apps/tutor-app/dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
└── [other assets]
```

### Deployment

The production build can be deployed to:
- **Vercel**: Zero-config deployment
- **Netlify**: Drag-and-drop deployment
- **Cloudflare Pages**: Edge deployment
- **AWS S3 + CloudFront**: Custom hosting

---

## Git Workflow

### Branch Naming

- `feat/feature-name` - New features
- `fix/bug-name` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates

### Commit Messages

Follow conventional commits:

```
feat: add new feature
fix: resolve bug
refactor: restructure code
docs: update documentation
style: format code
test: add tests
chore: update dependencies
```

### Pull Request Process

1. Create feature branch
2. Make changes and commit
3. Push to GitHub
4. Create pull request
5. Request review
6. Address feedback
7. Merge when approved

---

## IDE Configuration

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

### Recommended Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss"
  ]
}
```

---

## Performance Optimization

### Development Server

- Vite HMR for instant updates
- TypeScript incremental builds
- Cached dependencies

### Production Build

- Code splitting by route
- Tree shaking unused code
- Asset compression
- CSS minification

---

## Troubleshooting

### Reset Everything

```bash
# Remove all node_modules
rm -rf node_modules apps/*/node_modules packages/*/node_modules

# Remove lock file
rm pnpm-lock.yaml

# Reinstall
pnpm install
```

### Debug Build Issues

```bash
# Verbose build output
pnpm build --verbose

# Check TypeScript errors
pnpm typecheck
```

---

## Next Steps

- [Gemini Live Setup](./GEMINI-LIVE-SETUP.md) - Configure voice interaction
- [Agent Architecture](./AGENT-ARCHITECTURE.md) - Understand the AI system
- [Design System](./DESIGN-SYSTEM.md) - Learn the UI patterns
- [Next Steps](./NEXT-STEPS.md) - Future roadmap
