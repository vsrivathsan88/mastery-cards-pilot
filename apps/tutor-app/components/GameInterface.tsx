import { ReactNode } from 'react';
import { CharacterAvatar } from './CharacterAvatar';
import { TabPanel } from './TabPanel';

interface GameInterfaceProps {
  piSpeaking: boolean;
  studentSpeaking: boolean;
  piLastMessage?: string;
  studentLastMessage?: string;
  isConnected: boolean;
  canvas: ReactNode;
  lessonImage: ReactNode;
  tabs: Array<{
    id: string;
    label: string;
    icon?: string;
    content: ReactNode;
  }>;
}

export function GameInterface({
  piSpeaking,
  studentSpeaking,
  piLastMessage,
  studentLastMessage,
  isConnected,
  canvas,
  lessonImage,
  tabs
}: GameInterfaceProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '120px 48px 180px 48px', // Extra padding for header/footer
      gap: '32px',
      overflow: 'auto'
    }}>
      {/* Row 1: Character Avatars - Large and Prominent */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '32px',
        marginBottom: '32px'
      }}>
        <CharacterAvatar
          name="Pi"
          isActive={isConnected}
          isSpeaking={piSpeaking}
          lastMessage={piLastMessage}
          position="top"
        />
        <CharacterAvatar
          name="You"
          isActive={isConnected}
          isSpeaking={studentSpeaking}
          lastMessage={studentLastMessage}
          position="bottom"
        />
      </div>

      {/* Row 2: Shared Workspace - Image + Canvas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '450px 1fr',
        gap: '32px',
        minHeight: '500px'
      }}>
        {/* Lesson Image - Shared Screen Feel */}
        <div style={{
          borderRadius: '24px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        className="glass-panel"
        >
          <div style={{
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
          className="glass-panel-strong"
          >
            <span style={{ fontSize: '24px' }}>📚</span>
            <span style={{ 
              fontSize: '18px',
              fontWeight: '700',
              color: 'white',
              letterSpacing: '0.5px',
            }}
            className="text-glow"
            >
              Learning Material
            </span>
          </div>
          <div style={{ flex: 1, padding: '24px' }}>
            {lessonImage}
          </div>
        </div>

        {/* Canvas - Drawing Workspace */}
        <div style={{
          borderRadius: '24px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        className="glass-panel"
        >
          <div style={{
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
          className="glass-panel-strong"
          >
            <span style={{ fontSize: '24px' }}>✏️</span>
            <span style={{ 
              fontSize: '18px',
              fontWeight: '700',
              color: 'white',
              letterSpacing: '0.5px',
            }}
            className="text-glow"
            >
              Your Workspace
            </span>
            <span style={{ 
              marginLeft: 'auto',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            className="game-stat-bar"
            >
              <span style={{ 
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: isConnected ? '#10b981' : '#94a3b8',
                boxShadow: isConnected ? '0 0 12px rgba(16,185,129,0.8)' : 'none',
                animation: isConnected ? 'pulse 2s ease-in-out infinite' : 'none',
              }} />
              <span style={{ color: 'white' }}>
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </span>
          </div>
          <div style={{ flex: 1, background: 'rgba(255, 255, 255, 0.95)' }}>
            {canvas}
          </div>
        </div>
      </div>

      {/* Row 3: Info Tabs - Glass Panel */}
      <div style={{
        borderRadius: '24px',
        minHeight: '320px',
        maxHeight: '450px',
        overflow: 'hidden'
      }}
      className="glass-panel"
      >
        <TabPanel tabs={tabs} defaultTab="progress" />
      </div>
    </div>
  );
}
