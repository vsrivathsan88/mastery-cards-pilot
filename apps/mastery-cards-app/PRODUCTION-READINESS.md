# Production Readiness Checklist

## ✅ COMPLETED - Audio Fixes

### AudioStreamer Integration
- **Replaced raw AudioBufferSourceNode with AudioStreamer**
- Uses `AudioStreamer.addPCM16()` for proper audio queuing
- Prevents overlapping audio streams
- Gapless playback with proper look-ahead scheduling
- `stopAllAudio()` now calls `AudioStreamer.stop()` properly

**What this fixes:**
- ✅ No more multiple voices playing simultaneously
- ✅ Smooth audio transitions without clicking
- ✅ Proper audio cleanup on card changes
- ✅ Follows OpenAI's reference implementation pattern

## ✅ COMPLETED - Backend Server

### Ephemeral Token Server
Created `server.ts` with endpoint: `POST /api/realtime/token`

**Security benefits:**
- API keys stay on server (never exposed to browser)
- Ephemeral tokens are short-lived and scoped
- Follows OpenAI's recommended security pattern

## 🚧 TODO - Complete Ephemeral Token Integration

### Next Steps:
1. **Install dependencies** (may already be done):
   ```bash
   npm install express cors @types/express @types/cors tsx
   ```

2. **Start the token server** (in separate terminal):
   ```bash
   npm run server
   ```

3. **Update client code** to use token endpoint:
   ```typescript
   // In App.tsx, change from:
   const client = new OpenAIRealtimeClient({
     apiKey: openaiKey,
     instructions: initialPrompt
   });
   
   // To:
   const client = new OpenAIRealtimeClient({
     tokenEndpoint: 'http://localhost:3001/api/realtime/token',
     instructions: initialPrompt
   });
   ```

4. **Update .env** - remove browser API key:
   - Delete `VITE_OPENAI_API_KEY` from `.env`
   - Add `OPENAI_API_KEY` to server environment (backend only)

5. **Test**:
   - Should see: `[OpenAI] ✅ Using ephemeral token (secure)`
   - Should NOT see security warnings about API keys

## 📋 Additional Production Requirements

### High Priority
- [ ] Create Claude proxy endpoint (CORS + security)
- [ ] Add error toasts for user-facing errors
- [ ] Test on mobile devices (iOS Safari, Chrome)
- [ ] Add reconnection logic with exponential backoff

### Medium Priority
- [ ] Replace deprecated ScriptProcessorNode with AudioWorklet
- [ ] Compress system prompt to reduce latency
- [ ] Add rate limiting on evaluation endpoint
- [ ] Implement proper error boundaries

### Low Priority
- [ ] Load test with multiple concurrent users
- [ ] Add analytics/logging for debugging
- [ ] Create deployment guide
- [ ] Document API endpoints

## 🔒 Security Checklist

- [x] Audio playback uses production-ready AudioStreamer
- [x] WebSocket connection prevents duplicates
- [x] Backend server created for token generation
- [ ] API keys removed from browser
- [ ] Ephemeral tokens used for all connections
- [ ] Claude API calls go through backend proxy
- [ ] Rate limiting implemented
- [ ] CORS properly configured
- [ ] Error messages don't leak sensitive info

## 📊 Testing Checklist

### Audio Testing
- [ ] Hard refresh browser (`Cmd+Shift+R`)
- [ ] Connect and speak
- [ ] Advance through cards
- [ ] Verify ONLY ONE voice playing
- [ ] No clicking or stuttering
- [ ] Audio stops properly on card changes

### Connection Testing
- [ ] Check console: no duplicate "WebSocket created" messages
- [ ] Check console: "Using ephemeral token (secure)"
- [ ] Reconnect after disconnect
- [ ] Multiple tabs don't interfere

### Flow Testing
- [ ] Welcome card auto-advances
- [ ] Claude evaluation works
- [ ] Points update correctly
- [ ] Card progression follows rules
- [ ] Session state persists

## 🎯 Current Status

**Last commit:** `Use AudioStreamer properly for gapless audio playback`

**What to test NOW:**
1. Hard refresh browser
2. Connect and test if audio works with single voice
3. Try advancing cards - audio should stop cleanly
4. Check console for errors

**After audio is confirmed working:**
1. Complete ephemeral token setup
2. Test secure connection
3. Create Claude proxy endpoint
