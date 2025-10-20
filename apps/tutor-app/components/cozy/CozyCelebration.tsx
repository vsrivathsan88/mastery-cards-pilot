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

  // Warm confetti colors only
  const warmColors = [
    '#FFD4B2', // cozy-peach
    '#FFB4A2', // cozy-coral
    '#C8E6C9', // cozy-mint
    '#E1D5F0', // cozy-lavender
    '#FFE8D6', // light peach
    '#FFCC99', // warm orange
  ];

  return (
    <div className="cozy-celebration-overlay">
      {/* Confetti */}
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        numberOfPieces={300}
        colors={warmColors}
        recycle={false}
        gravity={0.15}
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
