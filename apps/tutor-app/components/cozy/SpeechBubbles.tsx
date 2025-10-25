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

export function SpeechBubbles({ 
  piMessage, 
  studentMessage, 
  piSpeaking,
  studentSpeaking 
}: SpeechBubblesProps) {
  const [showPi, setShowPi] = useState(false);
  const [showStudent, setShowStudent] = useState(false);

  // Show Pi's bubble when new message arrives
  useEffect(() => {
    if (piMessage) {
      setShowPi(true);
      // Auto-fade after 10 seconds
      const timer = setTimeout(() => setShowPi(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [piMessage]);

  // Show student's bubble when new message arrives
  useEffect(() => {
    if (studentMessage) {
      setShowStudent(true);
      // Auto-fade after 10 seconds
      const timer = setTimeout(() => setShowStudent(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [studentMessage]);

  if (!showPi && !showStudent) return null;

  return (
    <div className="speech-bubbles-container">
      {/* Pi's bubble (left side) */}
      {showPi && piMessage && (
        <div 
          className={`speech-bubble pi-bubble ${piSpeaking ? 'speaking' : ''}`}
          onClick={() => setShowPi(false)}
        >
          <div className="bubble-avatar">🤖</div>
          <div className="bubble-content">
            <div className="bubble-name">Pi</div>
            <div className="bubble-text">{piMessage}</div>
          </div>
        </div>
      )}

      {/* Student's bubble (right side) */}
      {showStudent && studentMessage && (
        <div 
          className={`speech-bubble student-bubble ${studentSpeaking ? 'speaking' : ''}`}
          onClick={() => setShowStudent(false)}
        >
          <div className="bubble-content">
            <div className="bubble-name">You</div>
            <div className="bubble-text">{studentMessage}</div>
          </div>
          <div className="bubble-avatar">👤</div>
        </div>
      )}
    </div>
  );
}
