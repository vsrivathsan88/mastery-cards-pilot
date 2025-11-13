# 🛡️ ROBUSTNESS PRIORITIES - Critical Reliability Gaps

**Focus:** Technical reliability, not aesthetics
**Goal:** Zero failures for young children

---

## 🚨 CRITICAL ROBUSTNESS GAPS

### 1. ⚠️ No Gemini Circuit Breaker (HIGH PRIORITY)
**Problem:** Claude has circuit breaker, but Gemini doesn't
**Risk:** Infinite reconnection loops if Gemini service fails
**Current:** After 5 failed reconnects, just logs error and stops silently

**Fix Required:**
```typescript
// src/lib/gemini-live-client-sdk.ts
// Add circuit breaker like Claude has
// OR: Better permanent failure handling with user feedback
```

**Impact:** App hangs silently if Gemini is down (not just network issues)

---

### 2. ⚠️ Gemini Reconnection Edge Cases (HIGH PRIORITY)
**Problem:** Reconnection can fail silently without user feedback
**Current State:**
- Max 5 attempts with exponential backoff
- After 5 failures: emits 'permanentFailure' but nothing handles it
- User sees no feedback about what's happening

**Fix Required:**
1. Handle 'permanentFailure' event in App.tsx
2. Show clear error: "Can't connect to Pi after 5 tries"
3. Suggest: "Check your internet and refresh"

---

### 3. ⚠️ Image Loading Failures (MEDIUM PRIORITY)
**Problem:** Card images can fail to load (404, network error, timeout)
**Current:** No error handling, just blank card
**Risk:** Child sees blank card, doesn't know if it's loading or broken

**Fix Required:**
```typescript
// src/components/cards/MasteryCard.tsx
// Add:
// - Loading spinner while fetching
// - Error state with retry button
// - Timeout (10s max wait)
```

---

### 4. ⚠️ AudioWorklet Loading Failure (HIGH PRIORITY)
**Problem:** New AudioWorklet code might fail to load in some browsers
**Risk:** Mic works in Chrome but fails silently in Safari/Firefox
**Current:** No fallback, just throws error

**Fix Required:**
```typescript
// src/lib/gemini-live-client-sdk.ts
// Add try/catch around audioWorklet.addModule
// Fallback: Use ScriptProcessorNode (with deprecation warning)
// OR: Show clear error if AudioWorklet not supported
```

---

### 5. ⚠️ Network Disconnect During Conversation (MEDIUM PRIORITY)
**Problem:** If network drops mid-conversation, no clear recovery
**Current:**
- Watchdog detects stale (15s timeout)
- Auto-reconnects
- BUT: User sees no feedback during 15s wait

**Fix Required:**
- Show "Connection lost - Reconnecting..." toast
- Don't interrupt if Pi was mid-sentence
- Clear indicator when reconnected

---

### 6. ⚠️ Claude API Complete Failure (MEDIUM PRIORITY)
**Problem:** If Claude API is down, circuit breaker opens but then what?
**Current:** Circuit opens, uses fallback (next_without_points after 3 exchanges)
**Issue:** Child doesn't know why cards are progressing weirdly

**Fix Required:**
- Add toast: "Having trouble checking your answer - moving on for now"
- OR: Pause session and show "Our grading system is having trouble"

---

### 7. ⚠️ Session State Corruption (LOW BUT CRITICAL)
**Problem:** If localStorage gets corrupted, app could crash on load
**Current:** No validation of loaded state
**Risk:** Edge case but catastrophic (white screen even with error boundary)

**Fix Required:**
```typescript
// src/lib/state/session-store.ts
// Add schema validation when loading from localStorage
// If invalid: Clear and start fresh
```

---

### 8. ⚠️ Race Condition: Card Change During Evaluation (ALREADY HANDLED?)
**Status:** Need to verify current implementation is bulletproof
**Current:** Turn validation should prevent this
**Test:** Rapidly advance cards while evaluation running

---

## 📋 IMPLEMENTATION ORDER

### Phase 1: Critical Connection Issues (Today - 4 hours)
1. **Gemini Permanent Failure Handling** (1h)
   - Handle 'permanentFailure' event
   - Show error UI with retry/refresh

2. **AudioWorklet Fallback** (1.5h)
   - Try AudioWorklet first
   - Fall back to ScriptProcessorNode if fails
   - Log which one is used

3. **Image Loading States** (1.5h)
   - Loading spinner
   - Error state with retry
   - Timeout handling

### Phase 2: Network Resilience (Tomorrow - 3 hours)
4. **Network Disconnect Feedback** (1h)
   - Toast: "Reconnecting..."
   - Toast: "Connected!"

5. **Claude Failure Feedback** (1h)
   - Detect circuit open
   - Show toast explaining issue

6. **Session State Validation** (1h)
   - Validate localStorage schema
   - Clear if invalid

