import { Tldraw } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { useLessonStore } from '@/lib/state';

interface LessonCanvasProps {
  lessonId?: string;
  milestoneIndex?: number;
}

export function LessonCanvas({ lessonId, milestoneIndex }: LessonCanvasProps) {
  const { currentLesson } = useLessonStore();
  
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
        <Tldraw />
      </div>
    </div>
  );
}
