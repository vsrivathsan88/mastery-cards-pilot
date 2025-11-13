/**
 * Manual Override Controls
 * For when Pi gets stuck or teacher needs to intervene
 */

import './ManualControls.css';

interface ManualControlsProps {
  onNextCard: () => void;
  onAwardPoints: (points: number) => void;
  currentCard?: {
    id: string;
    title: string;
    milestones: {
      basic: { points: number };
      advanced?: { points: number };
    };
  };
  disabled?: boolean;
}

export function ManualControls({ 
  onNextCard, 
  onAwardPoints, 
  currentCard,
  disabled = false 
}: ManualControlsProps) {
  
  if (!currentCard) return null;
  
  const basicPoints = currentCard.milestones.basic.points;
  const advancedPoints = currentCard.milestones.advanced?.points || 0;
  
  return (
    <div className="manual-controls">
      <div className="manual-controls-header">
        <span className="manual-controls-icon">🎮</span>
        <span className="manual-controls-title">Manual Controls</span>
      </div>
      
      <div className="manual-controls-buttons">
        <button
          className="manual-btn manual-btn-points"
          onClick={() => onAwardPoints(basicPoints)}
          disabled={disabled}
          title={`Award ${basicPoints} points (basic mastery)`}
        >
          ✨ Award {basicPoints}pts
        </button>
        
        {advancedPoints > 0 && (
          <button
            className="manual-btn manual-btn-bonus"
            onClick={() => onAwardPoints(basicPoints + advancedPoints)}
            disabled={disabled}
            title={`Award ${basicPoints + advancedPoints} points (advanced mastery)`}
          >
            🌟 Award {basicPoints + advancedPoints}pts
          </button>
        )}
        
        <button
          className="manual-btn manual-btn-next"
          onClick={onNextCard}
          disabled={disabled}
          title="Skip to next card (no points)"
        >
          ➡️ Next Card
        </button>
      </div>
      
      <div className="manual-controls-hint">
        Use if Pi gets stuck or you need to move on
      </div>
    </div>
  );
}
