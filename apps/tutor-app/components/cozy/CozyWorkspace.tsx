import { ReactNode } from 'react';
import { TeacherPanelContainer } from '../teacher-panel';
import '../../styles/cozy-theme.css';

interface CozyWorkspaceProps {
  // Lesson info
  lessonTitle?: string;
  onBack?: () => void;
  
  // Progress for constellation
  totalMilestones?: number;
  completedMilestones?: number;
  // Audio states
  isConnected: boolean;
  piSpeaking: boolean;
  studentSpeaking: boolean;
  piLastMessage?: string;
  studentLastMessage?: string;
  
  // Content
  lessonImage: ReactNode;
  canvas: ReactNode;
  
  // Control handlers
  onConnect: () => void;
  onDisconnect: () => void;
  onMuteToggle: () => void;
  onHelp: () => void;
  onExport: () => void;
  onReset: () => void;
  isMuted: boolean;
}

// Avatar generator using DiceBear
function generateAvatar(seed: string, type: 'pi' | 'student') {
  const baseUrl = 'https://api.dicebear.com/7.x';
  const style = type === 'pi' ? 'bottts-neutral' : 'adventurer';
  return `${baseUrl}/${style}/svg?seed=${seed}&backgroundColor=transparent`;
}

export function CozyWorkspace({
  lessonTitle = 'Learning Session',
  onBack,
  isConnected,
  piSpeaking,
  studentSpeaking,
  piLastMessage,
  studentLastMessage,
  lessonImage,
  canvas,
  onConnect,
  onDisconnect,
  onMuteToggle,
  onHelp,
  onExport,
  onReset,
  isMuted,
  totalMilestones = 0,
  completedMilestones = 0,
}: CozyWorkspaceProps) {
  const piAvatarUrl = generateAvatar('pi-tutor', 'pi');
  const studentAvatarUrl = generateAvatar('student-' + Date.now(), 'student');

  return (
    <div className="clean-workspace clean-text">
      {/* Header */}
      <div className="clean-workspace-header">
        {onBack && (
          <button className="clean-icon-button" onClick={onBack}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        <h1 className="clean-workspace-title">{lessonTitle}</h1>
        <div style={{ width: '48px' }} /> {/* Spacer for center alignment */}
      </div>

      {/* Main Content: Image + Canvas */}
      <div className="clean-workspace-top">
        {/* Left Panel: Lesson Image */}
        <div className="clean-panel">
          <div className="clean-panel-header">
            <span className="clean-panel-icon">🔍</span>
            <div>
              <div className="clean-text-heading">Today's Challenge</div>
              <div className="clean-text-label">Let's solve this together</div>
            </div>
          </div>
          <div className="clean-panel-content" style={{
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'auto',
          }}>
            {lessonImage}
          </div>
        </div>

        {/* Right Panel: Canvas */}
        <div className="clean-panel">
          <div className="clean-panel-header">
            <span className="clean-panel-icon">✏️</span>
            <div>
              <div className="clean-text-heading">Your Workspace</div>
              <div className="clean-text-label">Draw and explore</div>
            </div>
          </div>
          <div className="clean-panel-content" style={{
            position: 'relative',
            overflow: 'hidden',
          }}>
            {canvas}
          </div>
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="clean-workspace-bottom">
        {/* Left: Pi Avatar + Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className={`clean-avatar ${piSpeaking ? 'speaking' : ''}`}>
            <img src={piAvatarUrl} alt="Pi" />
          </div>
          <div>
            <div className="clean-text-heading" style={{ fontSize: '16px', marginBottom: '2px' }}>
              Pi
            </div>
            <div className="clean-text-label">
              {!isConnected ? '😴 Resting' : piSpeaking ? '💬 Helping!' : '👀 Watching'}
            </div>
          </div>
        </div>

        {/* Center: Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Progress Badge */}
          {totalMilestones > 0 && (
            <div className="clean-badge clean-badge-primary">
              <span>⭐ {completedMilestones}/{totalMilestones}</span>
            </div>
          )}

          {/* Primary Actions */}
          {!isConnected ? (
            <button onClick={onConnect} className="clean-button clean-button-primary">
              🎮 Start Learning
            </button>
          ) : (
            <>
              <button onClick={onDisconnect} className="clean-button clean-button-danger">
                ⏸️ Pause
              </button>
              <button onClick={onMuteToggle} className={`clean-button ${!isMuted ? 'clean-button-success' : ''}`}>
                {isMuted ? '🔇 Unmute' : '🎤 Mic On'}
              </button>
            </>
          )}

          <div className="clean-divider" style={{ height: '32px' }} />

          <button onClick={onHelp} className="clean-button" title="Ask for help">
            💬 Help
          </button>
          <button onClick={onExport} className="clean-button" title="Export work">
            💾
          </button>
          <button onClick={onReset} className="clean-button" title="Reset session">
            🔄
          </button>
        </div>

        {/* Right: Student Avatar + Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            <div className="clean-text-heading" style={{ fontSize: '16px', marginBottom: '2px', textAlign: 'right' }}>
              You
            </div>
            <div className="clean-text-label" style={{ textAlign: 'right' }}>
              {studentSpeaking ? '✨ Exploring!' : '🎮 Ready!'}
            </div>
          </div>
          <div className={`clean-avatar ${studentSpeaking ? 'speaking' : ''}`}>
            <img src={studentAvatarUrl} alt="Student" />
          </div>
        </div>
      </div>
      
      {/* Teacher Panel - Minimizable analytics */}
      <TeacherPanelContainer />
    </div>
  );
}
