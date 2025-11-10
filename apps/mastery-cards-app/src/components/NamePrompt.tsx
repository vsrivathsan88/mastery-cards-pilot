/**
 * Name Prompt Component
 * Ask for student's name before starting session
 */

import { useState } from 'react';
import './NamePrompt.css';

interface NamePromptProps {
  onSubmit: (name: string) => void;
}

export function NamePrompt({ onSubmit }: NamePromptProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <div className="name-prompt-overlay">
      <div className="name-prompt-card">
        <div className="name-prompt-header">
          <span className="wave-emoji">👋</span>
          <h2 className="name-prompt-title">Hi there!</h2>
        </div>
        
        <p className="name-prompt-message">
          What's your name? I'm Pi, and I'll be helping you learn today!
        </p>
        
        <form onSubmit={handleSubmit} className="name-prompt-form">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Type your name here"
            className="name-input"
            autoFocus
            maxLength={30}
          />
          
          <button
            type="submit"
            className="name-submit-button"
            disabled={!name.trim()}
          >
            Let's Go! 🚀
          </button>
        </form>
      </div>
    </div>
  );
}
