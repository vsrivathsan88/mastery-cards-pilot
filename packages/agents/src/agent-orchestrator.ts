import { Event, SessionState, LessonData } from '@simili/shared';
import { GenAILiveClient } from '@simili/core-engine';

export class AgentOrchestrator {
  private sessionState: SessionState;
  private client?: GenAILiveClient;

  constructor() {
    this.sessionState = {
      sessionId: this.generateSessionId(),
      status: 'idle',
    };
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
    // Placeholder for future pedagogy logic
    // This is where milestone detection would happen
    if (isFinal) {
      this.log('Processing final transcription', { text });
      // TODO: Detect milestone completion from keywords
      // TODO: Emit milestone_detected event
    }
  }

  public setLesson(lesson: LessonData) {
    this.sessionState.currentLesson = lesson;
    this.sessionState.currentMilestone = 0;
    this.log('Lesson set', { lessonId: lesson.id, title: lesson.title });
  }

  public getSessionState(): SessionState {
    return { ...this.sessionState };
  }

  private log(message: string, data?: any) {
    console.log(`[AgentOrchestrator] ${message}`, data || '');
  }
}
