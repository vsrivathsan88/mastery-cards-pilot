import { useEffect, useRef, useState } from 'react';
import PopUp from '../popup/PopUp';
import WelcomeScreen from '../welcome-screen/WelcomeScreen';
import { LessonProgress } from '../../LessonProgress';
import { LessonCanvas } from '../../LessonCanvas';
import { LessonImage } from '../../LessonImage';
import { CozyWorkspace } from '../../cozy/CozyWorkspace';
import { CozyCelebration } from '../../cozy/CozyCelebration';
import { CozyEncouragementParticles } from '../../cozy/CozyEncouragementParticles';
import { LiveConnectConfig, Modality, LiveServerContent } from '@google/genai';
import { AudioRecorder } from '../../../lib/audio-recorder';

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

const renderContent = (text: string) => {
  // Split by ```json...``` code blocks
  const parts = text.split(/(`{3}json\n[\s\S]*?\n`{3})/g);

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
  const { systemPrompt, voice } = useSettings();
  const { tools } = useTools();
  const { currentLesson, progress, celebrationMessage } = useLessonStore();
  const turns = useLogStore(state => state.turns);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showPopUp, setShowPopUp] = useState(false);
  
  // Audio controls
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [muted, setMuted] = useState(false);
  
  // Track speaking state for kid-friendly UI
  const [piSpeaking, setPiSpeaking] = useState(false);
  const [studentSpeaking, setStudentSpeaking] = useState(false);
  
  // Track milestone completions for particles
  const [particleTrigger, setParticleTrigger] = useState(0);
  const prevMilestonesRef = useRef(progress?.completedMilestones.length || 0);
  
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
      const currentMilestones = progress.completedMilestones.length;
      if (currentMilestones > prevMilestonesRef.current) {
        setParticleTrigger(prev => prev + 1);
        prevMilestonesRef.current = currentMilestones;
      }
    }
  }, [progress]);

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
    console.log('[StreamingConsole] 🔍 Setting config with prompt length:', systemPrompt.length);
    setConfig(config);
    console.log('[StreamingConsole] ✅ Config set');
    
  }, [setConfig, systemPrompt]); // Update when system prompt changes (lesson load)

  useEffect(() => {
    const { addTurn, updateLastTurn } = useLogStore.getState();

    const handleInputTranscription = (text: string, isFinal: boolean) => {
      const turns = useLogStore.getState().turns;
      const last = turns[turns.length - 1];
      if (last && last.role === 'user' && !last.isFinal) {
        updateLastTurn({
          text: last.text + text,
          isFinal,
        });
      } else {
        addTurn({ role: 'user', text, isFinal });
      }
      
      // Update speaking state
      setStudentSpeaking(!isFinal);
    };

    const handleOutputTranscription = (text: string, isFinal: boolean) => {
      const turns = useLogStore.getState().turns;
      const last = turns[turns.length - 1];
      if (last && last.role === 'agent' && !last.isFinal) {
        updateLastTurn({
          text: last.text + text,
          isFinal,
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
          updatedTurn.groundingChunks = [
            ...(last.groundingChunks || []),
            ...groundingChunks,
          ];
        }
        updateLastTurn(updatedTurn);
      } else {
        addTurn({ role: 'agent', text, isFinal: false, groundingChunks });
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
  }, [client]);

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

  return (
    <div className="transcription-container" style={{ height: '100%' }}>
      {showPopUp && <PopUp onClose={handleClosePopUp} />}
      
      {/* Floating encouragement particles */}
      <CozyEncouragementParticles trigger={particleTrigger} />
      
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
      
      {turns.length === 0 ? (
        <WelcomeScreen />
      ) : (
        <CozyWorkspace
          isConnected={isConnected}
          piSpeaking={piSpeaking}
          studentSpeaking={studentSpeaking}
          piLastMessage={lastPiMessage}
          studentLastMessage={lastStudentMessage}
          totalMilestones={currentLesson?.milestones?.length || 0}
          completedMilestones={progress?.completedMilestones?.length || 0}
          lessonImage={
            <LessonImage 
              lessonId={currentLesson?.id}
              milestoneIndex={progress?.currentMilestoneIndex}
            />
          }
          canvas={
            <LessonCanvas 
              lessonId={currentLesson?.id}
              milestoneIndex={progress?.currentMilestoneIndex}
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
    </div>
  );
}