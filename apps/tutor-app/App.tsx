import { useState, useEffect } from 'react';
import StreamingConsole from './components/demo/streaming-console/StreamingConsole';
import { CozyLayout } from './components/cozy/CozyLayout';
import { LiveAPIProvider } from './contexts/LiveAPIContext';
import { Onboarding } from './components/onboarding';

const API_KEY = process.env.GEMINI_API_KEY as string;
console.log('[App] API_KEY loaded:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'MISSING');
if (typeof API_KEY !== 'string' || API_KEY.length === 0) {
  throw new Error(
    'Missing required environment variable: GEMINI_API_KEY (check .env file)'
  );
}

interface UserData {
  name: string;
  avatar: string;
  hasCompletedOnboarding: boolean;
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

  if (isLoading) {
    return <div className="App">Loading...</div>;
  }

  if (!userData?.hasCompletedOnboarding) {
    return (
      <div className="App">
        <Onboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  return (
    <div className="App">
      <LiveAPIProvider apiKey={API_KEY}>
        <CozyLayout>
          <StreamingConsole />
        </CozyLayout>
      </LiveAPIProvider>
    </div>
  );
}

export default App;
