/**
 * Lesson Context Formatter
 * 
 * Formats lesson and milestone data into a context message that can be sent
 * to the agent WITHOUT changing the system prompt.
 * 
 * This allows dynamic lesson updates without reconnecting.
 */

import { LessonData, Milestone } from '@simili/shared';

export interface LessonContextOptions {
  lesson: LessonData;
  milestone: Milestone;
  milestoneIndex: number;
  isFirstMilestone?: boolean;
}

/**
 * Format lesson context as a JSON message to send to the agent
 * This is sent as a user message that the agent reads and uses to guide teaching
 */
export function formatLessonContext(options: LessonContextOptions): string {
  const { lesson, milestone, milestoneIndex, isFirstMilestone = true } = options;

  // Extract available images from lesson assets
  const availableImages = (lesson as any).assets?.map((asset: any) => ({
    id: asset.id,
    description: asset.description || asset.alt,
    usage: asset.usage || 'general',
    difficulty: asset.difficulty,
  })) || [];

  const contextData = {
    type: 'LESSON_CONTEXT',
    action: isFirstMilestone ? 'START_LESSON' : 'CONTINUE_LESSON',
    lesson: {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      objectives: lesson.objectives,
      standards: (lesson as any).standards || [],
      gradeLevel: (lesson as any).gradeLevel,
      availableImages, // ✅ NOW Pi knows what images exist!
    },
    currentMilestone: {
      title: milestone.title,
      description: milestone.description,
      keywords: milestone.keywords || [],
      index: milestoneIndex,
      total: lesson.milestones.length,
      teachingTips: (milestone as any).teachingTips || [],
    },
    instructions: isFirstMilestone
      ? `Warmly greet the student and introduce the lesson "${lesson.title}". Guide them toward understanding "${milestone.title}" using concrete examples. Use show_image() to display relevant visuals at key story moments.`
      : `Move to milestone "${milestone.title}". Celebrate their progress, then guide them toward this new concept. Consider using show_image() to display new visuals that match this milestone.`,
  };

  return JSON.stringify(contextData, null, 2);
}

/**
 * Format milestone transition message as JSON
 * Used when student completes a milestone and moves to the next one
 */
export function formatMilestoneTransition(
  completedMilestone: Milestone,
  nextMilestone: Milestone,
  nextMilestoneIndex: number,
  totalMilestones: number,
  availableImages?: Array<{ id: string; description: string; usage: string }> // ✅ NEW: Image list
): string {
  // Extract suggested images for next milestone based on usage hints
  const suggestedImages = availableImages?.filter(img => 
    img.usage === (nextMilestone as any).id || 
    img.usage?.includes(nextMilestone.title.toLowerCase()) ||
    img.description?.toLowerCase().includes(nextMilestone.title.toLowerCase().split(' ')[0])
  ) || [];

  const transitionData = {
    type: 'MILESTONE_TRANSITION',
    completed: {
      title: completedMilestone.title,
      description: completedMilestone.description,
    },
    next: {
      title: nextMilestone.title,
      description: nextMilestone.description,
      keywords: nextMilestone.keywords || [],
      index: nextMilestoneIndex,
      total: totalMilestones,
      suggestedImages: suggestedImages.length > 0 ? suggestedImages : undefined, // ✅ NEW: Images for this milestone
    },
    instructions: suggestedImages.length > 0
      ? `Enthusiastically celebrate completing "${completedMilestone.title}", then transition to "${nextMilestone.title}". **Important: Call show_image() with one of the suggested images to provide visual support for this new milestone.** Guide them toward this new concept with fresh examples.`
      : `Enthusiastically celebrate completing "${completedMilestone.title}", then transition to "${nextMilestone.title}". Guide them toward this new concept with fresh examples.`,
  };

  return JSON.stringify(transitionData, null, 2);
}

/**
 * Format misconception feedback as JSON
 * This is sent when backend detects a misconception
 */
export function formatMisconceptionFeedback(misconception: {
  type: string;
  evidence: string;
  intervention: string;
  correctiveConcept?: string;
}): string {
  const feedbackData = {
    type: 'MISCONCEPTION_DETECTED',
    misconception: misconception.type,
    studentSaid: misconception.evidence,
    issue: `This indicates a common misconception about the concept.`,
    intervention: misconception.intervention,
    correctiveConcept: misconception.correctiveConcept || null,
    instructions: `Acknowledge their thinking warmly, ask probing questions, and guide them toward correct understanding using concrete examples. Never say "that's wrong".`,
  };

  return JSON.stringify(feedbackData, null, 2);
}

/**
 * Format emotional state feedback as JSON
 * Sent when backend detects changes in student's emotional state
 */
export function formatEmotionalFeedback(emotional: {
  state: string;
  engagementLevel: number;
  frustrationLevel: number;
  confusionLevel: number;
  recommendation: string;
}): string {
  const emotionalData = {
    type: 'EMOTIONAL_STATE',
    state: emotional.state,
    engagement: emotional.engagementLevel,
    frustration: emotional.frustrationLevel,
    confusion: emotional.confusionLevel,
    recommendation: emotional.recommendation,
    suggestedAdjustment:
      emotional.frustrationLevel > 6
        ? 'Offer more support, break problems into smaller steps'
        : emotional.engagementLevel < 4
        ? 'Make it more fun, use different examples'
        : emotional.confusionLevel > 6
        ? 'Clarify with simpler language and concrete examples'
        : 'Maintain current approach, continue encouraging',
  };

  return JSON.stringify(emotionalData, null, 2);
}

export default {
  formatLessonContext,
  formatMilestoneTransition,
  formatMisconceptionFeedback,
  formatEmotionalFeedback,
};
