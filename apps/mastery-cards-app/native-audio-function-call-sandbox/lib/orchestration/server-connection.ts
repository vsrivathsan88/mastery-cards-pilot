/**
 * Server Orchestration Connection
 *
 * Connects the client to the server-side orchestration via WebSocket
 */

import type { MasteryCard } from '../mvp-cards-data';

export interface ServerTranscriptEntry {
  role: 'pi' | 'student' | 'system';
  text: string;
  timestamp: number;
  isFinal: boolean;
}

export interface ServerEvaluation {
  ready: boolean;
  confidence: number;
  masteryLevel: 'none' | 'basic' | 'advanced' | 'teaching';
  reasoning: string;
  suggestedAction: 'continue' | 'award_and_next' | 'next_without_points';
  points?: number;
  timestamp?: number;
}

export type MessageHandler = (message: any) => void;

export class ServerOrchestrationConnection {
  private ws: WebSocket | null = null;
  private sessionId: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private serverUrl: string;

  constructor(sessionId: string, serverUrl: string = 'ws://localhost:3001/orchestrate') {
    this.sessionId = sessionId;
    this.serverUrl = serverUrl;
  }

  /**
   * Connect to the orchestration server
   */
  async connect(studentName: string, currentCard: MasteryCard | null): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = `${this.serverUrl}?sessionId=${this.sessionId}`;
        console.log(`[ServerConnection] Connecting to ${url}`);

        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('[ServerConnection] Connected to orchestration server');
          this.reconnectAttempts = 0;

          // Send initialization
          this.send({
            type: 'init',
            studentName,
            currentCard
          });

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleServerMessage(message);
          } catch (error) {
            console.error('[ServerConnection] Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[ServerConnection] WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('[ServerConnection] Disconnected:', event.code, event.reason);
          this.ws = null;

          // Attempt reconnection
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect(studentName, currentCard);
          }
        };
      } catch (error) {
        console.error('[ServerConnection] Connection error:', error);
        reject(error);
      }
    });
  }

  /**
   * Send a message to the server
   */
  send(message: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[ServerConnection] WebSocket not connected');
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('[ServerConnection] Send error:', error);
    }
  }

  /**
   * Send transcript entry to server
   */
  sendTranscript(entry: ServerTranscriptEntry): void {
    this.send({
      type: 'transcript',
      entry
    });
  }

  /**
   * Update current card on server
   */
  updateCard(card: MasteryCard): void {
    this.send({
      type: 'card_change',
      card
    });
  }

  /**
   * Request forced evaluation
   */
  forceEvaluation(): void {
    this.send({
      type: 'force_evaluation'
    });
  }

  /**
   * Handle incoming server messages
   */
  private handleServerMessage(message: any): void {
    console.log('[ServerConnection] Received message:', message.type);

    // Notify handlers
    const handlers = this.messageHandlers.get(message.type) || [];
    handlers.forEach(handler => handler(message));

    // Handle specific message types
    switch (message.type) {
      case 'evaluation':
        this.handleEvaluation(message.evaluation);
        break;

      case 'advance_card':
        this.handleAdvanceCard(message);
        break;

      case 'inject_message':
        console.log('[ServerConnection] Server injected message:', message.message);
        break;

      case 'error':
        console.error('[ServerConnection] Server error:', message.error);
        break;
    }
  }

  /**
   * Handle evaluation from server
   */
  private handleEvaluation(evaluation: ServerEvaluation): void {
    console.log('[ServerConnection] 📊 Evaluation received:', {
      ready: evaluation.ready,
      confidence: evaluation.confidence,
      masteryLevel: evaluation.masteryLevel,
      suggestedAction: evaluation.suggestedAction,
      points: evaluation.points
    });

    // Trigger registered callbacks
    const handlers = this.messageHandlers.get('evaluation') || [];
    handlers.forEach(handler => handler(evaluation));
  }

  /**
   * Handle advance card command
   */
  private handleAdvanceCard(message: any): void {
    console.log('[ServerConnection] 🎉 Advance card:', {
      points: message.points,
      masteryLevel: message.masteryLevel,
      reasoning: message.reasoning
    });

    // Trigger registered callbacks
    const handlers = this.messageHandlers.get('advance_card') || [];
    handlers.forEach(handler => handler(message));
  }

  /**
   * Register a message handler
   */
  on(type: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }

  /**
   * Remove a message handler
   */
  off(type: string, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(studentName: string, currentCard: MasteryCard | null): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[ServerConnection] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect(studentName, currentCard).catch(error => {
        console.error('[ServerConnection] Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers.clear();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}