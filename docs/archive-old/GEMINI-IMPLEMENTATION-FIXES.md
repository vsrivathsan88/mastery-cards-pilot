# Gemini Live SDK Implementation Fixes

**Date:** 2025-11-11
**Status:** Critical Bugs Identified - Fixing Now

---

## 🔍 ROOT CAUSE ANALYSIS

After reviewing the official Google reference implementation in `native-audio-function-call-sandbox`, I've identified **3 critical differences** causing our connection to close immediately:

---

## ❌ CRITICAL BUGS IN OUR IMPLEMENTATION

### Bug #1: **Incorrect `sendClientContent` Format**
**Our code (WRONG):**
```typescript
this.session.sendClientContent({
  turns: [{ role: 'user', parts: [{ text: initialMsg }] }],
  turnComplete: true,
});
```

**Reference implementation (CORRECT):**
```typescript
this.session.sendClientContent({
  turns: [{ text: initialMsg }],  // Parts directly, no role!
  turnComplete: true,
});
```

**Problem:** The SDK expects `turns` to be an array of `Part` objects, NOT an array with role/parts structure. Adding `role: 'user'` wraps it incorrectly.

---

### Bug #2: **Don't Send Initial Message Immediately**
**Our code (WRONG):**
```typescript
this.session = await this.client.live.connect(...);
console.log('[Gemini SDK] Session created');

// IMMEDIATELY send message
this.session.sendClientContent({ ... });
```

**Reference implementation (CORRECT):**
```typescript
// Connect and register callbacks
this.session = await this.client.live.connect(...);

// DON'T send anything immediately!
// Wait for 'setupcomplete' event, THEN start audio input
```

**Problem:** We're sending a message **before** the setup is complete. The reference implementation:
1. Connects
2. Waits for `setupComplete` event
3. Only THEN starts audio input (no initial text message)

---

### Bug #3: **Missing `setupComplete` Event Handler**
**Our code (WRONG):**
```typescript
private handleMessage(message: any): void {
  if (message.setupComplete) {
    this.setupComplete = true;
    this.emit('ready');
    // ❌ But we NEVER listen for 'ready' to start audio!
  }
}
```

**Reference implementation (CORRECT):**
```typescript
// In genai-live-client.ts
protected onMessage(message: LiveServerMessage) {
  if (message.setupComplete) {
    this.emit('setupcomplete');  // Emits specific event
    return;
  }
  // ... handle other messages
}

// In use-live-api.ts hook
useEffect(() => {
  const onOpen = () => {
    setConnected(true);  // This triggers audio to start
  };

  client.on('open', onOpen);
  // ... other handlers
}, [client]);
```

**Problem:** We emit 'ready' but nothing listens for it. The reference waits for 'open', which sets `connected=true`, which triggers the audio recording effect.

---

## ✅ THE FIX

### Change #1: Remove Initial Message Entirely
The reference implementation **does NOT send an initial text message**. Instead:
1. Connect
2. Wait for `setupComplete`
3. Start audio input immediately
4. Let the user speak first

**Why:** Gemini Live is designed for **voice-first** interaction. Starting with text confuses the session.

---

### Change #2: Fix Event Flow
**Correct flow (from reference):**
```
1. client.connect(config)
   ↓
2. callbacks.onopen() fires
   ↓
3. Emit 'open' event
   ↓
4. App/hook listens for 'open', sets connected=true
   ↓
5. setupComplete message arrives
   ↓
6. Emit 'setupcomplete' event
   ↓
7. Audio input starts streaming
```

**Our broken flow:**
```
1. client.connect(config)
   ↓
2. callbacks.onopen() fires
   ↓
3. Immediately send text message ❌
   ↓
4. Session gets confused and closes ❌
```

---

### Change #3: Start Audio Immediately After Setup
**Reference approach:**
```typescript
// In use-live-api.ts
const connect = useCallback(async () => {
  client.disconnect();
  await client.connect(config);
  // That's it! Audio starts via 'open' event triggering useEffect
}, [client, config]);

// Separate useEffect manages audio based on `connected` state
useEffect(() => {
  if (connected && !muted && audioRecorder) {
    audioRecorder.on('data', onData);
    audioRecorder.start();
  } else {
    audioRecorder.stop();
  }
}, [connected, muted, audioRecorder]);
```

---

## 📋 IMPLEMENTATION CHANGES

### File: `src/lib/gemini-live-client-sdk.ts`

**Remove:**
1. ❌ `initialMessage` parameter from config
2. ❌ The code that sends initial message after connect
3. ❌ The 'ready' event (use 'setupcomplete' instead)

**Add:**
1. ✅ Emit 'setupcomplete' event when setup completes
2. ✅ Let App.tsx handle starting audio after 'open' event

