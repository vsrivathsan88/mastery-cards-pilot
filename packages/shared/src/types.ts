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
  metadata?: Record<string, any>;
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
  metadata?: Record<string, any>;
}

export interface EmotionalState {
  type: 'engaged' | 'frustrated' | 'confused' | 'bored';
  confidence: number;
  timestamp: number;
  reason?: string;
}

export type EventHandler<T = any> = (event: Event<T>) => void;
