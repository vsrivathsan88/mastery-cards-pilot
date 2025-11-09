import { useEffect, useRef, useState, useCallback } from 'react';
import PopUp from '../popup/PopUp';
import WelcomeScreen from '../welcome-screen/WelcomeScreen';
import { LessonProgress } from '../../LessonProgress';
import { LessonCanvas, LessonCanvasRef } from '../../LessonCanvas';
import { LessonImage } from '../../LessonImage';
import { CozyWorkspace } from '../../cozy/CozyWorkspace';
import { CozyCelebration } from '../../cozy/CozyCelebration';
import { CozyEncouragementParticles } from '../../cozy/CozyEncouragementParticles';
import { CozyMicroCelebration } from '../../cozy/CozyMicroCelebration';
import { LoadingState } from '../../cozy/LoadingState';
import { FirstLessonTutorial } from '../../cozy/FirstLessonTutorial';
import { EmojiReaction } from '../../pilot/EmojiReaction';
import { useEmojiReactionStore } from '@/lib/emoji-reaction-store';
// import { SpeechIndicator } from '../../cozy/SpeechIndicator'; // REMOVED: Too cluttered
import { LiveConnectConfig, Modality, LiveServerContent } from '@google/genai';
import { AudioRecorder } from '../../../lib/audio-recorder';
import { useAgentContext } from '../../../hooks/useAgentContext';
import { useTeacherPanel } from '../../../lib/teacher-panel-store';
import { useUser } from '../../../contexts/UserContext';
import { PromptBuilder } from '../../../services/PromptBuilder';

import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';
import {
  useSettings,
  useLogStore,
  useTools,
  useLessonStore,
  ConversationTurn,
} from '@/lib/state';

const formatTimestamp = (date: Date) => {
  const pad = (num: number, size = 2) => num.toString().padStart(size, '0');
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  const milliseconds = pad(date.getMilliseconds(), 3);
  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
};

const filterThinkingContent = (text: string): string => {
  if (!text) return text;
  
  let filtered = text;
  
  // Remove explicit thinking tags
  filtered = filtered.replace(/<think>.*?<\/think>/gis, ' ');
  filtered = filtered.replace(/:::thinking:::.*?:::/gis, ' ');
  filtered = filtered.replace(/\[THINKING\].*?\[\/THINKING\]/gis, ' ');
  
  // Remove meta-commentary about crafting responses
  filtered = filtered.replace(/\*\*[^*]+\*\*\s*(?:I've|I'm|The|This|Now|Let me).{0,500}?(?=(?:[.!?]\s+(?:[A-Z]|$))|$)/gis, ' ');
  
  // Remove specific thinking patterns
  filtered = filtered.replace(/(?:^|\.\s+)(?:I've acknowledged|I'm now|I've crafted|The plan is|I can hear you|I should|I need to|I'll|Let me think|First,? I|The strategy|My approach).{0,300}?(?=[.!?](?:\s|$)|$)/gis, ' ');
  
  // Remove parenthetical thinking
  filtered = filtered.replace(/\([^)]*(?:strategy|approach|thinking|reasoning|plan|internally)[^)]*\)/gi, ' ');
  
  // Remove "Okay" or "Alright" sentence fragments that are thinking artifacts
  filtered = filtered.replace(/^(?:Okay|Alright|Right|Got it)[.,!]\s*/i, '');
  
  // Clean up whitespace
  filtered = filtered.replace(/\s+/g, ' ').trim();
  
  // If we filtered out everything, return empty
  if (!filtered || filtered.length < 3) return '';
  
  return filtered;
};

const renderContent = (text: string) => {
  // Filter out thinking/reasoning content first
  const filteredText = filterThinkingContent(text);
  
  // Split by ```json...``` code blocks
  const parts = filteredText.split(/(`{3}json\n[\s\S]*?\n`{3})/g);

  return parts.map((part, index) => {
    if (part.startsWith('```json')) {
      const jsonContent = part.replace(/^`{3}json\n|`{3}$/g, '');
      return (
        <pre key={index}>
          <code>{jsonContent}</code>
        </pre>
      );
    }

    // Split by **bold** text
    const boldParts = part.split(/(\*\*.*?\*\*)/g);
    return boldParts.map((boldPart, boldIndex) => {
      if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
        return <strong key={boldIndex}>{boldPart.slice(2, -2)}</strong>;
      }
      return boldPart;
    });
  });
};


