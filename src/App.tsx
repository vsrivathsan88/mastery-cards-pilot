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
import { useSessionStore } from './lib/state/session-store';
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
            name: 'check_mastery_understanding',
            description: 'REQUIRED BEFORE AWARDING POINTS: Analyze if student truly understands the concept. Use this to validate understanding depth before calling award_mastery_points. This prevents awarding points for guessing or minimal responses.',
            behavior: 'NON_BLOCKING',
            parameters: {
              type: 'object',
              properties: {
                studentResponse: {
                  type: 'string',
                  description: 'The student\'s most recent response to analyze'
                },
                cardId: {
                  type: 'string',
                  description: 'The ID of the current card being assessed'
                },
                milestoneType: {
                  type: 'string',
                  enum: ['basic', 'advanced', 'teaching'],
                  description: 'Which milestone level you\'re checking for'
                }
              },
              required: ['studentResponse', 'cardId', 'milestoneType']
            }
          },
          {
            name: 'should_advance_card',
            description: 'REQUIRED BEFORE CALLING show_next_card: Analyze if it\'s appropriate to move to the next card. Checks if student has mastered current concept or if they need more practice.',
            behavior: 'NON_BLOCKING',
            parameters: {
              type: 'object',
              properties: {
                cardId: {
                  type: 'string',
                  description: 'The ID of the current card'
                },
                reason: {
                  type: 'string',
                  enum: ['mastered', 'struggling', 'incomplete'],
                  description: 'Why you think it\'s time to advance'
                }
              },
              required: ['cardId', 'reason']
            }
          },
          {
            name: 'award_mastery_points',
            description: 'Award points ONLY AFTER check_mastery_understanding returns hasMastery: true. This will update the points on screen and check for level-ups.',
            behavior: 'NON_BLOCKING',
            parameters: {
              type: 'object',
              properties: {
                cardId: {
                  type: 'string',
                  description: 'The ID of the card for which points are being awarded'
                },
                points: {
                  type: 'number',
                  description: 'Number of points to award (must match the suggestedPoints from check_mastery_understanding)'
                },
                celebration: {
                  type: 'string',
                  description: 'A short phrase celebrating what they did well'
                }
              },
              required: ['cardId', 'points', 'celebration']
            }
          },
          {
            name: 'show_next_card',
            description: 'Advance to next card ONLY AFTER should_advance_card returns shouldAdvance: true. Moves to the next card in the session.',
            behavior: 'NON_BLOCKING',
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
    
    const toolResponses: any[] = [];
    
    functionCalls.forEach((call: any) => {
      const { id, name, args } = call;
      
      let response: any = { id, name };
      
      switch (name) {
        case 'check_mastery_understanding': {
          const { studentResponse, cardId, milestoneType } = args;
          
          console.log(`[App] 🔬 Analyzing mastery: "${studentResponse}" for ${cardId} (${milestoneType})`);
          
          // Get the card to check against criteria
          const card = currentCard;
          if (!card || card.id !== cardId) {
            response.response = {
              result: `Error: Card ${cardId} not found or not current card`
            };
            response.scheduling = 'SILENT';
            break;
          }
          
          // Get milestone criteria
          const milestone = milestoneType === 'teaching' 
            ? card.misconception?.teachingMilestone
            : card.milestones[milestoneType as 'basic' | 'advanced'];
            
          if (!milestone) {
            response.response = {
              result: `Error: No ${milestoneType} milestone found for this card`
            };
            response.scheduling = 'SILENT';
            break;
          }
          
          // Analyze the response
          const lowerResponse = studentResponse.toLowerCase();
          const keywords = milestone.evidenceKeywords.map(k => k.toLowerCase());
          
          // Check for red flags (minimal responses)
          const minimalPatterns = /^(yeah|yep|ok|okay|uh-huh|mm-hmm|sure|yes|no|maybe|idk|i guess)$/i;
          const isMinimal = minimalPatterns.test(studentResponse.trim());
          
          // Check for question marks (uncertainty)
          const hasUncertainty = studentResponse.includes('?') || /\b(maybe|i think|i guess|probably|kinda|sorta)\b/i.test(studentResponse);
          
          // Check keyword coverage
          const matchedKeywords = keywords.filter(keyword => lowerResponse.includes(keyword));
          const keywordCoverage = matchedKeywords.length / keywords.length;
          
          // Check response length (depth indicator)
          const wordCount = studentResponse.trim().split(/\s+/).length;
          const hasDepth = wordCount >= 4; // At least 4 words shows thought
          
          // Determine mastery
          let hasMastery = false;
          let confidence = 0;
          let depth: 'surface' | 'partial' | 'deep' = 'surface';
          let reasoning = '';
          let suggestedPoints = 0;
          
          if (isMinimal) {
            hasMastery = false;
            confidence = 0.1;
            depth = 'surface';
            reasoning = `Minimal response "${studentResponse}" - needs elaboration. Ask them to explain their thinking.`;
          } else if (hasUncertainty) {
            hasMastery = false;
            confidence = 0.3;
            depth = 'surface';
            reasoning = `Response shows uncertainty (questioning or hedging). Student needs to articulate with confidence.`;
          } else if (keywordCoverage < 0.3) {
            hasMastery = false;
            confidence = 0.4;
            depth = 'partial';
            reasoning = `Only ${Math.round(keywordCoverage * 100)}% keyword match with expected concepts. Missing key ideas: ${keywords.filter(k => !lowerResponse.includes(k)).join(', ')}`;
          } else if (keywordCoverage >= 0.5 && hasDepth) {
            hasMastery = true;
            confidence = 0.7 + (keywordCoverage * 0.2); // 0.7-0.9 range
            depth = wordCount >= 8 ? 'deep' : 'partial';
            reasoning = `Strong response with ${Math.round(keywordCoverage * 100)}% concept coverage and ${wordCount} words of explanation. Matched concepts: ${matchedKeywords.join(', ')}`;
            suggestedPoints = milestone.points;
          } else {
            hasMastery = false;
            confidence = 0.5 + (keywordCoverage * 0.2);
            depth = 'partial';
            reasoning = `Partial understanding detected (${Math.round(keywordCoverage * 100)}% coverage). Ask follow-up to verify depth.`;
          }
          
          // Additional checks based on conversation history
          const lastFewResponses = lastStudentResponses.current.slice(-3);
          const isRepeating = lastFewResponses.filter(r => r.toLowerCase() === lowerResponse).length > 1;
          
          if (isRepeating) {
            hasMastery = false;
            confidence = Math.min(confidence, 0.3);
            reasoning = `Student is repeating "${studentResponse}" - may be guessing or parroting. Ask different question.`;
          }
          
          // Check turn count
          const timeSinceCardChange = Date.now() - lastCardChange.current;
          const minTurns = milestoneType === 'teaching' ? 3 : 2;
          
          if (conversationTurns.current < minTurns && timeSinceCardChange > 2000) {
            hasMastery = false;
            confidence = Math.min(confidence, 0.4);
            reasoning = `Only ${conversationTurns.current} conversation turn(s) on this card. Need at least ${minTurns} turns to verify understanding. ${reasoning}`;
          }
          
          console.log(`[App] 📊 Assessment result: hasMastery=${hasMastery}, confidence=${confidence}, depth=${depth}`);
          
          response.response = {
            result: JSON.stringify({
              hasMastery,
              confidence,
              depth,
              reasoning,
              suggestedPoints,
              matchedConcepts: matchedKeywords,
              missingConcepts: keywords.filter(k => !lowerResponse.includes(k))
            })
          };
          response.scheduling = 'SILENT'; // Assessment feedback is internal
          
          // Also log to transcript for debugging
          addToTranscript('system', `[ASSESSMENT] ${milestoneType} for ${cardId}: ${hasMastery ? 'PASS' : 'NEEDS MORE'} (confidence: ${confidence.toFixed(2)}, depth: ${depth})`);
          break;
        }
        
        case 'should_advance_card': {
          const { cardId, reason } = args;
          
          console.log(`[App] 🔍 Checking if should advance from ${cardId}, reason: ${reason}`);
          
          if (!currentCard || currentCard.id !== cardId) {
            response.response = {
              result: `Error: Card ${cardId} is not the current card`
            };
            response.scheduling = 'SILENT';
            break;
          }
          
          const timeSinceCardChange = Date.now() - lastCardChange.current;
          let shouldAdvance = false;
          let feedback = '';
          
          if (reason === 'mastered') {
            // Check if they've had enough conversation
            if (conversationTurns.current < 2 && timeSinceCardChange > 2000 && currentCard.cardNumber !== 0) {
              shouldAdvance = false;
              feedback = `Cannot advance yet - only ${conversationTurns.current} turns on this card. Student needs more time to demonstrate mastery. Ask challenge questions to verify understanding.`;
            } else {
              shouldAdvance = true;
              feedback = `Good to advance - student has demonstrated understanding through ${conversationTurns.current} conversation turns.`;
            }
          } else if (reason === 'struggling') {
            // After 3-4 exchanges, it's okay to move on
            if (conversationTurns.current >= 3) {
              shouldAdvance = true;
              feedback = `Student has tried ${conversationTurns.current} times. Moving on is appropriate - they can revisit this concept later.`;
            } else {
              shouldAdvance = false;
              feedback = `Give student more attempts (currently ${conversationTurns.current} turns). Try rephrasing question or offering different perspective.`;
            }
          } else if (reason === 'incomplete') {
            shouldAdvance = false;
            feedback = `Student hasn't fully engaged with this card. Ask your starting question if you haven't yet, or try a follow-up question.`;
          }
          
          console.log(`[App] ⚖️ Decision: shouldAdvance=${shouldAdvance}`);
          
          response.response = {
            result: JSON.stringify({
              shouldAdvance,
              feedback,
              conversationTurns: conversationTurns.current,
              timeSinceCardChange: Math.round(timeSinceCardChange / 1000),
              currentCardId: currentCard.id
            })
          };
          response.scheduling = 'SILENT'; // Decision feedback is internal
          
          addToTranscript('system', `[ADVANCE CHECK] ${cardId}: ${shouldAdvance ? 'YES' : 'NOT YET'} - ${feedback}`);
          break;
        }
        
        case 'award_mastery_points': {
          const { cardId, points: pointsToAward, celebration } = args;
          
          const timeSinceCardChange = Date.now() - lastCardChange.current;
          const minTurns = pointsToAward >= 100 ? 3 : 2;
          
          if (conversationTurns.current < minTurns && timeSinceCardChange > 2000) {
            console.warn(`[App] ⛔ BLOCKED award_mastery_points - only ${conversationTurns.current} turns, need ${minTurns}`);
            const blockMsg = `[SYSTEM BLOCK] Cannot award points yet - you need to verify understanding first. You've only had ${conversationTurns.current} exchange(s) on this card. Ask a challenge question like "What makes you say that?" or "Can you explain that?" Then award points after they explain their reasoning.`;
            addToTranscript('system', blockMsg);
            response.response = { result: blockMsg };
            response.scheduling = 'SILENT';  // Don't announce blocks, just adjust behavior
            break;
          }
          
          const lastStudentMsg = lastStudentResponses.current[lastStudentResponses.current.length - 1] || '';
          
          if (isMinimalResponse(lastStudentMsg)) {
            console.warn(`[App] ⛔ BLOCKED award_mastery_points - minimal response: "${lastStudentMsg}"`);
            const blockMsg = `[SYSTEM BLOCK] Cannot award points for minimal response "${lastStudentMsg}". Ask them to elaborate: "I need to hear your thinking - what do you notice in this image?" or "Tell me more about that."`;
            addToTranscript('system', blockMsg);
            response.response = { result: blockMsg };
            response.scheduling = 'SILENT';  // Don't announce blocks
            break;
          }
          
          if (isRepeatedResponse(lastStudentMsg)) {
            console.warn(`[App] ⛔ BLOCKED award_mastery_points - repeated response: "${lastStudentMsg}"`);
            const blockMsg = `[SYSTEM BLOCK] Student keeps saying "${lastStudentMsg}" - this is repetition. Ask: "You've said that before. Can you explain it in a different way?" or "What else do you notice?"`;
            addToTranscript('system', blockMsg);
            response.response = { result: blockMsg };
            response.scheduling = 'SILENT';  // Don't announce blocks
            break;
          }
          
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
            response.scheduling = 'INTERRUPT';  // Interrupt to announce level-up immediately!
          } else {
            response.response = { 
              result: `Successfully awarded ${pointsToAward} points. Total: ${points + pointsToAward}`
            };
            response.scheduling = 'WHEN_IDLE';  // Don't interrupt, wait until Pi finishes current thought
          }
          break;
        }
        
        case 'show_next_card': {
          const timeSinceCardChange = Date.now() - lastCardChange.current;
          
          if (conversationTurns.current < 2 && timeSinceCardChange > 2000 && currentCard?.cardNumber !== 0) {
            console.warn(`[App] ⛔ BLOCKED show_next_card - only ${conversationTurns.current} turns`);
            const blockMsg = `[SYSTEM BLOCK] Cannot advance yet - you need to assess understanding first. Ask your starting question for this card, then listen to their response. Only advance after you've verified their understanding OR they've struggled for 2-3 attempts.`;
            addToTranscript('system', blockMsg);
            response.response = { result: blockMsg };
            response.scheduling = 'SILENT';  // Don't announce blocks
            break;
          }
          
          nextCard();
          conversationTurns.current = 0;
          lastCardChange.current = Date.now();
          
          const { currentCard: newCard } = useSessionStore.getState();
          
          if (newCard) {
            addToTranscript('system', `Advanced to card: ${newCard.title}`);
            response.response = { 
              result: `Card changed to "${newCard.title}". Now ask: "${newCard.piStartingQuestion}"`
            };
            response.scheduling = 'WHEN_IDLE';  // Wait to finish current thought before moving to next card
          } else {
            addToTranscript('system', 'Session completed - all cards done');
            saveTranscript();
            response.response = { 
              result: `SESSION COMPLETE! All 8 cards done. Total: ${points} points. Level: ${currentLevel.title}. Now wrap up warmly.`
            };
            response.scheduling = 'INTERRUPT';  // Interrupt to announce completion
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
    
    if (toolResponses.length > 0) {
      try {
        client.sendToolResponse({ functionResponses: toolResponses });
      } catch (error) {
        console.error('[App] Failed to send tool responses:', error);
      }
    }
  }, [client, awardPoints, nextCard, currentCard, points, currentLevel, addToTranscript, isMinimalResponse, isRepeatedResponse, saveTranscript]);

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
        
        {/* Current Card */}
        <div className="active-card">
          <MasteryCard
            card={currentCard}
            isCurrent={true}
          />
        </div>
        
        {/* Gemini Live Control Tray */}
        <ControlTray />
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
