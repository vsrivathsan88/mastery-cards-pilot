/**
 * Session State Management
 * Tracks current session progress, cards, scoring
 */

import { create } from 'zustand';
import type { MasteryCard, CardSession } from '../../types/cards';

interface SessionState {
  // Current session
  sessionId: string | null;
  currentCardIndex: number;
  cardsInDeck: MasteryCard[];
  currentCard: MasteryCard | null;
  
  // Progress
  cardsReviewed: number;
  masteredToday: string[];
  needsPractice: string[];
  
  // Scoring
  points: number;
  streak: number;
  level: number;
  
  // Timing
  sessionStartTime: number | null;
  currentCardStartTime: number | null;
  
  // Actions
  startSession: (cards: MasteryCard[]) => void;
  nextCard: () => void;
  masteredCard: (cardId: string, pointsEarned: number) => void;
  needsPracticeCard: (cardId: string) => void;
  resetStreak: () => void;
  endSession: () => CardSession | null;
  
  // Getters
  getProgress: () => { current: number; total: number; percentage: number };
  getLevel: () => { level: number; pointsInLevel: number; pointsToNextLevel: number };
}

export const useSessionStore = create<SessionState>((set, get) => ({
  // Initial state
  sessionId: null,
  currentCardIndex: 0,
  cardsInDeck: [],
  currentCard: null,
  cardsReviewed: 0,
  masteredToday: [],
  needsPractice: [],
  points: 0,
  streak: 0,
  level: 1,
  sessionStartTime: null,
  currentCardStartTime: null,
  
  // Start a new session
  startSession: (cards) => {
    const sessionId = `session-${Date.now()}`;
    console.log(`[Session] Starting new session: ${sessionId} with ${cards.length} cards`);
    
    set({
      sessionId,
      cardsInDeck: cards,
      currentCard: cards[0] || null,
      currentCardIndex: 0,
      cardsReviewed: 0,
      masteredToday: [],
      needsPractice: [],
      points: 0,
      streak: 0,
      level: 1,
      sessionStartTime: Date.now(),
      currentCardStartTime: Date.now(),
    });
  },
  
  // Move to next card
  nextCard: () => {
    const { currentCardIndex, cardsInDeck } = get();
    const nextIndex = currentCardIndex + 1;
    
    if (nextIndex < cardsInDeck.length) {
      console.log(`[Session] Moving to card ${nextIndex + 1}/${cardsInDeck.length}`);
      set({
        currentCardIndex: nextIndex,
        currentCard: cardsInDeck[nextIndex],
        currentCardStartTime: Date.now(),
      });
    } else {
      console.log('[Session] All cards completed!');
      set({
        currentCard: null,
        currentCardStartTime: null,
      });
    }
  },
  
  // Card was mastered
  masteredCard: (cardId, pointsEarned) => {
    const { streak, cardsReviewed, masteredToday, points } = get();
    const newPoints = points + pointsEarned;
    const newLevel = Math.floor(newPoints / 100) + 1;
    
    console.log(`[Session] Card ${cardId} mastered! +${pointsEarned} points (streak: ${streak + 1})`);
    
    set({
      cardsReviewed: cardsReviewed + 1,
      masteredToday: [...masteredToday, cardId],
      streak: streak + 1,
      points: newPoints,
      level: newLevel,
    });
  },
  
  // Card needs practice
  needsPracticeCard: (cardId) => {
    const { cardsReviewed, needsPractice } = get();
    
    console.log(`[Session] Card ${cardId} needs practice`);
    
    set({
      cardsReviewed: cardsReviewed + 1,
      needsPractice: [...needsPractice, cardId],
      streak: 0, // Reset streak
    });
  },
  
  // Reset streak (manual)
  resetStreak: () => {
    set({ streak: 0 });
  },
  
  // End session and return summary
  endSession: () => {
    const state = get();
    
    if (!state.sessionId || !state.sessionStartTime) {
      return null;
    }
    
    const endTime = Date.now();
    const duration = endTime - state.sessionStartTime;
    const averageTimePerCard = state.cardsReviewed > 0 
      ? duration / state.cardsReviewed 
      : 0;
    
    const session: CardSession = {
      sessionId: state.sessionId,
      startTime: state.sessionStartTime,
      endTime,
      cardsReviewed: state.cardsReviewed,
      totalCards: state.cardsInDeck.length,
      masteredCards: state.masteredToday,
      needsPracticeCards: state.needsPractice,
      pointsEarned: state.points,
      currentStreak: state.streak,
      maxStreak: state.streak, // TODO: Track max separately
      level: state.level,
      averageTimePerCard,
      totalInteractions: state.cardsReviewed,
    };
    
    console.log('[Session] Session ended:', session);
    
    // Reset state
    set({
      sessionId: null,
      currentCardIndex: 0,
      cardsInDeck: [],
      currentCard: null,
      sessionStartTime: null,
      currentCardStartTime: null,
    });
    
    return session;
  },
  
  // Get progress percentage
  getProgress: () => {
    const { cardsReviewed, cardsInDeck } = get();
    const total = cardsInDeck.length;
    const percentage = total > 0 ? (cardsReviewed / total) * 100 : 0;
    
    return {
      current: cardsReviewed,
      total,
      percentage: Math.round(percentage),
    };
  },
  
  // Get level info
  getLevel: () => {
    const { points } = get();
    const pointsPerLevel = 100;
    const level = Math.floor(points / pointsPerLevel) + 1;
    const pointsInLevel = points % pointsPerLevel;
    const pointsToNextLevel = pointsPerLevel - pointsInLevel;
    
    return {
      level,
      pointsInLevel,
      pointsToNextLevel,
    };
  },
}));
