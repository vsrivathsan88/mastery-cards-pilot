# Migration Guide: Main App → Sandbox App

## Overview

This guide helps you migrate from the current main app to the new sandbox-based implementation.

## Why Migrate?

### Problems with Current Main App:
1. **Stale decision bugs** - Evaluation results applied to wrong cards
2. **Timing issues** - Gemini and Claude racing, causing conflicts
3. **Complex state management** - TurnCoordinator, TemporalGuard, turn IDs
4. **Audio quality** - Manual AudioContext manipulation
5. **Maintenance burden** - Custom WebSocket client needs updates

### Benefits of Sandbox App:
1. ✅ **No stale decisions** - Function calls are atomic
2. ✅ **No timing issues** - Explicit control flow via functions
3. ✅ **Simpler code** - 30% less complexity
4. ✅ **Better audio** - Native worklets
5. ✅ **Future-proof** - Official SDK auto-updates

## Quick Comparison

| Feature | Main App | Sandbox App |
|---------|----------|-------------|
| Location | `src/` | `native-audio-function-call-sandbox/` |
| Entry Point | `src/App.tsx` | `App.mastery.tsx` |
| Client | `gemini-live-client.ts` (custom) | `@google/genai` SDK |
| Control Flow | Turn tracking | Function calling |
| Evaluation Trigger | Background (automatic) | Explicit (Gemini calls function) |

## Step-by-Step Migration

### 1. Prerequisites

```bash
# Make sure you're in the monorepo root
cd apps/mastery-cards-app

# Verify sandbox build works
cd native-audio-function-call-sandbox
npm install
npm run build
```

### 2. Set Up Environment

```bash
# Copy your existing env vars
cp ../.env.local .env.local

# Verify keys are present
cat .env.local | grep VITE_GEMINI_API_KEY
cat .env.local | grep VITE_CLAUDE_API_KEY
```

### 3. Test Locally

```bash
npm run dev
# Open http://localhost:5173
```

### 4. Verify Functionality

Test these flows:
- [ ] Name prompt appears
- [ ] Welcome screen with Pi
- [ ] Microphone permission granted
- [ ] Connection to Gemini successful
- [ ] Card image loads
- [ ] Voice conversation works
- [ ] Evaluation happens after conversation
- [ ] Points awarded correctly
- [ ] Level-up animation shows
- [ ] Next card loads smoothly
- [ ] Console shows function calls

### 5. Deploy New Version

#### Option A: Side-by-Side Deployment
Deploy sandbox app to new URL for testing:

```bash
# Vercel example
vercel --cwd native-audio-function-call-sandbox --prod --alias mastery-v2
# Test at: https://mastery-v2.yourdomain.com
```

#### Option B: Blue-Green Deployment
1. Deploy sandbox app as "green" environment
2. Route 10% of traffic to test
3. Monitor metrics (completion rate, errors)
4. Gradually increase traffic
5. Decommission old app once stable

#### Option C: Direct Replacement
Replace main app with sandbox:

```bash
# Backup current main app
git checkout -b backup/main-app-$(date +%Y%m%d)
git push origin backup/main-app-$(date +%Y%m%d)

# Replace src/ with sandbox contents
rm -rf src/
cp -r native-audio-function-call-sandbox/* .
mv App.mastery.tsx src/App.tsx
mv App.mastery.css src/App.css

# Update package.json if needed
# Commit and deploy
git add .
git commit -m "feat: migrate to function calling architecture"
git push
```

### 6. Update CI/CD

If you have automated tests, update them:

```typescript
// Before: Testing turn coordinator
expect(turnCoordinator.isCurrentTurn(turnId)).toBe(true);

// After: Testing function call handler
expect(mockClient.on).toHaveBeenCalledWith('toolcall', expect.any(Function));
```

## Code Changes Required

### If You Customized the Main App

#### Custom Card Data:
```bash
# Your cards are already in sandbox
# File: lib/mvp-cards-data.ts
# Just add/edit cards there
```

#### Custom Prompts:
```typescript
// Before: src/lib/prompts/simple-pi-prompt.ts
export function getPiPrompt(studentName, card) { ... }

// After: lib/tools/mastery-cards.ts
export const MASTERY_SYSTEM_PROMPT = (studentName) => `...`;
```

#### Custom Evaluation Logic:
```typescript
// Before: src/lib/evaluator/claude-judge.ts
// After: lib/evaluator/claude-judge.ts
// Already copied! Just edit if needed.
```

#### Custom Components:
```bash
# Already copied to sandbox
# components/YourComponent.tsx
# Just verify imports work
```

## Rollback Plan

If you need to rollback:

### If using Git branches:
```bash
git checkout backup/main-app-YYYYMMDD
git push --force
```

### If using deployment platforms:
Most platforms (Vercel, Netlify) keep previous deployments:
- Go to dashboard → Deployments
- Find previous working version
- Click "Promote to Production"

