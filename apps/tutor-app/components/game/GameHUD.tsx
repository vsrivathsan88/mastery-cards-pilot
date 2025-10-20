import { memo, useEffect, useRef, useState } from 'react';
import { AudioRecorder } from '../../lib/audio-recorder';
import { useSettings, useTools, useLogStore } from '@/lib/state';
import { useLiveAPIContext } from '../../contexts/LiveAPIContext';
import { useUI } from '@/lib/state';

interface GameHUDProps {
  showExportButton?: boolean;
  showResetButton?: boolean;
}

function GameHUD({ showExportButton = true, showResetButton = true }: GameHUDProps) {
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [muted, setMuted] = useState(false);
  const connectButtonRef = useRef<HTMLButtonElement>(null);
  const { toggleSidebar } = useUI();

  const { client, connected, connect, disconnect } = useLiveAPIContext();

  useEffect(() => {
    if (!connected && connectButtonRef.current) {
      connectButtonRef.current.focus();
    }
  }, [connected]);

  useEffect(() => {
    if (!connected) {
      setMuted(false);
    }
  }, [connected]);

  useEffect(() => {
    const onData = (base64: string) => {
      client.sendRealtimeInput([
        {
          mimeType: 'audio/pcm;rate=16000',
          data: base64,
        },
      ]);
    };
    if (connected && !muted && audioRecorder) {
      audioRecorder.on('data', onData);
      audioRecorder.start();
    } else {
      audioRecorder.stop();
    }
    return () => {
      audioRecorder.off('data', onData);
    };
  }, [connected, client, muted, audioRecorder]);

  const handleMicClick = () => {
    if (connected) {
      setMuted(!muted);
    } else {
      connect();
    }
  };

  const handleExportLogs = () => {
    const { systemPrompt, model } = useSettings.getState();
    const { tools } = useTools.getState();
    const { turns } = useLogStore.getState();

    const logData = {
      configuration: {
        model,
        systemPrompt,
      },
      tools,
      conversation: turns.map(turn => ({
        ...turn,
        timestamp: turn.timestamp.toISOString(),
      })),
    };

    const jsonString = JSON.stringify(logData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.href = url;
    a.download = `live-api-logs-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const micButtonTitle = connected
    ? muted
      ? 'Unmute microphone'
      : 'Mute microphone'
    : 'Connect and start microphone';

  const connectButtonTitle = connected ? 'Disconnect' : 'Connect';

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 100,
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
      padding: '16px 32px',
      borderRadius: '20px'
    }}
    className="glass-panel-strong"
    >
      {/* Mic Button */}
      <button
        onClick={handleMicClick}
        title={micButtonTitle}
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          transition: 'all 0.3s ease',
          background: muted 
            ? 'rgba(239, 68, 68, 0.3)' 
            : 'rgba(16, 185, 129, 0.3)',
          backdropFilter: 'blur(20px)',
          border: `3px solid ${muted ? 'rgba(239, 68, 68, 0.6)' : 'rgba(16, 185, 129, 0.6)'}`,
          boxShadow: muted
            ? '0 8px 32px rgba(239, 68, 68, 0.4)'
            : '0 8px 32px rgba(16, 185, 129, 0.4)',
        }}
        className={!muted && connected ? 'pulse-animation' : ''}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {!muted ? '🎤' : '🔇'}
      </button>

      {/* Divider */}
      <div style={{
        width: '2px',
        height: '48px',
        background: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '2px'
      }} />

      {/* Connect/Disconnect Button */}
      <button
        ref={connectButtonRef}
        onClick={connected ? disconnect : connect}
        title={connectButtonTitle}
        className={connected ? 'game-button-success' : 'game-button-primary'}
        style={{
          minWidth: '180px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          fontSize: '18px',
          fontWeight: '700',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}
      >
        <span style={{ fontSize: '24px' }}>
          {connected ? '⏸' : '▶'}
        </span>
        {connected ? 'Connected' : 'Connect'}
      </button>

      {/* Divider */}
      <div style={{
        width: '2px',
        height: '48px',
        background: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '2px'
      }} />

      {/* Utility Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {showResetButton && (
          <button
            onClick={useLogStore.getState().clearTurns}
            title="Reset session"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '24px',
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(15px)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            🔄
          </button>
        )}
        
        {showExportButton && (
          <button
            onClick={handleExportLogs}
            title="Export session logs"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '24px',
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(15px)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            💾
          </button>
        )}

        {/* Settings Button */}
        <button
          onClick={toggleSidebar}
          title="Open settings"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '24px',
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          ⚙️
        </button>
      </div>
    </div>
  );
}

export default memo(GameHUD);
