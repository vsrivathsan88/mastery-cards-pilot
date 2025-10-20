interface CharacterAvatarProps {
  name: string;
  isActive?: boolean;
  isSpeaking?: boolean;
  lastMessage?: string;
  position: 'top' | 'bottom';
}

export function CharacterAvatar({ 
  name, 
  isActive = false, 
  isSpeaking = false,
  lastMessage,
  position 
}: CharacterAvatarProps) {
  const isPi = name === 'Pi';
  const avatarEmoji = isPi ? '🤖' : '👦';
  const accentColor = isPi ? '#6366f1' : '#10b981';
  const gradientBg = isPi 
    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      padding: '24px',
      borderRadius: '24px',
      position: 'relative',
      minHeight: '320px',
    }}
    className={isSpeaking ? 'glass-accent-blue pulse-animation' : 'glass-panel'}
    >
      {/* Avatar Circle - Much Larger */}
      <div style={{
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        background: gradientBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '120px',
        position: 'relative',
        flexShrink: 0,
        boxShadow: isSpeaking 
          ? `0 0 60px ${accentColor}80, 0 0 100px ${accentColor}40`
          : `0 20px 40px rgba(0, 0, 0, 0.3)`,
        transition: 'all 0.3s ease',
        transform: isSpeaking ? 'scale(1.05)' : 'scale(1)',
        animation: isSpeaking ? 'pulse 2s ease-in-out infinite' : 'none',
      }}>
        {avatarEmoji}
        
        {/* Active Indicator */}
        {isActive && (
          <div style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            border: '4px solid white',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.6)',
            animation: 'pulse 2s ease-in-out infinite',
          }} />
        )}

        {/* Speaking Indicator Ring */}
        {isSpeaking && (
          <>
            <div style={{
              position: 'absolute',
              top: '-10px',
              left: '-10px',
              right: '-10px',
              bottom: '-10px',
              borderRadius: '50%',
              border: `4px solid ${accentColor}`,
              opacity: 0.6,
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
            <div style={{
              position: 'absolute',
              top: '-20px',
              left: '-20px',
              right: '-20px',
              bottom: '-20px',
              borderRadius: '50%',
              border: `3px solid ${accentColor}`,
              opacity: 0.3,
              animation: 'pulse 2s ease-in-out infinite',
            }} />
          </>
        )}
      </div>

      {/* Name and Status */}
      <div style={{ 
        textAlign: 'center',
        width: '100%',
      }}>
        <div style={{
          fontSize: '32px',
          fontWeight: '700',
          color: 'white',
          marginBottom: '8px',
          letterSpacing: '1px',
        }}
        className={isSpeaking ? 'text-glow-blue' : 'text-glow'}
        >
          {name}
        </div>
        
        {/* Status Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 20px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: '600',
          color: 'white',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}
        className="game-stat-bar"
        >
          {isSpeaking ? (
            <>
              <span style={{ fontSize: '20px', animation: 'pulse 1s ease-in-out infinite' }}>🎤</span>
              <span style={{ color: accentColor, fontWeight: '700' }}>Speaking</span>
            </>
          ) : isActive ? (
            <>
              <span style={{ fontSize: '20px' }}>✓</span>
              <span>Online</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: '20px' }}>○</span>
              <span style={{ opacity: 0.6 }}>Offline</span>
            </>
          )}
        </div>
      </div>

      {/* Speech Bubble - Only show when speaking */}
      {lastMessage && isSpeaking && (
        <div style={{
          position: 'absolute',
          bottom: '-80px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 48px)',
          padding: '16px 20px',
          borderRadius: '16px',
          fontSize: '15px',
          color: 'white',
          fontWeight: '500',
          lineHeight: '1.6',
          textAlign: 'center',
          maxHeight: '80px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
        }}
        className={isPi ? 'glass-accent-blue' : 'glass-accent-green'}
        >
          "{lastMessage.slice(0, 150)}{lastMessage.length > 150 ? '...' : ''}"
          {/* Speech bubble arrow */}
          <div style={{
            position: 'absolute',
            top: '-10px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderBottom: `10px solid ${accentColor}40`,
          }} />
        </div>
      )}
    </div>
  );
}
