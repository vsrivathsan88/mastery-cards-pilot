# Simili - AI-Powered Math Tutor for Kids

> Joyful, wonder-driven math learning for K-2 students powered by AI voice tutoring

---

## Overview

Simili is an interactive math learning platform that uses **Gemini Live API** for real-time voice tutoring. It combines wonder-first pedagogy with AI-powered emotional intelligence and misconception detection to create personalized, engaging learning experiences for young children.

### Key Features

✨ **Voice-First Tutoring** - Natural conversation with Pi, your AI math companion  
🎨 **Interactive Canvas** - Draw and explore math concepts visually  
🧠 **Intelligent Agents** - Real-time emotional and misconception detection  
📊 **Teacher Panel** - Live analytics for parents and educators  
🎉 **Celebration System** - Positive reinforcement and encouragement  
🌟 **Wonder-First Pedagogy** - Discovery-based learning that builds curiosity

---

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

### Installation

```bash
# Clone the repository
git clone https://github.com/Project-Simili/simili-v4.git
cd simili-v4

# Install dependencies
pnpm install

# Set up environment
cp apps/tutor-app/.env.example apps/tutor-app/.env
# Add your GEMINI_API_KEY to .env

# Start development server
pnpm dev
```

Visit `http://localhost:5173` to start learning!

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Student Input                      │
│              (Voice/Text/Canvas)                    │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
      ┌──────────────────────┐
      │   Agent System       │
      │  - Emotional         │
      │  - Misconception     │
      │  - Vision            │
      └──────────┬───────────┘
                 │
                 ▼
      ┌──────────────────────┐
      │  Gemini Live API     │
      │   (Voice Tutor)      │
      └──────────┬───────────┘
                 │
                 ▼
      ┌──────────────────────┐
      │   UI Components      │
      │  + Teacher Panel     │
      └──────────────────────┘
```

---

## Documentation

📚 **Core Documentation**:

1. [**Design System**](./docs/DESIGN-SYSTEM.md) - Neobrutalist UI guidelines, components, and patterns
2. [**Agent Architecture**](./docs/AGENT-ARCHITECTURE.md) - AI agent system for emotional intelligence and misconception detection
3. [**Repository Setup**](./docs/REPOSITORY-SETUP.md) - Development environment and monorepo structure
4. [**Gemini Live Setup**](./docs/GEMINI-LIVE-SETUP.md) - Voice API integration and configuration
5. [**Next Steps**](./docs/NEXT-STEPS.md) - Roadmap and future enhancements

---

## Project Structure

```
simili-monorepo-v1/
├── apps/
│   └── tutor-app/           # React frontend
│       ├── components/      # UI components
│       ├── contexts/        # React contexts
│       ├── hooks/           # Custom hooks
│       ├── services/        # Agent services
│       └── styles/          # Design system
│
├── packages/
│   ├── agents/              # AI agent system
│   └── shared/              # Shared types & lessons
│
└── docs/                    # Documentation
```

---

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **State Management**: Zustand
- **AI**: Gemini 2.0 Flash (Live API)
- **Canvas**: TLDraw
- **Styling**: Custom neobrutalist design system
- **Monorepo**: pnpm workspaces

---

## Contributing

We welcome contributions! Please see [REPOSITORY-SETUP.md](./docs/REPOSITORY-SETUP.md) for development guidelines.

### Development Workflow

1. Create feature branch: `git checkout -b feat/your-feature`
2. Make changes and test
3. Commit with co-authorship:
```bash
git commit -m "feat: your feature

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>"
```
4. Push and create pull request

---

## License

[License details to be added]

---

## Contact

- **GitHub**: [Project-Simili/simili-v4](https://github.com/Project-Simili/simili-v4)
- **Issues**: [Report bugs or request features](https://github.com/Project-Simili/simili-v4/issues)

---

Made with ❤️ for curious young learners
