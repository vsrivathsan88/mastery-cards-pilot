/**
 * Mastery Cards App - Main Component
 * MVP: Basic card display with session management
 */

import { useEffect } from 'react';
import { MasteryCard } from './components/cards/MasteryCard';
import { SessionHeader } from './components/session/SessionHeader';
import { useSessionStore } from './lib/state/session-store';
import { getCardsForSession } from './lib/cards/card-generator';
import './App.css';

function App() {
  const { 
    currentCard, 
    sessionId,
    startSession,
    nextCard,
    masteredCard,
    needsPracticeCard,
  } = useSessionStore();
  
  // Initialize session on mount
  useEffect(() => {
    if (!sessionId) {
      console.log('[App] Initializing session...');
      const cards = getCardsForSession({ count: 10, scaffoldLevel: 'all' });
      startSession(cards);
    }
  }, [sessionId, startSession]);
  
  // Handle manual swipe for testing (will be replaced with gesture detection)
  const handleSwipeRight = () => {
    if (!currentCard) return;
    
    console.log('[App] Swiped RIGHT -', currentCard.cardId);
    
    // Calculate points (simplified for MVP)
    const points = currentCard.pointValue;
    masteredCard(currentCard.cardId, points);
    
    // Move to next card
    setTimeout(() => {
      nextCard();
    }, 500);
  };
  
  const handleSwipeLeft = () => {
    if (!currentCard) return;
    
    console.log('[App] Swiped LEFT -', currentCard.cardId);
    
    // Mark as needs practice
    needsPracticeCard(currentCard.cardId);
    
    // Move to next card
    setTimeout(() => {
      nextCard();
    }, 500);
  };
  
  if (!currentCard) {
    return (
      <div className="app">
        <SessionHeader />
        <div className="session-complete">
          <h1>🎉 Session Complete!</h1>
          <p>Great job mastering those concepts!</p>
          <button 
            className="restart-button"
            onClick={() => {
              const cards = getCardsForSession({ count: 10, scaffoldLevel: 'all' });
              startSession(cards);
            }}
          >
            Start New Session
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="app">
      <SessionHeader />
      
      <main className="card-container">
        <div className="card-stack">
          <MasteryCard 
            card={currentCard}
            isCurrent={true}
          />
        </div>
        
        {/* Manual swipe buttons for testing */}
        <div className="swipe-buttons">
          <button 
            className="swipe-button left"
            onClick={handleSwipeLeft}
          >
            ⬅️ Needs Practice
          </button>
          <button 
            className="swipe-button right"
            onClick={handleSwipeRight}
          >
            Mastered! ➡️
          </button>
        </div>
        
        <div className="instructions">
          <p>
            <strong>🎤 Voice Mode:</strong> Coming soon! For now, use the buttons above.
          </p>
          <p>
            This is the MVP - swipe gestures and Pi voice will be added next.
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;
