# 📚 Lesson Creation Guide

## Overview

This guide shows you how to create high-quality lessons for the Simili AI tutor. We'll walk through the complete process with a concrete example.

---

## 🏗️ Architecture (Where Things Go)

```
packages/lessons/
├── src/
│   ├── definitions/
│   │   ├── fractions/
│   │   │   ├── lesson-1-chocolate-bar.json     ← Existing lesson
│   │   │   ├── lesson-2-pizza-slices.json      ← You'll create this
│   │   │   └── lesson-3-comparing-sizes.json   ← And this
│   │   ├── addition/                           ← New subject folder
│   │   │   └── lesson-1-single-digit.json
│   │   └── geometry/
│   │       └── lesson-1-shapes.json
│   ├── loader/
│   │   └── LessonLoader.ts                     ← Register lessons here
│   └── index.ts
```

**How it works:**
1. You create a JSON file in `definitions/[subject]/`
2. You register it in `LessonLoader.ts`
3. It's automatically available in the app via `LessonLoader.getLesson(id)`

---

## 📋 Information You Need (Checklist)

Before creating a lesson, gather this information:

### **1. Basic Info**
- [ ] **Title** (kid-friendly, clear)
- [ ] **Grade Level** (K-5)
- [ ] **Subject** (fractions, addition, shapes, etc.)
- [ ] **Duration** (realistic estimate in minutes)
- [ ] **Short Description** (1-2 sentences)

### **2. Learning Objectives**
- [ ] 3-5 clear learning goals
- [ ] Written in student-friendly language
- [ ] Measurable/observable

### **3. Milestones** (The Journey)
- [ ] 3-7 progressive checkpoints
- [ ] Each has a clear focus
- [ ] Keywords students might say
- [ ] Prompt to guide students
- [ ] Expected concepts they should grasp

### **4. Common Misconceptions**
- [ ] What mistakes do kids make?
- [ ] Why do they make them?
- [ ] How to detect them (keywords)
- [ ] How to correct them (pedagogically sound)
- [ ] Severity (high/medium/low)

### **5. Assets (Optional but Recommended)**
- [ ] Images to illustrate concepts
- [ ] Visual examples
- [ ] Reference materials

### **6. Standards Alignment** (If applicable)
- [ ] Common Core (CCSS)
- [ ] State standards
- [ ] Custom standards

---

## 🎯 Example: Creating a New Lesson

Let's create **"Dividing Pizza Slices"** (fractions lesson 2).

### **Step 1: Gather Information**

**Basic Info:**
- Title: "Dividing Pizza Slices"
- Grade: 3rd
- Subject: fractions
- Duration: 12 minutes
- Description: "Learn to divide a pizza into equal parts and understand fraction notation using a fun pizza-sharing scenario"

**Learning Objectives:**
1. Divide a circle (pizza) into equal parts
2. Identify fractions from visual representations
3. Explain why pieces must be equal
4. Name fractions using proper notation (1/2, 1/4, 1/8)

**Milestones:**
1. Understanding fair sharing (equal parts)
2. Dividing a pizza into halves
3. Dividing into quarters
4. Identifying fraction notation from pictures

**Common Misconceptions:**
1. "Bigger piece = bigger fraction number" (1/8 > 1/2)
2. Unequal slices are okay
3. Can't have more than one piece (2/4 doesn't make sense)

**Assets:**
- Pizza whole (circle)
- Pizza divided in halves
- Pizza divided in quarters
- Pizza divided in eighths

---

### **Step 2: Create the JSON File**

Create: `packages/lessons/src/definitions/fractions/lesson-2-pizza-slices.json`

