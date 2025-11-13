/**
 * Canvas Manipulation Service
 * 
 * Allows Pi to draw shapes and add labels to the student's canvas.
 * Works with TLDraw Editor instance.
 */

import { Editor } from '@tldraw/tldraw';
import { createShapeId } from '@tldraw/tldraw';

export interface DrawLineOptions {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strokeWidth?: number;
  temporary?: boolean;
  animated?: boolean;
}

export interface DrawCircleOptions {
  cx: number;
  cy: number;
  radius: number;
  strokeWidth?: number;
  temporary?: boolean;
  animated?: boolean;
}

export interface DrawRectangleOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  strokeWidth?: number;
  temporary?: boolean;
  animated?: boolean;
}

export interface DrawArrowOptions {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strokeWidth?: number;
  temporary?: boolean;
  animated?: boolean;
}

export interface DrawFreehandOptions {
  points: { x: number; y: number }[];
  strokeWidth?: number;
  temporary?: boolean;
  animated?: boolean;
}

export interface AddTextOptions {
  text: string;
  x: number;
  y: number;
  fontSize?: number;
  style?: 'annotation' | 'label' | 'question' | 'celebration' | 'notation';
  temporary?: boolean;
  pointsTo?: { x: number; y: number };
}

/**
 * CanvasManipulationService - Pi's drawing toolkit
 */
export class CanvasManipulationService {
  private editor: Editor | null = null;
  private piColor = '#8b5cf6'; // Purple for Pi's drawings
  private temporaryShapeIds: Set<string> = new Set();

  /**
   * Initialize service with TLDraw editor instance
   */
  setEditor(editor: Editor | null) {
    this.editor = editor;
    console.log('[CanvasManipulation] Editor set:', !!editor);
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.editor !== null;
  }

  /**
   * Draw a line on the canvas
   */
  drawLine(options: DrawLineOptions): string | null {
    if (!this.editor) {
      console.warn('[CanvasManipulation] Editor not available');
      return null;
    }

    const { x1, y1, x2, y2, strokeWidth = 3, temporary = false, animated = false } = options;
    
    const shapeId = createShapeId();
    
    try {
      // Create line shape using TLDraw's line tool
      this.editor.createShape({
        id: shapeId,
        type: 'line',
        x: x1,
        y: y1,
        props: {
          points: {
            a1: { id: 'a1', index: 'a1', x: 0, y: 0 },
            a2: { id: 'a2', index: 'a2', x: x2 - x1, y: y2 - y1 },
          },
          color: 'violet', // Pi's purple color
          size: strokeWidth === 2 ? 's' : strokeWidth === 3 ? 'm' : 'l',
        },
      });

      if (temporary) {
        this.makeTemporary(shapeId);
      }

      if (animated) {
        this.animateShape(shapeId);
      }

      console.log('[CanvasManipulation] Drew line:', { x1, y1, x2, y2 });
      return shapeId;
    } catch (error) {
      console.error('[CanvasManipulation] Failed to draw line:', error);
      return null;
    }
  }

  /**
   * Draw a circle on the canvas
   */
  drawCircle(options: DrawCircleOptions): string | null {
    if (!this.editor) {
      console.warn('[CanvasManipulation] Editor not available');
      return null;
    }

    const { cx, cy, radius, strokeWidth = 3, temporary = false, animated = false } = options;
    
    const shapeId = createShapeId();
    
    try {
      // Create geo shape (circle) using TLDraw
      this.editor.createShape({
        id: shapeId,
        type: 'geo',
        x: cx - radius,
        y: cy - radius,
        props: {
          geo: 'ellipse',
          w: radius * 2,
          h: radius * 2,
          color: 'violet',
          fill: 'none',
          size: strokeWidth === 2 ? 's' : strokeWidth === 3 ? 'm' : 'l',
        },
      });

      if (temporary) {
        this.makeTemporary(shapeId);
      }

      if (animated) {
        this.animateShape(shapeId);
      }

      console.log('[CanvasManipulation] Drew circle:', { cx, cy, radius });
      return shapeId;
    } catch (error) {
      console.error('[CanvasManipulation] Failed to draw circle:', error);
      return null;
    }
  }

