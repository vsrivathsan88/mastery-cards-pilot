/**
 * EmojiReaction - Pilot tool emoji display
 * 
 * Shows emoji reactions from Pi with different intensities and positions.
 * Used by show_emoji_reaction pilot tool.
 */

import { useEffect, useState } from 'react';

interface Reaction {
  id: string;
  emoji: string;
  intensity: 'subtle' | 'normal' | 'celebration';
  position: 'avatar' | 'center' | 'canvas';
  duration: number;
  reason: string;
}

interface EmojiReactionProps {
  reaction: Reaction | null;
  onComplete?: () => void;
}

export function EmojiReaction({ reaction, onComplete }: EmojiReactionProps) {
  const [visible, setVisible] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; angle: number }>>([]);

  useEffect(() => {
    if (!reaction) {
      setVisible(false);
      return;
    }

    // Show reaction
    setVisible(true);

    // For celebration intensity, create particles
    if (reaction.intensity === 'celebration') {
      const particleCount = 12;
      const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        angle: (360 / particleCount) * i,
      }));
      setParticles(newParticles);
    }

    // Hide after duration
    const timer = setTimeout(() => {
      setVisible(false);
      setParticles([]);
      onComplete?.();
    }, reaction.duration * 1000);

    return () => clearTimeout(timer);
  }, [reaction, onComplete]);

  if (!reaction || !visible) return null;

  const getPositionStyle = (): React.CSSProperties => {
    switch (reaction.position) {
      case 'avatar':
        return {
          left: '5%',
          top: '10%',
        };
      case 'center':
        return {
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        };
      case 'canvas':
        return {
          right: '20%',
          top: '40%',
        };
      default:
        return {
          left: '5%',
          top: '10%',
        };
    }
  };

  const getScaleClass = () => {
    switch (reaction.intensity) {
      case 'subtle':
        return 'emoji-subtle';
      case 'normal':
        return 'emoji-normal';
      case 'celebration':
        return 'emoji-celebration';
      default:
        return 'emoji-normal';
    }
  };

  return (
    <>
      <div
        className={`emoji-reaction ${getScaleClass()}`}
        style={{
          position: 'fixed',
          zIndex: 9999,
          pointerEvents: 'none',
          ...getPositionStyle(),
        }}
        title={reaction.reason}
      >
        <div className="emoji-main">
          {reaction.emoji}
        </div>

        {/* Celebration particles */}
        {reaction.intensity === 'celebration' && particles.map(particle => (
          <div
            key={particle.id}
            className="emoji-particle"
            style={{
              '--angle': `${particle.angle}deg`,
            } as React.CSSProperties}
          >
            {reaction.emoji}
          </div>
        ))}
      </div>

      <style>{`
        .emoji-reaction {
          animation: emojiAppear 0.3s ease-out;
        }

        .emoji-main {
          filter: drop-shadow(0 4px 8px rgba(139, 92, 246, 0.3));
        }

        .emoji-subtle .emoji-main {
          font-size: 32px;
          animation: emojiFloat 2s ease-in-out;
        }

        .emoji-normal .emoji-main {
          font-size: 48px;
          animation: emojiPop 0.5s ease-out, emojiFloat 2s ease-in-out 0.5s;
        }

        .emoji-celebration .emoji-main {
          font-size: 64px;
          animation: emojiCelebrate 0.6s ease-out, emojiFloat 2s ease-in-out 0.6s;
        }

        .emoji-particle {
          position: absolute;
          font-size: 24px;
          opacity: 0;
          animation: particleBurst 1s ease-out forwards;
          left: 50%;
          top: 50%;
          transform-origin: center;
        }

        @keyframes emojiAppear {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes emojiFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes emojiPop {
          0% {
            transform: scale(0.5);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes emojiCelebrate {
          0% {
            transform: scale(0.3) rotate(-10deg);
          }
          50% {
            transform: scale(1.2) rotate(10deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
          }
        }

        @keyframes particleBurst {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-80px) scale(0.5);
          }
        }
      `}</style>
    </>
  );
}

/**
 * Hook for managing emoji reactions
 */
export function useEmojiReaction() {
  const [reaction, setReaction] = useState<Reaction | null>(null);

  const showReaction = (
    emoji: string,
    intensity: 'subtle' | 'normal' | 'celebration' = 'normal',
    duration: number = 2,
    position: 'avatar' | 'center' | 'canvas' = 'avatar',
    reason: string = ''
  ) => {
    setReaction({
      id: Date.now().toString(),
      emoji,
      intensity,
      position,
      duration,
      reason,
    });
  };

  const clearReaction = () => {
    setReaction(null);
  };

  return {
    reaction,
    showReaction,
    clearReaction,
  };
}
