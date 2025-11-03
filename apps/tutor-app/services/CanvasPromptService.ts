/**
 * CanvasPromptService - Orchestrates canvas drawing prompts for students
 * 
 * Works with VisionService and image pedagogy data to:
 * - Prompt students to draw at appropriate moments
 * - Provide progressive guidance based on their canvas activity
 * - Inject drawing expectations into agent context
 */

import type { ImagePedagogyData, AgentDrawingPrompts } from '@simili/shared';

const logger = {
  info: (msg: string, data?: any) => console.log(`[CanvasPromptService] 🎨 ${msg}`, data || ''),
  debug: (msg: string, data?: any) => console.debug(`[CanvasPromptService] 🔍 ${msg}`, data || ''),
};

export interface CanvasActivityState {
  hasDrawn: boolean;
  lastDrawTime: number;
  strokeCount: number;
  timeSincePrompt: number;
}

export interface CanvasGuidanceContext {
  activityDescription: string;
  agentPrompt: string;
  expectedElements: string[];
  commonErrors: string[];
  successIndicators: string[];
  promptLevel: 'initial' | 'encouragement' | 'guidance' | 'completion';
}

export class CanvasPromptService {
  private currentImageData?: ImagePedagogyData;
  private canvasActivity: CanvasActivityState = {
    hasDrawn: false,
    lastDrawTime: 0,
    strokeCount: 0,
    timeSincePrompt: 0,
  };
  private lastPromptLevel: 'initial' | 'encouragement' | 'guidance' | 'completion' = 'initial';
  private promptIssued: boolean = false;

  /**
   * Set the current image pedagogy data
   * Call this when showing a new image that requires canvas work
   */
  public setImageData(imageData: ImagePedagogyData): void {
    this.currentImageData = imageData;
    this.resetActivity();
    
    logger.info('Image data set', {
      imageId: imageData.id,
      hasDrawingPrompts: !!imageData.agentDrawingPrompts,
      whenToPrompt: imageData.whenToPromptDrawing,
    });
  }

  /**
   * Check if agent should prompt student to draw
   */
  public shouldPromptDrawing(): boolean {
    if (!this.currentImageData?.agentDrawingPrompts) {
      return false;
    }

    // Already prompted and student is actively drawing
    if (this.promptIssued && this.canvasActivity.hasDrawn) {
      return false;
    }

    // Parse when to prompt
    const when = this.currentImageData.whenToPromptDrawing || 'immediately';
    
    if (when.toLowerCase().includes('immediately')) {
      return !this.promptIssued;
    }

    if (when.toLowerCase().includes('before asking assessment question')) {
      return !this.promptIssued;
    }

    if (when.toLowerCase().includes('if student hasn\'t drawn')) {
      // Wait 30 seconds after showing image
      return !this.promptIssued && this.canvasActivity.timeSincePrompt > 30000;
    }

    return !this.promptIssued;
  }

  /**
   * Get the appropriate drawing prompt for current situation
   */
  public getDrawingPrompt(): string | null {
    if (!this.currentImageData?.agentDrawingPrompts) {
      return null;
    }

    const prompts = this.currentImageData.agentDrawingPrompts;

    // Determine which prompt level to use
    let level: keyof AgentDrawingPrompts = 'initial';

    if (this.canvasActivity.strokeCount === 0 && !this.promptIssued) {
      // Haven't drawn yet, first time
      level = 'initial';
    } else if (this.canvasActivity.strokeCount === 0 && this.promptIssued) {
      // Still haven't drawn after initial prompt
      level = 'encouragement';
    } else if (this.canvasActivity.strokeCount > 0 && this.canvasActivity.strokeCount < 5) {
      // Started drawing but minimal strokes - may need guidance
      level = 'guidance';
    } else if (this.canvasActivity.strokeCount >= 5) {
      // Significant drawing - ask about completion
      level = 'completion';
    }

    this.lastPromptLevel = level;
    this.promptIssued = true;

    logger.info('Issuing drawing prompt', {
      level,
      strokeCount: this.canvasActivity.strokeCount,
      hasDrawn: this.canvasActivity.hasDrawn,
    });

    return prompts[level];
  }

