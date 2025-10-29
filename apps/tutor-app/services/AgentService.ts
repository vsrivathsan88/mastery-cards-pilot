/**
 * AgentService - Central orchestration for all agents
 * 
 * Responsibilities:
 * - Coordinate EmotionalClassifier, MisconceptionClassifier, VisionAgent
 * - Run agents in parallel for performance
 * - Aggregate insights into SessionContext
 * - Emit context updates for system prompt injection
 * - Handle agent failures gracefully
 */

import EventEmitter from 'eventemitter3';
import { LessonData } from '@simili/shared';
import { AgentOrchestrator } from '@simili/agents';
import type { 
  SessionContext, 
  EmotionalContext, 
  MisconceptionContext,
  VisionContext 
} from '@simili/agents';
import { 
  EmotionalClassifier, 
  MisconceptionClassifier,
  PrerequisiteDetector
} from '@simili/agents';
import type { 
  EmotionalState, 
  MisconceptionAnalysisInput, 
  MisconceptionAnalysisResult,
  PrerequisiteAnalysisInput,
  PrerequisiteAnalysisResult
} from '@simili/agents';

const logger = {
  info: (msg: string, data?: any) => console.log(`[AgentService] 📊 ${msg}`, data || ''),
  warn: (msg: string, data?: any) => console.warn(`[AgentService] ⚠️ ${msg}`, data || ''),
  error: (msg: string, data?: any) => console.error(`[AgentService] ❌ ${msg}`, data || ''),
  debug: (msg: string, data?: any) => console.debug(`[AgentService] 🔍 ${msg}`, data || ''),
};

export interface AgentInsights {
  emotional?: EmotionalContext;
  misconception?: MisconceptionContext;
  vision?: VisionContext;
  processingTime: number;
}

export interface AgentServiceEvents {
  context_updated: (context: SessionContext) => void;
  insights_ready: (insights: AgentInsights) => void;
  agents_started: () => void;
  agents_completed: (duration: number) => void;
  agent_error: (agentName: string, error: Error) => void;
}

export class AgentService extends EventEmitter<AgentServiceEvents> {
  private orchestrator: AgentOrchestrator;
  private currentLesson?: LessonData;
  private isProcessing: boolean = false;
  private lastAnalysisTime: number = 0;
  
  // Real agent classifiers
  private emotionalClassifier: EmotionalClassifier;
  private misconceptionClassifier: MisconceptionClassifier;
  private prerequisiteDetector: PrerequisiteDetector;
  
  // Agent execution tracking
  private agentTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private readonly AGENT_TIMEOUT_MS = 2000; // 2 second max per agent
  
  constructor() {
    super();
    this.orchestrator = new AgentOrchestrator();
    
    // Initialize real agents with API key
    const apiKey = process.env.GEMINI_API_KEY as string;
    if (!apiKey) {
      logger.warn('GEMINI_API_KEY not found - agents will fail at runtime');
    }
    
    this.emotionalClassifier = new EmotionalClassifier(apiKey);
    this.misconceptionClassifier = new MisconceptionClassifier(apiKey);
    this.prerequisiteDetector = new PrerequisiteDetector(apiKey);
    
    logger.info('Initialized with real LLM agents (Emotional, Misconception, Prerequisite)');
  }

  /**
   * Initialize with lesson context
   */
  public async initialize(lesson: LessonData): Promise<void> {
    logger.info('Initializing with lesson', { 
      id: lesson.id, 
      title: lesson.title 
    });
    
    this.currentLesson = lesson;
    this.orchestrator.setLesson(lesson);
    
    // Reset context for new lesson
    this.orchestrator.getContextManager().reset();
    
    logger.info('Initialization complete');
  }

