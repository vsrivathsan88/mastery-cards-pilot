import { useEffect, useState } from 'react';

interface PiPresenceProps {
  isConnected: boolean;
  isSpeaking: boolean;
  lastMessage?: string;
}

// Curious adventure buddy expressions
const getExpression = (isConnected: boolean, isSpeaking: boolean) => {
  if (!isConnected) return '😴'; // Offline/sleeping
  if (isSpeaking) return '💡'; // Sharing ideas!
  return '👀'; // Watching curiously
};

export function PiPresence({ isConnected, isSpeaking, lastMessage }: PiPresenceProps) {
  const [expression, setExpression] = useState(getExpression(isConnected, isSpeaking));
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    const newExpression = getExpression(isConnected, isSpeaking);
    setExpression(newExpression);
    
    // Show message briefly when speaking
    if (isSpeaking && lastMessage) {
      setShowMessage(true);
    } else {
      // Hide message after speaking stops
      const timer = setTimeout(() => setShowMessage(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, isSpeaking, lastMessage]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
    }}>
      {/* Pi Character Container */}
      <div className="cozy-pi-container">
        <div className={`cozy-pi-blob ${isSpeaking ? 'speaking' : ''}`}>
          <img 
            src="/illustrations/pi.png" 
            alt="Pi"
            style={{ 
              width: '100%', 
              height: '100%',
              objectFit: 'contain',
            }}
            onError={(e) => {
              // Fallback if image not found
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.parentElement?.querySelector('.fallback-blob') as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          {/* Fallback if image doesn't load */}
          <div 
            className="fallback-blob"
            style={{
              display: 'none',
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7EB5E8, #5A9BD5)',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '60px',
              border: '3px solid #4A4035',
              boxShadow: 'inset 0 4px 8px rgba(255, 255, 255, 0.3)',
              position: 'absolute',
              top: '20px',
              left: '20px',
            }}
          >
            🤖
          </div>
        </div>

        {/* Expression Emoji Overlay */}
        <div className="cozy-pi-expression" key={expression}>
          {expression}
        </div>
      </div>

      {/* Pi Label */}
      <div style={{
        textAlign: 'center',
      }}>
        <div className="cozy-text-heading" style={{ marginBottom: '4px' }}>
          Pi
        </div>
        <div className="cozy-text-label" style={{ color: 'var(--text-secondary)' }}>
          {!isConnected ? 'Offline' : isSpeaking ? 'Speaking...' : 'Listening'}
        </div>
      </div>

      {/* Speech Bubble (when speaking) */}
      {showMessage && lastMessage && (
        <div style={{
          background: 'white',
          border: '3px solid var(--sketch-dark)',
          borderRadius: '20px',
          padding: '16px 20px',
          maxWidth: '320px',
          position: 'relative',
          boxShadow: '0 4px 12px var(--shadow-warm)',
          animation: 'cozyExpressionPop 0.3s ease',
        }}>
          {/* Speech bubble arrow */}
          <div style={{
            position: 'absolute',
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '12px solid transparent',
            borderRight: '12px solid transparent',
            borderBottom: '12px solid var(--sketch-dark)',
          }} />
          <div style={{
            position: 'absolute',
            top: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderBottom: '10px solid white',
          }} />
          
          {/* Message text */}
          <div className="cozy-text" style={{
            fontSize: '15px',
            lineHeight: '1.5',
            color: 'var(--text-primary)',
            maxHeight: '80px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {lastMessage.length > 120 ? lastMessage.substring(0, 120) + '...' : lastMessage}
          </div>
        </div>
      )}
    </div>
  );
}
