/**
 * OpenAI Realtime API Client - WebRTC Implementation
 * Following official docs: https://platform.openai.com/docs/guides/realtime-webrtc
 */

import { EventEmitter } from 'eventemitter3';

export interface RealtimeWebRTCConfig {
  tokenEndpoint?: string; // Backend endpoint for ephemeral tokens
  instructions?: string;
  model?: string;
  voice?: string;
  temperature?: number;
}

export class OpenAIRealtimeWebRTC extends EventEmitter {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private mediaStream: MediaStream | null = null;
  private config: RealtimeWebRTCConfig;
  private status: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private isResponseActive: boolean = false;

  constructor(config: RealtimeWebRTCConfig) {
    super();
    this.config = {
      tokenEndpoint: config.tokenEndpoint || 'http://localhost:3001/api/realtime/token',
      instructions: config.instructions || 'You are a helpful assistant.',
      model: config.model || 'gpt-4o-realtime-preview-2024-10-01',
      voice: config.voice || 'sage',
      temperature: config.temperature || 0.8,
    };
  }

  async connect(): Promise<void> {
    // Prevent duplicate connections
    if (this.status === 'connected') {
      console.log('[WebRTC] Already connected');
      return;
    }

    if (this.status === 'connecting') {
      console.log('[WebRTC] Connection in progress');
      return;
    }

    this.status = 'connecting';
    console.log('[WebRTC] Starting connection...');

    try {
      // 1. Fetch ephemeral token from backend
      console.log('[WebRTC] Fetching ephemeral token...');
      const ephemeralToken = await this.fetchEphemeralToken();

      // 2. Create RTCPeerConnection
      this.pc = new RTCPeerConnection();

      // 3. Set up audio element for remote audio (model's voice)
      this.audioElement = document.createElement('audio');
      this.audioElement.autoplay = true;
      
      this.pc.ontrack = (e) => {
        console.log('[WebRTC] Received remote audio track');
        if (this.audioElement) {
          this.audioElement.srcObject = e.streams[0];
        }
      };

      // 4. Add local audio track (microphone)
      console.log('[WebRTC] Requesting microphone access...');
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      this.mediaStream.getTracks().forEach(track => {
        if (this.pc && this.mediaStream) {
          this.pc.addTrack(track, this.mediaStream);
        }
      });

      console.log('[WebRTC] Microphone track added');

      // 5. Set up data channel for events
      this.dc = this.pc.createDataChannel('oai-events');
      this.setupDataChannel();

      // 6. Create offer and set local description
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // 7. Send SDP to OpenAI via ephemeral token
      console.log('[WebRTC] Sending SDP offer to OpenAI...');
      const sdpResponse = await fetch('https://api.openai.com/v1/realtime', {
        method: 'POST',
        body: offer.sdp,
        headers: {
          'Authorization': `Bearer ${ephemeralToken}`,
          'Content-Type': 'application/sdp',
        },
      });

      if (!sdpResponse.ok) {
        throw new Error(`Failed to connect: ${sdpResponse.status}`);
      }

      // 8. Set remote description from OpenAI's answer
      const answerSdp = await sdpResponse.text();
      const answer: RTCSessionDescriptionInit = {
        type: 'answer',
        sdp: answerSdp,
      };
      await this.pc.setRemoteDescription(answer);

      console.log('[WebRTC] ✅ Connection established');
      this.status = 'connected';
      this.emit('open');
    } catch (error) {
      console.error('[WebRTC] ❌ Connection failed:', error);
      this.status = 'disconnected';
      this.cleanup();
      throw error;
    }
  }

