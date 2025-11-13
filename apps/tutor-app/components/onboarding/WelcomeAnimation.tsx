import { useEffect } from 'react';
import { generateAvatarUrl } from '../../lib/avatar-utils';

interface WelcomeAnimationProps {
  name: string;
  avatar: string;
  onComplete: () => void;
}

export function WelcomeAnimation({ name, avatar, onComplete }: WelcomeAnimationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const getAvatarSvg = () => {
    return generateAvatarUrl(avatar, 200);
  };

  return (
    <div className="onboarding-screen welcome-animation">
      <div className="onboarding-glass-panel welcome-panel">
        <div className="welcome-stars">
          <span className="star">✨</span>
          <span className="star">⭐</span>
          <span className="star">🌟</span>
        </div>

        <div className="welcome-characters">
          <div className="welcome-avatar student-welcome">
            <img src={getAvatarSvg()} alt={name} />
          </div>
          <div className="welcome-plus">+</div>
          <div className="welcome-avatar pi-welcome">
            <img src="/illustrations/pi.png" alt="Pi" />
          </div>
        </div>

        <h1 className="welcome-title">
          Hello, {name}! 👋
        </h1>
        <p className="welcome-message">
          I'm <span className="pi-name">Pi</span>, your learning companion.
          <br />
          Let's go on amazing adventures together!
        </p>

        <button
          className="cozy-button cozy-button-primary onboarding-button-large pulse-button"
          onClick={onComplete}
          data-testid="start-learning-button"
        >
          Start Learning! 🚀
        </button>
      </div>
    </div>
  );
}
