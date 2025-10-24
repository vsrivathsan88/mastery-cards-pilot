/**
 * Teacher Panel Data Models
 * 
 * Types for tracking student progress, standards mastery,
 * and misconceptions during lessons.
 */

/**
 * Standards Coverage Tracking
 */
export interface StandardsCoverage {
  standardCode: string;          // e.g., "3.NF.A.1"
  standardDescription: string;    // Full standard text
  framework: string;              // e.g., "CCSS"
  percentComplete: number;        // 0-100
  objectives: ObjectiveCoverage[];
}

export interface ObjectiveCoverage {
  id: string;                     // e.g., "partition-shapes"
  description: string;            // What student should master
  status: 'not-started' | 'in-progress' | 'mastered';
  milestonesCompleted: string[];  // IDs of completed milestones
  evidenceSummary?: string;       // Brief note on mastery
}

/**
 * Mastery Milestone Logging
 */
export interface MasteryMilestoneLog {
  id: string;                     // Unique log entry ID
  milestoneId: string;            // From lesson JSON
  milestoneTitle: string;         // e.g., "Act 1: Luna's Birthday Challenge"
  timestamp: Date;
  status: 'started' | 'in-progress' | 'completed' | 'skipped';
  
  // Evidence of mastery
  studentResponse?: string;       // What they said/did
  piResponse?: string;            // How Pi reacted
  conceptsAddressed: string[];    // Which concepts were covered
  
  // Metadata
  timeSpent?: number;             // Seconds
  attemptsCount?: number;         // How many tries
}

/**
 * Misconception Detection & Resolution
 */
export interface MisconceptionLog {
  id: string;                     // Unique log entry ID
  timestamp: Date;
  
  // Misconception details
  misconceptionType: string;      // e.g., "equal-count-not-size"
  severity: 'low' | 'medium' | 'high';
  description: string;            // What the misconception is
  
  // Context
  milestoneId?: string;           // Where it occurred
  studentSaid: string;            // Exact quote
  trigger: string;                // What Pi said/asked that revealed it
  
  // Resolution
  status: 'detected' | 'addressed' | 'resolved' | 'persisting';
  interventionUsed?: string;      // How Pi addressed it
  piResponse?: string;            // What Pi said
  resolved?: boolean;             // Did student correct understanding?
  resolutionEvidence?: string;    // How we know it's resolved
  
  // Tracking
  recurrenceCount: number;        // How many times seen
  relatedObjectives: string[];    // Which learning objectives affected
}

/**
 * Session Summary
 */
export interface LessonSession {
  id: string;
  lessonId: string;
  lessonTitle: string;
  startTime: Date;
  endTime?: Date;
  
  // Progress
  milestonesCompleted: number;
  milestonesTotal: number;
  percentComplete: number;
  
  // Standards
  standardsCovered: StandardsCoverage[];
  
  // Issues
  misconceptionsDetected: number;
  misconceptionsResolved: number;
  
  // Engagement
  totalTimeSpent: number;         // Seconds
  averageResponseTime?: number;   // Seconds
  engagementScore?: number;       // 0-100
}

/**
 * Export Format
 */
export interface TeacherPanelExport {
  session: LessonSession;
  standards: StandardsCoverage[];
  milestones: MasteryMilestoneLog[];
  misconceptions: MisconceptionLog[];
  exportedAt: Date;
  format: 'json' | 'csv';
}
