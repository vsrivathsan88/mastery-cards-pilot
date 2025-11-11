/**
 * MVP Card Data for 3.NF.A.1 Fraction Understanding
 * 8 cards with leveling progression
 */

export interface MasteryMilestone {
  description: string;
  points: number;
  evidenceKeywords: string[]; // Keywords Pi should listen for
}

export interface MasteryCard {
  id: string;
  cardNumber: number;
  phase: 'prerequisites' | 'unit_fractions' | 'non_unit' | 'misconceptions';
  title: string;
  context: string;
  imageUrl: string;
  imageDescription: string; // What Pi "sees" in the image
  learningGoal: string;
  piStartingQuestion: string;
  
  // Simplified milestones (1-2 per card)
  milestones: {
    basic: MasteryMilestone;
    advanced?: MasteryMilestone; // Optional
  };
  
  // For misconception cards only
  misconception?: {
    piWrongThinking: string;
    correctConcept: string;
    teachingMilestone: MasteryMilestone;
  };
}

export const MVP_CARDS: MasteryCard[] = [
  // Welcome/Cover Card (Intro Only - Auto-advances)
  {
    id: 'card-0-welcome',
    cardNumber: 0,
    phase: 'prerequisites',
    title: 'Welcome!',
    context: 'Session Introduction',
    imageUrl: '/images/Equal-parts-cover.png',
    imageDescription: 'Welcome cover image with "Equal Parts" title - this is just the session intro, not a learning card.',
    learningGoal: 'Greet student and introduce Pi (spelt like Pie) - auto-advances after acknowledgment',
    piStartingQuestion: 'Hey! I\'m Pi from Planet Geometrica and I\'m so curious about how you think about some fun things! Ready to explore together?',
    milestones: {
      basic: {
        description: 'Student says anything (yes, ready, okay, etc.) - auto-advances',
        points: 0, // No points for welcome card
        evidenceKeywords: [], // Not used - auto-advances on any response
      },
    },
  },
  
  {
    id: 'card-1-cookies',
    cardNumber: 1,
    phase: 'prerequisites',
    title: 'Equal Cookies',
    context: 'Snack time at school',
    imageUrl: '/images/Cookie-1.png',
    imageDescription: 'Four round chocolate chip cookies arranged in a row. All cookies are the same size and appear identical.',
    learningGoal: 'Recognize equal groups and one-to-one correspondence',
    piStartingQuestion: 'What do you notice about these cookies?',
    milestones: {
      basic: {
        description: 'Student MUST mention BOTH: (1) the number 4, AND (2) that they are equal/same size/same/identical',
        points: 30,
        evidenceKeywords: ['four AND equal', 'four AND same', '4 AND equal', '4 AND same', 'same size', 'all equal', 'equal cookies', 'identical'],
      },
    },
  },
  
  {
    id: 'card-4-brownie-halves',
    cardNumber: 4,
    phase: 'prerequisites',
    title: 'Brownie Halves',
    context: 'Dessert sharing',
    imageUrl: '/images/Brownie-4.png',
    imageDescription: 'A rectangular brownie divided down the middle into two equal pieces with a vertical line.',
    learningGoal: 'Introduction to the term "one half" as 1 equal part of 2',
    piStartingQuestion: 'This brownie was split. What can you tell Pi about the two pieces?',
    milestones: {
      basic: {
        description: 'Student describes two equal pieces',
        points: 50,
        evidenceKeywords: ['two', 'pieces', 'equal', 'same size', 'split', 'middle'],
      },
      advanced: {
        description: 'Student uses or understands "half" or "one half"',
        points: 30,
        evidenceKeywords: ['half', 'one half', '1/2', 'halves'],
      },
    },
  },
  
  {
    id: 'card-7-half-ribbon',
    cardNumber: 7,
    phase: 'unit_fractions',
    title: 'Fraction Strip - Halves',
    context: 'Measuring ribbon for gift wrapping',
    imageUrl: '/images/Ribbon-7.png',
    imageDescription: 'A horizontal ribbon strip divided into 2 equal sections. One section is labeled "1/2".',
    learningGoal: 'Understand 1/2 as the quantity formed by 1 part when a whole is partitioned into 2 equal parts',
    piStartingQuestion: 'Pi sees a ribbon cut in half. Can you explain what "1/2" means here?',
    milestones: {
      basic: {
        description: 'Student explains what 1/2 represents as "one of the two pieces"',
        points: 40,
        evidenceKeywords: ['one of two', 'half', 'one piece', 'two pieces', 'divided'],
      },
    },
  },
  
  {
    id: 'card-8-third-pancake',
    cardNumber: 8,
    phase: 'unit_fractions',
    title: 'Fraction Circle - Thirds',
    context: 'Sharing a pancake',
    imageUrl: '/images/Pancake-8.png',
    imageDescription: 'A round pancake divided into 3 equal slices (like a pie chart with equal 120-degree angles). One slice is labeled "1/3".',
    learningGoal: 'Understand 1/3 as the quantity formed by 1 part when a whole is partitioned into 3 equal parts',
    piStartingQuestion: 'Three friends are sharing this pancake. What does the "1/3" label tell us?',
    milestones: {
      basic: {
        description: 'Student explains 1/3 means one of those parts',
        points: 40,
        evidenceKeywords: ['one of three', 'third', 'one piece', 'three pieces', 'three parts'],
      },
    },
  },
  
  {
    id: 'card-10-pizza-five-sixths',
    cardNumber: 10,
    phase: 'non_unit',
    title: 'Five Sixths of a Pizza',
    context: 'Pizza party',
    imageUrl: '/images/Pizza-10.png',
    imageDescription: 'A round pizza divided into 6 equal slices. 5 slices remain (shown), and 1 slice is missing/eaten. The remaining portion is labeled "5/6".',
    learningGoal: 'Understand 5/6 as the quantity formed by 5 parts when a whole is partitioned into 6 equal parts',
    piStartingQuestion: 'Someone ate one slice of this pizza. What fraction is left?',
    milestones: {
      basic: {
        description: 'Student identifies 5 pieces remaining out of 6 total',
        points: 50,
        evidenceKeywords: ['five', '5', 'six', '6', 'five out of six', '5/6', 'five sixths'],
      },
      advanced: {
        description: 'Student explains what 5/6 means or connects to unit fractions',
        points: 40,
        evidenceKeywords: ['five sixths', 'five 1/6', 'one away from whole', 'almost all'],
      },
    },
  },
  
  {
    id: 'card-11-garden-three-fourths',
    cardNumber: 11,
    phase: 'non_unit',
    title: 'Three Fourths of a Garden',
    context: 'Planting flowers',
    imageUrl: '/images/Garden-11.png',
    imageDescription: 'A rectangular garden divided into 4 equal sections (2x2 grid). 3 sections have flowers planted (shown with plants/flowers), and 1 section is empty dirt.',
    learningGoal: 'Understand 3/4 as the quantity formed by 3 parts when a whole is partitioned into 4 equal parts',
    piStartingQuestion: 'A gardener planted 3 out of 4 sections. What fraction of the garden has flowers?',
    milestones: {
      basic: {
        description: 'Student identifies 3 planted sections and explains as "three fourths"',
        points: 50,
        evidenceKeywords: ['three', '3', 'four', '4', 'three fourths', '3/4', 'three out of four'],
      },
    },
  },
  
  {
    id: 'card-13-misconception-sixths',
    cardNumber: 13,
    phase: 'misconceptions',
    title: 'Misconception: Bigger Denominator',
    context: 'Lunch choices - Pi is confused!',
    imageUrl: '/images/Misconception-13.png',
    imageDescription: 'Two identical circles side by side. Left circle: divided into 6 equal slices with one slice labeled "1/6". Right circle: divided into 3 equal slices with one slice labeled "1/3". The 1/3 slice is visibly larger than the 1/6 slice.',
    learningGoal: 'Correct the misconception that larger denominators mean larger fractions',
    piStartingQuestion: 'Pi is confused! Pi thinks 1/6 should be bigger than 1/3 because 6 is a bigger number than 3. Can you help Pi understand what\'s wrong with this thinking?',
    milestones: {
      basic: {
        description: 'Student identifies that 1/3 is actually bigger',
        points: 50,
        evidenceKeywords: ['1/3 is bigger', 'one third bigger', 'sixth smaller', 'picture shows'],
      },
    },
    misconception: {
      piWrongThinking: 'Pi thinks 1/6 is bigger than 1/3 because 6 > 3',
      correctConcept: 'More pieces = smaller individual parts (inverse relationship)',
      teachingMilestone: {
        description: 'Student teaches Pi about the inverse relationship - more pieces = smaller parts',
        points: 100,
        evidenceKeywords: [
          'more pieces',
          'smaller parts',
          'cut into more',
          'bigger number bottom',
          'tinier pieces',
          'more cuts',
        ],
      },
    },
  },
  
  {
    id: 'card-14-misconception-unequal',
    cardNumber: 14,
    phase: 'misconceptions',
    title: 'Misconception: Unequal Parts',
    context: 'Sharing a brownie - Pi made a mistake!',
    imageUrl: '/images/Misconception-14.png',
    imageDescription: 'A rectangular brownie divided into 4 pieces with 3 vertical lines, but the pieces are NOT equal sizes. One piece is large, two are medium, and one is small. It\'s labeled "1/4?" with a question mark.',
    learningGoal: 'Understand that fractions REQUIRE equal parts',
    piStartingQuestion: 'Pi cut this brownie into 4 pieces and thinks each piece is 1/4. But something seems wrong. What do you notice?',
    milestones: {
      basic: {
        description: 'Student notices the pieces are not the same size',
        points: 50,
        evidenceKeywords: ['different sizes', 'not equal', 'not the same', 'bigger', 'smaller', 'unfair'],
      },
    },
    misconception: {
      piWrongThinking: 'Pi thinks cutting into 4 pieces makes each piece 1/4',
      correctConcept: 'Fractions require equal-sized parts',
      teachingMilestone: {
        description: 'Student explains that fractions require equal parts, not just any division',
        points: 100,
        evidenceKeywords: [
          'equal parts',
          'same size',
          'have to be equal',
          'need equal',
          'measure',
          'fair shares',
        ],
      },
    },
  },
];

