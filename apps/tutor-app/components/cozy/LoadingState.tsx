/**
 * LoadingState - Contextual loading indicators
 * Shows what's happening instead of generic spinners
 */

import './LoadingState.css';

interface LoadingStateProps {
  type: 'thinking' | 'analyzing' | 'connecting' | 'loading';
  message?: string;
}

const LOADING_MESSAGES = {
  thinking: {
    icon: '🤔',
    text: 'Pi is thinking...',
  },
  analyzing: {
    icon: '🔍',
    text: 'Analyzing your work...',
  },
  connecting: {
    icon: '🔗',
    text: 'Connecting to Pi...',
  },
  loading: {
    icon: '⏳',
    text: 'Loading...',
  },
};

export function LoadingState({ type, message }: LoadingStateProps) {
  const config = LOADING_MESSAGES[type];
  const displayMessage = message || config.text;

  return (
    <div className="loading-state">
      <div className="loading-icon">{config.icon}</div>
      <div className="loading-text">{displayMessage}</div>
      <div className="loading-dots">
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="dot"></span>
      </div>
    </div>
  );
}
