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
  const [isMicActive, setIsMicActive] = useState(false);
  
  const { 
    currentCard, 
    sessionId,
    studentName,
    points,
    currentLevel,
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
      return; // Only check minimum required
    }
    
    // ONLY create client if we don't have one
    if (clientRef.current) {
      return; // Already have client
    }
    
    console.log('[App] 🔧 Creating OpenAI client ONE TIME');
    
    // Get everything from store to avoid prop dependencies
    const card = useSessionStore.getState().currentCard;
    if (!card) return;
    const pts = useSessionStore.getState().points;
    const lvl = useSessionStore.getState().currentLevel;
    
    const instructions = getSimplePiPrompt(studentName, card, pts, lvl);
    
    const client = new OpenAIRealtimeClient({
      apiKey: openaiKey,
      voice: 'alloy',
      instructions,
      temperature: 0.8
    });
    
    // Handle events
    client.on('open', () => {
      console.log('[App] ✅ OpenAI connected');
      setIsConnected(true);
    });
    
    client.on('microphoneStarted', () => {
      console.log('[App] ✅ Microphone active');
      setIsMicActive(true);
    });
    
    // Listen for transcripts from OpenAI
    client.on('transcript', (data: { role: string; text: string }) => {
      console.log(`[App] 💬 ${data.role}: ${data.text}`);
      
      // ONLY process student messages for evaluation
      if (data.role === 'user') {
        console.log('[App] 🎤 User message detected - will evaluate');
        handleStudentMessage(data.text);
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
      setIsMicActive(false);
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
    
    // Check if already connected or connecting
    const status = clientRef.current.getStatus();
    if (status === 'connected') {
      console.log('[App] Already connected');
      return;
    }
    if (status === 'connecting') {
      console.log('[App] Already connecting, please wait...');
      return;
    }
    
    console.log('[App] 🚀 Starting connection...');
    try {
      await clientRef.current.connect();
      console.log('[App] ✅ Connection initiated');
    } catch (error) {
      console.error('[App] ❌ Failed to connect:', error);
    }
  }, []);
  
  // Update instructions when card changes (STOPS audio to prevent overlaps)
  useEffect(() => {
    if (!clientRef.current || !currentCard || !studentName || currentCard.cardNumber === 0) return;
    if (clientRef.current.getStatus() !== 'connected') return;
    
    console.log(`[App] 📸 Card changed to: ${currentCard.title} - stopping audio and updating`);
    
    const newInstructions = getSimplePiPrompt(studentName, currentCard, points, currentLevel);
    clientRef.current.updateInstructions(newInstructions); // This now stops audio first
    
    // Reset tracking
    conversationHistory.current = [];
    exchangeCount.current = 0;
  }, [currentCard, studentName, points, currentLevel]);
  
  // Handle student message - MUST evaluate with Claude on EVERY response
  const handleStudentMessage = useCallback(async (text: string) => {
    // Get fresh card reference from store (avoid stale closure)
    const card = useSessionStore.getState().currentCard;
    
    if (!card || evaluating.current) return;
    
    exchangeCount.current++;
    
    conversationHistory.current.push({
      role: 'student',
      text,
      timestamp: Date.now()
    });
    
    console.log(`\n[App] 👤 Student (exchange ${exchangeCount.current}): ${text}`);
    console.log(`[App] 📍 Current card: #${card.cardNumber} - ${card.title}`);
    
    // SPECIAL: Card 0 ONLY - auto-advance (no evaluation needed)
    if (card.cardNumber === 0) {
      console.log('[App] 🎬 CARD 0 DETECTED - Welcome card - auto-advancing to first learning card');
      setTimeout(() => {
        nextCard();
        console.log('[App] ➡️ Moved from Card 0 to Card 1');
      }, 2000);
      return;
    }
    
    // ALL OTHER CARDS - Must evaluate with Claude
    console.log(`[App] 🎯 CARD ${card.cardNumber} - Evaluating with Claude...`);
    
    // Check Claude key
    if (!claudeKey || claudeKey === 'your_claude_api_key_here' || claudeKey === '') {
      console.error('[App] ❌ Claude API key not configured! Cannot evaluate.');
      console.error('[App] ❌ Set VITE_CLAUDE_API_KEY in .env file');
      return;
    }
    
    // CRITICAL: Evaluate with Claude on EVERY student response (except Card 0)
    evaluating.current = true;
    
    console.log('[Judge] 🔮 Calling Claude judge NOW...');
    
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
      
      // ONLY change cards when Claude says so
      switch (evaluation.suggestedAction) {
        case 'award_and_next':
          if (evaluation.points) {
            console.log(`[App] ✨ Claude approved: Award ${evaluation.points} points and move to next card`);
            const result = awardPoints(evaluation.points, getCelebration(evaluation.masteryLevel));
            
            if (result.leveledUp && result.newLevel) {
              setLevelUpData({
                level: result.newLevel.title,
                points: points + evaluation.points
              });
              setShowLevelUp(true);
            }
          }
          // ONLY move to next card when Claude says so
          setTimeout(() => {
            console.log(`[App] ➡️ Moving to next card (Claude approved: award_and_next)`);
            nextCard();
          }, 1500);
          break;
          
        case 'next_without_points':
          console.log('[App] ➡️ Claude approved: Student stuck, move on without points');
          setTimeout(() => {
            console.log('[App] ➡️ Moving to next card (Claude approved: next_without_points)');
            nextCard();
          }, 1000);
          break;
          
        case 'continue':
          console.log('[App] 💬 Claude says: CONTINUE - Keep talking (NOT moving to next card)');
          // Do NOT move to next card - keep talking
          break;
      }
    } catch (error) {
      console.error('[Judge] ❌ Claude evaluation failed:', error);
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
            <button onClick={handleConnect} className="connect-button">
              🎤 Start Conversation
            </button>
          ) : (
            <div className="status">
              <div className="status-indicator">
                {isMicActive ? '🟢 Listening...' : '🔴 Connecting...'}
              </div>
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
