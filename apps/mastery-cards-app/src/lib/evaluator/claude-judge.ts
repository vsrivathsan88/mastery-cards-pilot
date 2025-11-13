/**
 * Claude Haiku 4.5 - Mastery Evaluator
 * 
 * Simple, fast judge that evaluates if student has demonstrated understanding
 * Runs after each student response to determine if ready to progress
 */

import type { MasteryCard } from '../cards/mvp-cards-data';

export interface ConversationTurn {
  role: 'pi' | 'student' | 'system';
  text: string;
  timestamp: number;
}

export interface MasteryEvaluation {
  ready: boolean;
  confidence: number; // 0-100
  masteryLevel: 'none' | 'basic' | 'advanced' | 'teaching';
  reasoning: string;
  suggestedAction: 'continue' | 'award_and_next' | 'next_without_points';
  points?: number;
}

/**
 * Evaluate mastery using Claude Haiku 4.5 via backend proxy
 */
export async function evaluateMastery(
  card: MasteryCard,
  conversationHistory: ConversationTurn[],
  exchangeCount: number,
  _apiKey: string, // Kept for backwards compatibility but not used
  options?: { signal?: AbortSignal }
): Promise<MasteryEvaluation> {
  
  // Early exit: need at least 2 exchanges
  if (exchangeCount < 2) {
    return {
      ready: false,
      confidence: 0,
      masteryLevel: 'none',
      reasoning: 'Need at least 2 exchanges before evaluation',
      suggestedAction: 'continue'
    };
  }

  // Early exit: stuck after many exchanges
  if (exchangeCount >= 5) {
    return {
      ready: true,
      confidence: 100,
      masteryLevel: 'none',
      reasoning: 'Student stuck after 5+ exchanges, moving on',
      suggestedAction: 'next_without_points'
    };
  }

  const prompt = buildJudgePrompt(card, conversationHistory, exchangeCount);

  try {
    // Call backend proxy instead of Claude directly (fixes CORS + security)
    const response = await fetch('http://localhost:3001/api/claude/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: options?.signal,
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 500,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      console.error('[ClaudeJudge] API error:', response.status, response.statusText);
      // Fallback: conservative judgment
      return conservativeFallback(exchangeCount);
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Parse the JSON response
    const evaluation = parseJudgeResponse(content, card);
    
    console.log('[ClaudeJudge] Evaluation:', {
      exchangeCount,
      masteryLevel: evaluation.masteryLevel,
      confidence: evaluation.confidence,
      action: evaluation.suggestedAction,
      reasoning: evaluation.reasoning
    });

    return evaluation;

  } catch (error) {
    // If request was aborted, propagate so caller can ignore without fallback
    if ((error as any)?.name === 'AbortError') {
      throw error;
    }
    console.error('[ClaudeJudge] Error:', error);
    return conservativeFallback(exchangeCount);
  }
}

/**
 * Build the evaluation prompt for Claude
 */
function buildJudgePrompt(
  card: MasteryCard,
  history: ConversationTurn[],
  exchangeCount: number
): string {
  
  // Get recent conversation (last 10 turns)
  const recentHistory = history.slice(-10);
  const conversationText = recentHistory
    .map(turn => `${turn.role.toUpperCase()}: ${turn.text}`)
    .join('\n');

  // Build milestone descriptions
  const basicMilestone = `
BASIC MASTERY (${card.milestones.basic.points} points):
- Goal: ${card.milestones.basic.description}
- Evidence keywords: ${card.milestones.basic.evidenceKeywords.join(', ')}
`;

  const advancedMilestone = card.milestones.advanced ? `
ADVANCED MASTERY (${card.milestones.advanced.points} additional points):
- Goal: ${card.milestones.advanced.description}
- Evidence keywords: ${card.milestones.advanced.evidenceKeywords.join(', ')}
` : '';

  const teachingMilestone = card.misconception ? `
TEACHING MASTERY (${card.misconception.teachingMilestone.points} points):
- This is a MISCONCEPTION card
- Student needs to correct Pi's wrong thinking: "${card.misconception.piWrongThinking}"
- Correct concept: ${card.misconception.correctConcept}
- Evidence: ${card.misconception.teachingMilestone.evidenceKeywords.join(', ')}
` : '';

  return `You are an education evaluator for a fraction learning app. Analyze if the student has demonstrated understanding.

CARD: ${card.title}
LEARNING GOAL: ${card.learningGoal}
IMAGE: ${card.imageDescription}

MILESTONES:
${basicMilestone}${advancedMilestone}${teachingMilestone}

CONVERSATION (${exchangeCount} exchanges):
${conversationText}

EVALUATION CRITERIA:
1. Has the student explained the concept (not just described the image)?
2. Did they use reasoning words (because, so, if, when)?
3. Did they connect to the learning goal?
4. Is their explanation correct and clear?

IMPORTANT RULES:
- Basic mastery requires: explaining WHAT they see + WHY it matters
- Advanced mastery requires: deeper reasoning, connections, or multiple examples
- Teaching mastery (misconception cards): student must explain why Pi is wrong
- Must have at least 2 complete exchanges (question + answer)
- Short answers like "I don't know" or "maybe" = not ready
- Guessing without explanation = not ready
- Repeating the question = not ready

Return ONLY a JSON object (no markdown, no code blocks):
{
  "ready": boolean,
  "confidence": number (0-100),
  "masteryLevel": "none" | "basic" | "advanced" | "teaching",
  "reasoning": "brief 1-sentence explanation",
  "suggestedAction": "continue" | "award_and_next" | "next_without_points",
  "points": number (if ready=true and masteryLevel != none)
}

If ready=true and masteryLevel="basic", points should be ${card.milestones.basic.points}
If ready=true and masteryLevel="advanced", points should be ${card.milestones.basic.points + (card.milestones.advanced?.points || 0)}
If ready=true and masteryLevel="teaching", points should be ${card.misconception?.teachingMilestone.points || 0}
If ready=false, omit points field.

JSON response:`;
}

/**
 * Parse Claude's JSON response
 */
function parseJudgeResponse(content: string, _card: MasteryCard): MasteryEvaluation {
  try {
    // Extract JSON from response (handle if Claude wraps it in markdown)
    let jsonStr = content.trim();
    
    // Remove markdown code blocks if present
    jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    const parsed = JSON.parse(jsonStr);
    
    // Validate and normalize
    return {
      ready: Boolean(parsed.ready),
      confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 0)),
      masteryLevel: ['none', 'basic', 'advanced', 'teaching'].includes(parsed.masteryLevel) 
        ? parsed.masteryLevel 
        : 'none',
      reasoning: String(parsed.reasoning || 'No reasoning provided'),
      suggestedAction: ['continue', 'award_and_next', 'next_without_points'].includes(parsed.suggestedAction)
        ? parsed.suggestedAction
        : 'continue',
      points: parsed.points ? Number(parsed.points) : undefined
    };
    
  } catch (error) {
    console.error('[ClaudeJudge] Failed to parse response:', content, error);
    return {
      ready: false,
      confidence: 0,
      masteryLevel: 'none',
      reasoning: 'Failed to parse judge response',
      suggestedAction: 'continue'
    };
  }
}

/**
 * Conservative fallback when Claude is unavailable
 */
function conservativeFallback(exchangeCount: number): MasteryEvaluation {
  // If 3+ exchanges and Claude is down, allow progression
  if (exchangeCount >= 3) {
    return {
      ready: true,
      confidence: 50,
      masteryLevel: 'none',
      reasoning: 'Fallback: moving on after multiple exchanges',
      suggestedAction: 'next_without_points'
    };
  }
  
  return {
    ready: false,
    confidence: 0,
    masteryLevel: 'none',
    reasoning: 'Fallback: continue conversation',
    suggestedAction: 'continue'
  };
}
