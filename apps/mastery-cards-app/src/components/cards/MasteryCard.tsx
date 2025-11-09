/**
 * Individual Mastery Card Component
 * Displays a single card with text prompt
 */

import React from 'react';
import type { MasteryCard as MasteryCardType } from '../../types/cards';
import './MasteryCard.css';

interface MasteryCardProps {
  card: MasteryCardType;
  isCurrent: boolean;
  style?: React.CSSProperties;
}

export function MasteryCard({ card, isCurrent, style }: MasteryCardProps) {
  // Difficulty badge colors
  const difficultyColors = {
    easy: '#22c55e',    // green
    medium: '#f59e0b',  // orange
    hard: '#ef4444',    // red
  };
  
  const difficultyEmoji = {
    easy: '⭐',
    medium: '⭐⭐',
    hard: '⭐⭐⭐',
  };
  
  return (
    <div 
      className={`mastery-card ${isCurrent ? 'current' : 'background'}`}
      style={style}
      data-card-id={card.cardId}
    >
      {/* Difficulty badge */}
      <div 
        className="difficulty-badge"
        style={{ backgroundColor: difficultyColors[card.difficulty] }}
      >
        {difficultyEmoji[card.difficulty]} {card.difficulty.toUpperCase()}
      </div>
      
      {/* Card content */}
      <div className="card-content">
        <h2 className="card-title">{card.title}</h2>
        
        <div className="card-prompt">
          <div className="prompt-icon">🤔</div>
          <p className="prompt-text">{card.textPrompt}</p>
        </div>
        
        <div className="card-meta">
          <div className="meta-item">
            <span className="meta-label">Standard:</span>
            <span className="meta-value">{card.standard}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Points:</span>
            <span className="meta-value">+{card.pointValue}</span>
          </div>
        </div>
      </div>
      
      {/* Swipe hint */}
      {isCurrent && (
        <div className="swipe-hint">
          <div className="swipe-direction left">
            <span>⬅️</span>
            <span>Practice More</span>
          </div>
          <div className="swipe-direction right">
            <span>Mastered!</span>
            <span>➡️</span>
          </div>
        </div>
      )}
    </div>
  );
}
