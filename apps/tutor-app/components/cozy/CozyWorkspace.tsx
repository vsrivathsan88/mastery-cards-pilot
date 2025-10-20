import { ReactNode, useEffect, useState } from 'react';
import { PiPresence } from './PiPresence';
import { TwinklingStars } from './TwinklingStars';
import { Fireflies } from './Fireflies';
import { ConstellationProgress } from './ConstellationProgress';

interface CozyWorkspaceProps {
  // Progress for constellation
  totalMilestones?: number;
  completedMilestones?: number;
  // Audio states
  isConnected: boolean;
  piSpeaking: boolean;
  studentSpeaking: boolean;
  piLastMessage?: string;
  studentLastMessage?: string;
  
  // Content
  lessonImage: ReactNode;
  canvas: ReactNode;
  
  // Control handlers
  onConnect: () => void;
  onDisconnect: () => void;
  onMuteToggle: () => void;
  onHelp: () => void;
  onExport: () => void;
  onReset: () => void;
  isMuted: boolean;
}

// Ambient sparkles that float around
function AmbientSparkles() {
  const [sparkles, setSparkles] = useState<Array<{ id: number; left: number; top: number; delay: number }>>([]);

  useEffect(() => {
    // Create 5 sparkles at random positions
    const newSparkles = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 4,
    }));
    setSparkles(newSparkles);
  }, []);

  return (
    <>
      {sparkles.map(sparkle => (
        <div
          key={sparkle.id}
          className="cozy-sparkle"
          style={{
            left: `${sparkle.left}%`,
            top: `${sparkle.top}%`,
            animationDelay: `${sparkle.delay}s`,
          }}
        >
          ✨
        </div>
      ))}
    </>
  );
}

