import { Tldraw } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';

interface LessonCanvasProps {
  lessonId?: string;
  milestoneIndex?: number;
}

export function LessonCanvas({ lessonId, milestoneIndex }: LessonCanvasProps) {
  return (
    <div style={{ 
      width: '100%', 
      height: '100%',
      position: 'relative',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: '#fff'
    }}>
      <Tldraw />
    </div>
  );
}
