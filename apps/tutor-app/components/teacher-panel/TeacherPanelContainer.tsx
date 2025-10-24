/**
 * Teacher Panel Container
 * 
 * Minimizable panel showing standards coverage, milestone progress,
 * and misconception tracking for teachers/parents.
 */

import { useTeacherPanel } from '@/lib/teacher-panel-store';
import { StandardsCoverageView } from './StandardsCoverageView';
import { MilestoneMasteryView } from './MilestoneMasteryView';
import { MisconceptionLogView } from './MisconceptionLogView';
import './TeacherPanel.css';

export function TeacherPanelContainer() {
  const {
    isExpanded,
    activeTab,
    togglePanel,
    setActiveTab,
    currentSession,
    exportData,
  } = useTeacherPanel();
  
  // Don't show if no active session
  if (!currentSession) {
    return null;
  }
  
  const handleExport = (format: 'json' | 'csv') => {
    try {
      exportData(format);
    } catch (error) {
      console.error('[TeacherPanel] Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };
  
  return (
    <div className={`teacher-panel ${isExpanded ? 'expanded' : 'minimized'}`}>
      {/* Header with toggle */}
      <div className="teacher-panel-header" onClick={togglePanel}>
        <div className="header-content">
          <span className="panel-icon">📊</span>
          <span className="panel-title">Teacher Panel</span>
          <span className="toggle-icon">{isExpanded ? '▼' : '▲'}</span>
        </div>
        {!isExpanded && (
          <div className="header-summary">
            <span className="summary-badge">
              {currentSession.milestonesCompleted}/{currentSession.milestonesTotal} milestones
            </span>
            {currentSession.misconceptionsDetected > 0 && (
              <span className="summary-badge warning">
                {currentSession.misconceptionsDetected} issues
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Expanded content */}
      {isExpanded && (
        <div className="teacher-panel-content">
          {/* Tab navigation */}
          <div className="panel-tabs">
            <button
              className={`tab-button ${activeTab === 'standards' ? 'active' : ''}`}
              onClick={() => setActiveTab('standards')}
            >
              📚 Standards
            </button>
            <button
              className={`tab-button ${activeTab === 'milestones' ? 'active' : ''}`}
              onClick={() => setActiveTab('milestones')}
            >
              🎯 Milestones
            </button>
            <button
              className={`tab-button ${activeTab === 'misconceptions' ? 'active' : ''}`}
              onClick={() => setActiveTab('misconceptions')}
            >
              ⚠️ Misconceptions
              {currentSession.misconceptionsDetected > 0 && (
                <span className="tab-badge">{currentSession.misconceptionsDetected}</span>
              )}
            </button>
          </div>
          
          {/* Tab content */}
          <div className="panel-body">
            {activeTab === 'standards' && <StandardsCoverageView />}
            {activeTab === 'milestones' && <MilestoneMasteryView />}
            {activeTab === 'misconceptions' && <MisconceptionLogView />}
          </div>
          
          {/* Footer with export */}
          <div className="panel-footer">
            <div className="footer-info">
              <span>Lesson: {currentSession.lessonTitle}</span>
              <span>•</span>
              <span>{currentSession.percentComplete}% Complete</span>
            </div>
            <div className="footer-actions">
              <button
                className="export-button"
                onClick={() => handleExport('json')}
                title="Export as JSON"
              >
                📥 JSON
              </button>
              <button
                className="export-button"
                onClick={() => handleExport('csv')}
                title="Export as CSV"
              >
                📥 CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