```json
{
  "id": "fractions-pizza-2",
  "title": "Dividing Pizza Slices",
  "description": "Learn to divide a pizza into equal parts and understand fraction notation through fun pizza-sharing scenarios.",
  "subject": "fractions",
  "gradeLevel": "3",
  "estimatedDuration": 12,
  
  "standards": [
    {
      "framework": "CCSS",
      "code": "3.NF.A.1",
      "description": "Understand a fraction 1/b as the quantity formed by 1 part when a whole is partitioned into b equal parts",
      "coverage": "partial"
    }
  ],
  
  "objectives": [
    "Divide a circle (pizza) into equal parts",
    "Identify fractions from visual representations",
    "Explain why pieces must be equal for fair sharing",
    "Use proper fraction notation (1/2, 1/4, 1/8)"
  ],
  
  "milestones": [
    {
      "id": "milestone-1",
      "order": 1,
      "title": "Fair Sharing Basics",
      "description": "Student understands that sharing fairly means equal-sized pieces",
      "keywords": [
        "fair",
        "equal",
        "same size",
        "sharing",
        "friends",
        "split"
      ],
      "prompt": "You have a pizza and want to share it with a friend. How would you cut it so both of you get the same amount?",
      "expectedConcepts": [
        "Fair sharing requires equal pieces",
        "Both people should get the same amount",
        "Need to cut down the middle"
      ],
      "completed": false
    },
    {
      "id": "milestone-2",
      "order": 2,
      "title": "Halves - Two Equal Parts",
      "description": "Student can identify and create halves (1/2)",
      "keywords": [
        "half",
        "halves",
        "1/2",
        "two pieces",
        "split in two",
        "middle"
      ],
      "prompt": "When we cut the pizza into 2 equal pieces, what do we call each piece?",
      "expectedConcepts": [
        "Each piece is called one half",
        "Written as 1/2",
        "Both halves together make the whole"
      ],
      "completed": false
    },
    {
      "id": "milestone-3",
      "order": 3,
      "title": "Quarters - Four Equal Parts",
      "description": "Student can identify and create quarters (1/4)",
      "keywords": [
        "quarter",
        "quarters",
        "1/4",
        "four pieces",
        "split in four",
        "fourth"
      ],
      "prompt": "Now we have 4 friends. How do we cut the pizza so everyone gets the same amount? What do we call each piece?",
      "expectedConcepts": [
        "Divide into 4 equal pieces",
        "Each piece is one quarter or 1/4",
        "Quarters are smaller than halves"
      ],
      "completed": false
    },
    {
      "id": "milestone-4",
      "order": 4,
      "title": "Reading Fraction Pictures",
      "description": "Student can identify fractions from shaded pizza diagrams",
      "keywords": [
        "shaded",
        "colored",
        "eaten",
        "left",
        "parts",
        "out of"
      ],
      "prompt": "Look at this pizza picture. If some slices are shaded, can you tell me what fraction that represents?",
      "expectedConcepts": [
        "Count shaded parts vs. total parts",
        "Write as fraction: shaded/total",
        "Can identify 1/2, 1/4, 2/4, 3/4 from pictures"
      ],
      "completed": false
    }
  ],
  
  "assets": [
    {
      "type": "image",
      "id": "pizza-whole",
      "url": "/assets/fractions/pizza-whole.svg",
      "alt": "A whole round pizza",
      "usage": "introduction"
    },
    {
      "type": "image",
      "id": "pizza-halves",
      "url": "/assets/fractions/pizza-halves.svg",
      "alt": "A pizza divided into two equal halves",
      "usage": "milestone-2"
    },
    {
      "type": "image",
      "id": "pizza-quarters",
      "url": "/assets/fractions/pizza-quarters.svg",
      "alt": "A pizza divided into four equal quarters",
      "usage": "milestone-3"
    }
  ],
  
  "prerequisites": [
    "Basic understanding of equal vs. unequal",
    "Can count to 8"
  ],
  
  "nextLessons": [
    "fractions-3-nf-a-1",
    "fractions-comparing-3"
  ],
  
  "scaffolding": {
    "hints": [
      "Think about sharing with friends - everyone should get the same amount",
      "When we cut into more pieces, each piece gets smaller",
      "The bottom number tells you how many equal pieces total",
      "Try drawing a pizza on the canvas and splitting it up!"
    ],
    "commonMisconceptions": [
      {
        "misconception": "unequal-slices-okay",
        "description": "Thinking pizza can be divided into unequal slices and still be fair fractions",
        "evidence": [
          "Student draws unequal pizza slices",
          "Student says 'I cut it in two' without checking if equal"
        ],
        "correction": "For fractions, all pieces must be EXACTLY the same size. If one slice is bigger, it's not fair sharing and we can't use fraction names like 'half' or 'quarter'. Ask: 'Would all your friends be happy with these slices?'",
        "detectionKeywords": ["cut", "divided", "pieces", "slices"],
        "alignedToStandard": "3.NF.A.1",
        "severity": "high"
      },
      {
        "misconception": "more-pieces-means-bigger",
        "description": "Thinking 1/8 of a pizza is more than 1/2 because 8 > 2",
        "evidence": [
          "Student says '1/8 is bigger than 1/2'",
          "Student chooses 1/8 slice over 1/2 slice thinking it's more"
        ],
        "correction": "When we cut a pizza into MORE pieces, each piece gets SMALLER. Think about it: if you cut a pizza into 8 slices vs. 2 slices, are the 8 slices bigger or smaller? The more slices you make, the tinier each one is!",
        "detectionKeywords": ["bigger", "more", "larger", "1/8", "1/4"],
        "alignedToStandard": "3.NF.A.1",
        "severity": "high"
      },
      {
        "misconception": "cant-have-multiple-pieces",
        "description": "Not understanding that you can have 2 quarters (2/4) or 3 eighths (3/8)",
        "evidence": [
          "Student only talks about '1/4' never '2/4' or '3/4'",
          "Student confused when asked 'what if you eat 2 slices out of 4?'"
        ],
        "correction": "You can have more than one slice! If each slice is 1/4, and you take 2 slices, you have 2/4 of the pizza. The top number tells how many slices you took, the bottom tells how many equal slices the whole pizza was cut into.",
        "detectionKeywords": ["two pieces", "multiple", "2/4", "3/4"],
        "alignedToStandard": "3.NF.A.1",
        "severity": "medium"
      }
    ]
  },
  
  "metadata": {
    "createdAt": "2024-10-24T00:00:00Z",
    "updatedAt": "2024-10-24T00:00:00Z",
    "author": "Simili Team",
    "tags": ["fractions", "pizza", "visual", "equal-parts", "circles"]
  }
}
```