  /**
   * Draw a rectangle on the canvas
   */
  drawRectangle(options: DrawRectangleOptions): string | null {
    if (!this.editor) {
      console.warn('[CanvasManipulation] Editor not available');
      return null;
    }

    const { x, y, width, height, strokeWidth = 3, temporary = false, animated = false } = options;
    
    const shapeId = createShapeId();
    
    try {
      // Create geo shape (rectangle) using TLDraw
      this.editor.createShape({
        id: shapeId,
        type: 'geo',
        x,
        y,
        props: {
          geo: 'rectangle',
          w: width,
          h: height,
          color: 'violet',
          fill: 'none',
          size: strokeWidth === 2 ? 's' : strokeWidth === 3 ? 'm' : 'l',
        },
      });

      if (temporary) {
        this.makeTemporary(shapeId);
      }

      if (animated) {
        this.animateShape(shapeId);
      }

      console.log('[CanvasManipulation] Drew rectangle:', { x, y, width, height });
      return shapeId;
    } catch (error) {
      console.error('[CanvasManipulation] Failed to draw rectangle:', error);
      return null;
    }
  }

  /**
   * Draw an arrow on the canvas
   */
  drawArrow(options: DrawArrowOptions): string | null {
    if (!this.editor) {
      console.warn('[CanvasManipulation] Editor not available');
      return null;
    }

    const { x1, y1, x2, y2, strokeWidth = 3, temporary = false, animated = false } = options;
    
    const shapeId = createShapeId();
    
    try {
      // Create arrow shape using TLDraw
      this.editor.createShape({
        id: shapeId,
        type: 'arrow',
        x: x1,
        y: y1,
        props: {
          start: { x: 0, y: 0 },
          end: { x: x2 - x1, y: y2 - y1 },
          color: 'violet',
          size: strokeWidth === 2 ? 's' : strokeWidth === 3 ? 'm' : 'l',
        },
      });

      if (temporary) {
        this.makeTemporary(shapeId);
      }

      if (animated) {
        this.animateShape(shapeId);
      }

      console.log('[CanvasManipulation] Drew arrow:', { x1, y1, x2, y2 });
      return shapeId;
    } catch (error) {
      console.error('[CanvasManipulation] Failed to draw arrow:', error);
      return null;
    }
  }

  /**
   * Draw freehand path on the canvas
   */
  drawFreehand(options: DrawFreehandOptions): string | null {
    if (!this.editor) {
      console.warn('[CanvasManipulation] Editor not available');
      return null;
    }

    const { points, strokeWidth = 3, temporary = false, animated = false } = options;
    
    if (points.length < 2) {
      console.warn('[CanvasManipulation] Need at least 2 points for freehand');
      return null;
    }

    const shapeId = createShapeId();
    
    try {
      // Create draw shape using TLDraw
      const firstPoint = points[0];
      
      // Convert points to TLDraw's segment format
      const segments = points.map((point, i) => ({
        type: 'free' as const,
        points: [{
          x: point.x - firstPoint.x,
          y: point.y - firstPoint.y,
          z: 0.5,
        }],
      }));

      this.editor.createShape({
        id: shapeId,
        type: 'draw',
        x: firstPoint.x,
        y: firstPoint.y,
        props: {
          segments,
          color: 'violet',
          size: strokeWidth === 2 ? 's' : strokeWidth === 3 ? 'm' : 'l',
          isComplete: true,
        },
      });

      if (temporary) {
        this.makeTemporary(shapeId);
      }

      if (animated) {
        this.animateShape(shapeId);
      }

      console.log('[CanvasManipulation] Drew freehand:', { pointCount: points.length });
      return shapeId;
    } catch (error) {
      console.error('[CanvasManipulation] Failed to draw freehand:', error);
      return null;
    }
  }

