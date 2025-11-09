/**
 * Generate MasteryCards from Lesson Data
 * Extracts mastery goals from lessons package and converts to cards
 */

import type { MasteryCard } from '../../types/cards';

// Sample cards for MVP (will extract from lessons package later)
export const sampleCards: MasteryCard[] = [
  {
    cardId: 'card-unit-fraction-half',
    masteryGoalId: 'mg-1-unit-fraction-1-2',
    standard: '3.NF.A.1',
    title: 'Understanding 1/2',
    description: '1/2 means one part when a whole is divided into 2 equal parts',
    textPrompt: 'Explain what 1/2 means in your own words',
    scaffoldLevel: 'foundational',
    prerequisiteFor: ['card-unit-fraction-third', 'card-compare-halves'],
    dependsOn: [],
    successCriteria: 'Student can explain equal partitioning and identify unit fraction',
    commonMisconceptions: ['Thinking 1/2 is just "half" without understanding equal parts'],
    pointValue: 10,
    difficulty: 'easy',
  },
  {
    cardId: 'card-equal-parts',
    masteryGoalId: 'mg-2-equal-parts-requirement',
    standard: '3.NF.A.1',
    title: 'Why Equal Parts Matter',
    description: 'Fractions require equal parts - unequal pieces cannot be called fractions',
    textPrompt: 'Why do the parts need to be equal for fractions?',
    scaffoldLevel: 'foundational',
    prerequisiteFor: ['card-unit-fraction-third', 'card-unit-fraction-fourth'],
    dependsOn: ['card-unit-fraction-half'],
    successCriteria: 'Student explains that unequal parts are unfair/not fractions',
    commonMisconceptions: ['Thinking any division counts as fractions'],
    pointValue: 15,
    difficulty: 'medium',
  },
  {
    cardId: 'card-unit-fraction-third',
    masteryGoalId: 'mg-3-unit-fraction-1-3',
    standard: '3.NF.A.1',
    title: 'Understanding 1/3',
    description: '1/3 means one part when a whole is divided into 3 equal parts',
    textPrompt: 'What does 1/3 mean?',
    scaffoldLevel: 'intermediate',
    prerequisiteFor: ['card-compare-thirds', 'card-three-thirds'],
    dependsOn: ['card-unit-fraction-half', 'card-equal-parts'],
    successCriteria: 'Student can explain 1/3 with equal partitioning',
    commonMisconceptions: [],
    pointValue: 15,
    difficulty: 'medium',
  },
  {
    cardId: 'card-unit-fraction-fourth',
    masteryGoalId: 'mg-4-unit-fraction-1-4',
    standard: '3.NF.A.1',
    title: 'Understanding 1/4',
    description: '1/4 means one part when a whole is divided into 4 equal parts',
    textPrompt: 'What does 1/4 mean?',
    scaffoldLevel: 'intermediate',
    prerequisiteFor: ['card-compare-fourths', 'card-four-fourths'],
    dependsOn: ['card-unit-fraction-half', 'card-equal-parts'],
    successCriteria: 'Student can explain 1/4 with equal partitioning',
    commonMisconceptions: [],
    pointValue: 15,
    difficulty: 'medium',
  },
  {
    cardId: 'card-compare-halves-thirds',
    masteryGoalId: 'mg-5-compare-1-2-vs-1-3',
    standard: '3.NF.A.1',
    title: 'Comparing 1/2 and 1/3',
    description: 'Understanding that 1/2 is bigger than 1/3 because fewer parts means bigger pieces',
    textPrompt: 'Which is bigger - 1/2 or 1/3? Why?',
    scaffoldLevel: 'advanced',
    prerequisiteFor: [],
    dependsOn: ['card-unit-fraction-half', 'card-unit-fraction-third'],
    successCriteria: 'Student correctly identifies 1/2 as bigger and explains fewer parts = bigger pieces',
    commonMisconceptions: ['Thinking 3 > 2, so 1/3 > 1/2 (denominator misconception)'],
    pointValue: 25,
    difficulty: 'hard',
  },
  {
    cardId: 'card-denominator-meaning',
    masteryGoalId: 'mg-6-denominator-meaning',
    standard: '3.NF.A.1',
    title: 'What the Bottom Number Means',
    description: 'The denominator (bottom number) tells how many equal parts the whole is divided into',
    textPrompt: 'In the fraction 1/3, what does the 3 tell you?',
    scaffoldLevel: 'intermediate',
    prerequisiteFor: ['card-numerator-meaning', 'card-build-fractions'],
    dependsOn: ['card-unit-fraction-third'],
    successCriteria: 'Student can explain the denominator represents number of equal parts',
    commonMisconceptions: [],
    pointValue: 15,
    difficulty: 'medium',
  },
  {
    cardId: 'card-numerator-meaning',
    masteryGoalId: 'mg-7-numerator-meaning',
    standard: '3.NF.A.1',
    title: 'What the Top Number Means',
    description: 'The numerator (top number) tells how many parts we are talking about',
    textPrompt: 'In the fraction 2/3, what does the 2 tell you?',
    scaffoldLevel: 'intermediate',
    prerequisiteFor: ['card-build-fractions'],
    dependsOn: ['card-denominator-meaning'],
    successCriteria: 'Student can explain the numerator represents count of parts',
    commonMisconceptions: [],
    pointValue: 15,
    difficulty: 'medium',
  },
  {
    cardId: 'card-build-two-thirds',
    masteryGoalId: 'mg-8-build-2-3',
    standard: '3.NF.A.1',
    title: 'Building 2/3',
    description: '2/3 means two parts, each of size 1/3',
    textPrompt: 'What does 2/3 mean? How is it different from 1/3?',
    scaffoldLevel: 'advanced',
    prerequisiteFor: [],
    dependsOn: ['card-unit-fraction-third', 'card-numerator-meaning'],
    successCriteria: 'Student explains 2/3 as two unit fractions combined',
    commonMisconceptions: [],
    pointValue: 20,
    difficulty: 'hard',
  },
  {
    cardId: 'card-build-three-fourths',
    masteryGoalId: 'mg-9-build-3-4',
    standard: '3.NF.A.1',
    title: 'Building 3/4',
    description: '3/4 means three parts, each of size 1/4',
    textPrompt: 'What does 3/4 mean?',
    scaffoldLevel: 'advanced',
    prerequisiteFor: [],
    dependsOn: ['card-unit-fraction-fourth', 'card-numerator-meaning'],
    successCriteria: 'Student explains 3/4 as three unit fractions combined',
    commonMisconceptions: [],
    pointValue: 20,
    difficulty: 'hard',
  },
  {
    cardId: 'card-whole-as-fraction',
    masteryGoalId: 'mg-10-whole-as-fraction',
    standard: '3.NF.A.1',
    title: 'The Whole as a Fraction',
    description: 'Understanding that 3/3 = 1 whole, 4/4 = 1 whole, etc.',
    textPrompt: 'If you have 3 out of 3 equal pieces, what do you have?',
    scaffoldLevel: 'advanced',
    prerequisiteFor: [],
    dependsOn: ['card-unit-fraction-third', 'card-build-two-thirds'],
    successCriteria: 'Student explains that all parts together make the whole',
    commonMisconceptions: ['Confusion about 3/3 being "more than 1"'],
    pointValue: 25,
    difficulty: 'hard',
  },
];

/**
 * Get cards for a session
 * For MVP: Returns sample cards in scaffolded order
 * Future: Extract from lessons package based on student level
 */
export function getCardsForSession(options: {
  count?: number;
  scaffoldLevel?: 'foundational' | 'intermediate' | 'advanced' | 'all';
}): MasteryCard[] {
  const { count = 10, scaffoldLevel = 'all' } = options;
  
  let cards = sampleCards;
  
  // Filter by scaffold level
  if (scaffoldLevel !== 'all') {
    cards = cards.filter(card => card.scaffoldLevel === scaffoldLevel);
  }
  
  // Return requested count
  return cards.slice(0, count);
}

/**
 * Shuffle cards for variety
 */
export function shuffleCards(cards: MasteryCard[]): MasteryCard[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
