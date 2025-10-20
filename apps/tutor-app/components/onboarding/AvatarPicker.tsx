import { useState } from 'react';

interface AvatarPickerProps {
  onSelect: (avatar: string) => void;
}

const AVATARS = {
  memojis: ['😊', '😎', '🤓', '😄', '🥳', '😇'],
  animals: ['🦊', '🦉', '🐱', '🐶', '🐻', '🐰'],
};

export function AvatarPicker({ onSelect }: AvatarPickerProps) {
  const [selected, setSelected] = useState<string>('');

  const handleSelect = (avatar: string) => {
    setSelected(avatar);
    setTimeout(() => onSelect(avatar), 300);
  };

  return (
    <div className="onboarding-screen avatar-picker">
      <div className="content">
        <h1>Who are you today? 🌈</h1>

        <div className="avatar-section">
          <h3>Memojis</h3>
          <div className="avatar-grid">
            {AVATARS.memojis.map((avatar) => (
              <button
                key={avatar}
                className={`avatar-option ${selected === avatar ? 'selected' : ''}`}
                onClick={() => handleSelect(avatar)}
              >
                {avatar}
              </button>
            ))}
          </div>
        </div>

        <div className="avatar-section">
          <h3>Animals</h3>
          <div className="avatar-grid">
            {AVATARS.animals.map((avatar) => (
              <button
                key={avatar}
                className={`avatar-option ${selected === avatar ? 'selected' : ''}`}
                onClick={() => handleSelect(avatar)}
              >
                {avatar}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