---

## 🔧 IMPLEMENTATION DETAILS

### Fix 1: Gemini Permanent Failure Handling

**File: `src/App.tsx`**

```typescript
// Add event handler after client creation (line ~240+):
client.on('permanentFailure', ({ message, suggestion }) => {
  console.error('[App] ❌ Gemini permanent failure:', message);

  // Show error state
  setConnectionError({
    title: "Can't Reach Pi",
    message: message,
    suggestion: suggestion || "Check your internet connection and try refreshing the page",
    canRetry: true,
  });
});

// Add state:
const [connectionError, setConnectionError] = useState<{
  title: string;
  message: string;
  suggestion: string;
  canRetry: boolean;
} | null>(null);

// Add UI (in return statement):
{connectionError && (
  <ConnectionError
    {...connectionError}
    onRetry={() => {
      setConnectionError(null);
      window.location.reload();
    }}
  />
)}
```

**File: `src/components/ConnectionError.tsx`** (new)
```typescript
export function ConnectionError({
  title,
  message,
  suggestion,
  canRetry,
  onRetry
}: ConnectionErrorProps) {
  return (
    <div className="connection-error-overlay">
      <div className="connection-error-box">
        <div className="error-icon">📡</div>
        <h2>{title}</h2>
        <p className="error-message">{message}</p>
        <p className="error-suggestion">{suggestion}</p>

        {canRetry && (
          <button onClick={onRetry} className="retry-button">
            Refresh Page
          </button>
        )}
      </div>
    </div>
  );
}
```

---

### Fix 2: AudioWorklet Fallback

**File: `src/lib/gemini-live-client-sdk.ts`**

Update `startAudioInput()` around line 243:

```typescript
async startAudioInput(): Promise<void> {
  // ... existing code ...

  const audioContext = new AudioContext({ sampleRate: 16000 });
  const source = audioContext.createMediaStreamSource(this.mediaStream);

  let workletNode: AudioWorkletNode | ScriptProcessorNode;

  try {
    // Try AudioWorklet first (modern)
    await audioContext.audioWorklet.addModule(
      new URL('./audio-input-processor.ts', import.meta.url)
    );
    workletNode = new AudioWorkletNode(audioContext, 'audio-input-processor');

    workletNode.port.onmessage = (event: MessageEvent) => {
      if (!this.session) return;
      const pcm16Buffer = event.data as ArrayBuffer;
      const uint8 = new Uint8Array(pcm16Buffer);
      const base64 = btoa(String.fromCharCode(...uint8));
      this.session.sendRealtimeInput([{
        mimeType: 'audio/pcm;rate=16000',
        data: base64,
      }]);
    };

    console.log('[Gemini SDK] ✅ Using AudioWorkletNode');

  } catch (error) {
    console.warn('[Gemini SDK] ⚠️ AudioWorklet not supported, falling back to ScriptProcessorNode');

    // Fallback to ScriptProcessorNode (deprecated but works everywhere)
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
      if (!this.session) return;

      const inputData = e.inputBuffer.getChannelData(0);
      const pcm16 = new Int16Array(inputData.length);

      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      const uint8 = new Uint8Array(pcm16.buffer);
      const base64 = btoa(String.fromCharCode(...uint8));

      this.session.sendRealtimeInput([{
        mimeType: 'audio/pcm;rate=16000',
        data: base64,
      }]);
    };

    workletNode = processor;
    console.log('[Gemini SDK] ✅ Using ScriptProcessorNode (fallback)');
  }

  source.connect(workletNode);
  workletNode.connect(audioContext.destination);

  this.audioRecorder = { audioContext, source, workletNode };
  console.log('[Gemini SDK] ✅ Audio input streaming started');
}
```

**Update `stopAudioInput()` to handle both types:**
```typescript
stopAudioInput(): void {
  if (this.audioRecorder) {
    // Works for both AudioWorkletNode and ScriptProcessorNode
    this.audioRecorder.workletNode.disconnect();
    this.audioRecorder.source.disconnect();
    this.audioRecorder.audioContext.close();
    this.audioRecorder = null;
  }
  // ... rest of existing code
}
```

---

### Fix 3: Image Loading States

**File: `src/components/cards/MasteryCard.tsx`**

