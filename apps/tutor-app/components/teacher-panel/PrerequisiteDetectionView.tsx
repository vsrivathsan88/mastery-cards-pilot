/**
 * Prerequisite Detection View - Real-Time Monitoring
 * 
 * Shows invisible assessment system detecting prerequisite gaps
 */

import { useEffect, useState } from 'react';

interface PrerequisiteGap {
  turn: number;
  timestamp: number;
  prerequisiteId: string;
  concept: string;
  status: 'GAP_DETECTED' | 'PREREQUISITE_MET' | 'UNCLEAR' | 'PROBE_DEEPER';
  confidence: number;
  evidence?: string;
  nextAction: 'CONTINUE_LESSON' | 'TEACH_PREREQUISITE' | 'PROBE_DEEPER' | 'RE_ASSESS';
  detectedGap?: {
    type: 'UNKNOWN_CONCEPT' | 'WRONG_INTUITION' | 'CONFUSION' | 'AVOIDANCE';
    severity: 'critical' | 'moderate' | 'minor';
    recommendation: string;
  };
  resolved?: boolean;
}

interface PrerequisiteDetectionProps {
  gaps: PrerequisiteGap[];
  isActive: boolean;
}

export function PrerequisiteDetectionView({ gaps, isActive }: PrerequisiteDetectionProps) {
  const [latestGaps, setLatestGaps] = useState<PrerequisiteGap[]>([]);
  
  useEffect(() => {
    // Sort by timestamp, most recent first
    const sorted = [...gaps].sort((a, b) => b.timestamp - a.timestamp);
    setLatestGaps(sorted.slice(0, 10)); // Show last 10
  }, [gaps]);
  
  const unresolvedGaps = latestGaps.filter(g => !g.resolved && g.status === 'GAP_DETECTED');
  const criticalGaps = unresolvedGaps.filter(g => g.detectedGap?.severity === 'critical');
  
  return (
    <div className="prerequisite-detection-view">
      {/* Status Header */}
      <div className="detection-status">
        <div className={`status-indicator ${isActive ? 'active' : 'inactive'}`}>
          {isActive ? '🔍 Checking Prerequisites' : '⏸️ Not Active'}
        </div>
        
        {criticalGaps.length > 0 && (
          <div className="critical-alert">
            ⚠️ {criticalGaps.length} Critical Gap{criticalGaps.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
      
      {/* Summary Stats */}
      <div className="detection-summary">
        <div className="stat-card">
          <div className="stat-label">Total Checked</div>
          <div className="stat-value">{gaps.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Gaps Found</div>
          <div className="stat-value critical">{unresolvedGaps.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Resolved</div>
          <div className="stat-value success">{gaps.filter(g => g.resolved).length}</div>
        </div>
      </div>
      
      {/* Gap Log */}
      <div className="gap-log">
        {latestGaps.length === 0 ? (
          <div className="empty-state-small">
            <p>No prerequisite checks yet</p>
            <p className="hint">Assessment happens during wonder hooks and early milestones</p>
          </div>
        ) : (
          latestGaps.map((gap, index) => (
            <div 
              key={`${gap.turn}-${gap.prerequisiteId}-${index}`}
              className={`gap-entry ${gap.status.toLowerCase()} ${gap.resolved ? 'resolved' : ''}`}
            >
              {/* Header */}
              <div className="gap-header">
                <div className="gap-concept">
                  {getStatusIcon(gap.status)} {gap.concept}
                </div>
                <div className="gap-turn">Turn {gap.turn}</div>
              </div>
              
              {/* Status Badge */}
              <div className="gap-badges">
                <span className={`badge status-${gap.status.toLowerCase()}`}>
                  {gap.status.replace('_', ' ')}
                </span>
                <span className="badge confidence">
                  {Math.round(gap.confidence * 100)}% confident
                </span>
                {gap.detectedGap && (
                  <span className={`badge severity-${gap.detectedGap.severity}`}>
                    {gap.detectedGap.severity}
                  </span>
                )}
              </div>
              
              {/* Evidence */}
              {gap.evidence && (
                <div className="gap-evidence">
                  <strong>Evidence:</strong> "{gap.evidence}"
                </div>
              )}
              
              {/* Gap Details (if gap detected) */}
              {gap.detectedGap && (
                <div className="gap-details">
                  <div className="gap-type">
                    <strong>Type:</strong> {gap.detectedGap.type.replace(/_/g, ' ')}
                  </div>
                  <div className="gap-recommendation">
                    <strong>Recommendation:</strong> {gap.detectedGap.recommendation}
                  </div>
                </div>
              )}
              
              {/* Next Action */}
              <div className="gap-action">
                <strong>Next Action:</strong>{' '}
                <span className={`action-${gap.nextAction.toLowerCase()}`}>
                  {formatAction(gap.nextAction)}
                </span>
              </div>
              
              {/* Resolution Status */}
              {gap.resolved && (
                <div className="gap-resolved">
                  ✅ Resolved - Student demonstrated understanding
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      <style jsx>{`
        .prerequisite-detection-view {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .detection-status {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: rgba(0, 0, 0, 0.02);
          border-radius: 8px;
        }
        
        .status-indicator {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
        }
        
        .status-indicator.active {
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
        }
        
        .status-indicator.inactive {
          background: rgba(100, 116, 139, 0.1);
          color: #64748b;
        }
        
        .critical-alert {
          padding: 6px 12px;
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
        }
        
        .detection-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        
        .stat-card {
          padding: 12px;
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 8px;
          text-align: center;
        }
        
        .stat-label {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 4px;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
        }
        
        .stat-value.critical {
          color: #dc2626;
        }
        
        .stat-value.success {
          color: #16a34a;
        }
        
        .gap-log {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 400px;
          overflow-y: auto;
        }
        
        .gap-entry {
          padding: 16px;
          background: white;
          border: 2px solid rgba(0, 0, 0, 0.06);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .gap-entry.gap_detected {
          border-color: #fbbf24;
          background: rgba(251, 191, 36, 0.02);
        }
        
        .gap-entry.prerequisite_met {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.02);
        }
        
        .gap-entry.resolved {
          opacity: 0.6;
        }
        
        .gap-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .gap-concept {
          font-size: 15px;
          font-weight: 600;
          color: #0f172a;
        }
        
        .gap-turn {
          font-size: 12px;
          color: #64748b;
          background: rgba(0, 0, 0, 0.04);
          padding: 4px 8px;
          border-radius: 4px;
        }
        
        .gap-badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .badge.status-gap_detected {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }
        
        .badge.status-prerequisite_met {
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
        }
        
        .badge.status-unclear,
        .badge.status-probe_deeper {
          background: rgba(251, 191, 36, 0.1);
          color: #f59e0b;
        }
        
        .badge.confidence {
          background: rgba(59, 130, 246, 0.1);
          color: #2563eb;
        }
        
        .badge.severity-critical {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }
        
        .badge.severity-moderate {
          background: rgba(251, 191, 36, 0.1);
          color: #f59e0b;
        }
        
        .badge.severity-minor {
          background: rgba(59, 130, 246, 0.1);
          color: #2563eb;
        }
        
        .gap-evidence,
        .gap-details,
        .gap-action {
          font-size: 13px;
          color: #475569;
        }
        
        .gap-evidence {
          padding: 8px;
          background: rgba(0, 0, 0, 0.02);
          border-radius: 4px;
          font-style: italic;
        }
        
        .gap-type,
        .gap-recommendation {
          margin-top: 4px;
        }
        
        .gap-action {
          padding-top: 8px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }
        
        .action-teach_prerequisite {
          color: #dc2626;
          font-weight: 600;
        }
        
        .action-continue_lesson {
          color: #16a34a;
          font-weight: 600;
        }
        
        .action-probe_deeper,
        .action-re_assess {
          color: #f59e0b;
          font-weight: 600;
        }
        
        .gap-resolved {
          padding: 8px;
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
          text-align: center;
        }
        
        .empty-state-small {
          padding: 32px;
          text-align: center;
          color: #94a3b8;
        }
        
        .empty-state-small p {
          margin: 8px 0;
        }
        
        .empty-state-small .hint {
          font-size: 12px;
          color: #cbd5e1;
        }
      `}</style>
    </div>
  );
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'GAP_DETECTED':
      return '⚠️';
    case 'PREREQUISITE_MET':
      return '✅';
    case 'UNCLEAR':
      return '❓';
    case 'PROBE_DEEPER':
      return '🔍';
    default:
      return '•';
  }
}

function formatAction(action: string): string {
  return action
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
