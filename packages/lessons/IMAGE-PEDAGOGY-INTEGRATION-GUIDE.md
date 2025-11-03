# Image-Pedagogy Integration Guide

## Overview

This guide explains how to use the **Image-Pedagogy Mapping System** to create visually-driven formative assessments for your lessons.

## Three Core Components

### 1. **Image Prompts** (Detailed SVG/Visual Specifications)
Located in: `packages/lessons/src/definitions/[subject]/image-pedagogy-mapping.json`

Each image has a highly detailed prompt for artists/designers to create the visual asset.

**Example:**
```json
{
  "id": "prereq-unequal-pieces-obvious",
  "imagePrompt": "Create an SVG illustration showing two cookie pieces side-by-side on a plain white background. The left cookie piece should be approximately 3 times larger than the right cookie piece, making the size difference VERY obvious and unmistakable. Both pieces should have a warm brown color (#D2691E) with chocolate chip spots (small dark brown circles)..."
}
```

### 2. **Mastery Goals** (Progressive Learning Objectives)
Each image maps to specific mastery goals from the lesson's mastery goal progression.

**Example:**
```json
{
  "masteryGoals": ["mg-2-recognize-equal-requirement"],
  "masteryGoalDescriptions": [
    "Recognize that fractions require equal parts - this image assesses whether student can identify unequal parts"
  ]
}
```

### 3. **Misconceptions** (Detection Criteria & Keywords)
Each image can reveal specific misconceptions based on what the student draws and says.

**Example:**
```json
{
  "misconceptionsToDetect": [
    {
      "id": "unequal-parts-as-fractions",
      "description": "Thinking any division creates fractions, even if parts are unequal",
      "detectionCriteria": [
        "Student says 'these are halves' when pieces are clearly unequal",
        "Student doesn't notice size difference"
      ],
      "evidenceKeywords": ["half", "equal", "same", "two pieces"],
      "confidenceThreshold": 0.7
    }
  ]
}
```

## How It Works: Full Flow

### Step 1: Load Image-Pedagogy Mapping

```typescript
import { VisionService } from '@/services/VisionService';

const visionService = new VisionService(apiKey);

// Load the mapping when lesson starts
await visionService.loadImagePedagogyMapping(lesson.id);
```

### Step 2: Display Image & Ask Assessment Question

```typescript
// Get pedagogy data for current image
const imageData = visionService.getImagePedagogyData('prereq-unequal-pieces-obvious');

if (imageData) {
  // Show the image to student
  displayImage(imageData.id);
  
  // Ask the assessment question
  askQuestion(imageData.assessmentQuestion);
  // "Look at these two cookie pieces. Are they the same size? Could we call them halves?"
}
```

### Step 3: Student Responds (Visual + Verbal)

Student:
1. **Draws** on canvas (e.g., circles around pieces, lines showing comparison)
2. **Speaks** their answer (e.g., "No, they're different sizes")

### Step 4: Analyze Response with Vision Service

```typescript
// Get canvas snapshot
const canvasSnapshot = await getCanvasSnapshot();

// Get student's verbal response
const studentTranscription = "No, they're different sizes. That one is bigger.";

// Analyze with vision service
const visionAnalysis = await visionService.analyzeCanvas({
  canvasSnapshot,
  lessonImageUrl: imageData.id,
  currentMilestone: currentMilestone.id,
  question: imageData.assessmentQuestion,
  imagePedagogyData: imageData, // NEW: Include pedagogy context
  studentTranscription, // NEW: Include what student said
});
```

### Step 5: Evaluate Correctness

```typescript
// Check if student's response matches expected indicators
const evaluation = visionService.evaluateResponse(
  imageData,
  studentTranscription,
  visionAnalysis
);

console.log(evaluation);
// {
//   isCorrect: true,
//   matchedIndicators: ["different sizes", "bigger"],
//   confidence: 0.85
// }
```

### Step 6: Detect Misconceptions

```typescript
// Check for misconceptions in student's work
const detectedMisconceptions = visionService.detectMisconceptions(
  imageData,
  studentTranscription,
  visionAnalysis
);

if (detectedMisconceptions.length > 0) {
  detectedMisconceptions.forEach(({ misconception, confidence }) => {
    console.log(`Misconception: ${misconception.id}`);
    console.log(`Confidence: ${confidence}`);
    console.log(`Description: ${misconception.description}`);
    
    // Log to teacher panel
    logMisconception(misconception);
  });
}
```

### Step 7: Provide Adaptive Scaffolding

