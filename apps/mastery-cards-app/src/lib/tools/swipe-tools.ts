/**
 * Swipe Tools for Pi Assessment
 * Just 2 tools: swipe_right (mastered) and swipe_left (needs practice)
 */

export interface FunctionCall {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  isEnabled: boolean;
}

export const swipeTools: FunctionCall[] = [
  {
    name: 'swipe_right',
    description: `Call this when the student demonstrates mastery of the current card's concept.
    
Use when:
- Student explains the concept correctly
- Student shows clear understanding
- Evidence of mastery is strong (confidence >= 0.7)

This awards points and moves the card to "mastered" pile.

IMPORTANT: Always call this or swipe_left after assessing the student. Never leave a card unassessed.`,
    
    parameters: {
      type: 'OBJECT',
      properties: {
        cardId: {
          type: 'STRING',
          description: 'ID of the card being assessed',
        },
        evidence: {
          type: 'STRING',
          description: 'What the student said/did that shows mastery (1-2 sentences)',
        },
        confidence: {
          type: 'NUMBER',
          description: 'How confident you are they mastered it (0.0-1.0). Use 0.9+ for perfect, 0.7-0.9 for good, below 0.7 means swipe_left instead.',
        },
      },
      required: ['cardId', 'evidence', 'confidence'],
    },
    isEnabled: true,
  },
  
  {
    name: 'swipe_left',
    description: `Call this when the student needs more practice with this concept.

Use when:
- Student shows confusion or misconception
- Answer is incorrect or incomplete
- They need to see this card again later
- Confidence in mastery is below 0.7

This adds the card to spaced repetition queue.

IMPORTANT: Always call this or swipe_right after assessing. Be encouraging even when swiping left!`,
    
    parameters: {
      type: 'OBJECT',
      properties: {
        cardId: {
          type: 'STRING',
          description: 'ID of the card being assessed',
        },
        reason: {
          type: 'STRING',
          description: 'Why they need more practice (brief, 1 sentence)',
        },
        difficulty: {
          type: 'STRING',
          enum: ['again', 'hard', 'good'],
          description: `How soon should this card come back?
          - "again": 5 minutes (major confusion, needs immediate retry)
          - "hard": 15 minutes (partially understood, needs more time)
          - "good": 1 hour (close to mastery, just needs one more review)`,
        },
      },
      required: ['cardId', 'reason', 'difficulty'],
    },
    isEnabled: true,
  },
];