  private setupDataChannel(): void {
    if (!this.dc) return;

    this.dc.addEventListener('open', () => {
      console.log('[WebRTC] Data channel open');
      
      // Send session configuration
      this.sendEvent({
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          instructions: this.config.instructions,
          voice: this.config.voice,
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          input_audio_transcription: {
            model: 'whisper-1',
          },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
          },
          temperature: this.config.temperature,
        },
      });
    });

    this.dc.addEventListener('message', (e) => {
      try {
        const event = JSON.parse(e.data);
        this.handleServerEvent(event);
      } catch (error) {
        console.error('[WebRTC] Failed to parse server event:', error);
      }
    });

    this.dc.addEventListener('close', () => {
      console.log('[WebRTC] Data channel closed');
      this.status = 'disconnected';
      this.emit('close');
    });

    this.dc.addEventListener('error', (e) => {
      console.error('[WebRTC] Data channel error:', e);
      this.emit('error', e);
    });
  }

  private async fetchEphemeralToken(): Promise<string> {
    if (!this.config.tokenEndpoint) {
      throw new Error('No token endpoint configured');
    }

    const response = await fetch(this.config.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instructions: this.config.instructions,
        model: this.config.model,
        voice: this.config.voice,
        temperature: this.config.temperature,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch ephemeral token: ${response.status} ${error}`);
    }

    const data = await response.json();
    console.log('[WebRTC] Ephemeral token fetched');
    return data.client_secret;
  }

  private handleServerEvent(event: any): void {
    // console.log('[WebRTC] Server event:', event.type);

    switch (event.type) {
      case 'session.created':
      case 'session.updated':
        console.log('[WebRTC] Session ready');
        break;

      case 'response.audio_transcript.delta':
        // Model is speaking
        this.emit('transcript', event.delta);
        break;

      case 'conversation.item.input_audio_transcription.completed':
        // User finished speaking
        const userText = event.transcript;
        console.log('[WebRTC] User said:', userText);
        this.emit('user-message', userText);
        break;

      case 'response.text.delta':
        // Text response chunk
        this.emit('text-delta', event.delta);
        break;

      case 'response.audio_transcript.done':
        // Model finished speaking (full transcript)
        const assistantText = event.transcript;
        console.log('[WebRTC] Model said:', assistantText);
        this.emit('assistant-message', assistantText);
        break;

      case 'response.done':
        this.isResponseActive = false;
        console.log('[WebRTC] Response complete');
        this.emit('response-complete');
        break;

      case 'response.created':
        this.isResponseActive = true;
        console.log('[WebRTC] Response started');
        break;

      case 'response.cancelled':
        this.isResponseActive = false;
        console.log('[WebRTC] Response cancelled');
        this.emit('response-cancelled');
        break;

      case 'error':
        console.error('[WebRTC] Server error:', event.error);
        this.emit('error', event.error);
        break;
    }
  }

  // Send text message (for text-only interactions)
  sendText(text: string): void {
    if (!this.isConnected()) return;

    this.sendEvent({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }],
      },
    });

    this.sendEvent({
      type: 'response.create',
    });
  }

  // Send system message (context without triggering response)
  sendSystemMessage(text: string): void {
    if (!this.isConnected()) return;

    // Cancel any in-flight response first
    if (this.isResponseActive) {
      console.log('[WebRTC] Cancelling in-flight response before context update');
      this.cancelResponse();
    }

    this.sendEvent({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'system',
        content: [{ type: 'input_text', text }],
      },
    });
  }

  // Cancel the current response (for "Stop Speaking" or context changes)
  cancelResponse(): void {
    if (!this.isConnected() || !this.isResponseActive) return;

    console.log('[WebRTC] Sending response.cancel');
    this.sendEvent({
      type: 'response.cancel',
    });
  }

  private sendEvent(event: any): void {
    if (!this.dc || this.dc.readyState !== 'open') {
      console.warn('[WebRTC] Data channel not open, cannot send event');
      return;
    }

    this.dc.send(JSON.stringify(event));
  }

  disconnect(): void {
    console.log('[WebRTC] Disconnecting...');
    this.cleanup();
  }

  private cleanup(): void {
    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }

    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    if (this.audioElement) {
      this.audioElement.srcObject = null;
      this.audioElement = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    this.status = 'disconnected';
    this.isResponseActive = false;
  }

  getStatus(): 'disconnected' | 'connecting' | 'connected' {
    return this.status;
  }

  isConnected(): boolean {
    return this.status === 'connected' && this.dc?.readyState === 'open';
  }

  isResponseInProgress(): boolean {
    return this.isResponseActive;
  }
}
