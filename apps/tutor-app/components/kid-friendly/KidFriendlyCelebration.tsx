import Confetti from 'react-confetti';
import { useEffect, useState } from 'react';

interface KidFriendlyCelebrationProps {
  message: string;
  onComplete?: () => void;
  duration?: number;
}

export function KidFriendlyCelebration({ 
  message, 
  onComplete, 
  duration = 5000 
}: KidFriendlyCelebrationProps) {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    window.addEventListener('resize', handleResize);
    
    const timer = setTimeout(() => {
      onComplete?.();
    }, duration);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [duration, onComplete]);

  return (
    <>
      {/* Confetti with warm colors */}
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        recycle={false}
        numberOfPieces={400}
        gravity={0.25}
        colors={['#FF9F66', '#FFB84D', '#78D97E', '#66D9A5', '#FFD4A3', '#FFAE80']}
      />

      {/* Celebration Message */}
      <div className="kid-celebration">
        <div className="kid-celebration-emoji">
          🎉
        </div>
        <div className="kid-celebration-text">
          {message}
        </div>
        <div style={{
          fontSize: '24px',
          fontWeight: '700',
          color: 'white',
          marginTop: '24px',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
          animation: 'celebrationBounce 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.2s',
        }}>
          Keep up the amazing work! 🌟
        </div>
      </div>
    </>
  );
}
