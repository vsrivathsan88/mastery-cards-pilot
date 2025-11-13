/**
 * SpeechIndicator - Visual indicator for voice activity
 * Shows when student is speaking or when listening
 */

import './SpeechIndicator.css';

interface SpeechIndicatorProps {
  isListening: boolean;
  isSpeaking: boolean;
}

export function SpeechIndicator({ isListening, isSpeaking }: SpeechIndicatorProps) {
  if (!isListening && !isSpeaking) return null;

  return (
    <div className="speech-indicator">
      <div className={`mic-icon ${isSpeaking ? 'speaking' : 'listening'}`}>
        🎤
      </div>
      <div className="speech-status">
        {isSpeaking ? 'Listening to you...' : 'Ready to listen'}
      </div>
      {isSpeaking && (
        <div className="speech-waves">
          <span className="wave"></span>
          <span className="wave"></span>
          <span className="wave"></span>
        </div>
      )}
    </div>
  );
}
