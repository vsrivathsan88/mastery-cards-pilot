import Confetti from 'react-confetti';
import { useEffect, useState } from 'react';

interface CelebrationOverlayProps {
  message: string;
  onComplete?: () => void;
  duration?: number;
}

export function CelebrationOverlay({ 
  message, 
  onComplete, 
  duration = 4000 
}: CelebrationOverlayProps) {
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
      {/* Confetti Effect */}
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        recycle={false}
        numberOfPieces={500}
        gravity={0.3}
      />

      {/* Celebration Message */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10000,
        animation: 'celebrateZoom 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      }}>
        <div style={{
          padding: '48px 72px',
          borderRadius: '32px',
          fontSize: '48px',
          fontWeight: '900',
          textAlign: 'center',
          color: 'white',
          letterSpacing: '2px',
          textTransform: 'uppercase',
        }}
        className="glass-accent-green glow-green"
        >
          <div style={{ fontSize: '80px', marginBottom: '16px' }}>
            🎉 ⭐ 🎊
          </div>
          <div className="text-glow-green">
            {message}
          </div>
          <div style={{ 
            fontSize: '24px', 
            marginTop: '16px',
            fontWeight: '600',
            textTransform: 'none',
            letterSpacing: '1px',
            opacity: 0.9,
          }}>
            Keep up the great work!
          </div>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes celebrateZoom {
          0% {
            transform: translate(-50%, -50%) scale(0) rotate(-180deg);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2) rotate(10deg);
          }
          100% {
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
