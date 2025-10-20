import StreamingConsole from './components/demo/streaming-console/StreamingConsole';
import { CozyLayout } from './components/cozy/CozyLayout';
import { LiveAPIProvider } from './contexts/LiveAPIContext';

const API_KEY = process.env.GEMINI_API_KEY as string;
console.log('[App] API_KEY loaded:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'MISSING');
if (typeof API_KEY !== 'string' || API_KEY.length === 0) {
  throw new Error(
    'Missing required environment variable: GEMINI_API_KEY (check .env file)'
  );
}

function App() {
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
