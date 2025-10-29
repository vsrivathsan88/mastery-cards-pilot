/**
 * ⚠️ DEBUG ONLY - Agent Activity Monitoring Store
 * 
 * This entire file is for DEVELOPMENT/DEBUG purposes only.
 * Used to monitor agent activity in real-time via Teacher Panel.
 * 
 * TO REMOVE: Delete this file and all references to useAgentDebugStore
 */

import { create } from 'zustand';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DEBUG: Agent Activity Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface DebugAgentActivity {
  turn: number;
  timestamp: number;
  agent: 'misconception' | 'emotional' | 'prerequisite';
  status: 'running' | 'complete' | 'error';
  duration?: number;
  result?: any;
}

export interface DebugPrerequisiteGap {
  turn: number;
  timestamp: number;
  prerequisiteId: string;
  concept: string;
  status: 'GAP_DETECTED' | 'PREREQUISITE_MET' | 'UNCLEAR' | 'PROBE_DEEPER';
  confidence: number;
  evidence?: string;
  nextAction: 'CONTINUE_LESSON' | 'TEACH_PREREQUISITE' | 'PROBE_DEEPER' | 'RE_ASSESS';
  detectedGap?: {
    type: 'UNKNOWN_CONCEPT' | 'WRONG_INTUITION' | 'CONFUSION' | 'AVOIDANCE';
    severity: 'critical' | 'moderate' | 'minor';
    recommendation: string;
  };
  resolved?: boolean;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DEBUG: Store Interface
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface AgentDebugStore {
  // Debug Mode
  isDebugMode: boolean;
  toggleDebugMode: () => void;
  
  // Agent Activities
  activities: DebugAgentActivity[];
  addActivity: (activity: DebugAgentActivity) => void;
  clearActivities: () => void;
  
  // Prerequisite Gaps
  prerequisiteGaps: DebugPrerequisiteGap[];
  addPrerequisiteGap: (gap: DebugPrerequisiteGap) => void;
  resolvePrerequisiteGap: (prerequisiteId: string) => void;
  clearPrerequisiteGaps: () => void;
  
  // Full Reset
  reset: () => void;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DEBUG: Store Implementation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const useAgentDebugStore = create<AgentDebugStore>((set) => ({
  // Debug mode (enable/disable monitoring)
  isDebugMode: true, // Set to TRUE for development
  
  toggleDebugMode: () => set((state) => {
    console.log('[DEBUG] Agent monitoring toggled:', !state.isDebugMode);
    return { isDebugMode: !state.isDebugMode };
  }),
  
  // Agent activities
  activities: [],
  
  addActivity: (activity) => set((state) => {
    if (!state.isDebugMode) return state;
    
    console.log('[DEBUG] Agent activity:', activity);
    
    return {
      activities: [...state.activities, activity]
    };
  }),
  
  clearActivities: () => set({ activities: [] }),
  
  // Prerequisite gaps
  prerequisiteGaps: [],
  
  addPrerequisiteGap: (gap) => set((state) => {
    if (!state.isDebugMode) return state;
    
    console.log('[DEBUG] Prerequisite gap:', gap);
    
    return {
      prerequisiteGaps: [...state.prerequisiteGaps, gap]
    };
  }),
  
  resolvePrerequisiteGap: (prerequisiteId) => set((state) => {
    if (!state.isDebugMode) return state;
    
    console.log('[DEBUG] Resolving prerequisite gap:', prerequisiteId);
    
    return {
      prerequisiteGaps: state.prerequisiteGaps.map(gap =>
        gap.prerequisiteId === prerequisiteId
          ? { ...gap, resolved: true }
          : gap
      )
    };
  }),
  
  clearPrerequisiteGaps: () => set({ prerequisiteGaps: [] }),
  
  // Full reset
  reset: () => set({
    activities: [],
    prerequisiteGaps: [],
  }),
}));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DEBUG: Helper Functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Check if agent debugging is enabled
 * Use this to conditionally enable debug features
 */
export function isAgentDebugEnabled(): boolean {
  return useAgentDebugStore.getState().isDebugMode;
}

/**
 * Log agent debug info (only if debug mode enabled)
 */
export function debugLog(message: string, data?: any) {
  if (isAgentDebugEnabled()) {
    console.log(`[DEBUG AGENT] ${message}`, data || '');
  }
}
