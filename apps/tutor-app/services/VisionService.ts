/**
 * VisionService - Analyze canvas drawings + lesson images
 * 
 * Uses Gemini multimodal to understand what student is drawing
 * and how it relates to the lesson
 */

import type { VisionContext } from '@simili/agents';

const logger = {
  info: (msg: string, data?: any) => console.log(`[VisionService] 👁️ ${msg}`, data || ''),
  warn: (msg: string, data?: any) => console.warn(`[VisionService] ⚠️ ${msg}`, data || ''),
  error: (msg: string, data?: any) => console.error(`[VisionService] ❌ ${msg}`, data || ''),
  debug: (msg: string, data?: any) => console.debug(`[VisionService] 🔍 ${msg}`, data || ''),
};

export interface VisionAnalysisRequest {
  canvasSnapshot: string; // base64 or blob URL
  lessonImageUrl?: string;
  currentMilestone?: string;
  question?: string;
}

export class VisionService {
  private apiKey: string;
  private lastAnalysisTime: number = 0;
  
  // Rate limiting
  private readonly MIN_TIME_BETWEEN_ANALYSES_MS = 2000; // Max every 2 seconds

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    logger.info('Initialized');
  }

  /**
   * Analyze what student drew on canvas
   * Returns interpretation and pedagogical suggestions
   */
  public async analyzeCanvas(
    request: VisionAnalysisRequest
  ): Promise<VisionContext | null> {
    // Rate limiting
    const timeSinceLastAnalysis = Date.now() - this.lastAnalysisTime;
    if (timeSinceLastAnalysis < this.MIN_TIME_BETWEEN_ANALYSES_MS) {
      logger.warn('Skipping analysis - too soon after last one', {
        timeSince: timeSinceLastAnalysis,
      });
      return null;
    }

    logger.info('Starting canvas analysis', {
      hasCanvas: !!request.canvasSnapshot,
      hasLessonImage: !!request.lessonImageUrl,
      milestone: request.currentMilestone,
    });

    try {
      const startTime = Date.now();
      
      // Call Gemini Vision API
      const result = await this.callGeminiVision(request);
      
      const duration = Date.now() - startTime;
      this.lastAnalysisTime = Date.now();
      
      logger.info('Canvas analysis complete', {
        duration,
        confidence: result.confidence,
      });

      return result;
      
    } catch (error) {
      logger.error('Canvas analysis failed', error);
      return null;
    }
  }

  /**
   * Call Gemini Vision API (multimodal)
   * TODO: Replace with actual API call
   */
  private async callGeminiVision(
    request: VisionAnalysisRequest
  ): Promise<VisionContext> {
    // TODO: Implement actual Gemini Vision API call
    // For now, return mock data
    
    // Simulate API delay
    await this.delay(300);

    // Mock vision analysis
    const visionContext: VisionContext = {
      timestamp: Date.now(),
      description: 'Student drew a circle divided into two equal parts',
      interpretation: 'Student is attempting to visualize 1/2 by dividing a shape',
      suggestion: 'Ask student to shade one half to represent the fraction 1/2',
      confidence: 0.75,
      needsVoiceOver: false,
    };

    return visionContext;
  }

  /**
   * Build prompt for Gemini Vision
   */
  private buildVisionPrompt(request: VisionAnalysisRequest): string {
    let prompt = `You are analyzing a student's work on a math lesson about fractions.

**Current Milestone:** ${request.currentMilestone || 'Unknown'}
**Question:** ${request.question || 'Working on understanding fractions'}

Please analyze the student's drawing and provide:
1. A clear description of what they drew
2. Interpretation of their mathematical thinking
3. Pedagogical suggestion for next steps
4. Confidence level (0-1)

Respond in JSON format:
\`\`\`json
{
  "description": "What the student drew",
  "interpretation": "What this reveals about their understanding",
  "suggestion": "What the tutor should do next",
  "confidence": 0.0-1.0
}
\`\`\`
`;

    return prompt;
  }

  /**
   * Convert canvas to base64 image
   * Helper for getting snapshot from tldraw or canvas element
   */
  public async canvasToBase64(
    canvas: HTMLCanvasElement
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const base64 = canvas.toDataURL('image/png');
        resolve(base64);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Check if we should trigger vision analysis
   * Based on timing and context
   */
  public shouldAnalyzeVision(
    timeSinceLastDraw: number,
    studentJustSpoke: boolean
  ): boolean {
    // Don't analyze too frequently
    const timeSinceLastAnalysis = Date.now() - this.lastAnalysisTime;
    if (timeSinceLastAnalysis < this.MIN_TIME_BETWEEN_ANALYSES_MS) {
      return false;
    }

    // Analyze if student mentioned their drawing
    if (studentJustSpoke) {
      return true;
    }

    // Analyze if student has been drawing for a while without speaking
    if (timeSinceLastDraw > 5000) { // 5 seconds of drawing
      return true;
    }

    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
