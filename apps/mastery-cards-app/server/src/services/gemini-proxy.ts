/**
 * Gemini Proxy Service
 *
 * Handles communication with Gemini Live API for server-controlled messages
 */

export class GeminiProxy {
  private sessions: Map<string, any> = new Map();

  /**
   * Register a Gemini session
   */
  registerSession(sessionId: string, geminiClient: any): void {
    this.sessions.set(sessionId, geminiClient);
    console.log(`[GeminiProxy] Registered session ${sessionId}`);
  }

  /**
   * Inject a message to Gemini
   */
  async injectMessage(sessionId: string, message: string): Promise<void> {
    const client = this.sessions.get(sessionId);

    if (!client) {
      console.error(`[GeminiProxy] No Gemini client for session ${sessionId}`);
      throw new Error('Gemini session not found');
    }

    try {
      // Send message to Gemini
      await client.send([{ text: message }], true);
      console.log(`[GeminiProxy] Injected message to session ${sessionId}: ${message.substring(0, 50)}...`);
    } catch (error) {
      console.error(`[GeminiProxy] Failed to inject message:`, error);
      throw error;
    }
  }

  /**
   * Unregister a session
   */
  unregisterSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    console.log(`[GeminiProxy] Unregistered session ${sessionId}`);
  }

  /**
   * Get active sessions
   */
  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }
}