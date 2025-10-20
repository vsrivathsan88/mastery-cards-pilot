import { useState } from 'react';

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="onboarding-screen name-input">
      <div className="content">
        <h1>What should we call you? ✨</h1>

        <input
          type="text"
          className="name-field"
          placeholder="Super Learner"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 20))}
          onKeyPress={handleKeyPress}
          autoFocus
        />

        <button
          className="onboarding-button primary"
          onClick={handleSubmit}
          disabled={!name.trim()}
        >
          That's me!
        </button>
      </div>
    </div>
  );
}
