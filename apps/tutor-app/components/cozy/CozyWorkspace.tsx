import { ReactNode } from 'react';
import { TeacherPanelContainer } from '../teacher-panel';
import { SpeechBubbles } from './SpeechBubbles';
import { LessonProgressBar } from './LessonProgressBar';
import '../../styles/cozy-theme.css';
import './StartButton.css';
import './WelcomeAnimations.css';

interface CozyWorkspaceProps {
  // Lesson info
  lessonTitle?: string;
  onBack?: () => void;
  currentMilestoneName?: string;
  
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
  currentMilestoneName,
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
    <div className="clean-workspace clean-text" style={{ paddingTop: '80px' }}>
      {/* Header removed - info shown in GameHeader instead */}

      {/* Progress Bar */}
      {isConnected && totalMilestones > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <LessonProgressBar
            completedMilestones={completedMilestones}
            totalMilestones={totalMilestones}
            currentMilestoneName={currentMilestoneName}
          />
        </div>
      )}

      {/* Speech Bubbles - Last conversation exchange */}
      {isConnected && (piLastMessage || studentLastMessage) && (
        <SpeechBubbles
          piMessage={piLastMessage || ''}
          studentMessage={studentLastMessage || ''}
          piSpeaking={piSpeaking}
          studentSpeaking={studentSpeaking}
        />
      )}

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
            <div className="start-button-container">
              {/* Call-to-action text */}
              <div className="start-button-cta">
                <div className="start-button-cta-text">Click here to begin! ⭐</div>
              </div>
              
              {/* Sparkles around button */}
              <div className="start-button-sparkles">
                <span className="sparkle">✨</span>
                <span className="sparkle">✨</span>
                <span className="sparkle">✨</span>
                <span className="sparkle">✨</span>
              </div>
              
              <button 
                onClick={onConnect} 
                className="start-learning-button start-learning-button-shimmer"
              >
                🎮 Start Learning
              </button>
            </div>
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
