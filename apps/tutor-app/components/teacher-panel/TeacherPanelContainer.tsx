/**
 * Teacher Panel Container - Clean Redesign
 * 
 * Minimalist side panel for tracking student progress.
 * Single-scroll design with collapsible sections and smart empty states.
 */

import { useState } from 'react';
import { useTeacherPanel } from '@/lib/teacher-panel-store';
import { useLogStore } from '@/lib/state';
import { StandardsCoverageView } from './StandardsCoverageView';
import { MilestoneMasteryView } from './MilestoneMasteryView';
import { MisconceptionLogView } from './MisconceptionLogView';
import { TranscriptView } from './TranscriptView';
import { PrerequisiteDetectionView } from './PrerequisiteDetectionView';
import { AgentActivityView } from './AgentActivityView';
import './TeacherPanel.css';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚠️ DEBUG ONLY - Agent Monitoring
// TO REMOVE: Delete this import when removing debug features
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useAgentDebugStore } from '@/lib/agent-debug-store';

export function TeacherPanelContainer() {
  const {
    isExpanded,
    togglePanel,
    currentSession,
    standardsCoverage,
    milestoneLogs,
    misconceptionLogs,
    exportData,
  } = useTeacherPanel();
  
  const [expandedSection, setExpandedSection] = useState<string | null>('transcript');
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⚠️ DEBUG ONLY - Agent Activity Monitoring
  // TO REMOVE: Delete these lines
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const debugActivities = useAgentDebugStore(state => state.activities);
  const debugPrerequisiteGaps = useAgentDebugStore(state => state.prerequisiteGaps);
  const isDebugMode = useAgentDebugStore(state => state.isDebugMode);
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  // Don't show if no active session
  if (!currentSession) {
    return (
      <div className={`teacher-panel ${isExpanded ? 'expanded' : 'minimized'}`}>
        <div className="teacher-panel-tab" onClick={togglePanel}>
          <span>📊</span>
          <span>{isExpanded ? 'Close' : 'Teacher Panel'}</span>
        </div>
        {isExpanded && (
          <div className="teacher-panel-content">
            <div className="panel-body">
              <div className="empty-state-hero">
                <div className="empty-icon">📊</div>
                <h3 className="empty-title">Teacher Panel</h3>
                <p className="empty-description">
                  Track student progress in real-time during lessons.
                </p>
                <div className="empty-features">
                  <div className="empty-feature">
                    <span>🎯</span>
                    <span>Milestone tracking</span>
                  </div>
                  <div className="empty-feature">
                    <span>📚</span>
                    <span>Standards coverage</span>
                  </div>
                  <div className="empty-feature">
                    <span>💡</span>
                    <span>Learning insights</span>
                  </div>
                </div>
                <p className="empty-hint">Start a lesson to begin tracking</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  const handleExport = (format: 'json' | 'csv') => {
    try {
      exportData(format);
    } catch (error) {
      console.error('[TeacherPanel] Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };
  
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };
  
  const activeMisconceptions = misconceptionLogs.filter(m => m.status !== 'resolved').length;
  const completedMilestones = milestoneLogs.filter(m => m.status === 'completed').length;
  const turns = useLogStore(state => state.turns);
  const transcriptCount = turns.length;
  
  return (
    <div className={`teacher-panel ${isExpanded ? 'expanded' : 'minimized'}`}>
      {/* Tab Button - Positioned in header */}
      <div className="teacher-panel-tab" onClick={togglePanel}>
        <span>📊</span>
        <span>{isExpanded ? 'Close' : 'Teacher Panel'}</span>
      </div>
      
      {/* Panel Content (only visible when expanded) */}
      {isExpanded && (
        <div className="teacher-panel-content">
          {/* Header - Key Metrics */}
          <div className="teacher-panel-header-clean">
            <div className="lesson-title">{currentSession.lessonTitle}</div>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-value">{completedMilestones}</div>
                <div className="metric-label">Milestones</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{standardsCoverage.length}</div>
                <div className="metric-label">Standards</div>
              </div>
              <div className={`metric-card ${activeMisconceptions > 0 ? 'alert' : ''}`}>
                <div className="metric-value">{activeMisconceptions}</div>
                <div className="metric-label">Active Issues</div>
              </div>
            </div>
          </div>
          
          {/* Scrollable Content - Collapsible Sections */}
          <div className="panel-body-clean">
            {/* Transcript Section */}
            <CollapsibleSection
              title="Transcript"
              icon="💬"
              count={transcriptCount}
              isExpanded={expandedSection === 'transcript'}
              onToggle={() => toggleSection('transcript')}
            >
              <TranscriptView />
            </CollapsibleSection>
            
            {/* Milestones Section */}
            <CollapsibleSection
              title="Milestones"
              icon="🎯"
              count={milestoneLogs.length}
              isExpanded={expandedSection === 'milestones'}
              onToggle={() => toggleSection('milestones')}
            >
              <MilestoneMasteryView />
            </CollapsibleSection>
            
            {/* Issues Section */}
            {(misconceptionLogs.length > 0 || activeMisconceptions > 0) && (
              <CollapsibleSection
                title="Learning Issues"
                icon="💡"
                count={activeMisconceptions}
                isExpanded={expandedSection === 'misconceptions'}
                onToggle={() => toggleSection('misconceptions')}
                badge={activeMisconceptions > 0 ? 'needs attention' : undefined}
              >
                <MisconceptionLogView />
              </CollapsibleSection>
            )}
            
            {/* Standards Section */}
            <CollapsibleSection
              title="Standards Coverage"
              icon="📚"
              count={standardsCoverage.length}
              isExpanded={expandedSection === 'standards'}
              onToggle={() => toggleSection('standards')}
            >
              <StandardsCoverageView />
            </CollapsibleSection>
            
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* ⚠️ DEBUG ONLY - Agent Monitoring Sections */}
            {/* TO REMOVE: Delete these 2 sections when removing debug */}
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {isDebugMode && (
              <>
                {/* Agent Activity Section (DEBUG) */}
                <CollapsibleSection
                  title="Agent Activity"
                  icon="🤖"
                  count={debugActivities.length}
                  isExpanded={expandedSection === 'agents'}
                  onToggle={() => toggleSection('agents')}
                  badge="DEBUG"
                >
                  <AgentActivityView activities={debugActivities} />
                </CollapsibleSection>
                
                {/* Prerequisite Detection Section (DEBUG) */}
                <CollapsibleSection
                  title="Prerequisite Detection"
                  icon="🎯"
                  count={debugPrerequisiteGaps.filter(g => !g.resolved).length}
                  isExpanded={expandedSection === 'prerequisites'}
                  onToggle={() => toggleSection('prerequisites')}
                  badge="DEBUG"
                >
                  <PrerequisiteDetectionView 
                    gaps={debugPrerequisiteGaps} 
                    isActive={debugActivities.some(a => a.agent === 'prerequisite' && a.status === 'running')} 
                  />
                </CollapsibleSection>
              </>
            )}
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* END DEBUG SECTIONS */}
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          </div>
          
          {/* Footer - Minimal */}
          <div className="panel-footer-clean">
            <button
              className="export-button-clean"
              onClick={() => handleExport('json')}
              title="Export session data"
            >
              📥 Export
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface CollapsibleSectionProps {
  title: string;
  icon: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  badge?: string;
  children: React.ReactNode;
}

function CollapsibleSection({ 
  title, 
  icon, 
  count, 
  isExpanded, 
  onToggle, 
  badge,
  children 
}: CollapsibleSectionProps) {
  return (
    <div className="collapsible-section">
      <button className="section-toggle" onClick={onToggle}>
        <div className="section-header-left">
          <span className="section-icon">{icon}</span>
          <span className="section-title">{title}</span>
          {count > 0 && <span className="section-count">{count}</span>}
          {badge && <span className="section-badge">{badge}</span>}
        </div>
        <span className="section-arrow">{isExpanded ? '−' : '+'}</span>
      </button>
      {isExpanded && (
        <div className="section-content">
          {children}
        </div>
      )}
    </div>
  );
}