```typescript
// Get appropriate scaffolding based on student's performance
const scaffolding = visionService.getScaffolding(
  imageData,
  attempts, // Number of attempts on this image
  frustrationLevel // Current frustration level (0-1)
);

// If student is struggling (high frustration or many attempts)
// → scaffolding.low: "Look closely - is this cookie piece bigger than this one? Put your hands apart to show me the size of each piece."

// If student is doing okay
// → scaffolding.medium: "If we gave these two pieces to two friends, would that be fair? Why or why not?"

// If student is confident
// → scaffolding.high: "Could we call these 'halves'? What would need to be true for them to be halves?"

provideFeedback(scaffolding);
```

## Complete Example: Integrating into AgentService

```typescript
// In AgentService.ts or similar

export class AgentService {
  private visionService: VisionService;
  private currentImageData?: ImagePedagogyData;
  
  async onLessonStart(lesson: LessonData) {
    // Load image pedagogy mapping
    await this.visionService.loadImagePedagogyMapping(lesson.id);
  }
  
  async onMilestoneChange(milestone: Milestone) {
    // Get the image for this milestone
    const imageId = this.getImageIdForMilestone(milestone.id);
    this.currentImageData = this.visionService.getImagePedagogyData(imageId);
    
    if (this.currentImageData) {
      // Display image and ask assessment question
      this.displayImage(this.currentImageData.id);
      this.askQuestion(this.currentImageData.assessmentQuestion);
    }
  }
  
  async onStudentResponse(transcription: string, isFinal: boolean) {
    if (!isFinal || !this.currentImageData) return;
    
    // Get canvas snapshot
    const canvasSnapshot = await this.getCanvasSnapshot();
    
    // Analyze with vision service (including pedagogy context)
    const visionAnalysis = await this.visionService.analyzeCanvas({
      canvasSnapshot,
      currentMilestone: this.currentMilestone?.id,
      imagePedagogyData: this.currentImageData,
      studentTranscription: transcription,
    });
    
    // Evaluate response
    const evaluation = this.visionService.evaluateResponse(
      this.currentImageData,
      transcription,
      visionAnalysis
    );
    
    // Detect misconceptions
    const misconceptions = this.visionService.detectMisconceptions(
      this.currentImageData,
      transcription,
      visionAnalysis
    );
    
    // Log to teacher panel
    misconceptions.forEach(({ misconception, confidence }) => {
      this.teacherPanelStore.addMisconception({
        type: misconception.id,
        description: misconception.description,
        evidence: transcription,
        confidence,
        detected: true,
        resolved: false,
      });
    });
    
    // Provide adaptive scaffolding if needed
    if (!evaluation.isCorrect || misconceptions.length > 0) {
      const scaffolding = this.visionService.getScaffolding(
        this.currentImageData,
        this.attempts,
        this.emotionalState.frustrationLevel
      );
      
      // Inject scaffolding into context
      this.updateSessionContext({
        scaffoldingHint: scaffolding,
      });
    }
    
    // If correct and no misconceptions, advance milestone
    if (evaluation.isCorrect && misconceptions.length === 0) {
      this.pedagogyEngine.completeMilestone();
    }
  }
}
```

## Adaptive Pathways

The system supports three adaptive pathways based on student performance:

### Struggling Learner
- Uses **low scaffolding** (most support)
- Shows more prerequisite images
- Provides concrete, hands-on guidance
- Example: "Look closely - is this cookie piece bigger than this one? Put your hands apart to show me the size of each piece."

### On-Track Learner
- Uses **medium scaffolding**
- Follows standard progression
- Provides guided questioning
- Example: "If we gave these two pieces to two friends, would that be fair? Why or why not?"

### Advanced Learner
- Uses **high scaffolding** (minimal support)
- Receives extension challenges
- Encouraged to explain reasoning independently
- Example: "Could we call these 'halves'? What would need to be true for them to be halves?"

## Assessment Types

Each image serves a specific assessment purpose:

1. **prerequisite-check** - Quick warmup to verify foundational skills
2. **formative-practice** - Hands-on practice with feedback
3. **checkpoint-assessment** - Critical verification of mastery
4. **critical-thinking** - Evaluate and critique examples
5. **scaffolding-hint** - Adaptive support for struggling students
6. **extension-challenge** - Advanced challenges for fast learners
7. **transfer-activity** - Apply skills to new contexts
8. **reflection-synthesis** - Teach back and demonstrate complete understanding

## Cognitive Levels (Bloom's Taxonomy)

