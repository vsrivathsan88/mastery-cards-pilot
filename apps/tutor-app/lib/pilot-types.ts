/**
 * Pilot Study Data Types
 * 
 * Additional types for outcome tracking and evidence collection.
 * These extend existing teacher panel types without modifying them.
 */

import { MasteryMilestoneLog } from './teacher-panel-types';

/**
 * Outcome Evidence - Tracks procedural competence and correctness
 */
export interface OutcomeEvidence {
  // Task classification
  taskType: 'partition' | 'identify' | 'create' | 'explain' | 'transfer' | 'verify';
  taskDescription: string;
  
  // Correctness assessment
  correctness: 'correct' | 'partial' | 'incorrect' | 'not-assessed';
  confidenceLevel: number; // 0-1 (how confident we are in correctness assessment)
  
  // Canvas-based evidence (if applicable)
  canvasEvidence?: {
    shapesDrawn: string[];        // Types of shapes drawn
    correctPartitions: boolean;   // Did they partition correctly?
    equalityVerified: boolean;    // Are parts actually equal?
    partitionCount?: number;      // How many parts did they create?
    expectedCount?: number;       // How many parts were expected?
    visualAnalysis?: string;      // Vision API analysis summary
  };
  
  // Verbal evidence (transcript-based)
  verbalEvidence?: {
    explanation: string;          // What they said
    clarity: 'clear' | 'partial' | 'unclear';
    terminology: string[];        // Correct math terms used
    reasoning: 'strong' | 'developing' | 'minimal';
    selfCorrection: boolean;      // Did they catch their own error?
  };
  
  // Talk-out-loud metrics
  talkOutLoudMetrics: {
    prompted: boolean;            // Did Pi ask for explanation?
    responseProvided: boolean;    // Did student explain?
    unprompted: boolean;          // Did they volunteer reasoning?
    explanationLength: number;    // Word count of explanation
    reasoning: 'strong' | 'developing' | 'minimal';
    selfCorrection: boolean;      // Did talking help them self-correct?
  };
  
  // Transfer indicators (novel application)
  transferIndicators?: {
    novelContext: boolean;        // New shape/scenario not in lesson?
    independentApplication: boolean; // Applied without heavy scaffolding?
    strategyExplained: boolean;   // Explained their approach?
    connectionsMade: string[];    // Connections to prior learning
  };
  
  // Timestamps
  attemptStartTime: number;
  attemptEndTime: number;
  timeSpent: number; // seconds
}

/**
 * Enhanced Milestone Log - Extends existing type with pilot data
 */
export interface EnhancedMilestoneLog extends MasteryMilestoneLog {
  // Pilot additions
  outcomeEvidence?: OutcomeEvidence;
  masteryGoalsAddressed: string[];   // MG IDs from mastery-goals-3-nf-a-1.json
  assessmentType?: 'formative' | 'checkpoint' | 'transfer' | 'practice';
  
  // Tool interactions during this milestone
  toolCallsUsed?: {
    name: string;
    timestamp: number;
    purpose: string;
  }[];
}

/**
 * Session Outcomes Summary - Overall performance metrics
 */
export interface SessionOutcomesSummary {
  sessionId: string;
  lessonId: string;
  timestamp: Date;
  
  // Conceptual mastery (existing metrics)
  conceptualMastery: {
    percentComplete: number;        // 0-100
    masteryGoalsCompleted: string[];
    milestonesCompleted: number;
    totalMilestones: number;
  };
  
  // Procedural competency (NEW)
  proceduralCompetency: {
    overallAccuracy: number;        // 0-100
    taskBreakdown: {
      partitioning: { attempted: number; correct: number; partial: number };
      identification: { attempted: number; correct: number; partial: number };
      creation: { attempted: number; correct: number; partial: number };
      verification: { attempted: number; correct: number; partial: number };
      transfer: { attempted: number; correct: number; partial: number };
    };
    averageConfidence: number;      // 0-1
  };
  
  // Talk-out-loud metrics (NEW)
  talkOutLoudMetrics: {
    totalPrompts: number;           // How many times Pi asked for explanation
    responsesGiven: number;         // How many times student explained
    responseRate: number;           // responsesGiven / totalPrompts
    averageClarity: number;         // 0-100 score
    unpromptedExplanations: number; // Voluntary reasoning
    selfCorrections: number;        // Caught own errors by talking through it
    averageExplanationLength: number; // Words per explanation
  };
  
  // Transfer & application (NEW)
  transferMetrics: {
    novelProblemsAttempted: number;
    novelProblemsCorrect: number;
    transferSuccessRate: number;    // 0-100
    independentStrategies: number;
    connectionsMade: string[];
  };
  
  // Correlation analysis
  correlations: {
    talkOutLoudVsAccuracy: number;  // -1 to 1
    conceptualVsProcedural: number; // -1 to 1
    engagementVsOutcomes: number;   // -1 to 1
  };
  
  // Time metrics
  totalTimeSpent: number;           // seconds
  averageTimePerTask: number;
  averageTimePerMilestone: number;
  
  // Tool usage stats
  toolUsageStats: {
    canvasDrawingByPi: number;
    canvasLabelsByPi: number;
    emojiReactionsByPi: number;
    totalToolCalls: number;
  };
}

/**
 * Checkpoint Task - Embedded assessment point
 */
export interface CheckpointTask {
  id: string;
  milestoneId: string;
  type: 'verification' | 'transfer' | 'novel-application';
  prompt: string;
  expectedResponse: {
    type: 'canvas' | 'verbal' | 'both';
    correctIndicators: string[];
    incorrectIndicators: string[];
  };
  assessmentCriteria: {
    concept: string;
    procedureRequired: string;
    successThreshold: number; // 0-1
  };
}

/**
 * Export format for pilot data
 */
export interface PilotDataExport {
  metadata: {
    sessionId: string;
    studentId?: string;
    lessonId: string;
    timestamp: Date;
    pilotVersion: string;
  };
  
  summary: SessionOutcomesSummary;
  milestones: EnhancedMilestoneLog[];
  
  // Raw data for analysis
  rawTranscripts: {
    timestamp: number;
    speaker: 'student' | 'pi';
    text: string;
    isFinal: boolean;
  }[];
  
  canvasSnapshots: {
    timestamp: number;
    milestoneId: string;
    imageData?: string; // base64
    visionAnalysis?: string;
  }[];
  
  exportedAt: Date;
  format: 'json' | 'csv';
}
