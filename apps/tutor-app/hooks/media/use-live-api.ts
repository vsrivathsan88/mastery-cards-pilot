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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚠️ DEBUG ONLY - Agent Monitoring
// TO REMOVE: Delete this import and all debug code blocks
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useAgentDebugStore, debugLog } from '@/lib/agent-debug-store';
import { canvasManipulationService } from '@/services/CanvasManipulationService';
import { useEmojiReactionStore } from '@/lib/emoji-reaction-store';
import { OutcomeTrackerService } from '@/services/OutcomeTrackerService';
import { PILOT_MODE } from '@/lib/pilot-config';

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
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ⚠️ DEBUG ONLY - Monitor Agent Activity
    // TO REMOVE: Delete this entire block
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const setupAgentDebugMonitoring = () => {
      // Check if getMultiAgentGraph exists (only in full orchestrator, not browser version)
      const multiAgentGraph = typeof orchestrator.getMultiAgentGraph === 'function' 
        ? orchestrator.getMultiAgentGraph() 
        : null;
      const contextManager = orchestrator.getContextManager();
      
      if (!contextManager) {
        debugLog('Context manager not available for monitoring');
        return;
      }
      
      if (!multiAgentGraph) {
        debugLog('Multi-agent graph not available (using browser-safe orchestrator)');
        // Continue with context manager monitoring only
      }
      
      debugLog('🔬 Agent debug monitoring enabled');
      
      // Monitor agent lifecycle events (if they exist and if multiAgentGraph exists)
      // Note: These events don't exist yet - we'll add them next
      if (multiAgentGraph) {
        try {
          // @ts-ignore - Events will be added to MultiAgentGraph
          multiAgentGraph.on?.('agent:start', (data: any) => {
          debugLog('Agent started', data);
          useAgentDebugStore.getState().addActivity({
            turn: data.turn,
            timestamp: data.timestamp || Date.now(),
            agent: data.agent,
            status: 'running',
          });
        });
        
        // @ts-ignore
        multiAgentGraph.on?.('agent:complete', (data: any) => {
          debugLog('Agent completed', data);
          useAgentDebugStore.getState().addActivity({
            turn: data.turn,
            timestamp: data.timestamp || Date.now(),
            agent: data.agent,
            status: 'complete',
            duration: data.duration,
            result: data.result,
          });
        });
        
        // @ts-ignore
        multiAgentGraph.on?.('agent:error', (data: any) => {
          debugLog('Agent error', data);
          useAgentDebugStore.getState().addActivity({
            turn: data.turn,
            timestamp: Date.now(),
            agent: data.agent,
            status: 'error',
          });
        });
        } catch (error) {
          debugLog('Failed to attach agent event listeners (expected if events not implemented yet)');
        }
      }
      
      // Monitor prerequisite gaps (if events exist)
      try {
        // @ts-ignore - Events will be added to ContextManager
        contextManager.on?.('prerequisite:gap', (gap: any) => {
          debugLog('Prerequisite gap detected', gap);
          useAgentDebugStore.getState().addPrerequisiteGap({
            turn: gap.turn,
            timestamp: Date.now(),
            prerequisiteId: gap.prerequisiteId,
            concept: gap.concept,
            status: gap.status,
            confidence: gap.confidence,
            evidence: gap.evidence,
            nextAction: gap.nextAction,
            detectedGap: gap.detectedGap,
            resolved: gap.resolved,
          });
        });
        
        // @ts-ignore
        contextManager.on?.('prerequisite:resolved', (data: any) => {
          debugLog('Prerequisite gap resolved', data);
          useAgentDebugStore.getState().resolvePrerequisiteGap(data.prerequisiteId);
        });
      } catch (error) {
        debugLog('Failed to attach prerequisite event listeners (expected if events not implemented yet)');
      }
    };
    
    setupAgentDebugMonitoring();
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // END DEBUG BLOCK
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
          useLessonStore.getState().setCurrentImage(imageId as string);
          
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
        } else if (fc.name === 'mark_milestone_complete') {
          const { milestoneId, evidence, confidence } = fc.args;
          
          console.log(`[useLiveApi] ✅ Tool call: mark_milestone_complete`, { milestoneId, evidence, confidence });
          
          // ✅ FIX: Use pedagogy engine as single source of truth
          const pedagogyEngine = orchestrator.getPedagogyEngine();
          const currentMilestone = pedagogyEngine.getCurrentMilestone();
          
          if (currentMilestone?.id === milestoneId) {
            // This will trigger the 'milestone_completed' event
            // which already has a handler that updates both stores
            pedagogyEngine.completeMilestone();
            
            console.log(`[useLiveApi] ✅ Milestone completed via tool call: ${milestoneId}`);
            
            functionResponses.push({
              id: fc.id,
              name: fc.name,
              response: { 
                success: true,
                milestoneId,
                message: `Milestone "${milestoneId}" completed successfully (confidence: ${confidence})`
              },
            });
          } else {
            // Milestone ID mismatch - log warning
            console.warn(`[useLiveApi] ⚠️ Milestone ID mismatch in tool call:`, {
              requested: milestoneId,
              current: currentMilestone?.id,
            });
            
            functionResponses.push({
              id: fc.id,
              name: fc.name,
              response: { 
                success: false,
                error: `Milestone mismatch: expected ${currentMilestone?.id}, got ${milestoneId}`
              },
            });
          }
        } else if (fc.name === 'update_milestone_progress') {
          const { milestoneId, progressPercent, feedback } = fc.args;
          
          console.log(`[useLiveApi] 📈 Updating milestone progress: ${milestoneId}`, { progressPercent, feedback });
          
          // Extract concepts from feedback (simple heuristic)
          const concepts = [feedback as string];
          
          // Update teacher panel
          useTeacherPanel.getState().logMilestoneProgress(
            milestoneId as string, 
            feedback as string, 
            concepts
          );
          
          // Update lesson progress
          const currentProgress = useLessonStore.getState().progress;
          if (currentProgress) {
            useLessonStore.getState().updateProgress({
              ...currentProgress,
              percentComplete: progressPercent as number,
            });
          }
          
          functionResponses.push({
            id: fc.id,
            name: fc.name,
            response: { 
              success: true,
              milestoneId,
              progressPercent,
              message: `Progress updated to ${progressPercent}%. ${feedback}`
            },
          });
        } else if (fc.name === 'highlight_canvas_area') {
          const { reason, duration } = fc.args;
          
          console.log(`[useLiveApi] 🎯 Highlighting canvas area`, { reason, duration });
          
          // TODO: Implement canvas highlight effect when canvas component is ready
          // For now, just log it
          
          functionResponses.push({
            id: fc.id,
            name: fc.name,
            response: { 
              success: true,
              message: `Canvas area highlighted: ${reason}`
            },
          });
        } 
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // PILOT TOOLS - New tools for outcome tracking pilot
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        else if (fc.name === 'draw_on_canvas') {
          const { shapeType, coordinates, strokeWidth, purpose, temporary, animated } = fc.args;
          
          console.log(`[useLiveApi] 🎨 PILOT: Drawing on canvas`, { shapeType, purpose, temporary });
          
          // Draw on canvas using CanvasManipulationService
          let shapeId: string | null = null;
          let success = false;
          let errorMessage = '';

          if (!canvasManipulationService.isReady()) {
            errorMessage = 'Canvas not ready yet';
            console.warn(`[useLiveApi] ${errorMessage}`);
          } else {
            try {
              switch (shapeType) {
                case 'line':
                  shapeId = canvasManipulationService.drawLine({
                    x1: coordinates.x1,
                    y1: coordinates.y1,
                    x2: coordinates.x2,
                    y2: coordinates.y2,
                    strokeWidth,
                    temporary,
                    animated,
                  });
                  break;
                  
                case 'circle':
                  shapeId = canvasManipulationService.drawCircle({
                    cx: coordinates.cx,
                    cy: coordinates.cy,
                    radius: coordinates.radius,
                    strokeWidth,
                    temporary,
                    animated,
                  });
                  break;
                  
                case 'rectangle':
                  shapeId = canvasManipulationService.drawRectangle({
                    x: coordinates.x,
                    y: coordinates.y,
                    width: coordinates.width,
                    height: coordinates.height,
                    strokeWidth,
                    temporary,
                    animated,
                  });
                  break;
                  
                case 'arrow':
                  shapeId = canvasManipulationService.drawArrow({
                    x1: coordinates.x1,
                    y1: coordinates.y1,
                    x2: coordinates.x2,
                    y2: coordinates.y2,
                    strokeWidth,
                    temporary,
                    animated,
                  });
                  break;
                  
                case 'freehand':
                  shapeId = canvasManipulationService.drawFreehand({
                    points: coordinates.points || [],
                    strokeWidth,
                    temporary,
                    animated,
                  });
                  break;
                  
                default:
                  errorMessage = `Unknown shape type: ${shapeType}`;
                  console.warn(`[useLiveApi] ${errorMessage}`);
              }

              success = shapeId !== null;
            } catch (error) {
              errorMessage = `Failed to draw: ${error}`;
              console.error(`[useLiveApi] ${errorMessage}`, error);
            }
          }
          
          // Log to teacher panel for tracking
          useLogStore.getState().addTurn({
            role: 'system',
            text: success 
              ? `🎨 Pi drew ${shapeType}: ${purpose}${temporary ? ' (temporary)' : ''}`
              : `❌ Failed to draw ${shapeType}: ${errorMessage}`,
            isFinal: true,
          });
          
          functionResponses.push({
            id: fc.id,
            name: fc.name,
            response: success ? { 
              success: true,
              message: `Drawing added to canvas: ${shapeType} for ${purpose}`,
              shapeId,
              coordinates,
            } : {
              success: false,
              error: errorMessage,
            },
          });
        } else if (fc.name === 'add_canvas_label') {
          const { text, position, style, fontSize, temporary, pointsTo } = fc.args;
          
          console.log(`[useLiveApi] 🏷️ PILOT: Adding canvas label`, { text, style, temporary });
          
          // Add text to canvas using CanvasManipulationService
          let success = false;
          let errorMessage = '';
          let shapeId: string | null = null;

          if (!canvasManipulationService.isReady()) {
            errorMessage = 'Canvas not ready yet';
            console.warn(`[useLiveApi] ${errorMessage}`);
          } else {
            try {
              shapeId = canvasManipulationService.addText({
                text,
                x: position.x,
                y: position.y,
                fontSize,
                style,
                temporary,
                pointsTo,
              });
              success = shapeId !== null;
            } catch (error) {
              errorMessage = `Failed to add label: ${error}`;
              console.error(`[useLiveApi] ${errorMessage}`, error);
            }
          }
          
          // Log to teacher panel for tracking
          useLogStore.getState().addTurn({
            role: 'system',
            text: success
              ? `🏷️ Pi added label: "${text}" (${style || 'annotation'})${temporary ? ' (temporary)' : ''}`
              : `❌ Failed to add label: ${errorMessage}`,
            isFinal: true,
          });
          
          functionResponses.push({
            id: fc.id,
            name: fc.name,
            response: success ? { 
              success: true,
              message: `Label "${text}" added to canvas`,
              shapeId,
              position,
            } : {
              success: false,
              error: errorMessage,
            },
          });
        } else if (fc.name === 'show_emoji_reaction') {
          const { emoji, intensity, duration, position, reason } = fc.args;
          
          console.log(`[useLiveApi] 😊 PILOT: Showing emoji reaction`, { emoji, intensity, reason });
          
          // Show emoji using EmojiReactionStore
          useEmojiReactionStore.getState().showReaction(
            emoji as string,
            (intensity as 'subtle' | 'normal' | 'celebration') || 'normal',
            (duration as number) || 2,
            (position as 'avatar' | 'center' | 'canvas') || 'avatar',
            reason as string
          );
          
          // Show in log as visual feedback
          useLogStore.getState().addTurn({
            role: 'pi',
            text: `${emoji}`,
            isFinal: true,
          });
          
          // Log to teacher panel for tracking
          console.log(`[useLiveApi] 😊 Pi showed emoji: ${emoji} - ${reason}`);
          
          functionResponses.push({
            id: fc.id,
            name: fc.name,
            response: { 
              success: true,
              message: `Emoji reaction shown: ${emoji}`,
              intensity: intensity || 'normal',
              position: position || 'avatar',
            },
          });
        } else if (fc.name === 'verify_student_work') {
          const { verificationPrompt, focusArea, highlightCanvas } = fc.args;
          
          console.log(`[useLiveApi] ✅ PILOT: Verification prompt`, { focusArea, verificationPrompt });
          
          // If highlightCanvas requested, highlight the canvas area
          if (highlightCanvas && canvasManipulationService.isReady()) {
            // Highlight full canvas area (adjust coordinates as needed)
            canvasManipulationService.highlightRegion(50, 50, 400, 300, 3000);
            console.log(`[useLiveApi] Highlighted canvas for verification`);
          }
          
          // Log verification prompt to teacher panel
          useLogStore.getState().addTurn({
            role: 'system',
            text: `✅ Pi asked for verification (${focusArea}): "${verificationPrompt}"`,
            isFinal: true,
          });
          
          functionResponses.push({
            id: fc.id,
            name: fc.name,
            response: { 
              success: true,
              message: `Verification prompt sent to student: ${verificationPrompt}`,
              focusArea,
              highlighted: highlightCanvas && canvasManipulationService.isReady(),
            },
          });
        } 
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // END PILOT TOOLS
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        else {
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

      // CRITICAL: Pass transcription to pedagogy engine for milestone detection
      // This must happen FIRST for immediate milestone detection
      orchestrator.getPedagogyEngine().processTranscription(text, isFinal);

      // Get current lesson context
      const currentLesson = orchestrator.getPedagogyEngine().getCurrentLesson();
      if (!currentLesson) {
        console.log('[useLiveApi] No lesson active, skipping analysis');
        return;
      }

      const progress = orchestrator.getPedagogyEngine().getProgress();
      const currentMilestone = orchestrator.getPedagogyEngine().getCurrentMilestone();

      // ✅ SIMPLIFIED: No upfront prerequisite checks!
      // Milestone 0 warmup keywords ARE the prerequisite check (instant, no LLM needed)
      // Keywords like "different", "bigger", "smaller" prove they understand the concepts
      // This makes lesson start instant instead of waiting 1-4 seconds for LLM calls

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

        console.log('[useLiveApi] ✅ Backend analysis received:', {
          hasEmotional: !!analysis.emotional,
          hasMisconception: !!analysis.misconception,
          emotionalState: analysis.emotional?.state,
          misconceptionType: analysis.misconception?.type,
        });

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // Bridge: Forward subagent outputs to teacher panel
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        try {
          useTeacherPanel.getState().syncAgentInsights(
            analysis.emotional || undefined,
            analysis.misconception || undefined,
            text
          );
          console.log('[useLiveApi] 📊 Agent insights synced to teacher panel');
        } catch (error) {
          console.error('[useLiveApi] ❌ Failed to sync insights to teacher panel:', error);
        }
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        // If misconception detected, send feedback to agent
        if (analysis.misconception?.detected && analysis.misconception.confidence && analysis.misconception.confidence > 0.7) {
          console.log('[useLiveApi] ⚠️ Misconception detected:', analysis.misconception.type);

          // Format misconception feedback as JSON
          const feedback = formatMisconceptionFeedback({
            type: analysis.misconception.type || 'unknown',
            evidence: analysis.misconception.evidence || text,
            intervention: analysis.misconception.intervention || 'Address this misconception gently',
            correctiveConcept: analysis.misconception.correctiveConcept || 'Guide toward correct understanding',
          });

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
        console.error('[useLiveApi] 💡 Make sure backend server is running:');
        console.error('[useLiveApi]    cd apps/api-server && npm run dev');
        
        // Show user-friendly error in UI
        useLogStore.getState().addTurn({
          role: 'system',
          text: '⚠️ Agent analysis unavailable (backend offline). Teacher panel and adaptive behavior disabled.',
          isFinal: true,
        });
        
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
    
    const onMilestoneDetected = (milestone: any, transcription: string) => {
      // 📊 LOG TO TEACHER PANEL: Student working on milestone
      const { logMilestoneProgress } = require('../lib/teacher-panel-store').useTeacherPanel.getState();
      logMilestoneProgress(
        milestone.id,
        transcription,
        milestone.keywords || []
      );
      console.log('[useLiveApi] 📝 Milestone progress logged to teacher panel:', milestone.title);
    };
    
    const onMilestoneCompleted = async (milestone: any) => {
      const celebration = PromptManager.generateCelebration(milestone);
      useLessonStore.getState().celebrate(celebration);
      
      // 🧪 PILOT: Collect outcome evidence
      if (PILOT_MODE.enabled && PILOT_MODE.features.outcomeEvidence) {
        try {
          // Get recent transcript (last 30 seconds of student speech)
          const turns = useLogStore.getState().turns;
          const recentStudentTurns = turns
            .filter(t => t.role === 'user' && t.isFinal)
            .slice(-3)
            .map(t => t.text)
            .join(' ');
          
          // Get canvas snapshot if available
          let canvasSnapshot: string | null = null;
          let canvasShapeCount = 0;
          try {
            const canvasRef = (document.querySelector('[data-canvas-ref]') as any)?.getSnapshot;
            if (canvasRef) {
              canvasSnapshot = await canvasRef();
              canvasShapeCount = (document.querySelector('[data-canvas-ref]') as any)?.getShapeCount?.() || 0;
            }
          } catch (error) {
            console.warn('[useLiveApi] Could not get canvas snapshot:', error);
          }
          
          // Get tool calls for this milestone (from logs)
          const toolCalls = turns
            .filter(t => t.role === 'system' && t.text.includes('Pi drew') || t.text.includes('Pi added'))
            .slice(-5)
            .map(t => ({
              name: t.text.includes('drew') ? 'draw_on_canvas' : 'add_canvas_label',
              timestamp: t.timestamp.getTime(),
              purpose: t.text,
            }));
          
          // Collect evidence
          const evidence = await OutcomeTrackerService.collectEvidence(milestone, {
            transcript: recentStudentTurns,
            canvasSnapshot: canvasSnapshot || undefined,
            canvasShapeCount,
            toolCallsUsed: toolCalls,
            timeSpent: milestone.timeSpent || 60, // Default 60s if not tracked
            attemptCount: 1,
          });
          
          console.log('[useLiveApi] 🧪 Outcome evidence collected:', evidence);
          
          // TODO: Store evidence with milestone log
          // This would require updating logMilestoneComplete to accept evidence
        } catch (error) {
          console.error('[useLiveApi] Failed to collect outcome evidence:', error);
        }
      }
      
      // 📊 LOG TO TEACHER PANEL: Milestone completed
      const { logMilestoneComplete } = require('../lib/teacher-panel-store').useTeacherPanel.getState();
      logMilestoneComplete(
        milestone.id,
        `Student mastered: ${milestone.title}`
      );
      console.log('[useLiveApi] ✅ Milestone completion logged to teacher panel:', milestone.title);
      
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
        
        // ✅ FIX: Log new milestone start to teacher panel
        useTeacherPanel.getState().logMilestoneStart(
          nextMilestone.id,
          nextMilestone.title
        );
        console.log('[useLiveApi] 📝 Next milestone logged to teacher panel:', nextMilestone.title);
        
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
    pedagogyEngine.on('milestone_detected', onMilestoneDetected);
    pedagogyEngine.on('milestone_completed', onMilestoneCompleted);
    pedagogyEngine.on('lesson_completed', onLessonCompleted);
    
    return () => {
      pedagogyEngine.off('progress_update', onProgressUpdate);
      pedagogyEngine.off('milestone_detected', onMilestoneDetected);
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