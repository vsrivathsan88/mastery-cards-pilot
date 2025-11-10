import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LiveAPIProvider } from './contexts/LiveAPIContext'

console.log('🎴 Mastery Cards App v1.0.0');

const API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || 'test-api-key-for-testing') as string;

createRoot(document.getElementById('root')!).render(
  <LiveAPIProvider apiKey={API_KEY}>
    <App />
  </LiveAPIProvider>,
)
