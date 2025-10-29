// Browser-safe exports (NO LangGraph dependencies)
export { AgentOrchestrator } from './agent-orchestrator-browser';
export { PedagogyEngine } from './pedagogy/PedagogyEngine';
export type { PedagogyEvents, LessonProgress } from './pedagogy/PedagogyEngine';
export { PromptManager } from './prompts/PromptManager';
export type { PromptContext } from './prompts/PromptManager';
export { SIMILI_SYSTEM_PROMPT } from './prompts/static-system-prompt';
export { 
  formatLessonContext, 
  formatMilestoneTransition,
  formatMisconceptionFeedback,
  formatEmotionalFeedback 
} from './prompts/lesson-context-formatter';
export type { LessonContextOptions } from './prompts/lesson-context-formatter';
export {
  formatCanvasContext,
  formatImageDescription,
  formatVisionFeedback
} from './prompts/canvas-context-formatter';
export type { CanvasState } from './prompts/canvas-context-formatter';
export { ContextManager } from './context/ContextManager';
export type { SessionContext, MisconceptionContext, EmotionalContext, VisionContext, MilestoneContext, PrerequisiteGapContext } from './context/ContextManager';
export { InstructionFormatter } from './context/InstructionFormatter';
export type { GeminiLiveInstruction, MisconceptionObservation, EmotionalObservation, LessonProgressObservation } from './context/InstructionFormatter';
export { FillerManager, FillerType } from './context/FillerManager';
export type { FillerOptions } from './context/FillerManager';

// Subagents (LLM-powered classifiers)
export { EmotionalClassifier } from './subagents/EmotionalClassifier';
export type { EmotionalState } from './subagents/EmotionalClassifier';
export { MisconceptionClassifier } from './subagents/MisconceptionClassifier';
export type { MisconceptionAnalysisInput, MisconceptionAnalysisResult } from './subagents/MisconceptionClassifier';
export { PrerequisiteDetector } from './subagents/PrerequisiteDetector';
export type { PrerequisiteAnalysisInput, PrerequisiteAnalysisResult, PrerequisiteSpec } from './subagents/PrerequisiteDetector';

// Server-only exports (requires Node.js, has LangGraph)
// Import these only in backend: import { MultiAgentGraph } from '@simili/agents/server'
// Note: For now, backend imports directly from files to avoid browser bundling issues
