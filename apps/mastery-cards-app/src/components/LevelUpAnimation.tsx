/**
 * Level Up Animation Component
 * Shows celebratory image when student levels up
 */

import { useEffect, useState } from 'react';
import './LevelUpAnimation.css';

interface LevelUpAnimationProps {
  show: boolean;
  newLevel: string;
  totalPoints: number;
  onComplete: () => void;
}

export function LevelUpAnimation({ show, newLevel, totalPoints, onComplete }: LevelUpAnimationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      
      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onComplete, 500); // Wait for fade out
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!visible) return null;

  return (
    <div className="level-up-overlay">
      <div className="level-up-container">
        <img 
          src="/images/Level-Up.png" 
          alt="Level Up!" 
          className="level-up-image"
        />
        <div className="level-up-content">
          <h1 className="level-up-title">LEVEL UP!</h1>
          <h2 className="level-up-new-level">{newLevel}</h2>
          <p className="level-up-points">{totalPoints} points</p>
        </div>
      </div>
    </div>
  );
}
