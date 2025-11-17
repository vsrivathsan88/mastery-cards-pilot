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
// Claude judge and orchestrator removed - assessment now done via Gemini tool calls
// import { evaluateMastery, type ConversationTurn as ClaudeConversationTurn } from './lib/evaluator/claude-judge';
// import { createOrchestrationManager, type OrchestrationManager } from './lib/orchestration/orchestration-manager';
// import type { TranscriptEntry } from './lib/orchestration/conversation-orchestrator';
import { assessmentTools, ASSESSMENT_SYSTEM_PROMPT } from './lib/tools/assessment-tools';
import type { LiveServerToolCall } from '@google/genai';
import { Modality } from '@google/genai';
import './App.mastery.css';
import './components/WelcomeScreen.css';

// API key is optional in production (Cloud Run uses service account)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string || '';

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
  const [showCelebration, setShowCelebration] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Conversation tracking removed - assessment now done via Gemini tool calls
  // const conversationHistory = useRef<ClaudeConversationTurn[]>([]);
  const exchangeCount = useRef<number>(0);
  const evaluationInProgress = useRef(false);
  const sessionHandleRef = useRef<string | null>(null); // For session resumption
  const pendingEvaluation = useRef<any>(null);

  // Initialize name prompt
  useEffect(() => {
    if (!studentName && !sessionId) {
      setShowNamePrompt(true);
    }
  }, [studentName, sessionId]);

  // Track if config has been set using useRef (persists across renders)
  const configSetRef = useRef(false);

  // Initialize orchestrator manager in client-only mode for Vercel deployment
  const orchestrator = useRef<OrchestrationManager | null>(null);
  // Force client-side mode - no backend server needed
  const orchestrationMode: 'client' = 'client';

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

  // Orchestrator removed - assessment now done via Gemini tool calls
  // (orchestrator ref declared above but no longer initialized)

  // Set up Gemini config ONCE when session starts - WITH ASSESSMENT TOOLS
  useEffect(() => {
    // Only configure once per session when we have a student name and haven't configured yet
    if (!studentName || configSetRef.current) return;

    console.log('[App] 🎯 Configuring Gemini Live API with Assessment Tools');
    console.log('[App] Mode: Audio conversation + tool-based evaluation');

    // Capture current values at time of configuration
    const currentVoice = useSettings.getState().voice;

    // Build card context string for system prompt (will be updated per card)
    const cardContextPlaceholder = "(Card context will be sent as messages)";
    
    // Build system prompt with student name using new assessment prompt
    const systemPrompt = ASSESSMENT_SYSTEM_PROMPT(studentName, cardContextPlaceholder);

    // Transform tools to Gemini API format (remove isEnabled and scheduling fields)
    const geminiTools = assessmentTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }));
    
    const fullConfig = {
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
      tools: [{ functionDeclarations: geminiTools }], // Wrap tools in correct format
      // Session management for longer conversations
      contextWindowCompression: {
        slidingWindow: {} // Enable compression with default params
      },
      sessionResumption: {
        handle: null // Start new session (will store handle for reconnection)
      }
    };
    
    console.log('[App] 🔧 Tools being sent:', geminiTools.map(t => t.name));
    console.log('[App] 🔧 First tool structure:', JSON.stringify(geminiTools[0], null, 2));
    
    setConfig(fullConfig);

    configSetRef.current = true; // Mark config as set using ref
    console.log('[App] ✅ Configuration complete - Audio + Assessment Tools');
    console.log('[App] 🔧 Tools registered:', assessmentTools.length);
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

  // Orchestrator callbacks removed - tool calls handle everything now
  // Assessment logic moved to Gemini tool calls (assess_progress, swipe_right, award_points)

  // Track conversation and feed to orchestrator
  useEffect(() => {
    if (!client) return;

    const handleUserTranscript = (text: string, isFinal: boolean) => {
      console.log('[App] 👤 USER:', text, isFinal ? '(final)' : '(interim)');

      // Now that genai-live-client properly emits isFinal based on turnComplete,
      // we can simply trust it without debouncing
      if (isFinal && text.trim().length > 0) {
        exchangeCount.current++;
      }
    };

    const handleOutputTranscript = (text: string, isFinal: boolean) => {
      console.log('[App] 🛸 PI:', text, isFinal ? '(final)' : '(interim)');
      setIsSpeaking(!isFinal);

      // Now that genai-live-client properly emits isFinal based on turnComplete,
      // we can simply trust it without debouncing
      // No more conversation history tracking - assessment via tools
    };

    client.on('inputTranscription', handleUserTranscript);
    client.on('outputTranscription', handleOutputTranscript);

    return () => {
      client.off('inputTranscription', handleUserTranscript);
      client.off('outputTranscription', handleOutputTranscript);
    };
  }, [client, currentCard]);

  // Handle tool calls from Gemini (NEW - replaces Claude judge)
  useEffect(() => {
    if (!client) return;

    const handleToolCall = async (toolCall: LiveServerToolCall) => {
      console.log('[App] 🔧🔧🔧 TOOL CALL RECEIVED! 🔧🔧🔧');
      console.log('[App] 🔧 Full toolCall object:', JSON.stringify(toolCall, null, 2));
      console.log('[App] 🔧 Tool called:', toolCall.functionCalls?.[0]?.name);
      console.log('[App] 📊 Tool args:', JSON.stringify(toolCall.functionCalls?.[0]?.args, null, 2));

      const functionCall = toolCall.functionCalls?.[0];
      if (!functionCall) return;

      switch (functionCall.name) {
        case 'advance_card':
          // Single tool to handle everything - mastery, points, and transition
          const mastery = functionCall.args.mastery_achieved;
          
          if (!mastery) {
            console.log('[App] ⚠️  advance_card called with mastery_achieved=false, ignoring');
            client.sendToolResponse({
              functionResponses: [{
                id: functionCall.id,
                name: functionCall.name,
                response: { success: false, message: "Mastery not achieved yet" }
              }]
            });
            break;
          }
          
          // Award points and advance card with celebration
          const pointsToAward = functionCall.args.points || 50;
          const reason = functionCall.args.reason || "Great work!";
          const concepts = functionCall.args.concepts_demonstrated || [];
          
          console.log('[App] 🎉 MASTERY ACHIEVED!');
          console.log('[App] ⭐ Points:', pointsToAward);
          console.log('[App] 📝 Reason:', reason);
          console.log('[App] 💡 Concepts:', concepts);
          console.log('[App] 🎊 Starting celebration transition...');
          
          // Mark card as mastered
          masteredCard(currentCard.cardNumber.toString());
          
          const previousPoints = points;
          awardPoints(pointsToAward);
          
          // Check for level up
          const newPoints = previousPoints + pointsToAward;
          if (Math.floor(newPoints / 100) > Math.floor(previousPoints / 100)) {
            const level = Math.floor(newPoints / 100);
            setLevelUpData({
              level: `Level ${level}`,
              points: newPoints
            });
            setShowLevelUp(true);
            setTimeout(() => setShowLevelUp(false), 2000);
          }
          
          // Show celebration
          setShowCelebration(true);
          setIsTransitioning(true);
          
          // Send response
          client.sendToolResponse({
            functionResponses: [{
              id: functionCall.id,
              name: functionCall.name,
              response: { 
                success: true,
                pointsAwarded: pointsToAward,
                totalPoints: newPoints
              }
            }]
          });
          
          // Advance to next card after 2-second celebration
          setTimeout(() => {
            console.log('[App] 🎯 Celebration complete - advancing to next card');
            setShowCelebration(false);
            nextCard();
            exchangeCount.current = 0;
            
            // Brief delay before allowing new card context
            setTimeout(() => {
              setIsTransitioning(false);
            }, 500);
          }, 2000);
          break;

        case 'give_hint':
          console.log('[App] 💡 Hint given:', functionCall.args.focusing_question);
          client.sendToolResponse({
            functionResponses: [{
              id: functionCall.id,
              name: functionCall.name,
              response: { success: true }
            }]
          });
          break;

        case 'celebrate_breakthrough':
          console.log('[App] 🎊 Breakthrough!', functionCall.args.breakthrough_type);
          client.sendToolResponse({
            functionResponses: [{
              id: functionCall.id,
              name: functionCall.name,
              response: { success: true }
            }]
          });
          break;

        default:
          console.warn('[App] ⚠️  Unknown tool:', functionCall.name);
      }
    };

    // Handle session resumption updates
    const handleSessionResumption = (update: any) => {
      if (update.resumable && update.newHandle) {
        console.log('[App] 💾 Received new session handle for resumption');
        sessionHandleRef.current = update.newHandle;
      }
    };

    // Handle GoAway warnings (connection about to close)
    const handleGoAway = (goAway: any) => {
      if (goAway.timeLeft) {
        console.warn('[App] ⏰ Connection closing soon! Time left:', goAway.timeLeft);
        // Could implement reconnection logic here if needed
      }
    };

    client.on('toolcall', handleToolCall);
    // Note: These events may need to be added to genai-live-client if not already available
    // client.on('sessionResumptionUpdate', handleSessionResumption);
    // client.on('goAway', handleGoAway);

    return () => {
      client.off('toolcall', handleToolCall);
      // client.off('sessionResumptionUpdate', handleSessionResumption);
      // client.off('goAway', handleGoAway);
    };
  }, [client, currentCard, awardPoints, nextCard, masteredCard, points]);

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

