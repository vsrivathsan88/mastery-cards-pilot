/**
 * Comic-style onboarding slides
 * Kid-friendly visual storytelling
 */

import { useState } from 'react';
import './ComicOnboarding.css';

interface ComicSlide {
  id: number;
  imageUrl?: string;
  imagePlaceholder?: string; // Emoji/text placeholder until image provided
  text: string;
  smallText?: string;
}

interface ComicOnboardingProps {
  studentName: string;
  onReady: () => void;
  onStart: () => void;
  isReady: boolean;
  isConnecting: boolean;
}

export function ComicOnboarding({ studentName, onReady, onStart, isReady, isConnecting }: ComicOnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: ComicSlide[] = [
    {
      id: 1,
      imagePlaceholder: '🛸',
      text: `Hi ${studentName}, I'm Pi!`,
      smallText: 'Your friendly alien guide'
    },
    {
      id: 2,
      imagePlaceholder: '🌌',
      text: "I come from Planet Geometrica",
      smallText: 'Where everything is shapes and numbers!'
    },
    {
      id: 3,
      imagePlaceholder: '🤔💭',
      text: "We're going to wonder together",
      smallText: 'I want to understand how YOU think'
    },
    {
      id: 4,
      imagePlaceholder: '🎧',
      text: "Put on your headphones",
      smallText: 'Make sure your microphone is ready too!'
    },
    {
      id: 5,
      imagePlaceholder: '🚀',
      text: "Ready to explore?",
      smallText: "Let's go!"
    }
  ];

  const currentSlideData = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      onReady();
    } else {
      setCurrentSlide(currentSlide + 1);
      // Call onReady when reaching last slide
      if (currentSlide + 1 === slides.length - 1) {
        onReady();
      }
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleDotClick = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="comic-overlay">
      <div className="comic-container">
        {/* Comic Panel */}
        <div className="comic-panel">
          {/* Panel Border (comic book style) */}
          <div className="panel-border">
            
            {/* Image Area */}
            <div className="panel-image">
              {currentSlideData.imageUrl ? (
                <img 
                  src={currentSlideData.imageUrl} 
                  alt={currentSlideData.text}
                  className="comic-image"
                />
              ) : (
                <div className="comic-placeholder">
                  <span className="placeholder-emoji">
                    {currentSlideData.imagePlaceholder}
                  </span>
                </div>
              )}
            </div>

            {/* Speech Bubble */}
            <div className="speech-bubble">
              <div className="bubble-text">{currentSlideData.text}</div>
              {currentSlideData.smallText && (
                <div className="bubble-subtext">{currentSlideData.smallText}</div>
              )}
            </div>
          </div>

          {/* Navigation Arrows */}
          <div className="comic-nav">
            <button
              className="nav-arrow nav-prev"
              onClick={handlePrevious}
              disabled={currentSlide === 0}
              aria-label="Previous slide"
            >
              ←
            </button>

            <button
              className="nav-arrow nav-next"
              onClick={handleNext}
              aria-label={isLastSlide ? 'Start learning' : 'Next slide'}
            >
              {isLastSlide ? '✨' : '→'}
            </button>
          </div>

          {/* Progress Dots */}
          <div className="comic-dots">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                className={`dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => handleDotClick(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* CTA Button (Last Slide Only) */}
          {isLastSlide && (
            <button
              className="comic-cta"
              onClick={onStart}
              disabled={!isReady || isConnecting}
            >
              {isConnecting ? '⏳ Connecting...' : '🚀 Start Learning!'}
            </button>
          )}
        </div>

        {/* Helper Text */}
        <p className="comic-hint">
          {isLastSlide
            ? (isReady ? 'Click the button to begin!' : 'Getting ready...')
            : 'Click arrows or dots to navigate →'}
        </p>
      </div>
    </div>
  );
}