**Modified connect() method:**
```typescript
async connect(): Promise<void> {
  if (this.status === 'connected' || this.status === 'ready') {
    console.log('[Gemini SDK] Already connected');
    return;
  }

  this.status = 'connecting';
  console.log('[Gemini SDK] Connecting to Live API...');

  await this.initAudioOutput();

  const connectConfig: LiveConnectConfig = {
    temperature: this.config.temperature,
    responseModalities: ['AUDIO'] as any,
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: this.config.voice,
        },
      },
    },
  };

  if (this.config.systemInstruction) {
    (connectConfig as any).systemInstruction = {
      parts: [{ text: this.config.systemInstruction }],
    };
  }

  try {
    this.session = await this.client.live.connect({
      model: this.config.model!,
      config: connectConfig,
      callbacks: {
        onopen: () => {
          console.log('[Gemini SDK] ✅ Connected');
          this.status = 'connected';
          this.emit('open');  // Changed from 'connected'
        },
        onmessage: (message: any) => {
          this.handleMessage(message);
        },
        onerror: (error: ErrorEvent) => {
          console.error('[Gemini SDK] ❌ Error:', error);
          this.emit('error', error);
        },
        onclose: () => {
          console.log('[Gemini SDK] Connection closed');
          this.status = 'disconnected';
          this.emit('close');  // Changed from 'disconnected'
        },
      },
    });

    console.log('[Gemini SDK] Session created, waiting for setupComplete...');
    // ✅ NO initial message sent!

  } catch (error) {
    console.error('[Gemini SDK] Failed to connect:', error);
    this.status = 'disconnected';
    throw error;
  }
}
```

**Modified handleMessage():**
```typescript
private handleMessage(message: any): void {
  // Setup complete
  if (message.setupComplete) {
    console.log('[Gemini SDK] ✅ Setup complete');
    this.setupComplete = true;
    this.status = 'ready';
    this.emit('setupcomplete');  // ✅ Changed from 'ready'
    return;
  }

  // ... rest of message handling
}
```

---

### File: `src/App.tsx`

**Change event listeners:**
```typescript
// OLD (broken):
client.on('connected', () => { ... });
client.on('disconnected', () => { ... });

// NEW (correct):
client.on('open', () => {
  console.log('[App] Gemini connected');
  // Start audio input here if not already started
});

client.on('setupcomplete', () => {
  console.log('[App] Gemini setup complete - ready for audio');
});

client.on('close', () => {
  console.log('[App] Gemini connection closed');
  // Handle reconnection if needed
});
```

**Start audio after open:**
```typescript
useEffect(() => {
  if (!client) return;

  const handleOpen = async () => {
    console.log('[App] Gemini opened, starting audio input...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      await client.startAudioInput(stream);
      console.log('[App] ✅ Audio input started');
    } catch (error) {
      console.error('[App] ❌ Failed to start audio:', error);
    }
  };

  client.on('open', handleOpen);

  return () => {
    client.off('open', handleOpen);
  };
}, [client]);
```

---

## 🎯 KEY INSIGHTS FROM REFERENCE

1. **Voice-First Design**
   - Gemini Live is designed for **audio streams**, not text messages
   - Don't send initial text - let user speak first
   - The system instruction sets the context

2. **Event Flow Matters**
   - `onopen` → emit 'open' → start audio
   - `setupComplete` → emit 'setupcomplete' → ready state
   - `onclose` → emit 'close' → cleanup

3. **Separation of Concerns**
   - Client handles connection + message routing
   - Hook/Context manages audio recorder lifecycle
   - Components react to connection state

4. **Audio Streaming Pattern**
   ```
   User speaks → AudioRecorder captures
              → Converts to PCM16 base64
              → sendRealtimeInput()
              → Gemini processes
              → Sends audio response
              → AudioStreamer plays
   ```

---

## 🧪 TESTING PLAN

After fixes:

1. **Test Connection**
   ```bash
   pnpm run dev
   # Expected console output:
   # [Gemini SDK] Connecting to Live API...
   # [Gemini SDK] ✅ Connected
   # [Gemini SDK] Session created, waiting for setupComplete...
   # [Gemini SDK] ✅ Setup complete
   # [App] Gemini opened, starting audio input...
   # [App] ✅ Audio input started
   ```

2. **Test Audio Flow**
   - Speak into microphone
   - Should see: `[Gemini SDK] Sending audio chunk`
   - Should hear: Gemini's voice response

3. **Test No Immediate Close**
   - Connection should stay open
   - No "Connection closed" message immediately after connecting

---

## 📊 BEFORE vs AFTER

| Aspect | Before (Broken) | After (Fixed) |
|--------|----------------|---------------|
| **Initial Message** | Sends text immediately | No initial message |
| **Event Names** | 'connected', 'disconnected' | 'open', 'close', 'setupcomplete' |
| **Audio Start** | Never starts | Starts after 'open' event |
| **Connection Lifetime** | Closes immediately | Stays open for conversation |
| **Follows Reference** | ❌ No | ✅ Yes |

---

## ✅ SUCCESS CRITERIA

Fixes complete when:
- [x] Removed `initialMessage` parameter
- [x] Removed code that sends initial text
- [x] Changed event names to match reference
- [ ] Connection stays open (doesn't close immediately)
- [ ] Audio input starts after 'open' event
- [ ] Can hear Gemini's voice response
- [ ] Full conversation flow works

---

## 🚀 NEXT STEPS

1. Apply these fixes to `gemini-live-client-sdk.ts`
2. Update `App.tsx` event listeners
3. Test connection stays open
4. Test audio flow end-to-end
5. Commit if working

**Time estimate:** 30 minutes
**Impact:** Critical - fixes the entire Gemini Live integration