  /**
   * Add text label to the canvas
   */
  addText(options: AddTextOptions): string | null {
    if (!this.editor) {
      console.warn('[CanvasManipulation] Editor not available');
      return null;
    }

    const {
      text,
      x,
      y,
      fontSize = 16,
      style = 'annotation',
      temporary = false,
      pointsTo,
    } = options;

    const shapeId = createShapeId();
    
    try {
      // Determine text size based on style
      const textSize = 
        style === 'celebration' ? 'xl' :
        style === 'label' ? 'l' :
        style === 'notation' ? 'm' :
        style === 'question' ? 'm' :
        's'; // annotation

      // Create text shape using TLDraw
      this.editor.createShape({
        id: shapeId,
        type: 'text',
        x,
        y,
        props: {
          text,
          color: 'violet',
          size: textSize,
          font: style === 'notation' ? 'mono' : 'draw',
          align: 'middle',
          w: text.length * (fontSize * 0.6), // Estimate width
        },
      });

      // If pointing to something, add an arrow
      if (pointsTo) {
        const arrowId = createShapeId();
        this.editor.createShape({
          id: arrowId,
          type: 'arrow',
          x: x + (text.length * (fontSize * 0.3)), // From center of text
          y: y + fontSize / 2,
          props: {
            start: { x: 0, y: 0 },
            end: { x: pointsTo.x - x, y: pointsTo.y - y },
            color: 'violet',
            size: 's',
          },
        });

        if (temporary) {
          this.makeTemporary(arrowId);
        }
      }

      if (temporary) {
        this.makeTemporary(shapeId);
      }

      console.log('[CanvasManipulation] Added text:', { text, style, x, y });
      return shapeId;
    } catch (error) {
      console.error('[CanvasManipulation] Failed to add text:', error);
      return null;
    }
  }

  /**
   * Make a shape temporary (fade and remove after 5 seconds)
   */
  private makeTemporary(shapeId: string) {
    this.temporaryShapeIds.add(shapeId);

    setTimeout(() => {
      if (this.editor && this.temporaryShapeIds.has(shapeId)) {
        try {
          // Fade animation (TLDraw doesn't have built-in fade, so just delete)
          this.editor.deleteShape(shapeId);
          this.temporaryShapeIds.delete(shapeId);
          console.log('[CanvasManipulation] Removed temporary shape:', shapeId);
        } catch (error) {
          console.error('[CanvasManipulation] Failed to remove temporary shape:', error);
        }
      }
    }, 5000);
  }

  /**
   * Animate shape appearance (placeholder for future enhancement)
   */
  private animateShape(shapeId: string) {
    // TODO: Implement animation
    // TLDraw doesn't have built-in shape animation
    // Could use CSS transitions or progressive reveal
    console.log('[CanvasManipulation] Animation requested for:', shapeId);
  }

  /**
   * Clear all of Pi's drawings
   */
  clearPiDrawings() {
    if (!this.editor) return;

    // Delete all shapes created by Pi (those in temporaryShapeIds or marked)
    for (const shapeId of this.temporaryShapeIds) {
      try {
        this.editor.deleteShape(shapeId);
      } catch (error) {
        console.error('[CanvasManipulation] Failed to delete shape:', error);
      }
    }

    this.temporaryShapeIds.clear();
    console.log('[CanvasManipulation] Cleared all Pi drawings');
  }

  /**
   * Highlight a region of the canvas
   */
  highlightRegion(x: number, y: number, width: number, height: number, duration: number = 3000) {
    if (!this.editor) return;

    const shapeId = createShapeId();
    
    try {
      // Create semi-transparent rectangle for highlighting
      this.editor.createShape({
        id: shapeId,
        type: 'geo',
        x,
        y,
        props: {
          geo: 'rectangle',
          w: width,
          h: height,
          color: 'light-violet',
          fill: 'pattern',
          size: 'm',
          opacity: 0.3,
        },
      });

      // Remove after duration
      setTimeout(() => {
        if (this.editor) {
          try {
            this.editor.deleteShape(shapeId);
          } catch (error) {
            console.error('[CanvasManipulation] Failed to remove highlight:', error);
          }
        }
      }, duration);

      console.log('[CanvasManipulation] Highlighted region');
    } catch (error) {
      console.error('[CanvasManipulation] Failed to highlight region:', error);
    }
  }
}

// Singleton instance
export const canvasManipulationService = new CanvasManipulationService();
