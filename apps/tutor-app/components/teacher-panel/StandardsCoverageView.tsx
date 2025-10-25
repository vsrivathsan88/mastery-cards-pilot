/**
 * Standards Coverage View
 * 
 * Shows progress on learning standards and objectives
 */

import { useTeacherPanel } from '@/lib/teacher-panel-store';

export function StandardsCoverageView() {
  const { standardsCoverage } = useTeacherPanel();
  
  if (standardsCoverage.length === 0) {
    return (
      <div className="empty-state">
        <p>📚 Standards mapping in progress</p>
        <p className="empty-subtitle">
          As the lesson progresses, you'll see which learning standards are being addressed and the student's progress toward mastery.
        </p>
      </div>
    );
  }
  
  return (
    <div className="standards-coverage-view">
      {standardsCoverage.map(standard => (
        <div key={standard.standardCode} className="standard-card">
          {/* Header */}
          <div className="standard-header">
            <div className="standard-code">{standard.standardCode}</div>
            <div className="standard-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${standard.percentComplete}%` }}
                />
              </div>
              <span className="progress-text">{standard.percentComplete}%</span>
            </div>
          </div>
          
          {/* Description */}
          <div className="standard-description">
            {standard.standardDescription}
          </div>
          
          {/* Objectives */}
          <div className="objectives-list">
            {standard.objectives.map(objective => (
              <div key={objective.id} className={`objective-item ${objective.status}`}>
                <span className="objective-status">
                  {objective.status === 'mastered' && '✓'}
                  {objective.status === 'in-progress' && '○'}
                  {objective.status === 'not-started' && '○'}
                </span>
                <span className="objective-description">{objective.description}</span>
                {objective.status === 'in-progress' && (
                  <span className="objective-badge">In Progress</span>
                )}
              </div>
            ))}
          </div>
          
          {/* Evidence summary if available */}
          {standard.objectives.some(o => o.evidenceSummary) && (
            <div className="evidence-section">
              <div className="evidence-title">Evidence:</div>
              {standard.objectives
                .filter(o => o.evidenceSummary)
                .map(o => (
                  <div key={o.id} className="evidence-item">
                    • {o.evidenceSummary}
                  </div>
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
