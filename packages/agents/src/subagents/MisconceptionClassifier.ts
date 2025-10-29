import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { LessonData } from '@simili/shared';
import pRetry from 'p-retry';
import { createLogger } from '../utils/logger';

const logger = createLogger({ prefix: '[MisconceptionClassifier]' });

export interface MisconceptionAnalysisInput {
  transcription: string;
  lesson: LessonData;
  knownMisconceptions: Array<{
    misconception: string;
    correction: string;
  }>;
}

export interface MisconceptionAnalysisResult {
  detected: boolean;
  type?: string;
  confidence?: number;
  evidence?: string;
  intervention?: string;
  correctiveConcept?: string;
}

export class MisconceptionClassifier {
  private google: ReturnType<typeof createGoogleGenerativeAI>;
  private modelName: string;

  constructor(apiKey?: string, modelName: string = 'gemini-2.0-flash-exp') {
    // API key must be provided explicitly (browser environment)
    const key = apiKey || '';
    this.modelName = modelName;
    
    if (!key) {
      logger.warn('No API key provided. Misconception analysis will fail at runtime.');
    }
    
    // Initialize Google AI SDK with API key
    this.google = createGoogleGenerativeAI({ apiKey: key });
  }

  /**
   * Analyze student transcription for misconceptions
   * Uses Gemini Flash with structured JSON output
   */
  async analyze(input: MisconceptionAnalysisInput): Promise<MisconceptionAnalysisResult> {
    const startTime = Date.now();
    
    try {
      // Retry logic for robustness
      const result = await pRetry(
        () => this.analyzeWithRetry(input),
        {
          retries: 2,
          minTimeout: 500,
          onFailedAttempt: (error) => {
            logger.warn(`[MisconceptionClassifier] Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`);
          },
        }
      );

      const latency = Date.now() - startTime;
      logger.info(`[MisconceptionClassifier] Analysis complete in ${latency}ms`);
      
      return result;
    } catch (error) {
      logger.error('[MisconceptionClassifier] All retry attempts failed', { error });
      
      // Fallback: return no misconception detected
      return {
        detected: false,
      };
    }
  }

  private async analyzeWithRetry(input: MisconceptionAnalysisInput): Promise<MisconceptionAnalysisResult> {
    const { transcription, lesson, knownMisconceptions } = input;

    // OPTIMIZED PROMPT: Concise, structured, fast for Gemini 2.0 Flash
    const prompt = `Analyze student's math statement for misconceptions. Return JSON ONLY.

LESSON: ${lesson.title}
STUDENT SAID: "${transcription}"

KNOWN MISCONCEPTIONS:
${knownMisconceptions.map((m, i) => `${i + 1}. ${m.misconception}: ${m.correction}`).join('\n')}

OUTPUT JSON FORMAT:
{
  "detected": true/false,
  "type": "identifier-like-this" (if detected),
  "confidence": 0.0-1.0 (if detected),
  "evidence": "exact quote showing issue" (if detected),
  "intervention": "one-sentence guidance for teacher" (if detected),
  "correctiveConcept": "correct concept in brief" (if detected)
}

RULES:
- Only flag CLEAR misconceptions (not wording issues)
- If unsure, return {"detected": false}
- Be strict and precise
- Return valid JSON only, no explanations

JSON:`;

    const { text } = await generateText({
      model: this.google(this.modelName),
      prompt,
      temperature: 0.1, // Very low for consistent, fast analysis
    });

    // Parse JSON response
    try {
      // Extract JSON if wrapped in markdown or text
      let jsonText = text.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```')) {
        const match = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
        if (match) {
          jsonText = match[1].trim();
        }
      }
      
      // Try to find JSON object in text
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
      
      const result = JSON.parse(jsonText);
      
      // Validate structure
      if (typeof result.detected !== 'boolean') {
        throw new Error('Invalid response structure');
      }
      
      return result;
    } catch (parseError) {
      logger.error('[MisconceptionClassifier] Failed to parse JSON response', { text, parseError });
      
      // Fallback
      return {
        detected: false,
      };
    }
  }

  /**
   * Batch analyze multiple transcriptions (for history analysis)
   */
  async analyzeHistory(
    transcriptions: string[],
    lesson: LessonData,
    knownMisconceptions: Array<{ misconception: string; correction: string }>
  ): Promise<MisconceptionAnalysisResult[]> {
    const results = await Promise.all(
      transcriptions.map(transcription =>
        this.analyze({ transcription, lesson, knownMisconceptions })
      )
    );
    
    return results;
  }
}
