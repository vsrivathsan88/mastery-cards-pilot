import { useState, useEffect } from 'react';
import { LiveAPIProvider } from './contexts/LiveAPIContext';
import { UserProvider, UserData } from './contexts/UserContext';
import { Onboarding } from './components/onboarding';
import StreamingConsole from './components/demo/streaming-console/StreamingConsole';

const API_KEY = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || 'test-api-key-for-testing') as string;
console.log('[App] API_KEY loaded:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'MISSING');
if (typeof API_KEY !== 'string' || API_KEY.length === 0) {
  throw new Error(
    'Missing required environment variable: GEMINI_API_KEY (check .env file)'
  );
}

function App() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('simili_user');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.hasCompletedOnboarding) {
          setUserData(data);
        }
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
    setIsLoading(false);
  }, []);

  const handleOnboardingComplete = (data: UserData) => {
    setUserData(data);
  };

  const updateUserData = (data: Partial<UserData>) => {
    if (userData) {
      const updatedData = { ...userData, ...data };
      setUserData(updatedData);
      localStorage.setItem('simili_user', JSON.stringify(updatedData));
    }
  };

  if (isLoading) {
    return <div className="App">Loading...</div>;
  }

  // Add reset handler for debugging
  const handleReset = () => {
    if (confirm('Reset onboarding and start fresh? This will clear all progress.')) {
      localStorage.removeItem('simili_user');
      window.location.reload();
    }
  };

  if (!userData?.hasCompletedOnboarding) {
    return (
      <div className="App">
        <Onboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  return (
    <UserProvider value={{ userData, updateUserData }}>
      <div className="App" style={{ height: '100vh', overflow: 'hidden', position: 'relative' }} data-testid="main-app">
        {/* Reset Button (bottom-left corner for debugging - unobtrusive) */}
        <button
          onClick={handleReset}
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            zIndex: 9999,
            padding: '10px 14px',
            background: 'rgba(255, 107, 107, 0.9)',
            color: 'white',
            border: '3px solid #1A1D2E',
            borderRadius: '50%',
            fontWeight: '800',
            cursor: 'pointer',
            fontSize: '18px',
            boxShadow: '4px 4px 0 #1A1D2E',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
          }}
          title="Reset onboarding and clear all data"
        >
          🔄
        </button>
        
        <LiveAPIProvider apiKey={API_KEY}>
          <StreamingConsole />
        </LiveAPIProvider>
      </div>
    </UserProvider>
  );
}

export default App;