Images progress through cognitive complexity:

1. **remember** - Recall facts, definitions
2. **understand** - Explain concepts, give examples
3. **apply** - Use skills in new situations
4. **analyze** - Break down, compare, examine
5. **evaluate** - Judge, critique, verify
6. **create** - Design, construct, synthesize

## Data Flow Diagram

```
┌─────────────────────┐
│  Lesson Designer    │
│  Creates:           │
│  - Image Prompts    │
│  - Mastery Goals    │
│  - Misconceptions   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────┐
│  image-pedagogy-mapping.json    │
│  (stored in lessons package)    │
└──────────┬──────────────────────┘
           │
           ▼
┌────────────────────────┐
│  VisionService         │
│  .loadMapping()        │
│  .getImagePedagogyData()│
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│  Student Interaction   │
│  - Views image         │
│  - Draws on canvas     │
│  - Speaks response     │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────────────┐
│  VisionService Analysis        │
│  .analyzeCanvas()              │
│  (sends to backend vision API) │
└──────────┬─────────────────────┘
           │
           ▼
┌────────────────────────────────┐
│  Response Evaluation           │
│  .evaluateResponse()           │
│  → isCorrect? matchedIndicators│
└──────────┬─────────────────────┘
           │
           ▼
┌────────────────────────────────┐
│  Misconception Detection       │
│  .detectMisconceptions()       │
│  → detected misconceptions     │
└──────────┬─────────────────────┘
           │
           ▼
┌────────────────────────────────┐
│  Adaptive Scaffolding          │
│  .getScaffolding()             │
│  → low/medium/high support     │
└──────────┬─────────────────────┘
           │
           ▼
┌────────────────────────────────┐
│  Teacher Panel Logging         │
│  - Misconceptions detected     │
│  - Mastery goals progress      │
│  - Student performance data    │
└────────────────────────────────┘
```

## Creating Your Own Image-Pedagogy Mapping

### Step 1: Define Your Mastery Goals
Create a `mastery-goals-[standard].json` file with progressive learning objectives.

### Step 2: Identify Misconceptions
List common misconceptions for each mastery goal in your lesson JSON.

### Step 3: Design Images
For each key concept, design an image that:
- Tests specific mastery goals
- Can reveal specific misconceptions
- Provides formative assessment data

### Step 4: Write Detailed Image Prompts
Write prompts so detailed that an artist/designer can create the image without asking questions.

Include:
- Exact dimensions and layout
- Color codes (hex values)
- Visual elements and their positions
- Text labels and fonts
- Purpose and teaching moment

### Step 5: Define Assessment Criteria
For each image, specify:
- Assessment question
- Correct response indicators (keywords/phrases)
- Incorrect response indicators
- Misconceptions to watch for
- Scaffolding at three levels

### Step 6: Test and Iterate
- Run the lesson with students
- Review vision analysis logs
- Refine keywords and thresholds
- Update scaffolding based on effectiveness

## Best Practices

1. **Be Specific in Image Prompts**: Include exact dimensions, colors, layout
2. **Use Progressive Difficulty**: Start with obvious examples, increase complexity
3. **Target One Concept Per Image**: Don't try to assess multiple skills in one image
4. **Include Both Correct and Incorrect Examples**: Help students discriminate
5. **Provide Rich Scaffolding**: Write scaffolding that truly helps at each level
6. **Test Keyword Matching**: Ensure evidence keywords actually appear in student responses
7. **Set Appropriate Thresholds**: Balance false positives vs false negatives
8. **Log Everything**: Use teacher panel to track what's working

## Troubleshooting

**Problem:** Misconceptions not being detected
- **Solution:** Check if evidence keywords match actual student language. Review logs to see what students are saying.

**Problem:** Too many false positives
- **Solution:** Increase confidence threshold or make keywords more specific.

**Problem:** Scaffolding not helpful
- **Solution:** Test with real students, iterate based on their responses.

**Problem:** Vision analysis returning low confidence
- **Solution:** Improve image quality, ensure canvas has clear content, check lighting/contrast.

## Future Enhancements

- **Automatic image generation** from prompts using AI image generation
- **Multi-modal misconception detection** using both vision and speech patterns
- **Adaptive image sequencing** based on real-time performance
- **Student-drawn image recognition** to evaluate their own created visuals
- **Collaborative image annotation** where AI and student co-label images

---

**Questions?** Contact the Simili Pedagogy Team or refer to example implementations in `packages/lessons/src/definitions/fractions/`.
