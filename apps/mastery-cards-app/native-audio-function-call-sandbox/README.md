<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Mastery Cards App - Native Audio Function Calling Edition

> **⚠️ Note**: This is a rebuilt version using Google's Gemini Live API sandbox with native audio + function calling. See [MASTERY-CARDS-README.md](./MASTERY-CARDS-README.md) for full documentation.

An AI-powered learning app where students explore fraction concepts through conversation with Pi, a curious alien tutor. Built with:

- 🎙️ **Gemini 2.0 Flash** (native audio + multimodal)
- 🧠 **Claude Sonnet** (background evaluation)
- 🎯 **Function calling** for explicit control flow
- 🎮 Gamified learning (points, levels, streaks)

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up API keys:**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your keys
   ```

3. **Run:**
   ```bash
   npm run dev
   ```

4. **Open:** http://localhost:5173

## Documentation

📚 **[Full Documentation](./MASTERY-CARDS-README.md)** - Architecture, function calling, deployment, etc.

## Original Sandbox

This app is built on Google's official Gemini Live API sandbox:
https://ai.studio/apps/bundled/native_audio_function_call_sandbox
