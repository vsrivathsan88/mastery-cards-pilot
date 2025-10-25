import { useEffect, useState } from 'react';

interface TinyPiReactionsProps {
  trigger: number; // Increment to trigger new reaction
  piSpeaking: boolean;
}

const ENCOURAGEMENT_EMOJIS = ['💡', '✨', '🎯', '👍', '⭐', '🌟', '💫', '🎨'];
const REACTION_MESSAGES = [
  'Nice!',
  'Keep going!',
  'You got this!',
  'Great work!',
  'Love it!',
  'Awesome!',
];

interface Reaction {
  id: number;
  emoji: string;
  message?: string;
  x: number; // percentage from left
  y: number; // percentage from top
}

export function TinyPiReactions({ trigger, piSpeaking }: TinyPiReactionsProps) {
  const [reactions, setReactions] = useState<Reaction[]>([]);

  useEffect(() => {
    if (trigger === 0) return;

    // Create 1-2 tiny reactions near the right edge (near canvas)
    const count = Math.random() > 0.7 ? 2 : 1;
    const newReactions: Reaction[] = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      emoji: ENCOURAGEMENT_EMOJIS[Math.floor(Math.random() * ENCOURAGEMENT_EMOJIS.length)],
      message: Math.random() > 0.5 ? REACTION_MESSAGES[Math.floor(Math.random() * REACTION_MESSAGES.length)] : undefined,
      x: 85 + Math.random() * 10, // 85-95% from left (right edge)
      y: 20 + Math.random() * 60, // 20-80% from top
    }));

    setReactions(prev => [...prev, ...newReactions]);

    // Remove reactions after animation (2.5s)
    const timer = setTimeout(() => {
      setReactions(prev => prev.filter(r => !newReactions.find(nr => nr.id === r.id)));
    }, 2500);

    return () => clearTimeout(timer);
  }, [trigger]);

  return (
    <>
      {reactions.map(reaction => (
        <div
          key={reaction.id}
          style={{
            position: 'fixed',
            left: `${reaction.x}%`,
            top: `${reaction.y}%`,
            zIndex: 5,
            pointerEvents: 'none',
            animation: 'tinyReactionFloat 2.5s ease-out forwards',
          }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
          }}>
            <div style={{
              fontSize: '24px',
              filter: 'drop-shadow(0 2px 4px rgba(93, 78, 67, 0.2))',
            }}>
              {reaction.emoji}
            </div>
            {reaction.message && (
              <div style={{
                fontSize: '11px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                background: 'rgba(255, 248, 240, 0.95)',
                padding: '4px 10px',
                borderRadius: '12px',
                border: '1px solid var(--sketch-light)',
                boxShadow: '0 2px 8px rgba(93, 78, 67, 0.15)',
                whiteSpace: 'nowrap',
              }}>
                {reaction.message}
              </div>
            )}
          </div>
        </div>
      ))}
      <style>{`
        @keyframes tinyReactionFloat {
          0% {
            opacity: 0;
            transform: translateY(0) scale(0.8);
          }
          15% {
            opacity: 1;
            transform: translateY(-10px) scale(1);
          }
          85% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(-40px) scale(0.9);
          }
        }
      `}</style>
    </>
  );
}
