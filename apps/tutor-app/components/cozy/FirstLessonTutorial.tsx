import { useState, useEffect } from 'react';

interface FirstLessonTutorialProps {
  onComplete: () => void;
  isConnected: boolean;
  studentName?: string;
}

interface TooltipStep {
  id: string;
  message: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  showPi: boolean;
}

const TUTORIAL_STEPS: TooltipStep[] = [
  {
    id: 'welcome',
    message: "Hi! I'm Pi, your learning buddy! Let's explore together!",
    position: 'center',
    showPi: true,
  },
  {
    id: 'talk',
    message: "You can talk to me anytime! Just speak naturally and I'll listen. 🎤",
    position: 'bottom-left',
    showPi: true,
  },
  {
    id: 'draw',
    message: "See that workspace? You can draw there to show me your thinking! ✏️",
    position: 'top-right',
    showPi: true,
  },
  {
    id: 'ready',
    message: "Ready to start? Let's learn something amazing together! 🚀",
    position: 'center',
    showPi: true,
  },
];

export function FirstLessonTutorial({ onComplete, isConnected, studentName }: FirstLessonTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show tutorial after a brief delay (let UI settle)
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isVisible) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  // Personalize first message if we have student name
  const message = currentStep === 0 && studentName 
    ? `Hi ${studentName}! I'm Pi, your learning buddy! Let's explore together!`
    : step.message;

  const getPositionStyles = () => {
    const base = {
      position: 'fixed' as const,
      zIndex: 10000,
      animation: 'tutorialSlideIn 0.4s ease-out',
    };

    switch (step.position) {
      case 'top-left':
        return { ...base, top: '120px', left: '40px' };
      case 'top-right':
        return { ...base, top: '120px', right: '40px' };
      case 'bottom-left':
        return { ...base, bottom: '100px', left: '40px' };
      case 'bottom-right':
        return { ...base, bottom: '100px', right: '40px' };
      case 'center':
      default:
        return { 
          ...base, 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
        };
    }
  };

  return (
    <>
      {/* Overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        animation: 'tutorialFadeIn 0.3s ease',
      }} onClick={handleSkip} />

      {/* Tooltip Card */}
      <div style={{
        ...getPositionStyles(),
        maxWidth: '420px',
        pointerEvents: 'auto',
      }}>
        <div style={{
          background: 'white',
          border: '4px solid #1A1D2E',
          borderRadius: '24px',
          padding: '28px 32px',
          boxShadow: '8px 8px 0 rgba(26, 29, 46, 0.2)',
          position: 'relative',
        }}>
          {/* Pi Avatar */}
          {step.showPi && (
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 20px',
              animation: 'tutorialBounce 0.6s ease',
            }}>
              <img 
                src="/illustrations/pi.png" 
                alt="Pi"
                style={{ 
                  width: '100%', 
                  height: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))',
                }}
              />
            </div>
          )}

          {/* Message */}
          <p style={{
            fontSize: '18px',
            lineHeight: '1.6',
            color: '#1A1D2E',
            textAlign: 'center',
            margin: '0 0 24px 0',
            fontWeight: '500',
          }}>
            {message}
          </p>

          {/* Progress Dots */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '20px',
          }}>
            {TUTORIAL_STEPS.map((_, index) => (
              <div key={index} style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: index === currentStep ? '#FFB84D' : '#E0E0E0',
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>

          {/* Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
          }}>
            {!isLastStep && (
              <button
                onClick={handleSkip}
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  border: '3px solid #1A1D2E',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#1A1D2E',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F5F1E8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Skip
              </button>
            )}
            <button
              onClick={handleNext}
              style={{
                padding: '12px 32px',
                background: '#FFB84D',
                border: '3px solid #1A1D2E',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '700',
                color: '#1A1D2E',
                cursor: 'pointer',
                boxShadow: '4px 4px 0 rgba(26, 29, 46, 0.2)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '6px 6px 0 rgba(26, 29, 46, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '4px 4px 0 rgba(26, 29, 46, 0.2)';
              }}
            >
              {isLastStep ? "Let's Go! 🚀" : 'Next'}
            </button>
          </div>
        </div>
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes tutorialFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes tutorialSlideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        
        @keyframes tutorialBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </>
  );
}
