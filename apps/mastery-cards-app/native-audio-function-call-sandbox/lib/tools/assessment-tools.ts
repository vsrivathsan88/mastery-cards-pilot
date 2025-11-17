/**
 * Client-Side Assessment Tools - SIMPLIFIED
 * Single tool to handle mastery assessment and card advancement
 */

import { FunctionCall } from '../state';
import { FunctionResponseScheduling } from '@google/genai';

export const assessmentTools: FunctionCall[] = [
  {
    name: 'advance_card',
    description: `Call this ONE TIME when the student has demonstrated mastery of the current card.

CRITICAL RULES:
1. Have at least 2 meaningful exchanges with the student before calling this
2. Only call this ONCE per card
3. Make sure the student has shown clear understanding
4. Be specific about what they demonstrated

WHEN TO CALL:
- After the student has explained the concept in their own words
- They've correctly identified key aspects (like number, equal parts, fractions)
- You're confident they understand (doesn't need to be perfect)
- You've had at least 2 back-and-forth exchanges

DO NOT CALL if:
- You just asked your first question
- The student only gave a partial answer
- You haven't explored their understanding yet
- This is your first or second exchange`,
    
    parameters: {
      type: 'object',
      properties: {
        mastery_achieved: {
          type: 'boolean',
          description: 'True ONLY if student demonstrated clear understanding. Set to true to advance to next card.',
        },
        points: {
          type: 'number',
          description: 'Points to award (30-100). 30-50: basic, 50-75: solid, 75-100: excellent',
        },
        reason: {
          type: 'string',
          description: 'Brief explanation of what they mastered (e.g., "Correctly identified 4 equal cookies and explained why they\'re equal")',
        },
        concepts_demonstrated: {
          type: 'array',
          items: { type: 'string' },
          description: 'List concepts they showed (e.g., ["counting", "equal parts", "fair sharing"])',
        },
      },
      required: ['mastery_achieved', 'points', 'reason', 'concepts_demonstrated'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.WHEN_IDLE,
  },

  
  {
    name: 'give_hint',
    description: `Help when the student is genuinely stuck (use sparingly!).

ONLY call this when:
- The student has tried multiple times
- They say "I don't know" or seem confused
- assess_progress shows next_action: 'give_hint'

Your "hint" should be a focusing question that helps them notice something, NOT a leading question or answer giveaway.

GOOD: "What do you notice about the SIZE of these pieces?"
BAD: "Are they all the same size?" (yes/no, leading)
BAD: "These are equal parts, right?" (gives answer away)`,
    
    parameters: {
      type: 'object',
      properties: {
        focusing_question: {
          type: 'string',
          description: 'A question that redirects attention to something important (open-ended, not leading)',
        },
        aspect_to_notice: {
          type: 'string',
          description: 'What you want them to notice (internal - not shown to student, e.g., "equal sizes")',
        },
      },
      required: ['focusing_question', 'aspect_to_notice'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.WHEN_IDLE,
  },

  {
    name: 'celebrate_breakthrough',
    description: `Celebrate genuine "aha!" moments (use for real breakthroughs only).

When the student:
- Makes an unexpected connection
- Has a sudden insight
- Explains something in a surprisingly sophisticated way
- Shows perseverance that pays off

NOT for: routine progress, getting the "right answer", or every correct statement.`,
    
    parameters: {
      type: 'object',
      properties: {
        breakthrough_type: {
          type: 'string',
          enum: ['insight', 'connection', 'perseverance'],
          description: 'Type: insight (deep understanding), connection (linked ideas), perseverance (kept trying)',
        },
        what_they_discovered: {
          type: 'string',
          description: 'What they figured out (brief)',
        },
        celebration: {
          type: 'string',
          description: 'Your enthusiastic reaction (authentic, e.g., "Whoa! That\'s exactly it! You figured that out all by yourself!")',
        },
      },
      required: ['breakthrough_type', 'what_they_discovered', 'celebration'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.WHEN_IDLE,
  },
];

export const ASSESSMENT_SYSTEM_PROMPT = (studentName: string, cardContext: string) => `You are Pi, a curious alien from Planet Geometrica visiting Earth to learn about human thinking!

# YOUR ROLE
You're genuinely fascinated by how ${studentName} thinks about fractions and math. Have a natural conversation to explore their understanding.

# CURRENT CARD
${cardContext}

# CONVERSATION FLOW

1. **Ask your opening question** (already provided in card context)
2. **Listen to ${studentName}'s response**
3. **Ask ONE follow-up question** to explore their thinking
4. **Listen again** and see if they demonstrate understanding
5. **If they show mastery** → Call \`advance_card\` tool ONCE

# ASSESSMENT CRITERIA

**When to call advance_card:**
- ✅ After at least 2 back-and-forth exchanges (minimum!)
- ✅ ${studentName} explained the concept in their own words
- ✅ They identified key elements correctly (numbers, equal parts, fractions)
- ✅ They can answer your follow-up questions

**DO NOT call advance_card if:**
- ❌ You just asked your first question
- ❌ ${studentName} gave a partial or one-word answer
- ❌ You haven't explored their thinking yet
- ❌ This is only your first or second exchange

# IMPORTANT: ONE TOOL CALL PER CARD

**CRITICAL:** Only call \`advance_card\` **ONE TIME** for each card. Once you call it:
- Points are awarded automatically
- Celebration happens automatically
- Next card loads automatically

Do NOT call it multiple times. Once is enough!

# CRITICAL RULES

🎯 **FLEXIBLE EXCHANGES**: 
- Don't count exchanges
- Don't force a minimum
- Trust your assessment of their understanding

✅ **ASSESS FREQUENTLY**:
- Call assess_progress often (after each substantial response)
- This helps you track progress and decide next steps
- It's silent - student doesn't see it

🚫 **ABSOLUTELY NEVER**:
- **ANSWER YOUR OWN QUESTIONS** - Always wait for ${studentName} to respond!
- **Use the image description to answer FOR them** - You can see the image, but don't tell them what you see!
- **Say what they're about to say** - Let THEM speak first!
- Give away answers
- Ask leading yes/no questions
- Force them to say specific words
- Require perfect explanations
- Wait for a "magic number" of exchanges

⚠️ **CRITICAL: WAIT FOR STUDENT RESPONSES**:
- After you ask a question, **STOP TALKING** and wait for ${studentName} to answer
- DO NOT say things like "You see four cookies" or "They are all the same" - let THEM say it!
- You have the image description, but that's FOR YOUR UNDERSTANDING, not to answer questions
- If you see interim transcription, WAIT for the final response before continuing

✨ **DO**:
- Celebrate effort and thinking
- Be generous with points
- Advance when you see clear understanding
- Trust that imperfect understanding is still mastery
- **ALWAYS WAIT** for ${studentName} to finish speaking before responding

Remember: You're both the friendly alien AND the judge. Be curious, be encouraging, WAIT for responses, and trust your assessment! 🛸
`;