```typescript
export function MasteryCard({ card }: { card: MasteryCardData }) {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [imageTimeout, setImageTimeout] = useState(false);

  useEffect(() => {
    // Reset state when card changes
    setImageState('loading');
    setImageTimeout(false);

    // Set timeout for image loading (10 seconds)
    const timer = setTimeout(() => {
      if (imageState === 'loading') {
        setImageTimeout(true);
        setImageState('error');
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [card.cardNumber]);

  const handleImageLoad = () => {
    setImageState('loaded');
  };

  const handleImageError = () => {
    setImageState('error');
  };

  const handleRetry = () => {
    setImageState('loading');
    setImageTimeout(false);
    // Force reload by changing src key
  };

  return (
    <div className="mastery-card">
      <div className="card-image-container">
        {imageState === 'loading' && (
          <div className="image-loading">
            <div className="spinner"></div>
            <p>Loading image...</p>
          </div>
        )}

        {imageState === 'error' && (
          <div className="image-error">
            <div className="error-icon">📷</div>
            <p>
              {imageTimeout
                ? 'Image is taking too long to load'
                : 'Image failed to load'}
            </p>
            <button onClick={handleRetry} className="retry-btn">
              Try Again
            </button>
          </div>
        )}

        <img
          src={card.imageUrl}
          alt={card.imageDescription}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            display: imageState === 'loaded' ? 'block' : 'none'
          }}
        />
      </div>

      {/* Rest of card UI */}
    </div>
  );
}
```

---

### Fix 4: Network Disconnect Feedback

**File: `src/App.tsx`**

Add reconnection state tracking:

```typescript
const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'reconnecting' | 'failed'>('connecting');

// Update client event handlers:
client.on('connected', () => {
  setConnectionStatus('connected');
  // Show toast: "Connected to Pi!"
});

client.on('disconnected', () => {
  setConnectionStatus('reconnecting');
  // Show toast: "Reconnecting to Pi..."
});

client.on('reconnecting', () => {
  setConnectionStatus('reconnecting');
  // Show toast: "Reconnecting... (attempt X/5)"
});

client.on('permanentFailure', () => {
  setConnectionStatus('failed');
  // Show error UI
});
```

---

## 🧪 TESTING CHECKLIST

### Test Scenario 1: Gemini Service Down
```bash
# Simulate: Use invalid API key
VITE_GEMINI_API_KEY=invalid pnpm run dev

# Expected:
1. After 5 reconnect attempts (exponential backoff)
2. Shows error: "Can't Reach Pi"
3. Suggests: "Check your internet and refresh"
4. "Refresh Page" button works
```

### Test Scenario 2: AudioWorklet Not Supported
```bash
# Simulate: Force error in AudioWorklet load
# Modify audio-input-processor.ts to throw error

# Expected:
1. Console log: "AudioWorklet not supported, falling back..."
2. Uses ScriptProcessorNode instead
3. Microphone still works
4. No user-facing error
```

### Test Scenario 3: Image 404
```bash
# Modify card data to use invalid image URL
imageUrl: 'https://example.com/404.jpg'

# Expected:
1. Shows loading spinner initially
2. After 10s or immediate 404: Shows error state
3. "Try Again" button visible
4. Clicking retry reloads image
```

### Test Scenario 4: Network Drop Mid-Session
```bash
# Test:
1. Start session, connect to Gemini
2. Start conversation
3. Disable WiFi
4. Wait 15 seconds (watchdog timeout)
5. Re-enable WiFi

# Expected:
1. Toast: "Connection lost - Reconnecting..."
2. Watchdog detects stale connection
3. Auto-reconnects
4. Toast: "Reconnected!"
5. Conversation continues
```

---

## 📊 PRIORITY MATRIX

| Issue | Severity | Frequency | User Impact | Priority |
|-------|----------|-----------|-------------|----------|
| Gemini permanent failure | High | Low | Catastrophic | P0 |
| AudioWorklet fallback | High | Low | Blocks Safari | P0 |
| Image loading | Medium | Medium | Confusion | P1 |
| Network disconnect feedback | Medium | Medium | Anxiety | P1 |
| Claude failure feedback | Low | Low | Confusion | P2 |
| Session state corruption | High | Very Low | Catastrophic | P2 |

---

## 🎯 DEFINITION OF DONE

Phase 1 complete when:
- [ ] Gemini permanent failure shows error screen
- [ ] AudioWorklet has ScriptProcessorNode fallback
- [ ] Images show loading/error states with retry
- [ ] All scenarios tested
- [ ] No console errors in Chrome, Safari, Firefox
- [ ] Code committed to git

---

## 💡 IMPLEMENTATION STRATEGY

**Today (4 hours):**
1. Create ConnectionError component (30 min)
2. Handle permanentFailure event (30 min)
3. Add AudioWorklet fallback (1.5 hours)
4. Add image loading states (1.5 hours)

**Tomorrow (if needed):**
5. Network disconnect feedback
6. Session state validation

**Focus:** Rock-solid reliability over features
**Goal:** App never hangs silently

---

## 🚫 OUT OF SCOPE (Not Robustness)

Deliberately NOT including:
- Animated avatars (UX enhancement, not robustness)
- Sound effects (nice-to-have)
- Toast notifications (unless for errors)
- Session summary (feature addition)
- Progress persistence (feature addition)

These can come later. First: **Make it unbreakable.**

---

**Next Action:** Implement Phase 1 (4 hours) - Start with ConnectionError component
