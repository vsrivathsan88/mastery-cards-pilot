/**
 * SpeechBubbles - Shows last conversation exchange
 * Minimal, auto-fading speech bubbles for Pi and Student
 */

import { useEffect, useState } from 'react';
import './SpeechBubbles.css';

interface SpeechBubblesProps {
  piMessage: string;
  studentMessage: string;
  piSpeaking: boolean;
  studentSpeaking: boolean;
}

// Filter out thinking/reasoning content from messages
const filterThinkingContent = (text: string): string => {
  if (!text) return text;
  
  let filtered = text;
  
  // Remove explicit thinking tags
  filtered = filtered.replace(/<think>.*?<\/think>/gis, ' ');
  filtered = filtered.replace(/:::thinking:::.*?:::/gis, ' ');
  filtered = filtered.replace(/\[THINKING\].*?\[\/THINKING\]/gis, ' ');
  
  // Remove meta-commentary about crafting responses
  filtered = filtered.replace(/\*\*[^*]+\*\*\s*(?:I've|I'm|The|This|Now|Let me).{0,500}?(?=(?:[.!?]\s+(?:[A-Z]|$))|$)/gis, ' ');
  
  // Remove specific thinking patterns
  filtered = filtered.replace(/(?:^|\.\s+)(?:I've acknowledged|I'm now|I've crafted|The plan is|I can hear you|I should|I need to|I'll|Let me think|First,? I|The strategy|My approach).{0,300}?(?=[.!?](?:\s|$)|$)/gis, ' ');
  
  // Remove parenthetical thinking
  filtered = filtered.replace(/\([^)]*(?:strategy|approach|thinking|reasoning|plan|internally)[^)]*\)/gi, ' ');
  
  // Remove "Okay" or "Alright" sentence fragments that are thinking artifacts
  filtered = filtered.replace(/^(?:Okay|Alright|Right|Got it)[.,!]\s*/i, '');
  
  // Clean up whitespace
  filtered = filtered.replace(/\s+/g, ' ').trim();
  
  // If we filtered out everything, return empty
  if (!filtered || filtered.length < 3) return '';
  
  return filtered;
};

export function SpeechBubbles({ 
  piMessage, 
  studentMessage, 
  piSpeaking,
  studentSpeaking 
}: SpeechBubblesProps) {
  const [showPi, setShowPi] = useState(false);
  const [showStudent, setShowStudent] = useState(false);

  // Filter messages to remove thinking content
  const filteredPiMessage = filterThinkingContent(piMessage);
  const filteredStudentMessage = filterThinkingContent(studentMessage);

  // Show Pi's bubble when new message arrives
  useEffect(() => {
    if (filteredPiMessage) {
      setShowPi(true);
      // Auto-fade after 10 seconds
      const timer = setTimeout(() => setShowPi(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [filteredPiMessage]);

  // Show student's bubble when new message arrives
  useEffect(() => {
    if (filteredStudentMessage) {
      setShowStudent(true);
      // Auto-fade after 10 seconds
      const timer = setTimeout(() => setShowStudent(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [filteredStudentMessage]);

  if (!showPi && !showStudent) return null;

  return (
    <div className="speech-bubbles-container">
      {/* Pi's bubble (left side) */}
      {showPi && filteredPiMessage && (
        <div 
          className={`speech-bubble pi-bubble ${piSpeaking ? 'speaking' : ''}`}
          onClick={() => setShowPi(false)}
        >
          <div className="bubble-avatar">🤖</div>
          <div className="bubble-content">
            <div className="bubble-name">Pi</div>
            <div className="bubble-text">{filteredPiMessage}</div>
          </div>
        </div>
      )}

      {/* Student's bubble (right side) */}
      {showStudent && filteredStudentMessage && (
        <div 
          className={`speech-bubble student-bubble ${studentSpeaking ? 'speaking' : ''}`}
          onClick={() => setShowStudent(false)}
        >
          <div className="bubble-content">
            <div className="bubble-name">You</div>
            <div className="bubble-text">{filteredStudentMessage}</div>
          </div>
          <div className="bubble-avatar">👤</div>
        </div>
      )}
    </div>
  );
}
