/**
 * Pi Avatar Component
 * Shows Pi's personality in the mastery cards app
 */

interface PiAvatarProps {
  size?: 'small' | 'medium' | 'large';
  expression?: 'curious' | 'excited' | 'thinking';
  showLabel?: boolean;
  isSpeaking?: boolean;
}

export function PiAvatar({
  size = 'medium',
  expression,
  showLabel = true,
  isSpeaking = false
}: PiAvatarProps) {
  // Auto-set expression based on speaking state if not explicitly provided
  const activeExpression = expression || (isSpeaking ? 'excited' : 'curious');
  const sizes = {
    small: '48px',
    medium: '80px',
    large: '120px',
  };
  
  const expressions = {
    curious: '👀',
    excited: '🎉',
    thinking: '🤔',
  };
  
  const sizeValue = sizes[size];
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
    }}>
      {/* Pi Avatar */}
      <div style={{
        position: 'relative',
        width: sizeValue,
        height: sizeValue,
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: '3px solid var(--border-primary)',
          overflow: 'hidden',
          background: 'var(--bg-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-sm) var(--border-primary)',
        }}>
          <img 
            src="/pi.png" 
            alt="Pi"
            style={{ 
              width: '100%', 
              height: '100%',
              objectFit: 'cover',
            }}
            onError={(e) => {
              // Fallback to emoji if image doesn't load
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.parentElement?.querySelector('.fallback-emoji') as HTMLElement;
              if (fallback) fallback.style.display = 'block';
            }}
          />
          <div 
            className="fallback-emoji"
            style={{
              display: 'none',
              fontSize: size === 'small' ? '24px' : size === 'medium' ? '40px' : '60px',
            }}
          >
            🤖
          </div>
        </div>
        
        {/* Expression overlay */}
        <div style={{
          position: 'absolute',
          bottom: '-4px',
          right: '-4px',
          fontSize: size === 'small' ? '16px' : size === 'medium' ? '24px' : '32px',
          background: 'var(--bg-card)',
          borderRadius: '50%',
          padding: '2px',
          border: '2px solid var(--border-primary)',
        }}>
          {expressions[activeExpression]}
        </div>
      </div>
      
      {/* Label */}
      {showLabel && (
        <div style={{
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: size === 'small' ? '12px' : '14px',
            fontWeight: 800,
            color: 'var(--text-primary)',
          }}>
            Pi
          </div>
        </div>
      )}
    </div>
  );
}
