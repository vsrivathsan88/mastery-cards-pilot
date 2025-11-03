# Canvas Drawing Integration - Complete Example

This document shows how to integrate the canvas drawing prompts system into your agent service.

## Complete Integration Flow

```typescript
import { VisionService } from '@/services/VisionService';
import { CanvasPromptService } from '@/services/CanvasPromptService';
import { PromptBuilder } from '@/services/PromptBuilder';
import { PedagogyEngine } from '@simili/agents';
import type { SessionContext } from '@simili/agents';
import type { ImagePedagogyData } from '@simili/shared';

export class EnhancedAgentService {
  private visionService: VisionService;
  private canvasPromptService: CanvasPromptService;
  private pedagogyEngine: PedagogyEngine;
  
  constructor() {
    this.visionService = new VisionService(apiKey);
    this.canvasPromptService = new CanvasPromptService();
    this.pedagogyEngine = new PedagogyEngine();
  }

  /**
   * STEP 1: Initialize lesson with image pedagogy mapping
   */
  async onLessonStart(lesson: LessonData) {
    // Load image pedagogy mapping
    await this.visionService.loadImagePedagogyMapping(lesson.id);
    
    // Start pedagogy engine
    this.pedagogyEngine.loadLesson(lesson);
    
    console.log('✅ Lesson started with image pedagogy support');
  }

  /**
   * STEP 2: When showing a new image/milestone
   */
  async onImageShown(imageId: string, milestoneId: string) {
    // Get pedagogy data for this image
    const imageData = this.visionService.getImagePedagogyData(imageId);
    
    if (!imageData) {
      console.warn('No pedagogy data for image:', imageId);
      return;
    }

    // Configure canvas prompt service
    this.canvasPromptService.setImageData(imageData);
    
    // Display the image to student
    this.displayImage(imageId);
    
    // Check if we should immediately prompt drawing
    if (this.canvasPromptService.shouldPromptDrawing()) {
      await this.promptStudentToDraw();
    }
  }

  /**
   * STEP 3: Prompt student to draw (agent speaks this)
   */
  async promptStudentToDraw() {
    // Get the appropriate prompt
    const drawingPrompt = this.canvasPromptService.getDrawingPrompt();
    
    if (!drawingPrompt) {
      return;
    }

    console.log('🎨 Agent prompting student to draw:', drawingPrompt);
    
    // Inject this into the agent's next response
    // Method depends on your agent architecture:
    
    // Option A: Add to session context
    this.updateSessionContext({
      agentInstruction: drawingPrompt,
    });
    
    // Option B: Send as hidden message to agent
    await this.sendAgentInstruction(drawingPrompt);
    
    // Option C: Speak it directly via TTS
    await this.speakToStudent(drawingPrompt);
  }

  /**
   * STEP 4: Monitor canvas activity
   */
  onCanvasChange(strokeCount: number) {
    // Update canvas activity state
    this.canvasPromptService.onDrawingStarted(strokeCount);
    
    // Check if student needs encouragement or guidance
    if (strokeCount === 0 && Date.now() - lastPromptTime > 15000) {
      // 15 seconds passed, no drawing yet - encourage
      this.promptStudentToDraw(); // Will get 'encouragement' level
    }
    
    if (strokeCount > 0 && strokeCount < 5) {
      // Minimal drawing - may need guidance
      setTimeout(() => {
        if (this.canvasPromptService.getStrokeCount() < 5) {
          this.promptStudentToDraw(); // Will get 'guidance' level
        }
      }, 10000); // Wait 10s before guidance
    }
  }

  /**
   * STEP 5: Build agent context with canvas guidance
   */
  buildAgentContext(): SessionContext {
    const baseContext: SessionContext = {
      lesson: this.getCurrentLesson(),
      emotional: this.getEmotionalState(),
      misconceptions: this.getMisconceptions(),
      vision: this.getVisionContext(),
    };

    // Add canvas guidance context
    const canvasGuidance = this.canvasPromptService.buildCanvasGuidanceContext();
    
    if (canvasGuidance) {
      (baseContext as any).canvasGuidance = canvasGuidance;
    }

    return baseContext;
  }

  /**
   * STEP 6: When student speaks/responds
   */
  async onStudentTranscription(transcription: string, isFinal: boolean) {
    if (!isFinal) return;

    const currentImageData = this.getCurrentImageData();
    if (!currentImageData) return;

    // Capture canvas snapshot
    const canvasSnapshot = await this.getCanvasSnapshot();

    // Analyze canvas + transcription together
    const visionAnalysis = await this.visionService.analyzeCanvas({
      canvasSnapshot,
      currentMilestone: this.getCurrentMilestone()?.id,
      imagePedagogyData: currentImageData,
      studentTranscription: transcription,
    });

    // Check drawing progress
    const drawingProgress = this.canvasPromptService.checkDrawingProgress(
      visionAnalysis.description
    );

    console.log('Drawing progress:', drawingProgress);

    // If student drew expected elements, check for mastery
    if (drawingProgress.hasExpectedElements) {
      const mastery = this.canvasPromptService.evaluateDrawingMastery(
        visionAnalysis.description
      );

      console.log('Drawing mastery:', mastery);

      // Evaluate response against image expectations
      const responseEval = this.visionService.evaluateResponse(
        currentImageData,
        transcription,
        visionAnalysis
      );

      console.log('Response evaluation:', responseEval);

      // Detect misconceptions
      const misconceptions = this.visionService.detectMisconceptions(
        currentImageData,
        transcription,
        visionAnalysis
      );

      // Log misconceptions to teacher panel
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

      // If correct response + good drawing + no misconceptions = milestone complete!
      if (
        responseEval.isCorrect &&
        mastery.showsMastery &&
        misconceptions.length === 0
      ) {
        console.log('✅ Milestone complete!');
        this.pedagogyEngine.completeMilestone();
      } else {
        // Provide scaffolding
        this.provideScaffolding(
          currentImageData,
          responseEval,
          drawingProgress,
          misconceptions
        );
      }
    } else if (drawingProgress.possibleErrors.length > 0) {
      // Student made errors in drawing - provide guidance
      console.log('❌ Drawing errors detected:', drawingProgress.possibleErrors);
      this.promptStudentToDraw(); // Will get guidance-level prompt
    } else {
      // No expected elements yet - encourage drawing
      console.log('⏳ Waiting for student to draw...');
      if (this.canvasPromptService.shouldPromptDrawing()) {
        this.promptStudentToDraw();
      }
    }
  }

  /**
   * STEP 7: Provide adaptive scaffolding
   */
  provideScaffolding(
    imageData: ImagePedagogyData,
    responseEval: any,
    drawingProgress: any,
    misconceptions: any[]
  ) {
    // Get scaffolding based on attempts and frustration
    const scaffolding = this.visionService.getScaffolding(
      imageData,
      this.getCurrentAttempts(),
      this.getEmotionalState().frustrationLevel
    );

    console.log('📚 Providing scaffolding:', scaffolding);

    // Inject into agent context
    this.updateSessionContext({
      scaffoldingHint: scaffolding,
      drawingFeedback: {
        hasExpectedElements: drawingProgress.hasExpectedElements,
        matchedElements: drawingProgress.matchedElements,
        possibleErrors: drawingProgress.possibleErrors,
      },
      misconceptionsDetected: misconceptions.map(m => ({
        type: m.misconception.id,
        description: m.misconception.description,
      })),
    });

    // Agent will use this in next response
  }

  /**
   * STEP 8: Update agent's system prompt with canvas context
   */
  getSystemPrompt(): string {
    const sessionContext = this.buildAgentContext();
    
    // PromptBuilder now includes canvas guidance automatically
    const systemPrompt = PromptBuilder.buildSystemPrompt(sessionContext);
    
    return systemPrompt;
  }
}
```

