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

      {/* TOP 84%: WORKSPACE - Image + Canvas on Desk */}
      <div className="cozy-desk-surface" style={{
        flex: '0 0 79.8%',
        display: 'grid',
        gridTemplateColumns: '45% 55%',
        gap: '20px',
        padding: '24px 28px 20px 28px',
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
            gap: '6px',
            padding: '0 4px',
          }}>
            <span style={{ fontSize: '22px' }}>🔍</span>
            <div>
              <div className="cozy-text-heading" style={{ fontSize: '16px', marginBottom: '1px', color: 'var(--text-warm)' }}>
                Today's Mystery
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                Let's figure this out together
              </div>
            </div>
          </div>
          <div className="cozy-paper-panel" style={{
            flex: 1,
            padding: '20px',
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
            gap: '6px',
            padding: '0 4px',
          }}>
            <span style={{ fontSize: '22px' }}>✨</span>
            <div>
              <div className="cozy-text-heading" style={{ fontSize: '16px', marginBottom: '1px', color: 'var(--text-warm)' }}>
                Adventure Journal
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '500' }}>
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

      {/* BOTTOM 16%: SINGLE ROW - All in One Container */}
      <div style={{
        flex: '0 0 13.6%',
        display: 'flex',
        background: 'transparent',
        padding: '16px 32px 20px 32px',
        minHeight: 0,
      }}>
        {/* Single Combined Glassmorphic Container - Everything in One Row */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          padding: '16px 24px',
          background: 'rgba(45, 50, 80, 0.4)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '2px solid rgba(255, 229, 180, 0.2)',
          boxShadow: '0 8px 32px rgba(26, 29, 46, 0.6)',
        }}>
          {/* LEFT: Pi Avatar + Info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{ position: 'relative' }}>
              <div className={`cozy-pi-blob ${piSpeaking ? 'speaking' : ''}`} style={{
                width: '64px',
                height: '64px',
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
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7EB5E8, #5A9BD5)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    border: '3px solid #4A4035',
                  }}
                >
                  🤖
                </div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', marginBottom: '1px', color: 'var(--text-warm)', fontWeight: '600' }}>
                Pi
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                {!isConnected ? 'Sleeping' : piSpeaking ? 'Sharing!' : 'Curious'}
              </div>
            </div>
          </div>

          {/* CENTER: All Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            flexWrap: 'wrap',
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

          {/* RIGHT: Student Avatar + Info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            justifyContent: 'flex-end',
          }}>
            <div>
              <div style={{ fontSize: '14px', marginBottom: '1px', color: 'var(--text-warm)', fontWeight: '600', textAlign: 'right' }}>
                You
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textAlign: 'right' }}>
                {studentSpeaking ? 'Exploring!' : 'Ready'}
              </div>
            </div>
            <div className={`cozy-student-emoji ${studentSpeaking ? 'speaking' : ''}`} style={{
              width: '64px',
              height: '64px',
              fontSize: '42px',
            }}>
              👦
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
