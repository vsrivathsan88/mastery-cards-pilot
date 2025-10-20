import { Annotation } from '@langchain/langgraph';
import { LessonData, Milestone } from '@simili/shared';

/**
 * Multi-agent state schema for LangGraph
 * This is the source of truth for all agent state
 */

export interface MisconceptionResult {
  detected: boolean;
  type?: string;
  confidence?: number;
  evidence?: string;
  intervention?: string;
  correctiveConcept?: string;
}

export interface EmotionalResult {
  state: string;
  engagementLevel: number;
  frustrationLevel: number;
  confusionLevel: number;
  indicators: string[];
  trend: string;
  recommendation: string;
}

export interface VisionResult {
  description: string;
  interpretation: string;
  suggestion: string;
  confidence: number;
  needsVoiceOver: boolean;
}

/**
 * LangGraph State Annotation
 * Defines the shape of state that flows through the graph
 */
export const AgentState = Annotation.Root({
  // Input
  transcription: Annotation<string>,
  isFinal: Annotation<boolean>,
  turnNumber: Annotation<number>,
  
  // Lesson context
  lesson: Annotation<LessonData | undefined>,
  currentMilestone: Annotation<Milestone | undefined>,
  milestoneIndex: Annotation<number>,
  attempts: Annotation<number>,
  timeOnMilestone: Annotation<number>,
  
  // Subagent results
  misconception: Annotation<MisconceptionResult | null>,
  emotional: Annotation<EmotionalResult | null>,
  vision: Annotation<VisionResult | null>,
  
  // History (for context)
  transcriptionHistory: Annotation<string[]>,
  
  // Output to Main Agent
  contextForMainAgent: Annotation<string>,
  
  // Metadata
  timestamp: Annotation<number>,
  sessionId: Annotation<string>,
});

export type AgentStateType = typeof AgentState.State;
