import { Event, SessionState, LessonData, Milestone } from '@simili/shared';
import { GenAILiveClient } from '@simili/core-engine';
import { PedagogyEngine } from './pedagogy/PedagogyEngine';
import { ContextManager } from './context/ContextManager';
import { FillerManager } from './context/FillerManager';

export class AgentOrchestrator {
  private sessionState: SessionState;
  private client?: GenAILiveClient;
  private pedagogyEngine: PedagogyEngine;
  private contextManager: ContextManager;
  private fillerManager: FillerManager;
  private milestoneStartTime?: number;
  private milestoneAttempts: number = 0;

  constructor() {
    this.sessionState = {
      sessionId: this.generateSessionId(),
      status: 'idle',
    };
    this.pedagogyEngine = new PedagogyEngine();
    this.contextManager = new ContextManager();
    this.fillerManager = new FillerManager();
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
      this.log('Connection opened');
      this.sessionState.status = 'connected';
      this.sessionState.startTime = Date.now();
    });

    this.client.on('close', (event) => {
      this.log('Connection closed', { code: event.code, reason: event.reason });
      this.sessionState.status = 'disconnected';
      this.sessionState.endTime = Date.now();
    });

    this.client.on('error', (error) => {
      this.log('Error occurred', { message: error.message });
      this.sessionState.status = 'error';
    });

    this.client.on('inputTranscription', (text, isFinal) => {
      this.log('Input transcription', { text, isFinal });
      this.handleInputTranscription(text, isFinal);
    });

    this.client.on('outputTranscription', (text, isFinal) => {
      this.log('Output transcription', { text, isFinal });
    });

    this.client.on('audio', (data) => {
      this.log('Audio received', { size: data.byteLength });
    });

    this.client.on('toolcall', (toolCall) => {
      this.log('Tool call received', toolCall);
    });

    this.client.on('turncomplete', () => {
      this.log('Turn complete');
    });

    this.client.on('interrupted', () => {
      this.log('Interrupted');
    });
  }

  private handleInputTranscription(text: string, isFinal: boolean) {
    // Increment turn counter on final transcriptions
    if (isFinal) {
      this.contextManager.incrementTurn();
      this.log('Processing final transcription', { 
        text, 
        turn: this.contextManager.getCurrentTurn() 
      });
    }
    
    // Pass transcription to pedagogy engine for milestone detection
    this.pedagogyEngine.processTranscription(text, isFinal);
  }

  private setupPedagogyListeners() {
    this.pedagogyEngine.on('milestone_detected', (milestone, transcription) => {
      this.milestoneAttempts++;
      this.log('Milestone detected', {
        milestone: milestone.title,
        transcription,
        attempts: this.milestoneAttempts,
      });
      this.updateLessonContext();
    });

    this.pedagogyEngine.on('milestone_completed', (milestone) => {
      this.log('Milestone completed!', {
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
      this.log('Lesson started', {
        lessonId: lesson.id,
        title: lesson.title,
      });
      this.milestoneStartTime = Date.now();
      this.milestoneAttempts = 0;
      this.updateLessonContext();
    });

    this.pedagogyEngine.on('lesson_completed', (lesson) => {
      this.log('Lesson completed!', {
        lessonId: lesson.id,
        title: lesson.title,
      });
    });

    this.pedagogyEngine.on('progress_update', (progress) => {
      this.log('Progress update', progress);
      this.updateLessonContext();
    });
  }

  public setLesson(lesson: LessonData) {
    this.sessionState.currentLesson = lesson;
    this.sessionState.currentMilestone = 0;
    this.pedagogyEngine.loadLesson(lesson);
    this.milestoneStartTime = Date.now();
    this.milestoneAttempts = 0;
    this.updateLessonContext();
    this.log('Lesson set', { lessonId: lesson.id, title: lesson.title });
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

  private log(message: string, data?: any) {
    console.log(`[AgentOrchestrator] ${message}`, data || '');
  }
}
