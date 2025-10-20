import { useEffect, useRef, useState } from 'react';

interface SoundwaveVisualizerProps {
  isActive: boolean;
  isSpeaking: boolean;
  label: string;
  color: string;
  emoji: string;
  message?: string;
}

export function SoundwaveVisualizer({
  isActive,
  isSpeaking,
  label,
  color,
  emoji,
  message
}: SoundwaveVisualizerProps) {
  // Simulate soundwave bars (8 bars)
  const [bars, setBars] = useState([0, 0, 0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    if (!isSpeaking) {
      // Reset to idle state
      setBars([0.2, 0.3, 0.2, 0.4, 0.3, 0.2, 0.3, 0.2]);
      return;
    }

    // Animate bars when speaking
    const interval = setInterval(() => {
      setBars([
        Math.random() * 0.5 + 0.3,
        Math.random() * 0.8 + 0.2,
        Math.random() * 1.0,
        Math.random() * 0.7 + 0.3,
        Math.random() * 0.9 + 0.1,
        Math.random() * 0.6 + 0.2,
        Math.random() * 0.8 + 0.1,
        Math.random() * 0.5 + 0.3,
      ]);
    }, 80);

    return () => clearInterval(interval);
  }, [isSpeaking]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '16px 24px',
      background: isActive ? `linear-gradient(135deg, ${color}15, ${color}08)` : 'rgba(0, 0, 0, 0.2)',
      borderRadius: '20px',
      border: `2px solid ${isActive ? color : 'rgba(255, 255, 255, 0.1)'}`,
      backdropFilter: 'blur(10px)',
      transition: 'all 0.3s ease',
      minHeight: '80px',
      flex: 1,
    }}>
      {/* Avatar Emoji */}
      <div style={{
        fontSize: '48px',
        width: '64px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${color}30, ${color}15)`,
        borderRadius: '50%',
        border: `3px solid ${color}`,
        flexShrink: 0,
        animation: isSpeaking ? 'pulse 1.5s ease-in-out infinite' : 'none',
      }}>
        {emoji}
      </div>

      {/* Info + Soundwave */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Label */}
        <div style={{
          fontSize: '18px',
          fontWeight: '700',
          color: 'white',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
        }}>
          {label}
        </div>

        {/* Soundwave Bars */}
        {isActive && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            height: '32px',
          }}>
            {bars.map((height, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  backgroundColor: color,
                  height: `${height * 100}%`,
                  borderRadius: '4px',
                  transition: 'height 0.08s ease',
                  boxShadow: isSpeaking ? `0 0 10px ${color}` : 'none',
                }}
              />
            ))}
          </div>
        )}

        {/* Message */}
        {message && isSpeaking && (
          <div style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.9)',
            fontStyle: 'italic',
            maxWidth: '400px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            "{message}"
          </div>
        )}

        {/* Status */}
        {!message && (
          <div style={{
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.6)',
            fontWeight: '500',
          }}>
            {isSpeaking ? 'Speaking...' : isActive ? 'Listening...' : 'Offline'}
          </div>
        )}
      </div>
    </div>
  );
}
