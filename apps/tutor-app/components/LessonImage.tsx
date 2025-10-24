import { useLessonStore } from '@/lib/state';
import { LessonAsset } from '@simili/shared';

interface LessonImageProps {
  lessonId?: string;
  milestoneIndex?: number;
}

export function LessonImage({ lessonId, milestoneIndex }: LessonImageProps) {
  const { currentLesson } = useLessonStore();
  
  // Get the appropriate image for the current milestone
  const getCurrentImage = (): { url: string; alt: string; caption: string } | null => {
    if (!currentLesson?.assets) return null;
    
    // If we have a milestone index, try to find asset specific to that milestone
    if (milestoneIndex !== undefined && currentLesson.milestones?.[milestoneIndex]) {
      const milestone = currentLesson.milestones[milestoneIndex];
      
      // Look for asset matching milestone usage
      const milestoneAsset = currentLesson.assets.find(
        (asset: any) => asset.usage === milestone.id || asset.usage?.includes(milestone.id)
      );
      
      if (milestoneAsset) {
        return {
          url: milestoneAsset.url,
          alt: milestoneAsset.alt || 'Lesson visual',
          caption: milestoneAsset.description || milestoneAsset.alt || ''
        };
      }
    }
    
    // Fall back to first available image asset
    const imageAsset = currentLesson.assets.find((asset: any) => asset.type === 'image');
    if (imageAsset) {
      return {
        url: imageAsset.url,
        alt: imageAsset.alt || 'Lesson visual',
        caption: imageAsset.description || imageAsset.alt || ''
      };
    }
    
    return null;
  };

  const image = getCurrentImage();
  
  // If no image available, don't render anything
  if (!image) {
    return null;
  }

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
          border: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc'
        }}
        onError={(e) => {
          console.error('[LessonImage] Failed to load image:', image.url);
          // Hide broken image
          e.currentTarget.style.display = 'none';
        }}
      />
      {image.caption && (
        <p style={{
          margin: 0,
          fontSize: '13px',
          color: '#64748b',
          textAlign: 'center',
          lineHeight: '1.5'
        }}>
          {image.caption}
        </p>
      )}
    </div>
  );
}
