# Image & Canvas Text Descriptions

## Overview

Added comprehensive text descriptions for lesson images and canvas context to support:
- **Accessibility** (screen readers, alt text)
- **Vision Agent** context (Phase 3F implementation)
- **Better agent understanding** of visual content

---

## Changes Made

### 1. **Enhanced Type System** (`packages/shared/src/types.ts`)

#### **LessonAsset with Description**
```typescript
export interface LessonAsset {
  type: 'image' | 'video' | 'audio' | 'interactive';
  url: string;
  alt?: string; // Short alt text for screen readers
  description?: string; // Full text description for agent/vision
  metadata?: Record<string, any>;
}
```

#### **Canvas Description**
```typescript
export interface CanvasDescription {
  currentContext: string; // What student should be drawing
  expectedElements?: string[]; // What we expect to see
  visualGuidance?: string; // Hints about what to draw
}
```

#### **LessonData with Canvas**
```typescript
export interface LessonData {
  // ... existing fields
  canvasInstructions?: CanvasDescription; // Canvas drawing context
}
```

---

### 2. **Canvas Context Formatter** (`packages/agents/src/prompts/canvas-context-formatter.ts`)

Three new functions for formatting visual context:

#### **formatCanvasContext()**
Describes what student should be drawing:
```typescript
formatCanvasContext(
  lessonContext: CanvasDescription,
  currentState?: CanvasState
): string
```

**Returns JSON:**
```json
{
  "type": "CANVAS_CONTEXT",
  "action": "UPDATE_CANVAS_STATE",
  "canvas": {
    "instructions": "Draw shapes divided into equal parts",
    "expectedElements": ["Rectangle divided into parts", "Equal sizes"],
    "visualGuidance": "Use straight lines",
    "currentState": "Student drew a rectangle with 4 parts",
    "recentAction": "Added division lines",
    "analysis": "Correct equal partitioning"
  },
  "instructions": "Guide the student based on their drawing..."
}
```

#### **formatImageDescription()**
When showing an image to student:
```typescript
formatImageDescription(
  imageId: string,
  description: string,
  usage: string
): string
```

**Returns JSON:**
```json
{
  "type": "IMAGE_SHOWN",
  "image": {
    "id": "chocolate-bar-half",
    "description": "A chocolate bar divided exactly in half...",
    "usage": "milestone-1"
  },
  "instructions": "Reference this visual in your teaching..."
}
```

#### **formatVisionFeedback()**
For Vision Agent analysis (Phase 3F):
```typescript
formatVisionFeedback(analysis: {
  description: string;
  interpretation: string;
  hasCorrectElements: boolean;
  issues?: string[];
  confidence: number;
}): string
```

---

### 3. **Updated Lesson with Descriptions** (`lesson-1-chocolate-bar.json`)

#### **Before:**
```json
{
  "id": "chocolate-bar-half",
  "type": "image",
  "url": "/assets/fractions/chocolate-half.png",
  "usage": "milestone-1"
}
```

#### **After:**
```json
{
  "id": "chocolate-bar-half",
  "type": "image",
  "url": "/assets/fractions/chocolate-half.png",
  "description": "A rectangular chocolate bar divided exactly in half down the middle. Each half contains 4 square sections (2 rows of 2). Both halves are exactly the same size and shape.",
  "altText": "Chocolate bar divided into two equal halves",
  "usage": "milestone-1"
}
```

#### **All Images Added:**
1. **chocolate-bar-whole** - Whole 8-section bar
2. **chocolate-bar-half** - Divided in half (equal)
3. **chocolate-bar-thirds** - Divided in thirds (equal)
4. **chocolate-bar-fourths** - Divided in fourths (equal)
5. **chocolate-bar-unequal** - Divided unequally (incorrect example)
6. **pizza-two-thirds** - Pizza showing 2/3
7. **rectangle-three-fourths** - Rectangle showing 3/4
8. **fraction-notation-diagram** - Numerator/denominator explained

#### **Canvas Instructions:**
```json
"canvasInstructions": {
  "currentContext": "Draw shapes divided into equal parts to show fractions. Start with simple shapes like rectangles and circles.",
  "expectedElements": [
    "A shape (rectangle, circle, or bar) divided into equal parts",
    "Parts should be the same size",
    "Clear division lines between parts",
    "Optional: shading or coloring to show specific fractions"
  ],
  "visualGuidance": "Use straight lines to divide rectangles. Make sure all pieces are the same size. You can shade parts to show fractions like 1/2, 2/3, or 3/4."
}
```

---

## Usage Examples

### **Example 1: Showing an Image**

```typescript
import { formatImageDescription } from '@simili/agents';

// When showing a lesson image
const lesson = LessonLoader.getLesson('fractions-3-nf-a-1');
const asset = lesson.assets?.find(a => a.id === 'chocolate-bar-half');

if (asset && connected) {
  const imageContext = formatImageDescription(
    asset.id,
    asset.description || '',
    asset.usage || ''
  );
  
  client.sendTextMessage(imageContext);
  
  // Now agent knows what image student is looking at
}
```

### **Example 2: Canvas Setup**

