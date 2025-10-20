import { useEffect, useState } from 'react';

interface Star {
  id: number;
  left: number;
  top: number;
  delay: number;
}

export function TwinklingStars() {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    // Create 5-6 twinkling stars at random positions
    const twinklers: Star[] = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 40, // Top 40% of screen (sky area)
      delay: Math.random() * 3,
    }));
    setStars(twinklers);
  }, []);

  return (
    <>
      {stars.map(star => (
        <div
          key={star.id}
          className="twinkling-star"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </>
  );
}
