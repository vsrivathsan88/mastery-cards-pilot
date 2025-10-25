# The Equal Parts Challenge (Simplified v6.1-Lite)

## Adaptation Strategy

**Original → Simplified:**
- ❌ 8-sec video → ✅ Static image with rich description
- ❌ Interactive slicing tool → ✅ Canvas drawing + verbal guidance
- ❌ Animated cheers → ✅ Verbal encouragement from Pi
- ❌ Auto-scoring → ✅ Conversational assessment
- ❌ Next-day recall → ✅ End-of-lesson recap (defer multi-session)
- ❌ Interactive game → ✅ Guided drawing challenges

**What We Keep:**
- ✅ Act 1-2-3-4 narrative structure
- ✅ Equal partitioning as conceptual anchor
- ✅ Multiple representations (verbal, visual, symbolic)
- ✅ Misconception detection
- ✅ Scaffolded progression
- ✅ Transfer tasks
- ✅ Self-explanation prompts

---

## Implementation as JSON Lesson

```json
{
  "id": "equal-parts-challenge",
  "title": "The Equal Parts Challenge",
  "description": "Learn what equal parts really means by dividing shapes fairly for friends. Build understanding of unit fractions through hands-on partitioning.",
  "subject": "fractions",
  "gradeLevel": "3",
  "estimatedDuration": 20,
  
  "standards": [
    {
      "framework": "CCSS",
      "code": "3.NF.A.1",
      "description": "Understand a fraction 1/b as the quantity formed by 1 part when a whole is partitioned into b equal parts",
      "coverage": "full"
    }
  ],
  
  "objectives": [
    "Partition different shapes (circle, rectangle, bar) into equal-sized parts",
    "Use unit fraction language (e.g., 'one-third') to describe one part",
    "Represent unit fractions symbolically (1/b) and connect symbol to meaning",
    "Explain why equal-sized parts show equal shares using visual or verbal reasoning"
  ],
  
  "milestones": [
    {
      "id": "act-1-curiosity",
      "order": 1,
      "title": "Act 1: What Makes Parts Equal?",
      "description": "Student recognizes that equal parts means same size, not just same count",
      "keywords": [
        "equal",
        "same size",
        "fair",
        "not fair",
        "bigger",
        "smaller",
        "unequal",
        "same amount"
      ],
      "prompt": "Look at this picture of kids sharing a giant cookie. [Image shows unequal slices] What do you notice about these pieces? Would you want the smallest one? How would you make all the pieces equal in size?",
      "expectedConcepts": [
        "Equal parts means SAME SIZE, not just same number of pieces",
        "For fair sharing, everyone gets the exact same amount",
        "Unequal pieces aren't fair"
      ],
      "completed": false
    },
    {
      "id": "act-2a-circle",
      "order": 2,
      "title": "Act 2a: Dividing a Circle (Cookie)",
      "description": "Student can partition a circle into equal parts",
      "keywords": [
        "circle",
        "cookie",
        "three friends",
        "1/3",
        "one third",
        "equal pieces",
        "same size",
        "thirds"
      ],
      "prompt": "Let's try it! On your canvas, draw a circle (like a cookie). Now divide it for 3 friends so each gets an equal-sized piece. How can you check if they're really equal?",
      "expectedConcepts": [
        "Can partition a circle into 3 equal parts",
        "Uses symmetry or measurement to check equality",
        "Each piece is 1/3 of the whole"
      ],
      "completed": false
    },
    {
      "id": "act-2b-rectangle",
      "order": 3,
      "title": "Act 2b: Dividing a Rectangle (Chocolate Bar)",
      "description": "Student transfers equal partitioning to rectangular shapes",
      "keywords": [
        "rectangle",
        "chocolate",
        "four friends",
        "1/4",
        "one fourth",
        "quarters",
        "equal parts",
        "same size"
      ],
      "prompt": "Now let's try a chocolate bar! Draw a rectangle on your canvas. Split it for 4 friends. Do equal shares look the same for a rectangle as they did for a circle?",
      "expectedConcepts": [
        "Equal parts work for different shapes",
        "Can partition rectangle into 4 equal parts",
        "Shape of parts might differ but size must be equal"
      ],
      "completed": false
    },
    {
      "id": "act-2c-bar",
      "order": 4,
      "title": "Act 2c: Dividing a Bar (Sub Sandwich)",
      "description": "Student applies equal partitioning to linear shapes",
      "keywords": [
        "bar",
        "sandwich",
        "six friends",
        "1/6",
        "one sixth",
        "sixths",
        "equal lengths",
        "same size"
      ],
      "prompt": "Challenge time! You have 6 friends sharing a sub sandwich. Draw a long rectangle (like a sub) and cut it into equal-sized parts. How can you be sure all 6 pieces are equal?",
      "expectedConcepts": [
        "Can partition into 6 equal parts",
        "Uses spacing or measurement to ensure equality",
        "Transfers understanding across contexts"
      ],
      "completed": false
    },
    {
      "id": "act-2-checkpoint",
      "order": 5,
      "title": "Act 2 Checkpoint: Spotting Unequal Parts",
      "description": "Student can identify when partitioning is NOT equal",
      "keywords": [
        "not equal",
        "unequal",
        "wrong",
        "bigger",
        "smaller",
        "different sizes",
        "not fair"
      ],
      "prompt": "I'm going to show you some shapes that are cut up. [Image shows 3 shapes: one equal, two unequal] Which one shows equal shares? How can you tell? Why aren't the others equal?",
      "expectedConcepts": [
        "Can discriminate equal from unequal partitioning",
        "Explains reasoning (size comparison)",
        "Recognizes equal requires same size, not just same count"
      ],
      "completed": false
    },
    {
      "id": "act-3a-naming",
      "order": 6,
      "title": "Act 3a: Naming Unit Fractions",
      "description": "Student connects equal parts to fraction language (one-third, one-fourth)",
      "keywords": [
        "one third",
        "one fourth",
        "one sixth",
        "one half",
        "1/3",
        "1/4",
        "1/6",
        "1/2",
        "name",
        "called"
      ],
      "prompt": "When we cut something into 3 equal parts, each piece has a special name: 'one-third.' What do you think we call each piece if we cut into 4 equal parts? What about 6?",
      "expectedConcepts": [
        "Equal parts have fraction names",
        "Pattern: 'one-[number]' for unit fractions",
        "Connects number of parts to fraction name"
      ],
      "completed": false
    },
    {
      "id": "act-3b-notation",
      "order": 7,
      "title": "Act 3b: Understanding Fraction Notation",
      "description": "Student understands what numerator and denominator represent",
      "keywords": [
        "1/3",
        "bottom number",
        "top number",
        "3",
        "1",
        "denominator",
        "numerator",
        "slash",
        "fraction bar"
      ],
      "prompt": "We write 'one-third' as 1/3. [Image shows 1/3 with arrows] Where do we see the number 3 in our picture? What does that 3 tell us? What does the 1 mean?",
      "expectedConcepts": [
        "Bottom number (3) = how many equal parts total",
        "Top number (1) = how many of those parts we have",
        "Connects symbolic notation to visual representation"
      ],
      "completed": false
    },
    {
      "id": "act-3c-retrieval",
      "order": 8,
      "title": "Act 3c: Quick Check - Is This a Fraction?",
      "description": "Student can identify when notation doesn't match equal parts",
      "keywords": [
        "not equal",
        "can't be",
        "wrong",
        "no",
        "unequal",
        "different sizes"
      ],
      "prompt": "[Image shows shape with unequal parts labeled 1/4] Is this really one-fourth? Why or why not?",
      "expectedConcepts": [
        "Fractions require equal parts",
        "Can't use fraction notation for unequal partitioning",
        "Critical evaluation of representations"
      ],
      "completed": false
    },
    {
      "id": "act-4a-transfer",
      "order": 9,
      "title": "Act 4a: Choose Your Own Shape",
      "description": "Student demonstrates understanding with self-chosen context",
      "keywords": [
        "draw",
        "my own",
        "triangle",
        "square",
        "circle",
        "equal parts",
        "1/2",
        "1/3",
        "1/4"
      ],
      "prompt": "Now it's your turn to be the teacher! Draw ANY shape you want on the canvas. Then show me 1/4 of that shape. Explain how you know your parts are equal in size.",
      "expectedConcepts": [
        "Can apply understanding to self-chosen context",
        "Explains reasoning for equal partitioning",
        "Demonstrates transfer and generalization"
      ],
      "completed": false
    },
    {
      "id": "act-4b-reflection",
      "order": 10,
      "title": "Act 4b: What Stayed the Same?",
      "description": "Student identifies invariant principle across all contexts",
      "keywords": [
        "equal",
        "same size",
        "always",
        "every time",
        "no matter what",
        "all shapes",
        "fair"
      ],
      "prompt": "We divided circles, rectangles, and other shapes. What stayed the same across ALL of them? What's the one rule that never changes?",
      "expectedConcepts": [
        "Equal parts ALWAYS means same size",
        "This is true for any shape or whole",
        "Can articulate invariant principle"
      ],
      "completed": false
    }
  ],
  
  "assets": [
    {
      "type": "image",
      "id": "unequal-cookie-kids",
      "url": "/assets/fractions/unequal-cookie-share.svg",
      "alt": "Three kids looking at a cookie cut into three unequal pieces - one piece is noticeably larger than the others",
      "description": "Visual hook showing unfair partitioning. Kids have different expressions - one disappointed with small piece, one happy with large piece. This creates cognitive dissonance about what 'equal' means.",
      "usage": "act-1-curiosity"
    },
    {
      "type": "image",
      "id": "equal-vs-unequal-shapes",
      "url": "/assets/fractions/equal-unequal-comparison.svg",
      "alt": "Three shapes side by side: Shape A has 4 equal quarters, Shape B has 4 unequal parts, Shape C has 3 equal thirds",
      "description": "Diagnostic checkpoint showing one correct and two incorrect partitionings. Tests discrimination of equal vs. unequal.",
      "usage": "act-2-checkpoint"
    },
    {
      "type": "image",
      "id": "fraction-notation-explained",
      "url": "/assets/fractions/1-3-notation-visual.svg",
      "alt": "A circle divided into 3 equal parts with one shaded. Above it shows 1/3 with arrows pointing from the symbol to the visual",
      "description": "Visual scaffold connecting symbolic notation to concrete representation. Arrow from '3' to the 3 parts, arrow from '1' to the one shaded part.",
      "usage": "act-3b-notation"
    },
    {
      "type": "image",
      "id": "false-fraction-unequal",
      "url": "/assets/fractions/unequal-labeled-1-4.svg",
      "alt": "A rectangle divided into 4 unequal parts, incorrectly labeled as 1/4",
      "description": "Intentionally incorrect representation to test student reasoning. Prompts critical thinking: can we call this 1/4 if parts aren't equal?",
      "usage": "act-3c-retrieval"
    }
  ],
  
  "canvasInstructions": {
    "currentContext": "Use the canvas to draw shapes and practice dividing them into equal parts. Try circles, rectangles, or any shape you can think of!",
    "expectedElements": [
      "Shapes (circles, rectangles, bars)",
      "Dividing lines showing equal partitioning",
      "Visual evidence of equality (symmetry, measurement marks)"
    ],
    "visualGuidance": "Tip: For circles, think about pizza slices radiating from the center. For rectangles, think about evenly-spaced vertical or horizontal lines."
  },
  
  "prerequisites": [
    "Understands concept of 'equal' vs. 'different'",
    "Can count to 6",
    "Basic drawing ability (lines, circles, rectangles)"
  ],
  
  "nextLessons": [
    "fractions-3-nf-a-1",
    "non-unit-fractions-2-3"
  ],
  
  "scaffolding": {
    "hints": [
      "Equal means EXACTLY the same size, not just the same number of pieces",
      "Try folding the shape in your mind - would both sides match perfectly?",
      "If you're sharing with friends, would everyone be happy with their piece?",
      "The bottom number tells how many equal parts you cut the whole into",
      "Use the canvas to test your ideas - draw and divide!"
    ],
    "commonMisconceptions": [
      {
        "misconception": "unequal-parts-as-fractions",
        "description": "Thinking any division creates fractions, even if parts are unequal",
        "evidence": [
          "Student draws unequal pieces but calls them fractions",
          "Student says 'I divided it into 3 pieces so it's thirds' without checking size",
          "Student accepts unequal partitioning in checkpoint task"
        ],
        "correction": "That's close, but remember: fractions need EQUAL parts. Look at your pieces - are they EXACTLY the same size? If one is bigger, we can't call them thirds. Think about sharing with friends - would this be fair? How could you adjust the lines to make all pieces equal?",
        "detectionKeywords": ["divided", "cut", "pieces", "parts"],
        "alignedToStandard": "3.NF.A.1",
        "severity": "high"
      },
      {
        "misconception": "equal-count-not-size",
        "description": "Focusing on number of pieces rather than size of pieces",
        "evidence": [
          "Student says 'I made 4 pieces' but they're different sizes",
          "Student counts pieces but doesn't verify size",
          "Student thinks 4 pieces automatically makes fourths"
        ],
        "correction": "You're right that you have 4 pieces! But for fractions, we need something more: all 4 pieces must be EXACTLY the same SIZE. Let's look at your pieces - which one is biggest? Which is smallest? How could we adjust them so they're all identical?",
        "detectionKeywords": ["4 pieces", "divided", "cut into"],
        "alignedToStandard": "3.NF.A.1",
        "severity": "high"
      },
      {
        "misconception": "larger-denominator-larger-fraction",
        "description": "Thinking 1/6 is bigger than 1/3 because 6 > 3",
        "evidence": [
          "Student says '1/6 is more than 1/3 because 6 is bigger',
          "Student orders unit fractions incorrectly",
          "Student chooses 1/6 over 1/3 thinking it's more"
        ],
        "correction": "That's a smart observation about the numbers! But here's the tricky part: when we cut something into MORE pieces, each piece gets SMALLER. Think about your sandwich - if you cut it into 6 pieces for 6 friends vs. 3 pieces for 3 friends, does each person get more or less? When the bottom number is bigger, the pieces are tinier!",
        "detectionKeywords": ["bigger", "more", "1/6", "1/3", "larger"],
        "alignedToStandard": "3.NF.A.1",
        "severity": "medium"
      },
      {
        "misconception": "shape-matters-for-equality",
        "description": "Thinking parts must have same shape (not just same size) to be equal",
        "evidence": [
          "Student rejects equal-sized parts because shapes differ",
          "Student says 'these don't look the same' when comparing different shapes with same area",
          "Student insists all parts must be identical in appearance"
        ],
        "correction": "Great observation! You're noticing the parts have different SHAPES. But for fractions, what matters is the SIZE (area), not the shape. Look at these two pieces - if we measured how much space each takes up, would they be the same? It's like having two different containers that both hold the same amount of water.",
        "detectionKeywords": ["different shape", "don't look same", "not identical"],
        "alignedToStandard": "3.NF.A.1",
        "severity": "medium"
      },
      {
        "misconception": "numerator-denominator-confusion",
        "description": "Confusing what the top and bottom numbers represent",
        "evidence": [
          "Student says 'the 3 is how many I have' when looking at 1/3",
          "Student can't explain what numbers mean",
          "Student reverses numerator and denominator roles"
        ],
        "correction": "Let's connect the symbol to the picture. See how the whole is cut into 3 pieces? That's what the bottom number (3) tells us - how many equal parts the whole is divided into. The top number (1) tells us we're talking about 1 of those parts. Bottom = total pieces, top = pieces we have.",
        "detectionKeywords": ["top number", "bottom number", "3 means", "1 means"],
        "alignedToStandard": "3.NF.A.1",
        "severity": "high"
      }
    ]
  },
  
  "metadata": {
    "createdAt": "2024-10-24T00:00:00Z",
    "updatedAt": "2024-10-24T00:00:00Z",
    "author": "Simili Team (adapted from pedagogical design v6.1)",
    "tags": ["fractions", "equal-parts", "unit-fractions", "partitioning", "visual-reasoning"],
    "pedagogicalApproach": "Concrete-to-abstract progression with multiple representations, misconception-aware scaffolding, and transfer tasks",
    "learningScience": [
      "Retrieval practice (checkpoints and reflection)",
      "Self-explanation (reasoning prompts)",
      "Multiple representations (visual, verbal, symbolic)",
      "Worked examples (checkpoint comparisons)",
      "Transfer tasks (student-chosen contexts)"
    ]
  }
}
```

