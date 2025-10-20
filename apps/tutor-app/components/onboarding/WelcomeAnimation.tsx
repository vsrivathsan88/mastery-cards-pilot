import { useEffect } from 'react';
import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';

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
    const [type, seed] = avatar.split('-');
    const skinColor = seed === '1' ? 'light' : seed === '2' ? 'brown' : seed === '3' ? 'dark' : 'pale';
    const avatarData = createAvatar(avataaars, {
      seed: seed,
      skinColor: [skinColor],
      backgroundColor: ['transparent'],
      size: 200,
    });
    return avatarData.toDataUri();
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
        >
          Start Learning! 🚀
        </button>
      </div>
    </div>
  );
}