### If using environment variables:
Just switch the feature flag:
```bash
# In deployment platform
VITE_USE_SANDBOX_APP=false
```

Then in code:
```typescript
const App = import.meta.env.VITE_USE_SANDBOX_APP === 'true'
  ? import('./App.mastery')
  : import('./App');
```

## Monitoring & Validation

### Metrics to Track

1. **Completion Rate**
   ```typescript
   // Before migration: X% of students complete sessions
   // After migration: Should be >= X%
   ```

2. **Error Rate**
   ```typescript
   // Monitor browser console errors
   // Track Sentry/LogRocket if you use it
   ```

3. **Function Call Success**
   ```typescript
   // New metric - track how often functions execute
   analytics.track('function_call', {
     function_name: 'request_evaluation',
     success: true,
   });
   ```

4. **Audio Quality**
   ```typescript
   // Survey students: "How clear was Pi's voice?"
   // Before: Average 3.5/5
   // After: Should be >= 4/5 (worklets improve quality)
   ```

### Alerts to Set Up

```typescript
// Alert if function calls fail repeatedly
if (functionCallFailures > 5 in 5 minutes) {
  alert('Function calling broken - rollback?');
}

// Alert if Claude evaluation fails
if (evaluationErrors > 10 in 10 minutes) {
  alert('Claude API issue - check keys');
}

// Alert if mic permission denied rate spikes
if (micDeniedRate > 20%) {
  alert('Mic permission issue - investigate');
}
```

## Troubleshooting Common Issues

### Issue: Build Fails
```bash
# Check Node version
node --version  # Should be 18+

# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Issue: Function Calls Not Working
```typescript
// Check tools are configured
import { useTools } from './lib/state';
console.log(useTools.getState().tools);
// Should show mastery-cards tools
```

### Issue: Claude Evaluation Slow
```typescript
// Add timeout
const evaluation = await evaluateMastery(
  card,
  history,
  count,
  CLAUDE_KEY,
  { signal: controller.signal } // Already added!
);
```

### Issue: Audio Cutting Out
```typescript
// Check sample rate matches
// Gemini uses 24kHz by default
audioContext = new AudioContext({ sampleRate: 24000 });
```

## FAQ

### Q: Will students lose progress during migration?
**A:** No, if you keep the same localStorage keys. Session state is stored in `zustand` with default persistence.

### Q: Can I A/B test both versions?
**A:** Yes! Deploy sandbox to subdomain and route 50/50:
```typescript
if (Math.random() < 0.5) {
  window.location.href = 'https://mastery-v2.yourdomain.com';
}
```

### Q: What if Claude API has an outage?
**A:** Function calling fails gracefully:
```typescript
try {
  await evaluateMastery(...);
} catch (error) {
  console.error('Evaluation failed:', error);
  // Gemini continues conversation normally
  // Just no points/level-up
}
```

### Q: Can I migrate gradually (feature flags)?
**A:** Yes! Use environment variables:
```typescript
const USE_FUNCTION_CALLING = import.meta.env.VITE_USE_FUNCTION_CALLING === 'true';

if (USE_FUNCTION_CALLING) {
  // Use sandbox app
} else {
  // Use main app
}
```

## Timeline Recommendations

### Week 1: Testing
- Deploy to staging
- Internal team testing
- Fix any issues

### Week 2: Beta
- Invite 10-20 students to test
- Collect feedback
- Monitor metrics

### Week 3: Gradual Rollout
- 25% of traffic → sandbox app
- Monitor for 2 days
- If stable → 50%
- Monitor for 2 days
- If stable → 100%

### Week 4: Cleanup
- Decommission main app
- Archive old code
- Update documentation

## Support

### If You Get Stuck:

1. **Check documentation**:
   - [MASTERY-CARDS-README.md](./native-audio-function-call-sandbox/MASTERY-CARDS-README.md)
   - [IMPLEMENTATION-SUMMARY.md](./native-audio-function-call-sandbox/IMPLEMENTATION-SUMMARY.md)

2. **Check console**:
   ```javascript
   // Enable debug logging
   localStorage.setItem('DEBUG', '*');
   ```

3. **Compare with main app**:
   ```bash
   diff -r src/ native-audio-function-call-sandbox/
   ```

4. **Test function calling**:
   ```typescript
   // In browser console
   window.testFunctionCall = (name, args) => {
     client.simulateToolCall({ functionCalls: [{ id: '1', name, args }] });
   };
   ```

## Success Criteria

Migration is successful when:
- [ ] All students can complete sessions
- [ ] No stale decision bugs reported
- [ ] Audio quality is better or equal
- [ ] Function calls execute correctly
- [ ] Points/levels work as expected
- [ ] Performance is same or better
- [ ] No increase in error rates

---

**Ready to migrate?** Start with step 1 and test thoroughly at each stage!

Questions? Check the docs or open an issue.
