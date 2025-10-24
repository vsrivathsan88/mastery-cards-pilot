/**
 * Milestone Mastery View
 * 
 * Timeline of milestone progress with evidence
 */

import { useTeacherPanel } from '@/lib/teacher-panel-store';
import { MasteryMilestoneLog } from '@/lib/teacher-panel-types';

export function MilestoneMasteryView() {
  const { milestoneLogs } = useTeacherPanel();
  
  if (milestoneLogs.length === 0) {
    return (
      <div className="empty-state">
        <p>🎯 No milestones tracked yet</p>
        <p className="empty-subtitle">Milestone progress will appear as the lesson advances</p>
      </div>
    );
  }
  
  // Sort by timestamp (most recent first)
  const sortedLogs = [...milestoneLogs].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );
  
  return (
    <div className="milestone-mastery-view">
      <div className="milestone-timeline">
        {sortedLogs.map(log => (
          <MilestoneCard key={log.id} log={log} />
        ))}
      </div>
    </div>
  );
}

function MilestoneCard({ log }: { log: MasteryMilestoneLog }) {
  const getStatusIcon = (status: MasteryMilestoneLog['status']) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in-progress': return '⏳';
      case 'started': return '▶️';
      case 'skipped': return '⏭️';
    }
  };
  
  const getStatusClass = (status: MasteryMilestoneLog['status']) => {
    switch (status) {
      case 'completed': return 'status-completed';
      case 'in-progress': return 'status-in-progress';
      case 'started': return 'status-started';
      case 'skipped': return 'status-skipped';
    }
  };
  
  return (
    <div className={`milestone-card ${getStatusClass(log.status)}`}>
      {/* Status indicator */}
      <div className="milestone-status">
        <span className="status-icon">{getStatusIcon(log.status)}</span>
      </div>
      
      {/* Content */}
      <div className="milestone-content">
        {/* Header */}
        <div className="milestone-header">
          <div className="milestone-title">{log.milestoneTitle}</div>
          <div className="milestone-time">
            {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        
        {/* Concepts addressed */}
        {log.conceptsAddressed.length > 0 && (
          <div className="concepts-section">
            <div className="concepts-label">Concepts:</div>
            <div className="concepts-list">
              {log.conceptsAddressed.map((concept, i) => (
                <span key={i} className="concept-tag">{concept}</span>
              ))}
            </div>
          </div>
        )}
        
        {/* Student response (evidence) */}
        {log.studentResponse && (
          <div className="evidence-section">
            <div className="evidence-label">Evidence:</div>
            <div className="evidence-text">"{log.studentResponse}"</div>
          </div>
        )}
        
        {/* Meta info */}
        <div className="milestone-meta">
          {log.timeSpent !== undefined && (
            <span className="meta-item">⏱️ {log.timeSpent}s</span>
          )}
          {log.attemptsCount !== undefined && log.attemptsCount > 1 && (
            <span className="meta-item">🔄 {log.attemptsCount} attempts</span>
          )}
        </div>
      </div>
    </div>
  );
}
