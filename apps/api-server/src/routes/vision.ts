/**
 * Vision Analysis API Route
 * 
 * Analyzes canvas drawings and lesson images using Gemini Vision
 * Returns detailed captions and interpretations for the tutor
 */

import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';

const router = Router();

// Initialize Gemini with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface VisionAnalysisRequest {
  canvasSnapshot: string;     // base64 image data
  lessonImageUrl?: string;     // URL or base64 of lesson image
  currentMilestone?: string;
  lessonContext?: string;
}

interface VisionAnalysisResponse {
  success: boolean;
  analysis?: {
    canvasDescription: string;      // What's drawn on canvas
    canvasStrokes: string;          // Detailed stroke analysis
    lessonImageCaption?: string;    // Caption of lesson image
    interpretation: string;         // Mathematical interpretation
    suggestion: string;             // What tutor should say/do
    confidence: number;
  };
  error?: string;
}

/**
 * POST /api/vision/analyze
 * 
 * Analyzes canvas + lesson image for tutor context
 */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { canvasSnapshot, lessonImageUrl, currentMilestone, lessonContext } = req.body as VisionAnalysisRequest;

    if (!canvasSnapshot) {
      return res.status(400).json({
        success: false,
        error: 'canvasSnapshot is required',
      });
    }

    console.log('[Vision API] 👁️ Starting analysis', {
      hasCanvas: !!canvasSnapshot,
      hasLessonImage: !!lessonImageUrl,
      milestone: currentMilestone,
    });

    // Use Gemini Pro Vision model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Build parts array (text + images)
    const parts: Part[] = [];

    // Add analysis prompt
    const prompt = buildAnalysisPrompt(currentMilestone, lessonContext);
    parts.push({ text: prompt });

    // Add canvas snapshot
    const canvasImageData = extractBase64(canvasSnapshot);
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: canvasImageData,
      },
    });

    // Add lesson image if provided
    if (lessonImageUrl) {
      const lessonImageData = extractBase64(lessonImageUrl);
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: lessonImageData,
        },
      });
    }

    // Generate analysis
    const result = await model.generateContent(parts);
    const response = result.response;
    const text = response.text();

    console.log('[Vision API] 🤖 Raw Gemini response:', text.substring(0, 200));

    // Parse JSON response
    const analysis = parseVisionResponse(text);

    console.log('[Vision API] ✅ Analysis complete', {
      confidence: analysis.confidence,
      hasStrokes: !!analysis.canvasStrokes,
    });

    return res.json({
      success: true,
      analysis,
    } as VisionAnalysisResponse);

  } catch (error: any) {
    console.error('[Vision API] ❌ Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Vision analysis failed',
    } as VisionAnalysisResponse);
  }
});

/**
 * Build the analysis prompt for Gemini Vision
 */
function buildAnalysisPrompt(milestone?: string, lessonContext?: string): string {
  return `You are analyzing a student's work in an elementary math lesson about fractions.

**Current Milestone:** ${milestone || 'Understanding fractions'}
**Lesson Context:** ${lessonContext || 'Learning about equal parts and fractions'}

You will see two images:
1. The student's canvas drawing (what they drew/sketched)
2. The lesson reference image (if provided)

Please analyze and provide:

1. **canvasDescription** - A clear, detailed description of what the student drew on the canvas. Be specific about shapes, divisions, shading, and any visual elements.

2. **canvasStrokes** - Detailed analysis of the exact strokes, lines, and marks on the canvas. Describe:
   - What shapes were drawn (circles, rectangles, lines, etc.)
   - How many divisions or sections
   - Which parts are shaded or colored
   - Any labels, numbers, or text
   - The spatial arrangement and proportions

3. **lessonImageCaption** - (If lesson image provided) Caption the lesson image so the tutor can reference it naturally in conversation. Describe what's shown and its purpose.

4. **interpretation** - What does the student's drawing reveal about their mathematical understanding? Are they correctly representing the concept?

5. **suggestion** - What should the tutor say or ask next? Be specific and conversational. The tutor will speak this to the student.

6. **confidence** - Your confidence level (0.0 to 1.0) in the interpretation.

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "canvasDescription": "Clear description of canvas",
  "canvasStrokes": "Detailed stroke-by-stroke analysis",
  "lessonImageCaption": "Caption of lesson image (if present)",
  "interpretation": "Mathematical interpretation",
  "suggestion": "What tutor should say next",
  "confidence": 0.85
}`;
}

/**
 * Extract base64 data from data URL or return as-is
 */
function extractBase64(dataUrl: string): string {
  if (dataUrl.startsWith('data:')) {
    // Extract base64 from data URL
    const matches = dataUrl.match(/^data:image\/\w+;base64,(.+)$/);
    if (matches && matches[1]) {
      return matches[1];
    }
  }
  // Assume it's already base64
  return dataUrl;
}

/**
 * Parse Gemini's JSON response
 * Handles both clean JSON and JSON wrapped in markdown
 */
function parseVisionResponse(text: string): VisionAnalysisResponse['analysis'] {
  try {
    // Remove markdown code blocks if present
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/```\n?/g, '').replace(/```\n?$/g, '');
    }

    const parsed = JSON.parse(cleanText);

    return {
      canvasDescription: parsed.canvasDescription || 'Unable to analyze canvas',
      canvasStrokes: parsed.canvasStrokes || 'No stroke details available',
      lessonImageCaption: parsed.lessonImageCaption,
      interpretation: parsed.interpretation || 'Analysis in progress',
      suggestion: parsed.suggestion || 'Continue observing student work',
      confidence: parsed.confidence || 0.5,
    };
  } catch (error) {
    console.error('[Vision API] Failed to parse JSON:', error);
    // Return fallback analysis
    return {
      canvasDescription: 'Student is working on the canvas',
      canvasStrokes: 'Drawing details not available',
      interpretation: 'Unable to parse analysis',
      suggestion: 'Ask the student to explain their work',
      confidence: 0.3,
    };
  }
}

export default router;
