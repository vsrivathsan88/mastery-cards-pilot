/**
 * Gemini Live API Client using Official SDK
 * Based on Google's reference implementation
 */

import {
  GoogleGenAI,
  LiveConnectConfig,
  Part,
} from '@google/genai';
import { EventEmitter } from 'eventemitter3';
import { AudioStreamer } from './audio-streamer';

export interface GeminiLiveConfig {
  apiKey: string;
  model?: string;
  systemInstruction?: string;
  temperature?: number;
  voice?: string;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export class GeminiLiveClient extends EventEmitter {
  private client: GoogleGenAI;
  private session: any = null;
  private config: GeminiLiveConfig;
  private status: 'disconnected' | 'connecting' | 'connected' | 'ready' = 'disconnected';
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioStreamer: AudioStreamer | null = null;
  private setupComplete: boolean = false;
  private audioRecorder: any = null;

  constructor(config: GeminiLiveConfig) {
    super();
    this.config = {
      model: config.model || 'models/gemini-2.5-flash',
      systemInstruction: config.systemInstruction || '',
      temperature: config.temperature || 0.8,
      voice: config.voice || 'Puck',
      ...config
    };

    this.client = new GoogleGenAI({
      apiKey: config.apiKey,
    });
  }

  async connect(): Promise<void> {
    if (this.status === 'connected' || this.status === 'ready') {
      console.log('[Gemini SDK] Already connected');
      return;
    }

    this.status = 'connecting';
    console.log('[Gemini SDK] Connecting to Live API...');

    // Setup audio output
    await this.initAudioOutput();

    // Connect to Gemini Live
    const connectConfig: LiveConnectConfig = {
      temperature: this.config.temperature,
      responseModalities: ['AUDIO'] as any,
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: this.config.voice,
          },
        },
      },
    };

    // Add system instruction if provided
    if (this.config.systemInstruction) {
      (connectConfig as any).systemInstruction = {
        parts: [{ text: this.config.systemInstruction }],
      };
    }

    try {
      this.session = await this.client.live.connect({
        model: this.config.model!,
        config: connectConfig,
        callbacks: {
          onopen: () => {
            console.log('[Gemini SDK] ✅ Connected');
            this.status = 'connected';
            this.emit('open');
          },
          onmessage: (message: any) => {
            this.handleMessage(message);
          },
          onerror: (error: ErrorEvent) => {
            console.error('[Gemini SDK] ❌ Error:', error);
            this.emit('error', error);
          },
          onclose: (event: CloseEvent) => {
            console.log('[Gemini SDK] Connection closed');
            this.status = 'disconnected';
            this.emit('close', event);
          },
        },
      });

      console.log('[Gemini SDK] Session created, waiting for setupComplete...');

    } catch (error) {
      console.error('[Gemini SDK] Failed to connect:', error);
      this.status = 'disconnected';
      throw error;
    }
  }

  private async initAudioOutput(): Promise<void> {
    console.log('[Gemini SDK] Initializing audio output...');

    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      console.log('[Gemini SDK] AudioContext created:', this.audioContext.sampleRate);
    }

    if (!this.audioStreamer) {
      this.audioStreamer = new AudioStreamer(this.audioContext);
      console.log('[Gemini SDK] ✅ AudioStreamer ready');
    }
  }

  private handleMessage(message: any): void {
    console.log('[Gemini SDK] 📨 Message received:', JSON.stringify(message, null, 2));

    // Setup complete
    if (message.setupComplete) {
      console.log('[Gemini SDK] ✅ Setup complete - ready for audio');
      this.setupComplete = true;
      this.status = 'ready';
      this.emit('setupcomplete');
      return;
    }

    // Server content
    if (message.serverContent) {
      const { serverContent } = message;

      // Interruption
      if (serverContent.interrupted) {
        console.log('[Gemini SDK] ⚠️ Interrupted');
        this.emit('interrupted');
        return;
      }

      // Input transcription (user speech)
      if (serverContent.inputTranscription) {
        const text = serverContent.inputTranscription.text;
        console.log('[Gemini SDK] 🎤 User:', text);
        this.emit('userTranscript', text);
      }

      // Output transcription (AI speech)
      if (serverContent.outputTranscription) {
        const text = serverContent.outputTranscription.text;
        console.log('[Gemini SDK] 🤖 AI:', text);
        this.emit('aiTranscript', text);
      }

      // Model turn (audio + text)
      if (serverContent.modelTurn) {
        const parts: Part[] = serverContent.modelTurn.parts || [];

        // Handle audio parts
        const audioParts = parts.filter(p =>
          p.inlineData?.mimeType?.startsWith('audio/pcm')
        );

        audioParts.forEach(part => {
          if (part.inlineData?.data) {
            const audioData = base64ToArrayBuffer(part.inlineData.data);
            
            // Convert to PCM16 for AudioStreamer
            const uint8Data = new Uint8Array(audioData);
            if (this.audioStreamer) {
              this.audioStreamer.addPCM16(uint8Data);
            }
          }
        });

        // Handle text parts
        const textParts = parts.filter(p => p.text);
        textParts.forEach(part => {
          if (part.text) {
            console.log('[Gemini SDK] 💬 Text:', part.text);
            this.emit('text', part.text);
          }
        });
      }

      // Turn complete
      if (serverContent.turnComplete) {
        console.log('[Gemini SDK] ✅ Turn complete');
        this.emit('turnComplete');
      }
    }

    // Tool calls (for future function calling)
    if (message.toolCall) {
      console.log('[Gemini SDK] 🔧 Tool call:', message.toolCall);
      this.emit('toolCall', message.toolCall);
    }
  }

  async startAudioInput(): Promise<void> {
    if (!this.setupComplete) {
      throw new Error('Setup not complete - cannot start audio input');
    }

    console.log('[Gemini SDK] Starting audio input...');

    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      console.log('[Gemini SDK] Microphone access granted');
      this.emit('audioInputStarted');

      // Create audio context for input
      const audioContext = new AudioContext({ sampleRate: 16000 });
      const source = audioContext.createMediaStreamSource(this.mediaStream);

      let workletNode: AudioWorkletNode | ScriptProcessorNode;

      // Try AudioWorklet first (modern approach)
      try {
        await audioContext.audioWorklet.addModule(
          new URL('./audio-input-processor.ts', import.meta.url)
        );

        workletNode = new AudioWorkletNode(audioContext, 'audio-input-processor');

        // Handle processed audio data
        workletNode.port.onmessage = (event: MessageEvent) => {
          if (!this.session) return;

          const pcm16Buffer = event.data as ArrayBuffer;
          const uint8 = new Uint8Array(pcm16Buffer);
          const base64 = btoa(String.fromCharCode(...uint8));

          // Send to Gemini
          this.session.sendRealtimeInput([{
            mimeType: 'audio/pcm;rate=16000',
            data: base64,
          }]);
        };

        console.log('[Gemini SDK] ✅ Using AudioWorkletNode (modern)');

      } catch (workletError) {
        console.warn('[Gemini SDK] ⚠️ AudioWorklet not supported, falling back to ScriptProcessorNode');
        console.warn('[Gemini SDK] Error:', workletError);

        // Fallback to ScriptProcessorNode (deprecated but works everywhere)
        const processor = audioContext.createScriptProcessor(4096, 1, 1);

        processor.onaudioprocess = (e) => {
          if (!this.session) return;

          const inputData = e.inputBuffer.getChannelData(0);

          // Convert Float32 to PCM16
          const pcm16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }

          // Convert to base64
          const uint8 = new Uint8Array(pcm16.buffer);
          const base64 = btoa(String.fromCharCode(...uint8));

          // Send to Gemini
          this.session.sendRealtimeInput([{
            mimeType: 'audio/pcm;rate=16000',
            data: base64,
          }]);
        };

        workletNode = processor;
        console.log('[Gemini SDK] ✅ Using ScriptProcessorNode (fallback - works in all browsers)');
      }

      source.connect(workletNode);
      workletNode.connect(audioContext.destination);

      this.audioRecorder = { audioContext, source, workletNode };

      console.log('[Gemini SDK] ✅ Audio input streaming started');

    } catch (error) {
      console.error('[Gemini SDK] Failed to start audio input:', error);
      throw error;
    }
  }

  stopAudioInput(): void {
    if (this.audioRecorder) {
      this.audioRecorder.workletNode.disconnect();
      this.audioRecorder.source.disconnect();
      this.audioRecorder.audioContext.close();
      this.audioRecorder = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    this.emit('audioInputStopped');
    console.log('[Gemini SDK] Audio input stopped');
  }

  sendText(text: string): void {
    if (!this.session) {
      console.error('[Gemini SDK] Cannot send text - not connected');
      return;
    }

    console.log('[Gemini SDK] Sending text:', text);
    this.session.sendClientContent({
      turns: [{ text }],
      turnComplete: true,
    });
  }

  sendImage(base64Image: string, mimeType: string = 'image/jpeg'): void {
    if (!this.session) {
      console.error('[Gemini SDK] Cannot send image - not connected');
      return;
    }

    console.log('[Gemini SDK] Sending image...');
    this.session.sendClientContent({
      turns: [{
        inlineData: {
          mimeType,
          data: base64Image,
        }
      }],
      turnComplete: true,
    });
  }

  sendImageWithText(base64Image: string, text: string, mimeType: string = 'image/jpeg'): void {
    if (!this.session) {
      console.error('[Gemini SDK] Cannot send content - not connected');
      return;
    }

    console.log('[Gemini SDK] Sending image with text...');
    this.session.sendClientContent({
      turns: [
        {
          inlineData: {
            mimeType,
            data: base64Image,
          }
        },
        { text }
      ],
      turnComplete: true,
    });
  }

  disconnect(): void {
    console.log('[Gemini SDK] Disconnecting...');

    this.stopAudioInput();

    if (this.audioStreamer) {
      this.audioStreamer.stop();
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.session) {
      this.session.close();
      this.session = null;
    }

    this.setupComplete = false;
    this.status = 'disconnected';
  }

  isConnected(): boolean {
    return this.status === 'connected' || this.status === 'ready';
  }

  getStatus(): string {
    return this.status;
  }
}
