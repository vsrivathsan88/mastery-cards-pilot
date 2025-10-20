import { SessionState, LessonData, Milestone } from '@simili/shared';
import { GenAILiveClient } from '@simili/core-engine';
import { PedagogyEngine } from './pedagogy/PedagogyEngine';
import { ContextManager } from './context/ContextManager';
import { FillerManager } from './context/FillerManager';
import { MultiAgentGraph } from './graph/agent-graph';
import { createLogger } from './utils/logger';

const logger = createLogger({ prefix: '[AgentOrchestrator]' });

/**
 * AgentOrchestrator V2 - LangGraph Integration
 * 
 * Orchestrates multi-agent system using LangGraph while maintaining
 * backward compatibility with existing Gemini Live client.
 */
export class AgentOrchestrator {
  private sessionState: SessionState;
  private client?: GenAILiveClient;
  private pedagogyEngine: PedagogyEngine;
  private fillerManager: FillerManager;
  private multiAgentGraph: MultiAgentGraph;
  private milestoneStartTime?: number;
  private milestoneAttempts: number = 0;
  private turnNumber: number = 0;

  constructor(geminiApiKey?: string) {
    this.sessionState = {
      sessionId: this.generateSessionId(),
      status: 'idle',
    };
    
    this.pedagogyEngine = new PedagogyEngine();
    this.fillerManager = new FillerManager();
    
    // Initialize MultiAgentGraph with error handling for browser compatibility
    try {
      this.multiAgentGraph = new MultiAgentGraph(geminiApiKey);
      logger.info('Initialized with LangGraph multi-agent system');
    } catch (error) {
      logger.warn('LangGraph initialization failed, using fallback mode', { error });
      // Create a minimal stub that won't crash
      this.multiAgentGraph = null as any;
    }
    
    this.setupPedagogyListeners();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public setClient(client: GenAILiveClient) {
    this.client = client;
    this.subscribeToEvents();
  }

  private subscribeToEvents() {
    if (!this.client) return;

    this.client.on('open', () => {
      logger.info('[AgentOrchestrator] Connection opened');
      this.sessionState.status = 'connected';
      this.sessionState.startTime = Date.now();
    });

    this.client.on('close', (event) => {
      logger.info('[AgentOrchestrator] Connection closed', { 
        code: event.code, 
        reason: event.reason 
      });
      this.sessionState.status = 'disconnected';
      this.sessionState.endTime = Date.now();
    });

    this.client.on('error', (error) => {
      logger.error('[AgentOrchestrator] Error occurred', { message: error.message });
      this.sessionState.status = 'error';
    });

    this.client.on('inputTranscription', (text, isFinal) => {
      logger.info('[AgentOrchestrator] Input transcription', { text, isFinal });
      this.handleInputTranscription(text, isFinal);
    });

    this.client.on('outputTranscription', (text, isFinal) => {
      logger.info('[AgentOrchestrator] Output transcription', { text, isFinal });
    });

    this.client.on('audio', (data) => {
      logger.debug('[AgentOrchestrator] Audio received', { size: data.byteLength });
    });

    this.client.on('toolcall', (toolCall) => {
      logger.info('[AgentOrchestrator] Tool call received', toolCall);
    });

    this.client.on('turncomplete', () => {
      logger.debug('[AgentOrchestrator] Turn complete');
    });

    this.client.on('interrupted', () => {
      logger.info('[AgentOrchestrator] Interrupted');
    });
  }

  /**
   * Handle incoming transcription - routes through LangGraph
   */
  private async handleInputTranscription(text: string, isFinal: boolean) {
    // Increment turn counter on final transcriptions
    if (isFinal) {
      this.turnNumber++;
      logger.info('[AgentOrchestrator] Processing final transcription', {
        text,
        turn: this.turnNumber,
      });
    }

    // Pass to pedagogy engine for keyword detection (fast path)
    this.pedagogyEngine.processTranscription(text, isFinal);

    // Only run multi-agent analysis on final transcriptions
    if (isFinal) {
      await this.runMultiAgentAnalysis(text);
    }
  }

  /**
   * Run multi-agent analysis through LangGraph
   */
  private async runMultiAgentAnalysis(transcription: string) {
    // Skip if LangGraph failed to initialize
    if (!this.multiAgentGraph) {
      logger.debug('Multi-agent analysis skipped (fallback mode)');
      return;
    }

    try {
      const lesson = this.pedagogyEngine.getCurrentLesson();
      const milestone = this.pedagogyEngine.getCurrentMilestone();
      const progress = this.pedagogyEngine.getProgress();

      if (!lesson || !milestone || !progress) {
        logger.warn('Missing lesson context, skipping analysis');
        return;
      }

      const timeOnMilestone = this.milestoneStartTime
        ? Date.now() - this.milestoneStartTime
        : 0;

      // Run through LangGraph
      const result = await this.multiAgentGraph.run({
        transcription,
        isFinal: true,
        turnNumber: this.turnNumber,
        lesson,
        currentMilestone: milestone,
        milestoneIndex: progress.currentMilestoneIndex,
        attempts: this.milestoneAttempts,
        timeOnMilestone,
        sessionId: this.sessionState.sessionId,
      });

      logger.info('Multi-agent analysis complete', {
        misconceptionDetected: result.misconception?.detected,
        contextLength: result.contextForMainAgent?.length,
      });

      // Context is now available for next turn (buffered approach)
      // Will be injected into Main Agent's system prompt

    } catch (error) {
      logger.error('Multi-agent analysis failed', { error });
      // Graceful degradation - continue without subagent analysis
    }
  }

  private setupPedagogyListeners() {
    this.pedagogyEngine.on('milestone_detected', (milestone, transcription) => {
      this.milestoneAttempts++;
      logger.info('[AgentOrchestrator] Milestone detected', {
        milestone: milestone.title,
        transcription,
        attempts: this.milestoneAttempts,
      });
    });

    this.pedagogyEngine.on('milestone_completed', (milestone) => {
      logger.info('[AgentOrchestrator] Milestone completed!', {
        milestone: milestone.title,
        timestamp: milestone.timestamp,
        attempts: this.milestoneAttempts,
      });
      
      // Reset for next milestone
      this.milestoneAttempts = 0;
      this.milestoneStartTime = Date.now();
    });

    this.pedagogyEngine.on('lesson_started', (lesson) => {
      logger.info('[AgentOrchestrator] Lesson started', {
        lessonId: lesson.id,
        title: lesson.title,
      });
      
      this.milestoneStartTime = Date.now();
      this.milestoneAttempts = 0;
    });

    this.pedagogyEngine.on('lesson_completed', (lesson) => {
      logger.info('[AgentOrchestrator] Lesson completed!', {
        lessonId: lesson.id,
        title: lesson.title,
      });
    });

    this.pedagogyEngine.on('progress_update', (progress) => {
      logger.debug('[AgentOrchestrator] Progress update', progress);
    });
  }

  public setLesson(lesson: LessonData) {
    this.sessionState.currentLesson = lesson;
    this.sessionState.currentMilestone = 0;
    this.pedagogyEngine.loadLesson(lesson);
    this.milestoneStartTime = Date.now();
    this.milestoneAttempts = 0;
    
    logger.info('[AgentOrchestrator] Lesson set', { 
      lessonId: lesson.id, 
      title: lesson.title 
    });
  }

  public getPedagogyEngine(): PedagogyEngine {
    return this.pedagogyEngine;
  }

  public getContextManager(): ContextManager {
    if (!this.multiAgentGraph) {
      // Fallback: create a basic ContextManager
      return new ContextManager();
    }
    return this.multiAgentGraph.getContextManager();
  }

  public getFillerManager(): FillerManager {
    return this.fillerManager;
  }

  public getMultiAgentGraph(): MultiAgentGraph | null {
    return this.multiAgentGraph;
  }

  public getSessionState(): SessionState {
    return { ...this.sessionState };
  }
}
