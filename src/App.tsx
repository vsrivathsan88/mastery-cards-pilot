/**
 * Mastery Cards App - OpenAI Realtime Version
 * SIMPLIFIED: Direct OpenAI integration with Claude judge
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { MasteryCard } from './components/cards/MasteryCard';
import { SessionHeader } from './components/session/SessionHeader';
import { PiAvatar } from './components/PiAvatar';
import { NamePrompt } from './components/NamePrompt';
import { LevelUpAnimation } from './components/LevelUpAnimation';
import { useSessionStore } from './lib/state/session-store';
import { getSimplePiPrompt } from './lib/prompts/simple-pi-prompt';
import { evaluateMastery, type ConversationTurn } from './lib/evaluator/claude-judge';
import { OpenAIRealtimeClient } from './lib/openai-realtime-client';
import './App.css';

function AppContent() {
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ level: string; points: number } | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
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
  
  // OpenAI client
  const clientRef = useRef<OpenAIRealtimeClient | null>(null);
  
  // Conversation tracking
  const conversationHistory = useRef<ConversationTurn[]>([]);
  const exchangeCount = useRef<number>(0);
  const evaluating = useRef<boolean>(false);
  
  // Get API keys
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const claudeKey = import.meta.env.VITE_CLAUDE_API_KEY;
  
  // Initialize OpenAI client ONCE when session starts
  useEffect(() => {
    if (!studentName || !sessionId || !openaiKey) {
      return;
    }
    
    // ONLY create client if we don't have one
    if (clientRef.current) {
      return; // Already have client
    }
    
    console.log('[App] 🔧 Creating WebSocket client ONE TIME');
    
    // Get everything from store to avoid prop dependencies
    const card = useSessionStore.getState().currentCard;
    if (!card) return;
    const pts = useSessionStore.getState().points;
    const lvl = useSessionStore.getState().currentLevel;
    
    const instructions = getSimplePiPrompt(studentName, card, pts, lvl);
    
    const client = new OpenAIRealtimeClient({
      apiKey: openaiKey,
      voice: 'sage',
      instructions,
      temperature: 0.8
    });
    
    // Handle events
    client.on('open', () => {
      console.log('[App] ✅ WebSocket connected');
      setIsConnected(true);
      setIsConnecting(false);
    });
    
    client.on('microphoneStarted', () => {
      console.log('[App] ✅ Microphone active');
      setIsMicActive(true);
    });
    
    // Listen for transcripts from OpenAI
    client.on('transcript', (data: { role: string; text: string }) => {
      console.log(`[App] 💬 ${data.role}: ${data.text}`);
      
      // Track speaking state
      if (data.role === 'assistant') {
        setIsSpeaking(true);
        // Clear speaking state after a short delay (transcript is done)
        setTimeout(() => setIsSpeaking(false), 500);
      }
      
      // Track conversation and evaluate in background
      if (data.role === 'user') {
        console.log('[App] 🎤 User message - adding to history');
        conversationHistory.current.push({
          role: 'student',
          text: data.text,
          timestamp: Date.now()
        });
        exchangeCount.current++;
        
        // Background evaluation (async, doesn't block conversation)
        evaluateInBackground();
      } else if (data.role === 'assistant') {
        console.log('[App] 🤖 Pi response - adding to history');
        conversationHistory.current.push({
          role: 'pi',
          text: data.text,
          timestamp: Date.now()
        });
      }
    });
    
    client.on('error', (error: any) => {
      console.error('[App] ❌ Error:', error);
    });
    
    client.on('close', () => {
      console.log('[App] Connection closed');
      setIsConnected(false);
      setIsConnecting(false);
      setIsMicActive(false);
      setIsSpeaking(false);
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
  }, [studentName, sessionId, openaiKey]); // Minimal dependencies
  
  // Connect button handler
  const handleConnect = useCallback(async () => {
    if (!clientRef.current) {
      console.error('[App] No client available');
      return;
    }
    
    if (isConnected || isConnecting) {
      console.log('[App] Already connected or connecting');
      return;
    }
    
    console.log('[App] 🚀 Starting WebRTC connection...');
    setIsConnecting(true);
    
    try {
      await clientRef.current.connect();
      console.log('[App] ✅ Connection initiated');
    } catch (error) {
      console.error('[App] ❌ Failed to connect:', error);
      setIsConnecting(false);
    }
  }, [isConnected, isConnecting]);
  
  // Stop speaking handler
  const handleStopSpeaking = useCallback(async () => {
    if (!clientRef.current || !isConnected) return;
    
    console.log('[App] 🛑 User requested stop speaking');
    // Cancel response (which also stops audio)
    await clientRef.current.cancelResponse();
    setIsSpeaking(false);
  }, [isConnected]);
  
  // Send card context when card changes
  useEffect(() => {
    if (!clientRef.current || !currentCard || !studentName) return;
    if (!isConnected) return;
    
    console.log(`[App] 📸 Card changed to: ${currentCard.title}`);
    
    // SPECIAL: Card 0 auto-advances after brief interaction
    if (currentCard.cardNumber === 0) {
      console.log('[App] 🎬 CARD 0 - Welcome card - will auto-advance');
      // Listen for any response, then move to card 1
      const autoAdvance = setTimeout(() => {
        console.log('[App] ➡️ Auto-advancing from welcome card');
        nextCard();
      }, 10000); // 10 seconds or after they respond
      
      return () => clearTimeout(autoAdvance);
    }
    
    console.log('[App] Cancelling and sending context...');
    
    // Send compact context (WebSocket client cancels response and stops audio)
    const sendContext = async () => {
      if (clientRef.current) {
        const contextMessage = `[NEW CARD] ${currentCard.title}: ${currentCard.piStartingQuestion}. Image: ${currentCard.imageDescription}`;
        await clientRef.current.sendSystemMessage(contextMessage);
        console.log('[App] ✅ Context sent after cancel');
      }
    };
    
    sendContext();
    
    // Reset tracking
    conversationHistory.current = [];
    exchangeCount.current = 0;
  }, [currentCard, studentName, isConnected, nextCard]);
  
  // Background evaluation - doesn't block conversation
  const evaluateInBackground = useCallback(async () => {
    const card = useSessionStore.getState().currentCard;
    
    // Skip evaluation if:
    // - No card
    // - Already evaluating
    // - Not enough exchanges (min 2)
    // - Card 0 (welcome card)
    if (!card || evaluating.current || exchangeCount.current < 2 || card.cardNumber === 0) {
      return;
    }
    
    // Check Claude key
    if (!claudeKey || claudeKey === 'your_claude_api_key_here' || claudeKey === '') {
      console.error('[App] ❌ Claude API key not configured!');
      return;
    }
    
    evaluating.current = true;
    console.log(`\n[App] 🎯 Background evaluation starting...`);
    console.log(`[App] 📍 Current card: #${card.cardNumber} - ${card.title}`);
    console.log(`[App] 📊 Exchanges: ${exchangeCount.current}`);
    console.log('[Judge] 🔮 Calling Claude judge...');
    
    try {
      const evaluation = await evaluateMastery(
        card,
        conversationHistory.current,
        exchangeCount.current,
        claudeKey
      );
      
      console.log(`\n[Judge] 📊 ===== CLAUDE DECISION =====`);
      console.log(`[Judge] 📊 DECISION: ${evaluation.suggestedAction.toUpperCase()}`);
      console.log(`[Judge] 📊 Mastery Level: ${evaluation.masteryLevel}`);
      console.log(`[Judge] 📊 Confidence: ${evaluation.confidence}%`);
      console.log(`[Judge] 📊 Reasoning: ${evaluation.reasoning}`);
      console.log(`[Judge] 📊 ============================\n`);
      
      // Handle card progression based on judgment
      switch (evaluation.suggestedAction) {
        case 'award_and_next':
          if (evaluation.points) {
            console.log(`[App] ✨ Awarding ${evaluation.points} points`);
            const result = awardPoints(evaluation.points, getCelebration(evaluation.masteryLevel));
            
            if (result.leveledUp && result.newLevel) {
              setLevelUpData({
                level: result.newLevel.title,
                points: points + evaluation.points
              });
              setShowLevelUp(true);
            }
            
            // Tell Pi to celebrate before moving card
            // Use cancelInFlight: false to wait for current response to finish
            const celebrationPrompt = `[SYSTEM NOTIFICATION] The student just demonstrated ${evaluation.masteryLevel}-level mastery and earned ${evaluation.points} points! Briefly celebrate their understanding in your Pi voice (1-2 sentences max). Be specific about what they explained well. The system will then move to the next card.`;
            clientRef.current?.sendSystemMessage(celebrationPrompt, { cancelInFlight: false });
          }
          
          // Wait for Pi to celebrate, then move to next card
          setTimeout(() => {
            console.log(`[App] ➡️ Moving to next card after celebration`);
            nextCard();
          }, 3000); // Give time for celebration
          break;
          
        case 'next_without_points':
          console.log('[App] ➡️ Moving on without points');
          // Tell Pi to acknowledge effort before moving on
          // Use cancelInFlight: false to wait for current response to finish
          const encouragementPrompt = `[SYSTEM NOTIFICATION] This concept is challenging. Acknowledge the student's effort (1 sentence), then say you'll come back to this idea later. The system will move to the next card.`;
          clientRef.current?.sendSystemMessage(encouragementPrompt, { cancelInFlight: false });
          
          setTimeout(() => {
            nextCard();
          }, 3000);
          break;
          
        case 'continue':
          console.log('[App] 💬 Continuing conversation (not moving card)');
          // Just let the conversation continue
          break;
      }
    } catch (error) {
      console.error('[Judge] ❌ Claude evaluation failed:', error);
      // Silently continue on error - don't disrupt conversation
    } finally {
      evaluating.current = false;
    }
  }, [claudeKey, nextCard, awardPoints, points]);
  
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
      <SessionHeader />
      
      <div className="main-content">
        <PiAvatar />
        
        <MasteryCard card={currentCard} isCurrent={true} />
        
        {/* Voice Status */}
        <div className="control-tray">
          {!isConnected ? (
            <button 
              onClick={handleConnect} 
              className="connect-button"
              disabled={isConnecting}
            >
              {isConnecting ? '⏳ Connecting...' : '🎤 Start Conversation'}
            </button>
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
      
      {/* Debug - Console logs show everything */}
      {import.meta.env.DEV && (
        <div className="debug-info">
          <p><strong>Card {currentCard.cardNumber}:</strong> {currentCard.title}</p>
          <p><strong>Exchanges:</strong> {exchangeCount.current}</p>
          <p><strong>OpenAI:</strong> {isConnected ? '✓ Connected' : '✗ Disconnected'}</p>
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
