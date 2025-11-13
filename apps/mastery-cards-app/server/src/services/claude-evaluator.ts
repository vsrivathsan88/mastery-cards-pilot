/**
 * Claude Evaluator Service
 *
 * Handles evaluation requests to Claude Haiku for mastery assessment
 */

import Anthropic from '@anthropic-ai/sdk';
import { MasteryCard, TranscriptEntry } from './session-manager';

export interface MasteryEvaluation {
  ready: boolean;
  confidence: number;
  masteryLevel: 'none' | 'basic' | 'advanced' | 'teaching';
  reasoning: string;
  suggestedAction: 'continue' | 'award_and_next' | 'next_without_points';
  points?: number;
  focusArea?: string;
}

export class ClaudeEvaluator {
  private anthropic: Anthropic | null = null;

  constructor(apiKey: string) {
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey });
      console.log('[ClaudeEvaluator] Initialized with API key');
    } else {
      console.warn('[ClaudeEvaluator] No API key provided - evaluations will be simulated');
    }
  }

  /**
   * Evaluate student mastery using Claude
   */
  async evaluate(
    card: MasteryCard,
    transcript: TranscriptEntry[],
    studentName: string
  ): Promise<MasteryEvaluation> {
    // Early exit if not enough exchanges
    const studentTurns = transcript.filter(t => t.role === 'student').length;
    if (studentTurns < 2) {
      return {
        ready: false,
        confidence: 0,
        masteryLevel: 'none',
        reasoning: 'Not enough conversation yet',
        suggestedAction: 'continue'
      };
    }

    // If no API key, return simulated evaluation
    if (!this.anthropic) {
      return this.simulateEvaluation(transcript, card);
    }

    try {
      const prompt = this.buildEvaluationPrompt(card, transcript, studentName);

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 300,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return this.parseEvaluation(content.text, card);
      }

      // Fallback if parsing fails
      return {
        ready: false,
        confidence: 0,
        masteryLevel: 'none',
        reasoning: 'Failed to parse evaluation',
        suggestedAction: 'continue'
      };
    } catch (error) {
      console.error('[ClaudeEvaluator] API error:', error);
      return this.simulateEvaluation(transcript, card);
    }
  }

  /**
   * Build the evaluation prompt for Claude
   */
  private buildEvaluationPrompt(
    card: MasteryCard,
    transcript: TranscriptEntry[],
    studentName: string
  ): string {
    // Format transcript
    const conversationText = transcript
      .map(t => `${t.role.toUpperCase()}: ${t.text}`)
      .join('\n');

    // Build milestones description
    const basicMilestone = `
BASIC MASTERY (${card.milestones.basic.points} points):
- Description: ${card.milestones.basic.description}
- Evidence needed: ${card.milestones.basic.evidenceKeywords?.join(', ') || 'Clear explanation'}`;

    const advancedMilestone = card.milestones.advanced ? `
ADVANCED MASTERY (${card.milestones.advanced.points} points):
- Description: ${card.milestones.advanced.description}
- Evidence needed: ${card.milestones.advanced.evidenceKeywords?.join(', ') || 'Deep understanding'}` : '';

    const teachingMilestone = card.misconception ? `
TEACHING MASTERY (${card.misconception.teachingMilestone.points} points):
- This is a MISCONCEPTION card
- Student needs to correct Pi's wrong thinking: "${card.misconception.piWrongThinking}"
- Correct concept: ${card.misconception.correctConcept}` : '';

    return `You are an educator evaluating ${studentName}'s understanding of a concept.

CARD: ${card.title}
LEARNING GOAL: ${card.learningGoal}
IMAGE: ${card.imageDescription}

MILESTONES:
${basicMilestone}${advancedMilestone}${teachingMilestone}

CONVERSATION (${transcript.length} turns):
${conversationText}

EVALUATION CRITERIA:
1. Has the student explained the concept (not just described)?
2. Did they use reasoning words (because, so, if, when)?
3. Did they connect to the learning goal?
4. Is their explanation correct and clear?

RULES:
- Basic mastery: explaining WHAT + WHY
- Advanced mastery: deeper reasoning or connections
- Teaching mastery: student corrects Pi's misconception
- Must have at least 2 complete exchanges
- Short answers like "I don't know" = not ready

Return ONLY a JSON object:
{
  "ready": boolean,
  "confidence": number (0-100),
  "masteryLevel": "none" | "basic" | "advanced" | "teaching",
  "reasoning": "1-sentence explanation",
  "suggestedAction": "continue" | "award_and_next" | "next_without_points",
  "points": number (if ready and mastery level is not none),
  "focusArea": "optional suggestion for what to explore"
}`;
  }

  /**
   * Parse Claude's response
   */
  private parseEvaluation(response: string, card: MasteryCard): MasteryEvaluation {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Calculate points based on mastery level
      if (parsed.ready && parsed.masteryLevel !== 'none' && !parsed.points) {
        if (parsed.masteryLevel === 'basic') {
          parsed.points = card.milestones.basic.points;
        } else if (parsed.masteryLevel === 'advanced' && card.milestones.advanced) {
          parsed.points = card.milestones.basic.points + card.milestones.advanced.points;
        } else if (parsed.masteryLevel === 'teaching' && card.misconception) {
          parsed.points = card.misconception.teachingMilestone.points;
        }
      }

      return parsed;
    } catch (error) {
      console.error('[ClaudeEvaluator] Parse error:', error);
      return {
        ready: false,
        confidence: 0,
        masteryLevel: 'none',
        reasoning: 'Failed to parse evaluation',
        suggestedAction: 'continue'
      };
    }
  }

  /**
   * Simulate evaluation when API is not available
   */
  private simulateEvaluation(
    transcript: TranscriptEntry[],
    card: MasteryCard
  ): MasteryEvaluation {
    const studentTurns = transcript.filter(t => t.role === 'student');
    const hasExplanation = studentTurns.some(t =>
      t.text.toLowerCase().includes('because') ||
      t.text.toLowerCase().includes('so') ||
      t.text.length > 30
    );

    if (studentTurns.length >= 4 && hasExplanation) {
      return {
        ready: true,
        confidence: 75,
        masteryLevel: 'basic',
        reasoning: 'Simulated: Student showed understanding',
        suggestedAction: 'award_and_next',
        points: card.milestones.basic.points
      };
    }

    return {
      ready: false,
      confidence: 40,
      masteryLevel: 'none',
      reasoning: 'Simulated: Continue exploring',
      suggestedAction: 'continue',
      focusArea: 'Try asking why they think that'
    };
  }
}