/**
 * Emoji Reaction Store
 * 
 * Global state for emoji reactions triggered by Pi's tool calls.
 */

import { create } from 'zustand';

interface Reaction {
  id: string;
  emoji: string;
  intensity: 'subtle' | 'normal' | 'celebration';
  position: 'avatar' | 'center' | 'canvas';
  duration: number;
  reason: string;
  timestamp: number;
}

interface EmojiReactionStore {
  currentReaction: Reaction | null;
  reactionHistory: Reaction[];
  
  showReaction: (
    emoji: string,
    intensity?: 'subtle' | 'normal' | 'celebration',
    duration?: number,
    position?: 'avatar' | 'center' | 'canvas',
    reason?: string
  ) => void;
  
  clearReaction: () => void;
  
  getReactionHistory: () => Reaction[];
}

export const useEmojiReactionStore = create<EmojiReactionStore>((set, get) => ({
  currentReaction: null,
  reactionHistory: [],
  
  showReaction: (
    emoji: string,
    intensity: 'subtle' | 'normal' | 'celebration' = 'normal',
    duration: number = 2,
    position: 'avatar' | 'center' | 'canvas' = 'avatar',
    reason: string = ''
  ) => {
    const reaction: Reaction = {
      id: Date.now().toString(),
      emoji,
      intensity,
      position,
      duration,
      reason,
      timestamp: Date.now(),
    };
    
    set({
      currentReaction: reaction,
      reactionHistory: [...get().reactionHistory, reaction].slice(-20), // Keep last 20
    });
    
    // Auto-clear after duration
    setTimeout(() => {
      set({ currentReaction: null });
    }, duration * 1000);
  },
  
  clearReaction: () => {
    set({ currentReaction: null });
  },
  
  getReactionHistory: () => {
    return get().reactionHistory;
  },
}));
