import { LessonData, Milestone } from '@simili/shared';
import { InstructionFormatter } from './InstructionFormatter';

export interface MisconceptionContext {
  turn: number;
  detected: boolean;
  type?: string;
  confidence?: number;
  evidence?: string;
  intervention?: string;
  correctiveConcept?: string;
  resolved?: boolean;
}

export interface EmotionalContext {
  timestamp: number;
  state: string;
  engagementLevel: number;
  frustrationLevel: number;
  confusionLevel: number;
  indicators: string[];
  trend: string;
  recommendation: string;
}

export interface VisionContext {
  timestamp: number;
  description: string;
  interpretation: string;
  suggestion: string;
  confidence: number;
  needsVoiceOver?: boolean;
}

export interface MilestoneContext {
  currentMilestoneId: string;
  currentMilestoneTitle: string;
  progress: string;
  attempts: number;
  timeOnMilestone: number;
  masteryCriteria: string[];
}

export interface SessionContext {
  lesson: MilestoneContext;
  misconceptions: MisconceptionContext[];
  emotional?: EmotionalContext;
  vision?: VisionContext;
  turnNumber: number;
}

export class ContextManager {
  private sessionContext: SessionContext;
  private turnNumber: number = 0;

  constructor() {
    this.sessionContext = {
      lesson: {
        currentMilestoneId: '',
        currentMilestoneTitle: '',
        progress: '0/0',
        attempts: 0,
        timeOnMilestone: 0,
        masteryCriteria: [],
      },
      misconceptions: [],
      turnNumber: 0,
    };
  }

  public incrementTurn(): void {
    this.turnNumber++;
    this.sessionContext.turnNumber = this.turnNumber;
  }

  public getCurrentTurn(): number {
    return this.turnNumber;
  }

  public updateLessonContext(
    lesson: LessonData,
    currentMilestone: Milestone,
    milestoneIndex: number,
    attempts: number,
    timeMs: number
  ): void {
    this.sessionContext.lesson = {
      currentMilestoneId: currentMilestone.id,
      currentMilestoneTitle: currentMilestone.title,
      progress: `${milestoneIndex + 1}/${lesson.milestones.length}`,
      attempts,
      timeOnMilestone: timeMs,
      masteryCriteria: this.extractMasteryCriteria(currentMilestone),
    };
  }

  public addMisconception(misconception: MisconceptionContext): void {
    misconception.turn = this.turnNumber;
    this.sessionContext.misconceptions.push(misconception);
    
    // Keep only last 5 misconceptions for context window management
    if (this.sessionContext.misconceptions.length > 5) {
      this.sessionContext.misconceptions = this.sessionContext.misconceptions.slice(-5);
    }
  }

  public resolveMisconception(type: string): void {
    const misconception = this.sessionContext.misconceptions.find(
      m => m.type === type && !m.resolved
    );
    if (misconception) {
      misconception.resolved = true;
    }
  }

  public updateEmotionalContext(emotional: EmotionalContext): void {
    this.sessionContext.emotional = emotional;
  }

  public updateVisionContext(vision: VisionContext): void {
    this.sessionContext.vision = vision;
  }

  public getContext(): SessionContext {
    return { ...this.sessionContext };
  }

  /**
   * Format context as structured JSON instructions for Gemini Live
   * OPTIMIZED for fast parsing and clear instructions
   */
  public formatContextAsJSON(): string {
    return InstructionFormatter.formatForGeminiLive(this.sessionContext);
  }

  /**
   * Format context as XML (alternative format)
   */
  public formatContextAsXML(): string {
    return InstructionFormatter.formatAsXML(this.sessionContext);
  }

