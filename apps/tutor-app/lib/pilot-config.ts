/**
 * Pilot Mode Configuration
 * 
 * Feature flags for outcome-tracking pilot study.
 * Enable by setting VITE_PILOT_MODE=true in .env.local
 */

export const PILOT_MODE = {
  // Master switch - enable all pilot features
  enabled: import.meta.env.VITE_PILOT_MODE === 'true',
  
  // Individual feature toggles
  features: {
    // New tool calls for Pi
    canvasDrawingTool: true,    // Pi can draw shapes on canvas
    canvasLabelTool: true,       // Pi can add text annotations
    emojiReactionTool: true,     // Pi can send emoji reactions
    
    // Outcome tracking
    outcomeEvidence: true,       // Collect procedural evidence
    talkOutLoudMetrics: true,    // Track explanation quality
    transferAssessment: true,    // Novel problem checkpoints
    
    // Enhanced teacher panel
    outcomesSummaryView: true,   // Procedural outcomes dashboard
    exportEnhancedData: true,    // Export with outcome data
  },
  
  // Pilot study settings
  study: {
    sessionId: `pilot-${Date.now()}`,
    version: '1.0.0',
    dataCollectionEnabled: true,
  },
} as const;

// Type helper for feature checks
export function isPilotFeatureEnabled(feature: keyof typeof PILOT_MODE.features): boolean {
  return PILOT_MODE.enabled && PILOT_MODE.features[feature];
}

// Log pilot mode status on import
if (PILOT_MODE.enabled) {
  console.log('🧪 PILOT MODE ENABLED');
  console.log('Features:', Object.entries(PILOT_MODE.features)
    .filter(([_, enabled]) => enabled)
    .map(([name]) => name)
    .join(', '));
}
