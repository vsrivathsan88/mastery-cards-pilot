import { ReactNode } from 'react';
import Sidebar from '../Sidebar';
import ErrorScreen from '../demo/ErrorScreen';
import { useUI } from '@/lib/state';

interface KidFriendlyLayoutProps {
  children: ReactNode;
}

export function KidFriendlyLayout({ children }: KidFriendlyLayoutProps) {
  const { toggleSidebar } = useUI();

  return (
    <>
      {/* Warm animated background */}
      <div className="kid-friendly-background" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
      }} />

      {/* Subtle texture overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 255, 255, 0.02) 2px, rgba(255, 255, 255, 0.02) 4px)',
        pointerEvents: 'none',
      }} />

      {/* Error handling */}
      <ErrorScreen />
      
      {/* Settings sidebar (hidden by default) */}
      <Sidebar />
      
      {/* Settings toggle button (small, in corner) */}
      <button
        className="kid-settings-toggle"
        onClick={toggleSidebar}
        title="Settings"
        aria-label="Open settings"
      >
        ⚙️
      </button>

      {/* Main content */}
      <div style={{
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
      }}>
        {children}
      </div>
    </>
  );
}
