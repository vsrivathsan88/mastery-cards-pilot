import { useState } from 'react';
import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';

interface AvatarPickerProps {
  onSelect: (avatar: string) => void;
}

interface AvatarOption {
  id: string;
  seed: string;
  skinColor: string;
  gender: 'male' | 'female';
}

const AVATAR_OPTIONS: AvatarOption[] = [
  // Diverse boys
  { id: 'boy-1', seed: 'Felix', skinColor: 'light', gender: 'male' },
  { id: 'boy-2', seed: 'Leo', skinColor: 'brown', gender: 'male' },
  { id: 'boy-3', seed: 'Max', skinColor: 'dark', gender: 'male' },
  { id: 'boy-4', seed: 'Oliver', skinColor: 'pale', gender: 'male' },
  // Diverse girls
  { id: 'girl-1', seed: 'Emma', skinColor: 'light', gender: 'female' },
  { id: 'girl-2', seed: 'Sophia', skinColor: 'brown', gender: 'female' },
  { id: 'girl-3', seed: 'Mia', skinColor: 'dark', gender: 'female' },
  { id: 'girl-4', seed: 'Ava', skinColor: 'pale', gender: 'female' },
];

export function AvatarPicker({ onSelect }: AvatarPickerProps) {
  const [selected, setSelected] = useState<string>('');

  const handleSelect = (avatarId: string) => {
    setSelected(avatarId);
    setTimeout(() => onSelect(avatarId), 300);
  };

  const getAvatarSvg = (option: AvatarOption) => {
    const avatar = createAvatar(avataaars, {
      seed: option.seed,
      skinColor: [option.skinColor],
      backgroundColor: ['transparent'],
      size: 120,
    });
    return avatar.toDataUri();
  };

  return (
    <div className="onboarding-screen avatar-picker">
      <div className="onboarding-glass-panel">
        <h1 className="onboarding-title">Choose Your Character 🎭</h1>
        <h2 className="onboarding-subtitle">Who will you be on this adventure?</h2>

        <div className="avatar-grid">
          {AVATAR_OPTIONS.map((option) => (
            <button
              key={option.id}
              className={`avatar-option ${selected === option.id ? 'selected' : ''}`}
              onClick={() => handleSelect(option.id)}
            >
              <div className="avatar-image">
                <img 
                  src={getAvatarSvg(option)} 
                  alt={option.seed}
                />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
