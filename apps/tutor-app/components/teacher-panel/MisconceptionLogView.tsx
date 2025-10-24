/**
 * Misconception Log View
 * 
 * Shows detected misconceptions, interventions, and resolution status
 */

import { useTeacherPanel } from '@/lib/teacher-panel-store';
import { MisconceptionLog } from '@/lib/teacher-panel-types';

export function MisconceptionLogView() {
  const { misconceptionLogs } = useTeacherPanel();
  
  if (misconceptionLogs.length === 0) {
    return (
      <div className="empty-state success">
        <p>✅ No misconceptions detected</p>
        <p className="empty-subtitle">Great! The student is on track</p>
      </div>
    );
  }
  
  // Sort by timestamp (most recent first)
  const sortedLogs = [...misconceptionLogs].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );
  
  // Group by status
  const unresolved = sortedLogs.filter(m => m.status !== 'resolved');
  const resolved = sortedLogs.filter(m => m.status === 'resolved');
  
  return (
    <div className="misconception-log-view">
      {/* Unresolved section */}
      {unresolved.length > 0 && (
        <div className="misconceptions-section">
          <div className="section-header">
            <span>⚠️ Active Issues ({unresolved.length})</span>
          </div>
          {unresolved.map(log => (
            <MisconceptionCard key={log.id} log={log} />
          ))}
        </div>
      )}
      
      {/* Resolved section */}
      {resolved.length > 0 && (
        <div className="misconceptions-section">
          <div className="section-header">
            <span>✅ Resolved ({resolved.length})</span>
          </div>
          {resolved.map(log => (
            <MisconceptionCard key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}

function MisconceptionCard({ log }: { log: MisconceptionLog }) {
  const getSeverityClass = (severity: MisconceptionLog['severity']) => {
    switch (severity) {
      case 'high': return 'severity-high';
      case 'medium': return 'severity-medium';
      case 'low': return 'severity-low';
    }
  };
  
  const getStatusIcon = (status: MisconceptionLog['status']) => {
    switch (status) {
      case 'detected': return '🔍';
      case 'addressed': return '💬';
      case 'resolved': return '✅';
      case 'persisting': return '🔄';
    }
  };
  
  return (
    <div className={`misconception-card ${getSeverityClass(log.severity)} ${log.status}`}>
      {/* Header */}
      <div className="misconception-header">
        <div className="misconception-type">
          <span className="status-icon">{getStatusIcon(log.status)}</span>
          <span className="type-text">{log.misconceptionType.replace(/-/g, ' ')}</span>
        </div>
        <div className="misconception-meta">
          <span className={`severity-badge ${getSeverityClass(log.severity)}`}>
            {log.severity}
          </span>
          {log.recurrenceCount > 1 && (
            <span className="recurrence-badge">
              {log.recurrenceCount}x
            </span>
          )}
        </div>
      </div>
      
      {/* Description */}
      <div className="misconception-description">
        {log.description}
      </div>
      
      {/* Student quote */}
      <div className="student-quote">
        <div className="quote-label">Student said:</div>
        <div className="quote-text">"{log.studentSaid}"</div>
      </div>
      
      {/* Intervention */}
      {log.interventionUsed && (
        <div className="intervention-section">
          <div className="intervention-label">Intervention:</div>
          <div className="intervention-text">{log.interventionUsed}</div>
          {log.piResponse && (
            <div className="pi-response">
              <em>Pi: "{log.piResponse}"</em>
            </div>
          )}
        </div>
      )}
      
      {/* Resolution */}
      {log.resolutionEvidence && (
        <div className="resolution-section">
          <div className="resolution-label">✅ Resolution Evidence:</div>
          <div className="resolution-text">{log.resolutionEvidence}</div>
        </div>
      )}
      
      {/* Related objectives */}
      {log.relatedObjectives.length > 0 && (
        <div className="objectives-affected">
          <span className="objectives-label">Affects:</span>
          {log.relatedObjectives.map((obj, i) => (
            <span key={i} className="objective-tag">{obj}</span>
          ))}
        </div>
      )}
      
      {/* Timestamp */}
      <div className="misconception-timestamp">
        {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
}
