/**
 * LessonProgressBar - Visual progress indicator
 * Shows completion percentage and milestone progress
 */

import './LessonProgressBar.css';

interface LessonProgressBarProps {
  completedMilestones: number;
  totalMilestones: number;
  currentMilestoneName?: string;
}

export function LessonProgressBar({ 
  completedMilestones, 
  totalMilestones,
  currentMilestoneName 
}: LessonProgressBarProps) {
  const percentage = totalMilestones > 0 
    ? Math.round((completedMilestones / totalMilestones) * 100) 
    : 0;

  return (
    <div className="lesson-progress-bar">
      <div className="progress-bar-header">
        <div className="progress-label">
          <span className="progress-icon">🎯</span>
          <span className="progress-text">
            {completedMilestones} of {totalMilestones} milestones
          </span>
        </div>
        <div className="progress-percentage">{percentage}%</div>
      </div>
      
      <div className="progress-bar-track">
        <div 
          className="progress-bar-fill"
          style={{ width: `${percentage}%` }}
        >
          {percentage > 10 && (
            <div className="progress-bar-sparkle">✨</div>
          )}
        </div>
      </div>

      {currentMilestoneName && (
        <div className="progress-current-milestone">
          Working on: <strong>{currentMilestoneName}</strong>
        </div>
      )}
    </div>
  );
}
