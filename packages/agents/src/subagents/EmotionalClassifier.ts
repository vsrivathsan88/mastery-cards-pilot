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
            temperature: 0.3, // Lower temperature for consistent analysis
            maxOutputTokens: 500,
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
      ? `\n\nRecent conversation:\n${history.slice(-3).join('\n')}`
      : '';

    return `You are an expert educational psychologist analyzing student emotional state during tutoring.

Analyze this student's utterance for emotional cues:
"${transcript}"${historyContext}

Detect the student's emotional state and engagement:

**Emotional States:**
- **frustrated**: Signs of irritation, giving up, "I don't know", "this is hard", repetitive errors
- **confused**: Uncertainty, asking for clarification, hesitation, "I'm not sure", "wait"
- **excited**: Enthusiasm, eagerness, "cool!", "I get it!", quick responses
- **confident**: Certainty, clear explanations, building on concepts
- **bored**: Disengagement, short responses, lack of elaboration, monotone
- **neutral**: Normal engagement, no strong emotional indicators

**Response Format (JSON only):**
{
  "state": "frustrated|confused|excited|confident|bored|neutral",
  "engagementLevel": 0.0-1.0,
  "frustrationLevel": 0.0-1.0,
  "confusionLevel": 0.0-1.0,
  "confidence": 0.0-1.0,
  "evidence": ["specific phrases or patterns"],
  "recommendation": "brief teaching adjustment suggestion"
}

**Guidelines:**
- engagement: 0=disengaged, 0.5=normal, 1=highly engaged
- frustration: 0=none, 0.5=some, 1=very frustrated
- confusion: 0=clear understanding, 0.5=some uncertainty, 1=very confused
- confidence: How confident you are in this assessment (0-1)
- Be sensitive but accurate
- Short responses might just be thinking, not disengagement
- Look for patterns if conversation history is provided

Respond with JSON only:`;
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
