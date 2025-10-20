/**
 * API Client for Backend Communication
 * Secure client for multi-agent analysis
 */

export interface AnalyzeRequest {
  sessionId: string;
  transcription: string;
  isFinal: boolean;
  lessonContext?: {
    lessonId: string;
    milestoneIndex: number;
    attempts: number;
    timeOnMilestone: number;
  };
}

export interface AnalyzeResponse {
  success: boolean;
  sessionId: string;
  misconception?: {
    detected: boolean;
    type?: string;
    confidence?: number;
    evidence?: string;
    intervention?: string;
    correctiveConcept?: string;
  };
  emotional?: {
    state: string;
    engagementLevel: number;
    frustrationLevel: number;
    confusionLevel: number;
    recommendation: string;
  };
  contextForMainAgent?: string;
  error?: string;
}

export class ApiClient {
  private baseUrl: string;
  private sessionId: string | null = null;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Create new anonymous session
   */
  async createSession(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Failed to create session');
    }

    const data = await response.json();
    this.sessionId = data.sessionId;
    
    console.log('[ApiClient] Session created:', this.sessionId);
    return this.sessionId;
  }

  /**
   * Analyze transcription with multi-agent system
   */
  async analyze(request: Omit<AnalyzeRequest, 'sessionId'>): Promise<AnalyzeResponse> {
    if (!this.sessionId) {
      await this.createSession();
    }

    const response = await fetch(`${this.baseUrl}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...request,
        sessionId: this.sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.statusText}`);
    }

    const data: AnalyzeResponse = await response.json();
    
    if (!data.success && data.error) {
      throw new Error(data.error);
    }

    return data;
  }

  /**
   * Delete session (privacy)
   */
  async deleteSession(): Promise<void> {
    if (!this.sessionId) return;

    await fetch(`${this.baseUrl}/session/${this.sessionId}`, {
      method: 'DELETE',
    });

    console.log('[ApiClient] Session deleted:', this.sessionId);
    this.sessionId = null;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  getSessionId(): string | null {
    return this.sessionId;
  }
}

// Singleton instance
export const apiClient = new ApiClient();
