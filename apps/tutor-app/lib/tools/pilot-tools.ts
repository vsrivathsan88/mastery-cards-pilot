/**
 * Pilot Tools - Experimental function calls for outcome tracking pilot
 * 
 * New tools for Pi to use during the pilot study:
 * 1. draw_on_canvas - Pi can draw shapes/lines on student's canvas
 * 2. add_canvas_label - Pi can add text annotations
 * 3. show_emoji_reaction - Pi can send visual emoji reactions
 */

import { FunctionCall } from '../state';

export const pilotTools: FunctionCall[] = [
  {
    name: 'draw_on_canvas',
    description: `Draw a shape or annotation on the student's canvas to demonstrate, guide, or provide visual feedback.
    
Use this when:
- Demonstrating how to divide a shape into equal parts
- Drawing a correct example alongside their attempt
- Creating visual aids to support your explanation (e.g., drawing lines from center)
- Showing comparison visuals for checkpoints
- Drawing guidelines or hints

IMPORTANT: 
- Your drawing appears in PURPLE (Pi's color) so students can distinguish it from their work
- Keep drawings simple and purposeful
- Use temporary mode for hints that should fade
- Always explain what you're drawing while you draw it

Examples:
- "Let me show you how to divide this circle into thirds" → draw 3 lines from center
- "Watch as I draw equal parts" → draw rectangle divided equally
- "Here's a hint" → draw temporary guideline that fades`,
    
    parameters: {
      type: 'OBJECT',
      properties: {
        shapeType: {
          type: 'STRING',
          enum: ['line', 'circle', 'rectangle', 'arrow', 'freehand', 'arc'],
          description: 'Type of shape to draw. Choose line for dividing shapes, circle/rectangle for examples, arrow for pointing, freehand for custom paths.',
        },
        coordinates: {
          type: 'OBJECT',
          description: `Drawing coordinates. Format depends on shapeType:
- line: {x1, y1, x2, y2}
- circle: {cx, cy, radius}
- rectangle: {x, y, width, height}
- arrow: {x1, y1, x2, y2}
- freehand: {points: [{x, y}, ...]}
- arc: {cx, cy, radius, startAngle, endAngle}`,
        },
        strokeWidth: {
          type: 'NUMBER',
          description: 'Line thickness (default: 3). Use 2 for fine details, 4-5 for emphasis.',
        },
        purpose: {
          type: 'STRING',
          description: 'Why you\'re drawing this - be specific! Examples: "Showing equal thirds division", "Demonstrating line from center", "Providing hint for partitioning"',
        },
        temporary: {
          type: 'BOOLEAN',
          description: 'If true, drawing fades out after 5 seconds (good for hints and temporary guidance)',
        },
        animated: {
          type: 'BOOLEAN',
          description: 'If true, drawing appears with animation (draws itself over 1-2 seconds)',
        },
      },
      required: ['shapeType', 'coordinates', 'purpose'],
    },
    isEnabled: true,
  },
  
  {
    name: 'add_canvas_label',
    description: `Write text or labels on the canvas to annotate, guide, or celebrate student work.
    
Use this when:
- Labeling parts with fractions ("1/3", "1/4")
- Writing encouraging notes near their work ("Great!", "Almost!")
- Adding questions to prompt thinking ("Equal?", "Same size?")
- Showing notation connections ("This is 2/3")
- Counting parts aloud in text ("1, 2, 3 parts")

IMPORTANT:
- Keep text SHORT (1-5 words max)
- Position near relevant canvas elements
- Use appropriate style for context
- Temporary labels fade after 5 seconds
- Text appears in purple (Pi's color)

Examples:
- After student draws thirds: "1/3" "1/3" "1/3" (labeling each part)
- When checking work: "Are these equal?" (prompting reflection)
- Celebrating: "Perfect!" or "Nice work!"
- Teaching notation: "This = 2/3" (connecting visual to symbol)`,
    
    parameters: {
      type: 'OBJECT',
      properties: {
        text: {
          type: 'STRING',
          description: 'Text to display. Keep it short! 1-5 words maximum. Examples: "1/3", "Equal?", "Great!", "This is 2/3"',
        },
        position: {
          type: 'OBJECT',
          description: 'Position on canvas {x, y}. Place near relevant shapes or in clear space.',
        },
        style: {
          type: 'STRING',
          enum: ['annotation', 'label', 'question', 'celebration', 'notation'],
          description: `Visual style of text:
- annotation: Small, informative (default)
- label: Medium, for naming parts
- question: Italic, thought-provoking
- celebration: Bold, colorful
- notation: Math notation style`,
        },
        fontSize: {
          type: 'NUMBER',
          description: 'Font size in pixels (default: 16). Use 14 for annotations, 20 for celebrations.',
        },
        temporary: {
          type: 'BOOLEAN',
          description: 'If true, text fades after 5 seconds (good for prompts and hints)',
        },
        pointsTo: {
          type: 'OBJECT',
          description: 'Optional: coordinates {x, y} to draw arrow from text to this point',
        },
      },
      required: ['text', 'position'],
    },
    isEnabled: true,
  },
  
  {
    name: 'show_emoji_reaction',
    description: `Display an emoji reaction to celebrate, encourage, express emotion, or provide subtle feedback.
    
Use this when:
- Celebrating breakthroughs ("🎉" "✨" when they master a concept)
- Showing you're thinking ("🤔" while considering their answer)
- Expressing excitement about creative solutions ("💡" "⭐")
- Gentle prompts for reflection ("💭" to encourage thinking)
- Acknowledging effort ("💪" "👏")
- Showing understanding ("👍" "😊")

IMPORTANT:
- Use SPARINGLY (1-2 per milestone max)
- Don't overuse celebration emojis - save for real breakthroughs
- Subtle intensity for small wins, celebration for major milestones
- Emojis appear briefly near Pi's avatar
- Can combine with verbal feedback for stronger impact

Examples:
- Student explains equal parts clearly → "💡" (insight moment)
- Complete a challenging milestone → "🎉" (major celebration)
- Student tries hard but struggles → "💭" (keep thinking)
- Great drawing → "✨" (nice work)
- Self-correction → "👏" (acknowledged growth)`,
    
    parameters: {
      type: 'OBJECT',
      properties: {
        emoji: {
          type: 'STRING',
          description: 'Single emoji character. Choose wisely based on context! Celebrations: 🎉✨🌟⭐, Thinking: 🤔💭💡, Encouragement: 💪👏👍, Positive: 😊🙂',
        },
        intensity: {
          type: 'STRING',
          enum: ['subtle', 'normal', 'celebration'],
          description: `Animation intensity:
- subtle: Small, brief appearance (for acknowledgments)
- normal: Standard animation (for good progress)
- celebration: Big, exciting animation with particles (for breakthroughs)`,
        },
        duration: {
          type: 'NUMBER',
          description: 'How long to show emoji in seconds (default: 2). Use 1 for subtle, 3 for celebrations.',
        },
        position: {
          type: 'STRING',
          enum: ['avatar', 'center', 'canvas'],
          description: 'Where to show emoji: near Pi avatar (default), center of screen (celebrations), or near canvas (for canvas-related feedback)',
        },
        reason: {
          type: 'STRING',
          description: 'Why you\'re showing this emoji (for logging and analysis). Be specific about what triggered this reaction.',
        },
      },
      required: ['emoji', 'reason'],
    },
    isEnabled: true,
  },
  
  {
    name: 'analyze_student_canvas',
    description: `Look at and analyze what the student has drawn on their canvas to provide informed feedback.
    
Use this when:
- Student says "look at my drawing" or "what do you think?"
- You need to verify their partitioning is correct
- You want to comment on their work specifically
- Checking if they divided a shape into equal parts
- Student asks "is this right?" or requests feedback
- Before giving feedback on their drawing

IMPORTANT:
- This gives you a detailed description of what they actually drew
- Use it BEFORE commenting on their work (don't assume!)
- Canvas might be empty if they haven't drawn yet
- You'll receive analysis results to inform your response

The response includes:
- description: What's on the canvas
- interpretation: What it means mathematically
- confidence: How certain the analysis is
- hasShapes: Whether anything is drawn
- appearsEqual: If parts look equal (for fractions work)

Examples:
- Student: "Look at my circle!" → You: [calls this] "Let me see... I notice you drew a circle with three sections..."
- Before feedback: "Let me check your work" → [call this] → then respond based on results
- Student: "Is this right?" → [call this first] → then give specific feedback`,
    
    parameters: {
      type: 'OBJECT',
      properties: {
        purpose: {
          type: 'STRING',
          description: 'Why you\'re analyzing the canvas. Examples: "Verifying equal parts", "Checking circle division", "Student requested feedback", "Before giving hints"',
        },
        lookingFor: {
          type: 'STRING',
          enum: ['shapes', 'partitioning', 'equality', 'completeness', 'accuracy'],
          description: `What aspect you're focusing on:
- shapes: What shapes are drawn
- partitioning: How shapes are divided
- equality: Whether parts look equal-sized
- completeness: If task is finished
- accuracy: Correctness of the work`,
        },
      },
      required: ['purpose', 'lookingFor'],
    },
    isEnabled: true,
  },
  
  {
    name: 'verify_student_work',
    description: `Ask student to verify or check their own work, promoting self-assessment and metacognition.
    
Use this when:
- Student finishes drawing but you want them to check equality
- They give an answer but haven't explained reasoning
- You want them to compare their work to criteria
- Encouraging self-correction before you provide feedback
- Building metacognitive skills ("How do you know?")

This is a SOCRATIC tool - you're not telling them if they're right or wrong, 
you're prompting them to evaluate their own work.

Examples:
- "Can you check if all your parts are really the same size?"
- "Look at your drawing - count the parts for me"
- "How do you know these are equal?"
- "Point to the pieces and tell me about each one"`,
    
    parameters: {
      type: 'OBJECT',
      properties: {
        verificationPrompt: {
          type: 'STRING',
          description: 'Question or prompt to guide their self-checking. Should be open-ended and Socratic.',
        },
        focusArea: {
          type: 'STRING',
          enum: ['equality', 'counting', 'completeness', 'accuracy', 'reasoning'],
          description: 'What aspect you want them to verify',
        },
        highlightCanvas: {
          type: 'BOOLEAN',
          description: 'If true, gently highlights the canvas area to direct their attention',
        },
      },
      required: ['verificationPrompt', 'focusArea'],
    },
    isEnabled: true,
  },
];