  /**
   * Build canvas guidance context for agent's system prompt
   */
  public buildCanvasGuidanceContext(): CanvasGuidanceContext | null {
    if (!this.currentImageData) {
      return null;
    }

    const prompts = this.currentImageData.agentDrawingPrompts;
    const expectations = this.currentImageData.drawingExpectations;

    if (!prompts || !expectations) {
      return null;
    }

    // Get current prompt
    const currentPrompt = this.getDrawingPrompt() || prompts.initial;

    return {
      activityDescription: `${this.currentImageData.assessmentType}: ${this.currentImageData.assessmentQuestion}`,
      agentPrompt: currentPrompt,
      expectedElements: expectations.expectedElements,
      commonErrors: expectations.commonErrors,
      successIndicators: expectations.successIndicators,
      promptLevel: this.lastPromptLevel,
    };
  }

  /**
   * Update canvas activity state
   * Call this when you detect canvas changes
   */
  public updateCanvasActivity(update: Partial<CanvasActivityState>): void {
    this.canvasActivity = {
      ...this.canvasActivity,
      ...update,
      lastDrawTime: Date.now(),
    };

    logger.debug('Canvas activity updated', this.canvasActivity);
  }

  /**
   * Notify that student has started drawing
   */
  public onDrawingStarted(strokeCount: number): void {
    this.updateCanvasActivity({
      hasDrawn: true,
      strokeCount,
    });
  }

  /**
   * Check if student's canvas work matches expectations
   */
  public checkDrawingProgress(visionDescription: string): {
    hasExpectedElements: boolean;
    matchedElements: string[];
    possibleErrors: string[];
  } {
    if (!this.currentImageData?.drawingExpectations) {
      return {
        hasExpectedElements: false,
        matchedElements: [],
        possibleErrors: [],
      };
    }

    const expectations = this.currentImageData.drawingExpectations;
    const lowerDescription = visionDescription.toLowerCase();

    // Check for expected elements
    const matchedElements = expectations.expectedElements.filter(elem =>
      lowerDescription.includes(elem.toLowerCase())
    );

    // Check for common errors
    const possibleErrors = expectations.commonErrors.filter(err =>
      lowerDescription.includes(err.toLowerCase())
    );

    const hasExpectedElements = matchedElements.length > 0;

    logger.info('Drawing progress check', {
      matchedElements,
      possibleErrors,
      hasExpectedElements,
    });

    return {
      hasExpectedElements,
      matchedElements,
      possibleErrors,
    };
  }

  /**
   * Evaluate if drawing shows mastery
   */
  public evaluateDrawingMastery(visionDescription: string): {
    showsMastery: boolean;
    matchedIndicators: string[];
    confidence: number;
  } {
    if (!this.currentImageData?.drawingExpectations) {
      return {
        showsMastery: false,
        matchedIndicators: [],
        confidence: 0,
      };
    }

    const expectations = this.currentImageData.drawingExpectations;
    const lowerDescription = visionDescription.toLowerCase();

    // Check for success indicators
    const matchedIndicators = expectations.successIndicators.filter(indicator =>
      lowerDescription.includes(indicator.toLowerCase())
    );

    const confidence = matchedIndicators.length / expectations.successIndicators.length;
    const showsMastery = confidence >= 0.6; // Need 60% of success indicators

    logger.info('Drawing mastery evaluation', {
      showsMastery,
      matchedIndicators,
      confidence,
    });

    return {
      showsMastery,
      matchedIndicators,
      confidence,
    };
  }

  /**
   * Reset activity state for new image
   */
  private resetActivity(): void {
    this.canvasActivity = {
      hasDrawn: false,
      lastDrawTime: 0,
      strokeCount: 0,
      timeSincePrompt: 0,
    };
    this.promptIssued = false;
    this.lastPromptLevel = 'initial';

    logger.debug('Canvas activity reset');
  }

  /**
   * Get current prompt level (for debugging/UI)
   */
  public getCurrentPromptLevel(): string {
    return this.lastPromptLevel;
  }

  /**
   * Check if canvas work is complete enough to move forward
   */
  public isDrawingComplete(): boolean {
    if (!this.currentImageData?.drawingExpectations) {
      return true; // No expectations = not required
    }

    // Simple heuristic: has drawn and reasonable stroke count
    return this.canvasActivity.hasDrawn && this.canvasActivity.strokeCount >= 3;
  }
}