```typescript
import { formatCanvasContext } from '@simili/agents';

// When lesson loads with canvas
const lesson = LessonLoader.getLesson('fractions-3-nf-a-1');

if (lesson.canvasInstructions && connected) {
  const canvasContext = formatCanvasContext(lesson.canvasInstructions);
  client.sendTextMessage(canvasContext);
  
  // Agent knows what student should draw
}
```

### **Example 3: Canvas State Update**

```typescript
import { formatCanvasContext, CanvasState } from '@simili/agents';

// When student draws something
const canvasState: CanvasState = {
  description: 'Student drew a rectangle divided into 4 equal parts',
  studentAction: 'Drew vertical and horizontal lines',
  analysis: 'Correct equal partitioning!'
};

const update = formatCanvasContext(
  lesson.canvasInstructions!,
  canvasState
);

client.sendTextMessage(update);
// Agent responds to student's drawing
```

### **Example 4: Vision Agent Feedback** (Phase 3F)

```typescript
import { formatVisionFeedback } from '@simili/agents';

// After vision analysis
const visionAnalysis = {
  description: 'Rectangle divided into 4 sections with vertical lines',
  interpretation: 'Student attempted to show fourths but parts are unequal',
  hasCorrectElements: false,
  issues: ['Parts not equal size', 'Left section larger than others'],
  confidence: 0.85
};

const feedback = formatVisionFeedback(visionAnalysis);
client.sendTextMessage(feedback);
// Agent guides student to fix unequal parts
```

---

## Benefits

### **Accessibility** ♿
- Screen readers can describe images
- Alt text for all visual content
- Support for visually impaired students

### **Vision Agent** (Phase 3F) 👁️
- Agent understands visual context
- Can reference specific parts of images
- Provides context for student drawings

### **Better Teaching** 🎓
- Agent can ask "What do you see in the image?"
- Reference visual elements in teaching
- Guide canvas drawing more effectively

### **Debugging** 🔍
- Clear descriptions help debug issues
- Know what visual student sees
- Track canvas state changes

---

## Integration Points

### **Current (Phase 3E):**
- ✅ Image descriptions in lesson JSON
- ✅ Canvas context formatters ready
- ✅ Type system updated
- ✅ Can send image/canvas context to agent

### **Future (Phase 3F - Vision Agent):**
- 📋 Capture canvas snapshots every 15s
- 📋 Send to Vision Agent for analysis
- 📋 Compare with expected elements
- 📋 Detect visual misconceptions
- 📋 Use `formatVisionFeedback()` for results

---

## Monorepo Structure (per PRD)

```
packages/
├── shared/               ✅ Updated types
│   └── src/types.ts     → Added CanvasDescription, updated LessonAsset
│
├── agents/              ✅ New formatters
│   ├── src/prompts/
│   │   └── canvas-context-formatter.ts  → NEW
│   └── src/index.ts     → Exports added
│
└── lessons/             ✅ Enhanced data
    └── src/definitions/fractions/
        └── lesson-1-chocolate-bar.json  → Added descriptions
```

**Follows PRD principles:**
- ✅ Modular: Canvas context separate from agent logic
- ✅ Event-driven: Canvas updates via JSON messages
- ✅ Observable: All canvas states described
- ✅ Evaluation-ready: Can analyze visual understanding

---

## Next Steps

### **Immediate:**
1. Add descriptions to remaining lesson assets
2. Use `formatImageDescription()` when showing images
3. Use `formatCanvasContext()` if implementing canvas

### **Phase 3F (Vision Agent):**
1. Set up canvas snapshot capture (every 15s)
2. Create VisionAgent subagent
3. Integrate with `formatVisionFeedback()`
4. Detect visual misconceptions

### **Phase 4 (Production):**
1. Ensure all images have alt text
2. WCAG 2.1 AA compliance
3. Test with screen readers
4. Optimize image loading

---

## Testing

### **Test Image Descriptions:**
```typescript
// Check all assets have descriptions
const lesson = LessonLoader.getLesson('fractions-3-nf-a-1');
lesson.assets?.forEach(asset => {
  console.assert(asset.description, `Missing description: ${asset.id}`);
  console.assert(asset.alt, `Missing alt text: ${asset.id}`);
});
```

### **Test Canvas Context:**
```typescript
// Verify canvas instructions exist
console.assert(lesson.canvasInstructions, 'No canvas instructions');
console.assert(lesson.canvasInstructions.currentContext, 'No context');
console.assert(lesson.canvasInstructions.expectedElements?.length > 0, 'No expected elements');
```

---

## Example Output

### **Agent receives this when image shown:**
```json
{
  "type": "IMAGE_SHOWN",
  "image": {
    "id": "chocolate-bar-thirds",
    "description": "A rectangular chocolate bar divided into three equal vertical sections. Each third contains approximately 2-3 squares. All three sections are the same size.",
    "usage": "milestone-1"
  },
  "instructions": "An image has been shown to the student: \"A rectangular chocolate bar divided into three equal vertical sections...\". Reference this visual in your teaching. Ask questions about what they see."
}
```

**Agent can now say:**
> "Look at the chocolate bar on your screen. How many equal pieces do you see? Can you count them?"

---

**This enhancement makes the system ready for visual understanding and accessibility!** 🎨👁️♿
