/**
 * Canvas Context Formatter
 * Formats canvas drawing context and descriptions for the agent
 */

import { CanvasDescription } from '@simili/shared';

export interface CanvasState {
  description: string; // What's currently on the canvas
  studentAction?: string; // What student just drew
  analysis?: string; // Vision agent analysis (Phase 3F)
}

/**
 * Format canvas context for agent
 * Describes what student should be drawing and current state
 */
export function formatCanvasContext(
  lessonContext: CanvasDescription,
  currentState?: CanvasState
): string {
  const contextData = {
    type: 'CANVAS_CONTEXT',
    action: currentState ? 'UPDATE_CANVAS_STATE' : 'INITIAL_CANVAS_SETUP',
    canvas: {
      instructions: lessonContext.currentContext,
      expectedElements: lessonContext.expectedElements || [],
      visualGuidance: lessonContext.visualGuidance || '',
      currentState: currentState?.description || 'Canvas is empty',
      recentAction: currentState?.studentAction || null,
      analysis: currentState?.analysis || null,
    },
    instructions: currentState
      ? 'Canvas has been updated. Consider the student\'s drawing in your response. If the drawing shows understanding, celebrate it! If there are issues (like unequal parts), guide them gently.'
      : 'Canvas is ready. Guide the student to draw shapes that demonstrate fraction concepts. Encourage them to divide shapes into equal parts.',
  };

  return JSON.stringify(contextData, null, 2);
}

/**
 * Format image description for agent
 * Used when showing lesson images
 */
export function formatImageDescription(
  imageId: string,
  description: string,
  usage: string
): string {
  const contextData = {
    type: 'IMAGE_SHOWN',
    image: {
      id: imageId,
      description,
      usage,
    },
    instructions: `An image has been shown to the student: "${description}". Reference this visual in your teaching. Ask questions about what they see.`,
  };

  return JSON.stringify(contextData, null, 2);
}

/**
 * Format visual feedback from Vision Agent (Phase 3F)
 * This will be used when vision analysis is active
 */
export function formatVisionFeedback(analysis: {
  description: string;
  interpretation: string;
  hasCorrectElements: boolean;
  issues?: string[];
  confidence: number;
}): string {
  const contextData = {
    type: 'VISION_ANALYSIS',
    analysis: {
      what_student_drew: analysis.description,
      interpretation: analysis.interpretation,
      correctness: analysis.hasCorrectElements ? 'correct' : 'needs_improvement',
      issues: analysis.issues || [],
      confidence: analysis.confidence,
    },
    instructions: analysis.hasCorrectElements
      ? 'The student\'s drawing shows good understanding! Celebrate their visual representation and build on it.'
      : `The student's drawing has some issues: ${analysis.issues?.join(', ')}. Guide them gently to improve their visual representation.`,
  };

  return JSON.stringify(contextData, null, 2);
}
