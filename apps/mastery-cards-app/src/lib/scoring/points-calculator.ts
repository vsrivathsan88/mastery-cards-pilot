/**
 * Points Calculator
 * Calculates points and bonuses for card completion
 */

import type { PointsCalculation } from '../../types/cards';

export class PointsCalculator {
  /**
   * Calculate points for a card swipe
   */
  calculateCardPoints(params: {
    swipeDirection: 'right' | 'left';
    cardDifficulty: 'easy' | 'medium' | 'hard';
    isFirstAttempt: boolean;
    currentStreak: number;
    timeToAnswer: number; // seconds
  }): PointsCalculation {
    let basePoints = 0;
    const bonuses: { name: string; points: number }[] = [];
    
    // Base points for correct answer
    if (params.swipeDirection === 'right') {
      basePoints = {
        easy: 10,
        medium: 15,
        hard: 25,
      }[params.cardDifficulty];
      
      // First attempt bonus
      if (params.isFirstAttempt) {
        bonuses.push({ name: 'First Try! 🎯', points: 5 });
      }
      
      // Streak bonus
      if (params.currentStreak >= 3) {
        const streakPoints = Math.min(10, params.currentStreak);
        bonuses.push({ name: `Streak x${params.currentStreak} 🔥`, points: streakPoints });
      }
      
      // Speed bonus (under 30 seconds)
      if (params.timeToAnswer < 30) {
        bonuses.push({ name: 'Lightning Fast ⚡', points: 3 });
      }
    }
    
    const total = basePoints + bonuses.reduce((sum, b) => sum + b.points, 0);
    
    return { basePoints, bonuses, total };
  }
  
  /**
   * Calculate level from points
   */
  getLevelForPoints(points: number): {
    level: number;
    pointsInLevel: number;
    pointsToNextLevel: number;
  } {
    const pointsPerLevel = 100;
    const level = Math.floor(points / pointsPerLevel) + 1;
    const pointsInLevel = points % pointsPerLevel;
    const pointsToNextLevel = pointsPerLevel - pointsInLevel;
    
    return { level, pointsInLevel, pointsToNextLevel };
  }
}
