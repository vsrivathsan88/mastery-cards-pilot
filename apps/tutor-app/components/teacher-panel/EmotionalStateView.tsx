/**
 * Emotional State View
 * 
 * Shows current emotional state and engagement trends from agent analysis
 * Now with REAL-TIME agent data!
 */

import { useTeacherPanel } from '@/lib/teacher-panel-store';
import { useAgentContext } from '@/hooks/useAgentContext';
import { useMemo } from 'react';

export function EmotionalStateView() {
  const { misconceptionLogs } = useTeacherPanel();
  const { currentContext, isAnalyzing } = useAgentContext();
  
  // Use real-time agent emotional data if available
  const emotionalSummary = useMemo(() => {
    // REAL-TIME DATA from agent analysis!
    if (currentContext?.emotional) {
      const { state, engagementLevel, frustrationLevel, confusionLevel, confidence } = currentContext.emotional;
      
      // Map state to emoji and color
      const stateMap: Record<string, { emoji: string; color: string; recommendation: string }> = {
        excited: {
          emoji: '🤩',
          color: '#4caf50',
          recommendation: 'Student is excited and engaged! Great momentum.',
        },
        confident: {
          emoji: '😊',
          color: '#4caf50',
          recommendation: 'Student shows confidence. Keep building on this!',
        },
        focused: {
          emoji: '🤔',
          color: '#2196f3',
          recommendation: 'Student is focused and working through the material.',
        },
        confused: {
          emoji: '😕',
          color: '#ff9800',
          recommendation: 'Student shows confusion. Rephrase and provide examples.',
        },
        frustrated: {
          emoji: '😤',
          color: '#f44336',
          recommendation: 'Student is frustrated. Consider scaffolding or taking a break.',
        },
        bored: {
          emoji: '😐',
          color: '#9e9e9e',
          recommendation: 'Student may be bored. Try a different approach or challenge.',
        },
        neutral: {
          emoji: '😶',
          color: '#2196f3',
          recommendation: 'Student is engaged neutrally. Continue monitoring.',
        },
      };
      
      const stateInfo = stateMap[state] || stateMap.neutral;
      
      return {
        currentState: state.charAt(0).toUpperCase() + state.slice(1),
        emoji: stateInfo.emoji,
        engagementLevel: Math.round((engagementLevel || 0) * 100),
        frustrationLevel: Math.round((frustrationLevel || 0) * 100),
        confusionLevel: Math.round((confusionLevel || 0) * 100),
        confidence: Math.round((confidence || 0) * 100),
        recommendation: stateInfo.recommendation,
        color: stateInfo.color,
        isRealTime: true,
      };
    }
    
    // Fallback to misconception-based inference if no agent data
    {
    if (misconceptionLogs.length === 0) {
      return {
        currentState: 'Engaged & Positive',
        emoji: '😊',
        engagementLevel: 85,
        frustrationLevel: 5,
        confusionLevel: 5,
        confidence: 90,
        recommendation: 'Student is performing well! Continue with current approach.',
        color: '#4caf50',
      };
    }
    
    // Calculate based on recent misconceptions
    const recentLogs = misconceptionLogs.slice(-5);
    const highSeverity = recentLogs.filter(m => m.severity === 'high').length;
    const unresolved = recentLogs.filter(m => m.status !== 'resolved').length;
    
    let currentState = 'Focused';
    let emoji = '🤔';
    let engagementLevel = 70;
    let frustrationLevel = 20;
    let confusionLevel = 15;
    let confidence = 75;
    let recommendation = 'Student is working through the material steadily.';
    let color = '#2196f3';
    
    if (highSeverity > 2 || unresolved > 3) {
      currentState = 'Needs Support';
      emoji = '😟';
      engagementLevel = 50;
      frustrationLevel = 60;
      confusionLevel = 50;
      confidence = 40;
      recommendation = 'Consider providing additional scaffolding or taking a short break.';
      color = '#ff9800';
    } else if (highSeverity > 0) {
      currentState = 'Working Through Challenge';
      emoji = '🧐';
      engagementLevel = 65;
      frustrationLevel = 35;
      confusionLevel = 30;
      confidence = 60;
      recommendation = 'Student is encountering challenges but making progress. Provide encouragement.';
      color = '#ffc107';
    }
    
    return {
      currentState,
      emoji,
      engagementLevel,
      frustrationLevel,
      confusionLevel,
      confidence,
      recommendation,
      color,
      isRealTime: false,
    };
    }
  }, [misconceptionLogs, currentContext]);
  
  return (
    <div className="emotional-state-view" style={{ padding: '20px' }}>
      {/* Current State Card */}
      <div 
        className="emotional-state-card" 
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          borderLeft: `4px solid ${emotionalSummary.color}`,
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <span style={{ fontSize: '32px' }}>{emotionalSummary.emoji}</span>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#333' }}>
              {emotionalSummary.currentState}
            </div>
            <div style={{ fontSize: '13px', color: '#666' }}>
              Based on recent interactions
            </div>
          </div>
        </div>
        
        <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.6', marginTop: '12px' }}>
          {emotionalSummary.recommendation}
        </div>
      </div>
      
      {/* Metrics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <MetricBar 
          label="Engagement"
          value={emotionalSummary.engagementLevel}
          color="#4caf50"
          icon="⚡"
        />
        <MetricBar 
          label="Confidence"
          value={emotionalSummary.confidence}
          color="#2196f3"
          icon="💪"
        />
        <MetricBar 
          label="Confusion"
          value={emotionalSummary.confusionLevel}
          color="#ff9800"
          icon="❓"
          inverse
        />
        <MetricBar 
          label="Frustration"
          value={emotionalSummary.frustrationLevel}
          color="#f44336"
          icon="😤"
          inverse
        />
      </div>
      
      {/* Real-time badge or fallback note */}
      {emotionalSummary.isRealTime ? (
        <div 
          style={{
            marginTop: '20px',
            padding: '12px',
            background: '#e8f5e9',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#2e7d32',
            border: '1px solid #a5d6a7',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {isAnalyzing && <span style={{ fontSize: '14px', animation: 'pulse 1.5s ease-in-out infinite' }}>🔄</span>}
          {!isAnalyzing && <span style={{ fontSize: '14px' }}>✅</span>}
          <div>
            <strong>Real-Time Analysis</strong> - Data from live agent monitoring
          </div>
        </div>
      ) : (
        <div 
          style={{
            marginTop: '20px',
            padding: '12px',
            background: '#fff3e0',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#e65100',
            border: '1px solid #ffcc80',
          }}
        >
          <strong>Inferred Data:</strong> No recent agent analysis. Showing estimates based on misconception patterns.
        </div>
      )}
    </div>
  );
}

interface MetricBarProps {
  label: string;
  value: number;
  color: string;
  icon: string;
  inverse?: boolean;
}

function MetricBar({ label, value, color, icon, inverse = false }: MetricBarProps) {
  const displayValue = inverse ? value : value;
  const barColor = inverse && value > 50 ? '#f44336' : color;
  
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', color: '#666', fontWeight: 500 }}>
          {icon} {label}
        </span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: barColor }}>
          {displayValue}%
        </span>
      </div>
      <div 
        style={{
          height: '8px',
          background: '#e0e0e0',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <div 
          style={{
            height: '100%',
            width: `${displayValue}%`,
            background: barColor,
            transition: 'width 0.3s ease',
            borderRadius: '4px',
          }}
        />
      </div>
    </div>
  );
}
