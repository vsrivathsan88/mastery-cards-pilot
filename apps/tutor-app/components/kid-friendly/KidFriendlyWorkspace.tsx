import { ReactNode } from 'react';
import { SoundwaveVisualizer } from './SoundwaveVisualizer';

interface KidFriendlyWorkspaceProps {
  // Audio states
  isConnected: boolean;
  piSpeaking: boolean;
  studentSpeaking: boolean;
  piLastMessage?: string;
  studentLastMessage?: string;
  
  // Content
  lessonImage: ReactNode;
  canvas: ReactNode;
  
  // Granular controls
  onConnect: () => void;
  onDisconnect: () => void;
  onMuteToggle: () => void;
  onHelp: () => void;
  onExport: () => void;
  onReset: () => void;
  isMuted: boolean;
}

export function KidFriendlyWorkspace({
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
}: KidFriendlyWorkspaceProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#FAFAFA',
    }}
    className="kid-text"
    >
      {/* HEADER - Product Name & Connection Status */}
      <div style={{
        height: '60px',
        backgroundColor: 'white',
        borderBottom: '1px solid #E0E0E0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0,
      }}>
        {/* Product Name */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #FF9F66, #FFB84D)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
          }}>
            🎓
          </div>
          <div>
            <div style={{
              fontSize: '20px',
              fontWeight: '800',
              color: '#2C2C2C',
              letterSpacing: '-0.5px',
            }}>
              SIMILI
            </div>
            <div style={{
              fontSize: '11px',
              color: '#888',
              fontWeight: '500',
              marginTop: '-2px',
            }}>
              Learn Math with AI
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '20px',
          backgroundColor: isConnected ? '#E8F5E9' : '#F5F5F5',
          border: `1px solid ${isConnected ? '#4CAF50' : '#E0E0E0'}`,
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isConnected ? '#4CAF50' : '#BDBDBD',
            animation: isConnected ? 'pulse 2s ease-in-out infinite' : 'none',
          }} />
          <span style={{
            fontSize: '13px',
            fontWeight: '600',
            color: isConnected ? '#2E7D32' : '#757575',
          }}>
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>
      {/* MAIN WORKSPACE: Image + Canvas (80% of viewport) */}
      <div style={{
        height: 'calc(80vh - 60px)', // 80% minus header
        display: 'grid',
        gridTemplateColumns: '45% 55%',
        gap: 0,
        overflow: 'hidden',
      }}>
        {/* Image - THE PROBLEM */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: 'white',
          borderRight: '1px solid #E0E0E0',
        }}>
          {/* Label */}
          <div style={{
            padding: '16px 20px',
            backgroundColor: '#FAFAFA',
            borderBottom: '1px solid #E0E0E0',
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '700',
              color: '#666',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              📚 The Problem
            </div>
          </div>
          {/* Image - FULL SPACE */}
          <div style={{ 
            flex: 1, 
            padding: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'auto',
            backgroundColor: '#FAFAFA',
          }}>
            {lessonImage}
          </div>
        </div>

        {/* Canvas - YOUR WORK */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: 'white',
        }}>
          {/* Label */}
          <div style={{
            padding: '16px 20px',
            backgroundColor: '#FAFAFA',
            borderBottom: '1px solid #E0E0E0',
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '700',
              color: '#666',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              ✏️ Your Workspace
            </div>
          </div>
          {/* Canvas - FULL SPACE */}
          <div style={{ 
            flex: 1, 
            position: 'relative', 
            overflow: 'hidden',
            backgroundColor: '#FFFEF8',
          }}>
            {canvas}
          </div>
        </div>
      </div>

      {/* CONTROL BAR (Bottom 20%) - Soundwaves + Controls */}
      <div style={{
        height: '20vh',
        backgroundColor: 'white',
        borderTop: '1px solid #E0E0E0',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        {/* Soundwaves - Who's Speaking */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1px',
          backgroundColor: '#E0E0E0',
          borderBottom: '1px solid #E0E0E0',
        }}>
          {/* Pi */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            backgroundColor: piSpeaking ? '#FFF4E6' : 'white',
            padding: '12px',
            transition: 'background-color 0.2s ease',
          }}>
            <span style={{ fontSize: '24px' }}>🤖</span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              height: '24px',
            }}>
              {[0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 0.6].map((h, i) => (
                <div key={i} style={{
                  width: '3px',
                  height: piSpeaking ? `${h * 100}%` : '30%',
                  backgroundColor: piSpeaking ? '#FF9F66' : '#DDD',
                  borderRadius: '2px',
                  transition: 'height 0.1s ease, background-color 0.2s ease',
                }} />
              ))}
            </div>
            <span style={{
              fontSize: '13px',
              fontWeight: '600',
              color: piSpeaking ? '#FF9F66' : '#999',
            }}>
              Pi {piSpeaking ? 'speaking' : ''}
            </span>
          </div>
          {/* Student */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            backgroundColor: studentSpeaking ? '#E8F5E9' : 'white',
            padding: '12px',
            transition: 'background-color 0.2s ease',
          }}>
            <span style={{ fontSize: '24px' }}>👦</span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              height: '24px',
            }}>
              {[0.5, 0.8, 0.6, 1, 0.7, 0.5, 0.9, 0.6].map((h, i) => (
                <div key={i} style={{
                  width: '3px',
                  height: studentSpeaking ? `${h * 100}%` : '30%',
                  backgroundColor: studentSpeaking ? '#4CAF50' : '#DDD',
                  borderRadius: '2px',
                  transition: 'height 0.1s ease, background-color 0.2s ease',
                }} />
              ))}
            </div>
            <span style={{
              fontSize: '13px',
              fontWeight: '600',
              color: studentSpeaking ? '#4CAF50' : '#999',
            }}>
              You {studentSpeaking ? 'speaking' : ''}
            </span>
          </div>
        </div>

        {/* Control Buttons - Clean & Simple */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '0 24px',
          backgroundColor: '#FAFAFA',
        }}>
          {/* Primary Action: Connect/Disconnect */}
          {!isConnected ? (
            <button
              onClick={onConnect}
              style={{
                padding: '12px 32px',
                fontSize: '15px',
                fontWeight: '700',
                backgroundColor: '#FF9F66',
                color: 'white',
                border: 'none',
                borderRadius: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(255, 159, 102, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FFB84D';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FF9F66';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              ▶️ Start Session
            </button>
          ) : (
            <>
              {/* Disconnect */}
              <button
                onClick={onDisconnect}
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  backgroundColor: '#F44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D32F2F'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F44336'}
              >
                ⏸️ Stop
              </button>

              {/* Mute Toggle */}
              <button
                onClick={onMuteToggle}
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  backgroundColor: isMuted ? '#E0E0E0' : '#4CAF50',
                  color: isMuted ? '#666' : 'white',
                  border: 'none',
                  borderRadius: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isMuted ? '#D0D0D0' : '#45A049';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isMuted ? '#E0E0E0' : '#4CAF50';
                }}
              >
                {isMuted ? '🔇 Unmute' : '🎤 Mic On'}
              </button>
            </>
          )}

          {/* Divider */}
          <div style={{
            width: '1px',
            height: '24px',
            backgroundColor: '#DDD',
          }} />

          {/* Help */}
          <button
            onClick={onHelp}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              backgroundColor: 'white',
              color: '#666',
              border: '1px solid #DDD',
              borderRadius: '20px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#999'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#DDD'}
          >
            💡 Help
          </button>

          {/* Export */}
          <button
            onClick={onExport}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              backgroundColor: 'white',
              color: '#666',
              border: '1px solid #DDD',
              borderRadius: '20px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#999'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#DDD'}
          >
            💾
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              backgroundColor: 'white',
              color: '#666',
              border: '1px solid #DDD',
              borderRadius: '20px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#999'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#DDD'}
          >
            🔄
          </button>
        </div>
      </div>
    </div>
  );
}
