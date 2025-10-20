import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  emoji: string;
  x: number;
  y: number;
}

interface EncouragementParticlesProps {
  trigger?: number; // Change this to spawn particles
}

const ENCOURAGEMENT_EMOJIS = ['⭐', '✨', '💫', '🌟', '💖', '🎉', '🎊', '👏', '🙌', '💪'];

export function EncouragementParticles({ trigger = 0 }: EncouragementParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (trigger === 0) return;

    // Spawn 5-8 particles at random positions
    const newParticles: Particle[] = [];
    const count = Math.floor(Math.random() * 4) + 5; // 5-8 particles

    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Date.now() + i,
        emoji: ENCOURAGEMENT_EMOJIS[Math.floor(Math.random() * ENCOURAGEMENT_EMOJIS.length)],
        x: Math.random() * window.innerWidth,
        y: window.innerHeight - 150, // Start near bottom
      });
    }

    setParticles(prev => [...prev, ...newParticles]);

    // Remove particles after animation (3s)
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 3000);
  }, [trigger]);

  return (
    <>
      {particles.map(particle => (
        <div
          key={particle.id}
          className="encouragement-particle"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
          }}
        >
          {particle.emoji}
        </div>
      ))}
    </>
  );
}
