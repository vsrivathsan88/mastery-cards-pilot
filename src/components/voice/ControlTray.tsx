/**
 * Gemini Live Control Tray
 * Clean control panel for voice sessions
 */

import { useState, useEffect, useRef } from 'react';
import { useLiveAPIContext } from '../../contexts/LiveAPIContext';
import './ControlTray.css';

export function ControlTray() {
  const { connected, connect, disconnect } = useLiveAPIContext();
  const [muted, setMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const connectButtonRef = useRef<HTMLButtonElement>(null);

  // Focus connect button when disconnected
  useEffect(() => {
    if (!connected && connectButtonRef.current) {
      connectButtonRef.current.focus();
    }
  }, [connected]);

  // Reset state when connection changes
  useEffect(() => {
    if (connected) {
      // Connection succeeded
      setIsConnecting(false);
    } else {
      // Disconnected
      setMuted(false);
      setIsConnecting(false);
    }
  }, [connected]);

  const handleConnectToggle = async () => {
    if (connected) {
      disconnect();
      setIsConnecting(false);
    } else {
      if (isConnecting) {
        console.log('[ControlTray] Already connecting, ignoring click');
        return;
      }
      
      setIsConnecting(true);
      try {
        console.log('[ControlTray] Button clicked - calling connect()...');
        await connect();
        console.log('[ControlTray] ✅ Connect completed');
        // Don't set isConnecting false here - let 'open' event handle it
      } catch (error) {
        console.error('[ControlTray] ❌ Connection failed:', error);
        alert(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsConnecting(false);
      }
    }
  };

  const handleMuteToggle = () => {
    if (connected) {
      setMuted(!muted);
    }
  };

  return (
    <div className={`control-tray ${connected ? 'connected' : ''}`}>
      {/* Connection Status */}
      <div className="control-status">
        <div className={`status-indicator ${connected ? 'active' : ''}`} />
        <span className="status-text">
          {connected ? 'Connected to Pi' : 'Not Connected'}
        </span>
      </div>

      {/* Controls */}
      <div className="control-buttons">
        {/* Mic Mute/Unmute (only when connected) */}
        {connected && (
          <button
            className={`control-button mic-button ${muted ? 'muted' : ''}`}
            onClick={handleMuteToggle}
            title={muted ? 'Unmute microphone' : 'Mute microphone'}
          >
            <span className="button-icon">
              {muted ? '🔇' : '🎤'}
            </span>
            <span className="button-label">
              {muted ? 'Unmuted' : 'Mute'}
            </span>
          </button>
        )}

        {/* Start/Stop Session */}
        <button
          ref={connectButtonRef}
          className={`control-button connect-button ${connected ? 'active' : ''} ${isConnecting ? 'loading' : ''}`}
          onClick={handleConnectToggle}
          disabled={isConnecting}
          title={connected ? 'Stop voice session' : 'Start voice session with Pi'}
        >
          <span className="button-icon">
            {isConnecting ? '⏳' : connected ? '⏸️' : '▶️'}
          </span>
          <span className="button-label">
            {isConnecting ? 'Connecting...' : connected ? 'Stop Session' : 'Start Voice Session'}
          </span>
        </button>
      </div>
    </div>
  );
}
