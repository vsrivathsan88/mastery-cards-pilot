import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  emoji: string;
  left: number;
  top: number;
}

const EMOJIS = ['⭐', '✨', '💫', '🌟', '💖', '🎉', '🎊', '👏', '🙌', '💪', '🎨', '📝'];

export function CozyEncouragementParticles({ trigger }: { trigger: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (trigger === 0) return;

    // Create 6-8 new particles
    const count = Math.floor(Math.random() * 3) + 6; // 6-8
    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      left: Math.random() * 80 + 10, // 10-90% from left
      top: Math.random() * 40 + 50, // 50-90% from top (bottom area)
    }));

    setParticles(prev => [...prev, ...newParticles]);

    // Remove particles after animation (3s)
    const timer = setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 3000);

    return () => clearTimeout(timer);
  }, [trigger]);

  return (
    <>
      {particles.map(particle => (
        <div
          key={particle.id}
          className="cozy-encouragement-particle"
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
