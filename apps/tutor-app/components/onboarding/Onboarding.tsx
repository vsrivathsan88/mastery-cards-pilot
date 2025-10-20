import { useState } from 'react';
import { ParentConsent } from './ParentConsent';
import { AvatarPicker } from './AvatarPicker';
import { NameInput } from './NameInput';
import { WelcomeAnimation } from './WelcomeAnimation';

interface OnboardingData {
  name: string;
  avatar: string;
  hasCompletedOnboarding: boolean;
}

interface OnboardingProps {
  onComplete: (data: OnboardingData) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');

  const handleParentConsent = () => {
    setStep(2);
  };

  const handleAvatarSelect = (selectedAvatar: string) => {
    setAvatar(selectedAvatar);
    setStep(3);
  };

  const handleNameSubmit = (submittedName: string) => {
    setName(submittedName);
    setStep(4);
  };

  const handleWelcomeComplete = () => {
    const data: OnboardingData = {
      name,
      avatar,
      hasCompletedOnboarding: true,
    };
    localStorage.setItem('simili_user', JSON.stringify(data));
    onComplete(data);
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-progress">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`progress-dot ${step >= s ? 'active' : ''}`}
          />
        ))}
      </div>

      {step === 1 && <ParentConsent onAgree={handleParentConsent} />}
      {step === 2 && <AvatarPicker onSelect={handleAvatarSelect} />}
      {step === 3 && <NameInput onSubmit={handleNameSubmit} />}
      {step === 4 && (
        <WelcomeAnimation
          name={name}
          avatar={avatar}
          onComplete={handleWelcomeComplete}
        />
      )}
    </div>
  );
}
