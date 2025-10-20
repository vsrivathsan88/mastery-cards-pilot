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

    const prompt = `You are an expert math education diagnostician. Analyze the student's statement for mathematical misconceptions.

# Context
Lesson: ${lesson.title}
Current Topic: ${lesson.description}

# Known Misconceptions for This Lesson
${knownMisconceptions.map(m => `- Misconception: "${m.misconception}"\n  Correction: "${m.correction}"`).join('\n')}

# Student Statement
"${transcription}"

# Task
Analyze if the student demonstrates any misconceptions. Return JSON with:
{
  "detected": boolean,
  "type": string (short identifier like "any_two_pieces_are_halves"),
  "confidence": number (0.0 to 1.0),
  "evidence": string (quote from student showing misconception),
  "intervention": string (how teacher should respond),
  "correctiveConcept": string (correct concept to teach)
}

If NO misconception detected, return: {"detected": false}

Be strict: only flag clear misconceptions, not minor wording issues.`;

    const { text } = await generateText({
      model: this.google(this.modelName),
      prompt,
      temperature: 0.2, // Low temperature for consistent analysis
    });

    // Parse JSON response
    try {
      const result = JSON.parse(text);
      
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
