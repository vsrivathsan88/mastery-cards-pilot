/**
 * TranscriptView - Live conversation transcript with metadata
 * Shows full conversation with timestamps, emotional states, and classifications
 */

import { useEffect, useRef } from 'react';
import { useLogStore } from '@/lib/state';
import { useTeacherPanel } from '@/lib/teacher-panel-store';

// Map emotional states to emojis
const getEmotionalEmoji = (emotional?: { state?: string }): string => {
  if (!emotional?.state) return '💬';
  
  switch (emotional.state) {
    case 'engaged':
    case 'confident':
    case 'excited':
      return '😊';
    case 'confused':
    case 'uncertain':
      return '🤔';
    case 'frustrated':
    case 'struggling':
      return '😰';
    default:
      return '💬';
  }
};

export function TranscriptView() {
  const turns = useLogStore(state => state.turns);
  const { misconceptionLogs, milestoneLogs } = useTeacherPanel();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new turns arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns.length]);
  
  if (turns.length === 0) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        color: '#94a3b8',
        fontSize: '13px' 
      }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
        <div>Conversation transcript will appear here</div>
        <div style={{ fontSize: '12px', marginTop: '4px' }}>
          Start speaking to see the live feed
        </div>
      </div>
    );
  }
  
  return (
    <div
      ref={scrollRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxHeight: '400px',
        overflow: 'auto',
        padding: '12px',
      }}
    >
      {turns.map((turn, index) => {
        const timestamp = turn.timestamp.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });
        
        // Find relevant misconception for this turn
        const relatedMisconception = misconceptionLogs.find(
          log => log.studentResponse.includes(turn.text.substring(0, 30))
        );
        
        // Find related milestone completion
        const relatedMilestone = milestoneLogs.find(
          log => log.responses.some(r => r.includes(turn.text.substring(0, 30)))
        );
        
        const isAgent = turn.role === 'agent';
        const isUser = turn.role === 'user';
        const emoji = isAgent ? '💬' : getEmotionalEmoji();
        
        return (
          <div
            key={index}
            style={{
              padding: '10px 12px',
              backgroundColor: isAgent ? '#f8fafc' : '#f0f9ff',
              borderLeft: `3px solid ${isAgent ? '#6366f1' : '#10b981'}`,
              borderRadius: '6px',
              fontSize: '13px',
              lineHeight: '1.6',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '6px',
              color: '#64748b',
              fontSize: '11px',
              fontWeight: '600',
            }}>
              <span>{emoji}</span>
              <span style={{ color: '#334155' }}>
                {isAgent ? 'Pi' : 'You'}
              </span>
              <span style={{ marginLeft: 'auto' }}>{timestamp}</span>
            </div>
            
            {/* Message */}
            <div style={{ color: '#1e293b' }}>
              {turn.text}
            </div>
            
            {/* Misconception Flag */}
            {isUser && relatedMisconception && relatedMisconception.status !== 'resolved' && (
              <div style={{
                marginTop: '8px',
                padding: '6px 10px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '4px',
                fontSize: '12px',
              }}>
                <div style={{ 
                  fontWeight: '600', 
                  color: '#dc2626',
                  marginBottom: '2px' 
                }}>
                  ⚠️ MISCONCEPTION: {relatedMisconception.type}
                </div>
                <div style={{ color: '#991b1b', fontSize: '11px' }}>
                  {relatedMisconception.description}
                </div>
              </div>
            )}
            
            {/* Resolved Misconception */}
            {isUser && relatedMisconception && relatedMisconception.status === 'resolved' && (
              <div style={{
                marginTop: '8px',
                padding: '6px 10px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '4px',
                fontSize: '12px',
              }}>
                <div style={{ 
                  fontWeight: '600', 
                  color: '#16a34a',
                  marginBottom: '2px' 
                }}>
                  ✅ RESOLVED: {relatedMisconception.type}
                </div>
              </div>
            )}
            
            {/* Mastery Indicator */}
            {isUser && relatedMilestone && relatedMilestone.status === 'completed' && (
              <div style={{
                marginTop: '8px',
                padding: '6px 10px',
                backgroundColor: '#fefce8',
                border: '1px solid #fde047',
                borderRadius: '4px',
                fontSize: '12px',
              }}>
                <div style={{ 
                  fontWeight: '600', 
                  color: '#ca8a04',
                }}>
                  ✨ MASTERY: {relatedMilestone.milestoneTitle}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
