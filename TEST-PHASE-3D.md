# 🧪 Test Phase 3D: Backend Misconception Detection

## Quick Start

### **Terminal 1: Start Backend**
```bash
cd /Users/vsrivathsan/Documents/simili-monorepo-v1
pnpm run api-server
```

**Expected output:**
```
╔════════════════════════════════════════════╗
║  Simili API Server - Child-Safe Backend   ║
╠════════════════════════════════════════════╣
║  Port: 4000                                ║
║  Environment: development                  ║
║  Privacy: Enabled                          ║
║  Encryption: Active                        ║
╚════════════════════════════════════════════╝

✓ Security middleware active
✓ Rate limiting enabled
✓ Privacy filters active
✓ Anonymous sessions enabled

Ready to accept requests...
```

---

### **Terminal 2: Start Frontend**
```bash
pnpm dev
```

**Expected:**
```
VITE v5.x.x ready in XXX ms

➜  Local:   http://localhost:5173/
```

---

## Test Scenarios

### **Test 1: Misconception Detection** ⚠️

1. **Open**: http://localhost:5173
2. **Click**: "Start: Understanding Fractions..."
3. **Click**: "Connect" button
4. **Say**: "I cut the chocolate into two pieces, so each is one half"
   - *(Intentionally NOT mentioning EQUAL parts)*

**Expected Console Logs:**
```
[useLiveApi] 📝 Final transcription received: I cut the chocolate into two pieces, so each is one half
[useLiveApi] 🔍 Sending to backend for analysis...
[ApiClient] Session created: anon_1234567890_xyz
[useLiveApi] ✅ Backend analysis received: { misconception: { detected: true, ... } }
[useLiveApi] ⚠️ Misconception detected: unequal-parts-as-fractions
[useLiveApi] ✉️ Sending misconception feedback to agent...
[useLiveApi] ✅ Misconception feedback sent!
```

**Expected UI:**
- System message: `🔍 Detected: unequal-parts-as-fractions (87% confidence)`
- Agent responds with gentle correction about equal parts

---

### **Test 2: Correct Understanding** ✅

1. **Say**: "I need to divide it into two EQUAL parts to make halves"

**Expected Console Logs:**
```
[useLiveApi] 📝 Final transcription received: I need to divide it into two EQUAL parts to make halves
[useLiveApi] 🔍 Sending to backend for analysis...
[useLiveApi] ✅ Backend analysis received: { misconception: { detected: false } }
[useLiveApi] ✅ No misconception detected
```

**Expected UI:**
- No system message
- Agent continues teaching normally

---

### **Test 3: Backend Failure Graceful** 🛡️

1. **Stop backend** (Terminal 1: Ctrl+C)
2. **Say anything**: "I divided it"

**Expected Console Logs:**
```
[useLiveApi] 📝 Final transcription received: I divided it
[useLiveApi] 🔍 Sending to backend for analysis...
[useLiveApi] ❌ Backend analysis failed: fetch failed
```

**Expected Behavior:**
- NO error shown to user
- Conversation continues normally
- Agent still responds (without backend insight)

---

### **Test 4: Low Confidence → No Action** 🎯

1. **Restart backend**
2. **Say ambiguous statement**: "I made two parts"

**Expected:**
- If confidence < 0.7 → No feedback sent to agent
- Console: `[useLiveApi] ✅ No misconception detected` (or low confidence)

---

## Detailed Flow Verification

### **Step-by-Step Trace**

1. **Student speaks** → Gemini Live captures audio
2. **Transcription** → `inputTranscription` event fires
3. **Frontend** → `handleInputTranscription()` checks `isFinal === true`
4. **API call** → `POST /api/analyze` with:
   ```json
   {
     "sessionId": "anon_123",
     "transcription": "I cut it into two pieces",
     "isFinal": true,
     "lessonContext": {
       "lessonId": "fractions-3-nf-a-1",
       "milestoneIndex": 0,
       "attempts": 0,
       "timeOnMilestone": 0
     }
   }
   ```
5. **Backend** → Privacy middleware filters PII
6. **LangGraph** → Runs MisconceptionClassifier
7. **Response** → Returns:
   ```json
   {
     "success": true,
     "misconception": {
       "detected": true,
       "type": "unequal-parts-as-fractions",
       "confidence": 0.87,
       "evidence": "Student mentioned 'two pieces' without 'equal'",
       "intervention": "Ask Socratic question about equality",
       "correctiveConcept": "Fractions require EQUAL partitioning"
     }
   }
   ```
8. **Frontend** → Checks `confidence > 0.7`
9. **Format feedback** → `formatMisconceptionFeedback()`
10. **Send to agent** → `client.sendTextMessage(feedback)`
11. **Agent** → Receives JSON, adjusts teaching

---

## Debug Checklist

If something doesn't work:

### **Backend Not Starting?**
- ✓ Check port 4000 is available: `lsof -i :4000`
- ✓ Check `.env` has `GEMINI_API_KEY`
- ✓ Check dependencies: `pnpm install`

### **Frontend Not Connecting?**
- ✓ Check GEMINI_API_KEY in environment
- ✓ Check browser console for errors
- ✓ Check microphone permissions

### **No Transcription?**
- ✓ Enable transcription in sidebar settings
- ✓ Check `inputAudioTranscription` config
- ✓ Verify microphone is working

### **Backend Not Called?**
- ✓ Check `isFinal === true` in console logs
- ✓ Check lesson is loaded
- ✓ Check network tab for `/api/analyze` requests
- ✓ Verify proxy is working: http://localhost:5173/api/health

### **No Misconception Detected?**
- ✓ Check backend logs for analysis results
- ✓ Check confidence threshold (> 0.7)
- ✓ Try more explicit misconception statements

---

## Success Criteria

✅ Backend starts without errors  
✅ Frontend connects to Gemini Live  
✅ Transcriptions appear in console  
✅ Backend `/api/analyze` is called  
✅ Misconceptions detected with confidence scores  
✅ Feedback sent to agent as JSON  
✅ Agent responds with corrective teaching  
✅ Graceful degradation if backend fails

---

## Sample Test Utterances

### **Should Detect Misconceptions:**
- "I cut it into two pieces" *(no mention of equal)*
- "This piece is bigger but they're both halves" *(unequal parts)*
- "The bottom number is how many pieces I'm taking" *(numerator/denominator confusion)*
- "1/8 is more than 1/2 because 8 is bigger" *(denominator size misconception)*

### **Should NOT Detect:**
- "I need to divide it into two EQUAL parts"
- "Each half must be the same size"
- "The denominator tells how many equal parts"
- "1/2 means 1 part out of 2 equal parts"

---

## Next: What to Test

After verifying Phase 3D works:

1. **Phase 3E**: Emotional state detection
2. **Phase 3F**: Vision agent (canvas analysis)
3. **Phase 3G**: Milestone auto-progression

---

**Ready to test!** 🚀

Run both servers and try the test scenarios above.
