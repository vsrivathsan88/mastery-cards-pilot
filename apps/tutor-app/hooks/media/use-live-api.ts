/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GenAILiveClient } from '../../lib/genai-live-client';
import { LiveConnectConfig, Modality, LiveServerToolCall } from '@google/genai';
import { AudioStreamer } from '../../lib/audio-streamer';
import { audioContext } from '../../lib/utils';
import VolMeterWorket from '../../lib/worklets/vol-meter';
import { useLogStore, useSettings, useLessonStore } from '@/lib/state';
import { useTeacherPanel } from '@/lib/teacher-panel-store';
import { AgentOrchestrator, PromptManager, formatLessonContext, formatMilestoneTransition, formatMisconceptionFeedback, formatEmotionalFeedback } from '@simili/agents';
import { LessonLoader } from '@simili/lessons';
import { LessonData } from '@simili/shared';
import { apiClient } from '../../lib/api-client';

export type UseLiveApiResults = {
  client: GenAILiveClient;
  setConfig: (config: LiveConnectConfig) => void;
  config: LiveConnectConfig;

  connect: () => Promise<void>;
  disconnect: () => void;
  connected: boolean;

  volume: number;
  
  // Lesson management
  orchestrator: AgentOrchestrator;
  loadLesson: (lessonId: string) => void;
};