## Example Conversation Flow

### Initial State
- **System:** Lesson starts, loads image pedagogy mapping
- **System:** Shows blank circle template (imageId: "act2a-circle-template")
- **CanvasPromptService:** Sets image data, detects "whenToPromptDrawing: immediately"

### Turn 1: Agent prompts drawing
**Agent:** "Here's a blank circle on your canvas! Your job is to divide it into equal parts. Let's start with halves - can you draw a line to split this circle into 2 equal pieces?"

*(This is the `initial` prompt from agentDrawingPrompts)*

### Turn 2: Student hasn't drawn yet (15 seconds pass)
**CanvasPromptService:** Detects no strokes, switches to `encouragement` level
**Agent:** "Go ahead and draw on the circle! Use your pen or drawing tool to make a line that divides it in half. Take your time!"

### Turn 3: Student draws a line (but not through center)
**Student draws:** A line that doesn't go through center *(detected by vision analysis)*
**CanvasPromptService:** Detects drawing, but checkDrawingProgress finds possible errors
**Agent:** "Good try! Remember, to make equal parts in a circle, your line should go through the center point. See that little dot in the middle? Try drawing your line through that."

*(This is the `guidance` prompt)*

### Turn 4: Student redraws correctly
**Student draws:** Line through center, creating two equal halves
**Student says:** "I drew a line through the middle, so now it's two halves."

