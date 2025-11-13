/**
 * VisionService - Analyze canvas drawings + lesson images
 * 
 * Uses Gemini multimodal to understand what student is drawing
 * and how it relates to the lesson
 * 
 * NOW WITH: Image-Pedagogy Mapping integration for formative assessment
 */

import type { VisionContext } from '@simili/agents';
import type { ImagePedagogyMapping, ImagePedagogyData, ImageMisconception } from '@simili/shared';

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
  imagePedagogyData?: ImagePedagogyData; // NEW: pedagogical context for this image
  studentTranscription?: string; // NEW: what student said about their work
}

export class VisionService {
  private apiKey: string;
  private lastAnalysisTime: number = 0;
  private imagePedagogyMapping?: ImagePedagogyMapping;
  
  // Rate limiting
  private readonly MIN_TIME_BETWEEN_ANALYSES_MS = 2000; // Max every 2 seconds

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    logger.info('Initialized');
  }

  /**
   * Load image-pedagogy mapping for current lesson
   * This provides context for formative assessment
   */
  public async loadImagePedagogyMapping(lessonId: string): Promise<void> {
    try {
      // Load from lesson definitions
      const response = await fetch(`/lessons/fractions/image-pedagogy-mapping.json`);
      if (!response.ok) {
        logger.warn('Image pedagogy mapping not found', { lessonId });
        return;
      }

      const mapping: ImagePedagogyMapping = await response.json();
      this.imagePedagogyMapping = mapping;
      
      logger.info('Image pedagogy mapping loaded', {
        lessonId: mapping.lessonId,
        totalImages: mapping.totalImages,
      });
    } catch (error) {
      logger.error('Failed to load image pedagogy mapping', error);
    }
  }

  /**
   * Get pedagogy data for specific image
   */
  public getImagePedagogyData(imageId: string): ImagePedagogyData | undefined {
    if (!this.imagePedagogyMapping) {
      logger.warn('No image pedagogy mapping loaded');
      return undefined;
    }

    return this.imagePedagogyMapping.images.find(img => img.id === imageId);
  }

  /**
   * Get recommended scaffolding level based on student's performance
   */
  public getScaffolding(
    imageData: ImagePedagogyData,
    attempts: number,
    frustrationLevel: number
  ): string {
    // High frustration or many attempts = low scaffolding (more support)
    if (frustrationLevel > 0.6 || attempts > 3) {
      return imageData.scaffolding.low;
    }
    
    // Moderate progress = medium scaffolding
    if (attempts > 1 || frustrationLevel > 0.3) {
      return imageData.scaffolding.medium;
    }
    
    // Confident learner = high scaffolding (minimal support, encourage independence)
    return imageData.scaffolding.high;
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
   * Detect misconceptions based on visual work + verbal explanation
   */
  public detectMisconceptions(
    imageData: ImagePedagogyData,
    studentTranscription: string,
    visionAnalysis: VisionContext
  ): Array<{ misconception: ImageMisconception; confidence: number }> {
    const detectedMisconceptions: Array<{ misconception: ImageMisconception; confidence: number }> = [];
    
    if (!imageData.misconceptionsToDetect || imageData.misconceptionsToDetect.length === 0) {
      return detectedMisconceptions;
    }

    const lowerTranscription = studentTranscription.toLowerCase();
    const lowerDescription = visionAnalysis.description.toLowerCase();
    const combinedText = `${lowerTranscription} ${lowerDescription}`;

    // Check each possible misconception
    for (const misconception of imageData.misconceptionsToDetect) {
      // Count keyword matches
      const keywordMatches = misconception.evidenceKeywords.filter(keyword =>
        combinedText.includes(keyword.toLowerCase())
      );

      // Calculate confidence based on keyword matches and vision confidence
      const keywordConfidence = keywordMatches.length / misconception.evidenceKeywords.length;
      const combinedConfidence = (keywordConfidence + visionAnalysis.confidence) / 2;

      // Check against threshold
      if (combinedConfidence >= misconception.confidenceThreshold) {
        detectedMisconceptions.push({
          misconception,
          confidence: combinedConfidence,
        });

        logger.info('Misconception detected', {
          id: misconception.id,
          confidence: combinedConfidence,
          keywords: keywordMatches,
        });
      }
    }

    return detectedMisconceptions;
  }

  /**
   * Evaluate student response against expected indicators
   */
  public evaluateResponse(
    imageData: ImagePedagogyData,
    studentTranscription: string,
    visionAnalysis: VisionContext
  ): { isCorrect: boolean; matchedIndicators: string[]; confidence: number } {
    const lowerTranscription = studentTranscription.toLowerCase();
    const combinedText = `${lowerTranscription} ${visionAnalysis.description.toLowerCase()}`;

    // Check correct response indicators
    const correctMatches = imageData.correctResponse.indicators.filter(indicator =>
      combinedText.includes(indicator.toLowerCase())
    );

    // Check incorrect response indicators
    const incorrectMatches = imageData.incorrectResponse.indicators.filter(indicator =>
      combinedText.includes(indicator.toLowerCase())
    );

    // Determine if response is correct
    const correctScore = correctMatches.length / imageData.correctResponse.indicators.length;
    const incorrectScore = incorrectMatches.length / imageData.incorrectResponse.indicators.length;

    const isCorrect = correctScore > incorrectScore && correctScore > 0.3;
    const confidence = Math.max(correctScore, incorrectScore);

    logger.debug('Response evaluation', {
      imageId: imageData.id,
      isCorrect,
      correctMatches,
      incorrectMatches,
      confidence,
    });

    return {
      isCorrect,
      matchedIndicators: isCorrect ? correctMatches : incorrectMatches,
      confidence,
    };
  }

  /**
   * Call backend Vision API with pedagogy-aware analysis
   */
  private async callGeminiVision(
    request: VisionAnalysisRequest
  ): Promise<VisionContext> {
    const apiUrl = process.env.API_URL || 'http://localhost:4000';
    
    try {
      // Enrich request with pedagogy data if available
      const enrichedRequest: any = {
        canvasSnapshot: request.canvasSnapshot,
        lessonImageUrl: request.lessonImageUrl,
        currentMilestone: request.currentMilestone,
        lessonContext: request.question,
      };

      // Add pedagogy context for more targeted analysis
      if (request.imagePedagogyData) {
        enrichedRequest.pedagogyContext = {
          assessmentQuestion: request.imagePedagogyData.assessmentQuestion,
          masteryGoals: request.imagePedagogyData.masteryGoalDescriptions,
          expectedCorrectIndicators: request.imagePedagogyData.correctResponse.indicators,
          expectedIncorrectIndicators: request.imagePedagogyData.incorrectResponse.indicators,
          misconceptionsToWatch: request.imagePedagogyData.misconceptionsToDetect.map(m => ({
            id: m.id,
            description: m.description,
            keywords: m.evidenceKeywords,
          })),
        };
      }

      const response = await fetch(`${apiUrl}/api/vision/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enrichedRequest),
      });

      if (!response.ok) {
        throw new Error(`Vision API failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.analysis) {
        throw new Error('Vision API returned no analysis');
      }

      const analysis = data.analysis;
      
      // Build comprehensive description combining canvas + lesson image
      let fullDescription = analysis.canvasDescription;
      if (analysis.lessonImageCaption) {
        fullDescription += `\n\nLesson Image: ${analysis.lessonImageCaption}`;
      }
      fullDescription += `\n\nCanvas Strokes: ${analysis.canvasStrokes}`;

      const visionContext: VisionContext = {
        timestamp: Date.now(),
        description: fullDescription,
        interpretation: analysis.interpretation,
        suggestion: analysis.suggestion,
        confidence: analysis.confidence,
        needsVoiceOver: analysis.confidence > 0.6, // High confidence = worth mentioning
      };

      return visionContext;
      
    } catch (error) {
      logger.error('Vision API call failed', error);
      
      // Return fallback context
      return {
        timestamp: Date.now(),
        description: 'Unable to analyze canvas at this time',
        interpretation: 'Vision analysis unavailable',
        suggestion: 'Ask the student to explain their work verbally',
        confidence: 0.2,
        needsVoiceOver: false,
      };
    }
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
