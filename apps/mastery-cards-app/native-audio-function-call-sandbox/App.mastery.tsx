/**
 * Mastery Cards App - Gemini Live API with Native Audio + Function Calling
 * Built on Google's official sandbox with integrated Claude judge
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { MasteryCard as MasteryCardComponent } from './components/cards/MasteryCard';
import { SessionHeader } from './components/session/SessionHeader';
import { NamePrompt } from './components/NamePrompt';
import { LevelUpAnimation } from './components/LevelUpAnimation';
import { EvaluationIndicator } from './components/EvaluationIndicator';
import { MicPermissionError } from './components/MicPermissionError';
import { ConnectionError } from './components/ConnectionError';
import { ComicOnboarding } from './components/ComicOnboarding';
import { ErrorRecovery, AppErrorBoundary, type ErrorInfo } from './components/ErrorRecovery';
import ControlTray from './components/console/control-tray/ControlTray';
import { useSessionStore } from './lib/state/session-store';
import { useSettings, useTools } from './lib/state';
import { useLiveAPIContext } from './contexts/LiveAPIContext';
import { LiveAPIProvider } from './contexts/LiveAPIContext';
import { evaluateMastery, type ConversationTurn as ClaudeConversationTurn } from './lib/evaluator/claude-judge';
import { createOrchestrationManager, type OrchestrationManager } from './lib/orchestration/orchestration-manager';
import type { TranscriptEntry } from './lib/orchestration/conversation-orchestrator';
import type { LiveServerToolCall } from '@google/genai';
import { Modality } from '@google/genai';
import './App.mastery.css';
import './components/WelcomeScreen.css';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const CLAUDE_KEY = import.meta.env.VITE_CLAUDE_API_KEY as string;

if (!API_KEY) {
  throw new Error('Missing VITE_GEMINI_API_KEY environment variable');
}

function AppContent() {
  // Session state
  const {
    currentCard,
    sessionId,
    studentName,
    points,
    setStudentName,
    startSession,
    nextCard,
    awardPoints,
    masteredCard,
  } = useSessionStore();

  // Live API context from sandbox
  const { client, connect, connected, disconnect, config, setConfig } = useLiveAPIContext();
  const { setTemplate } = useTools();
  const { systemPrompt, voice } = useSettings();

  // UI state
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ level: string; points: number } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  const [welcomeAudioComplete, setWelcomeAudioComplete] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [connectionError, setConnectionError] = useState<{
    title: string;
    message: string;
    suggestion: string;
  } | null>(null);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [currentError, setCurrentError] = useState<ErrorInfo | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Conversation tracking for Claude
  const conversationHistory = useRef<ClaudeConversationTurn[]>([]);
  const exchangeCount = useRef<number>(0);
  const evaluationInProgress = useRef(false);
  const pendingEvaluation = useRef<any>(null);

  // Initialize name prompt
  useEffect(() => {
    if (!studentName && !sessionId) {
      setShowNamePrompt(true);
    }
  }, [studentName, sessionId]);

  // Track if config has been set using useRef (persists across renders)
  const configSetRef = useRef(false);

  // Initialize orchestrator manager with server support
  const orchestrator = useRef<OrchestrationManager | null>(null);
  const [orchestrationMode, setOrchestrationMode] = useState<'server' | 'client'>('client');

  // Start session after name is set
  useEffect(() => {
    if (studentName && !sessionId) {
      // Reset config flag for new session
      configSetRef.current = false;
      startSession();
      // Set mastery-cards template with student name
      setTemplate('mastery-cards', studentName);
    }
  }, [studentName, sessionId, startSession, setTemplate]);

  // Initialize orchestrator manager when session starts
  useEffect(() => {
    if (sessionId && !orchestrator.current) {
      console.log('[App] 🔧 Initializing orchestration manager...');

      // Create orchestrator with both server and client support
      // Use environment variable for server URL, default to localhost for development
      const wsServerUrl = import.meta.env.VITE_WS_SERVER_URL || 'ws://localhost:3001/orchestrate';
      console.log('[App] 🔗 WebSocket server URL:', wsServerUrl);

      orchestrator.current = createOrchestrationManager(sessionId, {
        claudeApiKey: CLAUDE_KEY,
        serverUrl: wsServerUrl,
        mode: 'hybrid', // Try server first, fall back to client
        enablePersistence: true,
      });

      // Set connection change callback to track mode
      orchestrator.current.setConnectionChangeCallback((connected, mode) => {
        console.log(`[App] 📡 Orchestration mode: ${mode}, Server: ${connected ? 'Connected' : 'Disconnected'}`);
        setOrchestrationMode(mode as 'server' | 'client');
      });

      // Initialize with student name
      if (studentName && currentCard) {
        orchestrator.current.initialize(studentName, currentCard).then(() => {
          console.log('[App] ✅ Orchestration manager initialized');
        });
      }
    }
  }, [sessionId, studentName, currentCard]);

  // Set up Gemini config ONCE when session starts - SIMPLIFIED (no function tools)
  useEffect(() => {
    // Only configure once per session when we have a student name and haven't configured yet
    if (!studentName || configSetRef.current) return;

    console.log('[App] 🎯 Configuring Gemini Live API - SIMPLIFIED ARCHITECTURE');
    console.log('[App] Mode: Pure conversational audio (no function calling)');

    // Capture current values at time of configuration
    const currentVoice = useSettings.getState().voice;

    // Build system prompt with student name (card context sent as messages)
    const systemPrompt = `You are Pi, a curious alien from Planet Geometrica visiting Earth to learn about human thinking!

# YOUR ROLE
You're genuinely fascinated by how ${studentName} thinks about fractions and math. You're NOT a teacher - you're an eager learner who happens to help ${studentName} discover their own understanding through conversation.

# PERSONALITY
- **Curious & Playful**: Ask questions like "Wait, how did you figure that out?" or "Ooh, that's interesting! Why do you think that?"
- **Encouraging**: Celebrate effort and thinking, not just correct answers
- **Conversational**: Talk like a friend, not a tutor. Use contractions, show excitement!
- **Persistent**: Gently explore deeper - don't just accept surface answers
- **Socratic**: Use the Socratic method to help ${studentName} think through problems

# CONVERSATION GUIDELINES
- Keep responses SHORT (1-2 sentences max per turn)
- Ask follow-up questions to understand their thinking
- Build on their ideas: "Oh! So you're saying [their idea]... what if [extension]?"
- Let silence be okay - ${studentName} needs time to think
- Show genuine curiosity about their thinking process

# IMPORTANT
- You'll receive card context as messages - use them to guide conversation
- Focus on understanding HOW ${studentName} thinks, not just getting right answers
- Never give lectures or explanations unprompted
- Trust that mistakes are learning opportunities

Remember: You're Pi - curious, playful, and here to explore how ${studentName} thinks! 🛸`;

    setConfig({
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: currentVoice || 'Puck',
          },
        },
      },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      // NO TOOLS! Pure conversational AI only
    });

    configSetRef.current = true; // Mark config as set using ref
    console.log('[App] ✅ Configuration complete - Pure audio conversation mode');
    console.log('[App] 📝 Orchestration will be handled client-side for now');
  }, [studentName, setConfig]); // Only depend on studentName and setConfig (stable)

  // Handle WebSocket errors and close events
  useEffect(() => {
    if (!client) return;

    const handleError = (error: ErrorEvent) => {
      console.error('[App] ❌ WebSocket error:', error);
      console.error('[App] Error message:', error.message);
      setSetupComplete(false);
    };

    const handleClose = (event: CloseEvent) => {
      console.warn('[App] ⚠️  WebSocket closed');
      console.warn('[App] Close code:', event.code);
      console.warn('[App] Close reason:', event.reason);
      console.warn('[App] Was clean:', event.wasClean);
      setSetupComplete(false);
    };

    const handleOpen = () => {
      console.log('[App] ✅ Connected to Gemini Live');
      // Don't set setupComplete here - wait for the actual setupComplete event
    };

    const handleSetupComplete = () => {
      console.log('[App] ✅ Setup complete - ready to send messages');
      setSetupComplete(true);
    };

    client.on('open', handleOpen);
    client.on('setupcomplete', handleSetupComplete);
    client.on('error', handleError);
    client.on('close', handleClose);

    return () => {
      client.off('open', handleOpen);
      client.off('setupcomplete', handleSetupComplete);
      client.off('error', handleError);
      client.off('close', handleClose);
    };
  }, [client]);

  // Update orchestrator when card changes and set up evaluation callbacks
  useEffect(() => {
    if (currentCard && orchestrator.current) {
      orchestrator.current.setCurrentCard(currentCard);
      console.log('[App] 🎯 Orchestrator updated with new card:', currentCard.title);

      // Register evaluation callbacks (only once)
      const evaluationCallback = (evaluation: any) => {
        console.log('[App] 📊 Received evaluation from orchestrator:', evaluation);

        // Set evaluation state for UI feedback
        setIsEvaluating(false);

        // Handle the evaluation result
        if (evaluation.suggestedAction === 'award_and_next') {
          console.log('[App] 🎉 Advancing to next card with points!');

          // Show success celebration
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 2000); // Hide after 2 seconds

          // Award points immediately for visual feedback
          if (evaluation.points) {
            const previousPoints = points;
            awardPoints(evaluation.points);

            // Check for level up (every 100 points)
            const newPoints = previousPoints + evaluation.points;
            if (Math.floor(newPoints / 100) > Math.floor(previousPoints / 100)) {
              const level = Math.floor(newPoints / 100);
              setLevelUpData({
                level: `Level ${level}`,
                points: newPoints
              });
              setShowLevelUp(true);

              // Auto-dismiss level up after 2 seconds
              setTimeout(() => {
                setShowLevelUp(false);
              }, 2000);
            }
          }

          // Mark card as mastered
          masteredCard(currentCard.cardNumber.toString());

          // Send transition message to Pi, then advance after a brief celebration
          if (genaiLiveClientRef.current?.isConnected()) {
            const transitionMessage = `🎉 Awesome job! You totally got that! You earned ${evaluation.points || 30} points! Now let's check out something new...`;
            genaiLiveClientRef.current.send({ text: transitionMessage });
            console.log('[App] 📤 Sent transition message to Pi');
          }

          // Delay card advancement to let Pi transition naturally
          setTimeout(() => {
            // Advance to next card
            nextCard();

            // Reset conversation history
            conversationHistory.current = [];
            exchangeCount.current = 0;
          }, 2500); // 2.5 second delay for celebration and transition

        } else if (evaluation.suggestedAction === 'next_without_points') {
          console.log('[App] ➡️ Moving to next card without points');
          nextCard();
          conversationHistory.current = [];
          exchangeCount.current = 0;

        } else {
          console.log('[App] 💭 Continue conversation, confidence:', evaluation.confidence);
          // Continue conversation - maybe show confidence indicator
        }
      };

      const startCallback = () => {
        console.log('[App] 🧠 Evaluation starting...');
        setIsEvaluating(true);
      };

      // Register callbacks with orchestration manager
      orchestrator.current.setEvaluationCallbacks(evaluationCallback, startCallback);
      console.log('[App] ✅ Evaluation callbacks registered with orchestrator');
    }
  }, [currentCard, awardPoints, nextCard, masteredCard, points]);

  // Track conversation and feed to orchestrator
  useEffect(() => {
    if (!client) return;

    const handleUserTranscript = (text: string, isFinal: boolean) => {
      console.log('[App] 👤 USER:', text, isFinal ? '(final)' : '(interim)');

      // Now that genai-live-client properly emits isFinal based on turnComplete,
      // we can simply trust it without debouncing
      if (isFinal && text.trim().length > 0) {
        if (orchestrator.current) {
          orchestrator.current.addTranscriptEntry({
            role: 'student',
            text,
            timestamp: Date.now(),
            isFinal: true
          });
        }

        const turn: ClaudeConversationTurn = {
          role: 'student',
          text,
          timestamp: Date.now(),
        };
        conversationHistory.current.push(turn);
        exchangeCount.current++;
      }
    };

    const handleOutputTranscript = (text: string, isFinal: boolean) => {
      console.log('[App] 🛸 PI:', text, isFinal ? '(final)' : '(interim)');
      setIsSpeaking(!isFinal);

      // Now that genai-live-client properly emits isFinal based on turnComplete,
      // we can simply trust it without debouncing
      if (isFinal && text.trim().length > 0) {
        if (orchestrator.current) {
          orchestrator.current.addTranscriptEntry({
            role: 'pi',
            text,
            timestamp: Date.now(),
            isFinal: true
          });
        }

        const turn: ClaudeConversationTurn = {
          role: 'pi',
          text,
          timestamp: Date.now(),
        };
        conversationHistory.current.push(turn);
      }
    };

    client.on('inputTranscription', handleUserTranscript);
    client.on('outputTranscription', handleOutputTranscript);

    return () => {
      client.off('inputTranscription', handleUserTranscript);
      client.off('outputTranscription', handleOutputTranscript);
    };
  }, [client, currentCard]);

  // SIMPLIFIED ARCHITECTURE: No function calls, orchestrator handles evaluation
  // The orchestrator observes the conversation and decides when to evaluate
  // Evaluation results are handled via the callback registered above

  // Helper: Format comprehensive card context for all components
  const formatCardContext = (card: typeof currentCard) => {
    if (!card) return '';

    let message = `🎯 NEW LEARNING CARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 CARD DETAILS:
• Title: ${card.title}
• Card #${card.cardNumber}
• Learning Goal: ${card.learningGoal}

🖼️ VISUAL CONTEXT:
${card.imageDescription}

🎓 MASTERY MILESTONES:
• Basic (${card.milestones.basic.points} pts): ${card.milestones.basic.description}
  Evidence needed: ${card.milestones.basic.evidenceKeywords?.join(', ') || 'Understanding demonstration'}`;

    if (card.milestones.advanced) {
      message += `
• Advanced (${card.milestones.advanced.points} pts): ${card.milestones.advanced.description}
  Evidence needed: ${card.milestones.advanced.evidenceKeywords?.join(', ') || 'Deep understanding'}`;
    }

    if (card.misconception) {
      message += `

⚠️ MISCONCEPTION CHALLENGE:
This is a special card where Pi has a misconception!
• Pi's Wrong Thinking: "${card.misconception.piWrongThinking}"
• Correct Concept: ${card.misconception.correctConcept}
• Teaching Goal (${card.misconception.teachingMilestone.points} pts): ${card.misconception.teachingMilestone.description}
• Evidence needed: Student corrects Pi's thinking`;
    }

    message += `

💬 CONVERSATION STARTER:
Pi should begin by saying: "${card.piStartingQuestion}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━
Remember: Be curious about ${studentName}'s thinking!`;

    return message;
  };

  // Send simplified card context when card changes OR when first connected
  // This sends card info as a MESSAGE, not configuration (to avoid error 1011)
  useEffect(() => {
    if (!client || !currentCard || !connected || !setupComplete || showWelcomeScreen) return;

    console.log(`[App] 📸 Preparing to send card to Gemini: ${currentCard.title}`);

    // Build card context with gentle transition for card changes
    const isFirstCard = currentCard.cardNumber === 1;
    const transitionPrefix = isFirstCard
      ? ''
      : '\n\n✨ Great work! Now we\'re moving to a new learning card:\n\n';

    const cardContext = transitionPrefix + formatCardContext(currentCard);

    console.log('[App] 📤 Sending context to Gemini:');
    console.log('  - Card:', currentCard.title);
    console.log('  - Format: Plain text with natural transition');
    console.log('  - Context length:', cardContext.length, 'chars');

    // Send card context with natural transition built-in
    // Gemini's VAD (Voice Activity Detection) will handle any ongoing speech gracefully
    client.send([{ text: cardContext }], true);

    console.log('[App] ✅ Card context sent - waiting for Pi to start conversation');
  }, [currentCard, connected, setupComplete, client, showWelcomeScreen]);

  // Handle start learning
  const handleStartLearning = useCallback(async () => {
    if (!welcomeAudioComplete) return;

    console.log('[App] 🎓 Starting learning session...');

    setShowWelcomeScreen(false);
    nextCard(); // Skip to card 1

    if (!connected) {
      setIsConnecting(true);

      try {
        await connect();
        console.log('[App] ✅ Connected to Gemini Live');
        setMicPermission('granted');
      } catch (error) {
        console.error('[App] ❌ Connection failed:', error);
        setConnectionError({
          title: "Can't Connect to Pi",
          message: error instanceof Error ? error.message : 'Unknown error',
          suggestion: "Check your API key and internet connection.",
        });
      } finally {
        setIsConnecting(false);
      }
    }
  }, [welcomeAudioComplete, connected, connect, nextCard]);

  // Handle name submit
  const handleNameSubmit = (name: string) => {
    setStudentName(name);
    setShowNamePrompt(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (orchestrator.current) {
        console.log('[App] 🔌 Cleaning up orchestrator...');
        orchestrator.current.disconnect();
      }
    };
  }, []);

  // Show name prompt
  if (showNamePrompt) {
    return <NamePrompt onSubmit={handleNameSubmit} />;
  }

  // Show connection error
  if (connectionError) {
    return (
      <ConnectionError
        {...connectionError}
        canRetry={true}
        onRetry={() => {
          setConnectionError(null);
          window.location.reload();
        }}
      />
    );
  }

  // Show mic permission error
  if (micPermission === 'denied') {
    return <MicPermissionError />;
  }

  // Loading state
  if (!currentCard || !sessionId) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>Starting session...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Error Recovery Modal */}
      {currentError && (
        <ErrorRecovery
          error={currentError}
          onRetry={() => {
            console.log('[App] Retrying after error...');
            setCurrentError(null);

            // Retry based on error type
            if (currentError.type === 'connection' && orchestrator.current) {
              orchestrator.current.reconnect();
            } else if (currentError.type === 'evaluation' && orchestrator.current) {
              orchestrator.current.forceEvaluation();
            }
          }}
          onDismiss={() => setCurrentError(null)}
          onReportIssue={() => {
            console.log('[App] Report issue:', currentError);
            window.open('https://github.com/your-repo/issues', '_blank');
          }}
        />
      )}

      {/* Welcome Screen */}
      {showWelcomeScreen && (
        <ComicOnboarding
          studentName={studentName || 'there'}
          onReady={() => setWelcomeAudioComplete(true)}
          onStart={handleStartLearning}
          isReady={welcomeAudioComplete}
          isConnecting={isConnecting}
        />
      )}

      {/* Main Learning Interface */}
      {!showWelcomeScreen && (
        <>
          <SessionHeader />

          <div className="main-content">
            <MasteryCardComponent card={currentCard} isCurrent={true} />

            {/* Control Tray with Audio Controls and Pi Avatar */}
            <ControlTray isSpeaking={isSpeaking} />
          </div>

          {/* Level up animation */}
          {showLevelUp && levelUpData && (
            <LevelUpAnimation
              show={showLevelUp}
              newLevel={levelUpData.level}
              totalPoints={levelUpData.points}
              onComplete={() => setShowLevelUp(false)}
            />
          )}

          {/* Thinking indicator */}
          {isEvaluating && <EvaluationIndicator />}
        </>
      )}

      {/* Debug info */}
      {import.meta.env.DEV && currentCard && (
        <div className="debug-info">
          <p><strong>Card {currentCard.cardNumber}:</strong> {currentCard.title}</p>
          <p><strong>Exchanges:</strong> {exchangeCount.current}</p>
          <p><strong>Gemini:</strong> {connected ? '✓ Connected' : '✗ Disconnected'}</p>
          <p><strong>Speaking:</strong> {isSpeaking ? '✓ Yes' : '✗ No'}</p>
          <p><strong>Evaluating:</strong> {isEvaluating ? '✓ Yes' : '✗ No'}</p>
          <p><strong>Orchestration:</strong> {orchestrationMode === 'server' ? '🌐 Server' : '💻 Client'}</p>
          <button
            onClick={async () => {
              if (orchestrator.current) {
                console.log('[App] 🔧 DEBUG: Forcing evaluation...');
                const result = await orchestrator.current.forceEvaluation();
                console.log('[App] 🔧 DEBUG: Force evaluation result:', result);
              }
            }}
            style={{
              marginTop: '10px',
              padding: '5px 10px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Force Evaluation (Debug)
          </button>
          {orchestrationMode === 'client' && (
            <button
              onClick={async () => {
                if (orchestrator.current) {
                  console.log('[App] 🔄 Attempting server reconnect...');
                  await orchestrator.current.reconnect();
                }
              }}
              style={{
                marginTop: '5px',
                padding: '5px 10px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Reconnect to Server
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  if (!API_KEY) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1>Missing API Key</h1>
        <p>Please set VITE_GEMINI_API_KEY in your environment variables</p>
      </div>
    );
  }

  return (
    <AppErrorBoundary
      onError={(error, errorInfo) => {
        console.error('[App] Error caught by boundary:', error, errorInfo);
        // Could send to analytics/logging service here
      }}
    >
      <LiveAPIProvider apiKey={API_KEY}>
        <AppContent />
      </LiveAPIProvider>
    </AppErrorBoundary>
  );
}