**VisionService analyzes:**
- Vision description: "straight line through center, two semicircles"
- Transcription: "I drew a line through the middle, so now it's two halves"

**CanvasPromptService evaluates:**
- Expected elements matched: ✅ "line through center", "two equal sections"
- Success indicators: ✅ "straight line through center", "student explains"
- Drawing mastery: 90% confidence

**VisionService evaluates response:**
- Correct indicators: ✅ "through center", "middle", "two halves"
- Is correct: ✅ Yes
- Confidence: 0.92

**System:** ✅ Milestone complete! Moves to next milestone.

**Agent:** "Nice work! Now tell me - did you make 2 equal parts? How do you know they're equal?"

*(This is the `completion` prompt, asking for metacognitive reflection)*

## Key Decision Points

### When to Prompt Drawing

| Condition | Action |
|-----------|--------|
| Image just shown + `whenToPromptDrawing: immediately` | Issue `initial` prompt right away |
| 15-30s passed, no canvas activity | Issue `encouragement` prompt |
| Student drawing but minimal strokes (<5) | After 10s, issue `guidance` prompt |
| Student has drawn significantly (>5 strokes) | Issue `completion` prompt to discuss work |

### When to Move Forward

**All must be true:**
1. ✅ Student response matches correct indicators (`evaluateResponse`)
2. ✅ Canvas drawing matches expected elements (`checkDrawingProgress`)
3. ✅ Drawing shows mastery indicators (`evaluateDrawingMastery`)
4. ✅ No misconceptions detected (`detectMisconceptions`)

### When to Scaffold

**Any of these:**
- ❌ Incorrect response indicators detected
- ❌ Drawing has common errors
- ❌ Misconceptions detected
- ⚠️ High frustration level (>0.6)
- ⚠️ Many attempts (>3)

## System Prompt Example

With canvas guidance integrated, the agent's system prompt includes:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REAL-TIME STUDENT CONTEXT (Updated This Turn)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📚 Lesson Progress
...

## 🎭 Emotional State Analysis
...

## 👁️ What Student Drew on Canvas
...

## 🎨 Canvas Drawing Guidance

**Current Activity:** formative-practice: Draw lines to divide this circle into [2/3/4] equal parts. How will you make sure they're equal?

**What Student Should Draw:**
- A line dividing the circle
- Line passes through or near center point
- Two resulting sections of approximately equal size

**Your Role as Tutor:**
Here's a blank circle on your canvas! Your job is to divide it into equal parts. Let's start with halves - can you draw a line to split this circle into 2 equal pieces?

**Watch for Common Mistakes:**
- Line doesn't go through center (creates unequal parts)
- Line is curved or wavy instead of straight
- Multiple random lines without clear intention
- No line drawn at all

**Success Indicators:**
- Straight line through center
- Two visibly equal semicircles
- Student can explain why parts are equal
- Student references center point or symmetry

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

This ensures the agent:
1. **Knows** what the student should be drawing
2. **Prompts** the student appropriately
3. **Watches** for common mistakes
4. **Recognizes** success indicators
5. **Provides** targeted feedback

## Files Created/Modified

### New Files
1. ✅ `packages/lessons/src/definitions/fractions/image-pedagogy-mapping.json` - Complete mapping with drawing prompts
2. ✅ `apps/tutor-app/services/CanvasPromptService.ts` - Orchestration service
3. ✅ `CANVAS-DRAWING-INTEGRATION-EXAMPLE.md` - This integration guide

### Modified Files
1. ✅ `packages/shared/src/types.ts` - Added `AgentDrawingPrompts`, `DrawingExpectations` types
2. ✅ `apps/tutor-app/services/PromptBuilder.ts` - Added `formatCanvasGuidance()` method
3. ✅ `apps/tutor-app/services/VisionService.ts` - Added image pedagogy integration methods

## Next Steps

1. **Integrate CanvasPromptService** into your main AgentService/TutorService
2. **Wire canvas change events** to update stroke count and activity state
3. **Test with real students** to refine prompts and thresholds
4. **Add UI indicators** showing students when they should be drawing
5. **Log canvas activity** to teacher panel for monitoring

---

**Result:** The agent now actively guides students to use the canvas at pedagogically appropriate moments, monitors their visual work, and uses both visual + verbal evidence for formative assessment!
