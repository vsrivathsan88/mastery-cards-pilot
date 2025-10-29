import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { LessonData } from '@simili/shared';
import pRetry from 'p-retry';
import { createLogger } from '../utils/logger';

const logger = createLogger({ prefix: '[PrerequisiteDetector]' });

export interface PrerequisiteSpec {
  id: string;
  concept: string;
  description: string;
  wonderHookQuestion: string;
  passSignals: string[];
  gapSignals: string[];
  microLesson: {
    approach: string;
    script: string;
    duration: number;
    reAssessQuestion: string;
    visualAid?: string;
  };
}

export interface PrerequisiteAnalysisInput {
  transcription: string;
  prerequisite: PrerequisiteSpec;
  conversationContext?: string[];
  isWonderHook?: boolean;
}

export interface PrerequisiteAnalysisResult {
  status: 'PREREQUISITE_MET' | 'GAP_DETECTED' | 'UNCLEAR' | 'PROBE_DEEPER';
  prerequisiteId: string;
  concept: string;
  confidence: number;
  evidence?: string;
  nextAction: 'CONTINUE_LESSON' | 'TEACH_PREREQUISITE' | 'PROBE_DEEPER' | 'RE_ASSESS';
  detectedGap?: {
    type: 'UNKNOWN_CONCEPT' | 'WRONG_INTUITION' | 'CONFUSION' | 'AVOIDANCE';
    severity: 'critical' | 'moderate' | 'minor';
    recommendation: string;
  };
}

/**
 * PrerequisiteDetector - Invisible Assessment Agent
 * 
 * Analyzes student responses during wonder hooks and early interactions
 * to detect prerequisite knowledge gaps WITHOUT making it feel like a test.
 * 
 * Key Principles:
 * - Wonder hooks do double-duty (engage + assess)
 * - Never explicit testing ("Do you know X?")
 * - Natural conversation reveals understanding
 * - Canvas drawings expose knowledge silently
 * - Micro-lessons triggered on gaps (30-60 sec)
 */
export class PrerequisiteDetector {
  private google: ReturnType<typeof createGoogleGenerativeAI>;
  private modelName: string;

  constructor(apiKey?: string, modelName: string = 'gemini-2.0-flash-exp') {
    const key = apiKey || '';
    this.modelName = modelName;
    
    if (!key) {
      logger.warn('No API key provided. Prerequisite detection will fail at runtime.');
    }
    
    this.google = createGoogleGenerativeAI({ apiKey: key });
  }

  /**
   * Analyze student response for prerequisite understanding
   * Uses Gemini Flash with structured JSON output
   */
  async analyze(input: PrerequisiteAnalysisInput): Promise<PrerequisiteAnalysisResult> {
    const startTime = Date.now();
    
    try {
      const result = await pRetry(
        () => this.analyzeWithRetry(input),
        {
          retries: 2,
          minTimeout: 500,
          onFailedAttempt: (error) => {
            logger.warn(`[PrerequisiteDetector] Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`);
          },
        }
      );

      const latency = Date.now() - startTime;
      logger.info(`[PrerequisiteDetector] Analysis complete in ${latency}ms`, {
        status: result.status,
        concept: result.concept,
        confidence: result.confidence,
      });
      
      return result;
    } catch (error) {
      logger.error('[PrerequisiteDetector] All retry attempts failed', { error });
      
      // Fallback: unclear status (don't block lesson)
      return {
        status: 'UNCLEAR',
        prerequisiteId: input.prerequisite.id,
        concept: input.prerequisite.concept,
        confidence: 0.3,
        nextAction: 'PROBE_DEEPER',
      };
    }
  }

