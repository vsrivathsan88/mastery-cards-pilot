import { useEffect, useState } from 'react';

interface MicroParticle {
  id: number;
  emoji: string;
  left: number;
  top: number;
}

// Lighter emojis for micro-celebrations (understanding, effort, trying)
const MICRO_EMOJIS = ['✨', '💫', '👍', '💡', '⭐', '🌟'];

export function CozyMicroCelebration({ trigger }: { trigger: number }) {
  const [particles, setParticles] = useState<MicroParticle[]>([]);

  useEffect(() => {
    if (trigger === 0) return;

    // Create 3-5 small particles for subtle encouragement
    const count = Math.floor(Math.random() * 3) + 3; // 3-5 particles
    
    const newParticles: MicroParticle[] = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      emoji: MICRO_EMOJIS[Math.floor(Math.random() * MICRO_EMOJIS.length)],
      // Appear near bottom-right (where progress indicator is)
      left: Math.random() * 30 + 65, // 65-95% from left
      top: Math.random() * 20 + 75,  // 75-95% from top
    }));

    setParticles(prev => [...prev, ...newParticles]);

    // Remove particles after 2s (shorter than milestone celebrations)
    const timer = setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 2000);

    return () => clearTimeout(timer);
  }, [trigger]);

  return (
    <>
      {particles.map(particle => (
        <div
          key={particle.id}
          className="cozy-micro-particle"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
          }}
        >
          {particle.emoji}
        </div>
      ))}
    </>
  );
}
