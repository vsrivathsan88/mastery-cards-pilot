# Simili Monorepo

A voice AI tutoring platform built with React, Gemini Live, and TypeScript.

## Project Structure

```
simili-monorepo-v1/
├── packages/
│   ├── shared/           # Shared TypeScript types and utilities
│   ├── core-engine/      # Gemini Live client and audio handling
│   └── agents/           # Pedagogy agent orchestration
├── apps/
│   └── tutor-app/        # Main tutoring application (React + Vite)
├── docs/
│   └── development-plan.md
└── package.json          # Root workspace configuration
```

## Package Overview

### @simili/shared
Common TypeScript types used across all packages:
- `Event`, `SessionState`, `AudioChunk`, `LessonData`
- `Milestone`, `EmotionalState`, `TranscriptionEvent`

### @simili/core-engine
Core Gemini Live integration:
- `GenAILiveClient` - WebSocket client for Gemini Live API
- `AudioStreamer` - Audio playback handling
- `AudioRecorder` - Microphone capture

### @simili/agents
Agent orchestration layer:
- `AgentOrchestrator` - Manages session state and event handling
- Subscribes to core-engine events
- Future: Pedagogy logic, milestone detection

### tutor-app
Main React application with:
- Voice interaction UI
- Audio visualizer
- Real-time transcription display
- Function calling support

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 9.15+

### Installation

```bash
# Install dependencies for all packages
pnpm install

# Build all packages
pnpm -r build
```

### Development

```bash
# Start the tutor app in dev mode
pnpm dev

# Or run from the app directory
cd apps/tutor-app
pnpm dev
```

The app will be available at http://localhost:3000

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @simili/core-engine build

# Preview production build
pnpm preview
```

## Environment Setup

Create a `.env` file in `apps/tutor-app/`:

```
VITE_GEMINI_API_KEY=your_api_key_here
```

## Development Workflow

1. **Make changes to packages**: Edit code in `packages/*`
2. **Rebuild packages**: Run `pnpm -r build` or use watch mode with `pnpm --filter @simili/core-engine dev`
3. **Test in app**: Changes will be reflected in the tutor-app

## Phase 1 Complete ✅

- [x] Monorepo structure with pnpm workspaces
- [x] Shared types package
- [x] Core engine with Gemini Live integration
- [x] Agents package with orchestrator stub
- [x] Tutor app migrated and working

## Next Steps (Phase 2)

See `docs/development-plan.md` for the full roadmap:
- Create lesson structure and schema
- Implement pedagogy logic in agents package
- Add milestone detection
- Create system prompt management
- Update UI for lesson progress

## Scripts

### Root Level
- `pnpm dev` - Start tutor-app dev server
- `pnpm build` - Build all packages
- `pnpm preview` - Preview tutor-app production build
- `pnpm clean` - Remove all node_modules and build artifacts

### Package Level
- `pnpm --filter <package-name> <command>` - Run command in specific package
- `pnpm -r <command>` - Run command in all packages (recursive)

## Architecture Notes

- Uses pnpm workspaces for dependency management
- TypeScript with strict mode enabled
- Packages are built before app to ensure types are available
- Core engine is framework-agnostic (can be used outside React)
- Agent orchestrator pattern allows for future multi-agent expansion

## License

See individual package LICENSE files for details.
