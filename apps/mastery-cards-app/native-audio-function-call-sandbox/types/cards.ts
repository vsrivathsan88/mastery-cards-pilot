/**
 * Card Types for Mastery Cards App
 */

export interface MasteryCard {
  // Identity
  cardId: string;
  masteryGoalId: string;
  standard: string; // "3.NF.A.1"
  
  // Content
  title: string;
  description: string;
  textPrompt: string; // "Explain what 1/2 means"
  imageUrl?: string; // For future
  imageDescription: string; // AI generation prompt for images
  
  // Hierarchy
  scaffoldLevel: 'foundational' | 'intermediate' | 'advanced';
  prerequisiteFor: string[]; // Other card IDs
  dependsOn: string[];       // Prerequisite card IDs
  
  // Assessment
  masteryGoal: string; // What Pi is assessing
  successCriteria: string;
  commonMisconceptions: string[];
  
  // Gamification
  pointValue: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ScheduledCard {
  cardId: string;
  nextReviewAt: number; // timestamp
  reviewCount: number;
  lastAttemptSuccessful: boolean;
  intervalMultiplier: number; // For adaptive spacing
  difficulty: 'again' | 'hard' | 'good' | 'easy';
}

export interface CardSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  
  // Progress
  cardsReviewed: number;
  totalCards: number;
  
  // Results
  masteredCards: string[];
  needsPracticeCards: string[];
  
  // Scoring
  pointsEarned: number;
  currentStreak: number;
  maxStreak: number;
  level: number;
  
  // Analytics
  averageTimePerCard: number;
  totalInteractions: number;
}

export interface UserProgress {
  userId: string;
  
  // Overall stats
  totalPoints: number;
  currentLevel: number;
  totalCardsReviewed: number;
  totalCardsMastered: number;
  
  // Card history
  masteredCards: Set<string>;
  inProgressCards: Map<string, ScheduledCard>;
  
  // Session history
  sessions: CardSession[];
  
  // Achievements
  streakRecord: number;
  fastestSession: number;
  perfectSessions: number;
}

export interface SwipeDirection {
  direction: 'left' | 'right';
  velocity: number;
}

export interface PointsCalculation {
  basePoints: number;
  bonuses: { name: string; points: number }[];
  total: number;
}
