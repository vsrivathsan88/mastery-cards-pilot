/**
 * Gemini Live API Client
 * WebSocket-based real-time multimodal conversation
 * WITH RELIABILITY CONTROLS
 */

import { EventEmitter } from 'eventemitter3';
import { AudioStreamer } from './audio-streamer';
import { ConnectionWatchdog } from './reliability';

export interface GeminiLiveConfig {
  apiKey: string;
  model?: string;
  systemInstruction?: string;
  temperature?: number;
  voice?: string;
}

interface Content {
  role?: string;
  parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
}

export class GeminiLiveClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private config: GeminiLiveConfig;
  private status: 'disconnected' | 'connecting' | 'connected' | 'ready' = 'disconnected';
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioStreamer: AudioStreamer | null = null;
  private setupComplete: boolean = false;
  
  // Reliability controls
  private watchdog: ConnectionWatchdog;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts = 5;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private waitingForPong: boolean = false;

  constructor(config: GeminiLiveConfig) {
    super();
    this.apiKey = config.apiKey;
    this.config = {
      model: config.model || 'models/gemini-2.5-flash',
      systemInstruction: config.systemInstruction || '',
      temperature: config.temperature || 0.8,
      voice: config.voice || 'Puck', // Gemini voices: Puck, Charon, Kore, Fenrir, Aoede
      ...config
    };
    
    // Initialize reliability controls
    this.watchdog = new ConnectionWatchdog({
      activityTimeout: 15000,  // 15 seconds
      checkInterval: 5000      // Check every 5 seconds
    });
  }

  async connect(): Promise<void> {
    if (this.status === 'connected' || this.status === 'ready') {
      console.log('[Gemini] Already connected - skipping');
      return;
    }
    
    if (this.status === 'connecting') {
      console.log('[Gemini] Connection in progress - skipping');
      return;
    }

    this.status = 'connecting';
    console.log('[Gemini] Connecting to Live API...');

    try {
      const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${this.apiKey}`;
      
      this.ws = new WebSocket(url);

      this.ws.addEventListener('open', this.handleOpen.bind(this));
      this.ws.addEventListener('message', this.handleMessage.bind(this));
      this.ws.addEventListener('error', this.handleError.bind(this));
      this.ws.addEventListener('close', this.handleClose.bind(this));

      console.log('[Gemini] WebSocket created, waiting for connection...');
      
      setTimeout(() => {
        if (this.status === 'connecting') {
          console.error('[Gemini] ❌ Connection timeout after 10 seconds');
          this.status = 'disconnected';
          this.ws?.close();
          this.emit('error', new Error('Connection timeout'));
        }
      }, 10000);

    } catch (error) {
      console.error('[Gemini] Connection failed:', error);
      this.status = 'disconnected';
      this.emit('error', error);
      throw error;
    }
  }

  private handleOpen(): void {
    console.log('[Gemini] ✅ WebSocket connected');
    this.status = 'connected';
    this.reconnectAttempts = 0; // Reset on successful connection
    
    // Start connection monitoring
    this.watchdog.start(() => {
      console.error('[Gemini] 🐕 Watchdog detected stale connection - reconnecting');
      this.reconnect();
    });
    
    // Start bi-directional heartbeat (detects zombie connections)
    this.startHeartbeat();
    
    // Send initial setup message
    this.sendSetup();
  }

  private sendSetup(): void {
    const setup = {
      setup: {
        model: this.config.model,
        generationConfig: {
          temperature: this.config.temperature,
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: this.config.voice
              }
            }
          }
        }
      }
    };

    // Add system instruction if provided
    if (this.config.systemInstruction) {
      (setup.setup as any).systemInstruction = {
        parts: [{ text: this.config.systemInstruction }]
      };
    }

    console.log('[Gemini] Sending setup:', JSON.stringify(setup, null, 2));
    this.ws?.send(JSON.stringify(setup));
  }

  private handleMessage(event: MessageEvent): void {
    // Signal activity to watchdog
    this.watchdog.ping();
    
    // Any message counts as heartbeat response
    this.waitingForPong = false;
    
    // Check if message is binary (audio data)
    if (event.data instanceof Blob || event.data instanceof ArrayBuffer) {
      // Handle binary audio data
      this.handleBinaryAudio(event.data);
      return;
    }
    
    // Handle JSON messages
    try {
      const message = JSON.parse(event.data);
      
      // Handle setup complete
      if (message.setupComplete) {
        console.log('[Gemini] ✅ Setup complete - ready to communicate');
        this.setupComplete = true;
        this.status = 'ready';
        this.emit('ready');
        return;
      }

      // Handle server content (audio, text, etc.)
      if (message.serverContent) {
        this.handleServerContent(message.serverContent);
        return;
      }

      // Handle tool calls (if we add function calling)
      if (message.toolCall) {
        console.log('[Gemini] Tool call received:', message.toolCall);
        this.emit('toolCall', message.toolCall);
        return;
      }

      // Debug: log unknown message types
      console.log('[Gemini] Received message:', message);
      
    } catch (error) {
      console.error('[Gemini] Failed to parse message:', error);
    }
  }
  
  /**
   * Handle binary audio data from Gemini
   */
  private async handleBinaryAudio(data: Blob | ArrayBuffer): Promise<void> {
    try {
      // Convert Blob to ArrayBuffer if needed
      let audioData: ArrayBuffer;
      if (data instanceof Blob) {
        audioData = await data.arrayBuffer();
      } else {
        audioData = data;
      }
      
      // Play the audio
      if (this.audioStreamer) {
        // Convert to Uint8Array format expected by AudioStreamer
        const uint8Data = new Uint8Array(audioData);
        this.audioStreamer.addPCM16(uint8Data);
      }
      
    } catch (error) {
      console.error('[Gemini] Failed to process binary audio:', error);
    }
  }

  private handleServerContent(content: any): void {
    // Handle model turn (text/audio)
    if (content.modelTurn) {
      const turn = content.modelTurn;
      
      // Handle text parts
      if (turn.parts) {
        for (const part of turn.parts) {
          if (part.text) {
            console.log('[Gemini] Text:', part.text);
            this.emit('text', part.text);
          }
          
          // Handle audio
          if (part.inlineData && part.inlineData.mimeType?.includes('audio')) {
            const audioData = part.inlineData.data; // base64
            this.playAudio(audioData);
          }
        }
      }
    }

    // Handle turn complete
    if (content.turnComplete) {
      console.log('[Gemini] Turn complete');
      this.emit('turnComplete');
    }

    // Handle interruption
    if (content.interrupted) {
      console.log('[Gemini] ⚠️ Interrupted');
      this.emit('interrupted');
      this.stopAudio();
    }

    // Handle transcriptions
    if (content.inputTranscription) {
      const text = content.inputTranscription.text;
      console.log('[Gemini] User said:', text);
      this.emit('userTranscript', text);
    }
  }

  private playAudio(base64Audio: string): void {
    if (!this.audioStreamer) {
      console.warn('[Gemini] No audio streamer available');
      return;
    }

    try {
      // Decode base64 to PCM
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Gemini sends 16-bit PCM at 24kHz by default
      // Convert to Uint8Array for AudioStreamer
      const pcmData = new Int16Array(bytes.buffer);
      const uint8Data = new Uint8Array(pcmData.buffer);
      this.audioStreamer.addPCM16(uint8Data);
      
    } catch (error) {
      console.error('[Gemini] Failed to play audio:', error);
    }
  }

  private stopAudio(): void {
    if (this.audioStreamer) {
      this.audioStreamer.stop();
    }
  }

  private handleError(event: Event): void {
    console.error('[Gemini] ❌ WebSocket error:', event);
    this.status = 'disconnected';
    this.emit('error', event);
  }

  private handleClose(event: CloseEvent): void {
    console.log('[Gemini] WebSocket closed:', event.code, event.reason);
    this.status = 'disconnected';
    this.setupComplete = false;
    this.emit('disconnected');
  }

  // ============================================
  // PUBLIC API
  // ============================================

  /**
   * Send text message to Gemini (won't interrupt ongoing audio)
   */
  sendText(text: string): void {
    if (!this.setupComplete) {
      console.warn('[Gemini] Setup not complete, queueing message');
      // Could queue and send after setup
      return;
    }

    const message = {
      realtimeInput: {
        text: text
      }
    };

    console.log('[Gemini] Sending text:', text);
    this.ws?.send(JSON.stringify(message));
  }

  /**
   * Send conversation content (text, images)
   * This WILL interrupt ongoing generation
   */
  sendContent(content: Content[], endOfTurn: boolean = true): void {
    if (!this.setupComplete) {
      console.warn('[Gemini] Setup not complete, queueing content');
      return;
    }

    const message = {
      clientContent: {
        turns: content,
        turnComplete: endOfTurn
      }
    };

    console.log('[Gemini] Sending content:', content);
    this.ws?.send(JSON.stringify(message));
  }

  /**
   * Send image with text
   */
  sendImage(imageBase64: string, mimeType: string, text?: string): void {
    const parts: any[] = [
      {
        inlineData: {
          mimeType: mimeType,
          data: imageBase64
        }
      }
    ];

    if (text) {
      parts.push({ text });
    }

    const content: Content = {
      role: 'user',
      parts
    };

    this.sendContent([content], true);
  }

  /**
   * Start audio input from microphone
   */
  async startAudioInput(): Promise<void> {
    if (this.mediaStream) {
      console.log('[Gemini] Audio input already active');
      return;
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      console.log('[Gemini] Microphone access granted');
      
      // Create audio context if needed
      if (!this.audioContext) {
        this.audioContext = new AudioContext({ sampleRate: 16000 });
      }

      // Create audio processor
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (!this.setupComplete) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        
        // Convert float32 to int16
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Send audio to Gemini
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
        const message = {
          realtimeInput: {
            audio: base64Audio
          }
        };

        this.ws?.send(JSON.stringify(message));
      };

      source.connect(processor);
      processor.connect(this.audioContext.destination);

      console.log('[Gemini] Audio input streaming started');
      this.emit('audioInputStarted');

    } catch (error) {
      console.error('[Gemini] Failed to start audio input:', error);
      throw error;
    }
  }

  /**
   * Stop audio input
   */
  stopAudioInput(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
      console.log('[Gemini] Audio input stopped');
      this.emit('audioInputStopped');
    }
  }

  /**
   * Initialize audio output
   */
  async initializeAudio(): Promise<void> {
    if (this.audioStreamer) {
      console.log('[Gemini] Audio already initialized');
      return;
    }

    console.log('[Gemini] Initializing audio output...');
    
    // Create audio context for 24kHz (Gemini's default)
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: 24000 });
    }
    
    this.audioStreamer = new AudioStreamer(this.audioContext);
    console.log('[Gemini] ✅ Audio output ready');
  }

  /**
   * Update system instruction during session
   */
  updateInstructions(instructions: string): void {
    this.config.systemInstruction = instructions;
    
    // Gemini allows updating config mid-session
    const update = {
      setup: {
        systemInstruction: {
          parts: [{ text: instructions }]
        }
      }
    };

    console.log('[Gemini] Updating instructions');
    this.ws?.send(JSON.stringify(update));
  }

  /**
   * Reconnect after connection failure
   */
  private async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[Gemini] ❌ Max reconnection attempts reached');
      this.emit('error', new Error('Max reconnection attempts reached'));
      return;
    }
    
    this.reconnectAttempts++;
    console.log(`[Gemini] 🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    
    // Clean up existing connection
    this.cleanup(false);
    
    // Wait before reconnecting (exponential backoff)
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Reconnect
    try {
      await this.connect();
    } catch (error) {
      console.error('[Gemini] ❌ Reconnection failed:', error);
      // Will try again if under max attempts
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnect();
      }
    }
  }
  
  /**
   * Start bi-directional heartbeat to detect zombie connections
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    console.log('[Gemini] 💓 Starting heartbeat monitor');
    
    this.heartbeatInterval = setInterval(() => {
      if (!this.setupComplete) return;
      
      // Check if we're still waiting for pong from last heartbeat
      if (this.waitingForPong) {
        console.error('[Gemini] 💔 Heartbeat failed - no pong received - reconnecting');
        this.reconnect();
        return;
      }
      
      // Send heartbeat (simple text message that expects response)
      this.waitingForPong = true;
      
      try {
        // Send empty text as keepalive
        const heartbeat = {
          realtimeInput: {
            text: '' // Empty text as ping
          }
        };
        this.ws?.send(JSON.stringify(heartbeat));
        
        // Reset flag after timeout
        setTimeout(() => {
          if (this.waitingForPong) {
            console.error('[Gemini] 💔 No heartbeat response in 5s');
          }
          this.waitingForPong = false;
        }, 5000);
        
      } catch (error) {
        console.error('[Gemini] Failed to send heartbeat:', error);
        this.reconnect();
      }
    }, this.HEARTBEAT_INTERVAL);
  }
  
  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      this.waitingForPong = false;
    }
  }
  
  /**
   * Internal cleanup
   */
  private cleanup(stopWatchdog: boolean = true): void {
    if (stopWatchdog) {
      this.watchdog.stop();
    }
    
    this.stopHeartbeat();
    this.stopAudioInput();
    this.stopAudio();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.status = 'disconnected';
    this.setupComplete = false;
  }
  
  /**
   * Disconnect
   */
  disconnect(): void {
    console.log('[Gemini] Disconnecting...');
    this.cleanup(true);
    this.reconnectAttempts = 0;
    this.emit('disconnected');
  }

  getStatus(): string {
    return this.status;
  }

  isConnected(): boolean {
    return this.status === 'ready';
  }
}
