/**
 * Spaced Repetition Engine
 * Simplified SM-2 algorithm for quick review sessions
 */

import type { ScheduledCard } from '../../types/cards';

export class SpacedRepetitionEngine {
  /**
   * Schedule a card for review based on difficulty assessment
   */
  scheduleReview(
    cardId: string,
    difficulty: 'again' | 'hard' | 'good' | 'easy'
  ): ScheduledCard {
    const intervals = {
      again: 5 * 60 * 1000,      // 5 minutes
      hard: 15 * 60 * 1000,      // 15 minutes
      good: 60 * 60 * 1000,      // 1 hour
      easy: 24 * 60 * 60 * 1000, // 1 day (graduate to mastered)
    };
    
    const nextReviewAt = Date.now() + intervals[difficulty];
    
    return {
      cardId,
      nextReviewAt,
      reviewCount: 1,
      lastAttemptSuccessful: false,
      intervalMultiplier: 1.0,
      difficulty,
    };
  }
  
  /**
   * Get cards that are due for review
   */
  getDueCards(scheduledCards: ScheduledCard[]): ScheduledCard[] {
    const now = Date.now();
    return scheduledCards.filter(card => card.nextReviewAt <= now);
  }
  
  /**
   * Update schedule after a review
   */
  updateSchedule(
    card: ScheduledCard,
    wasSuccessful: boolean,
    newDifficulty: 'again' | 'hard' | 'good' | 'easy'
  ): ScheduledCard {
    if (wasSuccessful && newDifficulty === 'easy') {
      // Graduate to mastered - no more reviews
      return {
        ...card,
        reviewCount: card.reviewCount + 1,
        lastAttemptSuccessful: true,
        nextReviewAt: Infinity, // Never review again
      };
    }
    
    // Reschedule based on new difficulty
    const intervals = {
      again: 5 * 60 * 1000,
      hard: 15 * 60 * 1000,
      good: 60 * 60 * 1000,
      easy: 24 * 60 * 60 * 1000,
    };
    
    const interval = intervals[newDifficulty];
    const multiplier = wasSuccessful ? card.intervalMultiplier * 1.5 : 1.0;
    const nextReviewAt = Date.now() + (interval * multiplier);
    
    return {
      ...card,
      nextReviewAt,
      reviewCount: card.reviewCount + 1,
      lastAttemptSuccessful: wasSuccessful,
      intervalMultiplier: multiplier,
      difficulty: newDifficulty,
    };
  }
}
