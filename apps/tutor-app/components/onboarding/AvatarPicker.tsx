import { useState } from 'react';
import { createAvatar } from '@dicebear/core';
import { adventurer } from '@dicebear/collection';

interface AvatarPickerProps {
  onSelect: (avatar: string) => void;
}

interface AvatarOption {
  id: string;
  seed: string;
}

// 12 kid-friendly cartoon avatars using adventurer style (3 rows × 4 columns)
const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'adventurer-1', seed: 'Felix' },
  { id: 'adventurer-2', seed: 'Luna' },
  { id: 'adventurer-3', seed: 'Max' },
  { id: 'adventurer-4', seed: 'Zoe' },
  { id: 'adventurer-5', seed: 'Leo' },
  { id: 'adventurer-6', seed: 'Mia' },
  { id: 'adventurer-7', seed: 'Oliver' },
  { id: 'adventurer-8', seed: 'Emma' },
  { id: 'adventurer-9', seed: 'Charlie' },
  { id: 'adventurer-10', seed: 'Sophia' },
  { id: 'adventurer-11', seed: 'Noah' },
  { id: 'adventurer-12', seed: 'Ava' },
];

export function AvatarPicker({ onSelect }: AvatarPickerProps) {
  const [selected, setSelected] = useState<string>('');

  const handleSelect = (avatarId: string) => {
    setSelected(avatarId);
    setTimeout(() => onSelect(avatarId), 300);
  };

  const getAvatarSvg = (option: AvatarOption) => {
    const avatar = createAvatar(adventurer, {
      seed: option.seed,
      size: 120,
    });
    return avatar.toDataUri();
  };

  return (
    <div className="onboarding-screen avatar-picker">
      <div className="onboarding-glass-panel">
        <h1 className="onboarding-title">Choose Your Character 🎭</h1>
        <h2 className="onboarding-subtitle">Who will you be on this adventure?</h2>

        <div className="avatar-grid" data-testid="avatar-grid">
          {AVATAR_OPTIONS.map((option) => (
            <button
              key={option.id}
              className={`avatar-option ${selected === option.id ? 'selected' : ''}`}
              onClick={() => handleSelect(option.id)}
              data-testid={`avatar-option-${option.id}`}
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
