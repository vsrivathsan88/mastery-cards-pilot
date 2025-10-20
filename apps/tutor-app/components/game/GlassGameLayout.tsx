import { ReactNode } from 'react';
import { GameHeader } from './GameHeader';
import GameHUD from './GameHUD';
import Sidebar from '../Sidebar';
import ErrorScreen from '../demo/ErrorScreen';

interface GlassGameLayoutProps {
  children: ReactNode;
}

export function GlassGameLayout({ children }: GlassGameLayoutProps) {
  return (
    <>
      {/* Animated gradient background */}
      <div className="game-background" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
      }} />
      
      {/* Noise texture overlay for depth */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.03) 2px, rgba(0, 0, 0, 0.03) 4px)',
        pointerEvents: 'none',
      }} />

      {/* Error handling */}
      <ErrorScreen />
      
      {/* Settings sidebar */}
      <Sidebar />
      
      {/* Top HUD - Connection status, progress */}
      <GameHeader />
      
      {/* Main content */}
      <div style={{
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
      }}>
        {children}
      </div>
      
      {/* Bottom HUD - Controls */}
      <GameHUD />
    </>
  );
}