---

### **Step 3: Register in LessonLoader**

Edit: `packages/lessons/src/loader/LessonLoader.ts`

```typescript
import { LessonData } from '@simili/shared';
import chocolateBarLesson from '../definitions/fractions/lesson-1-chocolate-bar.json';
import pizzaSlicesLesson from '../definitions/fractions/lesson-2-pizza-slices.json'; // ADD THIS

export class LessonLoader {
  private static lessons: Map<string, LessonData> = new Map();

  static {
    // Pre-load available lessons
    this.lessons.set(
      'fractions-3-nf-a-1',
      chocolateBarLesson as unknown as LessonData
    );
    this.lessons.set(
      'fractions-chocolate-bar-1',
      chocolateBarLesson as unknown as LessonData
    );
    
    // ADD THIS:
    this.lessons.set(
      'fractions-pizza-2',
      pizzaSlicesLesson as unknown as LessonData
    );
  }

  // ... rest of the code stays the same
}
```

---

### **Step 4: Update WelcomeScreen to Show New Lesson**

Edit: `apps/tutor-app/components/demo/welcome-screen/WelcomeScreen.tsx`

```typescript
const LESSONS = [
  {
    id: 'fractions-3-nf-a-1',
    title: 'Understanding One Half',
    icon: '🍫',
    grade: '3rd Grade',
    duration: '15 min',
    color: '#FF6B9D',
  },
  {
    id: 'fractions-pizza-2',  // ADD THIS LESSON
    title: 'Dividing Pizza Slices',
    icon: '🍕',
    grade: '3rd Grade',
    duration: '12 min',
    color: '#FFA07A',
  },
  // ... rest
];
```

---

### **Step 5: Build and Test**

```bash
cd packages/lessons
pnpm run build

cd ../../apps/tutor-app
pnpm run build
pnpm run dev
```

**Then test:**
1. Select "Dividing Pizza Slices"
2. Click "Start Learning"
3. Say things that trigger milestones
4. Say misconceptions (e.g., "1/8 is bigger than 1/2")
5. Watch console for agent detection

---

## 🎨 Creating Good Milestones

**Bad Milestone:**
```json
{
  "title": "Understand fractions",
  "keywords": ["fraction"],
  "prompt": "Tell me about fractions"
}
```

**Good Milestone:**
```json
{
  "title": "Identify Fair Sharing",
  "description": "Student explains why equal pieces are needed for fair sharing",
  "keywords": [
    "equal",
    "fair",
    "same size",
    "everyone gets same",
    "not fair"
  ],
  "prompt": "You have 1 cookie and 2 friends. How do you share it fairly? What makes it fair?",
  "expectedConcepts": [
    "Fair means everyone gets the same amount",
    "Pieces must be equal",
    "If pieces are different sizes, it's not fair"
  ]
}
```

**Why the good one works:**
- Specific, testable understanding
- Clear detection keywords
- Natural conversation prompt
- Explicit expected concepts

---

## 🚨 Creating Good Misconceptions

**Structure:**
```json
{
  "misconception": "short-kebab-case-name",
  "description": "What the student is thinking (incorrectly)",
  "evidence": [
    "Observable behavior 1",
    "Observable behavior 2"
  ],
  "correction": "How to gently correct with reasoning",
  "detectionKeywords": ["words", "that", "indicate", "this"],
  "alignedToStandard": "CCSS.3.NF.A.1",
  "severity": "high|medium|low"
}
```

**Example:**
```json
{
  "misconception": "fractions-add-straight-across",
  "description": "Student thinks 1/2 + 1/2 = 2/4 (adding numerators and denominators separately)",
  "evidence": [
    "Student says '1 plus 1 is 2, and 2 plus 2 is 4, so 2/4'",
    "Student writes 1/2 + 1/2 = 2/4"
  ],
  "correction": "When we add fractions with the same denominator, we keep the denominator the same and add the numerators. 1/2 + 1/2 means 'one piece plus one piece when the whole is divided into 2', which is 2/2 = 1 whole. The pieces stay the same size, we just have more of them!",
  "detectionKeywords": ["plus", "add", "1/2 + 1/2", "2/4"],
  "alignedToStandard": "3.NF.A.2",
  "severity": "high"
}
```

