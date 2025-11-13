import React from 'react';

interface ImageDescriptionCardProps {
  title: string;
  description: string;
  mathQuestion?: string;
  type?: string;
}

/**
 * Displays a text-based description card as a placeholder for actual images
 * These cards explain what the image would show, allowing students to visualize
 * and test the show_image tool functionality without waiting for image generation
 */
export function ImageDescriptionCard({ 
  title, 
  description, 
  mathQuestion,
  type 
}: ImageDescriptionCardProps) {
  
  // Color scheme based on type
  const getTypeColor = () => {
    switch(type) {
      case 'prerequisite': return '#FFB84D'; // Warm orange
      case 'warmup': return '#7DCCB8'; // Mint green
      case 'practice': return '#A8D5E5'; // Light blue
      case 'model': return '#7DCCB8'; // Mint green
      case 'checkpoint': return '#FFB84D'; // Warm orange
      case 'concept': return '#9B8FD9'; // Purple
      case 'critical-thinking': return '#FF6B6B'; // Coral red
      case 'hint': return '#FFD97D'; // Light yellow
      case 'challenge': return '#FF6B6B'; // Coral red
      case 'choice': return '#9B8FD9'; // Purple
      case 'synthesis': return '#7DCCB8'; // Mint green
      default: return '#FFB84D'; // Default orange
    }
  };

  const typeColor = getTypeColor();
  
  return (
    <div 
      style={{
        width: '100%',
        maxWidth: '600px',
        backgroundColor: '#FFFFFF',
        border: '4px solid #1A1D2E',
        borderRadius: '16px',
        boxShadow: '6px 6px 0 #1A1D2E',
        padding: '24px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Rounded", system-ui, sans-serif',
      }}
    >
      {/* Type Badge */}
      {type && (
        <div 
          style={{
            display: 'inline-block',
            backgroundColor: typeColor,
            color: '#1A1D2E',
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '12px',
            border: '2px solid #1A1D2E',
          }}
        >
          {type}
        </div>
      )}
      
      {/* Title */}
      <h3 
        style={{
          fontSize: '24px',
          fontWeight: 800,
          color: '#1A1D2E',
          marginTop: type ? '8px' : '0',
          marginBottom: '16px',
          lineHeight: '1.3',
        }}
      >
        {title}
      </h3>
      
      {/* Description */}
      <div 
        style={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#1A1D2E',
          lineHeight: '1.6',
          whiteSpace: 'pre-line',
          marginBottom: mathQuestion ? '20px' : '0',
          backgroundColor: '#F5F1E8',
          padding: '16px',
          borderRadius: '12px',
          border: '2px solid #1A1D2E',
        }}
      >
        {description}
      </div>
      
      {/* Math Question */}
      {mathQuestion && (
        <div 
          style={{
            backgroundColor: typeColor + '20', // 20% opacity
            border: `3px solid ${typeColor}`,
            borderRadius: '12px',
            padding: '14px 18px',
            marginTop: '16px',
          }}
        >
          <div 
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#1A1D2E',
              marginBottom: '6px',
              letterSpacing: '0.3px',
            }}
          >
            🤔 Think About It:
          </div>
          <div 
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#1A1D2E',
              lineHeight: '1.5',
            }}
          >
            {mathQuestion}
          </div>
        </div>
      )}
      
      {/* Footer Note */}
      <div 
        style={{
          marginTop: '20px',
          padding: '12px',
          backgroundColor: '#F5F1E8',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 600,
          color: '#6B6560',
          fontStyle: 'italic',
          textAlign: 'center',
        }}
      >
        📝 Description Card - Actual image will be generated later
      </div>
    </div>
  );
}

/**
 * Hook to check if a URL is a description card and load its data
 */
export function useImageDescription(imageId: string | undefined) {
  const [description, setDescription] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!imageId) {
      setDescription(null);
      return;
    }

    setLoading(true);
    
    // Load the descriptions JSON
    fetch('/assets/fractions/image-descriptions.json')
      .then(res => res.json())
      .then(data => {
        const card = data['description-cards'].find((c: any) => c.id === imageId);
        setDescription(card || null);
      })
      .catch(err => {
        console.error('[ImageDescriptionCard] Failed to load descriptions:', err);
        setDescription(null);
      })
      .finally(() => setLoading(false));
  }, [imageId]);

  return { description, loading };
}