---

## What Works With Your Current System

### **✅ Images Instead of Video**
```
Act 1 Hook: Static image of unequal cookie + rich verbal description
- Pi: "Look at this! Three kids trying to share a cookie..."
- Same cognitive engagement, simpler implementation
- Image file: /assets/fractions/unequal-cookie-share.svg
```

### **✅ Canvas for Drawing Tasks**
```
Acts 2a, 2b, 2c: Drawing challenges
- Student draws shapes and divides them
- Pi provides verbal guidance: "Try drawing 3 lines from center to edge..."
- Vision agent (Phase 3) can analyze drawings
- Works with your existing tldraw integration
```

### **✅ Conversational Assessment**
```
Instead of: Auto-scored trials
You have: Conversational checkpoints
- Pi asks questions
- Agents detect keywords in responses
- MisconceptionClassifier catches errors
- Natural dialogue assessment
```

### **✅ Voice-First Self-Explanation**
```
Act 4b Reflection: "Explain how you know..."
- Perfect for Gemini Live
- Student verbalizes reasoning
- Agents analyze transcription
- Deeper than multiple choice
```

---

## Pi's Dynamic Scaffolding Examples

**Act 2a (Student draws unequal thirds):**
```
Student: "I divided it into three pieces"
[Vision detects unequal areas - future]
[Or Pi asks probing questions now]

Pi: "Nice work dividing it! Now let's check something: 
     look at those three pieces - are they all exactly 
     the same size? Which one looks biggest to you?"

Student: "Um... the bottom one is bigger"

Pi: "Great eye! So if you and two friends were sharing 
     this cookie, would everyone be happy? How could we 
     adjust the lines to make all three pieces equal?"
```