  /**
   * Analyze student transcription through agents
   * This runs in parallel and returns quickly
   */
  public async analyzeTranscription(
    text: string,
    conversationHistory?: string[]
  ): Promise<AgentInsights> {
    if (!this.currentLesson) {
      logger.warn('No lesson loaded, skipping analysis');
      return { processingTime: 0 };
    }

    if (this.isProcessing) {
      logger.warn('Already processing, skipping duplicate analysis');
      return { processingTime: 0 };
    }

    this.isProcessing = true;
    this.emit('agents_started');
    
    const startTime = Date.now();
    logger.info('Starting agent analysis', { text });

    try {
      // Run agents in parallel (none block each other)
      const [emotional, misconception] = await Promise.allSettled([
        this.analyzeEmotionalState(text, conversationHistory),
        this.analyzeMisconception(text),
      ]);

      const insights: AgentInsights = {
        processingTime: Date.now() - startTime,
      };

      // Extract results from Promise.allSettled
      if (emotional.status === 'fulfilled' && emotional.value) {
        insights.emotional = emotional.value;
        this.orchestrator.getContextManager().updateEmotionalContext(emotional.value);
      } else if (emotional.status === 'rejected') {
        this.emit('agent_error', 'EmotionalClassifier', emotional.reason);
      }

      if (misconception.status === 'fulfilled' && misconception.value) {
        insights.misconception = misconception.value;
        this.orchestrator.getContextManager().addMisconception(misconception.value);
      } else if (misconception.status === 'rejected') {
        this.emit('agent_error', 'MisconceptionClassifier', misconception.reason);
      }

      // Increment turn counter
      this.orchestrator.getContextManager().incrementTurn();

      // Get updated context
      const context = this.orchestrator.getContextManager().getContext();
      
      logger.info('Agent analysis complete', {
        duration: insights.processingTime,
        hasEmotional: !!insights.emotional,
        hasMisconception: !!insights.misconception,
      });

      this.emit('insights_ready', insights);
      this.emit('context_updated', context);
      this.emit('agents_completed', insights.processingTime);
      
      this.lastAnalysisTime = insights.processingTime;
      return insights;
      
    } catch (error) {
      logger.error('Agent analysis failed', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Analyze canvas + image through vision agent
   * Called when student says "look at this" or periodically
   */
  public async analyzeVision(
    canvasSnapshot: string, // base64 or data URL
    lessonImageUrl?: string
  ): Promise<VisionContext | null> {
    logger.info('Starting vision analysis');
    
    try {
      // TODO: Call backend vision analysis API or use Gemini multimodal
      // For now, return mock data
      const visionContext: VisionContext = {
        timestamp: Date.now(),
        description: 'Vision analysis in progress...',
        interpretation: 'Analyzing student work...',
        suggestion: 'Continue observing',
        confidence: 0.5,
        needsVoiceOver: true,
      };
      
      this.orchestrator.getContextManager().updateVisionContext(visionContext);
      
      // Emit context update
      const context = this.orchestrator.getContextManager().getContext();
      this.emit('context_updated', context);
      
      logger.info('Vision analysis complete', { confidence: visionContext.confidence });
      return visionContext;
      
    } catch (error) {
      logger.error('Vision analysis failed', error);
      this.emit('agent_error', 'VisionAgent', error as Error);
      return null;
    }
  }

  /**
   * Get current aggregated context
   */
  public getCurrentContext(): SessionContext {
    return this.orchestrator.getContextManager().getContext();
  }

  /**
   * Get formatted context for Gemini Live
   */
  public getFormattedContext(): string {
    return this.orchestrator.getContextManager().formatContextAsJSON();
  }

  /**
   * Check if agents are currently processing
   */
  public isProcessingAgents(): boolean {
    return this.isProcessing;
  }

  /**
   * Get last analysis duration (for filler timing)
   */
  public getLastAnalysisDuration(): number {
    return this.lastAnalysisTime;
  }

  /**
   * PRIVATE: Analyze emotional state using real LLM
   */
  private async analyzeEmotionalState(
    text: string,
    history?: string[]
  ): Promise<EmotionalContext | null> {
    logger.debug('Analyzing emotional state with LLM', { text });
    
    try {
      // Call real EmotionalClassifier
      const result: EmotionalState = await this.emotionalClassifier.analyze(text, history);
      
      // Convert EmotionalState to EmotionalContext
      const emotional: EmotionalContext = {
        timestamp: Date.now(),
        state: result.state,
        engagementLevel: result.engagementLevel,
        frustrationLevel: result.frustrationLevel,
        confusionLevel: result.confusionLevel,
        indicators: result.evidence,
        trend: 'stable', // Could be enhanced with historical tracking
        recommendation: result.recommendation,
      };
      
      logger.info('✅ LLM emotional analysis complete', { 
        state: emotional.state,
        engagement: emotional.engagementLevel,
        confidence: result.confidence
      });
      
      return emotional;
    } catch (error) {
      logger.error('EmotionalClassifier failed, falling back to neutral', error);
      
      // Fallback to neutral state
      return {
        timestamp: Date.now(),
        state: 'engaged',
        engagementLevel: 0.5,
        frustrationLevel: 0,
        confusionLevel: 0,
        indicators: [],
        trend: 'stable',
        recommendation: 'Continue with current approach',
      };
    }
  }

  /**
   * PRIVATE: Analyze for misconceptions using real LLM
   */
  private async analyzeMisconception(
    text: string
  ): Promise<MisconceptionContext | null> {
    if (!this.currentLesson) {
      logger.warn('No lesson context for misconception analysis');
      return null;
    }
    
    logger.debug('Analyzing for misconceptions with LLM', { text });
    
    try {
      // Prepare input for MisconceptionClassifier
      const input: MisconceptionAnalysisInput = {
        transcription: text,
        lesson: this.currentLesson,
        knownMisconceptions: (this.currentLesson as any).misconceptions || [],
      };
      
      // Call real MisconceptionClassifier
      const result: MisconceptionAnalysisResult = await this.misconceptionClassifier.analyze(input);
      
      // Only return if misconception detected
      if (!result.detected) {
        logger.debug('No misconceptions detected by LLM');
        return null;
      }
      
      // Convert to MisconceptionContext
      const misconception: MisconceptionContext = {
        turn: this.orchestrator.getContextManager().getCurrentTurn(),
        detected: true,
        type: result.type || 'unknown',
        confidence: result.confidence || 0.7,
        evidence: result.evidence || text,
        intervention: result.intervention || 'Address this misconception gently',
        correctiveConcept: result.correctiveConcept || 'Guide toward correct understanding',
        resolved: false,
      };
      
      logger.info('⚠️ LLM detected misconception!', { 
        type: misconception.type,
        confidence: misconception.confidence
      });
      
      return misconception;
    } catch (error) {
      logger.error('MisconceptionClassifier failed', error);
      return null;
    }
  }

  /**
   * Check prerequisite knowledge (only call during wonder hooks or early lesson)
   * This should NOT run on every turn to avoid long wait times
   */
  public async checkPrerequisite(
    transcription: string,
    prerequisiteId: string,
    isWonderHook: boolean = false
  ): Promise<PrerequisiteAnalysisResult | null> {
    if (!this.currentLesson) {
      logger.warn('No lesson loaded for prerequisite check');
      return null;
    }

    logger.info('🔍 Checking prerequisite', { prerequisiteId, isWonderHook });

    try {
      // Load prerequisites from lesson
      const prerequisites = (this.currentLesson as any).prerequisitesDetailed || [];
      const prerequisite = prerequisites.find((p: any) => p.id === prerequisiteId);

      if (!prerequisite) {
        logger.warn('Prerequisite not found in lesson', { prerequisiteId });
        return null;
      }

      // Prepare input for PrerequisiteDetector
      const input: PrerequisiteAnalysisInput = {
        transcription,
        prerequisite,
        isWonderHook,
      };

      // Call detector
      const result = await this.prerequisiteDetector.analyze(input);

      logger.info('✅ Prerequisite check complete', {
        prerequisiteId,
        status: result.status,
        confidence: result.confidence,
      });

      // Update context manager if gap detected
      if (result.status === 'GAP_DETECTED' && result.detectedGap) {
        const gapContext = {
          turn: this.orchestrator.getContextManager().getCurrentTurn(),
          timestamp: Date.now(),
          prerequisiteId: result.prerequisiteId,
          concept: result.concept,
          status: result.status,
          confidence: result.confidence,
          evidence: result.evidence || '',
          nextAction: result.nextAction,
          detectedGap: result.detectedGap,
          resolved: false,
        };
        
        // Store in context manager
        this.orchestrator.getContextManager().addPrerequisiteGap(gapContext);
        
        // Emit context update
        const context = this.orchestrator.getContextManager().getContext();
        this.emit('context_updated', context);
      }

      return result;
    } catch (error) {
      logger.error('Prerequisite check failed', error);
      this.emit('agent_error', 'PrerequisiteDetector', error as Error);
      return null;
    }
  }

  /**
   * Utility: delay for simulating agent processing
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.agentTimeouts.forEach(timeout => clearTimeout(timeout));
    this.agentTimeouts.clear();
    this.removeAllListeners();
    logger.info('Destroyed');
  }
}
