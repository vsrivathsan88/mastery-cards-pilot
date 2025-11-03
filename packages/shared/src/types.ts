export interface Event<T = any> {
  type: string;
  payload: T;
  timestamp: number;
  sessionId?: string;
}

export interface AudioChunk {
  data: ArrayBuffer | Uint8Array;
  timestamp: number;
  sampleRate?: number;
}

export interface TranscriptionEvent extends Event {
  type: 'transcription';
  payload: {
    text: string;
    isFinal: boolean;
    confidence?: number;
  };
}

export interface ResponseEvent extends Event {
  type: 'response';
  payload: {
    text?: string;
    audio?: ArrayBuffer;
    functionCall?: FunctionCall;
  };
}

export interface FunctionCall {
  name: string;
  args: Record<string, any>;
}

export interface SessionState {
  sessionId: string;
  status: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
  startTime?: number;
  endTime?: number;
  currentLesson?: LessonData;
  currentMilestone?: number;
  metadata?: Record<string, any>;
}

export interface LessonData {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  milestones: Milestone[];
  assets?: LessonAsset[];
  canvasInstructions?: CanvasDescription; // Canvas drawing context
  standards?: LessonStandard[];
  metadata?: Record<string, any>;
}

export interface LessonStandard {
  framework: 'CCSS' | 'NGSS' | 'state' | 'custom';
  code: string;
  description: string;
  coverage?: 'full' | 'partial' | 'introduction';
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  keywords?: string[];
  completed?: boolean;
  timestamp?: number;
}

export interface LessonAsset {
  type: 'image' | 'video' | 'audio' | 'interactive';
  url: string;
  alt?: string;
  description?: string; // Full text description for accessibility & vision agent
  metadata?: Record<string, any>;
}

export interface CanvasDescription {
  currentContext: string; // What student should be drawing/working on
  expectedElements?: string[]; // What we expect to see
  visualGuidance?: string; // Hints about what to draw
}

export interface EmotionalState {
  type: 'engaged' | 'frustrated' | 'confused' | 'bored';
  confidence: number;
  timestamp: number;
  reason?: string;
}

export type EventHandler<T = any> = (event: Event<T>) => void;

/**
 * Image Pedagogy Mapping Types
 * Maps visual assets to mastery goals and misconceptions for formative assessment
 */

export interface ImageMisconception {
  id: string;
  description: string;
  detectionCriteria: string[];
  evidenceKeywords: string[];
  confidenceThreshold: number;
}

export interface ImageResponseIndicators {
  indicators: string[];
  reasoning: string;
}

export interface ImageScaffolding {
  low: string;
  medium: string;
  high: string;
}

export interface AgentDrawingPrompts {
  initial: string; // First prompt to get student drawing
  encouragement: string; // If student hasn't started drawing
  guidance: string; // If student is stuck or drawing incorrectly
  completion: string; // When to ask student about their finished drawing
}

export interface DrawingExpectations {
  expectedElements: string[]; // What should appear in the drawing
  commonErrors: string[]; // What mistakes to watch for
  successIndicators: string[]; // Signs the drawing shows understanding
}

export interface ImagePedagogyData {
  id: string;
  order: number;
  imagePrompt: string;
  masteryGoals: string[];
  masteryGoalDescriptions: string[];
  misconceptionsToDetect: ImageMisconception[];
  assessmentType: string;
  assessmentQuestion: string;
  correctResponse: ImageResponseIndicators;
  incorrectResponse: ImageResponseIndicators;
  cognitiveLevel: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  difficulty: string;
  usedInMilestones: string[];
  scaffolding: ImageScaffolding;
  agentDrawingPrompts?: AgentDrawingPrompts; // NEW: How agent should prompt canvas usage
  drawingExpectations?: DrawingExpectations; // NEW: What to expect in canvas
  whenToPromptDrawing?: string; // NEW: When agent should encourage drawing
}

export interface ImagePedagogyMapping {
  lessonId: string;
  standard: string;
  description: string;
  totalImages: number;
  images: ImagePedagogyData[];
  usageGuidelines: {
    assessmentFlow: string;
    adaptivePathways: {
      strugglingLearner: string;
      onTrackLearner: string;
      advancedLearner: string;
    };
    misconceptionDetection: string;
    formativeAssessment: string;
  };
  metadata: {
    createdAt: string;
    author: string;
    version: string;
    totalImages: number;
    totalMasteryGoals: number;
    totalMisconceptions: number;
    notes: string;
  };
}