**Act 3b (Notation confusion):**
```
Student: "The 3 means we have 3 pieces"
[MisconceptionClassifier detects numerator-denominator confusion]

Pi: "I can see why you'd think that! Let's look at the 
     picture together. Count all the parts in the whole 
     circle - how many are there?"

Student: "Three"

Pi: "Exactly! That's what the bottom 3 tells us - the 
     whole is cut into 3 parts. Now, how many of those 
     parts are shaded?"

Student: "One"

Pi: "Perfect! That's the top 1. So bottom = total parts, 
     top = parts we're talking about. Make sense?"
```

---

## How Agents Work With This

### **EmotionalClassifier:**
```javascript
// Act 2c - Student struggling with 6 parts
{
  engagement: 0.6,
  frustration: 0.7,  // Detected from "ugh" "this is hard" "I can't"
  confusion: 0.5
}

→ Pi adapts: "This one is tricky! Let's start with just 
             2 parts, then we'll work up to 6. Would you 
             like a hint?"
```

### **MisconceptionClassifier:**
```javascript
// Student: "I cut it into 4 pieces so they're fourths"
{
  detected: "equal-count-not-size",
  confidence: 0.85,
  evidence: ["4 pieces", "cut into"],
  correction: "You're right that you have 4 pieces! But..."
}

→ Pi delivers gentle correction from scaffolding
```

