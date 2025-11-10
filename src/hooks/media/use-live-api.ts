/**
 * Simplified Gemini Live API Hook for Mastery Cards
 * Based on tutor-app's working implementation, stripped of lesson/agent complexity
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GenAILiveClient } from '../../lib/genai-live-client';
import { LiveConnectConfig, LiveServerToolCall } from '@google/genai';
import { AudioStreamer } from '../../lib/audio-streamer';
import { AudioRecorder } from '../../lib/audio-recorder';
import { audioContext } from '../../lib/utils';
import VolMeterWorklet from '../../lib/worklets/vol-meter';

export type UseLiveApiResults = {
  client: GenAILiveClient;
  setConfig: (config: LiveConnectConfig) => void;
  config: LiveConnectConfig;
  connect: () => Promise<void>;
  disconnect: () => void;
  connected: boolean;
  volume: number;
};

export function useLiveApi({
  apiKey,
}: {
  apiKey: string;
}): UseLiveApiResults {
  const client = useMemo(() => new GenAILiveClient(apiKey), [apiKey]);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastResponseTimeRef = useRef<number>(Date.now());

  const [volume, setVolume] = useState(0);
  const [connected, setConnected] = useState(false);
  const [config, setConfig] = useState<LiveConnectConfig>({});

  // Register audio streamer for output (server -> speakers)
  useEffect(() => {
    if (!audioStreamerRef.current) {
      audioContext({ id: 'audio-out' }).then((audioCtx: AudioContext) => {
        audioStreamerRef.current = new AudioStreamer(audioCtx);
        audioStreamerRef.current
          .addWorklet<any>('vumeter-out', VolMeterWorklet, (ev: any) => {
            setVolume(ev.data.volume);
          })
          .then(() => {
            console.log('[useLiveApi] Audio streamer initialized');
          })
          .catch(err => {
            console.error('[useLiveApi] Error adding worklet:', err);
          });
      });
    }
  }, [audioStreamerRef]);

  // Silence detection - check in if student is quiet for 5+ seconds
  const startSilenceTimer = useCallback(() => {
    // Clear existing timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    
    // Start new 5-second timer
    silenceTimerRef.current = setTimeout(() => {
      const timeSinceLastResponse = Date.now() - lastResponseTimeRef.current;
      
      // Only check in if truly silent for 5+ seconds and connected
      if (timeSinceLastResponse >= 5000 && client.status === 'connected') {
        console.log('[useLiveApi] 🤔 Silence detected, prompting Pi to check in...');
        client.send([{
          text: '[SILENCE_DETECTED: Student has been quiet for 5+ seconds. Check in with them. Ask if they need help, are thinking, or want to try again. Keep it casual and encouraging.]',
        }]);
      }
    }, 5000);
  }, [client]);

  // Event listeners
  useEffect(() => {
    const onOpen = () => {
      console.log('[useLiveApi] ✅ Connection opened');
      setConnected(true);
      lastResponseTimeRef.current = Date.now();
    };

    const onClose = (event: CloseEvent) => {
      console.error('[useLiveApi] ❌ Connection closed!', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      });
      setConnected(false);
      
      // CRITICAL: Stop microphone to prevent error spam
      if (audioRecorderRef.current) {
        console.log('[useLiveApi] 🛑 Stopping microphone after disconnect');
        audioRecorderRef.current.stop();
        audioRecorderRef.current = null;
      }
      
      // Stop audio output
      if (audioStreamerRef.current) {
        audioStreamerRef.current.stop();
      }
      
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
    
    const onError = (event: ErrorEvent) => {
      console.error('[useLiveApi] ❌ Connection error!', event);
    };

    const stopAudioStreamer = () => {
      if (audioStreamerRef.current) {
        audioStreamerRef.current.stop();
      }
    };

    const onAudio = (data: ArrayBuffer) => {
      if (audioStreamerRef.current) {
        audioStreamerRef.current.addPCM16(new Uint8Array(data));
      }
      // Reset silence timer when Pi speaks
      startSilenceTimer();
    };

    // Tool call handler - will be set up by App.tsx
    const onToolCall = (toolCall: LiveServerToolCall) => {
      console.log('[useLiveApi] Tool call received:', toolCall);
      // App.tsx will register its own handler
      lastResponseTimeRef.current = Date.now(); // Reset on tool calls too
      startSilenceTimer();
    };
    
    // Handle GoAway messages - connection will soon close
    const onGoAway = (goAway: any) => {
      const timeLeftSeconds = goAway.timeLeft?.seconds || 0;
      console.warn(`[useLiveApi] ⚠️ GoAway received - connection closing in ${timeLeftSeconds}s`);
      // Could trigger reconnection here if needed
    };
    
    // Handle session resumption updates - save token for reconnection
    const onSessionResumption = (update: any) => {
      if (update.resumable && update.newHandle) {
        console.log('[useLiveApi] 📌 Session resumption token received:', update.newHandle.substring(0, 20) + '...');
        // Store in localStorage for reconnection
        localStorage.setItem('gemini-session-token', update.newHandle);
      }
    };
    
    // Bind event listeners
    client.on('open', onOpen);
    client.on('close', onClose);
    client.on('error', onError);
    client.on('interrupted', stopAudioStreamer);
    client.on('audio', onAudio);
    client.on('toolcall', onToolCall);

    // Start silence detection after connection
    if (connected) {
      startSilenceTimer();
    }

    // Note: GoAway and SessionResumption events would need to be added to GenAILiveClient
    // For now, they're defined but not subscribed (SDK may not expose them yet)
    
    // Cleanup
    return () => {
      client.off('open', onOpen);
      client.off('close', onClose);
      client.off('error', onError);
      client.off('interrupted', stopAudioStreamer);
      client.off('audio', onAudio);
      client.off('toolcall', onToolCall);
      
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [client, connected, startSilenceTimer]);

  const connect = useCallback(async () => {
    if (!config) {
      throw new Error('config has not been set');
    }

    // Don't disconnect if already connected
    if (client.status === 'connected') {
      console.log('[useLiveApi] Already connected');
      return;
    }

    try {
      console.log('[useLiveApi] Connecting...');
      await client.connect(config);
      console.log('[useLiveApi] ✅ Connected successfully');
      
      // Start microphone input after connection
      if (!audioRecorderRef.current) {
        console.log('[useLiveApi] Starting microphone...');
        
        // Create AudioRecorder with 16kHz sample rate
        audioRecorderRef.current = new AudioRecorder(16000);
        
        // AudioRecorder already emits base64-encoded strings
        audioRecorderRef.current.on('data', (base64Data: string) => {
          // Reset silence timer when student's audio is detected
          lastResponseTimeRef.current = Date.now();
          
          // Send as realtime input
          client.sendRealtimeInput([{
            mimeType: 'audio/pcm',
            data: base64Data
          }]);
        });
        
        // Start recording (it will request microphone permission)
        await audioRecorderRef.current.start();
        console.log('[useLiveApi] ✅ Microphone started');
      }
      
      // Send initial message to trigger Pi to speak first
      // Small delay to ensure everything is ready
      setTimeout(() => {
        console.log('[useLiveApi] 🎤 Triggering Pi to speak first...');
        client.send([{
          text: 'start',  // Minimal trigger - Pi's system prompt says "YOU SPEAK FIRST!"
        }]);
      }, 800);
    } catch (error) {
      console.error('[useLiveApi] ❌ Connection failed:', error);
      throw error;
    }
  }, [client, config]);

  const disconnect = useCallback(() => {
    console.log('[useLiveApi] Disconnecting and stopping audio...');
    
    // Stop audio output
    if (audioStreamerRef.current) {
      audioStreamerRef.current.stop();
    }
    
    // Stop microphone input
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
      audioRecorderRef.current = null;
    }
    
    client.disconnect();
    setConnected(false);
  }, [client]);

  return {
    client,
    config,
    setConfig,
    connect,
    connected,
    disconnect,
    volume,
  };
}
