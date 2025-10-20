/**
 * API Request/Response Types
 * Privacy-first: No PII fields
 */

export interface AnalyzeRequest {
  sessionId: string;
  transcription: string;
  isFinal: boolean;
  lessonContext?: {
    lessonId: string;
    milestoneIndex: number;
    attempts: number;
    timeOnMilestone: number;
  };
}

export interface AnalyzeResponse {
  success: boolean;
  sessionId: string;
  misconception?: {
    detected: boolean;
    type?: string;
    confidence?: number;
    evidence?: string;
    intervention?: string;
    correctiveConcept?: string;
  };
  emotional?: {
    state: string;
    engagementLevel: number;
    frustrationLevel: number;
    confusionLevel: number;
    recommendation: string;
  };
  contextForMainAgent?: string;
  error?: string;
}

export interface SessionCreateResponse {
  sessionId: string;
  createdAt: number;
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: number;
  activeSessions: number;
}