### **PedagogyEngine:**
```javascript
// Milestone tracking
{
  "act-2a-circle": completed,
  "act-2b-rectangle": completed,
  "act-2c-bar": in_progress,  // 2nd attempt
  "act-2-checkpoint": pending
}

→ Pi: "You've mastered circles and rectangles! Ready 
       for the sandwich challenge?"
```

---

## Image Asset Requirements

**You'll need to create/source:**

1. **unequal-cookie-share.svg**
   - 3 kids around a cookie cut unequally
   - Visual hook for Act 1
   - Can be simple illustration

2. **equal-unequal-comparison.svg**
   - 3 shapes side-by-side for checkpoint
   - One correct, two incorrect
   - Clear visual discrimination task

3. **1-3-notation-visual.svg**
   - Circle with 3 equal parts
   - Arrows from 1/3 to visual
   - Teaching tool for notation

4. **unequal-labeled-1-4.svg**
   - Intentionally wrong example
   - Critical thinking prompt
   - Retrieval check

**Quick Options:**
- Use Canva/Figma (simple shapes)
- Commission on Fiverr ($5-20 each)
- Use AI generation (Midjourney/DALL-E)
- Placeholder colored rectangles for now

---

## Comparison: Original vs. Simplified

| Feature | Original v6.1 | Simplified v6.1-Lite | Your Stack |
|---------|---------------|----------------------|------------|
| Video hook | 8-sec clip | Static image + description | ✅ Easy |
| Interactive slicing | Custom tool | Canvas + verbal guide | ✅ Ready |
| Animated feedback | Cheers/effects | Verbal encouragement | ✅ Works |
| Game mode | Interactive UI | Conversational challenges | ✅ Natural |
| Auto-scoring | Trial counting | Agent-detected milestones | ✅ Built |
| Spaced practice | Multi-session | End-of-lesson recap | ⏳ Phase 2 |
| Learning Science | ✅✅✅ | ✅✅✅ | ✅ Preserved |

