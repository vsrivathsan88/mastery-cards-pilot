import { useLiveAPIContext } from '../../contexts/LiveAPIContext';
import { useUser } from '../../contexts/UserContext';
import { useLessonStore } from '@/lib/state';

export function GameHeader() {
  const { connected, client } = useLiveAPIContext();
  const { userData } = useUser();
  const { currentLesson, progress } = useLessonStore();

  const connectionStatus = connected ? 'Connected' : 'Offline';
  const connectionColor = connected ? '#10b981' : '#94a3b8';
  const connectionGlow = connected ? '0 0 20px rgba(16, 185, 129, 0.6)' : 'none';

  return (
    <div style={{
      position: 'fixed',
      top: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      padding: '12px 24px',
      borderRadius: '16px',
      minWidth: '600px',
      justifyContent: 'space-between'
    }}
    className="glass-panel-strong"
    >
      {/* Child's Avatar & Name */}
      {userData && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
          }}>
            {userData.avatar}
          </div>
          <div>
            <div style={{
              fontSize: '15px',
              fontWeight: '700',
              color: 'white',
              letterSpacing: '0.3px',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
            }}
            className="text-glow"
            >
              {userData.name}
            </div>
            {currentLesson && (
              <div style={{
                fontSize: '10px',
                color: 'rgba(255, 255, 255, 0.6)',
                fontWeight: '500',
                marginTop: '1px'
              }}>
                {currentLesson.title}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Fallback Logo when no user data */}
      {!userData && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
          }}>
            🎓
          </div>
          <div>
            <div style={{
              fontSize: '20px',
              fontWeight: '700',
              color: 'white',
              letterSpacing: '0.5px',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
            }}
            className="text-glow"
            >
              SIMILI TUTOR
            </div>
            {currentLesson && (
              <div style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: '500',
                marginTop: '2px'
              }}>
                {currentLesson.title}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Stats */}
      {progress && currentLesson && (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Milestones Progress */}
          <div className="game-stat-bar" style={{ padding: '6px 12px' }}>
            <span style={{ fontSize: '16px' }}>⭐</span>
            <span style={{
              color: 'white',
              fontWeight: '600',
              fontSize: '13px',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
            }}>
              {progress.completedMilestones}/{currentLesson.milestones.length}
            </span>
          </div>

          {/* Level/Progress Bar */}
          <div className="game-stat-bar" style={{ minWidth: '100px', padding: '6px 12px' }}>
            <span style={{ fontSize: '16px' }}>📊</span>
            <div style={{ flex: 1 }}>
              <div style={{
                width: '100%',
                height: '6px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${(progress.completedMilestones / currentLesson.milestones.length) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #10b981, #34d399)',
                  borderRadius: '3px',
                  transition: 'width 0.5s ease',
                  boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
                }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Status */}
      <div className="game-stat-bar" style={{
        borderColor: connected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(148, 163, 184, 0.3)',
        padding: '6px 12px',
      }}>
        <div style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: connectionColor,
          boxShadow: connectionGlow,
          animation: connected ? 'pulse 2s ease-in-out infinite' : 'none',
        }} />
        <span style={{
          color: 'white',
          fontWeight: '600',
          fontSize: '13px',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
        }}>
          {connectionStatus}
        </span>
      </div>
    </div>
  );
}
