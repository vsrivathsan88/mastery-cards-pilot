# Gemini Live API Setup Guide

## Overview

Simili uses **Gemini 2.0 Flash with real-time audio** for voice-based tutoring. This guide covers setting up the Gemini Live API integration for natural conversation with students.

---

## Getting Started

### 1. Get API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key (starts with `AIza...`)
5. Add to `.env` file:

```bash
GEMINI_API_KEY=AIzaSy...your-key-here
```

### 2. API Access

Gemini 2.0 Flash with Live API is available in:
- ✅ **Free tier**: 15 RPM (requests per minute)
- ✅ **Paid tier**: Higher rate limits

---

## Architecture

### Connection Flow

```
┌──────────────┐
│   Student    │
│ (Microphone) │
└───────┬──────┘
        │ Audio Stream
        ▼
┌────────────────────┐
│  AudioRecorder     │
│ (Browser WebRTC)   │
└───────┬────────────┘
        │ PCM Audio
        ▼
┌────────────────────┐
│ LiveAPIContext     │
│ (WebSocket)        │
└───────┬────────────┘
        │ Bidirectional
        ▼
┌────────────────────┐
│  Gemini Live API   │
│  (2.0 Flash)       │
└───────┬────────────┘
        │ Audio + Text
        ▼
┌────────────────────┐
│  Browser Audio     │
│   (Playback)       │
└────────────────────┘
```

---

## Core Implementation

### LiveAPIContext

**Location**: `apps/tutor-app/contexts/LiveAPIContext.tsx`

This React context manages the WebSocket connection to Gemini Live.

**Key Features**:
- WebSocket connection management
- Audio streaming (input/output)
- System prompt updates
- Tool calling integration
- Connection status tracking

**Usage**:

```typescript
import { useLiveAPIContext } from './contexts/LiveAPIContext';

function MyComponent() {
  const { 
    client,       // LiveAPIClient instance
    connected,    // Connection status
    connect,      // Connect to Gemini
    disconnect,   // Disconnect from Gemini
    setConfig,    // Update configuration
  } = useLiveAPIContext();
  
  // Connect to Gemini
  const startSession = async () => {
    await connect();
  };
}
```

---

## Configuration

### LiveAPIClient Configuration

```typescript
const config: LiveConnectConfig = {
  // Model selection
  model: 'models/gemini-2.0-flash-exp',
  
  // Modalities (audio + text)
  generationConfig: {
    responseModalities: [Modality.AUDIO],
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: 'Puck', // Kid-friendly voice
        }
      }
    }
  },
  
  // System instruction (dynamic)
  systemInstruction: {
    parts: [
      { text: systemPrompt } // From PromptBuilder
    ]
  },
  
  // Tool declarations
  tools: tools.map(tool => ({
    functionDeclarations: [tool.declaration]
  }))
};
```

---

## Dynamic System Prompts

### How It Works

The system prompt is **rebuilt on every student turn** to include real-time agent insights:

```typescript
// Before student speaks
const staticPrompt = SIMILI_SYSTEM_PROMPT; // Base pedagogy

// Student speaks
const transcription = "I think we need 3 pieces";

// Agents analyze (parallel)
const insights = await agentService.analyzeStudentInput(transcription);

// Prompt is rebuilt with insights
const dynamicPrompt = PromptBuilder.buildSystemPrompt(insights.context);

// Sent to Gemini
await client.sendSystemInstruction(dynamicPrompt);

// Gemini responds with context-aware answer
```

### Prompt Structure

```
[Base Prompt - Static]
- Pedagogy (wonder-first)
- Personality (warm, encouraging)
- Teaching guidelines

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REAL-TIME STUDENT CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📚 Lesson Progress
Current milestone: "Divide the cookie"
Progress: 40%
Attempts: 3

## 🎭 Emotional State
State: frustrated
Engagement: 0.6
Frustration: 0.7
Confusion: 0.4

## ⚠️ Misconceptions
Type: part-whole-confusion
Evidence: "Student said 'we need 3 pieces'"
Intervention: Use visual comparison

## 🎯 Priority Instructions
1. Address frustration gently
2. Use visual analogy to clarify
3. Avoid repeating same explanation
```

---

## Audio Streaming

### Input (Student Voice)

**AudioRecorder** captures microphone audio and streams to Gemini:

```typescript
// Location: apps/tutor-app/lib/audio-recorder.ts

class AudioRecorder {
  // Start recording
  async start(): Promise<MediaStream> {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: true 
    });
    // Process audio and send to Gemini
  }
  
  // Stop recording
  stop() {
    // Clean up stream
  }
}
```

