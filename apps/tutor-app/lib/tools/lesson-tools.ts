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
];
