/**
 * Emotional State Classifier
 * Detects student emotional state to guide adaptive teaching
 */

import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import pRetry from 'p-retry';

export interface EmotionalState {
  state: 'frustrated' | 'confused' | 'excited' | 'confident' | 'bored' | 'neutral';
  engagementLevel: number; // 0-1
  frustrationLevel: number; // 0-1
  confusionLevel: number; // 0-1
  confidence: number; // 0-1
  evidence: string[];
  recommendation: string;
}

export class EmotionalClassifier {
  private model: ReturnType<typeof createGoogleGenerativeAI>;

  constructor(apiKey: string) {
    this.model = createGoogleGenerativeAI({
      apiKey,
    });
  }

  /**
   * Analyze emotional state from transcript
   */
  async analyze(
    transcript: string,
    conversationHistory?: string[]
  ): Promise<EmotionalState> {
    const prompt = this.buildPrompt(transcript, conversationHistory);

    try {
      const result = await pRetry(
        async () => {
          return await generateText({
            model: this.model('gemini-2.0-flash-exp'),
            prompt,
            temperature: 0.2, // Low for consistent, fast analysis
            maxOutputTokens: 250, // Short output for speed
          });
        },
        {
          retries: 2,
          minTimeout: 1000,
          onFailedAttempt: (error) => {
            console.log(
              `[EmotionalClassifier] Attempt ${error.attemptNumber} failed. Retrying...`
            );
          },
        }
      );

      return this.parseResponse(result.text, transcript);
    } catch (error) {
      console.error('[EmotionalClassifier] Analysis failed:', error);
      
      // Return neutral state on error
      return {
        state: 'neutral',
        engagementLevel: 0.5,
        frustrationLevel: 0,
        confusionLevel: 0,
        confidence: 0,
        evidence: [],
        recommendation: 'Continue with current approach',
      };
    }
  }

  private buildPrompt(transcript: string, history?: string[]): string {
    const historyContext = history && history.length > 0
      ? `\nRECENT: ${history.slice(-2).join(' → ')}`
      : '';

    // OPTIMIZED PROMPT: Concise, structured, fast for Gemini 2.0 Flash
    return `Analyze student's emotional state. Return JSON ONLY.

STUDENT SAID: "${transcript}"${historyContext}

EMOTIONAL STATES:
- frustrated: "I don't know", giving up, repetitive errors
- confused: uncertainty, "wait", "I'm not sure"
- excited: enthusiasm, "cool!", "I get it!"
- confident: clear explanations, certainty
- bored: very short responses, disengaged
- neutral: normal engagement

OUTPUT JSON FORMAT:
{
  "state": "frustrated|confused|excited|confident|bored|neutral",
  "engagementLevel": 0.0-1.0,
  "frustrationLevel": 0.0-1.0,
  "confusionLevel": 0.0-1.0,
  "confidence": 0.0-1.0,
  "evidence": ["phrases"],
  "recommendation": "one-sentence guidance"
}

SCORING:
- engagement: 0=disengaged, 0.5=normal, 1=highly engaged
- frustration: 0=none, 1=very frustrated
- confusion: 0=clear, 1=very confused
- confidence: your assessment confidence (0-1)

RULES:
- Short responses might be thinking, not boredom
- Be accurate but quick
- Return valid JSON only

JSON:`;
  }

  private parseResponse(text: string, transcript: string): EmotionalState {
    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and normalize
      return {
        state: this.normalizeState(parsed.state),
        engagementLevel: this.clamp(parsed.engagementLevel || 0.5, 0, 1),
        frustrationLevel: this.clamp(parsed.frustrationLevel || 0, 0, 1),
        confusionLevel: this.clamp(parsed.confusionLevel || 0, 0, 1),
        confidence: this.clamp(parsed.confidence || 0.5, 0, 1),
        evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
        recommendation: parsed.recommendation || 'Continue with current approach',
      };
    } catch (error) {
      console.error('[EmotionalClassifier] Failed to parse response:', error);
      
      // Fallback: simple keyword detection
      return this.fallbackDetection(transcript);
    }
  }

  private normalizeState(state: string): EmotionalState['state'] {
    const normalized = state.toLowerCase();
    const validStates: EmotionalState['state'][] = [
      'frustrated', 'confused', 'excited', 'confident', 'bored', 'neutral'
    ];
    
    return validStates.includes(normalized as any) 
      ? (normalized as EmotionalState['state'])
      : 'neutral';
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Fallback detection using simple keywords
   */
  private fallbackDetection(transcript: string): EmotionalState {
    const lower = transcript.toLowerCase();

    // Frustrated indicators
    if (lower.match(/i don't know|this is hard|i can't|give up|impossible/i)) {
      return {
        state: 'frustrated',
        engagementLevel: 0.3,
        frustrationLevel: 0.7,
        confusionLevel: 0.5,
        confidence: 0.6,
        evidence: ['Frustrated language detected'],
        recommendation: 'Provide encouragement and break down into smaller steps',
      };
    }

    // Confused indicators
    if (lower.match(/not sure|confused|wait|huh|what do you mean/i)) {
      return {
        state: 'confused',
        engagementLevel: 0.6,
        frustrationLevel: 0.2,
        confusionLevel: 0.8,
        confidence: 0.7,
        evidence: ['Confusion indicators detected'],
        recommendation: 'Clarify current concept before moving forward',
      };
    }

    // Excited indicators
    if (lower.match(/cool|awesome|i get it|oh!|yes!|got it/i)) {
      return {
        state: 'excited',
        engagementLevel: 0.9,
        frustrationLevel: 0,
        confusionLevel: 0,
        confidence: 0.8,
        evidence: ['Positive enthusiasm detected'],
        recommendation: 'Reinforce success and build on momentum',
      };
    }

    // Confident indicators
    if (lower.match(/because|so|that means|i think|equal parts|denominator/i) && transcript.length > 30) {
      return {
        state: 'confident',
        engagementLevel: 0.8,
        frustrationLevel: 0,
        confusionLevel: 0.1,
        confidence: 0.7,
        evidence: ['Clear explanation with reasoning'],
        recommendation: 'Continue at current pace, introduce slight challenge',
      };
    }

    // Bored indicators (very short responses)
    if (transcript.length < 10 && !lower.match(/yes|no|ok|yeah/)) {
      return {
        state: 'bored',
        engagementLevel: 0.3,
        frustrationLevel: 0.1,
        confusionLevel: 0,
        confidence: 0.5,
        evidence: ['Disengaged short responses'],
        recommendation: 'Re-engage with interesting question or activity',
      };
    }

    // Default: neutral
    return {
      state: 'neutral',
      engagementLevel: 0.6,
      frustrationLevel: 0,
      confusionLevel: 0,
      confidence: 0.5,
      evidence: [],
      recommendation: 'Continue with current approach',
    };
  }
}
