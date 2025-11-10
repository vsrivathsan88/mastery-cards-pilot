/**
 * Individual Mastery Card Component
 * Displays a single card with image and learning context
 */

import React from 'react';
import type { MasteryCard as MVPCard } from '../../lib/cards/mvp-cards-data';
import './MasteryCard.css';

interface MasteryCardProps {
  card: MVPCard;
  isCurrent: boolean;
  style?: React.CSSProperties;
}

export function MasteryCard({ card, isCurrent, style }: MasteryCardProps) {
  // Calculate total possible points for this card
  const basicPoints = card.milestones.basic.points;
  const advancedPoints = card.milestones.advanced?.points || 0;
  const misconceptionPoints = card.misconception?.teachingMilestone.points || 0;
  const maxPoints = basicPoints + advancedPoints + misconceptionPoints;
  
  // Don't show points badge on welcome card
  const isWelcomeCard = card.cardNumber === 0;
  
  return (
    <div 
      className={`mastery-card ${isCurrent ? 'current' : 'background'}`}
      style={style}
      data-card-id={card.id}
    >
      {/* Points badge - hide on welcome card */}
      {!isWelcomeCard && maxPoints > 0 && (
        <div className="points-badge">
          <span className="points-emoji">✨</span>
          <span className="points-value">Up to {maxPoints} pts</span>
        </div>
      )}
      
      {/* Card image */}
      {card.imageUrl && (
        <div className="card-image-container">
          <img 
            src={card.imageUrl} 
            alt={card.title}
            className="card-image"
          />
        </div>
      )}
      
      {/* Card content */}
      <div className="card-content">
        <h2 className="card-title">{card.title}</h2>
        <p className="card-context">{card.context}</p>
        
        {/* Misconception indicator */}
        {card.misconception && (
          <div className="misconception-badge">
            🤔 Pi needs your help!
          </div>
        )}
      </div>
    </div>
  );
}
