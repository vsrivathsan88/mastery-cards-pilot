import { ReactNode } from 'react';
import Sidebar from '../Sidebar';
import ErrorScreen from '../demo/ErrorScreen';
import { useUI } from '@/lib/state';

interface CozyLayoutProps {
  children: ReactNode;
}

export function CozyLayout({ children }: CozyLayoutProps) {
  const { toggleSidebar } = useUI();

  const handleBackToLanding = () => {
    // TODO: Navigate to landing page
    window.location.href = '/'; // Placeholder navigation
  };

  return (
    <>
      {/* Midnight sky background */}
      <div className="cozy-background" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -2,
      }} />

      {/* Lamp glow from top (illuminating workspace) */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '85vh',
        zIndex: 0,
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 50% at 50% 20%, rgba(255, 179, 102, 0.12) 0%, transparent 60%)',
      }} />

      {/* Header - Glassmorphic */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        background: 'rgba(45, 50, 80, 0.5)',
        backdropFilter: 'blur(20px)',
        borderBottom: '2px solid rgba(255, 229, 180, 0.2)',
        boxShadow: '0 4px 24px rgba(26, 29, 46, 0.4)',
        zIndex: 1000,
      }}>
        {/* Left: Back button + Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            onClick={handleBackToLanding}
            title="Back to Home"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              background: 'rgba(74, 63, 53, 0.6)',
              border: '2px solid rgba(255, 229, 180, 0.3)',
              borderRadius: '12px',
              color: 'var(--text-warm)',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(74, 63, 53, 0.8)';
              e.currentTarget.style.transform = 'translateX(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(74, 63, 53, 0.6)';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            ← Back
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              fontSize: '32px',
              filter: 'drop-shadow(0 2px 8px rgba(255, 179, 102, 0.4))',
            }}>
              🎓
            </div>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #FFB366 0%, #FFE5B4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0,
            }}>
              Simili
            </h1>
          </div>
        </div>

        {/* Right: Settings button */}
        <button
          onClick={toggleSidebar}
          title="Settings"
          aria-label="Open settings"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(74, 63, 53, 0.6)',
            border: '2px solid rgba(255, 229, 180, 0.3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(74, 63, 53, 0.8)';
            e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(74, 63, 53, 0.6)';
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
          }}
        >
          ⚙️
        </button>
      </header>

      {/* Error handling */}
      <ErrorScreen />
      
      {/* Settings sidebar (hidden by default) */}
      <Sidebar />

      {/* Main content - with padding for header */}
      <div style={{
        width: '100%',
        height: 'calc(100vh - 72px)', // Account for header height
        marginTop: '72px', // Push below fixed header
        overflow: 'hidden',
      }}>
        {children}
      </div>
    </>
  );
}
