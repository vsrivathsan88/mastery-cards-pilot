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
import { DebugPanel } from './components/DebugPanel';
import { LevelUpAnimation } from './components/LevelUpAnimation';
import { useSessionStore } from './lib/state/session-store';
import { useDebugStore } from './lib/state/debug-store';
import { getMasteryCardsSystemPrompt } from './lib/prompts/cards-system-prompt';
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
  
  const { messages, clearMessages } = useDebugStore();
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
  
  // Build proper voice-to-voice config with system prompt (updates when card changes)
  useEffect(() => {
    if (!studentName) return;
    
    // Build system prompt with Pi's personality, current card, and progress
    const systemPrompt = getMasteryCardsSystemPrompt(
      studentName,
      currentCard || undefined,
      points,
      currentLevel
    );
    
    // Tool declarations - tell Gemini these tools exist
    const tools = [
      {
        functionDeclarations: [
          {
            name: 'award_mastery_points',
            description: 'Award points to the student when they demonstrate understanding. This will update the points on screen and check for level-ups.',
            parameters: {
              type: 'object',
              properties: {
                cardId: {
                  type: 'string',
                  description: 'The ID of the current card (e.g., "card-1-cookies")',
                },
                points: {
                  type: 'number',
                  description: 'Points to award: 20-50 for basic understanding, 30-100 for advanced, 100 for teaching Pi',
                },
                celebration: {
                  type: 'string',
                  description: 'A short, energetic celebration message (e.g., "Nice work!", "That was fire!")',
                },
              },
              required: ['cardId', 'points', 'celebration'],
            },
          },
          {
            name: 'show_next_card',
            description: 'Move to the next card/image. Call this after awarding points to keep the session flowing.',
            parameters: {
              type: 'object',
              properties: {},
            },
          },
        ],
      },
    ];
    
    // EXACT pattern from working tutor-app
    const config: any = {
      responseModalities: [Modality.AUDIO],  // Array with enum, not string!
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: 'Zephyr',  // Warm, encouraging voice for Pi
          },
        },
      },
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
    
    console.log('[App] ✅ Voice config + system prompt set');
    console.log('[App] Current card:', currentCard?.title || 'none');
    console.log('[App] Points:', points, '| Level:', currentLevel.title);
    console.log('[App] Tools registered:', tools[0].functionDeclarations.map(t => t.name).join(', '));
  }, [studentName, currentCard, points, currentLevel, setConfig]);
  
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
      console.log('[App] Initializing session for', studentName);
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
      console.log(`[App] 📊 Session #${sessionNumber.current} for ${studentName}`);
    }
  }, [studentName]);
  
  // Register tool handlers with Gemini client
  useEffect(() => {
    if (!client) return;
    
    console.log('[App] Registering tool handlers...');
    
    // Minimal response detection
    const minimalPhrases = ['ok', 'okay', 'yeah', 'yep', 'yup', 'sure', 'uh-huh', 'mhm', 'nope', 'nah', 'idk', 'dunno'];
    
    const isMinimalResponse = (text: string): boolean => {
      if (!text) return true;
      const clean = text.toLowerCase().trim();
      const words = clean.split(/\s+/);
      
      // Too short
      if (clean.length < 3) return true;
      
      // Single word that's minimal
      if (words.length === 1 && minimalPhrases.includes(clean)) return true;
      
      // Less than 2 words
      if (words.length < 2) return true;
      
      return false;
    };
    
    // Repeated response detection
    const isRepeatedResponse = (text: string): boolean => {
      if (!text) return false;
      const clean = text.toLowerCase().trim();
      const matches = lastStudentResponses.current.filter(r => r.toLowerCase().trim() === clean).length;
      return matches >= 2; // Said exact same thing 2+ times
    };
    
    // Add to transcript
    const addToTranscript = (role: 'student' | 'pi' | 'system', text: string) => {
      transcript.current.push({
        timestamp: Date.now() - sessionStartTime.current,
        role,
        text,
        cardId: currentCard?.id,
        cardTitle: currentCard?.title
      });
      
      // Track last 5 student responses for repetition detection
      if (role === 'student') {
        lastStudentResponses.current.push(text);
        if (lastStudentResponses.current.length > 5) {
          lastStudentResponses.current.shift();
        }
      }
    };
    
    // Save transcript to JSON
    const saveTranscript = () => {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
      
      // Get previous sessions count for this student
      const previousSessions: string[] = JSON.parse(
        localStorage.getItem(`sessions-${studentName}`) || '[]'
      );
      
      const transcriptData = {
        // Session identification
        sessionId: `${studentName}-session${sessionNumber.current}-${Date.now()}`,
        sessionNumber: sessionNumber.current,
        studentName: studentName || 'Unknown',
        
        // Timing
        startTime: sessionStartTime.current,
        startTimeFormatted: new Date(sessionStartTime.current).toISOString(),
        endTime: Date.now(),
        endTimeFormatted: now.toISOString(),
        durationMs: Date.now() - sessionStartTime.current,
        durationMinutes: Math.round((Date.now() - sessionStartTime.current) / 60000),
        
        // Performance
        totalPoints: points,
        finalLevel: currentLevel?.title,
        cardsCompleted: currentCard?.cardNumber || 0,
        averageTimePerCard: Math.round((Date.now() - sessionStartTime.current) / (currentCard?.cardNumber || 1)),
        
        // Quality metrics
        totalTurns: transcript.current.filter(t => t.role === 'student' || t.role === 'pi').length,
        studentResponses: transcript.current.filter(t => t.role === 'student').length,
        piResponses: transcript.current.filter(t => t.role === 'pi').length,
        systemBlocks: transcript.current.filter(t => t.role === 'system' && t.text.includes('BLOCK')).length,
        pointsAwarded: transcript.current.filter(t => t.role === 'system' && t.text.includes('Awarded')).length,
        
        // Student history
        previousSessionCount: sessionNumber.current - 1,
        previousSessionIds: previousSessions,
        
        // Full transcript
        transcript: transcript.current
      };
      
      // Update student's session history
      previousSessions.push(transcriptData.sessionId);
      localStorage.setItem(`sessions-${studentName}`, JSON.stringify(previousSessions));
      
      // Save as JSON blob for download with better filename
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
      
      console.log('[App] 💾 Transcript saved:', filename);
      console.log('[App] 📊 Session stats:', {
        sessionNumber: sessionNumber.current,
        duration: transcriptData.durationMinutes + ' minutes',
        points: transcriptData.totalPoints,
        blocks: transcriptData.systemBlocks,
        responses: transcriptData.studentResponses
      });
      
      // Log global stats for all students
      const globalStats = TranscriptManager.getGlobalStats();
      console.log('[App] 🌍 Global stats:', globalStats);
    };
    
    // Reset turn counter when card changes
    useEffect(() => {
      conversationTurns.current = 0;
      lastCardChange.current = Date.now();
      
      // Log card change to transcript
      if (currentCard) {
        addToTranscript('system', `Card changed to: ${currentCard.title}`);
      }
    }, [currentCard?.id]);

    // Handle tool calls from Pi
    const handleToolCall = (toolCall: any) => {
      console.log('[App] 🔧 Tool call received:', toolCall);
      
      const { functionCalls } = toolCall;
      if (!functionCalls || functionCalls.length === 0) return;
      
      // Process each function call and collect responses
      const toolResponses: any[] = [];
      
      functionCalls.forEach((call: any) => {
        const { id, name, args } = call;
        console.log(`[App] Executing tool: ${name}`, args);
        
        let response: any = {
          id: id,
          name: name,
        };
        
        switch (name) {
          case 'award_mastery_points': {
            const { cardId, points: pointsToAward, celebration } = args;
            
            // ENFORCEMENT 1: Check if enough conversation happened
            const timeSinceCardChange = Date.now() - lastCardChange.current;
            const minTurns = pointsToAward >= 100 ? 3 : 2; // Teaching milestones need 3+ turns
            
            if (conversationTurns.current < minTurns && timeSinceCardChange > 2000) {
              // BLOCK the tool call - not enough verification
              console.warn(`[App] ⛔ BLOCKED award_mastery_points - only ${conversationTurns.current} turns, need ${minTurns}`);
              const blockMsg = `[SYSTEM BLOCK] Cannot award points yet - you need to verify understanding first. You've only had ${conversationTurns.current} exchange(s) on this card. Ask a challenge question like "What makes you say that?" or "Can you explain that?" Then award points after they explain their reasoning.`;
              addToTranscript('system', blockMsg);
              response.response = blockMsg;
              break;
            }
            
            // ENFORCEMENT 2: Check last student response quality
            const lastStudentMsg = lastStudentResponses.current[lastStudentResponses.current.length - 1] || '';
            
            if (isMinimalResponse(lastStudentMsg)) {
              // BLOCK - minimal response detected
              console.warn(`[App] ⛔ BLOCKED award_mastery_points - minimal response: "${lastStudentMsg}"`);
              const blockMsg = `[SYSTEM BLOCK] Cannot award points for minimal response "${lastStudentMsg}". Ask them to elaborate: "I need to hear your thinking - what do you notice in this image?" or "Tell me more about that."`;
              addToTranscript('system', blockMsg);
              response.response = blockMsg;
              break;
            }
            
            if (isRepeatedResponse(lastStudentMsg)) {
              // BLOCK - repeated response detected
              console.warn(`[App] ⛔ BLOCKED award_mastery_points - repeated response: "${lastStudentMsg}"`);
              const blockMsg = `[SYSTEM BLOCK] Student keeps saying "${lastStudentMsg}" - this is repetition. Ask: "You've said that before. Can you explain it in a different way?" or "What else do you notice?"`;
              addToTranscript('system', blockMsg);
              response.response = blockMsg;
              break;
            }
            
            // All checks passed - award points
            console.log(`[App] 🌟 Awarding ${pointsToAward} points for ${cardId}: ${celebration}`);
            addToTranscript('system', `Awarded ${pointsToAward} points for ${cardId}: ${celebration}`);
            
            const result = awardPoints(pointsToAward, celebration);
            
            if (result.leveledUp && result.newLevel) {
              console.log(`[App] 🎉 LEVEL UP! ${result.newLevel.title}`);
              addToTranscript('system', `LEVEL UP to ${result.newLevel.title}!`);
              
              // Trigger level up animation
              setLevelUpData({
                level: result.newLevel.title,
                points: points + pointsToAward
              });
              setShowLevelUp(true);
              
              response.response = `Successfully awarded ${pointsToAward} points! LEVEL UP to ${result.newLevel.title}! Total points: ${points + pointsToAward}`;
            } else {
              response.response = `Successfully awarded ${pointsToAward} points. Total points: ${points + pointsToAward}`;
            }
            break;
          }
          
          case 'show_next_card': {
            // ENFORCEMENT: Only allow after points awarded OR 2+ failed attempts
            const timeSinceCardChange = Date.now() - lastCardChange.current;
            
            if (conversationTurns.current < 2 && timeSinceCardChange > 2000 && currentCard?.cardNumber !== 0) {
              // BLOCK - need to actually talk to student first
              console.warn(`[App] ⛔ BLOCKED show_next_card - only ${conversationTurns.current} turns`);
              const blockMsg = `[SYSTEM BLOCK] Cannot advance yet - you need to assess understanding first. Ask your starting question for this card, then listen to their response. Only advance after you've verified their understanding OR they've struggled for 2-3 attempts.`;
              addToTranscript('system', blockMsg);
              response.response = blockMsg;
              break;
            }
            
            console.log('[App] ➡️ Moving to next card...');
            nextCard();
            conversationTurns.current = 0; // Reset for new card
            
            // Get the new card immediately
            const { currentCard: newCard } = useSessionStore.getState();
            
            if (newCard) {
              console.log('[App] 📤 New card is:', newCard.title);
              addToTranscript('system', `Advanced to card: ${newCard.title}`);
              response.response = `Card changed to "${newCard.title}". Now ask your starting question for this card: "${newCard.piStartingQuestion}"`;
            } else {
              console.log('[App] 📤 Session complete - no more cards');
              addToTranscript('system', 'Session completed - all cards done');
              
              // Save transcript at end of session
              saveTranscript();
              
              response.response = `SESSION COMPLETE - You've gone through all 8 cards! Total points earned: ${points}. Final level: ${currentLevel.title}. Now wrap up the session: (1) Celebrate their achievement, (2) Briefly reinforce 1-2 key concepts they learned, (3) End warmly with encouragement in 3-4 sentences.`;
            }
            break;
          }
          
          default:
            console.warn(`[App] Unknown tool: ${name}`);
            response.response = `Error: Unknown tool "${name}". Only award_mastery_points and show_next_card are available.`;
        }
        
        toolResponses.push(response);
      });
      
      // Send tool responses back to Gemini
      if (toolResponses.length > 0) {
        console.log('[App] 📤 Sending tool responses back to Gemini:', toolResponses);
        try {
          client.sendToolResponse({
            functionResponses: toolResponses
          });
        } catch (error) {
          console.error('[App] Failed to send tool responses:', error);
        }
      }
    };
    
    // Track conversation turns for enforcement  
    const handleContent = useCallback((data: any) => {
      conversationTurns.current += 1;
      console.log(`[App] 💬 Turn ${conversationTurns.current} on ${currentCard?.title}`);
      
      // Add content to transcript
      if (data?.serverContent?.modelTurn?.parts) {
        // Pi speaking
        const text = data.serverContent.modelTurn.parts
          .filter((p: any) => p.text)
          .map((p: any) => p.text)
          .join(' ');
        if (text) {
          addToTranscript('pi', text);
        }
      }
      
      // Note: Student audio transcription will be added separately via inputTranscription events
    }, [currentCard]);
    
    // Track student transcriptions
    const handleInputTranscription = useCallback((text: string, isFinal: boolean) => {
      if (isFinal && text) {
        console.log(`[App] 🎤 Student said: "${text}"`);
        addToTranscript('student', text);
      }
    }, []);
    
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
  }, [client, awardPoints, nextCard, currentCard]);
  
  const handleNameSubmit = (name: string) => {
    setStudentName(name);
    setShowNamePrompt(false);
  };
  
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
        
        <div className="card-stack">
          <MasteryCard 
            card={currentCard}
            isCurrent={true}
          />
        </div>
        
        {/* Gemini Live Control Tray */}
        <ControlTray />
      </main>
      
      {/* Debug Panel for Eval Testing */}
      <DebugPanel messages={messages} onClear={clearMessages} />
      
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
