/**
 * Simplified LiveAPI Hook for Mastery Cards App
 * Stripped down version focused on tool calling and assessment
 * 
 * NOTE: This is a simplified placeholder for the MVP.
 * For full voice integration, copy GenAILiveClient from tutor-app/lib
 */

import { useCallback, useState } from 'react';
import { useSessionStore } from '../lib/state/session-store';

export type UseLiveApiResults = {
  client: any | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  connected: boolean;
  volume: number;
  sendText: (text: string) => void;
};

export function useLiveApi({
  apiKey,
}: {
  apiKey: string;
}): UseLiveApiResults {
  const [connected, setConnected] = useState(false);
  const [volume] = useState(0);
  
  const { currentCard, masteredCard, needsPracticeCard, nextCard } = useSessionStore();

  // Placeholder client
  const client = null;

  // Placeholder: Handle tool calls
  // In full implementation, this would handle calls from GenAILiveClient
  const handleToolCall = useCallback((toolName: string, args: any) => {
    console.log(`[Tool Called] ${toolName}`, args);

    if (toolName === 'swipe_right') {
      const { cardId, confidence } = args;
      const points = currentCard?.pointValue || 10;
      masteredCard(cardId, points);
      console.log(`✅ Card ${cardId} mastered! +${points} points (confidence: ${confidence})`);
      setTimeout(() => nextCard(), 1000);
    }
    
    if (toolName === 'swipe_left') {
      const { cardId, difficulty } = args;
      needsPracticeCard(cardId);
      console.log(`📝 Card ${cardId} needs practice (${difficulty})`);
      setTimeout(() => nextCard(), 1000);
    }
  }, [currentCard, masteredCard, needsPracticeCard, nextCard]);

  // Placeholder connect - warns about missing implementation
  const connect = useCallback(async () => {
    if (!apiKey || apiKey === 'test-api-key-for-testing') {
      alert('⚠️ Voice mode requires a valid Gemini API key!\n\nPlease:\n1. Copy .env.template to .env.local\n2. Add your Gemini API key\n3. Restart the dev server');
      return;
    }

    console.warn('[LiveAPI] Voice integration not yet implemented!');
    console.warn('[LiveAPI] To add voice:');
    console.warn('  1. Copy GenAILiveClient from tutor-app/lib');
    console.warn('  2. Copy AudioStreamer from tutor-app/lib');
    console.warn('  3. Wire up tool handlers');
    
    alert('🚧 Voice mode coming soon!\n\nFor now, use the manual swipe buttons to test the card flow.');
    
    // Simulate connection for UI
    setConnected(false);
  }, [apiKey]);

  // Placeholder disconnect
  const disconnect = useCallback(() => {
    setConnected(false);
    console.log('[LiveAPI] Disconnected');
  }, []);

  // Placeholder sendText
  const sendText = useCallback((text: string) => {
    console.log('[LiveAPI] Would send:', text);
    handleToolCall('test', {});
  }, [handleToolCall]);

  return {
    client,
    connect,
    disconnect,
    connected,
    volume,
    sendText,
  };
}