**Audio Format**:
- **Sample Rate**: 16kHz (required by Gemini)
- **Channels**: 1 (mono)
- **Format**: PCM16

### Output (Pi Voice)

Gemini returns audio that's played through browser:

```typescript
// Gemini sends audio chunks
client.on('audio', (audioData: Uint8Array) => {
  // Play audio in browser
  playAudio(audioData);
});
```

**Voice Configuration**:
- **Voice Name**: "Puck" (kid-friendly, warm)
- **Speed**: Normal
- **Pitch**: Default

---

## Tool Calling

Gemini can call functions to interact with the lesson:

### Tool Declaration

```typescript
const tools = [
  {
    name: 'advance_milestone',
    description: 'Move to the next learning milestone',
    parameters: {
      type: 'object',
      properties: {
        milestoneId: { type: 'string' },
        studentEvidence: { type: 'string' }
      },
      required: ['milestoneId']
    }
  },
  {
    name: 'show_celebration',
    description: 'Celebrate student success',
    parameters: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        intensity: { type: 'string', enum: ['small', 'medium', 'large'] }
      }
    }
  },
  {
    name: 'show_image',
    description: 'Show a visual aid',
    parameters: {
      type: 'object',
      properties: {
        imageId: { type: 'string' },
        context: { type: 'string' }
      },
      required: ['imageId']
    }
  }
];
```

### Tool Execution

```typescript
// When Gemini calls a tool
client.on('toolCall', (toolCall) => {
  const { name, parameters } = toolCall;
  
  switch (name) {
    case 'advance_milestone':
      advanceMilestone(parameters.milestoneId);
      break;
      
    case 'show_celebration':
      showCelebration(parameters.message);
      break;
      
    case 'show_image':
      showImage(parameters.imageId);
      break;
  }
  
  // Send result back to Gemini
  client.sendToolResponse(toolCall.id, { success: true });
});
```

---

## Connection Management

### Connecting

```typescript
const handleConnect = async () => {
  try {
    // Set configuration first
    await setConfig(config);
    
    // Establish connection
    await connect();
    
    console.log('Connected to Gemini Live');
  } catch (error) {
    console.error('Connection failed:', error);
  }
};
```

### Disconnecting

```typescript
const handleDisconnect = () => {
  disconnect();
  console.log('Disconnected from Gemini Live');
};
```

### Connection Status

```typescript
const { connected } = useLiveAPIContext();

return (
  <div>
    Status: {connected ? '✅ Connected' : '⭕ Offline'}
  </div>
);
```

---

## Real-time Updates

### Listening to Events

```typescript
import { useLiveAPIContext } from './contexts/LiveAPIContext';

function StreamingConsole() {
  const { client } = useLiveAPIContext();
  
  useEffect(() => {
    if (!client) return;
    
    // Student speech transcription
    client.on('transcription', (text) => {
      console.log('Student said:', text);
    });
    
    // Gemini's response (text)
    client.on('response', (text) => {
      console.log('Pi said:', text);
    });
    
    // Gemini speaking status
    client.on('speaking:start', () => {
      setPiSpeaking(true);
    });
    
    client.on('speaking:end', () => {
      setPiSpeaking(false);
    });
    
    // Tool calls
    client.on('toolCall', (toolCall) => {
      handleToolCall(toolCall);
    });
    
    // Errors
    client.on('error', (error) => {
      console.error('Gemini error:', error);
    });
  }, [client]);
}
```

---

## Integration with Agent System

### Agent Analysis → Prompt Update

```typescript
// In StreamingConsole or useAgentContext

// 1. Student speaks
const onTranscription = async (text: string) => {
  // 2. Analyze with agents (parallel)
  const insights = await analyzeTranscription(text);
  
  // 3. Rebuild system prompt with insights
  const newPrompt = PromptBuilder.buildSystemPrompt(insights.context);
  
  // 4. Update Gemini's context
  await client.sendSystemInstruction(newPrompt);
  
  // 5. Gemini responds with enriched context
  // (happens automatically via Live API)
};
```

### Filler Service Integration

While agents analyze (takes ~800ms), use fillers to maintain conversation flow:

```typescript
const onTranscription = async (text: string) => {
  // Check if analysis will take time
  if (fillerService.shouldUseFiller()) {
    const filler = fillerService.getFiller();
    
    // Speak filler immediately
    await client.sendMessage(filler);
  }
  
  // Meanwhile, agents analyze...
  const insights = await analyzeTranscription(text);
  
  // Then respond with full context
  // (Gemini automatically incorporates insights)
};
```

