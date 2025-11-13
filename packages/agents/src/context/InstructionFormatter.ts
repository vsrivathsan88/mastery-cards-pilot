/**
 * Instruction Formatter
 * 
 * Formats subagent analysis results into structured instructions
 * optimized for Gemini Live consumption.
 * 
 * Output format: Clean JSON that tells Gemini Live exactly what was
 * observed and how to respond.
 */

import { SessionContext } from './ContextManager';

export interface GeminiLiveInstruction {
  timestamp: number;
  turn: number;
  observations: {
    misconception?: MisconceptionObservation;
    emotionalState?: EmotionalObservation;
    lessonProgress?: LessonProgressObservation;
  };
  teachingGuidance: {
    priorityLevel: 'critical' | 'high' | 'moderate' | 'low';
    recommendedActions: string[];
    avoidActions: string[];
    tone: string;
  };
}

export interface MisconceptionObservation {
  detected: boolean;
  type?: string;
  studentSaid: string;
  issue: string;
  correctConcept: string;
  howToAddress: string;
  confidence: number;
}

export interface EmotionalObservation {
  currentState: string;
  engagement: number; // 0-1
  frustration: number; // 0-1
  confusion: number; // 0-1
  indicators: string[];
  recommendedTone: string;
  recommendedApproach: string;
}

export interface LessonProgressObservation {
  currentMilestone: string;
  milestoneProgress: string;
  attempts: number;
  timeSpent: string;
  masteryCriteria: string[];
  nextSteps: string[];
}

export class InstructionFormatter {
  /**
   * Format session context into structured JSON instructions for Gemini Live
   * 
   * This is what Gemini Live sees - make it clear and actionable
   */
  static formatForGeminiLive(context: SessionContext): string {
    const instruction: GeminiLiveInstruction = {
      timestamp: Date.now(),
      turn: context.turnNumber,
      observations: {},
      teachingGuidance: {
        priorityLevel: 'low',
        recommendedActions: [],
        avoidActions: [],
        tone: 'encouraging and patient',
      },
    };

    // Add lesson progress observation
    if (context.lesson) {
      instruction.observations.lessonProgress = {
        currentMilestone: context.lesson.currentMilestoneTitle,
        milestoneProgress: context.lesson.progress,
        attempts: context.lesson.attempts,
        timeSpent: this.formatTime(context.lesson.timeOnMilestone),
        masteryCriteria: context.lesson.masteryCriteria,
        nextSteps: this.determineNextSteps(context),
      };
    }

    // Add misconception observation (CRITICAL)
    const recentMisconception = this.getRecentMisconception(context);
    if (recentMisconception) {
      instruction.observations.misconception = {
        detected: true,
        type: recentMisconception.type || 'unknown',
        studentSaid: recentMisconception.evidence || '',
        issue: this.describeMisconception(recentMisconception.type),
        correctConcept: recentMisconception.correctiveConcept || '',
        howToAddress: recentMisconception.intervention || 'Guide gently toward correct understanding',
        confidence: recentMisconception.confidence || 0,
      };

      // Escalate priority
      instruction.teachingGuidance.priorityLevel = 'critical';
      instruction.teachingGuidance.recommendedActions.push(
        recentMisconception.intervention || 'Address this misconception gently'
      );
      instruction.teachingGuidance.avoidActions.push(
        'Do not move forward without addressing this misconception',
        'Do not simply correct - guide student to discover the issue'
      );
    }

    // Add emotional observation
    if (context.emotional) {
      instruction.observations.emotionalState = {
        currentState: context.emotional.state,
        engagement: context.emotional.engagementLevel,
        frustration: context.emotional.frustrationLevel,
        confusion: context.emotional.confusionLevel,
        indicators: context.emotional.indicators,
        recommendedTone: this.determineTone(context.emotional),
        recommendedApproach: context.emotional.recommendation,
      };

      // Adjust tone based on emotional state
      instruction.teachingGuidance.tone = this.determineTone(context.emotional);

      // Add emotional-specific actions
      if (context.emotional.frustrationLevel > 0.6) {
        instruction.teachingGuidance.priorityLevel = 'high';
        instruction.teachingGuidance.recommendedActions.push(
          'Acknowledge student\'s effort and provide encouragement',
          'Break down the concept into smaller, easier steps',
          'Celebrate small wins'
        );
        instruction.teachingGuidance.avoidActions.push(
          'Do not overwhelm with complex explanations',
          'Do not rush to the answer'
        );
      }

      if (context.emotional.confusionLevel > 0.6) {
        instruction.teachingGuidance.priorityLevel = 'high';
        instruction.teachingGuidance.recommendedActions.push(
          'Clarify the current concept before moving forward',
          'Use simpler language and concrete examples',
          'Ask probing questions to identify specific confusion'
        );
      }

      if (context.emotional.engagementLevel < 0.4) {
        instruction.teachingGuidance.recommendedActions.push(
          'Re-engage with an interesting question or example',
          'Connect to something the student cares about',
          'Add variety to teaching approach'
        );
      }
    }

    // Format as clean JSON
    return JSON.stringify(instruction, null, 2);
  }

