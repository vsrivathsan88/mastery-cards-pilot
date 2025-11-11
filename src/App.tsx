/**
 * Mastery Cards App - Main Component
 * MVP: Basic card display with session management
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useLiveAPIContext } from './contexts/LiveAPIContext';
import { Modality } from '@google/genai';
import { MasteryCard } from './components/cards/MasteryCard';
import { SessionHeader } from './components/session/SessionHeader';
import { ControlTray } from './components/voice/ControlTray';
import { PiAvatar } from './components/PiAvatar';
import { NamePrompt } from './components/NamePrompt';
import { LevelUpAnimation } from './components/LevelUpAnimation';
import { ManualControls } from './components/ManualControls';
import { useSessionStore } from './lib/state/session-store';
import { getMissionFirstPrompt } from './lib/prompts/mission-first-prompt';
import { TranscriptManager } from './lib/transcript-manager';
import './App.css';

function AppContent() {
  // Level up animation state
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ level: string; points: number } | null>(null);
  
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
  
  const { client, setConfig } = useLiveAPIContext();
  
  // Conversation tracking refs (must be at top level)
  const conversationTurns = useRef<number>(0);
  const lastCardChange = useRef<number>(0);
  const transcript = useRef<Array<{
    timestamp: number;
    role: 'student' | 'pi' | 'system';
    text: string;
    cardId?: string;
    cardTitle?: string;
  }>>([]);
  const lastStudentResponses = useRef<string[]>([]);
  const sessionStartTime = useRef<number>(Date.now());
  const sessionNumber = useRef<number>(1);
  
  // Tool call lock for debouncing (prevent duplicate calls)
  const toolCallLock = useRef<{ show_next_card?: number }>({});
  
  // Build proper voice-to-voice config with system prompt (ONCE at session start)
  useEffect(() => {
    if (!studentName || !sessionId) return;
    
    // Build INITIAL system prompt - card info will be sent as context updates
    const systemPrompt = getMissionFirstPrompt(
      studentName,
      currentCard || undefined,
      points,
      currentLevel
    );
    
    // Tool declarations - simple and direct
    const tools = [
      {
        functionDeclarations: [
          {
            name: 'award_mastery_points',
            description: 'Award points when student demonstrates understanding. This updates points on screen and checks for level-ups.',
            parameters: {
              type: 'object',
              properties: {
                cardId: {
                  type: 'string',
                  description: 'The ID of the card for which points are being awarded'
                },
                points: {
                  type: 'number',
                  description: 'Number of points to award (from the mastery criteria)'
                },
                celebration: {
                  type: 'string',
                  description: 'A short, energetic phrase celebrating what they did well'
                }
              },
              required: ['cardId', 'points', 'celebration']
            }
          },
          {
            name: 'show_next_card',
            description: 'Move to the next card. Call this after awarding points OR if student is stuck after 2-3 tries.',
            parameters: {
              type: 'object',
              properties: {}
            }
          }
        ]
      }
    ];
    
    // EXACT pattern from working tutor-app + robustness features
    const config: any = {
      responseModalities: [Modality.AUDIO],  // Array with enum, not string!
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: 'Zephyr',  // Warm, encouraging voice for Pi
          },
        },
      },
      
      // Voice Activity Detection - automatic turn-taking
      automaticActivityDetection: {
        // Auto-detect when student starts/stops speaking
        startOfSpeechSensitivity: 0.5,  // 0.0-1.0, higher = more sensitive
        prefixPaddingMs: 200,  // Buffer before speech detection
      },
      
      // Context Window Compression - unlimited session length
      contextWindowCompression: {
        slidingWindow: {},  // Use sliding window to prevent 15min timeout
      },
      
      // Session Resumption - handle WebSocket resets
      sessionResumption: {},  // Enable session resumption
      
      inputAudioTranscription: {},   // Enable transcription
      outputAudioTranscription: {},
      systemInstruction: {
        parts: [{
          text: systemPrompt
        }]
      },
      tools,  // Add tool declarations
    };
    
    setConfig(config);
    console.log('[App] 🔧 Config set for session');
  }, [studentName, sessionId, setConfig]); // Only run once per session, not on card changes!
  
  // Show name prompt if no student name
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  
  // Check if we need to show name prompt
  useEffect(() => {
    if (!studentName && !sessionId) {
      setShowNamePrompt(true);
    }
  }, [studentName, sessionId]);
  
  // Initialize session after name is set
  useEffect(() => {
    if (studentName && !sessionId) {
      startSession(); // Uses MVP_CARDS by default
    }
  }, [studentName, sessionId, startSession]);
  
  // Track session counts per student in localStorage
  useEffect(() => {
    if (studentName) {
      const storageKey = `session-count-${studentName}`;
      const previousCount = parseInt(localStorage.getItem(storageKey) || '0', 10);
      sessionNumber.current = previousCount + 1;
      localStorage.setItem(storageKey, sessionNumber.current.toString());
    }
  }, [studentName]);
  
  // Persist session state to localStorage (auto-save every time state changes)
  useEffect(() => {
    if (sessionId && currentCard) {
      const sessionState = {
        sessionId,
        studentName,
        currentCardId: currentCard.id,
        currentCardNumber: currentCard.cardNumber,
        points,
        currentLevel: currentLevel.title,
        timestamp: Date.now()
      };
      
      try {
        localStorage.setItem('current-session', JSON.stringify(sessionState));
        console.log('[App] 💾 Session state saved');
      } catch (error) {
        console.error('[App] ❌ Failed to save session state:', error);
      }
    }
  }, [sessionId, studentName, currentCard, points, currentLevel]);
  
  // Clear session state on session complete
  useEffect(() => {
    if (sessionId && !currentCard) {
      try {
        localStorage.removeItem('current-session');
        console.log('[App] 🗑️ Session state cleared (session complete)');
      } catch (error) {
        console.error('[App] ❌ Failed to clear session state:', error);
      }
    }
  }, [sessionId, currentCard]);

  // Helper functions at component level (stable, don't change)
  const minimalPhrases = ['ok', 'okay', 'yeah', 'yep', 'yup', 'sure', 'uh-huh', 'mhm', 'nope', 'nah', 'idk', 'dunno'];
  
  const isMinimalResponse = useCallback((text: string): boolean => {
    if (!text) return true;
    const clean = text.toLowerCase().trim();
    const words = clean.split(/\s+/);
    if (clean.length < 3) return true;
    if (words.length === 1 && minimalPhrases.includes(clean)) return true;
    if (words.length < 2) return true;
    return false;
  }, []);
  
  const isRepeatedResponse = useCallback((text: string): boolean => {
    if (!text) return false;
    const clean = text.toLowerCase().trim();
    const matches = lastStudentResponses.current.filter(r => r.toLowerCase().trim() === clean).length;
    return matches >= 2;
  }, []);
  
  const addToTranscript = useCallback((role: 'student' | 'pi' | 'system', text: string) => {
    transcript.current.push({
      timestamp: Date.now() - sessionStartTime.current,
      role,
      text,
      cardId: currentCard?.id,
      cardTitle: currentCard?.title
    });
    
    if (role === 'student') {
      lastStudentResponses.current.push(text);
      if (lastStudentResponses.current.length > 5) {
        lastStudentResponses.current.shift();
      }
    }
  }, [currentCard]);
  
  // Remove complex image sending since we're using imageDescription in prompt
  
  const saveTranscript = useCallback(() => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    
    const previousSessions: string[] = JSON.parse(
      localStorage.getItem(`sessions-${studentName}`) || '[]'
    );
    
    const transcriptData = {
      sessionId: `${studentName}-session${sessionNumber.current}-${Date.now()}`,
      sessionNumber: sessionNumber.current,
      studentName: studentName || 'Unknown',
      startTime: sessionStartTime.current,
      startTimeFormatted: new Date(sessionStartTime.current).toISOString(),
      endTime: Date.now(),
      endTimeFormatted: now.toISOString(),
      durationMs: Date.now() - sessionStartTime.current,
      durationMinutes: Math.round((Date.now() - sessionStartTime.current) / 60000),
      totalPoints: points,
      finalLevel: currentLevel?.title,
      cardsCompleted: currentCard?.cardNumber || 0,
      averageTimePerCard: Math.round((Date.now() - sessionStartTime.current) / (currentCard?.cardNumber || 1)),
      totalTurns: transcript.current.filter(t => t.role === 'student' || t.role === 'pi').length,
      studentResponses: transcript.current.filter(t => t.role === 'student').length,
      piResponses: transcript.current.filter(t => t.role === 'pi').length,
      systemBlocks: transcript.current.filter(t => t.role === 'system' && t.text.includes('BLOCK')).length,
      pointsAwarded: transcript.current.filter(t => t.role === 'system' && t.text.includes('Awarded')).length,
      previousSessionCount: sessionNumber.current - 1,
      previousSessionIds: previousSessions,
      transcript: transcript.current
    };
    
    previousSessions.push(transcriptData.sessionId);
    localStorage.setItem(`sessions-${studentName}`, JSON.stringify(previousSessions));
    
    const filename = `${studentName || 'Unknown'}-session${sessionNumber.current}-${dateStr}-${timeStr}.json`;
    const blob = new Blob([JSON.stringify(transcriptData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [studentName, points, currentLevel, currentCard]);

  // Handle tool calls from Pi
  const handleToolCall = useCallback((toolCall: any) => {
    const { functionCalls } = toolCall;
    if (!functionCalls || functionCalls.length === 0) return;
    
    console.log('[App] 🔧 Tool calls received:', functionCalls.map((fc: any) => ({
      name: fc.name,
      args: fc.args
    })));
    
    // STEP 1: DEDUPLICATE - Remove duplicate calls within same batch
    const uniqueCalls = functionCalls.filter((call: any, index: number, self: any[]) => {
      return self.findIndex((c: any) => c.name === call.name) === index;
    });
    
    if (uniqueCalls.length < functionCalls.length) {
      console.warn(`[App] ⚠️ Removed ${functionCalls.length - uniqueCalls.length} duplicate tool calls`);
    }
    
    // STEP 2: DEBOUNCE - Filter out calls that are too recent
    const now = Date.now();
    const filteredCalls = uniqueCalls.filter((call: any) => {
      if (call.name === 'show_next_card') {
        const lastCall = toolCallLock.current.show_next_card || 0;
        if (now - lastCall < 2000) {
          console.warn('[App] ⚠️ BLOCKED: show_next_card called too recently (debouncing)');
          return false;
        }
        toolCallLock.current.show_next_card = now;
      }
      return true;
    });
    
    if (filteredCalls.length === 0) {
      console.log('[App] ℹ️ All tool calls filtered out (duplicates/debounce)');
      return;
    }
    
    console.log(`[App] 🔨 Processing ${filteredCalls.length} tool calls`);
    
    const toolResponses: any[] = [];
    
    // Add timeout safety - if processing takes too long, something went wrong
    const processingTimeout = setTimeout(() => {
      console.error('[App] ⚠️ Tool processing timeout - this should not happen');
    }, 5000);
    
    filteredCalls.forEach((call: any) => {
      const { id, name, args } = call;
      
      console.log(`[App] 🔨 Processing tool: ${name}`, args);
      
      let response: any = { id, name };
      
      switch (name) {
        case 'award_mastery_points': {
          const { cardId, points: pointsToAward, celebration } = args;
          
          console.log(`[App] ✨ Awarding ${pointsToAward} points for ${cardId}`);
          addToTranscript('system', `Awarded ${pointsToAward} points for ${cardId}: ${celebration}`);
          
          const result = awardPoints(pointsToAward, celebration);
          
          if (result.leveledUp && result.newLevel) {
            addToTranscript('system', `LEVEL UP to ${result.newLevel.title}!`);
            setLevelUpData({
              level: result.newLevel.title,
              points: points + pointsToAward
            });
            setShowLevelUp(true);
            response.response = { 
              result: `Successfully awarded ${pointsToAward} points! LEVEL UP to ${result.newLevel.title}! Total: ${points + pointsToAward}`
            };
          } else {
            response.response = { 
              result: `Successfully awarded ${pointsToAward} points. Total: ${points + pointsToAward}`
            };
          }
          break;
        }
        
        case 'show_next_card': {
          console.log('[App] 🔄 Advancing to next card');
          
          nextCard();
          conversationTurns.current = 0;
          lastCardChange.current = Date.now();
          
          const { currentCard: newCard } = useSessionStore.getState();
          
          if (newCard) {
            addToTranscript('system', `Advanced to card: ${newCard.title}`);
            
            // Send new card info as a context message (not system prompt update)
            const cardContext = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEW CARD: ${newCard.title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT YOU SEE:
${newCard.imageDescription}

WHAT YOU'RE ASSESSING:
${newCard.learningGoal}

YOUR STARTING QUESTION:
"${newCard.piStartingQuestion}"

MASTERY CRITERIA (score 1-5):
Basic (${newCard.milestones.basic.points} pts): ${newCard.milestones.basic.description}
Evidence for score 4-5: ${newCard.milestones.basic.evidenceKeywords.join(', ')}
${newCard.milestones.advanced ? `
Advanced (${newCard.milestones.advanced.points} pts BONUS): ${newCard.milestones.advanced.description}
Evidence for score 4-5: ${newCard.milestones.advanced.evidenceKeywords.join(', ')}
` : ''}
${newCard.misconception ? `
⚠️ MISCONCEPTION CARD - You present wrong thinking: "${newCard.misconception.piWrongThinking}"
Student should teach you: ${newCard.misconception.correctConcept}
Teaching mastery (${newCard.misconception.teachingMilestone.points} pts): ${newCard.misconception.teachingMilestone.description}
` : ''}

NOW: Ask your starting question to begin assessing this card.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
            
            // Send as context update mid-conversation
            try {
              client.send([{ text: cardContext }]);
              console.log('[App] ✅ Card context sent successfully');
            } catch (error) {
              console.error('[App] ❌ Failed to send card context:', error);
              // Continue anyway - Pi might still function
            }
            
            response.response = { 
              result: `Card changed successfully. New card info sent. Ask your starting question now.`
            };
          } else {
            addToTranscript('system', 'Session completed - all cards done');
            saveTranscript();
            response.response = { 
              result: `SESSION COMPLETE! All 8 cards done. Total: ${points} points. Level: ${currentLevel.title}. Now wrap up warmly.`
            };
          }
          break;
        }
        
        default:
          console.warn(`[App] Unknown tool: ${name}`);
          response.response = { result: `Error: Unknown tool "${name}"` };
          response.scheduling = 'SILENT';
      }
      
      toolResponses.push(response);
    });
    
    clearTimeout(processingTimeout);
    
    if (toolResponses.length > 0) {
      try {
        console.log('[App] 📤 Sending tool responses:', JSON.stringify(toolResponses, null, 2));
        client.sendToolResponse({ functionResponses: toolResponses });
        console.log('[App] ✅ Tool responses sent successfully');
      } catch (error) {
        console.error('[App] ❌ Failed to send tool responses:', error);
        // Don't throw - log and continue
        addToTranscript('system', `ERROR: Tool response failed - ${error}`);
      }
    }
  }, [client, awardPoints, nextCard, currentCard, points, currentLevel, addToTranscript, saveTranscript]);

  // Track conversation turns
  const handleContent = useCallback((data: any) => {
    conversationTurns.current += 1;
    
    if (data?.serverContent?.modelTurn?.parts) {
      const text = data.serverContent.modelTurn.parts
        .filter((p: any) => p.text)
        .map((p: any) => p.text)
        .join(' ');
      if (text) {
        addToTranscript('pi', text);
      }
    }
  }, [addToTranscript]);
  
  // Track student transcriptions - count turns here (only when student speaks)
  const handleInputTranscription = useCallback((text: string, isFinal: boolean) => {
    if (isFinal && text) {
      conversationTurns.current += 1;  // Increment only on student input
      addToTranscript('student', text);
    }
  }, [addToTranscript]);
  
  // Register handlers
  useEffect(() => {
    if (!client) return;
    client.on('toolcall', handleToolCall);
    client.on('content', handleContent);
    client.on('inputTranscription', handleInputTranscription);
    return () => {
      client.off('toolcall', handleToolCall);
      client.off('content', handleContent);
      client.off('inputTranscription', handleInputTranscription);
    };
  }, [client, handleToolCall, handleContent, handleInputTranscription]);
  
  // Send initial card context when connection is ready
  useEffect(() => {
    if (currentCard && client?.status === 'connected' && sessionId) {
      // Small delay to ensure connection is stable
      const timer = setTimeout(() => {
        console.log('[App] 📤 Sending initial card context to Pi');
        
        const cardContext = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CURRENT CARD: ${currentCard.title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT YOU SEE:
${currentCard.imageDescription}

WHAT YOU'RE ASSESSING:
${currentCard.learningGoal}

YOUR STARTING QUESTION:
"${currentCard.piStartingQuestion}"

MASTERY CRITERIA (score 1-5):
Basic (${currentCard.milestones.basic.points} pts): ${currentCard.milestones.basic.description}
Evidence for score 4-5: ${currentCard.milestones.basic.evidenceKeywords.join(', ')}
${currentCard.milestones.advanced ? `
Advanced (${currentCard.milestones.advanced.points} pts BONUS): ${currentCard.milestones.advanced.description}
Evidence for score 4-5: ${currentCard.milestones.advanced.evidenceKeywords.join(', ')}
` : ''}

${currentCard.cardNumber === 0 ? `This is the WELCOME card - greet the student and call show_next_card()` : `NOW: Ask your starting question to begin assessing.`}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
        
        try {
          client.send([{ text: cardContext }]);
          console.log('[App] ✅ Initial card context sent');
        } catch (error) {
          console.error('[App] ❌ Failed to send initial card context:', error);
          // If this fails, the session might not work properly
          // But don't crash - let user try to continue
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [client?.status, sessionId]); // Only run once when connected
  
  const handleNameSubmit = (name: string) => {
    setStudentName(name);
    setShowNamePrompt(false);
  };
  
  // Manual override handlers
  const handleManualNextCard = useCallback(() => {
    console.log('[App] 🎮 Manual next card triggered');
    addToTranscript('system', 'Manual override: Next card');
    nextCard();
    conversationTurns.current = 0;
    lastCardChange.current = Date.now();
  }, [nextCard, addToTranscript]);
  
  const handleManualAwardPoints = useCallback((points: number) => {
    console.log(`[App] 🎮 Manual award: ${points} points`);
    addToTranscript('system', `Manual override: Awarded ${points} points`);
    const result = awardPoints(points, 'Manual award');
    
    if (result.leveledUp && result.newLevel) {
      setLevelUpData({
        level: result.newLevel.title,
        points: points + points
      });
      setShowLevelUp(true);
    }
  }, [awardPoints, addToTranscript, points]);
  
  // Show name prompt as priority
  if (showNamePrompt) {
    return (
      <div className="app">
        <NamePrompt onSubmit={handleNameSubmit} />
      </div>
    );
  }
  
  // Show session complete only if session was started and finished
  if (!currentCard && sessionId) {
    return (
      <div className="app">
        <SessionHeader />
        <div className="session-complete">
          <PiAvatar size="large" expression="excited" />
          <h1>🎉 Session Complete!</h1>
          <p>Great job mastering those concepts!</p>
          <p className="final-stats">
            Final Score: <strong>{points} points</strong><br />
            Level: <strong>{currentLevel.title}</strong>
          </p>
          <button 
            className="restart-button"
            onClick={() => startSession()}
          >
            Start New Session
          </button>
        </div>
      </div>
    );
  }
  
  // Loading state while session initializes
  if (!currentCard) {
    return (
      <div className="app">
        <SessionHeader />
        <main className="card-container">
          <div style={{ 
            textAlign: 'center', 
            color: 'var(--text-primary)',
            fontSize: '18px',
            fontWeight: 600,
            marginTop: '100px'
          }}>
            Loading your cards...
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="app">
      <SessionHeader />
      
      <main className="card-container">
        {/* Pi Avatar - floating helper */}
        <div className="pi-helper">
          <PiAvatar size="medium" expression="curious" showLabel={false} />
        </div>
        
        {/* Current Card */}
        <div className="active-card">
          <MasteryCard
            card={currentCard}
            isCurrent={true}
          />
        </div>
        
        {/* Gemini Live Control Tray */}
        <ControlTray />
        
        {/* Manual Override Controls */}
        <ManualControls
          onNextCard={handleManualNextCard}
          onAwardPoints={handleManualAwardPoints}
          currentCard={currentCard}
          disabled={!client || client.status !== 'connected'}
        />
      </main>
      
      {/* Level Up Animation */}
      {levelUpData && (
        <LevelUpAnimation
          show={showLevelUp}
          newLevel={levelUpData.level}
          totalPoints={levelUpData.points}
          onComplete={() => {
            setShowLevelUp(false);
            setLevelUpData(null);
          }}
        />
      )}
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;
