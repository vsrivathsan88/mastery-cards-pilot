import { LessonData, Milestone } from '@simili/shared';
import { ContextManager } from '../context/ContextManager';

export interface PromptContext {
  lesson: LessonData;
  currentMilestone: Milestone;
  milestoneIndex: number;
  contextManager?: ContextManager;
}

export class PromptManager {
  /**
   * @deprecated This method is deprecated. Use SIMILI_SYSTEM_PROMPT (static) + formatLessonContext (JSON messages) instead.
   * 
   * Legacy method: Generate a complete system prompt with lesson context.
   * 
   * NEW APPROACH:
   * - Use SIMILI_SYSTEM_PROMPT from 'static-system-prompt.ts' (set once, never changes)
   * - Send lesson context as JSON messages via formatLessonContext()
   * - Send milestone transitions via formatMilestoneTransition()
   * 
   * This method remains for backwards compatibility only.
   */
  public static generateSystemPrompt(context: PromptContext): string {
    const { lesson, currentMilestone, milestoneIndex, contextManager } = context;
    
    let prompt = `You are Simili, a warm and encouraging AI math tutor for elementary students.

# Your Personality
- Warm, patient, and enthusiastic about learning
- Never condescending, always age-appropriate
- Celebrate small wins and progress
- Use conversational, friendly tone

# Teaching Approach
- Use the Socratic method: guide through questions, don't give answers directly
- Scaffold learning: break complex concepts into small steps
- Connect to real-world, concrete examples
- Encourage students to explain their reasoning
- Provide positive reinforcement constantly

# LESSON OVERVIEW
You are teaching: "${lesson.title}"

Lesson Description: ${lesson.description}

Learning Objectives:
${lesson.objectives.map(obj => `- ${obj}`).join('\n')}

# Interaction Guidelines
- Keep responses under 3 sentences when possible
- Ask one question at a time
- Wait for student responses before moving forward
- If student goes off-topic briefly (under 30s), acknowledge then redirect: "That's interesting! Now, about our chocolate bar..."
- Never say "that's wrong" - instead ask: "Can you tell me more about why you think that?"
- If you need a moment to process, use natural thinking sounds: "Hmm...", "Let me think...", "Interesting!"

# Error Handling
When student struggles:
- Ask probing questions to identify misconception
- Offer simpler version of the problem
- Use more concrete, visual examples
- Provide reassurance: "It's okay, let's think through this together"

# Scaffolding Hints
${this.generateScaffolding(lesson)}

Remember: Your goal is to guide, not tell. Help them discover the answer through questions and reasoning!`;

    // Inject dynamic context if ContextManager is provided
    if (contextManager) {
      prompt += contextManager.formatContextForPrompt();
    } else {
      // Fallback: add static milestone context
      prompt += `\n\n# CURRENT MILESTONE FOCUS\n\n`;
      prompt += `Milestone ${milestoneIndex + 1} of ${lesson.milestones.length}: "${currentMilestone.title}"\n\n`;
      prompt += `${currentMilestone.description}\n\n`;
      prompt += `Your current goal is to guide the student to understand:\n`;
      prompt += `${(currentMilestone as any).expectedConcepts?.map((c: string) => `- ${c}`).join('\n') || '- ' + currentMilestone.description}\n\n`;
      prompt += `Start by asking: "${(currentMilestone as any).prompt}"\n\n`;
      prompt += `# Listen For\n`;
      prompt += `When the student demonstrates understanding, they might use words like:\n`;
      prompt += `${currentMilestone.keywords?.join(', ') || 'related concepts'}\n`;
    }

    return prompt;
  }

  /**
   * Generate a simplified prompt for quick testing
   */
  public static generateSimplePrompt(lesson: LessonData, milestone: Milestone): string {
    return `You are a friendly math tutor teaching "${lesson.title}". 
    
Your current goal: Help the student understand "${milestone.title}".

${(milestone as any).prompt}

Be encouraging, ask guiding questions, and celebrate when they show understanding of concepts like: ${milestone.keywords?.join(', ')}`;
  }

  /**
   * Update prompt when moving to next milestone
   */
  public static generateMilestoneTransition(
    previousMilestone: Milestone,
    nextMilestone: Milestone
  ): string {
    return `Excellent work on "${previousMilestone.title}"! 

Now let's move to the next step: "${nextMilestone.title}"

${(nextMilestone as any).prompt}`;
  }

  /**
   * Generate celebration message for milestone completion
   */
  public static generateCelebration(milestone: Milestone): string {
    const celebrations = [
      `Fantastic! You've mastered "${milestone.title}"!`,
      `Excellent work! You really understand "${milestone.title}" now!`,
      `Amazing job! You've got "${milestone.title}" down!`,
      `Well done! You've successfully completed "${milestone.title}"!`,
    ];
    
    return celebrations[Math.floor(Math.random() * celebrations.length)];
  }

  private static generateScaffolding(lesson: LessonData): string {
    const scaffolding = (lesson as any).scaffolding;
    if (!scaffolding) return '';

    let text = '';
    
    if (scaffolding.hints?.length > 0) {
      text += `If student needs hints:\n${scaffolding.hints.map((h: string) => `- ${h}`).join('\n')}\n\n`;
    }
    
    if (scaffolding.commonMisconceptions?.length > 0) {
      text += `Watch for these misconceptions:\n`;
      scaffolding.commonMisconceptions.forEach((m: any) => {
        text += `- If they think "${m.misconception}", guide them: "${m.correction}"\n`;
      });
    }
    
    return text;
  }
}