---

## What You Get

### **Same Pedagogy:**
- ✅ Concrete-to-abstract progression
- ✅ Multiple representations  
- ✅ Misconception-aware scaffolding
- ✅ Retrieval practice
- ✅ Self-explanation prompts
- ✅ Transfer tasks
- ✅ Conceptual depth

### **Simplified Implementation:**
- ✅ Works with your current stack
- ✅ No custom UI needed
- ✅ Voice-first interaction
- ✅ Canvas for drawing
- ✅ Agent-driven assessment
- ✅ Conversational flow

### **Build Timeline:**
- ✅ JSON lesson: 1 hour (copy template above)
- ✅ Register in LessonLoader: 5 minutes
- ✅ Create 4 image assets: 2-4 hours
- ✅ Test E2E: 30 minutes
- **Total: ~1 day of work**

---

## My Recommendation

**YES - this approach is perfect!** 🎯

**Why:**
1. Preserves all the pedagogical excellence
2. Works with your current architecture
3. Can ship in 1-2 days (with image assets)
4. Voice + canvas + images = engaging enough
5. Agents handle the smart scaffolding
6. Can upgrade later (video, tools, games) if validated

**Next Steps:**
1. ✅ Copy JSON above into `lesson-equal-parts-challenge.json`
2. ✅ Create/source 4 image assets (or use placeholders)
3. ✅ Register in LessonLoader
4. ✅ Test E2E
5. ✅ Watch console logs for agent detection
6. ✅ Iterate on keywords if needed

Want me to help you source/create the image assets, or should we test with placeholder images first?
