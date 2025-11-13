/**
 * Mastery Cards App - Gemini Live API Version
 * WITH FULL RELIABILITY CONTROLS
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { MasteryCard } from './components/cards/MasteryCard';
import { SessionHeader } from './components/session/SessionHeader';
import { PiAvatar } from './components/PiAvatar';
import { NamePrompt } from './components/NamePrompt';
import { LevelUpAnimation } from './components/LevelUpAnimation';
import { EvaluationIndicator } from './components/EvaluationIndicator';
import { MicPermissionError } from './components/MicPermissionError';
import { ConnectionError } from './components/ConnectionError';
import { useSessionStore } from './lib/state/session-store';
import { getPiPrompt } from './lib/prompts/simple-pi-prompt';
import { evaluateMastery, type ConversationTurn } from './lib/evaluator/claude-judge';
import { GeminiLiveClient } from './lib/gemini-live-client';
import { TurnCoordinator, TemporalGuard } from './lib/reliability';
import './App.css';
import './components/WelcomeScreen.css';

function AppContent() {
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ level: string; points: number } | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false); // Prevent rapid card changes
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true); // New: welcome screen before connection
  const [welcomeAudioPlaying, setWelcomeAudioPlaying] = useState(false);
  const [welcomeAudioComplete, setWelcomeAudioComplete] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false); // Show thinking indicator
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [connectionError, setConnectionError] = useState<{
    title: string;
    message: string;
    suggestion: string;
  } | null>(null);
  const welcomeAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const { 
    currentCard, 
    sessionId,
    studentName,
    points,
    setStudentName,
    startSession,
    nextCard,
    awardPoints,
  } = useSessionStore();
  
  // Gemini Live client
  const clientRef = useRef<GeminiLiveClient | null>(null);
  
  // RELIABILITY CONTROLS
  const turnCoordinator = useRef(new TurnCoordinator());
  const temporalGuard = useRef(new TemporalGuard({ maxAge: 5000 })); // 5 second max age
  const currentTurnId = useRef<string | null>(null);
  
  // Conversation tracking
  const conversationHistory = useRef<ConversationTurn[]>([]);
  const exchangeCount = useRef<number>(0);
  const evaluating = useRef<boolean>(false);
  const MAX_CONVERSATION_HISTORY = 100; // Prevent unbounded growth
  const pendingDecision = useRef<{
    action: 'award_and_next' | 'next_without_points' | 'continue';
    evaluation: any;
    turnId: string; // Track which turn this decision is for
  } | null>(null);
  // Debounce and evaluation controls
  const USER_DEBOUNCE_MS = 900;
  const userTranscriptDebounceTimer = useRef<number | null>(null);
  const pendingUserUtterance = useRef<string>('');
  const evaluatedTurnIds = useRef<Set<string>>(new Set());
  const evaluationAbortController = useRef<AbortController | null>(null);
  const judgeHealth = useRef<{ healthy: boolean; lastCheck: number }>({ healthy: false, lastCheck: 0 });
  const JUDGE_HEALTH_TTL_MS = 60000; // 60s cache
  
  // Get API keys
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const claudeKey = import.meta.env.VITE_CLAUDE_API_KEY;
  
  const abortOngoingEvaluation = useCallback(() => {
    if (evaluationAbortController.current) {
      evaluationAbortController.current.abort();
      evaluationAbortController.current = null;
    }
  }, []);
  
  const ensureJudgeHealthy = useCallback(async (): Promise<boolean> => {
    const now = Date.now();
    if (now - judgeHealth.current.lastCheck < JUDGE_HEALTH_TTL_MS) {
      return judgeHealth.current.healthy;
    }
    try {
      const res = await fetch('/api/claude/health');
      judgeHealth.current = { healthy: res.ok, lastCheck: now };
      return res.ok;
    } catch {
      judgeHealth.current = { healthy: false, lastCheck: now };
      return false;
    }
  }, []);
  
  // Initialize Gemini Live client ONCE when session starts
  useEffect(() => {
    if (!studentName || !sessionId || !geminiKey) {
      return;
    }
    
    // ONLY create client if we don't have one
    if (clientRef.current) {
      return; // Already have client
    }
    
    console.log('[App] 🔧 Creating Gemini Live client ONE TIME');
    
    // Get everything from store to avoid prop dependencies
    const card = useSessionStore.getState().currentCard;
    if (!card) return;
    
    const instructions = getPiPrompt(studentName, card);
    
    const client = new GeminiLiveClient({
      apiKey: geminiKey,
      voice: 'Puck', // Gemini voices: Puck, Charon, Kore, Fenrir, Aoede
      systemInstruction: instructions,
      temperature: 0.8
    });
    
    // Handle connection open (replaces 'connected')
    client.on('open', () => {
      console.log('[App] ✅ Gemini connection opened');
      setIsConnected(true);
      setIsConnecting(false);
    });

    // Handle setup complete (replaces 'ready')
    client.on('setupcomplete', async () => {
      console.log('[App] ✅ Gemini setup complete - starting audio');

      // Now start audio input
      try {
        await client.startAudioInput();
        setMicPermission('granted');
        setIsMicActive(true);
        console.log('[App] ✅ Audio input started');
      } catch (error) {
        console.error('[App] ❌ Failed to start audio input:', error);
        setMicPermission('denied');
        // Don't throw - show error UI instead
      }
    });
    
    client.on('audioInputStarted', () => {
      console.log('[App] ✅ Microphone active');
      setIsMicActive(true);
    });
    
    // Listen for user transcripts from Gemini
    client.on('userTranscript', (text: string) => {
      console.log(`[App] 💬 User: ${text}`);
      
      // Start new turn for this exchange
      if (!currentTurnId.current) {
        const card = useSessionStore.getState().currentCard;
        if (card) {
          currentTurnId.current = turnCoordinator.current.startTurn(card.cardNumber);
        }
      }
      
      // Update turn with user transcript
      if (currentTurnId.current) {
        turnCoordinator.current.setUserTranscript(currentTurnId.current, text);
      }
      // Debounce until user finishes utterance before counting an exchange or evaluating
      pendingUserUtterance.current = text;
      if (userTranscriptDebounceTimer.current) {
        clearTimeout(userTranscriptDebounceTimer.current);
        userTranscriptDebounceTimer.current = null;
      }
      userTranscriptDebounceTimer.current = window.setTimeout(() => {
        // Validate we still have an active turn
        const activeTurnId = currentTurnId.current;
        if (!activeTurnId || !turnCoordinator.current.isCurrentTurn(activeTurnId)) {
          return;
        }
        
        // Finalize the user's utterance into conversation history
        const stamped: ConversationTurn = temporalGuard.current.stamp({
          role: 'student' as const,
          text: pendingUserUtterance.current
        });
        conversationHistory.current.push(stamped);
        exchangeCount.current++;

        // Prune conversation history to prevent memory leak
        if (conversationHistory.current.length > MAX_CONVERSATION_HISTORY) {
          const pruneCount = conversationHistory.current.length - MAX_CONVERSATION_HISTORY;
          conversationHistory.current = conversationHistory.current.slice(-MAX_CONVERSATION_HISTORY);
          console.log(`[App] 🧹 Pruned ${pruneCount} old conversations`);
        }

        // Background evaluation (async, doesn't block conversation)
        evaluateInBackground();
      }, USER_DEBOUNCE_MS);
    });
    
    // Listen for Gemini text responses
    client.on('text', (text: string) => {
      console.log(`[App] 🤖 Gemini: ${text}`);
      setIsSpeaking(true);
      
      // Update turn with AI transcript
      if (currentTurnId.current) {
        turnCoordinator.current.setAiTranscript(currentTurnId.current, text);
      }
      
      // Track conversation
      const turn: ConversationTurn = temporalGuard.current.stamp({
        role: 'pi' as const,
        text: text
      });
      conversationHistory.current.push(turn);
      
      // Prune conversation history to prevent memory leak
      if (conversationHistory.current.length > MAX_CONVERSATION_HISTORY) {
        const pruneCount = conversationHistory.current.length - MAX_CONVERSATION_HISTORY;
        conversationHistory.current = conversationHistory.current.slice(-MAX_CONVERSATION_HISTORY);
        console.log(`[App] 🧹 Pruned ${pruneCount} old conversations`);
      }
      
      // Clear speaking state after a short delay
      setTimeout(() => setIsSpeaking(false), 500);
    });
    
    client.on('error', (error: any) => {
      console.error('[App] ❌ Error:', error);
    });
    
    // Handle interruption (user interrupted Gemini)
    client.on('interrupted', () => {
      console.log('[App] ⚠️ User interrupted Gemini');
      
      if (currentTurnId.current) {
        turnCoordinator.current.interruptTurn(currentTurnId.current);
      }
      // Cancel any in-flight evaluation and pending debounce
      abortOngoingEvaluation();
      if (userTranscriptDebounceTimer.current) {
        clearTimeout(userTranscriptDebounceTimer.current);
        userTranscriptDebounceTimer.current = null;
      }
      
      setIsSpeaking(false);
    });
    
    // Optional: tool call hint to trigger background evaluation (non-blocking)
    client.on('toolCall', (toolCall: any) => {
      try {
        const callStr = JSON.stringify(toolCall).toLowerCase();
        if (callStr.includes('evaluate') || callStr.includes('mastery')) {
          console.log('[App] 🧩 Tool call hint received -> scheduling evaluation');
          evaluateInBackground();
        }
      } catch {
        // ignore
      }
    });
    
    client.on('close', (event: CloseEvent) => {
      console.log('[App] Connection closed:', event?.reason || 'Unknown reason');
      setIsConnected(false);
      setIsConnecting(false);
      setIsMicActive(false);
      setIsSpeaking(false);
    });

    // Handle connection errors
    client.on('error', (error: any) => {
      console.error('[App] ❌ Gemini connection error:', error);

      // Show error UI if connection fails repeatedly
      setConnectionError({
        title: "Can't Reach Pi",
        message: "We're having trouble connecting to Pi's voice system.",
        suggestion: "Check your internet connection and try refreshing the page.",
      });
    });

    // Handle turn complete (Gemini finished generating)
    client.on('turnComplete', () => {
      console.log('[App] 🔄 Turn complete (Gemini finished)');
      
      // Mark turn as complete and reset for next turn
      if (currentTurnId.current) {
        console.log(`[App] Turn ${currentTurnId.current} completed`);
        currentTurnId.current = null;
      }
      
      if (!pendingDecision.current) {
        console.log('[App] ℹ️  No pending decision - continuing conversation');
        return;
      }
      
      // CRITICAL: Validate decision is still relevant using TurnCoordinator
      if (!turnCoordinator.current.isCurrentTurn(pendingDecision.current.turnId)) {
        console.log(`[App] ⚠️  Stale decision detected! Decision was for turn ${pendingDecision.current.turnId}, discarding.`);
        pendingDecision.current = null;
        return;
      }
      
      // We have a pending decision for THIS turn - execute it NOW
      const { action, evaluation, turnId } = pendingDecision.current;
      pendingDecision.current = null; // Clear it immediately
      
      console.log(`[App] ⚡ Executing pending decision for turn ${turnId}: ${action.toUpperCase()}`);
      
      switch (action) {
        case 'award_and_next':
          // Award points (UI update, silent)
          if (evaluation.points) {
            console.log(`[App] ✨ Awarding ${evaluation.points} points`);
            const result = awardPoints(evaluation.points, getCelebration(evaluation.masteryLevel));
            
            if (result.leveledUp && result.newLevel) {
              console.log(`[App] 🎉 Level up! New level: ${result.newLevel.title}`);
              setLevelUpData({
                level: result.newLevel.title,
                points: points + evaluation.points
              });
              setShowLevelUp(true);
            }
          }
          
          // Send celebration/encouragement via background text (won't interrupt!)
          const message = getCelebrationMessage(evaluation);
          console.log('[App] 💬 Sending feedback via text (non-interrupting):', message);
          client.sendText(message);
          
          // Then transition to next card (with transition lock)
          if (!isTransitioning) {
            setIsTransitioning(true);
            setTimeout(() => {
              console.log('[App] ➡️  Moving to next card...');
              nextCard();
              setTimeout(() => setIsTransitioning(false), 1000);
            }, 2000);
          }
          break;
          
        case 'next_without_points':
          // No points, but moving on (student struggled)
          if (!isTransitioning) {
            setIsTransitioning(true);
            console.log('[App] ➡️  Moving to next card (no points)...');
            client.sendText('Let\'s try something else!');
            setTimeout(() => {
              nextCard();
              setTimeout(() => setIsTransitioning(false), 1000);
            }, 1500);
          }
          break;
          
        case 'continue':
          // Claude says keep exploring - do nothing
          console.log('[App] 💬 Continuing conversation (no card change)');
          break;
      }
    });
    
    clientRef.current = client;
    
    // Cleanup ONLY on unmount (not on every render)
    return () => {
      console.log('[App] Component unmounting - cleaning up');
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, [studentName, sessionId, geminiKey]); // Minimal dependencies
  
  // Auto-play welcome audio on mount
  useEffect(() => {
    if (!showWelcomeScreen || welcomeAudioPlaying || welcomeAudioComplete || !studentName) return;

    console.log('[App] 🎙️ Auto-playing welcome audio...');
    
    // Create audio element
    const audio = new Audio();
    welcomeAudioRef.current = audio;
    
    // Welcome message text
    const welcomeText = `Hey ${studentName}! I'm Pi from Planet Geometrica! I'm SO curious about how you think about fractions. We're gonna look at images together and explore your ideas. This is gonna be fun! Ready to start?`;
    
    // Generate audio using TTS with better quality
    const utterance = new SpeechSynthesisUtterance(welcomeText);
    utterance.rate = 1.0;  // Natural speed
    utterance.pitch = 1.2;  // Friendly, upbeat
    utterance.volume = 1.0;
    utterance.lang = 'en-US';
    
    // Get best available voice (priority: Google/natural voices)
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => 
      v.name.includes('Google US English') ||  // Chrome's best
      v.name.includes('Samantha') ||           // macOS
      v.name.includes('Zira') ||               // Windows
      v.name.includes('Karen') ||              // iOS
      (v.lang === 'en-US' && v.localService === false) // Premium voices
    ) || voices.find(v => v.lang.startsWith('en-US')) || voices[0];
    
    if (naturalVoice) {
      utterance.voice = naturalVoice;
      console.log('[App] 🎙️ Using voice:', naturalVoice.name, '| Local:', naturalVoice.localService);
    }
    
    // Start playing
    utterance.onstart = () => {
      console.log('[App] 🎤 Welcome audio auto-started');
      setWelcomeAudioPlaying(true);
    };
    
    utterance.onend = () => {
      console.log('[App] ✅ Welcome audio complete');
      setWelcomeAudioPlaying(false);
      setWelcomeAudioComplete(true);
    };
    
    utterance.onerror = (error) => {
      console.error('[App] ❌ Welcome audio error:', error);
      setWelcomeAudioPlaying(false);
      setWelcomeAudioComplete(true);
    };
    
    // Auto-play after short delay
    const playTimer = setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 800);

    // Fallback: Auto-enable button after 10 seconds if TTS doesn't complete
    const fallbackTimer = setTimeout(() => {
      if (!welcomeAudioComplete) {
        console.log('[App] ⏰ TTS timeout - auto-enabling button');
        setWelcomeAudioComplete(true);
        setWelcomeAudioPlaying(false);
        window.speechSynthesis.cancel();
      }
    }, 10000);

    return () => {
      clearTimeout(playTimer);
      clearTimeout(fallbackTimer);
      window.speechSynthesis.cancel();
    };
  }, [showWelcomeScreen, studentName, welcomeAudioPlaying, welcomeAudioComplete]);
  
  // Start learning - dismiss welcome and connect
  const handleStartLearning = useCallback(async () => {
    if (!welcomeAudioComplete) {
      console.log('[App] ⏳ Waiting for welcome to finish...');
      return;
    }
    
    console.log('[App] 🎓 Starting learning session...');
    
    // Stop any remaining speech
    window.speechSynthesis.cancel();
    
    // 1. Dismiss welcome screen
    setShowWelcomeScreen(false);
    
    // 2. Skip to Card 1 (first real learning card)
    nextCard();
    
    // 3. Connect to Gemini
    if (!clientRef.current) {
      console.error('[App] No client available');
      return;
    }
    
    if (isConnected || isConnecting) {
      console.log('[App] Already connected or connecting');
      return;
    }
    
    console.log('[App] 🚀 Connecting to Gemini Live...');
    console.log('[App] 🔍 API Key present:', !!geminiKey);
    console.log('[App] 🔍 Client exists:', !!clientRef.current);
    setIsConnecting(true);

    try {
      // Connect and wait for ready event
      await clientRef.current.connect();

      // Wait for setup to complete before starting audio
      console.log('[App] ⏳ Waiting for setup to complete...');
      console.log('[App] 🔍 Connection successful');

    } catch (error) {
      console.error('[App] ❌ Failed to connect:', error);
      console.error('[App] ❌ Error details:', error);
      setIsConnecting(false);

      // Show connection error
      setConnectionError({
        title: "Can't Connect to Pi",
        message: error instanceof Error ? error.message : 'Unknown error',
        suggestion: "Check your internet connection and API key, then refresh the page.",
      });
    }
  }, [isConnected, isConnecting, nextCard, welcomeAudioComplete]);
  
  // Stop speaking handler (Gemini handles this automatically via interruption)
  const handleStopSpeaking = useCallback(async () => {
    if (!clientRef.current || !isConnected) return;
    
    console.log('[App] 🛑 User requested stop speaking');
    // With Gemini, just send a new message to interrupt
    // Or user can just start speaking (VAD will handle it)
    setIsSpeaking(false);
  }, [isConnected]);
  
  // Send card context when card changes
  useEffect(() => {
    if (!clientRef.current || !currentCard || !studentName) return;
    if (!isConnected) return;
    
    console.log(`[App] 📸 Card changed to: ${currentCard.title}`);
    
    // CRITICAL: Invalidate all turns from previous card
    turnCoordinator.current.invalidateCard(currentCard.cardNumber - 1);
    
    // Clear any pending decisions from previous card
    if (pendingDecision.current) {
      console.log(`[App] 🧹 Clearing stale decision from previous card`);
      pendingDecision.current = null;
    }
    
    // Abort any ongoing evaluation, clear evaluated turn tracking and debounce state
    abortOngoingEvaluation();
    evaluatedTurnIds.current.clear();
    if (userTranscriptDebounceTimer.current) {
      clearTimeout(userTranscriptDebounceTimer.current);
      userTranscriptDebounceTimer.current = null;
    }
    pendingUserUtterance.current = '';
    
    // Reset turn ID for new card
    currentTurnId.current = null;
    
    // Skip if welcome screen is showing (Card 0 handled by UI)
    if (showWelcomeScreen) {
      console.log('[App] ℹ️  Welcome screen active - not sending card yet');
      return;
    }
    
    console.log('[App] 📤 Sending new card to Gemini...');
    
    // Send card with image to Gemini (multimodal!)
    const sendCard = async () => {
      if (!clientRef.current) return;
      
      try {
        // Note: SDK client doesn't support dynamic instruction updates
        // Instructions are set once during connection
        
        // Send image with context (Gemini is natively multimodal!)
        const imageUrl = currentCard.imageUrl;
        if (imageUrl) {
          // Fetch image and convert to base64
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const reader = new FileReader();
          
          reader.onloadend = () => {
            const base64 = reader.result?.toString().split(',')[1] || '';
            const mimeType = blob.type;
            
            // Send image and text together in one turn
            clientRef.current?.sendImage(base64, mimeType, currentCard.piStartingQuestion);
            
            console.log('[App] ✅ Card sent with image and question');
          };
          
          reader.readAsDataURL(blob);
        } else {
          // No image, just send text
          clientRef.current.sendText(currentCard.piStartingQuestion);
          console.log('[App] ✅ Card sent');
        }
      } catch (error) {
        console.error('[App] ❌ Failed to send card:', error);
      }
    };
    
    sendCard();
    
    // Reset tracking
    conversationHistory.current = [];
    exchangeCount.current = 0;
  }, [currentCard, studentName, isConnected, nextCard]);
  
  // Background evaluation - doesn't block conversation
  const evaluateInBackground = useCallback(async () => {
    const card = useSessionStore.getState().currentCard;
    const activeTurnId = currentTurnId.current;
    
    // Skip evaluation if:
    // - No card or no active turn
    // - Already evaluating
    // - Not enough exchanges (min 2)
    // - Card 0 (welcome card)
    if (!card || !activeTurnId || evaluating.current || exchangeCount.current < 2 || card.cardNumber === 0) {
      return;
    }
    
    // Only once per turn
    if (evaluatedTurnIds.current.has(activeTurnId)) {
      return;
    }
    
    // Server health gate
    const healthy = await ensureJudgeHealthy();
    if (!healthy) {
      console.warn('[App] ⚠️ Judge not healthy, skipping evaluation');
      return;
    }
    
    evaluating.current = true;
    setIsEvaluating(true); // Show thinking indicator

    // Mark turn as evaluating
    turnCoordinator.current.startEvaluation(activeTurnId);

    console.log(`\n[App] 🎯 Background evaluation starting for turn: ${activeTurnId}`);
    console.log(`[App] 📍 Current card: #${card.cardNumber} - ${card.title}`);
    console.log(`[App] 📊 Exchanges: ${exchangeCount.current}`);
    console.log('[Judge] 🔮 Calling Claude judge...');

    try {
      // Abort controller and hard timeout budget
      abortOngoingEvaluation();
      const controller = new AbortController();
      evaluationAbortController.current = controller;
      const start = performance.now();

      const evaluation = await evaluateMastery(
        card,
        conversationHistory.current,
        exchangeCount.current,
        claudeKey,
        { signal: controller.signal }
      );
      
      // CRITICAL: Validate turn is still current before using evaluation
      if (!turnCoordinator.current.isCurrentTurn(activeTurnId)) {
        console.log(`[App] 🚫 Evaluation stale - turn ${activeTurnId} is no longer active`);
        return;
      }
      
      // Store evaluation in turn
      turnCoordinator.current.setEvaluation(activeTurnId, evaluation);
      
      console.log(`\n[Judge] 📊 ===== CLAUDE DECISION =====`);
      console.log(`[Judge] 📊 Turn: ${activeTurnId}`);
      console.log(`[Judge] 📊 Action: ${evaluation.suggestedAction.toUpperCase()}`);
      console.log(`[Judge] 📊 Mastery: ${evaluation.masteryLevel}`);
      console.log(`[Judge] 📊 Confidence: ${evaluation.confidence}%`);
      console.log(`[Judge] 📊 Reasoning: ${evaluation.reasoning}`);
      console.log(`[Judge] ⏱️ Latency: ${Math.round(performance.now() - start)} ms`);
      console.log(`[Judge] 📊 ============================\n`);
      
      // Mark evaluated for this turn
      evaluatedTurnIds.current.add(activeTurnId);
      
      // Store the decision - it will be executed AFTER Gemini completes
      // CRITICAL: Track which turn this decision is for (turn validation prevents stale decisions!)
      pendingDecision.current = {
        action: evaluation.suggestedAction,
        evaluation,
        turnId: activeTurnId
      };
      
      console.log(`[App] 💾 Decision queued for turn ${activeTurnId}: ${evaluation.suggestedAction.toUpperCase()}`);
      console.log(`[App] ⏸️  Waiting for Gemini to finish current response...`);
    } catch (error) {
      if ((error as any)?.name === 'AbortError') {
        console.warn('[Judge] ⏹️ Evaluation aborted (stale or timed out)');
      } else {
        console.error('[Judge] ❌ Claude evaluation failed:', error);
      }
      // Silently continue on error - don't disrupt conversation
    } finally {
      if (evaluationAbortController.current) {
        evaluationAbortController.current = null;
      }
      // Note: hardTimeoutId will be GC'ed; aborted or resolved promise ends timer naturally
      evaluating.current = false;
      setIsEvaluating(false); // Hide thinking indicator
    }
  }, [claudeKey, nextCard, awardPoints, points, ensureJudgeHealthy, abortOngoingEvaluation]);
  
  // Helper function to get celebration message
  const getCelebrationMessage = (evaluation: any): string => {
    const level = evaluation.masteryLevel?.toLowerCase() || '';
    
    if (level.includes('mastered')) {
      return "Excellent work! You've really mastered this concept!";
    } else if (level.includes('strong')) {
      return "Great job! You showed strong understanding!";
    } else if (level.includes('basic')) {
      return "Nice! You're getting the hang of this!";
    } else {
      return "Good effort! Keep exploring!";
    }
  };
  

  
  // Show name prompt
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  
  useEffect(() => {
    if (!studentName && !sessionId) {
      setShowNamePrompt(true);
    }
  }, [studentName, sessionId]);
  
  useEffect(() => {
    if (studentName && !sessionId) {
      startSession();
    }
  }, [studentName, sessionId, startSession]);
  
  const handleNameSubmit = (name: string) => {
    setStudentName(name);
    setShowNamePrompt(false);
  };
  
  if (showNamePrompt) {
    return <NamePrompt onSubmit={handleNameSubmit} />;
  }

  // Show connection error if Gemini fails
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

  // Show mic permission error if denied
  if (micPermission === 'denied') {
    return <MicPermissionError />;
  }

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
      {/* Welcome Screen with Card 0 */}
      {showWelcomeScreen && (
        <div className="welcome-overlay">
          <div className="welcome-card">
            {/* Pi's Avatar */}
            <div className={`welcome-avatar ${welcomeAudioPlaying ? 'speaking' : ''}`}>
              <img src="/pi.png" alt="Pi" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            </div>
            
            <h1 className="welcome-title">Welcome, {studentName}!</h1>
            
            <div className="welcome-text">
              <p style={{ marginBottom: '16px' }}>
                <strong>Hey! I'm Pi from Planet Geometrica! 🛸</strong>
              </p>
              <p>
                I'm SO curious about how you think about fractions. We're gonna look at images together and explore your ideas. This is gonna be fun!
              </p>
            </div>
            
            {/* Audio status indicator */}
            {!welcomeAudioComplete && (
              <div className="audio-status">
                <span className="audio-icon">
                  {welcomeAudioPlaying ? '🎙️' : '⏳'}
                </span>
                <span className="audio-status-text">
                  {welcomeAudioPlaying ? 'Pi is talking...' : 'Preparing audio...'}
                </span>
              </div>
            )}
            
            {/* Start learning button */}
            <button
              onClick={handleStartLearning}
              disabled={!welcomeAudioComplete || isConnecting}
              className={`start-button ${welcomeAudioComplete && !isConnecting ? 'ready' : ''}`}
            >
              {isConnecting ? '🔄 Connecting...' :
               !welcomeAudioComplete ? '⏳ Preparing...' :
               '🚀 Start Learning!'}
            </button>

            {/* Skip button if audio is taking too long */}
            {!welcomeAudioComplete && (
              <button
                onClick={() => {
                  console.log('[App] User skipped welcome audio');
                  window.speechSynthesis.cancel();
                  setWelcomeAudioComplete(true);
                  setWelcomeAudioPlaying(false);
                }}
                className="skip-button"
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  background: 'transparent',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Skip Introduction →
              </button>
            )}

            {welcomeAudioComplete && (
              <p className="welcome-note">
                💡 Make sure your microphone is ready - we'll be talking!
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Main Learning Interface */}
      {!showWelcomeScreen && (
        <>
          <SessionHeader />
          
          <div className="main-content">
            <PiAvatar />
            
            <MasteryCard card={currentCard} isCurrent={true} />
            
            {/* Voice Status */}
            <div className="control-tray">
              {!isConnected ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔄</div>
                  <p>Connecting to Pi...</p>
                </div>
              ) : (
                <div className="status-controls">
                  <div className="status-indicator">
                    {isSpeaking ? '🔊 Pi is speaking...' : isMicActive ? '🎤 Listening...' : '⏸️ Paused'}
                  </div>
                  {isSpeaking && (
                    <button 
                      onClick={handleStopSpeaking} 
                      className="stop-button"
                    >
                      🛑 Stop Speaking
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          
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

      {/* Debug - Console logs show everything */}
      {import.meta.env.DEV && (
        <div className="debug-info">
          <p><strong>Card {currentCard.cardNumber}:</strong> {currentCard.title}</p>
          <p><strong>Exchanges:</strong> {exchangeCount.current}</p>
          <p><strong>Gemini:</strong> {isConnected ? '✓ Connected' : '✗ Disconnected'}</p>
          <p><strong>Mic:</strong> {isMicActive ? '✓ Active' : '✗ Inactive'}</p>
          <p><strong>Speaking:</strong> {isSpeaking ? '✓ Yes' : '✗ No'}</p>
          <p style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
            Check console for Claude's decisions
          </p>
        </div>
      )}
    </div>
  );
}

function getCelebration(masteryLevel: string): string {
  switch (masteryLevel) {
    case 'advanced':
      return 'Whoa! You really understand this deeply!';
    case 'teaching':
      return 'You taught me something! Amazing!';
    default:
      return 'Nice! You explained that clearly!';
  }
}

export default function App() {
  return <AppContent />;
}
