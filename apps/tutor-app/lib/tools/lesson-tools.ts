/**
 * Lesson Tools - Function calls for lesson interaction
 * 
 * These tools allow Pi to dynamically control lesson visuals and interactions
 */

import { FunctionCall } from '../state';

export const lessonTools: FunctionCall[] = [
  {
    name: 'show_image',
    description: `Display a specific image to the student to support your explanation or storytelling.
    
Use this to:
- Show the cover image when starting a lesson story
- Reveal key moments in the narrative ("look what happened!")
- Illustrate concepts you're explaining ("let me show you...")
- Present comparison/checkpoint tasks ("compare these shapes...")

IMPORTANT: Only use imageIds that exist in the current lesson's assets. 
Check the lesson context messages for available images and their IDs.

Example usage:
- At lesson start: show_image with coverImage id
- When revealing a problem: show_image with story progression image
- When teaching notation: show_image with notation visual
- For checkpoints: show_image with comparison image`,
    
    parameters: {
      type: 'OBJECT',
      properties: {
        imageId: {
          type: 'STRING',
          description: 'ID of the image asset to display (e.g., "cover-birthday-party", "unequal-cookie-kids", "notation-visual"). Must match an asset ID from the lesson.',
        },
        context: {
          type: 'STRING',
          description: 'Brief note about why you\'re showing this image and what you want the student to notice (for logging and debugging)',
        },
      },
      required: ['imageId'],
    },
    isEnabled: true,
  },
  
  {
    name: 'mark_milestone_complete',
    description: `Mark a milestone as complete when the student has demonstrated mastery.
    
Use this when:
- Student shows clear understanding of the milestone concept
- Student successfully completes the milestone challenge
- You have evidence of mastery (correct explanation, drawing, or solution)

This will:
- Update the visual progress indicator
- Log the completion in the teacher panel
- Trigger celebration feedback
- Move to the next milestone

IMPORTANT: Only call this when you have strong evidence of mastery. Be rigorous but fair.`,
    
    parameters: {
      type: 'OBJECT',
      properties: {
        milestoneId: {
          type: 'STRING',
          description: 'ID of the milestone being completed (e.g., "milestone-0", "milestone-1")',
        },
        evidence: {
          type: 'STRING',
          description: 'Brief description of what the student did that demonstrates mastery (e.g., "Drew 3 equal parts and explained why they are equal")',
        },
        confidence: {
          type: 'NUMBER',
          description: 'Your confidence in the mastery (0.0 to 1.0). Use 0.9+ for clear mastery, 0.7-0.9 for solid understanding, below 0.7 means more practice needed.',
        },
      },
      required: ['milestoneId', 'evidence', 'confidence'],
    },
    isEnabled: true,
  },
  
  {
    name: 'update_milestone_progress',
    description: `Update the progress on the current milestone without marking it complete.
    
Use this to:
- Show incremental progress as student works through the challenge
- Provide encouraging feedback about what they've accomplished so far
- Help student see they're making progress even if not done yet

Example: "You correctly identified equal parts! Now let's work on counting them."`,
    
    parameters: {
      type: 'OBJECT',
      properties: {
        milestoneId: {
          type: 'STRING',
          description: 'ID of the milestone in progress',
        },
        progressPercent: {
          type: 'NUMBER',
          description: 'Progress percentage (0-100). Use: 25 = started well, 50 = halfway, 75 = almost there',
        },
        feedback: {
          type: 'STRING',
          description: 'Brief encouraging feedback about what they did well (e.g., "Great job identifying the equal parts!")',
        },
      },
      required: ['milestoneId', 'progressPercent', 'feedback'],
    },
    isEnabled: true,
  },
  
  {
    name: 'highlight_canvas_area',
    description: `Draw visual attention to a specific area of the student's canvas drawing.
    
Use this when:
- You want to point out something specific in their work
- You need to direct their attention to a particular shape or area
- You're discussing a specific part of their drawing

Example: "Let me highlight the part you just drew..."`,
    
    parameters: {
      type: 'OBJECT',
      properties: {
        reason: {
          type: 'STRING',
          description: 'Why you\'re highlighting this area (e.g., "These parts look unequal - let\'s talk about why")',
        },
        duration: {
          type: 'NUMBER',
          description: 'How long to show the highlight in seconds (default: 3)',
        },
      },
      required: ['reason'],
    },
    isEnabled: true,
  },
];
