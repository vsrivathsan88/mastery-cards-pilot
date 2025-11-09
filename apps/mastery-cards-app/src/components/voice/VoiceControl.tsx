/**
 * Voice Control Component
 * Start/stop voice session with Pi
 */

import { useState } from 'react';
import { useLiveAPIContext } from '../../contexts/LiveAPIContext';
import './VoiceControl.css';

export function VoiceControl() {
  const { connected, connect, disconnect } = useLiveAPIContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (connected) {
      disconnect();
    } else {
      setIsLoading(true);
      try {
        await connect();
      } catch (error) {
        console.error('Failed to connect:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="voice-control">
      <button
        className={`voice-button ${connected ? 'connected' : ''} ${isLoading ? 'loading' : ''}`}
        onClick={handleToggle}
        disabled={isLoading}
      >
        <span className="voice-icon">{connected ? '🎤' : '🔴'}</span>
        <span className="voice-label">
          {isLoading ? 'Connecting...' : connected ? 'Stop Voice' : 'Start Voice Session'}
        </span>
      </button>
      
      {connected && (
        <div className="voice-status">
          <div className="pulse-indicator" />
          <span className="status-text">Pi is listening...</span>
        </div>
      )}
    </div>
  );
}
