import { ReactNode, RefObject, useState, useEffect } from 'react';
import { TeacherPanelContainer } from '../teacher-panel';
// import { SpeechBubbles } from './SpeechBubbles'; // REMOVED: Too cluttered
import { LessonProgressBar } from './LessonProgressBar';
import { LessonCanvasRef } from '../LessonCanvas';
import { useUser } from '../../contexts/UserContext';
import { generateAvatarUrl } from '../../lib/avatar-utils';
import '../../styles/cozy-theme.css';
import './StartButton.css';
import './WelcomeAnimations.css';

// Filter out Gemini's inner dialogue
const filterThinkingContent = (text: string): string => {
  if (!text) return text;
  
  let filtered = text;
  
  // Remove explicit thinking tags
  filtered = filtered.replace(/<think>.*?<\/think>/gis, ' ');
  filtered = filtered.replace(/:::thinking:::.*?:::/gis, ' ');
  filtered = filtered.replace(/\[THINKING\].*?\[\/THINKING\]/gis, ' ');
  
  // Remove meta-commentary about crafting responses
  filtered = filtered.replace(/\*\*[^*]+\*\*\s*(?:I've|I'm|The|This|Now|Let me).{0,500}?(?=(?:[.!?]\s+(?:[A-Z]|$))|$)/gis, ' ');
  
  // Remove specific thinking patterns
  filtered = filtered.replace(/(?:^|\.\s+)(?:I've acknowledged|I'm now|I've crafted|The plan is|I can hear you|I should|I need to|I'll|Let me think|First,? I|The strategy|My approach).{0,300}?(?=[.!?](?:\s|$)|$)/gis, ' ');
  
  // Remove parenthetical thinking
  filtered = filtered.replace(/\([^)]*(?:strategy|approach|thinking|reasoning|plan|internally)[^)]*\)/gi, ' ');
  
  // Remove "Okay" or "Alright" sentence fragments that are thinking artifacts
  filtered = filtered.replace(/^(?:Okay|Alright|Right|Got it)[.,!]\s*/i, '');
  
  // Clean up whitespace
  filtered = filtered.replace(/\s+/g, ' ').trim();
  
  // If we filtered out everything, return empty
  if (!filtered || filtered.length < 3) return '';
  
  return filtered;
};

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
  canvasRef?: RefObject<LessonCanvasRef>;
  onCanvasChange?: (hasContent: boolean) => void;
  
  // Control handlers
  onConnect: () => void;
  onDisconnect: () => void;
  onMuteToggle: () => void;
  onHelp: () => void;
  onExport: () => void;
  onReset: () => void;
  isMuted: boolean;
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
  const { userData } = useUser();
  
  // Use the actual Pi illustration and student's selected avatar
  const piAvatarUrl = '/illustrations/pi.png';
  const studentAvatarUrl = userData?.avatar 
    ? generateAvatarUrl(userData.avatar, 80)
    : generateAvatarUrl('adventurer-1', 80); // Fallback
  
  // Transcription display state (fades after 5 seconds)
  const [showTranscript, setShowTranscript] = useState(false);
  const [displayMessage, setDisplayMessage] = useState('');
  const [displayRole, setDisplayRole] = useState<'pi' | 'student'>('pi');
  
  // Update display when Pi's message changes
  useEffect(() => {
    if (piLastMessage && piLastMessage.trim()) {
      const filtered = filterThinkingContent(piLastMessage);
      if (filtered && filtered.trim()) {
        setDisplayRole('pi');
        setDisplayMessage(filtered);
        setShowTranscript(true);
        
        // Fade out after 5 seconds
        const timer = setTimeout(() => {
          setShowTranscript(false);
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [piLastMessage]);
  
  // Update display when student's message changes
  useEffect(() => {
    if (studentLastMessage && studentLastMessage.trim()) {
      const filtered = filterThinkingContent(studentLastMessage);
      if (filtered && filtered.trim()) {
        setDisplayRole('student');
        setDisplayMessage(filtered);
        setShowTranscript(true);
        
        // Fade out after 5 seconds
        const timer = setTimeout(() => {
          setShowTranscript(false);
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [studentLastMessage]);

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

      {/* Speech Bubbles - REMOVED: Too cluttered, transcription available in Chat Log tab */}

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

        {/* Center: Transcription + Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
          {/* Transcription Display */}
          {isConnected && showTranscript && displayMessage && (
            <div style={{
              padding: '8px 16px',
              backgroundColor: displayRole === 'pi' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              border: `1px solid ${displayRole === 'pi' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              borderRadius: '8px',
              fontSize: '13px',
              lineHeight: '1.5',
              color: '#1e293b',
              maxWidth: '600px',
              maxHeight: '4.5em', // ~3 lines
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              animation: 'fadeIn 0.3s ease-in',
              transition: 'opacity 0.5s ease-out',
              opacity: showTranscript ? 1 : 0,
            }}>
              <span style={{ fontWeight: '600', marginRight: '6px' }}>
                {displayRole === 'pi' ? '💬 Pi:' : '💬 You:'}
              </span>
              {displayMessage}
            </div>
          )}
          
          {/* Controls */}
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
