/**
 * PromptBuilder - Dynamic system prompt construction
 * 
 * Combines base prompt with real-time agent context
 * Ensures Gemini always has latest insights
 */

import type { SessionContext } from '@simili/agents';
import { SIMILI_SYSTEM_PROMPT } from '@simili/agents';

const logger = {
  info: (msg: string, data?: any) => console.log(`[PromptBuilder] 🏗️ ${msg}`, data || ''),
  debug: (msg: string, data?: any) => console.debug(`[PromptBuilder] 🔍 ${msg}`, data || ''),
};

export class PromptBuilder {
  private static studentName: string = 'the student';
  
  /**
   * Set student name for personalized prompts
   */
  public static setStudentName(name: string) {
    this.studentName = name;
    logger.info('Student name set', { name });
  }
  
  /**
   * Build complete system prompt with agent context
   */
  public static buildSystemPrompt(context: SessionContext): string {
    let basePrompt = SIMILI_SYSTEM_PROMPT;
    
    // Personalize prompt with student name
    if (this.studentName !== 'the student') {
      basePrompt = basePrompt.replace(/the student/gi, this.studentName);
    }
    
    const agentContext = this.formatAgentContext(context);
    
    // Combine base prompt with dynamic context
    const fullPrompt = `${basePrompt}\n\n${agentContext}`;
    
    logger.debug('Built system prompt', {
      studentName: this.studentName,
      baseLength: basePrompt.length,
      contextLength: agentContext.length,
      totalLength: fullPrompt.length,
    });
    
    return fullPrompt;
  }

  /**
   * Format agent context as structured JSON for Gemini
   * This gets appended to base prompt on every turn
   */
  private static formatAgentContext(context: SessionContext): string {
    const sections: string[] = [];
    
    sections.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    sections.push('REAL-TIME STUDENT CONTEXT (Updated This Turn)');
    sections.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Lesson Progress
    sections.push(this.formatLessonProgress(context));

    // Emotional State
    if (context.emotional) {
      sections.push(this.formatEmotionalState(context.emotional));
    }

    // Misconceptions
    if (context.misconceptions && context.misconceptions.length > 0) {
      sections.push(this.formatMisconceptions(context.misconceptions));
    }

    // Vision Context
    if (context.vision) {
      sections.push(this.formatVisionContext(context.vision));
    }

    // Canvas Drawing Guidance
    const canvasGuidance = this.formatCanvasGuidance(context);
    if (canvasGuidance) {
      sections.push(canvasGuidance);
    }

    // Priority Instructions
    sections.push(this.formatPriorityInstructions(context));

    sections.push('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return sections.join('\n');
  }

  private static formatLessonProgress(context: SessionContext): string {
    const { lesson } = context;
    
    return `
## 📚 Lesson Progress

\`\`\`json
{
  "current_milestone": "${lesson.currentMilestoneTitle}",
  "progress": "${lesson.progress}",
  "attempts_on_current": ${lesson.attempts},
  "time_spent": "${this.formatTime(lesson.timeOnMilestone)}",
  "mastery_criteria": ${JSON.stringify(lesson.masteryCriteria, null, 2)}
}
\`\`\`
`;
  }

  private static formatEmotionalState(emotional: any): string {
    const engagement = Math.round(emotional.engagementLevel * 100);
    const frustration = Math.round(emotional.frustrationLevel * 100);
    const confusion = Math.round(emotional.confusionLevel * 100);

    return `
## 🎭 Emotional State Analysis

\`\`\`json
{
  "state": "${emotional.state}",
  "engagement": ${engagement}%,
  "frustration": ${frustration}%,
  "confusion": ${confusion}%,
  "indicators": ${JSON.stringify(emotional.indicators)},
  "trend": "${emotional.trend}",
  "recommendation": "${emotional.recommendation}"
}
\`\`\`

${frustration > 60 ? '⚠️ **HIGH FRUSTRATION** - Be extra encouraging and patient' : ''}
${confusion > 60 ? '⚠️ **HIGH CONFUSION** - Break down into smaller steps' : ''}
${engagement < 40 ? '⚠️ **LOW ENGAGEMENT** - Try more playful, interactive approach' : ''}
`;
  }

  private static formatMisconceptions(misconceptions: any[]): string {
    // Only show unresolved, recent misconceptions
    const recent = misconceptions
      .filter(m => m.detected && !m.resolved)
      .slice(-2); // Last 2

    if (recent.length === 0) return '';

    const items = recent.map(m => `
  {
    "type": "${m.type}",
    "student_said": "${m.evidence}",
    "correct_concept": "${m.correctiveConcept}",
    "how_to_address": "${m.intervention}",
    "confidence": ${(m.confidence * 100).toFixed(0)}%,
    "priority": ${m.confidence > 0.7 ? '"HIGH"' : '"MEDIUM"'}
  }`).join(',');

    return `
## ⚠️ Misconceptions Detected

\`\`\`json
[${items}
]
\`\`\`

**IMPORTANT:** Address these misconceptions gently using analogies and examples.
`;
  }

  private static formatVisionContext(vision: any): string {
    const age = Math.round((Date.now() - vision.timestamp) / 1000);
    const confidencePercent = (vision.confidence * 100).toFixed(0);
    
    return `
## 👁️ What Student Drew on Canvas

\`\`\`json
{
  "analyzed": "${age} seconds ago",
  "description": "${vision.description}",
  "interpretation": "${vision.interpretation}",
  "suggestion": "${vision.suggestion}",
  "confidence": ${confidencePercent}%
}
\`\`\`

**🎯 ACTION REQUIRED:** Reference their drawing in your response!
- Acknowledge what they drew: "I see you drew..."
- Ask about their thinking: "Tell me about your drawing"
- Build on their visual work

${vision.confidence < 0.6 ? '⚠️ **Low confidence** - Ask them to explain their drawing verbally: "Can you tell me what you were trying to show?"' : '✅ Good confidence - Discuss and build on their visual representation'}
`;
  }

  private static formatPriorityInstructions(context: SessionContext): string {
    const priorities: string[] = [];

    // Build priority list based on context
    if (context.emotional) {
      if (context.emotional.frustrationLevel > 0.6) {
        priorities.push('1. **PRIORITY:** Provide encouragement and emotional support first');
      }
      if (context.emotional.confusionLevel > 0.6) {
        priorities.push('1. **PRIORITY:** Break down the concept into smaller, simpler steps');
      }
    }

    const urgentMisconceptions = context.misconceptions?.filter(
      m => m.detected && !m.resolved && m.confidence && m.confidence > 0.7
    );
    
    if (urgentMisconceptions && urgentMisconceptions.length > 0) {
      priorities.push('2. **PRIORITY:** Address misconception gently using visual analogy');
    }

    if (context.lesson.attempts > 5) {
      priorities.push('3. **PRIORITY:** Student struggling - offer scaffolding or hint');
    }

    if (context.vision?.needsVoiceOver) {
      priorities.push('4. **PRIORITY:** Ask student to explain their canvas work verbally');
    }

    if (priorities.length === 0) {
      priorities.push('Continue guiding student through current milestone');
    }

    return `
## 🎯 Priority Instructions for Next Response

${priorities.map((p, i) => `${i + 1}. ${p}`).join('\n')}
`;
  }

  /**
   * Format time in human-readable way
   */
  private static formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  }

