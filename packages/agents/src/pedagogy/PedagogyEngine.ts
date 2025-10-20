import { LessonData, Milestone, Event } from '@simili/shared';
import EventEmitter from 'eventemitter3';

export interface PedagogyEvents {
  milestone_detected: (milestone: Milestone, transcription: string) => void;
  milestone_completed: (milestone: Milestone) => void;
  lesson_started: (lesson: LessonData) => void;
  lesson_completed: (lesson: LessonData) => void;
  progress_update: (progress: LessonProgress) => void;
}

export interface LessonProgress {
  lessonId: string;
  currentMilestoneIndex: number;
  totalMilestones: number;
  completedMilestones: number;
  percentComplete: number;
}

export class PedagogyEngine extends EventEmitter<PedagogyEvents> {
  private currentLesson?: LessonData;
  private currentMilestoneIndex: number = 0;
  private detectionHistory: Map<string, number> = new Map();

  constructor() {
    super();
  }

  /**
   * Load a lesson and start tracking progress
   */
  public loadLesson(lesson: LessonData): void {
    this.currentLesson = lesson;
    this.currentMilestoneIndex = 0;
    this.detectionHistory.clear();
    
    // Mark all milestones as incomplete
    lesson.milestones.forEach(m => m.completed = false);
    
    this.emit('lesson_started', lesson);
    this.emitProgress();
    
    console.log(`[PedagogyEngine] Lesson loaded: ${lesson.title}`);
    console.log(`[PedagogyEngine] Current milestone: ${this.getCurrentMilestone()?.title}`);
  }

  /**
   * Get the current lesson
   */
  public getCurrentLesson(): LessonData | undefined {
    return this.currentLesson;
  }

  /**
   * Get the current milestone
   */
  public getCurrentMilestone(): Milestone | undefined {
    if (!this.currentLesson) return undefined;
    return this.currentLesson.milestones[this.currentMilestoneIndex];
  }

  /**
   * Process transcription and detect milestone completion
   */
  public processTranscription(text: string, isFinal: boolean): void {
    if (!isFinal || !this.currentLesson) return;

    const currentMilestone = this.getCurrentMilestone();
    if (!currentMilestone || currentMilestone.completed) return;

    // Simple keyword matching
    const matchedKeywords = this.detectKeywords(text, currentMilestone.keywords || []);
    
    if (matchedKeywords.length > 0) {
      console.log(`[PedagogyEngine] Detected keywords: ${matchedKeywords.join(', ')}`);
      
      // Track detection attempts
      const detectionKey = `${currentMilestone.id}_${Date.now()}`;
      this.detectionHistory.set(detectionKey, matchedKeywords.length);
      
      // Emit detection event
      this.emit('milestone_detected', currentMilestone, text);
      
      // If multiple keywords matched, consider it a completion
      if (matchedKeywords.length >= 2) {
        this.completeMilestone();
      }
    }
  }

  /**
   * Manually complete the current milestone
   */
  public completeMilestone(): void {
    const currentMilestone = this.getCurrentMilestone();
    if (!currentMilestone || currentMilestone.completed) return;

    currentMilestone.completed = true;
    currentMilestone.timestamp = Date.now();
    
    console.log(`[PedagogyEngine] Milestone completed: ${currentMilestone.title}`);
    this.emit('milestone_completed', currentMilestone);

    // Move to next milestone
    if (this.currentMilestoneIndex < this.currentLesson!.milestones.length - 1) {
      this.currentMilestoneIndex++;
      console.log(`[PedagogyEngine] Moving to next milestone: ${this.getCurrentMilestone()?.title}`);
      this.emitProgress();
    } else {
      // All milestones complete - lesson done!
      console.log(`[PedagogyEngine] Lesson completed: ${this.currentLesson!.title}`);
      this.emit('lesson_completed', this.currentLesson!);
    }
  }

  /**
   * Detect keywords in transcription text
   */
  private detectKeywords(text: string, keywords: string[]): string[] {
    const lowerText = text.toLowerCase();
    return keywords.filter(keyword => {
      const lowerKeyword = keyword.toLowerCase();
      return lowerText.includes(lowerKeyword);
    });
  }

  /**
   * Emit progress update
   */
  private emitProgress(): void {
    if (!this.currentLesson) return;

    const completedCount = this.currentLesson.milestones.filter(m => m.completed).length;
    const totalCount = this.currentLesson.milestones.length;

    const progress: LessonProgress = {
      lessonId: this.currentLesson.id,
      currentMilestoneIndex: this.currentMilestoneIndex,
      totalMilestones: totalCount,
      completedMilestones: completedCount,
      percentComplete: (completedCount / totalCount) * 100,
    };

    this.emit('progress_update', progress);
  }

  /**
   * Get lesson progress
   */
  public getProgress(): LessonProgress | undefined {
    if (!this.currentLesson) return undefined;

    const completedCount = this.currentLesson.milestones.filter(m => m.completed).length;
    const totalCount = this.currentLesson.milestones.length;

    return {
      lessonId: this.currentLesson.id,
      currentMilestoneIndex: this.currentMilestoneIndex,
      totalMilestones: totalCount,
      completedMilestones: completedCount,
      percentComplete: (completedCount / totalCount) * 100,
    };
  }

  /**
   * Reset the engine
   */
  public reset(): void {
    this.currentLesson = undefined;
    this.currentMilestoneIndex = 0;
    this.detectionHistory.clear();
  }
}
