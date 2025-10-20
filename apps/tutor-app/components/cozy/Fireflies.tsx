import { useEffect, useState } from 'react';

interface Firefly {
  id: number;
  x: number;
  y: number;
  duration: number;
  delay: number;
}

export function Fireflies() {
  const [fireflies, setFireflies] = useState<Firefly[]>([]);

  useEffect(() => {
    // Create 2-3 fireflies that float gently
    const flies: Firefly[] = Array.from({ length: 3 }, (_, i) => ({
      id: i,
      x: Math.random() * 80 + 10, // 10-90% horizontal
      y: Math.random() * 60 + 20, // 20-80% vertical
      duration: Math.random() * 4 + 6, // 6-10s
      delay: Math.random() * 3,
    }));
    setFireflies(flies);
  }, []);

  return (
    <>
      {fireflies.map(fly => (
        <div
          key={fly.id}
          style={{
            position: 'fixed',
            left: `${fly.x}%`,
            top: `${fly.y}%`,
            width: '4px',
            height: '4px',
            background: 'var(--firefly-glow)',
            borderRadius: '50%',
            boxShadow: '0 0 12px var(--firefly-glow), 0 0 24px var(--firefly-glow)',
            opacity: 0.7,
            animation: `fireflyFloat ${fly.duration}s ease-in-out infinite`,
            animationDelay: `${fly.delay}s`,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      ))}
      <style>{`
        @keyframes fireflyFloat {
          0%, 100% {
            transform: translate(0, 0);
            opacity: 0.4;
          }
          25% {
            transform: translate(30px, -20px);
            opacity: 0.8;
          }
          50% {
            transform: translate(15px, 15px);
            opacity: 0.6;
          }
          75% {
            transform: translate(-20px, -10px);
            opacity: 0.9;
          }
        }
      `}</style>
    </>
  );
}
