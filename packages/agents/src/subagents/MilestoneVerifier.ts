/**
 * Milestone Verifier
 * Hybrid approach: Keyword detection + LLM verification
 */

import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import pRetry from 'p-retry';
import { Milestone } from '@simili/shared';

export interface MilestoneVerificationResult {
  milestone_achieved: boolean;
  confidence: number;
  evidence: string[];
  missing_concepts: string[];
  recommendation: 'advance' | 'practice_more' | 'clarify';
  reasoning: string;
}

export class MilestoneVerifier {
  private model: ReturnType<typeof createGoogleGenerativeAI>;

  constructor(apiKey: string) {
    this.model = createGoogleGenerativeAI({
      apiKey,
    });
  }

  /**
   * Verify if student has achieved milestone
   * Hybrid approach: First check keywords, then LLM verification if promising
   */
  async verify(
    milestone: Milestone,
    transcriptionHistory: string[],
    attempts: number,
    timeOnMilestone: number
  ): Promise<MilestoneVerificationResult> {
    // Phase 1: Quick keyword check
    const keywordScore = this.checkKeywords(milestone, transcriptionHistory);
    
    console.log('[MilestoneVerifier] Keyword score:', keywordScore);

    // If very low keyword match, skip LLM (save costs)
    if (keywordScore < 0.2) {
      return {
        milestone_achieved: false,
        confidence: 0.3,
        evidence: [],
        missing_concepts: ['Student hasn\'t demonstrated key concepts yet'],
        recommendation: 'practice_more',
        reasoning: 'Low keyword match - student needs more practice',
      };
    }

    // Phase 2: LLM verification (if keyword score is promising)
    return await this.llmVerification(
      milestone,
      transcriptionHistory,
      attempts,
      timeOnMilestone,
      keywordScore
    );
  }

  /**
   * Phase 1: Check if student has mentioned key concepts
   */
  private checkKeywords(milestone: Milestone, transcripts: string[]): number {
    if (!milestone.keywords || milestone.keywords.length === 0) {
      return 0.5; // Neutral if no keywords defined
    }

    const recentTranscripts = transcripts.slice(-5).join(' ').toLowerCase();
    const keywords = milestone.keywords.map(k => k.toLowerCase());

    let matchCount = 0;
    const matchedKeywords: string[] = [];

    for (const keyword of keywords) {
      if (recentTranscripts.includes(keyword)) {
        matchCount++;
        matchedKeywords.push(keyword);
      }
    }

    const score = matchCount / keywords.length;
    
    console.log('[MilestoneVerifier] Matched keywords:', matchedKeywords);
    return score;
  }

  /**
   * Phase 2: LLM verification with full context
   */
  private async llmVerification(
    milestone: Milestone,
    transcripts: string[],
    attempts: number,
    timeMs: number,
    keywordScore: number
  ): Promise<MilestoneVerificationResult> {
    const prompt = this.buildPrompt(milestone, transcripts, attempts, timeMs, keywordScore);

    try {
      const result = await pRetry(
        async () => {
          return await generateText({
            model: this.model('gemini-2.0-flash-exp'),
            prompt,
            temperature: 0.2, // Low temperature for consistent grading
            maxOutputTokens: 600,
          });
        },
        {
          retries: 2,
          minTimeout: 1000,
        }
      );

      return this.parseResponse(result.text);
    } catch (error) {
      console.error('[MilestoneVerifier] LLM verification failed:', error);
      
      // Fallback: Use keyword score only
      return {
        milestone_achieved: keywordScore > 0.7,
        confidence: keywordScore,
        evidence: ['Based on keyword analysis only'],
        missing_concepts: [],
        recommendation: keywordScore > 0.7 ? 'advance' : 'practice_more',
        reasoning: 'LLM verification failed, using keyword analysis',
      };
    }
  }

  private buildPrompt(
    milestone: Milestone,
    transcripts: string[],
    attempts: number,
    timeMs: number,
    keywordScore: number
  ): string {
    const timeMinutes = Math.round(timeMs / 60000);
    const recentTranscripts = transcripts.slice(-5);

    return `You are an expert educational assessor for elementary mathematics.

**Milestone to Assess:**
Title: "${milestone.title}"
Description: ${milestone.description}

**Expected Understanding:**
${(milestone as any).expectedConcepts?.map((c: string) => `- ${c}`).join('\n') || 'N/A'}

**Keywords to look for:**
${milestone.keywords?.join(', ') || 'N/A'}

**Student's Recent Utterances:**
${recentTranscripts.map((t, i) => `${i + 1}. "${t}"`).join('\n')}

**Context:**
- Attempts on this milestone: ${attempts}
- Time spent: ${timeMinutes} minutes
- Keyword match score: ${(keywordScore * 100).toFixed(0)}%

**Your Task:**
Determine if the student has achieved mastery of this milestone. Be rigorous but fair.

**Criteria for Mastery:**
1. Student demonstrates understanding through their own words
2. Student can explain the concept, not just repeat keywords
3. Student shows application or examples
4. Understanding appears genuine, not guessed

**Response Format (JSON only):**
{
  "milestone_achieved": true|false,
  "confidence": 0.0-1.0,
  "evidence": ["specific quotes showing understanding"],
  "missing_concepts": ["concepts not yet demonstrated"],
  "recommendation": "advance|practice_more|clarify",
  "reasoning": "brief explanation of decision"
}

**Guidelines:**
- confidence: 0.9+ for clear mastery, 0.5-0.8 for partial, <0.5 for insufficient
- recommendation:
  - "advance" if milestone_achieved with confidence >0.8
  - "practice_more" if understanding emerging but incomplete
  - "clarify" if student shows confusion or misconceptions
- Be specific in evidence and missing_concepts
- Consider attempts and time (struggling students need more patience)

Respond with JSON only:`;
  }

  private parseResponse(text: string): MilestoneVerificationResult {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        milestone_achieved: parsed.milestone_achieved === true,
        confidence: this.clamp(parsed.confidence || 0.5, 0, 1),
        evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
        missing_concepts: Array.isArray(parsed.missing_concepts) ? parsed.missing_concepts : [],
        recommendation: this.normalizeRecommendation(parsed.recommendation),
        reasoning: parsed.reasoning || 'No reasoning provided',
      };
    } catch (error) {
      console.error('[MilestoneVerifier] Parse failed:', error);
      
      // Fallback: conservative assessment
      return {
        milestone_achieved: false,
        confidence: 0.3,
        evidence: [],
        missing_concepts: ['Unable to verify - parse error'],
        recommendation: 'practice_more',
        reasoning: 'Parse error occurred',
      };
    }
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private normalizeRecommendation(rec: string): 'advance' | 'practice_more' | 'clarify' {
    const normalized = (rec || '').toLowerCase();
    
    if (normalized.includes('advance')) return 'advance';
    if (normalized.includes('clarify')) return 'clarify';
    return 'practice_more';
  }
}