export function CozyWorkspace({
  isConnected,
  piSpeaking,
  studentSpeaking,
  piLastMessage,
  studentLastMessage,
  lessonImage,
  canvas,
  onConnect,
  onDisconnect,
  onMuteToggle,
  onHelp,
  onExport,
  onReset,
  isMuted,
  totalMilestones = 0,
  completedMilestones = 0,
}: CozyWorkspaceProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%', // Fill available space (already has padding from layout)
      width: '100%',
      overflow: 'hidden',
      position: 'relative',
    }}
    className="cozy-text"
    >
      {/* Midnight treehouse ambience */}
      <TwinklingStars />
      <Fireflies />
      <ConstellationProgress 
        totalMilestones={totalMilestones} 
        completedMilestones={completedMilestones} 
      />

      {/* TOP 80%: WORKSPACE - Image + Canvas on Desk */}
      <div className="cozy-desk-surface" style={{
        flex: '0 0 80%',
        display: 'grid',
        gridTemplateColumns: '45% 55%',
        gap: '24px',
        padding: '32px 32px 24px 32px',
        overflow: 'hidden',
      }}>
        {/* Image - "The Problem" */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          gap: '16px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '0 8px',
          }}>
            <span style={{ fontSize: '28px' }}>🔍</span>
            <div>
              <div className="cozy-text-heading" style={{ fontSize: '20px', marginBottom: '2px', color: 'var(--text-warm)' }}>
                Today's Mystery
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                Let's figure this out together
              </div>
            </div>
          </div>
          <div className="cozy-paper-panel" style={{
            flex: 1,
            padding: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'auto',
            position: 'relative',
          }}>
            {/* Decorative paper clip */}
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              fontSize: '32px',
              opacity: 0.2,
              transform: 'rotate(15deg)',
              filter: 'grayscale(0.5)',
            }}>
              📎
            </div>
            {lessonImage}
          </div>
        </div>

        {/* Canvas - "Your Work" */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          gap: '16px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '0 8px',
          }}>
            <span style={{ fontSize: '28px' }}>✨</span>
            <div>
              <div className="cozy-text-heading" style={{ fontSize: '20px', marginBottom: '2px', color: 'var(--text-warm)' }}>
                Adventure Journal
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                Draw, doodle, discover
              </div>
            </div>
          </div>
          <div className="cozy-paper-panel cozy-sketch-border" style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Decorative pushpin */}
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '28px',
              opacity: 0.25,
              zIndex: 10,
              filter: 'grayscale(0.5)',
            }}>
              📌
            </div>
            {canvas}
          </div>
        </div>
      </div>

      {/* BOTTOM 20%: CONVERSATIONAL ELEMENTS - Floating Glass Panels */}
      <div style={{
        flex: '0 0 20%',
        display: 'flex',
        flexDirection: 'column',
        background: 'transparent',
        padding: '12px 32px 16px 32px',
        gap: '10px',
        minHeight: 0,
      }}>
        {/* Row 1: Pi and Student Avatars - Glassmorphic */}
        <div style={{
          flex: '1 1 0',
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          padding: '12px 20px',
          alignItems: 'center',
          background: 'rgba(45, 50, 80, 0.4)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '2px solid rgba(255, 229, 180, 0.2)',
          boxShadow: '0 8px 32px rgba(26, 29, 46, 0.6)',
        }}>
          {/* Pi - Compact */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}>
            {/* Pi Blob - Smaller */}
            <div style={{ position: 'relative' }}>
              <div className={`cozy-pi-blob ${piSpeaking ? 'speaking' : ''}`} style={{
                width: '80px',
                height: '80px',
              }}>
                <img 
                  src="/illustrations/pi-blob.svg" 
                  alt="Pi"
                  style={{ width: '100%', height: '100%' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.parentElement?.querySelector('.fallback-blob') as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div 
                  className="fallback-blob"
                  style={{
                    display: 'none',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7EB5E8, #5A9BD5)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '40px',
                    border: '3px solid #4A4035',
                  }}
                >
                  🤖
                </div>
              </div>
              {/* Expression emoji */}
              <div style={{
                position: 'absolute',
                bottom: -5,
                right: -5,
                fontSize: '28px',
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
              }}>
                {!isConnected ? '😴' : piSpeaking ? '💬' : '👂'}
              </div>
            </div>
            
            {/* Pi Info */}
            <div>
              <div className="cozy-text-heading" style={{ fontSize: '18px', marginBottom: '2px', color: 'var(--text-warm)' }}>
                Pi
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                {!isConnected ? 'Sleeping' : piSpeaking ? 'Sharing ideas!' : 'Curious'}
              </div>
            </div>

            {/* Connection Status Badge */}
            <div className="cozy-status-badge" style={{ 
              marginLeft: 'auto', 
              fontSize: '13px', 
              padding: '8px 16px',
              fontWeight: '700',
              background: isConnected 
                ? 'linear-gradient(135deg, rgba(136, 212, 171, 0.3), rgba(136, 212, 171, 0.2))' 
                : 'linear-gradient(135deg, rgba(107, 93, 82, 0.3), rgba(74, 63, 53, 0.3))',
              borderColor: isConnected ? 'rgba(136, 212, 171, 0.6)' : 'var(--sketch-dark)',
            }}>
              <div className={`cozy-status-dot ${isConnected ? 'connected' : 'offline'}`} style={{ width: '10px', height: '10px' }} />
              <span style={{ color: isConnected ? 'var(--student-green)' : 'var(--text-secondary)' }}>
                {isConnected ? 'Ready to Explore' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Student (You) - Compact */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}>
            <div className={`cozy-student-emoji ${studentSpeaking ? 'speaking' : ''}`} style={{
              width: '80px',
              height: '80px',
              fontSize: '50px',
            }}>
              👦
            </div>
            <div>
              <div className="cozy-text-heading" style={{ fontSize: '18px', marginBottom: '2px', color: 'var(--text-warm)' }}>
                You
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                {studentSpeaking ? 'Exploring!' : 'Ready'}
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Controls - Glassmorphic */}
        <div style={{
          flex: '1 1 0',
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '10px 20px',
          background: 'rgba(45, 50, 80, 0.4)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '2px solid rgba(255, 229, 180, 0.2)',
          boxShadow: '0 8px 32px rgba(26, 29, 46, 0.6)',
        }}>
          {/* Primary Action */}
          {!isConnected ? (
            <button
              onClick={onConnect}
              className="cozy-button cozy-button-primary"
              style={{
                padding: '12px 32px',
                fontSize: '16px',
              }}
            >
              🌙 Start Adventure
            </button>
          ) : (
            <>
              {/* Stop */}
              <button
                onClick={onDisconnect}
                className="cozy-button"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 100, 100, 0.5), rgba(255, 80, 80, 0.6))',
                  color: 'var(--text-warm)',
                  borderColor: 'rgba(255, 100, 100, 0.6)',
                  padding: '10px 24px',
                }}
              >
                ⏸️ End Quest
              </button>

              {/* Mute Toggle */}
              <button
                onClick={onMuteToggle}
                className={`cozy-button ${!isMuted ? 'cozy-button-success' : ''}`}
                style={{ padding: '10px 24px' }}
              >
                {isMuted ? '🔇 Unmute' : '🎤 Mic On'}
              </button>
            </>
          )}

          {/* Divider */}
          <div style={{
            width: '2px',
            height: '32px',
            background: 'rgba(255, 229, 180, 0.3)',
          }} />

          {/* Help */}
          <button
            onClick={onHelp}
            className="cozy-button cozy-button-help"
            style={{ padding: '10px 20px' }}
          >
            💬 Ask Pi
          </button>

          {/* Export */}
          <button
            onClick={onExport}
            className="cozy-button"
            title="Export Logs"
            style={{ padding: '10px 20px' }}
          >
            💾
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            className="cozy-button"
            title="Reset Session"
            style={{ padding: '10px 20px' }}
          >
            🔄
          </button>
        </div>
      </div>
    </div>
  );
}
