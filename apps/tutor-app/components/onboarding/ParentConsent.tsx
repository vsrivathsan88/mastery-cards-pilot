interface ParentConsentProps {
  onAgree: () => void;
}

export function ParentConsent({ onAgree }: ParentConsentProps) {
  return (
    <div className="onboarding-screen parent-consent">
      <div className="content">
        <h1>Welcome to Simili Learning! 🌟</h1>
        <h2>A quick note for parents/guardians</h2>

        <div className="consent-points">
          <div className="consent-item">
            <span className="icon">🔒</span>
            <span>All data stays on this device</span>
          </div>
          <div className="consent-item">
            <span className="icon">🎓</span>
            <span>AI-powered personalized tutoring</span>
          </div>
          <div className="consent-item">
            <span className="icon">🎤</span>
            <span>Uses voice for natural conversation</span>
          </div>
          <div className="consent-item">
            <span className="icon">🎨</span>
            <span>Safe, kid-friendly learning environment</span>
          </div>
          <div className="consent-item">
            <span className="icon">⏱️</span>
            <span>No ads, no tracking, no accounts needed</span>
          </div>
        </div>

        <button className="onboarding-button primary" onClick={onAgree}>
          I Agree - Let's Start!
        </button>
      </div>
    </div>
  );
}