---

## Error Handling

### Common Errors

**1. API Key Invalid**
```
Error: Invalid API key
```
**Solution**: Check `.env` file has correct key

**2. Connection Timeout**
```
Error: WebSocket connection timeout
```
**Solution**: Check internet connection, retry

**3. Audio Not Working**
```
Error: getUserMedia failed
```
**Solution**: Grant microphone permissions in browser

**4. Rate Limit Exceeded**
```
Error: 429 Too Many Requests
```
**Solution**: Wait before retrying, or upgrade API tier

### Error Recovery

```typescript
client.on('error', async (error) => {
  console.error('Gemini error:', error);
  
  // Attempt reconnection
  if (error.type === 'connection') {
    await disconnect();
    setTimeout(async () => {
      await connect();
    }, 3000);
  }
  
  // Show user-friendly message
  setError('Connection issue. Reconnecting...');
});
```

---

## Performance Optimization

### Reducing Latency

1. **Parallel Agent Analysis**: All agents run simultaneously (~800ms)
2. **Filler Service**: Keeps conversation flowing during analysis
3. **Streaming Audio**: Start playing audio as soon as first chunk arrives
4. **Tool Call Debouncing**: Prevent rapid-fire tool calls

### Monitoring Performance

```typescript
const { agentStats } = useAgentContext();

console.log('Agent performance:', {
  totalAnalyses: agentStats.totalAnalyses,
  avgProcessingTime: agentStats.avgProcessingTime, // Target: <1000ms
  fillersUsed: agentStats.fillersUsed
});
```

---

## Testing

### Manual Testing

1. Start dev server: `pnpm dev`
2. Complete onboarding
3. Click "Start Learning" to connect
4. Speak into microphone
5. Verify Pi responds with voice
6. Check agent insights in Teacher Panel

### Debug Logging

Enable verbose logging:

```typescript
// In LiveAPIContext.tsx
const DEBUG = true;

if (DEBUG) {
  client.on('*', (event, data) => {
    console.log(`[Gemini] ${event}:`, data);
  });
}
```

---

## Best Practices

### 1. Always Check Connection Status

```typescript
const { connected } = useLiveAPIContext();

if (!connected) {
  return <button onClick={connect}>Connect to Start</button>;
}
```

### 2. Clean Up on Unmount

```typescript
useEffect(() => {
  return () => {
    disconnect();
  };
}, []);
```

### 3. Handle Audio Permissions

```typescript
const requestMicPermission = async () => {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    return true;
  } catch (error) {
    alert('Microphone access required');
    return false;
  }
};
```

### 4. Update System Prompt Sparingly

Only update when context changes significantly:

```typescript
// DON'T: Update on every render
useEffect(() => {
  client.sendSystemInstruction(prompt);
});

// DO: Update when insights change
useEffect(() => {
  if (currentContext) {
    client.sendSystemInstruction(prompt);
  }
}, [currentContext]);
```

---

## Rate Limits & Quotas

### Free Tier

- **Requests**: 15 RPM (requests per minute)
- **Audio**: Unlimited duration per session
- **Daily Quota**: Generous limits for development

### Paid Tier

- **Requests**: Higher RPM
- **Priority Access**: Faster response times
- **Support**: Email support

### Handling Rate Limits

```typescript
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 4000; // 4s = 15 RPM

const rateLimitedRequest = async (fn: () => Promise<void>) => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => 
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }
  
  lastRequestTime = Date.now();
  await fn();
};
```

---

## Troubleshooting

### Issue: No audio output

**Check**:
1. Browser audio not muted
2. System volume not at 0
3. Gemini returning audio chunks (check logs)

### Issue: Transcription not working

**Check**:
1. Microphone permissions granted
2. Correct audio format (16kHz, mono, PCM16)
3. AudioRecorder properly initialized

### Issue: Gemini not responding

**Check**:
1. System prompt not too long (max ~30k chars)
2. Connection status is "connected"
3. No rate limit errors in console

---

## Related Documentation

- [Agent Architecture](./AGENT-ARCHITECTURE.md) - How agents integrate with Gemini
- [Repository Setup](./REPOSITORY-SETUP.md) - Development environment
- [Design System](./DESIGN-SYSTEM.md) - UI components
- [Next Steps](./NEXT-STEPS.md) - Future improvements