  private async analyzeWithRetry(input: PrerequisiteAnalysisInput): Promise<PrerequisiteAnalysisResult> {
    const { transcription, prerequisite, conversationContext, isWonderHook } = input;

    // OPTIMIZED PROMPT: Invisible assessment analysis
    const prompt = `You are analyzing a 3rd grader's response during a math lesson to detect prerequisite knowledge gaps.

CONTEXT: ${isWonderHook ? 'Wonder Hook (engaging story question)' : 'Lesson interaction'}
PREREQUISITE: ${prerequisite.concept}
DESCRIPTION: ${prerequisite.description}

QUESTION ASKED: "${prerequisite.wonderHookQuestion}"
STUDENT RESPONSE: "${transcription}"

CONVERSATION HISTORY: ${conversationContext?.join(' | ') || 'None'}

PASS SIGNALS (indicate understanding):
${prerequisite.passSignals.map(s => `- "${s}"`).join('\n')}

GAP SIGNALS (indicate missing knowledge):
${prerequisite.gapSignals.map(s => `- "${s}"`).join('\n')}

ANALYSIS TASK:
Does the student's response show they have this prerequisite knowledge?

OUTPUT JSON FORMAT:
{
  "status": "PREREQUISITE_MET" | "GAP_DETECTED" | "UNCLEAR" | "PROBE_DEEPER",
  "prerequisiteId": "${prerequisite.id}",
  "concept": "${prerequisite.concept}",
  "confidence": 0.0-1.0,
  "evidence": "exact quote from student showing understanding or gap",
  "nextAction": "CONTINUE_LESSON" | "TEACH_PREREQUISITE" | "PROBE_DEEPER" | "RE_ASSESS",
  "detectedGap": {
    "type": "UNKNOWN_CONCEPT" | "WRONG_INTUITION" | "CONFUSION" | "AVOIDANCE",
    "severity": "critical" | "moderate" | "minor",
    "recommendation": "one-sentence guidance"
  } // only if GAP_DETECTED
}

RULES:
- PREREQUISITE_MET: Clear evidence student understands (matches pass signals)
- GAP_DETECTED: Clear evidence student lacks understanding (matches gap signals or shows confusion)
- UNCLEAR: Response is ambiguous or off-topic (need more probing)
- PROBE_DEEPER: Student's answer suggests partial understanding (ask follow-up)
- Be generous - if student shows ANY understanding, prefer PREREQUISITE_MET
- Only flag critical gaps that would block learning
- Consider developmental appropriateness (3rd grade)

JSON:`;

    const { text } = await generateText({
      model: this.google(this.modelName),
      prompt,
      temperature: 0.1,
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
      if (!result.status || !result.prerequisiteId || typeof result.confidence !== 'number') {
        throw new Error('Invalid response structure');
      }
      
      return result;
    } catch (parseError) {
      logger.error('[PrerequisiteDetector] Failed to parse JSON response', { text, parseError });
      
      // Fallback
      return {
        status: 'UNCLEAR',
        prerequisiteId: prerequisite.id,
        concept: prerequisite.concept,
        confidence: 0.3,
        nextAction: 'PROBE_DEEPER',
      };
    }
  }

  /**
   * Quick batch check for multiple prerequisites
   * (used at lesson start for warm-up assessment)
   */
  async checkMultiple(
    transcriptions: Array<{ prerequisiteId: string; response: string }>,
    prerequisites: PrerequisiteSpec[]
  ): Promise<PrerequisiteAnalysisResult[]> {
    const results = await Promise.all(
      transcriptions.map(({ prerequisiteId, response }) => {
        const prereq = prerequisites.find(p => p.id === prerequisiteId);
        if (!prereq) {
          logger.warn(`[PrerequisiteDetector] Prerequisite ${prerequisiteId} not found`);
          return Promise.resolve({
            status: 'UNCLEAR' as const,
            prerequisiteId,
            concept: 'Unknown',
            confidence: 0,
            nextAction: 'CONTINUE_LESSON' as const,
          });
        }
        
        return this.analyze({
          transcription: response,
          prerequisite: prereq,
          isWonderHook: true,
        });
      })
    );
    
    return results;
  }

  /**
   * Determine if lesson can proceed based on prerequisite check results
   */
  canProceedWithLesson(results: PrerequisiteAnalysisResult[]): {
    canProceed: boolean;
    criticalGaps: PrerequisiteAnalysisResult[];
    recommendations: string[];
  } {
    const criticalGaps = results.filter(
      r => r.status === 'GAP_DETECTED' && r.detectedGap?.severity === 'critical'
    );

    const canProceed = criticalGaps.length === 0;

    const recommendations = criticalGaps.map(gap => 
      `Teach "${gap.concept}" before continuing: ${gap.detectedGap?.recommendation}`
    );

    logger.info('[PrerequisiteDetector] Lesson readiness check', {
      totalChecked: results.length,
      criticalGaps: criticalGaps.length,
      canProceed,
    });

    return {
      canProceed,
      criticalGaps,
      recommendations,
    };
  }
}
