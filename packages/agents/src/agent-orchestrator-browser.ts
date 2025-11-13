/**
 * AgentOrchestrator - Browser Version
 * 
 * Simplified version for browser that doesn't import LangGraph.
 * For production, use backend API for multi-agent analysis.
 */

import { SessionState, LessonData } from '@simili/shared';
import { GenAILiveClient } from '@simili/core-engine';
import { PedagogyEngine } from './pedagogy/PedagogyEngine';
import { ContextManager } from './context/ContextManager';
import { FillerManager } from './context/FillerManager';

const logger = {
  info: (msg: string, data?: any) => console.log(`[AgentOrchestrator] ${msg}`, data || ''),
  warn: (msg: string, data?: any) => console.warn(`[AgentOrchestrator] ${msg}`, data || ''),
  error: (msg: string, data?: any) => console.error(`[AgentOrchestrator] ${msg}`, data || ''),
  debug: (msg: string, data?: any) => console.debug(`[AgentOrchestrator] ${msg}`, data || ''),
};

/**
 * Browser-Safe AgentOrchestrator
 * 
 * Use this in frontend. For multi-agent analysis, call backend API.
 */
export class AgentOrchestrator {
  private sessionState: SessionState;
  private client?: GenAILiveClient;
  private pedagogyEngine: PedagogyEngine;
  private contextManager: ContextManager;
  private fillerManager: FillerManager;
  private milestoneStartTime?: number;
  private milestoneAttempts: number = 0;
  private turnNumber: number = 0;

  constructor(_apiKey?: string) {
    // Note: apiKey parameter kept for compatibility but not used in browser
    this.sessionState = {
      sessionId: this.generateSessionId(),
      status: 'idle',
    };
    
    this.pedagogyEngine = new PedagogyEngine();
    this.contextManager = new ContextManager();
    this.fillerManager = new FillerManager();
    
    this.setupPedagogyListeners();
    
    logger.info('Initialized (Browser Mode - Multi-agent via API)');
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
      logger.info('Connection opened');
      this.sessionState.status = 'connected';
      this.sessionState.startTime = Date.now();
    });

    this.client.on('close', (event) => {
      // Log with full details for debugging
      const closeInfo = {
        code: event.code,
        reason: event.reason || '(no reason provided)',
        wasClean: event.wasClean,
        timestamp: new Date().toISOString(),
      };
      
      // Map common close codes
      const codeMessages: Record<number, string> = {
        1000: 'Normal closure',
        1001: 'Going away (page unload or server shutdown)',
        1002: 'Protocol error',
        1003: 'Unsupported data received',
        1006: 'Abnormal closure (no close frame)',
        1007: 'Invalid data (non-UTF8)',
        1008: 'Policy violation',
        1009: 'Message too large',
        1010: 'Extension negotiation failed',
        1011: 'Server error',
        1015: 'TLS handshake failed',
      };
      
      const codeMessage = codeMessages[event.code] || 'Unknown close code';
      
      console.error('[AgentOrchestrator] 🔴 Connection closed!', {
        ...closeInfo,
        meaning: codeMessage,
      });
      
      // Show user-friendly alert for critical errors
      if (event.code !== 1000 && event.code !== 1001) {
        console.error(`[AgentOrchestrator] ⚠️ Unexpected disconnect: ${codeMessage} (code ${event.code})`);
      }
      
      this.sessionState.status = 'disconnected';
      this.sessionState.endTime = Date.now();
    });

    this.client.on('error', (error) => {
      logger.error('Error occurred', { message: error.message, error });
      console.error('[AgentOrchestrator] Full error:', error);
      this.sessionState.status = 'error';
    });

    this.client.on('inputTranscription', (text, isFinal) => {
      logger.info('Input transcription', { text, isFinal });
      this.handleInputTranscription(text, isFinal);
    });

    this.client.on('outputTranscription', (text, isFinal) => {
      logger.info('Output transcription', { text, isFinal });
    });

    this.client.on('audio', (data) => {
      logger.debug('Audio received', { size: data.byteLength });
    });

    this.client.on('toolcall', (toolCall) => {
      logger.info('Tool call received', toolCall);
    });

    this.client.on('turncomplete', () => {
      logger.debug('Turn complete');
    });

    this.client.on('interrupted', () => {
      logger.info('Interrupted');
    });
  }

  /**
   * Handle incoming transcription
   */
  private handleInputTranscription(text: string, isFinal: boolean) {
    // Increment turn counter on final transcriptions
    if (isFinal) {
      this.turnNumber++;
      logger.info('Processing final transcription', {
        text,
        turn: this.turnNumber,
      });
    }

    // Pass to pedagogy engine for keyword detection (fast path)
    this.pedagogyEngine.processTranscription(text, isFinal);

    // Note: Multi-agent analysis should be done via backend API
    // See apps/tutor-app/lib/api-client.ts
  }

  private setupPedagogyListeners() {
    this.pedagogyEngine.on('milestone_detected', (milestone, transcription) => {
      this.milestoneAttempts++;
      logger.info('Milestone detected', {
        milestone: milestone.title,
        transcription,
        attempts: this.milestoneAttempts,
      });
      this.updateLessonContext();
    });

    this.pedagogyEngine.on('milestone_completed', (milestone) => {
      logger.info('Milestone completed!', {
        milestone: milestone.title,
        timestamp: milestone.timestamp,
        attempts: this.milestoneAttempts,
      });
      
      // Reset for next milestone
      this.milestoneAttempts = 0;
      this.milestoneStartTime = Date.now();
      this.updateLessonContext();
    });

    this.pedagogyEngine.on('lesson_started', (lesson) => {
      logger.info('Lesson started', {
        lessonId: lesson.id,
        title: lesson.title,
      });
      
      this.milestoneStartTime = Date.now();
      this.milestoneAttempts = 0;
      this.updateLessonContext();
    });

    this.pedagogyEngine.on('lesson_completed', (lesson) => {
      logger.info('Lesson completed!', {
        lessonId: lesson.id,
        title: lesson.title,
      });
    });

    this.pedagogyEngine.on('progress_update', (progress) => {
      logger.debug('Progress update', progress);
      this.updateLessonContext();
    });
  }

  private updateLessonContext(): void {
    const lesson = this.pedagogyEngine.getCurrentLesson();
    const milestone = this.pedagogyEngine.getCurrentMilestone();
    const progress = this.pedagogyEngine.getProgress();
    
    if (lesson && milestone && progress) {
      const timeOnMilestone = this.milestoneStartTime 
        ? Date.now() - this.milestoneStartTime 
        : 0;
      
      this.contextManager.updateLessonContext(
        lesson,
        milestone,
        progress.currentMilestoneIndex,
        this.milestoneAttempts,
        timeOnMilestone
      );
    }
  }

  public setLesson(lesson: LessonData) {
    this.sessionState.currentLesson = lesson;
    this.sessionState.currentMilestone = 0;
    this.pedagogyEngine.loadLesson(lesson);
    this.milestoneStartTime = Date.now();
    this.milestoneAttempts = 0;
    this.updateLessonContext();
    
    logger.info('Lesson set', { 
      lessonId: lesson.id, 
      title: lesson.title 
    });
  }

  public getPedagogyEngine(): PedagogyEngine {
    return this.pedagogyEngine;
  }

  public getContextManager(): ContextManager {
    return this.contextManager;
  }

  public getFillerManager(): FillerManager {
    return this.fillerManager;
  }

  public getSessionState(): SessionState {
    return { ...this.sessionState };
  }
}
