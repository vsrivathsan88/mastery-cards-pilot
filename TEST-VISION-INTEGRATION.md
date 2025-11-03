# Vision Integration Test Plan

## ✅ What's Wired Up:

### Backend (API Server):
1. ✅ `/api/vision/analyze` endpoint created
2. ✅ Gemini Vision API integration with detailed prompting
3. ✅ Returns canvas description + stroke analysis + lesson image caption
4. ✅ Registered in Express routes

### Frontend (Tutor App):
1. ✅ `VisionService` calls backend API
2. ✅ `AgentService.analyzeVision()` uses VisionService
3. ✅ Vision context updates in `ContextManager`
4. ✅ `PromptBuilder` includes vision in system prompt
5. ✅ `useAgentContext` hook exposes `analyzeVision` function
6. ✅ `StreamingConsole` has trigger for vision analysis

## 🔍 Test Flow:

### 1. **Start the system**
```bash
# Terminal 1: Start backend
cd apps/api-server
npm run dev

# Terminal 2: Start frontend
cd apps/tutor-app
npm run dev
```

### 2. **Test vision analysis manually**

In browser console:
```javascript
// Get the agent context
const { analyzeVision } = window.__useAgentContext();

// Trigger vision analysis (assuming LessonCanvas has captured an image)
const canvas = document.querySelector('canvas');
const imageData = canvas.toDataURL('image/png');

analyzeVision(imageData, 'https://example.com/lesson-image.png');
```

### 3. **Expected Result**

Check console logs:
```
[VisionService] 👁️ Starting canvas analysis
[Vision API] 👁️ Starting analysis  
[Vision API] 🤖 Raw Gemini response: {...}
[Vision API] ✅ Analysis complete
[VisionService] 👁️ Canvas analysis complete
[AgentService] ✅ Vision analysis complete
[PromptBuilder] 🏗️ Built system prompt (with vision context)
```

### 4. **Verify Data Flow**

```javascript
// In console, check the context
const { currentContext } = window.__useAgentContext();
console.log('Vision Context:', currentContext.vision);

// Should show:
{
  timestamp: 1699...,
  description: "Student drew a circle divided into two equal parts\n\nLesson Image: Cookie divided into halves\n\nCanvas Strokes: One large circle with vertical line...",
  interpretation: "Student correctly visualizes 1/2...",
  suggestion: "Ask them to shade one half...",
  confidence: 0.85,
  needsVoiceOver: true
}
```

### 5. **Test in Live Session**

1. Start a lesson
2. Draw something on canvas
3. Say "look at my drawing" or "check this out"
4. Teacher panel should show vision analysis
5. Tutor should reference the drawing in next response

## 🐛 Known Issues to Fix:

- [ ] Need to expose `useAgentContext` to window for testing
- [ ] LessonCanvas needs to pass lesson image URL to vision analysis
- [ ] System prompt updates need to trigger mid-conversation (next task)

## 📊 Success Criteria:

✅ Vision API returns detailed canvas + image analysis
✅ Vision context appears in system prompt
✅ Tutor can reference student drawings naturally
✅ Teacher panel displays vision insights
