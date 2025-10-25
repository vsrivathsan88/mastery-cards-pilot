import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';

interface CozyCelebrationProps {
  message: string;
  onComplete?: () => void;
  duration?: number; // milliseconds
}

export function CozyCelebration({ 
  message, 
  onComplete, 
  duration = 5000 
}: CozyCelebrationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);

    // Auto-dismiss after duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) {
        setTimeout(onComplete, 400); // Wait for fade out
      }
    }, duration);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [duration, onComplete]);

  if (!isVisible) return null;

  // Warm, playful confetti colors
  const warmColors = [
    '#FF8A6D', // accent-coral
    '#FFB499', // accent-peach
    '#7DCCB8', // accent-mint
    '#A8CFBC', // accent-sage
    '#C5B3E6', // accent-lavender
    '#D4C5F0', // accent-soft-purple
  ];

  return (
    <div className="cozy-celebration-overlay">
      {/* Confetti */}
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        numberOfPieces={150}
        colors={warmColors}
        recycle={false}
        gravity={0.2}
        wind={0.01}
      />

      {/* Message */}
      <div className="cozy-celebration-content">
        <div className="cozy-celebration-emoji">
          🎉
        </div>
        <div className="cozy-celebration-text">
          {message}
        </div>
        <div className="cozy-celebration-subtext">
          Keep up the amazing work! 🌟
        </div>
      </div>
    </div>
  );
}
