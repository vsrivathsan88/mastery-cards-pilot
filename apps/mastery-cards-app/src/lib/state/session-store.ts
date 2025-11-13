/**
 * Session State Management
 * Tracks current session progress, cards, scoring
 */

import { create } from 'zustand';
import type { CardSession } from '../../types/cards';
import { MVP_CARDS, getCurrentLevel, type Level, type MasteryCard } from '../cards/mvp-cards-data';

interface SessionState {
  // Student info
  studentName: string | null;
  
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
  currentLevel: Level;
  
  // Timing
  sessionStartTime: number | null;
  currentCardStartTime: number | null;
  
  // Actions
  setStudentName: (name: string) => void;
  startSession: (cards?: MasteryCard[]) => void;
  nextCard: () => void;
  awardPoints: (points: number, celebration?: string) => { leveledUp: boolean; newLevel?: Level };
  masteredCard: (cardId: string) => void;
  needsPracticeCard: (cardId: string) => void;
  resetStreak: () => void;
  endSession: () => CardSession | null;
  
  // Getters
  getProgress: () => { current: number; total: number; percentage: number };
}

export const useSessionStore = create<SessionState>((set, get) => ({
  // Initial state
  studentName: null,
  sessionId: null,
  currentCardIndex: 0,
  cardsInDeck: [],
  currentCard: null,
  cardsReviewed: 0,
  masteredToday: [],
  needsPractice: [],
  points: 0,
  streak: 0,
  currentLevel: getCurrentLevel(0), // Start at Level 1: Explorer
  sessionStartTime: null,
  currentCardStartTime: null,
  
  // Set student name
  setStudentName: (name) => {
    console.log('[Session] Student name set:', name);
    set({ studentName: name });
  },
  
  // Start a new session
  startSession: (cards = MVP_CARDS) => {
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
      currentLevel: getCurrentLevel(0),
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
  
  // Award points and check for level-up
  awardPoints: (points, celebration) => {
    const { points: currentPoints, currentLevel } = get();
    const newPoints = currentPoints + points;
    const newLevel = getCurrentLevel(newPoints);
    const leveledUp = newLevel.level > currentLevel.level;
    
    console.log(`[Session] +${points} points! Total: ${newPoints} (${celebration || 'Nice!'})`);
    
    if (leveledUp) {
      console.log(`[Session] 🎉 LEVEL UP! ${currentLevel.title} → ${newLevel.title}`);
    }
    
    set({
      points: newPoints,
      currentLevel: newLevel,
    });
    
    return {
      leveledUp,
      newLevel: leveledUp ? newLevel : undefined,
    };
  },
  
  // Card was mastered
  masteredCard: (cardId) => {
    const { streak, cardsReviewed, masteredToday } = get();
    
    console.log(`[Session] Card ${cardId} mastered! (streak: ${streak + 1})`);
    
    set({
      cardsReviewed: cardsReviewed + 1,
      masteredToday: [...masteredToday, cardId],
      streak: streak + 1,
    });
    
    // Points are awarded separately via awardPoints()
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
      level: state.currentLevel.level,
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
  

}));
