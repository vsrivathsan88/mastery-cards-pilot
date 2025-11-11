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
import { CardStateMachine, CardState } from './lib/state/card-state-machine';
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
  
  // State machine for explicit card assessment flow
  const cardStateMachine = useRef<CardStateMachine>(new CardStateMachine());
  
  // PHASE 1 ROBUSTNESS: Tool call history for idempotency
  const toolCallHistory = useRef<Map<string, {
    cardId: string;
    callId: string;
    timestamp: number;
    processed: boolean;
  }>>(new Map());
  
  // PHASE 1 ROBUSTNESS: Turn-based locking
  const toolCallInProgress = useRef<boolean>(false);
  
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
    
    // PHASE 1: Turn-based locking - prevent parallel tool processing
    if (toolCallInProgress.current) {
      console.warn('[Lock] ⚠️ Tool call already in progress, blocking this batch');
      return;
    }
    
    toolCallInProgress.current = true;
    
    try {
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
          
          // PHASE 1: Idempotency check - prevent double awards
          const callId = `award-${cardId}-${pointsToAward}-${celebration}`;
          
          if (toolCallHistory.current.has(callId)) {
            console.warn('[Idempotency] ⚠️ Points already awarded for this card:', callId);
            response.response = {
              result: `Points already awarded for ${cardId}. No duplicate award.`
            };
            break;
          }
          
          // Check if state machine allows this
          const currentState = cardStateMachine.current.getCurrentState();
          if (!currentState.canCallTools) {
            console.warn('[App] ⚠️ award_mastery_points blocked: State machine not ready', currentState);
            response.response = {
              result: `ERROR: Cannot award points yet. You are in state ${currentState.state}. ${currentState.transitionReason}. Complete the assessment flow first.`
            };
            break;
          }
          
          console.log(`[App] ✨ Awarding ${pointsToAward} points for ${cardId}`);
          addToTranscript('system', `Awarded ${pointsToAward} points for ${cardId}: ${celebration}`);
          
          // Mark as processed BEFORE awarding (prevent race conditions)
          toolCallHistory.current.set(callId, {
            cardId,
            callId,
            timestamp: Date.now(),
            processed: true
          });
          
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
          
          // Check if state machine allows this
          const currentState = cardStateMachine.current.getCurrentState();
          if (!currentState.canCallTools) {
            console.warn('[App] ⚠️ show_next_card blocked: State machine not ready', currentState);
            response.response = {
              result: `ERROR: Cannot advance yet. You are in state ${currentState.state}. ${currentState.transitionReason}`
            };
            break;
          }
          
          nextCard();
          conversationTurns.current = 0;
          lastCardChange.current = Date.now();
          
          // Reset state machine for new card
          cardStateMachine.current.reset();
          
          const { currentCard: newCard } = useSessionStore.getState();
          
          // Special case: Welcome card (card 0) can advance immediately
          if (newCard?.cardNumber === 0) {
            cardStateMachine.current.masteryAchieved();
            console.log('[App] ℹ️ Welcome card - auto-advanced to READY_TO_ADVANCE');
          }
          
          if (newCard) {
            addToTranscript('system', `Advanced to card: ${newCard.title}`);
            
            // Get state context
            const stateContext = cardStateMachine.current.getStateContext();
            
            // Send new card info WITH state machine context
            const cardContext = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 NEW CARD: ${newCard.title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${stateContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📸 CARD DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**WHAT YOU SEE:**
${newCard.imageDescription}

**WHAT YOU'RE ASSESSING (Learning Goal):**
${newCard.learningGoal}

**YOUR STARTING QUESTION:**
"${newCard.piStartingQuestion}"

**MASTERY CRITERIA:**

Basic Understanding (${newCard.milestones.basic.points} pts):
${newCard.milestones.basic.description}
Evidence signals: ${newCard.milestones.basic.evidenceKeywords.join(', ')}
${newCard.milestones.advanced ? `
Advanced Understanding (${newCard.milestones.advanced.points} pts BONUS):
${newCard.milestones.advanced.description}
Evidence signals: ${newCard.milestones.advanced.evidenceKeywords.join(', ')}
` : ''}
${newCard.misconception ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ MISCONCEPTION CARD - SPECIAL ROLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**You present this WRONG thinking:**
"${newCard.misconception.piWrongThinking}"

**Student should teach you:**
${newCard.misconception.correctConcept}

**Teaching Mastery (${newCard.misconception.teachingMilestone.points} pts):**
${newCard.misconception.teachingMilestone.description}

You are GENUINELY CONFUSED until they explain why you're wrong.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 FOLLOW THE STATE MACHINE - Current state is CARD_START
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
            
            // Send as context update mid-conversation
            try {
              client.send([{ text: cardContext }]);
              console.log('[App] ✅ Card context with state machine sent successfully');
            } catch (error) {
              console.error('[App] ❌ Failed to send card context:', error);
              // Continue anyway - Pi might still function
            }
            
            response.response = { 
              result: `Card changed successfully. State reset to CARD_START. Ask your starting question now.`
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
    
    // PHASE 1: Cleanup old tool call history (older than 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    for (const [id, entry] of toolCallHistory.current.entries()) {
      if (entry.timestamp < fiveMinutesAgo) {
        toolCallHistory.current.delete(id);
      }
    }
    
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
    } finally {
      // PHASE 1: Always unlock, even if error
      setTimeout(() => {
        toolCallInProgress.current = false;
        console.log('[Lock] 🔓 Tool processing unlocked');
      }, 1000);
    }
  }, [client, awardPoints, nextCard, currentCard, points, currentLevel, addToTranscript, saveTranscript]);

  // PHASE 1: Send state update to Pi
  const sendStateUpdate = useCallback(() => {
    const stateContext = cardStateMachine.current.getStateContext();
    
    const stateMessage = `
╔═══════════════════════════════════════════════════════════════╗
║  🚦 STATE UPDATE (Automatic)
╚═══════════════════════════════════════════════════════════════╝

${stateContext}

**This is an automatic state update based on the conversation so far.**
Follow the guidance above for your next action.
`;
    
    try {
      client.send([{ text: stateMessage }]);
      console.log('[Auto] State update sent to Pi');
    } catch (error) {
      console.error('[Auto] Failed to send state update:', error);
    }
  }, [client]);

  // PHASE 1: Automatic state transitions based on conversation
  const handleConversationTurn = useCallback((role: 'pi' | 'student', text: string) => {
    const state = cardStateMachine.current.getCurrentState();
    
    console.log(`[Auto] Conversation turn: ${role} said "${text.substring(0, 50)}..." (State: ${state.state})`);
    
    if (role === 'pi') {
      const lowerText = text.toLowerCase();
      
      // Detect Pi asking a question
      if (lowerText.includes('?')) {
        if (state.state === CardState.CARD_START && !state.hasAskedStartingQuestion) {
          // Pi asked starting question
          cardStateMachine.current.startedObserving();
          console.log('[Auto] Detected starting question → OBSERVING');
        } else if (state.state === CardState.PROBING && !state.hasProbed) {
          // Pi asked follow-up
          const currentData = cardStateMachine.current.getCurrentState();
          cardStateMachine.current['stateData'] = {
            ...currentData,
            hasProbed: true
          };
          console.log('[Auto] Detected follow-up question → Still PROBING (waiting for answer)');
        } else if (state.state === CardState.FINAL_CHECK) {
          console.log('[Auto] Pi asking final check question');
        }
      }
    } else if (role === 'student') {
      // Detect student response and advance state
      if (state.state === CardState.OBSERVING) {
        // Student answered Q1
        cardStateMachine.current.receivedObservation(text);
        console.log('[Auto] Student answered Q1 → PROBING');
        
        // Send state update
        setTimeout(() => sendStateUpdate(), 500);
        
      } else if (state.state === CardState.PROBING && state.hasProbed) {
        // Student answered Q2
        cardStateMachine.current.receivedExplanation(text);
        console.log('[Auto] Student answered Q2 → JUDGING');
        
        // Send state update
        setTimeout(() => sendStateUpdate(), 500);
        
      } else if (state.state === CardState.FINAL_CHECK) {
        // Student answered final check
        cardStateMachine.current.receivedFinalAnswer(text);
        console.log('[Auto] Student answered final check → JUDGING (for decision)');
        
        // Send state update
        setTimeout(() => sendStateUpdate(), 500);
      }
    }
  }, [sendStateUpdate]);

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
        
        // PHASE 1: Auto-detect Pi's turn
        handleConversationTurn('pi', text);
      }
    }
    
    // Also track student responses (from input audio transcription)
    if (data?.serverContent?.turnComplete && data?.clientContent?.turns) {
      const studentTurns = data.clientContent.turns
        .filter((turn: any) => turn.role === 'user')
        .map((turn: any) => turn.parts?.map((p: any) => p.text).join(' '))
        .filter(Boolean);
      
      if (studentTurns.length > 0) {
        const studentText = studentTurns[studentTurns.length - 1];
        
        // PHASE 1: Auto-detect student's turn
        handleConversationTurn('student', studentText);
        
        // Store for reference
        lastStudentResponses.current.push(studentText);
        if (lastStudentResponses.current.length > 5) {
          lastStudentResponses.current.shift();
        }
      }
    }
  }, [addToTranscript, handleConversationTurn]);
  
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
        
        // Special case: Welcome card should be ready to advance immediately
        if (currentCard.cardNumber === 0) {
          cardStateMachine.current.masteryAchieved();
          console.log('[App] ℹ️ Welcome card - auto-advanced to READY_TO_ADVANCE');
        }
        
        // Get state context
        const stateContext = cardStateMachine.current.getStateContext();
        
        const cardContext = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 INITIAL CARD: ${currentCard.title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${stateContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📸 CARD DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**WHAT YOU SEE:**
${currentCard.imageDescription}

**WHAT YOU'RE ASSESSING:**
${currentCard.learningGoal}

**YOUR STARTING QUESTION:**
"${currentCard.piStartingQuestion}"

**MASTERY CRITERIA:**

Basic (${currentCard.milestones.basic.points} pts): ${currentCard.milestones.basic.description}
Evidence signals: ${currentCard.milestones.basic.evidenceKeywords.join(', ')}
${currentCard.milestones.advanced ? `
Advanced (${currentCard.milestones.advanced.points} pts BONUS): ${currentCard.milestones.advanced.description}
Evidence signals: ${currentCard.milestones.advanced.evidenceKeywords.join(', ')}
` : ''}
${currentCard.cardNumber === 0 ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 WELCOME CARD - SPECIAL INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are in READY_TO_ADVANCE state.
Greet the student warmly and immediately call show_next_card() to start.
` : ''}
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
