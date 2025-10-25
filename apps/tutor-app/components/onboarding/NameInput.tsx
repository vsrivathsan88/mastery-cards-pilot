import { useState, ReactNode, KeyboardEvent } from 'react';

interface NameInputProps {
  onSubmit: (name: string) => void;
}

export function NameInput({ onSubmit }: NameInputProps) {
  const [name, setName] = useState('');

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="onboarding-screen name-input">
      <div className="onboarding-glass-panel">
        <h1 className="onboarding-title">What's Your Name? ✨</h1>
        <h2 className="onboarding-subtitle">This is how Pi will know you</h2>

        <div className="name-input-container">
          <input
            type="text"
            className="cozy-name-field"
            placeholder="Adventure Explorer"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            onKeyPress={handleKeyPress}
            autoFocus
          />
          <div className="name-length-indicator">
            {name.length}/20
          </div>
        </div>

        <button
          className="cozy-button cozy-button-primary onboarding-button-large"
          onClick={handleSubmit}
          disabled={!name.trim()}
        >
          That's Me! 🎉
        </button>
      </div>
    </div>
  );
}
