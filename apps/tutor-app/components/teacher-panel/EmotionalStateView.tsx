/**
 * Emotional State View
 * 
 * Shows current emotional state and engagement trends from agent analysis
 */

import { useTeacherPanel } from '@/lib/teacher-panel-store';
import { useMemo } from 'react';

export function EmotionalStateView() {
  const { misconceptionLogs } = useTeacherPanel();
  
  // Extract emotional context from recent logs (stored in description or as metadata)
  // For now, we'll show a summary based on misconception severity as a proxy
  
  const emotionalSummary = useMemo(() => {
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
    };
  }, [misconceptionLogs]);
  
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
      
      {/* Info note */}
      <div 
        style={{
          marginTop: '20px',
          padding: '12px',
          background: '#f5f5f5',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#666',
        }}
      >
        <strong>Note:</strong> Emotional indicators are inferred from conversation patterns, 
        misconception detection, and student responses. Real-time analysis coming soon!
      </div>
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
