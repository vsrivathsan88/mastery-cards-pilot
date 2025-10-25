import { useState, useEffect, FC } from 'react';
import { LessonData, Milestone } from '@simili/shared';
import { LessonProgress as LessonProgressType } from '@simili/agents';

interface LessonProgressProps {
  lesson?: LessonData;
  progress?: LessonProgressType;
  onMilestoneComplete?: (milestone: Milestone) => void;
}

export const LessonProgress: FC<LessonProgressProps> = ({
  lesson,
  progress,
  onMilestoneComplete,
}) => {
  const [celebration, setCelebration] = useState<string | null>(null);

  useEffect(() => {
    if (onMilestoneComplete) {
      // This will be triggered by parent when milestone completes
    }
  }, [onMilestoneComplete]);

  if (!lesson || !progress) {
    return null;
  }

  const currentMilestone = lesson.milestones[progress.currentMilestoneIndex];

  const showCelebration = (text: string) => {
    setCelebration(text);
    setTimeout(() => setCelebration(null), 3000);
  };

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      marginBottom: '20px',
    }}>
      {/* Lesson Title */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#333' }}>
          {lesson.title}
        </h2>
        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
          {lesson.description}
        </p>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px',
          fontSize: '14px',
        }}>
          <span>Milestone {progress.currentMilestoneIndex + 1} of {progress.totalMilestones}</span>
          <span>{Math.round(progress.percentComplete)}% Complete</span>
        </div>
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: '#ddd',
          borderRadius: '4px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${progress.percentComplete}%`,
            height: '100%',
            backgroundColor: '#4CAF50',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Current Milestone */}
      <div style={{
        padding: '12px',
        backgroundColor: 'white',
        borderRadius: '6px',
        border: '2px solid #4CAF50',
      }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#4CAF50' }}>
          Current: {currentMilestone?.title}
        </h3>
        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
          {currentMilestone?.description}
        </p>
      </div>

      {/* Milestone List */}
      <div style={{ marginTop: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
          All Milestones
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {lesson.milestones.map((milestone, index) => (
            <div
              key={milestone.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: milestone.completed ? '#4CAF50' : 
                                index === progress.currentMilestoneIndex ? '#2196F3' : '#ddd',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '12px',
              }}>
                {milestone.completed ? '✓' : index + 1}
              </div>
              <span style={{
                color: milestone.completed ? '#4CAF50' : 
                       index === progress.currentMilestoneIndex ? '#2196F3' : '#999',
                textDecoration: milestone.completed ? 'line-through' : 'none',
              }}>
                {milestone.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Celebration Overlay */}
      {celebration && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '40px',
          borderRadius: '16px',
          fontSize: '24px',
          fontWeight: 'bold',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          zIndex: 1000,
          animation: 'celebrate 0.5s ease-out',
        }}>
          🎉 {celebration} 🎉
        </div>
      )}
    </div>
  );
};
