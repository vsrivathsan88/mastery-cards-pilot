/**
 * Agent Activity View - Real-Time Multi-Agent Monitoring
 * 
 * Shows all 3 subagents (Misconception, Emotional, Prerequisite) running in parallel
 */

import { useEffect, useState } from 'react';

interface AgentActivity {
  turn: number;
  timestamp: number;
  agent: 'misconception' | 'emotional' | 'prerequisite';
  status: 'running' | 'complete' | 'error';
  duration?: number;
  result?: any;
}

interface AgentActivityProps {
  activities: AgentActivity[];
}

export function AgentActivityView({ activities }: AgentActivityProps) {
  const [recentActivities, setRecentActivities] = useState<AgentActivity[]>([]);
  const [stats, setStats] = useState({
    misconception: { runs: 0, avgDuration: 0 },
    emotional: { runs: 0, avgDuration: 0 },
    prerequisite: { runs: 0, avgDuration: 0 },
  });
  
  useEffect(() => {
    // Sort by timestamp, most recent first
    const sorted = [...activities].sort((a, b) => b.timestamp - a.timestamp);
    setRecentActivities(sorted.slice(0, 20)); // Last 20 activities
    
    // Calculate stats
    const misconceptionActivities = activities.filter(a => a.agent === 'misconception' && a.duration);
    const emotionalActivities = activities.filter(a => a.agent === 'emotional' && a.duration);
    const prerequisiteActivities = activities.filter(a => a.agent === 'prerequisite' && a.duration);
    
    setStats({
      misconception: {
        runs: misconceptionActivities.length,
        avgDuration: misconceptionActivities.length > 0
          ? Math.round(misconceptionActivities.reduce((sum, a) => sum + (a.duration || 0), 0) / misconceptionActivities.length)
          : 0,
      },
      emotional: {
        runs: emotionalActivities.length,
        avgDuration: emotionalActivities.length > 0
          ? Math.round(emotionalActivities.reduce((sum, a) => sum + (a.duration || 0), 0) / emotionalActivities.length)
          : 0,
      },
      prerequisite: {
        runs: prerequisiteActivities.length,
        avgDuration: prerequisiteActivities.length > 0
          ? Math.round(prerequisiteActivities.reduce((sum, a) => sum + (a.duration || 0), 0) / prerequisiteActivities.length)
          : 0,
      },
    });
  }, [activities]);
  
  const currentlyRunning = recentActivities.filter(a => a.status === 'running');
  
  return (
    <div className="agent-activity-view">
      {/* Live Status */}
      <div className="live-status">
        {currentlyRunning.length > 0 ? (
          <div className="status-running">
            <div className="pulse-indicator" />
            <span>🤖 {currentlyRunning.length} Agent{currentlyRunning.length > 1 ? 's' : ''} Running</span>
          </div>
        ) : (
          <div className="status-idle">
            ⏸️ Agents Idle
          </div>
        )}
      </div>
      
      {/* Agent Stats */}
      <div className="agent-stats">
        <div className="agent-stat-card misconception">
          <div className="agent-icon">🧠</div>
          <div className="agent-info">
            <div className="agent-name">Misconception</div>
            <div className="agent-metrics">
              <span>{stats.misconception.runs} runs</span>
              <span className="divider">•</span>
              <span>~{stats.misconception.avgDuration}ms</span>
            </div>
          </div>
        </div>
        
        <div className="agent-stat-card emotional">
          <div className="agent-icon">😊</div>
          <div className="agent-info">
            <div className="agent-name">Emotional</div>
            <div className="agent-metrics">
              <span>{stats.emotional.runs} runs</span>
              <span className="divider">•</span>
              <span>~{stats.emotional.avgDuration}ms</span>
            </div>
          </div>
        </div>
        
        <div className="agent-stat-card prerequisite">
          <div className="agent-icon">🎯</div>
          <div className="agent-info">
            <div className="agent-name">Prerequisite</div>
            <div className="agent-metrics">
              <span>{stats.prerequisite.runs} runs</span>
              <span className="divider">•</span>
              <span>~{stats.prerequisite.avgDuration}ms</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Activity Timeline */}
      <div className="activity-timeline">
        <div className="timeline-header">
          <h4>Activity Timeline</h4>
          <span className="timeline-count">{recentActivities.length} recent</span>
        </div>
        
        {recentActivities.length === 0 ? (
          <div className="empty-state-small">
            <p>No agent activity yet</p>
            <p className="hint">Agents analyze student responses in real-time</p>
          </div>
        ) : (
          <div className="timeline-entries">
            {recentActivities.map((activity, index) => (
              <div 
                key={`${activity.timestamp}-${activity.agent}-${index}`}
                className={`timeline-entry ${activity.agent} ${activity.status}`}
              >
                <div className="timeline-marker" />
                <div className="timeline-content">
                  <div className="timeline-main">
                    <div className="timeline-agent">
                      {getAgentIcon(activity.agent)} {activity.agent}
                    </div>
                    <div className="timeline-turn">Turn {activity.turn}</div>
                  </div>
                  
                  <div className="timeline-meta">
                    <span className={`status-badge ${activity.status}`}>
                      {activity.status}
                    </span>
                    {activity.duration && (
                      <span className="duration-badge">
                        ⏱️ {activity.duration}ms
                      </span>
                    )}
                    <span className="time-badge">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                  
                  {/* Result Preview */}
                  {activity.result && activity.status === 'complete' && (
                    <div className="timeline-result">
                      {formatResult(activity.agent, activity.result)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <style jsx>{`
        .agent-activity-view {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .live-status {
          padding: 12px;
          background: rgba(0, 0, 0, 0.02);
          border-radius: 8px;
          text-align: center;
        }
        
        .status-running {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #16a34a;
          font-weight: 600;
        }
        
        .pulse-indicator {
          width: 8px;
          height: 8px;
          background: #16a34a;
          border-radius: 50%;
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
        }
        
        .status-idle {
          color: #64748b;
          font-weight: 500;
        }
        
        .agent-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        
        .agent-stat-card {
          padding: 12px;
          background: white;
          border: 2px solid rgba(0, 0, 0, 0.06);
          border-radius: 8px;
          display: flex;
          gap: 12px;
          align-items: center;
        }
        
        .agent-stat-card.misconception {
          border-color: rgba(168, 85, 247, 0.2);
        }
        
        .agent-stat-card.emotional {
          border-color: rgba(59, 130, 246, 0.2);
        }
        
        .agent-stat-card.prerequisite {
          border-color: rgba(34, 197, 94, 0.2);
        }
        
        .agent-icon {
          font-size: 24px;
        }
        
        .agent-info {
          flex: 1;
        }
        
        .agent-name {
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 4px;
        }
        
        .agent-metrics {
          font-size: 11px;
          color: #64748b;
          display: flex;
          gap: 6px;
          align-items: center;
        }
        
        .agent-metrics .divider {
          color: #cbd5e1;
        }
        
        .activity-timeline {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: rgba(0, 0, 0, 0.02);
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }
        
        .timeline-header h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
        }
        
        .timeline-count {
          font-size: 12px;
          color: #64748b;
        }
        
        .timeline-entries {
          max-height: 400px;
          overflow-y: auto;
        }
        
        .timeline-entry {
          display: flex;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }
        
        .timeline-entry:last-child {
          border-bottom: none;
        }
        
        .timeline-marker {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-top: 6px;
          flex-shrink: 0;
        }
        
        .timeline-entry.misconception .timeline-marker {
          background: #a855f7;
        }
        
        .timeline-entry.emotional .timeline-marker {
          background: #3b82f6;
        }
        
        .timeline-entry.prerequisite .timeline-marker {
          background: #22c55e;
        }
        
        .timeline-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .timeline-main {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .timeline-agent {
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
          text-transform: capitalize;
        }
        
        .timeline-turn {
          font-size: 11px;
          color: #64748b;
          background: rgba(0, 0, 0, 0.04);
          padding: 2px 6px;
          border-radius: 4px;
        }
        
        .timeline-meta {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        
        .status-badge,
        .duration-badge,
        .time-badge {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
        }
        
        .status-badge.complete {
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
        }
        
        .status-badge.running {
          background: rgba(251, 191, 36, 0.1);
          color: #f59e0b;
        }
        
        .status-badge.error {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }
        
        .duration-badge {
          background: rgba(59, 130, 246, 0.1);
          color: #2563eb;
        }
        
        .time-badge {
          background: rgba(0, 0, 0, 0.04);
          color: #64748b;
        }
        
        .timeline-result {
          padding: 8px;
          background: rgba(0, 0, 0, 0.02);
          border-radius: 4px;
          font-size: 12px;
          color: #475569;
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

function getAgentIcon(agent: string): string {
  switch (agent) {
    case 'misconception':
      return '🧠';
    case 'emotional':
      return '😊';
    case 'prerequisite':
      return '🎯';
    default:
      return '🤖';
  }
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

function formatResult(agent: string, result: any): string {
  if (agent === 'misconception') {
    return result.detected
      ? `⚠️ Detected: ${result.type || 'Unknown'} (${Math.round((result.confidence || 0) * 100)}%)`
      : '✓ No misconceptions detected';
  }
  
  if (agent === 'emotional') {
    return `State: ${result.state} | Engagement: ${Math.round((result.engagementLevel || 0) * 100)}%`;
  }
  
  if (agent === 'prerequisite') {
    return result.checked
      ? `Checked ${result.results?.length || 0} prerequisites | ${result.criticalGaps} gap(s)`
      : 'No prerequisites checked';
  }
  
  return 'Complete';
}
