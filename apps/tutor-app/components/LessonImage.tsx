import { useLessonStore } from '@/lib/state';
import { LessonAsset } from '@simili/shared';
import { useMemo } from 'react';

interface LessonImageProps {
  lessonId?: string;
  milestoneIndex?: number;
}

export function LessonImage({ lessonId, milestoneIndex }: LessonImageProps) {
  const { currentLesson, currentImage } = useLessonStore();
  
  // Memoize image calculation to prevent infinite re-renders
  const image = useMemo(() => {
    if (!currentLesson?.assets) return null;
    
    // PRIORITY 1: If Pi explicitly set an image via show_image tool, show that
    if (currentImage) {
      const explicitAsset = currentLesson.assets.find((asset: any) => asset.id === currentImage);
      if (explicitAsset) {
        // Only log once on image change, not on every render
        // console.log('[LessonImage] 🎬 Showing tool-selected image:', currentImage);
        return {
          url: explicitAsset.url,
          alt: explicitAsset.alt || 'Lesson visual',
          caption: explicitAsset.description || explicitAsset.alt || ''
        };
      }
    }
    
    // PRIORITY 2: Cover image (if lesson just started and no milestone yet)
    if (milestoneIndex === 0 && (currentLesson as any).coverImage) {
      const coverImage = (currentLesson as any).coverImage;
      // Removed spam log (was causing infinite console spam)
      return {
        url: coverImage.url,
        alt: coverImage.alt || 'Lesson cover',
        caption: coverImage.description || coverImage.alt || ''
      };
    }
    
    // PRIORITY 3: Milestone-based image (existing logic)
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
    
    // PRIORITY 4: Fall back to first available image asset
    const imageAsset = currentLesson.assets.find((asset: any) => asset.type === 'image');
    if (imageAsset) {
      return {
        url: imageAsset.url,
        alt: imageAsset.alt || 'Lesson visual',
        caption: imageAsset.description || imageAsset.alt || ''
      };
    }
    
    return null;
  }, [currentLesson, currentImage, milestoneIndex]); // Memoize based on dependencies
  
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
