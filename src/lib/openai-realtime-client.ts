/**
 * OpenAI Realtime API Client
 * Minimal wrapper matching our needs
 */

import { EventEmitter } from 'eventemitter3';
import { AudioStreamer } from './audio-streamer';

export interface RealtimeClientConfig {
  apiKey: string;
  model?: string;
  voice?: string;
  instructions?: string;
  temperature?: number;
}

export class OpenAIRealtimeClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private config: RealtimeClientConfig;
  private status: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioStreamer: AudioStreamer | null = null;
  private isResponseActive: boolean = false;
  private cancelPromise: Promise<void> | null = null;
  private cancelResolve: (() => void) | null = null;

  constructor(config: RealtimeClientConfig) {
    super();
    this.apiKey = config.apiKey;
    this.config = {
      model: config.model || 'gpt-4o-realtime-preview-2024-10-01',
      voice: config.voice || 'alloy',
      instructions: config.instructions || '',
      temperature: config.temperature || 0.8,
      ...config
    };
  }

  async connect(): Promise<void> {
    // CRITICAL: Prevent duplicate connections
    if (this.status === 'connected') {
      console.log('[OpenAI] Already connected - skipping');
      return;
    }
    
    if (this.status === 'connecting') {
      console.log('[OpenAI] Connection in progress - skipping');
      return;
    }

    // Check if WebSocket already exists and is open
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      console.log('[OpenAI] WebSocket already exists and is active - skipping');
      this.status = 'connected';
      return;
    }

    this.status = 'connecting';
    console.log('[OpenAI] Connecting to Realtime API...');
    
    // Security warning - only log in development
    if (import.meta.env.DEV) {
      if (this.apiKey.startsWith('sk-proj-')) {
        console.warn('[OpenAI] ⚠️ Using project-scoped key. Realtime API may require standard key.');
      }
      console.warn('[OpenAI] ⚠️ SECURITY: API key exposed in browser! Use ephemeral tokens in production.');
    }

    try {
      const url = 'wss://api.openai.com/v1/realtime?model=' + this.config.model;
      console.log('[OpenAI] WebSocket URL:', url);
      
      this.ws = new WebSocket(url, [
        'realtime',
        `openai-insecure-api-key.${this.apiKey}`,
        'openai-beta.realtime-v1'
      ]);

      this.ws.addEventListener('open', this.handleOpen.bind(this));
      this.ws.addEventListener('message', this.handleMessage.bind(this));
      this.ws.addEventListener('error', this.handleError.bind(this));
      this.ws.addEventListener('close', this.handleClose.bind(this));

      console.log('[OpenAI] WebSocket created, waiting for connection...');
      
      // Set timeout for connection
      setTimeout(() => {
        if (this.status === 'connecting') {
          console.error('[OpenAI] ❌ Connection timeout after 10 seconds');
          console.error('[OpenAI] ❌ Check: 1) API key is valid, 2) API key has Realtime API access, 3) Network connection');
          this.status = 'disconnected';
          this.ws?.close();
          this.emit('error', new Error('Connection timeout'));
        }
      }, 10000);

    } catch (error) {
      console.error('[OpenAI] Connection failed:', error);
      this.status = 'disconnected';
      this.emit('error', error);
      throw error;
    }
  }

  private async handleOpen() {
    console.log('[OpenAI] ✅ Connected');
    this.status = 'connected';
    this.emit('open');

    // Send session configuration
    this.send({
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: this.config.instructions,
        voice: this.config.voice,
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        },
        temperature: this.config.temperature
      }
    });

    // Start microphone
    await this.startMicrophone();
  }

  private handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      
      // console.log('[OpenAI] Message:', data.type);

      switch (data.type) {
        case 'session.created':
        case 'session.updated':
          console.log('[OpenAI] Session ready');
          break;

        case 'conversation.item.input_audio_transcription.completed':
          // Student speech transcribed
          const studentText = data.transcript;
          console.log('[OpenAI] Student said:', studentText);
          this.emit('transcript', { role: 'user', text: studentText });
          break;

        case 'response.audio_transcript.delta':
          // Pi speaking (partial)
          this.emit('audio_transcript_delta', data.delta);
          break;

        case 'response.audio_transcript.done':
          // Pi finished speaking
          const piText = data.transcript;
          console.log('[OpenAI] Pi said:', piText);
          this.emit('transcript', { role: 'assistant', text: piText });
          break;

        case 'response.audio.delta':
          // Audio data from OpenAI (PCM16 at 24kHz)
          const audioData = this.base64ToArrayBuffer(data.delta);
          
          // ONLY play through OpenAI client - nowhere else!
          this.playAudio(audioData);
          
          // Don't emit - App doesn't need to handle audio
          break;

        case 'response.created':
          this.isResponseActive = true;
          console.log('[OpenAI] Response started');
          break;

        case 'response.done':
          this.isResponseActive = false;
          console.log('[OpenAI] Response complete');
          this.emit('turncomplete');
          break;

        case 'response.cancelled':
          this.isResponseActive = false;
          console.log('[OpenAI] Response cancelled');
          // Resolve the cancel promise if waiting
          if (this.cancelResolve) {
            this.cancelResolve();
            this.cancelResolve = null;
            this.cancelPromise = null;
          }
          break;

        case 'error':
          console.error('[OpenAI] Error:', data.error);
          this.emit('error', new Error(data.error.message));
          break;

        default:
          // Ignore other events
          break;
      }
    } catch (error) {
      console.error('[OpenAI] Failed to parse message:', error);
    }
  }

  private handleError(event: Event) {
    console.error('[OpenAI] ❌ WebSocket error event:', event);
    console.error('[OpenAI] ❌ WebSocket readyState:', this.ws?.readyState);
    this.status = 'disconnected';
    this.emit('error', event);
  }

  private handleClose(event: CloseEvent) {
    console.log('[OpenAI] ❌ Connection closed');
    console.log('[OpenAI] Close code:', event.code);
    console.log('[OpenAI] Close reason:', event.reason || 'No reason provided');
    console.log('[OpenAI] Clean close:', event.wasClean);
    this.status = 'disconnected';
    this.emit('close', event);
    this.cleanup();
  }

  private async startMicrophone(): Promise<void> {
    try {
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      
      // Create AudioStreamer for proper audio playback
      this.audioStreamer = new AudioStreamer(this.audioContext);
      
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (this.status !== 'connected') return;

        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = this.floatTo16BitPCM(inputData);
        const base64 = this.arrayBufferToBase64(pcm16.buffer);

        this.send({
          type: 'input_audio_buffer.append',
          audio: base64
        });
      };

      source.connect(processor);
      processor.connect(this.audioContext.destination);

      console.log('[OpenAI] ✅ Microphone started');
      this.emit('microphoneStarted');

    } catch (error) {
      console.error('[OpenAI] Failed to start microphone:', error);
      this.emit('error', error);
      throw error;
    }
  }

  public sendText(text: string): void {
    this.send({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }]
      }
    });

    this.send({
      type: 'response.create'
    });
  }

  public async sendSystemMessage(text: string, options?: { cancelInFlight?: boolean }): Promise<void> {
    const shouldCancel = options?.cancelInFlight !== false; // Default true for backward compatibility

    // CRITICAL: Either cancel OR wait for response to finish
    if (this.isResponseActive) {
      if (shouldCancel) {
        console.log('[OpenAI] Cancelling in-flight response before context update');
        await this.cancelResponse();
        console.log('[OpenAI] Cancel confirmed, now sending context');
      } else {
        console.log('[OpenAI] Waiting for response to complete before sending message...');
        await this.waitForResponseComplete();
        console.log('[OpenAI] Response complete, now sending message');
      }
    }
    
    // CRITICAL: Stop all audio before sending new context (only if cancelling)
    if (shouldCancel) {
      this.stopAllAudio();
    }
    
    // Send a system message as context (doesn't trigger response)
    this.send({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'system',
        content: [{ type: 'input_text', text }]
      }
    });
  }

  public waitForResponseComplete(): Promise<void> {
    if (!this.isResponseActive) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const handler = () => {
        this.off('turncomplete', handler);
        resolve();
      };
      this.on('turncomplete', handler);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        this.off('turncomplete', handler);
        console.warn('[OpenAI] Wait timeout - proceeding anyway');
        resolve();
      }, 5000);
    });
  }

  public async cancelResponse(): Promise<void> {
    if (!this.ws || this.status !== 'connected') {
      return;
    }

    if (!this.isResponseActive) {
      return;
    }

    // If already cancelling, wait for that promise
    if (this.cancelPromise) {
      console.log('[OpenAI] Cancel already in progress, waiting...');
      return this.cancelPromise;
    }

    // Create a promise that resolves when we get response.cancelled event
    this.cancelPromise = new Promise<void>((resolve) => {
      this.cancelResolve = resolve;
      
      // Timeout after 2 seconds in case we don't get the event
      setTimeout(() => {
        if (this.cancelResolve) {
          console.warn('[OpenAI] Cancel timeout - forcing resolution');
          this.cancelResolve();
          this.cancelResolve = null;
          this.cancelPromise = null;
        }
      }, 2000);
    });

    console.log('[OpenAI] Sending response.cancel');
    this.send({
      type: 'response.cancel',
    });

    return this.cancelPromise;
  }

  public updateInstructions(instructions: string): void {
    // CRITICAL: Stop all playing audio before updating instructions
    this.stopAllAudio();
    
    this.send({
      type: 'session.update',
      session: {
        instructions
      }
    });
  }
  
  private stopAllAudio(): void {
    // Stop AudioStreamer properly
    if (this.audioStreamer) {
      this.audioStreamer.stop();
    }
  }

  private send(data: any): void {
    if (!this.ws || this.status !== 'connected') {
      console.warn('[OpenAI] Cannot send - not connected');
      return;
    }
    this.ws.send(JSON.stringify(data));
  }

  public disconnect(): void {
    console.log('[OpenAI] Disconnecting...');
    if (this.ws) {
      this.ws.close();
    }
    this.cleanup();
  }

  private cleanup(): void {
    if (this.audioStreamer) {
      this.audioStreamer.stop();
      this.audioStreamer = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.ws = null;
    this.status = 'disconnected';
    this.isResponseActive = false;
    this.cancelPromise = null;
    this.cancelResolve = null;
  }

  getStatus(): string {
    return this.status;
  }

  // Utility functions
  private floatTo16BitPCM(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer | ArrayBufferLike): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // PROPER AUDIO PLAYBACK - Use AudioStreamer for gapless playback
  private async playAudio(audioData: ArrayBuffer): Promise<void> {
    if (!this.audioStreamer) {
      console.error('[OpenAI Audio] AudioStreamer not initialized');
      return;
    }

    try {
      // AudioStreamer expects Uint8Array of PCM16 data
      const uint8Array = new Uint8Array(audioData);
      this.audioStreamer.addPCM16(uint8Array);
    } catch (error) {
      console.error('[OpenAI Audio] Playback error:', error);
    }
  }
}
