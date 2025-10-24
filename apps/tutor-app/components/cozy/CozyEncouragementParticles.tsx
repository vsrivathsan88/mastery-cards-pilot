import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  emoji: string;
  left: number;
  top: number;
  rotation: number;
  delay: number;
  scale: number;
}

// 🌟 STAR-FOCUSED for milestone completions!
const STAR_EMOJIS = ['⭐', '✨', '💫', '🌟'];
const CELEBRATION_EMOJIS = ['🎉', '🎊', '👏', '🙌'];

export function CozyEncouragementParticles({ trigger }: { trigger: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (trigger === 0) return;

    // Create 12-15 particles for a BIG CELEBRATION! ⭐✨
    const count = Math.floor(Math.random() * 4) + 12; // 12-15 particles
    
    // 70% stars, 30% celebration emojis
    const allEmojis = [
      ...STAR_EMOJIS, ...STAR_EMOJIS, ...STAR_EMOJIS, // 3x weight for stars
      ...CELEBRATION_EMOJIS
    ];
    
    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      emoji: allEmojis[Math.floor(Math.random() * allEmojis.length)],
      left: Math.random() * 90 + 5, // 5-95% from left (full width)
      top: Math.random() * 60 + 20, // 20-80% from top (center area)
      rotation: Math.random() * 360, // Random rotation
      delay: Math.random() * 0.3, // Stagger animations
      scale: Math.random() * 0.5 + 0.8, // 0.8-1.3 scale variety
    }));

    setParticles(prev => [...prev, ...newParticles]);

    // Remove particles after animation (3.5s)
    const timer = setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 3500);

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
            transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
            animationDelay: `${particle.delay}s`,
          }}
        >
          {particle.emoji}
        </div>
      ))}
    </>
  );
}
