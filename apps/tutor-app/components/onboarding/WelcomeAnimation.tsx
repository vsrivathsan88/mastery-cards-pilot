import { useEffect } from 'react';

interface WelcomeAnimationProps {
  name: string;
  avatar: string;
  onComplete: () => void;
}

export function WelcomeAnimation({ name, avatar, onComplete }: WelcomeAnimationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="onboarding-screen welcome-animation">
      <div className="content">
        <div className="welcome-characters">
          <div className="character-avatar student-avatar">{avatar}</div>
          <div className="plus-sign">+</div>
          <div className="character-avatar pi-avatar">
            <img src="/illustrations/pi.png" alt="Pi" />
          </div>
        </div>

        <h1 className="welcome-message">
          {name}, I'm Pi! 🌟
        </h1>
        <h2 className="welcome-subtitle">
          Let's explore and learn together!
        </h2>

        <button
          className="onboarding-button primary skip-animation"
          onClick={onComplete}
        >
          Let's Go! 🚀
        </button>
      </div>
    </div>
  );
}