  /**
   * Format context as human-readable text (legacy format)
   */
  public formatContextForPrompt(): string {
    const ctx = this.sessionContext;
    let formatted = '\n\n# CURRENT CONTEXT (Updated each turn)\n\n';

    // Lesson state
    formatted += '## Lesson State\n';
    formatted += `Current Milestone: "${ctx.lesson.currentMilestoneTitle}"\n`;
    formatted += `Progress: ${ctx.lesson.progress} milestones complete\n`;
    formatted += `Attempts on current milestone: ${ctx.lesson.attempts}\n`;
    formatted += `Time on current milestone: ${this.formatTime(ctx.lesson.timeOnMilestone)}\n\n`;

    // Misconceptions
    if (ctx.misconceptions.length > 0) {
      formatted += '## Recent Misconceptions Detected\n';
      formatted += '[From Misconception Classifier]\n';
      
      const recentMisconceptions = ctx.misconceptions.slice(-3);
      recentMisconceptions.forEach(m => {
        if (m.detected && m.type) {
          formatted += `- Turn ${m.turn}: "${m.evidence}" (confidence: ${m.confidence?.toFixed(2)})\n`;
          if (m.intervention) {
            formatted += `  → Intervention: ${m.intervention}\n`;
          }
          if (m.correctiveConcept) {
            formatted += `  → Corrective concept: ${m.correctiveConcept}\n`;
          }
          if (m.resolved) {
            formatted += `  → Status: Resolved ✓\n`;
          }
        }
      });
      formatted += '\n';
    }

    // Emotional state
    if (ctx.emotional) {
      formatted += '## Emotional State Analysis\n';
      formatted += '[From Emotional Classifier]\n';
      formatted += `- Current State: ${ctx.emotional.state}\n`;
      formatted += `- Engagement: ${Math.round(ctx.emotional.engagementLevel * 100)}% | `;
      formatted += `Frustration: ${Math.round(ctx.emotional.frustrationLevel * 100)}% | `;
      formatted += `Confusion: ${Math.round(ctx.emotional.confusionLevel * 100)}%\n`;
      formatted += `- Trend: ${ctx.emotional.trend}\n`;
      formatted += `- Recommendation: ${ctx.emotional.recommendation}\n\n`;
    }

    // Vision context
    if (ctx.vision) {
      const age = Date.now() - ctx.vision.timestamp;
      formatted += '## Visual Context\n';
      formatted += '[From Vision Agent]\n';
      formatted += `- Last capture: ${Math.round(age / 1000)} seconds ago\n`;
      formatted += `- Student's work: ${ctx.vision.description}\n`;
      formatted += `- Interpretation: ${ctx.vision.interpretation}\n`;
      formatted += `- Suggestion: ${ctx.vision.suggestion}\n`;
      if (ctx.vision.needsVoiceOver) {
        formatted += `- ⚠️ Low confidence (${ctx.vision.confidence.toFixed(2)}) - Consider asking student to explain their work\n`;
      }
      formatted += '\n';
    }

    // Mastery criteria
    if (ctx.lesson.masteryCriteria.length > 0) {
      formatted += '## Mastery Criteria for Current Milestone\n';
      ctx.lesson.masteryCriteria.forEach(criterion => {
        formatted += `- ${criterion}\n`;
      });
      formatted += '\n';
    }

    return formatted;
  }

  public reset(): void {
    this.turnNumber = 0;
    this.sessionContext = {
      lesson: {
        currentMilestoneId: '',
        currentMilestoneTitle: '',
        progress: '0/0',
        attempts: 0,
        timeOnMilestone: 0,
        masteryCriteria: [],
      },
      misconceptions: [],
      turnNumber: 0,
    };
  }

  private extractMasteryCriteria(milestone: Milestone): string[] {
    const criteria: string[] = [];
    
    // Add expected concepts if available
    const expectedConcepts = (milestone as any).expectedConcepts;
    if (expectedConcepts && Array.isArray(expectedConcepts)) {
      criteria.push(...expectedConcepts.map(c => `Student must understand: ${c}`));
    }
    
    // Add keyword-based criterion
    if (milestone.keywords && milestone.keywords.length > 0) {
      criteria.push(`Must demonstrate understanding through concepts like: ${milestone.keywords.join(', ')}`);
    }
    
    return criteria;
  }

  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  }
}