  /**
   * Format as XML (alternative format, more verbose but human-readable)
   */
  static formatAsXML(context: SessionContext): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<TeachingInstructions>\n';
    xml += `  <Turn>${context.turnNumber}</Turn>\n`;
    
    // Lesson progress
    if (context.lesson) {
      xml += '  <LessonProgress>\n';
      xml += `    <CurrentMilestone>${context.lesson.currentMilestoneTitle}</CurrentMilestone>\n`;
      xml += `    <Progress>${context.lesson.progress}</Progress>\n`;
      xml += `    <Attempts>${context.lesson.attempts}</Attempts>\n`;
      xml += '  </LessonProgress>\n';
    }

    // Misconception
    const recentMisconception = this.getRecentMisconception(context);
    if (recentMisconception) {
      xml += '  <MisconceptionDetected priority="critical">\n';
      xml += `    <Type>${recentMisconception.type}</Type>\n`;
      xml += `    <StudentSaid>${this.escapeXML(recentMisconception.evidence || '')}</StudentSaid>\n`;
      xml += `    <CorrectConcept>${this.escapeXML(recentMisconception.correctiveConcept || '')}</CorrectConcept>\n`;
      xml += `    <HowToAddress>${this.escapeXML(recentMisconception.intervention || '')}</HowToAddress>\n`;
      xml += `    <Confidence>${recentMisconception.confidence}</Confidence>\n`;
      xml += '  </MisconceptionDetected>\n';
    }

    // Emotional state
    if (context.emotional) {
      xml += '  <EmotionalState>\n';
      xml += `    <Current>${context.emotional.state}</Current>\n`;
      xml += `    <Engagement>${Math.round(context.emotional.engagementLevel * 100)}%</Engagement>\n`;
      xml += `    <Frustration>${Math.round(context.emotional.frustrationLevel * 100)}%</Frustration>\n`;
      xml += `    <Confusion>${Math.round(context.emotional.confusionLevel * 100)}%</Confusion>\n`;
      xml += `    <RecommendedTone>${this.determineTone(context.emotional)}</RecommendedTone>\n`;
      xml += '  </EmotionalState>\n';
    }

    xml += '</TeachingInstructions>';
    return xml;
  }

  /**
   * Format as compact single-line JSON (for low-bandwidth scenarios)
   */
  static formatCompact(context: SessionContext): string {
    const instruction = this.formatForGeminiLive(context);
    return JSON.stringify(JSON.parse(instruction)); // Minified JSON
  }

  // Helper methods

  private static getRecentMisconception(context: SessionContext) {
    if (!context.misconceptions || context.misconceptions.length === 0) {
      return null;
    }
    
    // Get most recent unresolved misconception
    const recent = context.misconceptions
      .filter(m => m.detected && !m.resolved)
      .sort((a, b) => b.turn - a.turn)[0];
    
    return recent || null;
  }

  private static determineTone(emotional: any): string {
    if (emotional.frustrationLevel > 0.6) {
      return 'extremely patient, empathetic, and encouraging';
    }
    if (emotional.confusionLevel > 0.6) {
      return 'clear, simple, and reassuring';
    }
    if (emotional.engagementLevel > 0.8 && emotional.state === 'excited') {
      return 'enthusiastic and energetic';
    }
    if (emotional.engagementLevel < 0.4) {
      return 'engaging, interesting, and slightly playful';
    }
    return 'warm, encouraging, and supportive';
  }

  private static determineNextSteps(context: SessionContext): string[] {
    const steps: string[] = [];
    
    if (context.lesson.attempts > 3) {
      steps.push('Student has attempted this milestone multiple times - consider providing a hint or breaking it down further');
    }
    
    if (context.lesson.attempts === 0) {
      steps.push('First attempt on this milestone - observe student\'s approach before intervening');
    }
    
    const recentMisconception = this.getRecentMisconception(context);
    if (recentMisconception) {
      steps.push('Address the detected misconception before proceeding');
    } else {
      steps.push('Continue guiding student toward the milestone objectives');
    }
    
    return steps;
  }

  private static describeMisconception(type?: string): string {
    const descriptions: Record<string, string> = {
      'unequal-parts-as-fractions': 'Student thinks unequal pieces can be fractions',
      'numerator-denominator-role-confusion': 'Student confuses what numerator and denominator represent',
      'larger-denominator-means-larger-fraction': 'Student thinks 1/8 > 1/2 because 8 > 2',
      'unit-fractions-only': 'Student doesn\'t understand non-unit fractions like 2/3',
      'fractions-are-whole-numbers': 'Student treats fractions as two separate numbers',
    };
    
    return descriptions[type || ''] || 'Mathematical misconception detected';
  }

  private static formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  }

  private static escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