---

## 📊 Complete Template

Here's a blank template you can copy:

```json
{
  "id": "subject-topic-number",
  "title": "Student-Friendly Title",
  "description": "1-2 sentence description",
  "subject": "subject-name",
  "gradeLevel": "3",
  "estimatedDuration": 15,
  
  "standards": [
    {
      "framework": "CCSS",
      "code": "3.NF.A.1",
      "description": "Standard description",
      "coverage": "full|partial|introduction"
    }
  ],
  
  "objectives": [
    "Learning objective 1",
    "Learning objective 2",
    "Learning objective 3"
  ],
  
  "milestones": [
    {
      "id": "milestone-1",
      "order": 1,
      "title": "Milestone Title",
      "description": "What student should understand",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "prompt": "Guiding question or task",
      "expectedConcepts": [
        "Concept 1",
        "Concept 2"
      ],
      "completed": false
    }
  ],
  
  "assets": [
    {
      "type": "image",
      "id": "asset-id",
      "url": "/assets/subject/filename.svg",
      "alt": "Description for accessibility",
      "usage": "introduction|milestone-1|milestone-2"
    }
  ],
  
  "prerequisites": [
    "What students should know before"
  ],
  
  "nextLessons": [
    "lesson-id-1",
    "lesson-id-2"
  ],
  
  "scaffolding": {
    "hints": [
      "Helpful hint 1",
      "Helpful hint 2"
    ],
    "commonMisconceptions": [
      {
        "misconception": "misconception-name",
        "description": "What student thinks",
        "evidence": ["Observable behavior"],
        "correction": "How to correct",
        "detectionKeywords": ["keywords"],
        "alignedToStandard": "CCSS.X.Y.Z",
        "severity": "high"
      }
    ]
  },
  
  "metadata": {
    "createdAt": "2024-10-24T00:00:00Z",
    "updatedAt": "2024-10-24T00:00:00Z",
    "author": "Your Name",
    "tags": ["tag1", "tag2", "tag3"]
  }
}
```

---

## ✅ Quality Checklist

Before finalizing a lesson, verify:

- [ ] **ID is unique** (won't conflict with existing)
- [ ] **3-7 milestones** (not too few, not too many)
- [ ] **Each milestone has 5+ keywords**
- [ ] **Keywords are natural things kids say**
- [ ] **At least 3 common misconceptions**
- [ ] **Misconceptions have clear detection keywords**
- [ ] **Prompts are conversational, not quiz-like**
- [ ] **Expected concepts are specific**
- [ ] **Standards properly aligned**
- [ ] **Registered in LessonLoader.ts**
- [ ] **Added to WelcomeScreen LESSONS array**
- [ ] **Built successfully** (`pnpm run build`)

---

## 🎯 Quick Start Workflow

**To create your first lesson:**

1. **Copy the chocolate bar lesson**
   ```bash
   cp packages/lessons/src/definitions/fractions/lesson-1-chocolate-bar.json \
      packages/lessons/src/definitions/fractions/lesson-2-YOUR-TOPIC.json
   ```

2. **Edit the JSON** (change all the content)

3. **Register it** in `LessonLoader.ts`

4. **Add to UI** in `WelcomeScreen.tsx`

5. **Build and test**
   ```bash
   cd packages/lessons && pnpm run build
   cd ../../apps/tutor-app && pnpm run build && pnpm run dev
   ```

---

## 📝 Next Steps

**After creating 1 good lesson:**
1. Test it thoroughly with the E2E guide
2. Watch agent logs to see if misconceptions are detected
3. Iterate on keywords if detection isn't working
4. Create 2-3 more lessons following the same pattern
5. Then decide if you need a CMS or if JSON files work fine

**Questions to ask yourself:**
- Are agents detecting the right moments?
- Are misconceptions being caught?
- Do keywords need tuning?
- Is the progression natural?

---

## 🆘 Need Help?

**If agents aren't detecting milestones:**
- Add more natural keywords students actually say
- Check console logs for what students are saying
- Lower the detection threshold (adjust agent sensitivity)

**If misconceptions aren't caught:**
- Add more detection keywords
- Make keywords more specific
- Check the MisconceptionClassifier logic

**If flow feels unnatural:**
- Simplify milestones (break into smaller steps)
- Make prompts more conversational
- Add more hints in scaffolding

---

**You're ready to create lessons! Start with one, test it, then replicate the pattern.** 🚀