  /**
   * Format canvas drawing guidance for agent
   * Tells agent when and how to prompt student to draw
   */
  private static formatCanvasGuidance(context: SessionContext): string {
    // Check if there's active canvas guidance from image pedagogy
    const canvasGuidance = (context as any).canvasGuidance;
    
    if (!canvasGuidance) {
      return '';
    }

    const sections: string[] = [];
    
    sections.push(`
## 🎨 Canvas Drawing Guidance

**Current Activity:** ${canvasGuidance.activityDescription || 'Drawing exercise'}

**What Student Should Draw:**
${canvasGuidance.expectedElements?.map((elem: string) => `- ${elem}`).join('\n') || '- (See image for reference)'}

**Your Role as Tutor:**
${canvasGuidance.agentPrompt || 'Encourage student to use the canvas to show their thinking'}

**Watch for Common Mistakes:**
${canvasGuidance.commonErrors?.map((err: string) => `- ${err}`).join('\n') || '- Monitor for errors'}

**Success Indicators:**
${canvasGuidance.successIndicators?.map((ind: string) => `- ${ind}`).join('\n') || '- Clear, accurate representation'}
`);

    return sections.join('\n');
  }

  /**
   * Get just the base prompt without agent context
   */
  public static getBasePrompt(): string {
    let basePrompt = SIMILI_SYSTEM_PROMPT;
    
    // Personalize with student name if set
    if (this.studentName !== 'the student') {
      basePrompt = basePrompt.replace(/the student/gi, this.studentName);
    }
    
    return basePrompt;
  }

  /**
   * Build concise context update for mid-conversation injection
   * This is sent as a hidden message to update AI without interrupting
   */
  public static buildContextUpdate(context: SessionContext): string {
    const sections: string[] = [];
    
    sections.push('📊 REAL-TIME CONTEXT UPDATE');
    sections.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Only include what changed or is most relevant
    if (context.emotional) {
      const { state, engagementLevel, frustrationLevel, confusionLevel } = context.emotional;
      sections.push(`\n🎭 Emotional State: ${state.toUpperCase()}`);
      sections.push(`   Engagement: ${(engagementLevel * 100).toFixed(0)}%`);
      if (frustrationLevel > 0.4) {
        sections.push(`   ⚠️ Frustration: ${(frustrationLevel * 100).toFixed(0)}% - Simplify and encourage!`);
      }
      if (confusionLevel > 0.4) {
        sections.push(`   ⚠️ Confusion: ${(confusionLevel * 100).toFixed(0)}% - Rephrase and use examples!`);
      }
    }
    
    // Recent misconceptions
    if (context.misconceptions && context.misconceptions.length > 0) {
      const recent = context.misconceptions.slice(-2); // Last 2
      sections.push(`\n🔴 Active Misconceptions:`);
      recent.forEach((m, i) => {
        sections.push(`   ${i + 1}. ${m.type}: ${m.correctiveConcept}`);
        if (m.intervention) {
          sections.push(`      → Strategy: ${m.intervention}`);
        }
      });
    }
    
    // Vision analysis
    if (context.vision && context.vision.needsVoiceOver) {
      sections.push(`\n👁️ Student's Drawing:`);
      sections.push(`   ${context.vision.description.substring(0, 150)}...`);
      sections.push(`   🎯 Suggest: ${context.vision.suggestion}`);
    }
    
    sections.push('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    sections.push('Adapt your next response based on this context.');
    
    return sections.join('\n');
  }
}