export default function StreamingConsole() {
  const { client, setConfig, connected, connect, disconnect } = useLiveAPIContext();
  const { voice } = useSettings();
  const { tools } = useTools();
  const { currentLesson, progress, celebrationMessage } = useLessonStore();
  const turns = useLogStore(state => state.turns);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showPopUp, setShowPopUp] = useState(false);
  const canvasRef = useRef<LessonCanvasRef>(null);
  
  // 🎯 AGENT INTEGRATION - Use our new agent services!
  const {
    systemPrompt,           // Dynamic prompt with agent context
    currentContext,         // Latest agent insights
    isAnalyzing,           // Are agents processing?
    analyzeTranscription,  // Trigger agent analysis
    analyzeVision,         // Trigger vision analysis
    initializeLesson,      // Initialize agents with lesson
    getShouldUseFiller,    // Check if filler needed
    getFiller,             // Get filler text
    agentStats,            // Debug stats
    agentService,          // Direct access to service for events
  } = useAgentContext();
  
  // 📊 TEACHER PANEL - Sync agent insights with teacher panel
  const { syncAgentInsights, startSession } = useTeacherPanel();
  
  // 👤 USER DATA - Get child's name for personalization
  const { userData } = useUser();
  
  // Set student name for personalized prompts
  useEffect(() => {
    if (userData?.name) {
      PromptBuilder.setStudentName(userData.name);
      console.log('[StreamingConsole] Student name set for prompts:', userData.name);
    }
  }, [userData?.name]);
  
  // Audio controls
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [muted, setMuted] = useState(false);
  
  // Track speaking state for kid-friendly UI
  const [piSpeaking, setPiSpeaking] = useState(false);
  const [studentSpeaking, setStudentSpeaking] = useState(false);
  
  // Track milestone completions for particles
  const [particleTrigger, setParticleTrigger] = useState(0);
  const prevMilestonesRef = useRef(progress?.completedMilestones || 0);
  
  // Track positive understanding for micro-celebrations
  const [microTrigger, setMicroTrigger] = useState(0);
  
  // Filler state
  const [isWaitingForAgents, setIsWaitingForAgents] = useState(false);
  const agentTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // First-time tutorial state
  const [showTutorial, setShowTutorial] = useState(false);
  const hasCheckedTutorial = useRef(false);
  
  // Canvas state for vision analysis
  const [canvasHasContent, setCanvasHasContent] = useState(false);
  const lastCanvasAnalysisRef = useRef<number>(0);
  const lastShapeCountRef = useRef<number>(0);
  
  // Get last messages for soundwave display
  const lastPiMessage = turns.filter(t => t.role === 'agent').slice(-1)[0]?.text || '';
  const lastStudentMessage = turns.filter(t => t.role === 'user').slice(-1)[0]?.text || '';
  const isConnected = client.status === 'connected';

  const handleClosePopUp = () => {
    setShowPopUp(false);
  };

  // Granular control handlers
  const handleConnect = () => {
    connect();
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleMuteToggle = () => {
    setMuted(!muted);
  };

  const handleHelp = () => {
    setShowPopUp(true);
  };

  const handleExport = () => {
    const { systemPrompt, model } = useSettings.getState();
    const { tools } = useTools.getState();
    const { turns } = useLogStore.getState();

    const logData = {
      configuration: {
        model,
        systemPrompt,
      },
      tools,
      conversation: turns.map(turn => ({
        ...turn,
        timestamp: turn.timestamp.toISOString(),
      })),
    };

    const jsonString = JSON.stringify(logData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.href = url;
    a.download = `live-api-logs-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    useLogStore.getState().clearTurns();
  };

  // 👁️ Canvas change handler - called when student draws
  const handleCanvasChange = useCallback((hasContent: boolean) => {
    setCanvasHasContent(hasContent);
    
    if (!hasContent) return; // Skip if canvas is empty
    
    const currentShapeCount = canvasRef.current?.getShapeCount() || 0;
    const timeSinceLastAnalysis = Date.now() - lastCanvasAnalysisRef.current;
    
    // Only analyze if:
    // 1. Shape count actually changed (diff detection)
    // 2. At least 3 seconds passed since last analysis (debounce)
    if (currentShapeCount !== lastShapeCountRef.current && timeSinceLastAnalysis > 3000) {
      console.log('[StreamingConsole] 👁️ Canvas changed, scheduling vision analysis...', {
        oldCount: lastShapeCountRef.current,
        newCount: currentShapeCount,
      });
      
      lastShapeCountRef.current = currentShapeCount;
      
      // Debounce: wait 2 seconds after last draw before analyzing
      setTimeout(() => {
        triggerVisionAnalysis('canvas_change');
      }, 2000);
    }
  }, []);

  // 👁️ Trigger vision analysis (with rate limiting and diff detection)
  const triggerVisionAnalysis = useCallback(async (reason: string) => {
    if (!canvasRef.current || !canvasHasContent) {
      console.log('[StreamingConsole] ⏭️ Skipping vision analysis - no canvas content');
      return;
    }

    const timeSinceLastAnalysis = Date.now() - lastCanvasAnalysisRef.current;
    if (timeSinceLastAnalysis < 5000) {
      console.log('[StreamingConsole] ⏭️ Skipping vision analysis - too soon (rate limited)');
      return;
    }

    console.log('[StreamingConsole] 👁️ Triggering vision analysis:', reason);
    
    try {
      const snapshot = await canvasRef.current.getSnapshot();
      if (!snapshot) {
        console.log('[StreamingConsole] ⚠️ Failed to get canvas snapshot');
        return;
      }

      console.log('[StreamingConsole] ✅ Got canvas snapshot, analyzing...');
      lastCanvasAnalysisRef.current = Date.now();
      
      // Call vision analysis (non-blocking, won't reset tutor state)
      await analyzeVision(snapshot);
      
      console.log('[StreamingConsole] ✅ Vision analysis complete (incremental update)');
    } catch (error) {
      console.error('[StreamingConsole] ❌ Vision analysis failed:', error);
    }
  }, [canvasHasContent, analyzeVision]);

  // 🎯 Initialize agents when lesson loads
  useEffect(() => {
    if (currentLesson) {
      console.log('[StreamingConsole] 🚀 Initializing agents for lesson:', currentLesson.title);
      initializeLesson(currentLesson);
      
      // 📊 Initialize teacher panel session
      console.log('[StreamingConsole] 📊 Starting teacher panel session');
      startSession(currentLesson.id, currentLesson.title);
    }
  }, [currentLesson, initializeLesson, startSession]);

  // 🔄 DYNAMIC CONTEXT UPDATES - Send agent insights to Gemini mid-conversation
  useEffect(() => {
    if (!currentContext || !isConnected) return;

    // Build concise context update
    const contextUpdate = PromptBuilder.buildContextUpdate(currentContext);
    
    // Only send if we have meaningful insights
    const hasMeaningfulContext = 
      currentContext.emotional ||
      (currentContext.misconceptions && currentContext.misconceptions.length > 0) ||
      (currentContext.vision && currentContext.vision.needsVoiceOver);
    
    if (hasMeaningfulContext) {
      console.log('[StreamingConsole] 🔄 Sending context update to Gemini:', {
        hasEmotional: !!currentContext.emotional,
        misconceptions: currentContext.misconceptions?.length || 0,
        hasVision: !!currentContext.vision,
      });
      
      // Send to Gemini Live as hidden message
      client.sendContextUpdate(contextUpdate);
    }
  }, [currentContext, isConnected, client]);

  // 🎓 Show first-time tutorial when connected
  useEffect(() => {
    if (isConnected && !hasCheckedTutorial.current) {
      // Check if user has seen the tutorial before
      const hasSeenTutorial = localStorage.getItem('simili_hasSeenFirstLessonTutorial');
      
      if (!hasSeenTutorial) {
        console.log('[StreamingConsole] 🎓 First lesson! Showing tutorial...');
        // Delay tutorial slightly so UI settles
        setTimeout(() => {
          setShowTutorial(true);
        }, 1500);
      }
      
      hasCheckedTutorial.current = true;
    }
  }, [isConnected]);

  // Tutorial completion handler
  const handleTutorialComplete = useCallback(() => {
    console.log('[StreamingConsole] ✅ Tutorial completed');
    setShowTutorial(false);
    localStorage.setItem('simili_hasSeenFirstLessonTutorial', 'true');
  }, []);

  // 👁️ Periodic canvas check (every 20 seconds while connected)
  useEffect(() => {
    if (!isConnected || isAnalyzing || !canvasHasContent) {
      return;
    }

    const intervalId = setInterval(() => {
      console.log('[StreamingConsole] 👁️ Periodic canvas check...');
      // Trigger vision analysis if canvas has content
      triggerVisionAnalysis('periodic_check');
    }, 20000); // Every 20 seconds

    return () => clearInterval(intervalId);
  }, [isConnected, isAnalyzing, canvasHasContent, triggerVisionAnalysis]);

  // Audio recorder effect
  useEffect(() => {
    if (!connected) {
      setMuted(false);
    }
  }, [connected]);

  useEffect(() => {
    const onData = (base64: string) => {
      client.sendRealtimeInput([
        {
          mimeType: 'audio/pcm;rate=16000',
          data: base64,
        },
      ]);
    };
    if (connected && !muted && audioRecorder) {
      audioRecorder.on('data', onData);
      audioRecorder.start();
    } else {
      audioRecorder.stop();
    }
    return () => {
      audioRecorder.off('data', onData);
    };
  }, [connected, client, muted, audioRecorder]);

  // Detect milestone completions and trigger particles
  useEffect(() => {
    if (progress) {
      const currentMilestones = progress.completedMilestones;
      if (currentMilestones > prevMilestonesRef.current) {
        setParticleTrigger(prev => prev + 1);
        prevMilestonesRef.current = currentMilestones;
      }
    }
  }, [progress]);

  // Track tool count to detect when tools load
  const prevToolCountRef = useRef(0);
  const configUpdateCountRef = useRef(0);

  // Set the configuration for the Live API
  // Update when systemPrompt changes (e.g., when lesson loads) but only if not connected
  useEffect(() => {
    const enabledTools = tools
      .filter(tool => tool.isEnabled)
      .map(tool => ({
        functionDeclarations: [
          {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          },
        ],
      }));

    // Using `any` for config to accommodate `speechConfig`, which is not in the
    // current TS definitions but is used in the working reference example.
    const config: any = {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voice,
          },
        },
      },
      // Enable transcription (language auto-detected, no languageCode field)
      inputAudioTranscription: {},   // Enable input transcription
      outputAudioTranscription: {},  // Enable output transcription
      systemInstruction: {
        parts: [
          {
            text: systemPrompt,
          },
        ],
      },
      tools: enabledTools,
    };

    console.log('[StreamingConsole] 🔍 SYSTEM PROMPT FROM STATE:', systemPrompt.substring(0, 100) + '...');
    const currentToolCount = enabledTools.length;
    const prevToolCount = prevToolCountRef.current;
    const isConnectedNow = client.status === 'connected';
    
    console.log('%c[StreamingConsole] 🔍 Setting config with:', 'color: #3b82f6; font-weight: bold;', {
      promptLength: systemPrompt.length,
      toolCount: currentToolCount,
      tools: enabledTools.map(t => t.functionDeclarations[0].name),
      configUpdateCount: configUpdateCountRef.current,
      isConnected: isConnectedNow,
      prevToolCount,
    });
    
    setConfig(config);
    console.log('%c[StreamingConsole] ✅ Config set with', 'color: #22c55e; font-weight: bold;', currentToolCount, 'tools');
    
    // Debug check: Verify config has tools
    if (currentToolCount === 0) {
      console.error('%c[StreamingConsole] ❌ CRITICAL: No tools in config!', 'color: #ef4444; font-weight: bold;');
      console.error('[StreamingConsole] This means tool calls will NOT work!');
    } else if (currentToolCount < 9) {
      console.warn('%c[StreamingConsole] ⚠️ WARNING: Expected 9 tools, got', 'color: #f59e0b; font-weight: bold;', currentToolCount);
      console.warn('[StreamingConsole] Pilot mode might not be enabled!');
    } else {
      console.log('%c[StreamingConsole] 🎉 Perfect! All 9 tools loaded', 'color: #22c55e; font-weight: bold;');
    }
    
    // ✅ CRITICAL FIX: Force reconnection when tools become available
    // This handles the case where user connected BEFORE tools loaded
    if (prevToolCount === 0 && currentToolCount > 0 && isConnectedNow) {
      console.log('[StreamingConsole] 🔄 CRITICAL: Tools just loaded but already connected!');
      console.log('[StreamingConsole] 🔄 Forcing reconnection to register tools with Gemini...');
      
      // Disconnect and reconnect to send new config with tools
      disconnect();
      
      setTimeout(() => {
        console.log('[StreamingConsole] 🔌 Reconnecting with', currentToolCount, 'tools...');
        connect();
      }, 1000); // 1 second delay to ensure clean disconnect
    }
    
    prevToolCountRef.current = currentToolCount;
    configUpdateCountRef.current += 1;
    
  }, [setConfig, systemPrompt, tools, voice, client.status, disconnect, connect]); // ✅ FIXED: Added tools and voice to dependencies

  useEffect(() => {
    const { addTurn, updateLastTurn } = useLogStore.getState();

    const handleInputTranscription = (text: string, isFinal: boolean) => {
      const turns = useLogStore.getState().turns;
      const last = turns[turns.length - 1];
      if (last && last.role === 'user' && !last.isFinal) {
        // Accumulate the raw text first
        const fullText = last.text + text;
        updateLastTurn({
          text: fullText,
          isFinal,
        });
      } else {
        addTurn({ role: 'user', text, isFinal });
      }
      
      // Update speaking state
      setStudentSpeaking(!isFinal);
      
      // 🎯 AGENT ANALYSIS - When student finishes speaking
      if (isFinal && text.trim().length > 0) {
        console.log('[StreamingConsole] 🧠 Student finished speaking, running agents...');
        
        // 👁️ VISION ANALYSIS - Check if student mentioned their drawing
        const mentionsDrawing = /\b(draw|drew|sketch|look|show|canvas|workspace|circle|rectangle|shape|line|divided?|cut)\b/i.test(text);
        if (mentionsDrawing && canvasHasContent) {
          console.log('[StreamingConsole] 👁️ Student mentioned drawing, triggering vision analysis...');
          // Trigger vision analysis (non-blocking, won't interrupt conversation)
          triggerVisionAnalysis('student_mentioned_drawing');
        }
        
        // Start agent analysis in background
        analyzeTranscription(text).then(insights => {
          console.log('[StreamingConsole] ✅ Agents complete:', {
            duration: insights.processingTime,
            hasEmotional: !!insights.emotional,
            hasMisconception: !!insights.misconception,
          });
          
          // 📊 TEACHER PANEL: Sync agent insights
          syncAgentInsights(insights.emotional, insights.misconception, text);
          
          // 🌟 MICRO-CELEBRATION: Trigger subtle encouragement for positive signals
          const showMicroCelebration = (
            // No misconception detected (correct understanding)
            !insights.misconception?.detected ||
            // OR positive emotional state
            (insights.emotional?.state === 'confident' || 
             insights.emotional?.state === 'excited') ||
            // OR high engagement
            (insights.emotional?.engagementLevel && insights.emotional.engagementLevel > 0.7)
          );
          
          if (showMicroCelebration) {
            console.log('[StreamingConsole] ✨ Micro-celebration triggered for positive feedback');
            setMicroTrigger(prev => prev + 1);
          }
          
          // Clear agent waiting state
          if (agentTimerRef.current) {
            clearTimeout(agentTimerRef.current);
            agentTimerRef.current = null;
          }
          setIsWaitingForAgents(false);
        }).catch(error => {
          console.error('[StreamingConsole] ❌ Agent analysis failed:', error);
          setIsWaitingForAgents(false);
        });
        
        // 🎯 FILLER LOGIC - If agents might be slow, use filler
        agentTimerRef.current = setTimeout(() => {
          if (getShouldUseFiller()) {
            const filler = getFiller();
            if (filler) {
              console.log('[StreamingConsole] 💬 Using filler:', filler);
              // TODO: Send filler to Gemini as immediate response
              // For now, just log it
              setIsWaitingForAgents(true);
            }
          }
        }, 500); // Wait 500ms before considering filler
      }
    };

    const handleOutputTranscription = (text: string, isFinal: boolean) => {
      const turns = useLogStore.getState().turns;
      const last = turns[turns.length - 1];
      
      // Check if we should update the existing turn or create a new one
      // We update if: last turn exists, is from agent, and is the same ongoing utterance
      const shouldUpdate = last && last.role === 'agent' && !last.isFinal;
      
      if (shouldUpdate) {
        // Accumulate the raw text first
        const fullText = last.text + text;
        updateLastTurn({
          text: fullText,
          isFinal, // Use the isFinal from transcription, not from turncomplete
        });
      } else {
        addTurn({ role: 'agent', text, isFinal });
      }
      
      // Update speaking state
      setPiSpeaking(!isFinal);
    };

    // FIX: The 'content' event provides a single LiveServerContent object.
    // The function signature is updated to accept one argument, and groundingMetadata is extracted from it.
    const handleContent = (serverContent: LiveServerContent) => {
      const text =
        serverContent.modelTurn?.parts
          ?.map((p: any) => p.text)
          .filter(Boolean)
          .join(' ') ?? '';
      const groundingChunks = serverContent.groundingMetadata?.groundingChunks;

      if (!text && !groundingChunks) return;

      const turns = useLogStore.getState().turns;
      const last = turns.at(-1);

      if (last?.role === 'agent' && !last.isFinal) {
        const updatedTurn: Partial<ConversationTurn> = {
          text: last.text + text,
        };
        if (groundingChunks) {
          // Map Google's GroundingChunk to our type (make uri and title required)
          const mappedChunks = groundingChunks.map(chunk => ({
            web: chunk.web ? {
              uri: chunk.web.uri || '',
              title: chunk.web.title || ''
            } : undefined
          })).filter(chunk => chunk.web) as any;
          updatedTurn.groundingChunks = [
            ...(last.groundingChunks || []),
            ...mappedChunks,
          ];
        }
        updateLastTurn(updatedTurn);
      } else {
        // Map Google's GroundingChunk to our type
        const mappedChunks = groundingChunks?.map(chunk => ({
          web: chunk.web ? {
            uri: chunk.web.uri || '',
            title: chunk.web.title || ''
          } : undefined
        })).filter(chunk => chunk.web) as any;
        addTurn({ role: 'agent', text, isFinal: false, groundingChunks: mappedChunks });
      }
    };

    const handleTurnComplete = () => {
      const last = useLogStore.getState().turns.at(-1);
      if (last && !last.isFinal) {
        updateLastTurn({ isFinal: true });
      }
    };

    client.on('inputTranscription', handleInputTranscription);
    client.on('outputTranscription', handleOutputTranscription);
    client.on('content', handleContent);
    client.on('turncomplete', handleTurnComplete);

    return () => {
      client.off('inputTranscription', handleInputTranscription);
      client.off('outputTranscription', handleOutputTranscription);
      client.off('content', handleContent);
      client.off('turncomplete', handleTurnComplete);
    };
  }, [client, analyzeTranscription, getShouldUseFiller, getFiller]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns]);

  // Create tab content
  const progressTab = (
    <div>
      {currentLesson && progress ? (
        <LessonProgress lesson={currentLesson} progress={progress} />
      ) : (
        <div style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>
          No active lesson
        </div>
      )}
    </div>
  );

  const chatTab = (
    <div 
      ref={scrollRef}
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px',
        maxHeight: '100%',
        overflow: 'auto'
      }}
    >
      {turns.length === 0 ? (
        <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 20px' }}>
          Start chatting to see conversation history
        </div>
      ) : (
        turns.map((t, i) => (
          <div
            key={i}
            style={{
              backgroundColor: t.role === 'agent' ? '#f1f5f9' : '#eef2ff',
              padding: '14px 16px',
              borderRadius: '12px',
              borderLeft: `3px solid ${t.role === 'agent' ? '#6366f1' : '#10b981'}`
            }}
          >
            <div style={{
              fontSize: '12px',
              color: '#64748b',
              marginBottom: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: '600', color: '#334155' }}>
                {t.role === 'user' ? 'You' : t.role === 'agent' ? 'Pi' : 'System'}
              </span>
              <span>{formatTimestamp(t.timestamp)}</span>
            </div>
            <div style={{ color: '#1e293b', fontSize: '14px', lineHeight: '1.6' }}>
              {renderContent(t.text)}
            </div>
            {!t.isFinal && (
              <div style={{ 
                fontSize: '11px', 
                color: '#94a3b8', 
                marginTop: '6px',
                fontStyle: 'italic'
              }}>
                typing...
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  const helpTab = (
    <div style={{ color: '#334155', fontSize: '14px', lineHeight: '1.8' }}>
      <h3 style={{ color: '#6366f1', marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
        🎮 How to Play
      </h3>
      <ul style={{ paddingLeft: '20px', margin: '0 0 24px 0' }}>
        <li>Click "Connect" to start your session with Pi</li>
        <li>Speak naturally - Pi will help you learn</li>
        <li>Use the canvas to draw and show your work</li>
        <li>Complete milestones to progress through the lesson</li>
        <li>Check the Progress tab to see how you're doing</li>
      </ul>
      
      <h3 style={{ color: '#6366f1', marginTop: '24px', marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
        🎤 Voice Commands
      </h3>
      <ul style={{ paddingLeft: '20px', margin: 0 }}>
        <li>"I need help" - Ask Pi for hints</li>
        <li>"Repeat that" - Hear the last instruction again</li>
        <li>"I'm done" - Submit your answer</li>
      </ul>
    </div>
  );

  const tabs = [
    { id: 'progress', label: 'Progress', icon: '📊', content: progressTab },
    { id: 'chat', label: 'Chat Log', icon: '💬', content: chatTab },
    { id: 'help', label: 'Help', icon: '❓', content: helpTab }
  ];

  // Get current milestone name
  const currentMilestone = currentLesson?.milestones?.[progress?.currentMilestoneIndex || 0];
  const currentMilestoneName = currentMilestone?.title || '';

  // PILOT: Subscribe to emoji reactions
  const { currentReaction } = useEmojiReactionStore();

  return (
    <div className="transcription-container" style={{ height: '100%' }}>
      {showPopUp && <PopUp onClose={handleClosePopUp} />}
      
      {/* Floating encouragement particles */}
      <CozyEncouragementParticles trigger={particleTrigger} />
      <CozyMicroCelebration trigger={microTrigger} />
      
      {/* PILOT: Emoji reactions from Pi */}
      <EmojiReaction reaction={currentReaction} />
      
      {/* Celebration overlay */}
      {celebrationMessage && (
        <CozyCelebration
          message={celebrationMessage}
          onComplete={() => {
            // Optional: clear celebration message after animation
          }}
          duration={5000}
        />
      )}

      {/* Speech Indicator - REMOVED: Too cluttered, speaking state shown in bottom avatars */}

      {/* Loading State - Shows when agents are analyzing */}
      {isAnalyzing && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
        }}>
          <LoadingState type="analyzing" message="Pi is thinking about your answer..." />
        </div>
      )}
      
      {turns.length === 0 ? (
        <WelcomeScreen />
      ) : (
        <CozyWorkspace
          lessonTitle={currentLesson?.title || 'Learning Session'}
          currentMilestoneName={currentMilestoneName}
          onBack={() => {
            useLogStore.getState().clearTurns();
          }}
          isConnected={isConnected}
          piSpeaking={piSpeaking}
          studentSpeaking={studentSpeaking}
          piLastMessage={lastPiMessage}
          studentLastMessage={lastStudentMessage}
          totalMilestones={currentLesson?.milestones?.length || 0}
          completedMilestones={progress?.completedMilestones || 0}
          isAnalyzing={isAnalyzing}
          emotionalState={currentContext?.emotional?.state}
          hasActiveMisconceptions={
            currentContext?.misconceptions?.some(m => m.detected && !m.resolved) || false
          }
          lessonImage={
            <LessonImage 
              lessonId={currentLesson?.id}
              milestoneIndex={progress?.currentMilestoneIndex}
            />
          }
          canvas={
            <LessonCanvas 
              ref={canvasRef}
              lessonId={currentLesson?.id}
              milestoneIndex={progress?.currentMilestoneIndex}
              onCanvasChange={handleCanvasChange}
            />
          }
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onMuteToggle={handleMuteToggle}
          onHelp={handleHelp}
          onExport={handleExport}
          onReset={handleReset}
          isMuted={muted}
        />
      )}

      {/* First-time tutorial overlay */}
      {showTutorial && (
        <FirstLessonTutorial
          onComplete={handleTutorialComplete}
          isConnected={isConnected}
          studentName={userData?.name}
        />
      )}
    </div>
  );
}