// Level progression system
export interface Level {
  level: number;
  title: string;
  minPoints: number;
  celebration: string;
}

export const LEVELS: Level[] = [
  {
    level: 1,
    title: 'Explorer',
    minPoints: 0,
    celebration: 'Welcome, Explorer! Let\'s discover fractions together!',
  },
  {
    level: 2,
    title: 'Discoverer',
    minPoints: 100,
    celebration: 'Whoa! Level up! You\'re now a Discoverer! Keep going! 🎉',
  },
  {
    level: 3,
    title: 'Pattern Finder',
    minPoints: 250,
    celebration: 'Wait WHAT?! Pattern Finder unlocked! You\'re seeing the connections! 🌟',
  },
  {
    level: 4,
    title: 'Fraction Master',
    minPoints: 500,
    celebration: 'NO WAY! You\'re a Fraction Master! That\'s absolutely incredible! 🏆',
  },
];

// Helper function to get current level based on points
export function getCurrentLevel(points: number): Level {
  const sortedLevels = [...LEVELS].sort((a, b) => b.minPoints - a.minPoints);
  return sortedLevels.find(level => points >= level.minPoints) || LEVELS[0];
}

// Helper function to get next level
export function getNextLevel(currentPoints: number): Level | null {
  const nextLevel = LEVELS.find(level => level.minPoints > currentPoints);
  return nextLevel || null;
}

// Helper function to calculate progress to next level
export function getProgressToNextLevel(currentPoints: number): {
  currentLevel: Level;
  nextLevel: Level | null;
  pointsToNext: number;
  progressPercentage: number;
} {
  const currentLevel = getCurrentLevel(currentPoints);
  const nextLevel = getNextLevel(currentPoints);
  
  if (!nextLevel) {
    return {
      currentLevel,
      nextLevel: null,
      pointsToNext: 0,
      progressPercentage: 100,
    };
  }
  
  const pointsToNext = nextLevel.minPoints - currentPoints;
  const pointsInCurrentRange = nextLevel.minPoints - currentLevel.minPoints;
  const pointsEarnedInRange = currentPoints - currentLevel.minPoints;
  const progressPercentage = Math.round((pointsEarnedInRange / pointsInCurrentRange) * 100);
  
  return {
    currentLevel,
    nextLevel,
    pointsToNext,
    progressPercentage,
  };
}
