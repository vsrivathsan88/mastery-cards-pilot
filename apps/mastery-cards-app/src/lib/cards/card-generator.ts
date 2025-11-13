/**
 * Generate MasteryCards from Lesson Data
 * Research-based progression: Equal Parts → Unit Fractions → Misconceptions → General Fractions
 * 
 * See CARD-PROGRESSION-PLAN.md for full scaffolding rationale
 */

import type { MasteryCard } from '../../types/cards';

/**
 * 20-Card Scaffolded Progression for Fractions (3.NF.A.1)
 * 
 * Phase 1: Foundation - Equal Parts (Cards 1-3)
 * Phase 2: Unit Fractions (Cards 4-7)
 * Phase 3: Misconceptions (Cards 8-10)
 * Phase 4: Notation & Vocabulary (Cards 11-13)
 * Phase 5: Building General Fractions (Cards 14-17)
 * Phase 6: Comparing Fractions (Cards 18-20)
 */
export const sampleCards: MasteryCard[] = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PHASE 1: FOUNDATION - EQUAL PARTS (Cards 1-3)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  {
    cardId: 'card-01-equal-parts-identify',
    masteryGoalId: 'mg-01-equal-parts-foundation',
    standard: '3.NF.A.1',
    title: 'What Are Equal Parts?',
    description: 'Understanding that fractions require equal-sized pieces',
    textPrompt: 'Look at these two circles. Which one is divided into equal parts? Why does that matter?',
    imageDescription: 'Two circles side by side. Left circle: divided into 2 equal halves with a clean vertical line. Right circle: divided unevenly with a wavy line, one part noticeably larger. Clean, child-friendly illustration.',
    masteryGoal: 'Student can identify equal vs unequal partitioning',
    successCriteria: 'Correctly identifies left circle, explains equal = same size',
    commonMisconceptions: ['Thinking any division creates fractions'],
    scaffoldLevel: 'foundational',
    prerequisiteFor: ['card-02-equal-parts-fairness', 'card-03-equal-parts-spot'],
    dependsOn: [],
    pointValue: 10,
    difficulty: 'easy',
  },
  
  {
    cardId: 'card-02-equal-parts-fairness',
    masteryGoalId: 'mg-02-equal-parts-fairness',
    standard: '3.NF.A.1',
    title: 'Why Equal Parts Matter',
    description: 'Fractions must be fair - equal parts for equal sharing',
    textPrompt: 'Imagine sharing this pizza with a friend. Is this fair? Why do we need equal pieces for fractions?',
    imageDescription: 'A pizza divided into 2 unequal slices. One slice is huge (about 3/4 of pizza), other slice is tiny (1/4). Make the size difference obvious and somewhat comical. Simple illustration.',
    masteryGoal: 'Student understands fairness argument for equal partitioning',
    successCriteria: 'Explains not fair, need equal parts to share equally',
    commonMisconceptions: ['Thinking fractions work with unequal parts'],
    scaffoldLevel: 'foundational',
    prerequisiteFor: ['card-04-unit-fraction-half'],
    dependsOn: ['card-01-equal-parts-identify'],
    pointValue: 10,
    difficulty: 'easy',
  },
  
  {
    cardId: 'card-03-equal-parts-spot',
    masteryGoalId: 'mg-03-equal-parts-recognition',
    standard: '3.NF.A.1',
    title: 'Spot the Equal Parts',
    description: 'Practice identifying equal partitioning in different shapes',
    textPrompt: 'Which of these shapes are divided into equal parts?',
    imageDescription: 'Four shapes in a 2x2 grid: (1) Rectangle divided into 3 equal vertical strips ✓, (2) Circle divided into 2 unequal parts ✗, (3) Square divided into 4 equal quadrants ✓, (4) Triangle divided into 3 unequal pieces ✗. Clean, colorful.',
    masteryGoal: 'Student can identify equal partitioning across contexts',
    successCriteria: 'Correctly identifies rectangle and square as equal',
    commonMisconceptions: [],
    scaffoldLevel: 'foundational',
    prerequisiteFor: ['card-04-unit-fraction-half', 'card-05-unit-fraction-third'],
    dependsOn: ['card-01-equal-parts-identify'],
    pointValue: 15,
    difficulty: 'medium',
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PHASE 2: UNIT FRACTIONS (Cards 4-7)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  {
    cardId: 'card-04-unit-fraction-half',
    masteryGoalId: 'mg-04-understand-1-2',
    standard: '3.NF.A.1',
    title: 'Understanding 1/2',
    description: '1/2 means one part when divided into 2 equal parts',
    textPrompt: 'What does 1/2 mean? Explain it in your own words.',
    imageDescription: 'A round chocolate chip cookie divided perfectly in half with a vertical line. Left half is shaded brown (with visible chocolate chips), right half is lighter/unshaded. Simple, appealing illustration.',
    masteryGoal: 'Student understands 1/2 as one of two equal parts',
    successCriteria: 'Explains equal division into 2, taking 1 part',
    commonMisconceptions: ['Saying "half" without mentioning equal parts'],
    scaffoldLevel: 'foundational',
    prerequisiteFor: ['card-07-compare-half-fourth', 'card-08-misconception-denominator'],
    dependsOn: ['card-02-equal-parts-fairness', 'card-03-equal-parts-spot'],
    pointValue: 10,
    difficulty: 'easy',
  },
  
  {
    cardId: 'card-05-unit-fraction-third',
    masteryGoalId: 'mg-05-understand-1-3',
    standard: '3.NF.A.1',
    title: 'Understanding 1/3',
    description: '1/3 means one part when divided into 3 equal parts',
    textPrompt: 'What does 1/3 mean?',
    imageDescription: 'A round cookie divided into 3 equal slices (like a pie chart with 120° angles). One slice is shaded. The division lines are clear and the pieces are visibly equal.',
    masteryGoal: 'Student understands 1/3 as one of three equal parts',
    successCriteria: 'Explains equal division into 3, taking 1 part',
    commonMisconceptions: [],
    scaffoldLevel: 'intermediate',
    prerequisiteFor: ['card-08-misconception-denominator', 'card-14-build-two-thirds'],
    dependsOn: ['card-04-unit-fraction-half', 'card-03-equal-parts-spot'],
    pointValue: 15,
    difficulty: 'medium',
  },
  
  {
    cardId: 'card-06-unit-fraction-fourth',
    masteryGoalId: 'mg-06-understand-1-4',
    standard: '3.NF.A.1',
    title: 'Understanding 1/4',
    description: '1/4 means one part when divided into 4 equal parts',
    textPrompt: 'What does 1/4 mean?',
    imageDescription: 'A square (like a sandwich) divided into 4 equal quadrants with a vertical and horizontal line. Top-left quadrant is shaded. Clean, simple illustration.',
    masteryGoal: 'Student understands 1/4 as one of four equal parts',
    successCriteria: 'Explains equal division into 4, taking 1 part',
    commonMisconceptions: [],
    scaffoldLevel: 'intermediate',
    prerequisiteFor: ['card-07-compare-half-fourth', 'card-15-build-three-fourths'],
    dependsOn: ['card-04-unit-fraction-half'],
    pointValue: 15,
    difficulty: 'medium',
  },
  
  {
    cardId: 'card-07-compare-half-fourth',
    masteryGoalId: 'mg-07-inverse-relationship',
    standard: '3.NF.A.1',
    title: 'Which is Bigger: 1/2 or 1/4?',
    description: 'Understanding that fewer parts = bigger pieces',
    textPrompt: 'Which piece is bigger - 1/2 or 1/4? Why?',
    imageDescription: 'Two identical cookies side by side. Left cookie: cut in half (vertical line), with one half shaded. Right cookie: cut into fourths (cross pattern), with one fourth shaded. Size difference should be visually obvious.',
    masteryGoal: 'Student understands inverse relationship (more cuts = smaller pieces)',
    successCriteria: 'Correctly identifies 1/2 as bigger, explains fewer cuts = bigger pieces',
    commonMisconceptions: ['Thinking 4 > 2 so 1/4 > 1/2'],
    scaffoldLevel: 'intermediate',
    prerequisiteFor: ['card-19-compare-same-numerator'],
    dependsOn: ['card-04-unit-fraction-half', 'card-06-unit-fraction-fourth'],
    pointValue: 20,
    difficulty: 'medium',
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PHASE 3: MISCONCEPTIONS (Cards 8-10)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  {
    cardId: 'card-08-misconception-denominator',
    masteryGoalId: 'mg-08-denominator-trap',
    standard: '3.NF.A.1',
    title: 'The Denominator Trap',
    description: 'Bigger denominator does NOT mean bigger fraction',
    textPrompt: 'Which is more pizza - 1/3 or 1/2? Some kids think 1/3 is more because 3 is bigger than 2. What do YOU think?',
    imageDescription: 'Two identical pizzas side by side. Left pizza: cut into thirds (like Mercedes logo), with 1 slice shaded red. Right pizza: cut in half (vertical line), with 1 slice shaded red. The 1/2 slice should be visibly larger.',
    masteryGoal: 'Student overcomes "bigger number = bigger fraction" misconception',
    successCriteria: 'Correctly identifies 1/2 as bigger, explicitly addresses why 3 > 2 doesn\'t mean 1/3 > 1/2',
    commonMisconceptions: ['Thinking larger denominator = larger fraction'],
    scaffoldLevel: 'intermediate',
    prerequisiteFor: [],
    dependsOn: ['card-04-unit-fraction-half', 'card-05-unit-fraction-third'],
    pointValue: 25,
    difficulty: 'hard',
  },
  
  {
    cardId: 'card-09-misconception-visual',
    masteryGoalId: 'mg-09-visual-deception',
    standard: '3.NF.A.1',
    title: 'Don\'t Be Fooled!',
    description: 'Fractions are about equal parts of the SAME whole',
    textPrompt: 'The red part looks bigger in the rectangle. Does that mean 1/4 is bigger than 1/2?',
    imageDescription: 'Two shapes: (1) Small circle with 1/2 shaded red (clearly labeled 1/2), (2) Large rectangle with 1/4 shaded red (clearly labeled 1/4). The visual trick: 1/4 of the large rectangle looks physically bigger than 1/2 of small circle.',
    masteryGoal: 'Student understands fractions depend on the whole, not absolute size',
    successCriteria: 'Explains that 1/2 is still bigger, because fractions compare parts of the SAME whole',
    commonMisconceptions: ['Judging fraction size by visual appearance only'],
    scaffoldLevel: 'intermediate',
    prerequisiteFor: [],
    dependsOn: ['card-04-unit-fraction-half', 'card-06-unit-fraction-fourth'],
    pointValue: 25,
    difficulty: 'hard',
  },
  
  {
    cardId: 'card-10-misconception-unequal',
    masteryGoalId: 'mg-10-reject-unequal',
    standard: '3.NF.A.1',
    title: 'Is This Really 1/3?',
    description: 'Unequal parts cannot be fractions',
    textPrompt: 'My friend says this shows 1/3. Is she right? Why or why not?',
    imageDescription: 'A rectangle divided into 3 unequal parts with vertical lines. Left piece is small (about 20%), middle piece is large (about 50%), right piece is medium (about 30%). Label says "1/3?" with a question mark.',
    masteryGoal: 'Student rejects unequal divisions as valid fractions',
    successCriteria: 'Says no, explains fractions require EQUAL parts',
    commonMisconceptions: ['Accepting any division as a fraction'],
    scaffoldLevel: 'intermediate',
    prerequisiteFor: [],
    dependsOn: ['card-01-equal-parts-identify', 'card-02-equal-parts-fairness'],
    pointValue: 20,
    difficulty: 'medium',
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PHASE 4: NOTATION & VOCABULARY (Cards 11-13)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  {
    cardId: 'card-11-denominator-meaning',
    masteryGoalId: 'mg-11-denominator-definition',
    standard: '3.NF.A.1',
    title: 'What Does the Bottom Number Mean?',
    description: 'The denominator tells how many equal parts',
    textPrompt: 'In the fraction 1/3, what does the 3 tell you?',
    imageDescription: 'A cookie divided into 3 equal parts. Below it, the fraction "1/3" is shown with an arrow pointing from the 3 (bottom number) to the 3 parts of the cookie.',
    masteryGoal: 'Student understands denominator = number of equal parts',
    successCriteria: 'Explains the 3 means "divided into 3 equal parts"',
    commonMisconceptions: [],
    scaffoldLevel: 'intermediate',
    prerequisiteFor: ['card-12-numerator-meaning', 'card-13-fraction-vocabulary'],
    dependsOn: ['card-05-unit-fraction-third'],
    pointValue: 15,
    difficulty: 'medium',
  },
  
  {
    cardId: 'card-12-numerator-meaning',
    masteryGoalId: 'mg-12-numerator-definition',
    standard: '3.NF.A.1',
    title: 'What Does the Top Number Mean?',
    description: 'The numerator tells how many parts we have',
    textPrompt: 'In the fraction 2/3, what does the 2 tell you?',
    imageDescription: 'A pizza divided into 3 equal slices, with 2 slices shaded. Below it, the fraction "2/3" with an arrow from the 2 (top number) to the 2 shaded slices.',
    masteryGoal: 'Student understands numerator = count of parts we\'re talking about',
    successCriteria: 'Explains the 2 means "we have 2 of those parts"',
    commonMisconceptions: [],
    scaffoldLevel: 'intermediate',
    prerequisiteFor: ['card-14-build-two-thirds', 'card-15-build-three-fourths'],
    dependsOn: ['card-11-denominator-meaning'],
    pointValue: 15,
    difficulty: 'medium',
  },
  
  {
    cardId: 'card-13-fraction-vocabulary',
    masteryGoalId: 'mg-13-fraction-terms',
    standard: '3.NF.A.1',
    title: 'Fraction Vocabulary',
    description: 'Learning the proper names: numerator and denominator',
    textPrompt: 'What are the fancy names for the top and bottom numbers in a fraction?',
    imageDescription: 'The fraction "3/4" displayed large. Labeled arrows: "numerator" pointing to 3, "denominator" pointing to 4. Simple, clear typography.',
    masteryGoal: 'Student knows terms numerator and denominator',
    successCriteria: 'Can correctly identify top = numerator, bottom = denominator',
    commonMisconceptions: ['Mixing up which is which'],
    scaffoldLevel: 'intermediate',
    prerequisiteFor: [],
    dependsOn: ['card-11-denominator-meaning', 'card-12-numerator-meaning'],
    pointValue: 10,
    difficulty: 'easy',
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PHASE 5: BUILDING GENERAL FRACTIONS (Cards 14-17)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  {
    cardId: 'card-14-build-two-thirds',
    masteryGoalId: 'mg-14-build-2-3',
    standard: '3.NF.A.1',
    title: 'Building 2/3',
    description: '2/3 means two copies of 1/3',
    textPrompt: 'What does 2/3 mean? How is it different from 1/3?',
    imageDescription: 'A cookie divided into 3 equal parts. 2 parts are shaded. Below, show the equation: 2/3 = 1/3 + 1/3 (with small visuals of the unit fractions adding together).',
    masteryGoal: 'Student understands 2/3 as iteration of unit fraction',
    successCriteria: 'Explains 2/3 = two 1/3 pieces, or 1/3 + 1/3',
    commonMisconceptions: [],
    scaffoldLevel: 'advanced',
    prerequisiteFor: ['card-16-build-any-fraction', 'card-18-compare-same-denominator'],
    dependsOn: ['card-05-unit-fraction-third', 'card-12-numerator-meaning'],
    pointValue: 20,
    difficulty: 'hard',
  },
  
  {
    cardId: 'card-15-build-three-fourths',
    masteryGoalId: 'mg-15-build-3-4',
    standard: '3.NF.A.1',
    title: 'Building 3/4',
    description: '3/4 means three copies of 1/4',
    textPrompt: 'What does 3/4 mean?',
    imageDescription: 'A square divided into 4 equal quadrants, with 3 quadrants shaded. Below, show: 3/4 = 1/4 + 1/4 + 1/4.',
    masteryGoal: 'Student understands 3/4 as iteration of unit fraction',
    successCriteria: 'Explains 3/4 = three 1/4 pieces',
    commonMisconceptions: [],
    scaffoldLevel: 'advanced',
    prerequisiteFor: ['card-16-build-any-fraction', 'card-20-benchmark-comparison'],
    dependsOn: ['card-06-unit-fraction-fourth', 'card-12-numerator-meaning'],
    pointValue: 20,
    difficulty: 'hard',
  },
  
  {
    cardId: 'card-16-build-any-fraction',
    masteryGoalId: 'mg-16-generalize-ab',
    standard: '3.NF.A.1',
    title: 'Any Fraction a/b',
    description: 'The pattern: a/b means a copies of 1/b',
    textPrompt: 'If you know what 1/5 means, how would you make 4/5?',
    imageDescription: 'A visual showing the pattern: 4/5 = 1/5 + 1/5 + 1/5 + 1/5. Show a bar divided into 5 equal parts with 4 shaded, and 4 separate unit fraction boxes below adding up.',
    masteryGoal: 'Student generalizes pattern to any fraction',
    successCriteria: 'Explains take 1/5 and repeat it 4 times',
    commonMisconceptions: [],
    scaffoldLevel: 'advanced',
    prerequisiteFor: [],
    dependsOn: ['card-14-build-two-thirds', 'card-15-build-three-fourths'],
    pointValue: 25,
    difficulty: 'hard',
  },
  
  {
    cardId: 'card-17-whole-as-fraction',
    masteryGoalId: 'mg-17-understand-n-n',
    standard: '3.NF.A.1',
    title: 'The Whole Thing',
    description: 'Understanding n/n = 1 whole',
    textPrompt: 'If you eat 4 out of 4 slices of pizza, what do you have?',
    imageDescription: 'A pizza divided into 4 slices, ALL 4 shaded. Labeled "4/4 = 1 whole". Show an equals sign pointing to a complete, undivided pizza.',
    masteryGoal: 'Student understands when numerator = denominator, you have the whole',
    successCriteria: 'Explains 4/4 = 1 whole, all the parts together',
    commonMisconceptions: ['Thinking n/n > 1'],
    scaffoldLevel: 'advanced',
    prerequisiteFor: [],
    dependsOn: ['card-14-build-two-thirds', 'card-15-build-three-fourths'],
    pointValue: 25,
    difficulty: 'hard',
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PHASE 6: COMPARING FRACTIONS (Cards 18-20)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  {
    cardId: 'card-18-compare-same-denominator',
    masteryGoalId: 'mg-18-compare-same-denom',
    standard: '3.NF.A.1',
    title: 'Comparing: Same Size Pieces',
    description: 'When pieces are the same size, more pieces = bigger fraction',
    textPrompt: 'Which is bigger - 2/5 or 4/5? How do you know?',
    imageDescription: 'Two identical bars divided into 5 equal parts. Top bar: 2 parts shaded (labeled 2/5). Bottom bar: 4 parts shaded (labeled 4/5). Size difference obvious.',
    masteryGoal: 'Student can compare fractions with same denominator',
    successCriteria: 'Correctly identifies 4/5 > 2/5, explains more pieces of same size',
    commonMisconceptions: [],
    scaffoldLevel: 'advanced',
    prerequisiteFor: [],
    dependsOn: ['card-14-build-two-thirds', 'card-16-build-any-fraction'],
    pointValue: 20,
    difficulty: 'medium',
  },
  
  {
    cardId: 'card-19-compare-same-numerator',
    masteryGoalId: 'mg-19-compare-same-numer',
    standard: '3.NF.A.1',
    title: 'Comparing: Different Size Pieces',
    description: 'Same number of pieces, but which pieces are bigger?',
    textPrompt: 'Which is bigger - 1/3 or 1/5? Why?',
    imageDescription: 'Two cookies. Left cookie: cut into thirds (Mercedes logo style), 1 slice shaded. Right cookie: cut into fifths (star pattern), 1 slice shaded. The 1/3 piece should look noticeably larger.',
    masteryGoal: 'Student can compare unit fractions (inverse relationship)',
    successCriteria: 'Correctly identifies 1/3 > 1/5, explains fewer cuts = bigger pieces',
    commonMisconceptions: ['Thinking 5 > 3 so 1/5 > 1/3'],
    scaffoldLevel: 'advanced',
    prerequisiteFor: [],
    dependsOn: ['card-07-compare-half-fourth', 'card-08-misconception-denominator'],
    pointValue: 25,
    difficulty: 'hard',
  },
  
  {
    cardId: 'card-20-benchmark-comparison',
    masteryGoalId: 'mg-20-use-benchmark',
    standard: '3.NF.A.1',
    title: 'Using 1/2 as a Benchmark',
    description: 'Compare fractions using 1/2 as a reference point',
    textPrompt: 'Is 3/8 bigger or smaller than 1/2? How can you figure it out?',
    imageDescription: 'Three bars divided into 8 equal parts. Top bar: 4 parts shaded, labeled "4/8 = 1/2" (the benchmark). Middle bar: 3 parts shaded, labeled "3/8". Bottom bar: 5 parts shaded, labeled "5/8". Visual shows comparison.',
    masteryGoal: 'Student can use 1/2 as reference point for comparison',
    successCriteria: 'Explains 4/8 = 1/2, and 3/8 < 4/8, so 3/8 < 1/2',
    commonMisconceptions: [],
    scaffoldLevel: 'advanced',
    prerequisiteFor: [],
    dependsOn: ['card-15-build-three-fourths', 'card-18-compare-same-denominator'],
    pointValue: 30,
    difficulty: 'hard',
  },
];

/**
 * Get cards for a session
 * For MVP: Returns cards in scaffolded order
 * Future: Adaptive based on student mastery
 */
export function getCardsForSession(options: {
  count?: number;
  scaffoldLevel?: 'foundational' | 'intermediate' | 'advanced' | 'all';
  startFrom?: number;
}): MasteryCard[] {
  const { count = 20, scaffoldLevel = 'all', startFrom = 0 } = options;
  
  let cards = sampleCards;
  
  // Filter by scaffold level
  if (scaffoldLevel !== 'all') {
    cards = cards.filter(card => card.scaffoldLevel === scaffoldLevel);
  }
  
  // Return requested range
  return cards.slice(startFrom, startFrom + count);
}

/**
 * Get card by ID
 */
export function getCardById(cardId: string): MasteryCard | undefined {
  return sampleCards.find(card => card.cardId === cardId);
}

/**
 * Get cards by phase
 */
export function getCardsByPhase(phase: 1 | 2 | 3 | 4 | 5 | 6): MasteryCard[] {
  const phaseRanges = {
    1: [0, 3],   // Cards 1-3: Equal Parts
    2: [3, 7],   // Cards 4-7: Unit Fractions
    3: [7, 10],  // Cards 8-10: Misconceptions
    4: [10, 13], // Cards 11-13: Notation
    5: [13, 17], // Cards 14-17: Building Fractions
    6: [17, 20], // Cards 18-20: Comparing
  };
  
  const [start, end] = phaseRanges[phase];
  return sampleCards.slice(start, end);
}

/**
 * Check if prerequisites are met for a card
 */
export function checkPrerequisites(
  cardId: string,
  masteredCards: Set<string>
): { met: boolean; missing: string[] } {
  const card = getCardById(cardId);
  if (!card) return { met: false, missing: [] };
  
  const missing = card.dependsOn.filter(prereqId => !masteredCards.has(prereqId));
  
  return {
    met: missing.length === 0,
    missing,
  };
}

/**
 * Get next recommended card based on mastery
 */
export function getNextCard(masteredCards: Set<string>): MasteryCard | null {
  // Find first card where prerequisites are met but card isn't mastered
  for (const card of sampleCards) {
    if (masteredCards.has(card.cardId)) continue;
    
    const { met } = checkPrerequisites(card.cardId, masteredCards);
    if (met) return card;
  }
  
  return null; // All cards mastered or prerequisites not met
}

/**
 * Shuffle cards (for variety in same phase)
 */
export function shuffleCards(cards: MasteryCard[]): MasteryCard[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
