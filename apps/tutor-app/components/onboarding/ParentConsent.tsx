interface ParentConsentProps {
  onAgree: () => void;
}

export function ParentConsent({ onAgree }: ParentConsentProps) {
  return (
    <div className="onboarding-screen parent-consent">
      <div className="onboarding-glass-panel">
        <h1 className="onboarding-title">Welcome to Simili Learning 🌟</h1>
        <h2 className="onboarding-subtitle">A quick note for parents & guardians</h2>

        <div className="consent-points">
          <div className="consent-item">
            <span className="consent-icon">🔒</span>
            <div className="consent-text">
              <strong>Privacy First</strong>
              <span>All data stays on this device</span>
            </div>
          </div>
          <div className="consent-item">
            <span className="consent-icon">🎓</span>
            <div className="consent-text">
              <strong>AI-Powered Learning</strong>
              <span>Personalized tutoring that adapts</span>
            </div>
          </div>
          <div className="consent-item">
            <span className="consent-icon">🎤</span>
            <div className="consent-text">
              <strong>Natural Conversation</strong>
              <span>Voice-enabled learning experience</span>
            </div>
          </div>
          <div className="consent-item">
            <span className="consent-icon">🎨</span>
            <div className="consent-text">
              <strong>Kid-Friendly</strong>
              <span>Safe, magical environment</span>
            </div>
          </div>
          <div className="consent-item">
            <span className="consent-icon">⏱️</span>
            <div className="consent-text">
              <strong>No Distractions</strong>
              <span>No ads, tracking, or accounts</span>
            </div>
          </div>
        </div>

        <button className="cozy-button cozy-button-primary onboarding-button-large" onClick={onAgree}>
          Begin the Adventure ✨
        </button>
      </div>
    </div>
  );
}
