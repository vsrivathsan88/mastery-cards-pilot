import { LessonData } from '@simili/shared';
import chocolateBarLesson from '../definitions/fractions/lesson-1-chocolate-bar.json';
import equalPartsChallenge from '../definitions/fractions/lesson-equal-parts-challenge.json';

export class LessonLoader {
  private static lessons: Map<string, LessonData> = new Map();

  static {
    // Pre-load available lessons
    this.lessons.set(
      'fractions-3-nf-a-1',
      chocolateBarLesson as unknown as LessonData
    );
    // Backwards compatibility
    this.lessons.set(
      'fractions-chocolate-bar-1',
      chocolateBarLesson as unknown as LessonData
    );
    
    // Equal Parts Challenge lesson
    this.lessons.set(
      'equal-parts-challenge',
      equalPartsChallenge as unknown as LessonData
    );
  }

  /**
   * Get a lesson by its ID
   */
  static getLesson(lessonId: string): LessonData | undefined {
    return this.lessons.get(lessonId);
  }

  /**
   * Get all available lessons
   */
  static getAllLessons(): LessonData[] {
    return Array.from(this.lessons.values());
  }

  /**
   * Get lessons by subject
   */
  static getLessonsBySubject(subject: string): LessonData[] {
    return Array.from(this.lessons.values()).filter(
      (lesson) => (lesson.metadata as any)?.tags?.includes(subject)
    );
  }

  /**
   * Check if a lesson exists
   */
  static hasLesson(lessonId: string): boolean {
    return this.lessons.has(lessonId);
  }
}
