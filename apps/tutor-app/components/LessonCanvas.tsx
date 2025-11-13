import { Tldraw, Editor, useEditor } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { useLessonStore } from '@/lib/state';
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { canvasManipulationService } from '@/services/CanvasManipulationService';

interface LessonCanvasProps {
  lessonId?: string;
  milestoneIndex?: number;
  onCanvasChange?: (hasContent: boolean) => void;
}

export interface LessonCanvasRef {
  getSnapshot: () => Promise<string | null>;
  hasContent: () => boolean;
  getShapeCount: () => number;
}

// Inner component that has access to tldraw's editor
function CanvasContent({ onCanvasChange }: { onCanvasChange?: (hasContent: boolean) => void }) {
  const editor = useEditor();
  const lastShapeCountRef = useRef(0);

  useEffect(() => {
    if (!editor) return;

    // Listen for shape changes
    const handleChange = () => {
      const shapeCount = editor.getCurrentPageShapes().length;
      
      // Only notify if shape count changed (diff detection)
      if (shapeCount !== lastShapeCountRef.current) {
        lastShapeCountRef.current = shapeCount;
        const hasContent = shapeCount > 0;
        onCanvasChange?.(hasContent);
      }
    };

    // Subscribe to store changes
    const unsubscribe = editor.store.listen(handleChange, { scope: 'document' });

    return () => unsubscribe();
  }, [editor, onCanvasChange]);

  return null;
}

export const LessonCanvas = forwardRef<LessonCanvasRef, LessonCanvasProps>(
  ({ lessonId, milestoneIndex, onCanvasChange }, ref) => {
    const { currentLesson } = useLessonStore();
    const editorRef = useRef<Editor | null>(null);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      getSnapshot: async () => {
        if (!editorRef.current) return null;
        
        try {
          const editor = editorRef.current;
          
          // Get SVG export from tldraw
          const svg = await editor.getSvg(
            editor.getCurrentPageShapes(),
            {
              background: true,
              darkMode: false,
              padding: 16,
            }
          );
          
          if (!svg) return null;
          
          // Convert SVG to data URL
          const svgString = new XMLSerializer().serializeToString(svg);
          const base64 = btoa(unescape(encodeURIComponent(svgString)));
          return `data:image/svg+xml;base64,${base64}`;
        } catch (error) {
          console.error('[LessonCanvas] Failed to get snapshot:', error);
          return null;
        }
      },
      
      hasContent: () => {
        if (!editorRef.current) return false;
        return editorRef.current.getCurrentPageShapes().length > 0;
      },
      
      getShapeCount: () => {
        if (!editorRef.current) return 0;
        return editorRef.current.getCurrentPageShapes().length;
      }
    }));

    const handleMount = (editor: Editor) => {
      editorRef.current = editor;
      
      // PILOT: Give CanvasManipulationService access to editor
      canvasManipulationService.setEditor(editor);
      console.log('[LessonCanvas] Editor mounted and connected to CanvasManipulationService');
    };
  
  // Get canvas instructions if available
  const canvasInstructions = (currentLesson as any)?.canvasInstructions;
  
  return (
    <div style={{ 
      width: '100%', 
      height: '100%',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {canvasInstructions && (
        <div style={{
          padding: '12px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#0c4a6e',
          lineHeight: '1.5'
        }}>
          <strong style={{ display: 'block', marginBottom: '4px', color: '#075985' }}>
            ✏️ Drawing Instructions:
          </strong>
          {canvasInstructions.currentContext}
          {canvasInstructions.visualGuidance && (
            <div style={{ 
              marginTop: '8px', 
              fontSize: '12px',
              color: '#0369a1',
              fontStyle: 'italic' 
            }}>
              💡 {canvasInstructions.visualGuidance}
            </div>
          )}
        </div>
      )}
      <div style={{ 
        flex: 1,
        border: '2px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#fff',
        minHeight: '300px'
      }}>
        <Tldraw onMount={handleMount}>
          <CanvasContent onCanvasChange={onCanvasChange} />
        </Tldraw>
      </div>
    </div>
  );
});
