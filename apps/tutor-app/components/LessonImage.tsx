interface LessonImageProps {
  lessonId?: string;
  milestoneIndex?: number;
}

export function LessonImage({ lessonId, milestoneIndex }: LessonImageProps) {
  // Placeholder images based on lesson
  const getPlaceholderImage = () => {
    if (lessonId?.includes('fractions')) {
      return {
        url: 'https://via.placeholder.com/400x300/f0f9ff/6366f1?text=Chocolate+Bar+🍫',
        alt: 'Chocolate bar for learning fractions',
        caption: 'A chocolate bar divided into equal parts'
      };
    }
    return {
      url: 'https://via.placeholder.com/400x300/f0fdf4/10b981?text=Math+Lesson+📐',
      alt: 'Math lesson visual',
      caption: 'Visual aid for learning'
    };
  };

  const image = getPlaceholderImage();

  return (
    <div style={{ 
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <img 
        src={image.url}
        alt={image.alt}
        style={{
          width: '100%',
          height: 'auto',
          borderRadius: '8px',
          display: 'block',
          border: '1px solid #e2e8f0'
        }}
      />
      <p style={{
        margin: 0,
        fontSize: '13px',
        color: '#64748b',
        textAlign: 'center',
        lineHeight: '1.5'
      }}>
        {image.caption}
      </p>
    </div>
  );
}