export function useLiveApi({
  apiKey,
}: {
  apiKey: string;
}): UseLiveApiResults {
  const { model } = useSettings();
  const client = useMemo(() => new GenAILiveClient(apiKey, model), [apiKey, model]);
  const orchestrator = useMemo(() => new AgentOrchestrator(apiKey), [apiKey]);

  const audioStreamerRef = useRef<AudioStreamer | null>(null);

  const [volume, setVolume] = useState(0);
  const [connected, setConnected] = useState(false);
  const [config, setConfig] = useState<LiveConnectConfig>({});
  
  // Connect orchestrator to client
  useEffect(() => {
    orchestrator.setClient(client);
  }, [client, orchestrator]);

  // register audio for streaming server -> speakers
  useEffect(() => {
    if (!audioStreamerRef.current) {
      audioContext({ id: 'audio-out' }).then((audioCtx: AudioContext) => {
        audioStreamerRef.current = new AudioStreamer(audioCtx);
        audioStreamerRef.current
          .addWorklet<any>('vumeter-out', VolMeterWorket, (ev: any) => {
            setVolume(ev.data.volume);
          })
          .then(() => {
            // Successfully added worklet
          })
          .catch(err => {
            console.error('Error adding worklet:', err);
          });
      });
    }
  }, [audioStreamerRef]);

  useEffect(() => {
    const onOpen = () => {
      setConnected(true);
    };

    const onClose = () => {
      setConnected(false);
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
    };

    // Bind event listeners
    client.on('open', onOpen);
    client.on('close', onClose);
    client.on('interrupted', stopAudioStreamer);
    client.on('audio', onAudio);

    const onToolCall = (toolCall: LiveServerToolCall) => {
      const functionResponses: any[] = [];

      for (const fc of toolCall.functionCalls) {
        // Log the function call trigger
        const triggerMessage = `Triggering function call: **${
          fc.name
        }**\n\`\`\`json\n${JSON.stringify(fc.args, null, 2)}\n\`\`\``;
        useLogStore.getState().addTurn({
          role: 'system',
          text: triggerMessage,
          isFinal: true,
        });

        // Handle lesson tools
        if (fc.name === 'show_image') {
          const { imageId, context } = fc.args;
          
          console.log(`[useLiveApi] 🖼️ Showing image: ${imageId}`, context);
          
          // Update lesson store with current image
          useLessonStore.getState().setCurrentImage(imageId);
          
          // Prepare success response
          functionResponses.push({
            id: fc.id,
            name: fc.name,
            response: { 
              success: true,
              imageId,
              message: `Image "${imageId}" is now displayed to the student.`
            },
          });
        } else {
          // Default response for other tools
          functionResponses.push({
            id: fc.id,
            name: fc.name,
            response: { result: 'ok' }, // simple, hard-coded function response
          });
        }
      }

      // Log the function call response
      if (functionResponses.length > 0) {
        const responseMessage = `Function call response:\n\`\`\`json\n${JSON.stringify(
          functionResponses,
          null,
          2,
        )}\n\`\`\``;
        useLogStore.getState().addTurn({
          role: 'system',
          text: responseMessage,
          isFinal: true,
        });
      }

      client.sendToolResponse({ functionResponses: functionResponses });
    };

    client.on('toolcall', onToolCall);

    return () => {
      // Clean up event listeners
      client.off('open', onOpen);
      client.off('close', onClose);
      client.off('interrupted', stopAudioStreamer);
      client.off('audio', onAudio);
      client.off('toolcall', onToolCall);
    };
  }, [client]);

  const connect = useCallback(async () => {
    if (!config) {
      throw new Error('config has not been set');
    }
    const promptLength = config.systemInstruction?.parts?.[0]?.text?.length || 0;
    const promptPreview = config.systemInstruction?.parts?.[0]?.text?.substring(0, 100) || '';
    
    console.log('[useLiveApi] 🔌 Connecting...', { 
      hasSystemInstruction: !!config.systemInstruction,
      promptLength,
      promptPreview: promptPreview + '...'
    });
    
    // Don't disconnect if already connected - just check for pending context
    if (client.status === 'connected') {
      console.log('[useLiveApi] Already connected');
      // Check if there's pending lesson context to send
      const pending = (client as any)._pendingLessonContext;
      if (pending) {
        console.log('[useLiveApi] ✉️ Sending pending lesson context...');
        client.sendTextMessage(pending);
        delete (client as any)._pendingLessonContext;
        console.log('[useLiveApi] ✅ Lesson context sent!');
      }
      return;
    }
    
    try {
      await client.connect(config);
      console.log('[useLiveApi] ✅ Connected successfully!', {
        promptLength,
        hasTranscription: !!(config.inputAudioTranscription || config.outputAudioTranscription)
      });
      
      // Send any pending lesson context after successful connection
      const pending = (client as any)._pendingLessonContext;
      if (pending) {
        // Wait a moment for connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('[useLiveApi] ✉️ Sending lesson context after connection...');
        client.sendTextMessage(pending);
        delete (client as any)._pendingLessonContext;
        console.log('[useLiveApi] ✅ Lesson context sent!');
      }
    } catch (error) {
      console.error('[useLiveApi] ❌ Connection failed:', error);
      throw error;
    }
  }, [client, config]);

  const disconnect = useCallback(async () => {
    console.log('[useLiveApi] 🛑 Disconnecting and stopping audio immediately...');
    
    // INSTANT STOP: Stop audio streamer first for immediate silence
    if (audioStreamerRef.current) {
      audioStreamerRef.current.stop();
    }
    
    // Then disconnect the client
    client.disconnect();
    setConnected(false);
    
    console.log('[useLiveApi] ✓ Disconnected and audio stopped');
  }, [setConnected, client]);

  // Setup transcription analysis (Phase 3D: Backend integration)
  useEffect(() => {
    const handleInputTranscription = async (text: string, isFinal: boolean) => {
      // Only analyze final transcriptions (complete utterances)
      if (!isFinal || text.trim().length === 0) {
        return;
      }

      console.log('[useLiveApi] 📝 Final transcription received:', text);

      // Get current lesson context
      const currentLesson = orchestrator.getPedagogyEngine().getCurrentLesson();
      if (!currentLesson) {
        console.log('[useLiveApi] No lesson active, skipping analysis');
        return;
      }

      const progress = orchestrator.getPedagogyEngine().getProgress();

      try {
        console.log('[useLiveApi] 🔍 Sending to backend for analysis...');

        // Send to backend for multi-agent analysis
        const analysis = await apiClient.analyze({
          transcription: text,
          isFinal: true,
          lessonContext: {
            lessonId: currentLesson.id,
            milestoneIndex: progress?.currentMilestoneIndex || 0,
            attempts: progress?.attempts || 0,
            timeOnMilestone: progress?.timeOnMilestone || 0,
          },
        });

        console.log('[useLiveApi] ✅ Backend analysis received:', analysis);

        // If misconception detected, send feedback to agent
        if (analysis.misconception?.detected && analysis.misconception.confidence && analysis.misconception.confidence > 0.7) {
          console.log('[useLiveApi] ⚠️ Misconception detected:', analysis.misconception.type);

          // Format misconception feedback as JSON
          const feedback = formatMisconceptionFeedback([{
            misconception: analysis.misconception.type || 'unknown',
            detected: true,
            confidence: analysis.misconception.confidence,
            evidence: analysis.misconception.evidence || text,
            intervention: analysis.misconception.intervention || 'Address this misconception gently',
            correction: analysis.misconception.correctiveConcept || 'Guide toward correct understanding',
          }]);

          // Send to agent
          if (client.status === 'connected') {
            console.log('[useLiveApi] ✉️ Sending misconception feedback to agent...');
            client.sendTextMessage(feedback);
            console.log('[useLiveApi] ✅ Misconception feedback sent!');
          }

          // Log in UI for visibility (optional - can remove in production)
          useLogStore.getState().addTurn({
            role: 'system',
            text: `🔍 Detected: ${analysis.misconception.type} (${Math.round(analysis.misconception.confidence * 100)}% confidence)`,
            isFinal: true,
          });
        } else {
          console.log('[useLiveApi] ✅ No misconception detected');
        }

        // Phase 3E: Handle emotional state feedback
        if (analysis.emotional && analysis.emotional.state !== 'neutral') {
          console.log('[useLiveApi] 😊 Emotional state:', analysis.emotional.state);

          // Format emotional feedback as JSON
          const emotionalFeedback = formatEmotionalFeedback({
            state: analysis.emotional.state,
            engagementLevel: analysis.emotional.engagementLevel,
            frustrationLevel: analysis.emotional.frustrationLevel,
            confusionLevel: analysis.emotional.confusionLevel,
            recommendation: analysis.emotional.recommendation,
          });

          // Send to agent
          if (client.status === 'connected') {
            console.log('[useLiveApi] ✉️ Sending emotional feedback to agent...');
            client.sendTextMessage(emotionalFeedback);
            console.log('[useLiveApi] ✅ Emotional feedback sent!');
          }

          // Log significant emotional states in UI
          if (analysis.emotional.frustrationLevel > 0.6 || analysis.emotional.confusionLevel > 0.6) {
            const emoji = analysis.emotional.state === 'frustrated' ? '😤' : '😕';
            useLogStore.getState().addTurn({
              role: 'system',
              text: `${emoji} Student seems ${analysis.emotional.state}`,
              isFinal: true,
            });
          }
        }

        // TODO Phase 3F: Handle vision analysis feedback
        // TODO Phase 3G: Handle milestone verification

      } catch (error) {
        console.error('[useLiveApi] ❌ Backend analysis failed:', error);
        // Don't block the conversation if backend fails - just log
      }
    };

    // Bind transcription handler
    client.on('inputTranscription', handleInputTranscription);

    return () => {
      client.off('inputTranscription', handleInputTranscription);
    };
  }, [client, orchestrator, apiClient]);

  // Setup pedagogy engine event listeners
  useEffect(() => {
    const pedagogyEngine = orchestrator.getPedagogyEngine();
    
    const onProgressUpdate = (progress: any) => {
      useLessonStore.getState().updateProgress(progress);
    };
    
    const onMilestoneCompleted = (milestone: any) => {
      const celebration = PromptManager.generateCelebration(milestone);
      useLessonStore.getState().celebrate(celebration);
      
      // Log celebration to conversation
      useLogStore.getState().addTurn({
        role: 'system',
        text: `🎉 ${celebration}`,
        isFinal: true,
      });
      
      // Send milestone transition context to agent as JSON message
      const currentLesson = pedagogyEngine.getCurrentLesson();
      const nextMilestone = pedagogyEngine.getCurrentMilestone();
      
      if (currentLesson && nextMilestone) {
        const progress = pedagogyEngine.getProgress();
        
        // Send JSON milestone transition to agent
        const transitionMessage = formatMilestoneTransition(
          milestone,
          nextMilestone,
          progress?.currentMilestoneIndex || 0,
          currentLesson.milestones.length
        );
        
        console.log('[useLiveApi] 🎯 Moving to milestone', progress?.currentMilestoneIndex || 0, ':', nextMilestone.title);
        
        // Send to connected agent
        if (client.status === 'connected') {
          console.log('[useLiveApi] ✉️ Sending milestone transition...');
          client.sendTextMessage(transitionMessage);
          console.log('[useLiveApi] ✅ Milestone transition sent!');
        }
        
        // Log the transition in UI (user-friendly version)
        useLogStore.getState().addTurn({
          role: 'system',
          text: `📍 Moving to: **${nextMilestone.title}**`,
          isFinal: true,
        });
      }
    };
    
    const onLessonCompleted = (lesson: LessonData) => {
      useLogStore.getState().addTurn({
        role: 'system',
        text: `🏆 Congratulations! You've completed "${lesson.title}"!`,
        isFinal: true,
      });
    };
    
    pedagogyEngine.on('progress_update', onProgressUpdate);
    pedagogyEngine.on('milestone_completed', onMilestoneCompleted);
    pedagogyEngine.on('lesson_completed', onLessonCompleted);
    
    return () => {
      pedagogyEngine.off('progress_update', onProgressUpdate);
      pedagogyEngine.off('milestone_completed', onMilestoneCompleted);
      pedagogyEngine.off('lesson_completed', onLessonCompleted);
    };
  }, [orchestrator]);

  // Lesson loading function
  const loadLesson = useCallback((lessonId: string) => {
    const lesson = LessonLoader.getLesson(lessonId);
    if (lesson) {
      console.log('[useLiveApi] 📚 Loading lesson:', lesson.title);
      
      // Set lesson in orchestrator and store
      orchestrator.setLesson(lesson);
      useLessonStore.getState().setLesson(lesson);
      
      // Start Teacher Panel session
      useTeacherPanel.getState().startSession(lesson.id, lesson.title);
      console.log('[useLiveApi] 📊 Teacher Panel session started');
      
      // Format lesson context as a message (not system prompt)
      const currentMilestone = lesson.milestones[0];
      const lessonContextMessage = formatLessonContext({
        lesson,
        milestone: currentMilestone,
        milestoneIndex: 0,
        isFirstMilestone: true
      });
      
      console.log('[useLiveApi] 📝 Formatted lesson context:', lessonContextMessage.substring(0, 150) + '...');
      
      // If already connected, send the lesson context immediately
      if (client.status === 'connected') {
        console.log('[useLiveApi] ✉️ Sending lesson context to connected agent...');
        client.sendTextMessage(lessonContextMessage);
        console.log('[useLiveApi] ✅ Lesson context sent!');
      } else {
        console.log('[useLiveApi] ⏳ Will send lesson context after connection');
        // Store for sending after connection
        (client as any)._pendingLessonContext = lessonContextMessage;
      }
      
      // Log lesson start in UI
      useLogStore.getState().addTurn({
        role: 'system',
        text: `📚 Starting lesson: **${lesson.title}**\n\n${lesson.description}`,
        isFinal: true,
      });
      
      console.log('[useLiveApi] ✅ Lesson loaded successfully');
    } else {
      console.error('[useLiveApi] ❌ Lesson not found:', lessonId);
    }
  }, [orchestrator, client]);

  return {
    client,
    config,
    setConfig,
    connect,
    connected,
    disconnect,
    volume,
    orchestrator,
    loadLesson,
  };
}