⚠️ CRITICAL CONVERSATION RULES:

1. **IMAGE DESCRIPTION = YOUR PRIVATE KNOWLEDGE**
   - The image description above is FOR YOUR ASSESSMENT ONLY
   - DO NOT tell ${studentName} what you see in the image
   - DO NOT say things like "they are all the same size" or "there are four cookies"
   - Let ${studentName} tell YOU what they see

2. **AFTER ASKING A QUESTION = STOP AND WAIT**
   - When you ask "${studentName}" a question, STOP talking
   - DO NOT continue speaking
   - DO NOT answer your own question
   - WAIT for ${studentName} to respond

3. **ONLY RESPOND TO WHAT ${studentName} ACTUALLY SAID**
   - If ${studentName} says "four cookies", respond to that
   - DO NOT add information they didn't say (like "and they're all equal")
   - Only acknowledge what they explicitly stated

Remember: Be curious, ask questions, then **WAIT** for ${studentName} to answer!`;

    return message;
  };

  // Send simplified card context when card changes OR when first connected
  // This sends card info as a MESSAGE, not configuration (to avoid error 1011)
  useEffect(() => {
    if (!client || !currentCard || !connected || !setupComplete || showWelcomeScreen) return;
    
    // CRITICAL: Don't send new card context during celebration transition
    if (isTransitioning) {
      console.log('[App] ⏸️  Card context send blocked - celebration in progress');
      return;
    }

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
  }, [currentCard, connected, setupComplete, client, showWelcomeScreen, isTransitioning]);

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

  // Cleanup on unmount (orchestrator removed - nothing to clean up)
  // Assessment is now stateless via tool calls

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
            // Orchestrator removed - errors handled by reconnecting client
            if (currentError.type === 'connection') {
              connect();
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

          {/* Celebration overlay during card transition */}
          {showCelebration && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              animation: 'fadeIn 0.3s ease-in'
            }}>
              <div style={{
                textAlign: 'center',
                color: 'white',
                fontSize: '48px',
                fontWeight: 'bold',
                animation: 'bounceIn 0.6s ease-out'
              }}>
                🎉 Great Job! 🎉
                <div style={{
                  fontSize: '24px',
                  marginTop: '20px',
                  opacity: 0.9
                }}>
                  Loading next challenge...
                </div>
              </div>
            </div>
          )}

          {/* Thinking indicator */}
          {isEvaluating && <EvaluationIndicator />}
        </>
      )}

      {/* Debug info removed - use browser console for debugging */}
    </div>
  );
}

export default function App() {
  // API key check removed - Cloud Run uses service account authentication

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
