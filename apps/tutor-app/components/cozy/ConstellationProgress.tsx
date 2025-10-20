import { useEffect, useState } from 'react';

interface ConstellationProgressProps {
  totalMilestones: number;
  completedMilestones: number;
}

interface StarPosition {
  x: number;
  y: number;
  connected: boolean;
}

export function ConstellationProgress({ totalMilestones, completedMilestones }: ConstellationProgressProps) {
  const [stars, setStars] = useState<StarPosition[]>([]);

  // Generate star positions based on total milestones
  useEffect(() => {
    const positions: StarPosition[] = [];
    const centerX = 50;
    const centerY = 20;
    const radius = 15;
    
    for (let i = 0; i < totalMilestones; i++) {
      const angle = (i / totalMilestones) * Math.PI * 2 - Math.PI / 2;
      positions.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        connected: i < completedMilestones,
      });
    }
    
    setStars(positions);
  }, [totalMilestones, completedMilestones]);

  if (totalMilestones === 0) return null;

  return (
    <svg
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '40%',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    >
      {/* Draw lines between connected stars */}
      {stars.map((star, i) => {
        if (!star.connected || i === 0) return null;
        const prevStar = stars[i - 1];
        return (
          <line
            key={`line-${i}`}
            x1={`${prevStar.x}%`}
            y1={`${prevStar.y}%`}
            x2={`${star.x}%`}
            y2={`${star.y}%`}
            stroke="var(--constellation-line)"
            strokeWidth="1"
            opacity="0.7"
            style={{
              filter: 'drop-shadow(0 0 4px var(--constellation-line))',
              animation: 'constellationDraw 0.8s ease-out',
            }}
          />
        );
      })}
      
      {/* Draw stars */}
      {stars.map((star, i) => (
        <g key={`star-${i}`}>
          {star.connected && (
            <>
              {/* Glow */}
              <circle
                cx={`${star.x}%`}
                cy={`${star.y}%`}
                r="6"
                fill="var(--constellation-line)"
                opacity="0.3"
                style={{
                  animation: 'starPulse 2s ease-in-out infinite',
                  animationDelay: `${i * 0.2}s`,
                }}
              />
              {/* Star */}
              <circle
                cx={`${star.x}%`}
                cy={`${star.y}%`}
                r="3"
                fill="var(--constellation-line)"
                style={{
                  filter: 'drop-shadow(0 0 4px var(--constellation-line))',
                  animation: 'starAppear 0.5s ease-out',
                }}
              />
            </>
          )}
          {!star.connected && (
            <circle
              cx={`${star.x}%`}
              cy={`${star.y}%`}
              r="2"
              fill="var(--star-color)"
              opacity="0.3"
            />
          )}
        </g>
      ))}
      
      <style>{`
        @keyframes starAppear {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes starPulse {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.4;
          }
        }
        
        @keyframes constellationDraw {
          from {
            stroke-dasharray: 1000;
            stroke-dashoffset: 1000;
          }
          to {
            stroke-dasharray: 1000;
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </svg>
  );
}
