/**
 * Session Header
 * Shows level, points, streak, and progress
 */

import { useSessionStore } from '../../lib/state/session-store';
import './SessionHeader.css';

export function SessionHeader() {
  const { points, streak, currentLevel, getProgress } = useSessionStore();
  const progress = getProgress();
  
  return (
    <div className="session-header">
      <div className="header-stats">
        <div className="stat-item level">
          <span className="stat-icon">⚡</span>
          <div className="stat-content">
            <span className="stat-label">{currentLevel.title}</span>
            <span className="stat-value">Lv {currentLevel.level}</span>
          </div>
        </div>
        
        <div className="stat-item points">
          <span className="stat-icon">💎</span>
          <div className="stat-content">
            <span className="stat-label">Points</span>
            <span className="stat-value">{points}</span>
          </div>
        </div>
        
        {streak > 0 && (
          <div className="stat-item streak">
            <span className="stat-icon">🔥</span>
            <div className="stat-content">
              <span className="stat-label">Streak</span>
              <span className="stat-value">{streak}</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="progress-bar-container">
        <div className="progress-info">
          <span className="progress-text">
            {progress.current} / {progress.total} cards
          </span>
          <span className="progress-percentage">
            {progress.percentage}%
          </span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
