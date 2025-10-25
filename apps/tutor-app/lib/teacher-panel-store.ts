/**
 * Teacher Panel State Management
 * 
 * Zustand store for tracking student progress, standards coverage,
 * and misconceptions in real-time during lessons.
 * 
 * Integrates with agent service to capture emotional state and misconception analysis.
 */

import { create } from 'zustand';
import {
  StandardsCoverage,
  MasteryMilestoneLog,
  MisconceptionLog,
  LessonSession,
  TeacherPanelExport,
} from './teacher-panel-types';
import type { 
  EmotionalContext, 
  MisconceptionContext 
} from '@simili/agents';

interface TeacherPanelState {
  // UI State
  isExpanded: boolean;
  activeTab: 'standards' | 'milestones' | 'misconceptions' | 'emotional';
  
  // Session Data
  currentSession: LessonSession | null;
  
  // Tracking Data
  standardsCoverage: StandardsCoverage[];
  milestoneLogs: MasteryMilestoneLog[];
  misconceptionLogs: MisconceptionLog[];
  
  // Actions
  togglePanel: () => void;
  setActiveTab: (tab: 'standards' | 'milestones' | 'misconceptions' | 'emotional') => void;
  
  // Session Management
  startSession: (lessonId: string, lessonTitle: string) => void;
  endSession: () => void;
  
  // Standards Tracking
  updateStandardsCoverage: (coverage: StandardsCoverage) => void;
  updateObjectiveStatus: (standardCode: string, objectiveId: string, status: 'not-started' | 'in-progress' | 'mastered') => void;
  
  // Milestone Logging
  logMilestoneStart: (milestoneId: string, milestoneTitle: string) => void;
  logMilestoneProgress: (milestoneId: string, response: string, concepts: string[]) => void;
  logMilestoneComplete: (milestoneId: string, evidence: string) => void;
  
  // Misconception Logging
  logMisconception: (misconception: Omit<MisconceptionLog, 'id' | 'timestamp' | 'recurrenceCount'>) => void;
  updateMisconceptionStatus: (id: string, status: MisconceptionLog['status'], evidence?: string) => void;
  
  // Agent Integration
  syncAgentInsights: (emotional?: EmotionalContext, misconception?: MisconceptionContext, studentSaid?: string) => void;
  
  // Export
  exportData: (format: 'json' | 'csv') => TeacherPanelExport;
  
  // Reset
  clearPanel: () => void;
}

// Helper function to map emotional state to severity
function mapFrustrationToSeverity(frustrationLevel: number, confusionLevel: number): 'low' | 'medium' | 'high' {
  const combined = (frustrationLevel + confusionLevel) / 2;
  if (combined > 0.6) return 'high';
  if (combined > 0.3) return 'medium';
  return 'low';
}

export const useTeacherPanel = create<TeacherPanelState>((set, get) => ({
  // Initial State
  isExpanded: false,
  activeTab: 'standards',
  currentSession: null,
  standardsCoverage: [],
  milestoneLogs: [],
  misconceptionLogs: [],
  
  // UI Actions
  togglePanel: () => set(state => ({ isExpanded: !state.isExpanded })),
  
  setActiveTab: (tab: 'standards' | 'milestones' | 'misconceptions' | 'emotional') => set({ activeTab: tab }),
  
  // Session Management
  startSession: (lessonId, lessonTitle) => {
    const session: LessonSession = {
      id: `session-${Date.now()}`,
      lessonId,
      lessonTitle,
      startTime: new Date(),
      milestonesCompleted: 0,
      milestonesTotal: 0,
      percentComplete: 0,
      standardsCovered: [],
      misconceptionsDetected: 0,
      misconceptionsResolved: 0,
      totalTimeSpent: 0,
    };
    
    set({
      currentSession: session,
      standardsCoverage: [],
      milestoneLogs: [],
      misconceptionLogs: [],
    });
    
    console.log('[TeacherPanel] Session started:', session);
  },
  
  endSession: () => {
    const { currentSession } = get();
    if (currentSession) {
      const endedSession = {
        ...currentSession,
        endTime: new Date(),
        totalTimeSpent: Math.floor((Date.now() - currentSession.startTime.getTime()) / 1000),
      };
      
      set({ currentSession: endedSession });
      console.log('[TeacherPanel] Session ended:', endedSession);
    }
  },
  
  // Standards Tracking
  updateStandardsCoverage: (coverage) => {
    set(state => {
      const existing = state.standardsCoverage.findIndex(
        s => s.standardCode === coverage.standardCode
      );
      
      if (existing >= 0) {
        const updated = [...state.standardsCoverage];
        updated[existing] = coverage;
        return { standardsCoverage: updated };
      } else {
        return { standardsCoverage: [...state.standardsCoverage, coverage] };
      }
    });
    
    console.log('[TeacherPanel] Standards coverage updated:', coverage);
  },
  
  updateObjectiveStatus: (standardCode, objectiveId, status) => {
    set(state => {
      const updated = state.standardsCoverage.map(standard => {
        if (standard.standardCode === standardCode) {
          const objectives = standard.objectives.map(obj => 
            obj.id === objectiveId ? { ...obj, status } : obj
          );
          
          // Recalculate percent complete
          const mastered = objectives.filter(o => o.status === 'mastered').length;
          const percentComplete = Math.round((mastered / objectives.length) * 100);
          
          return { ...standard, objectives, percentComplete };
        }
        return standard;
      });
      
      return { standardsCoverage: updated };
    });
  },
  
  // Milestone Logging
  logMilestoneStart: (milestoneId, milestoneTitle) => {
    const log: MasteryMilestoneLog = {
      id: `milestone-${Date.now()}`,
      milestoneId,
      milestoneTitle,
      timestamp: new Date(),
      status: 'started',
      conceptsAddressed: [],
    };
    
    set(state => ({
      milestoneLogs: [...state.milestoneLogs, log],
    }));
    
    console.log('[TeacherPanel] Milestone started:', log);
  },
  
  logMilestoneProgress: (milestoneId, response, concepts) => {
    set(state => {
      const updated = state.milestoneLogs.map(log => {
        if (log.milestoneId === milestoneId && log.status !== 'completed') {
          return {
            ...log,
            status: 'in-progress' as const,
            studentResponse: response,
            conceptsAddressed: [...new Set([...log.conceptsAddressed, ...concepts])],
          };
        }
        return log;
      });
      
      return { milestoneLogs: updated };
    });
  },
  
  logMilestoneComplete: (milestoneId, evidence) => {
    set(state => {
      const updated = state.milestoneLogs.map(log => {
        if (log.milestoneId === milestoneId) {
          const timeSpent = Math.floor((Date.now() - log.timestamp.getTime()) / 1000);
          return {
            ...log,
            status: 'completed' as const,
            studentResponse: evidence,
            timeSpent,
          };
        }
        return log;
      });
      
      // Update session milestone count
      const completed = updated.filter(l => l.status === 'completed').length;
      const currentSession = state.currentSession;
      if (currentSession) {
        set({
          currentSession: {
            ...currentSession,
            milestonesCompleted: completed,
            percentComplete: Math.round((completed / currentSession.milestonesTotal) * 100),
          },
        });
      }
      
      return { milestoneLogs: updated };
    });
    
    console.log('[TeacherPanel] Milestone completed:', milestoneId);
  },
  
  // Misconception Logging
  logMisconception: (misconceptionData) => {
    const misconception: MisconceptionLog = {
      ...misconceptionData,
      id: `misconception-${Date.now()}`,
      timestamp: new Date(),
      recurrenceCount: 1,
    };
    
    set(state => {
      // Check if similar misconception already exists
      const existing = state.misconceptionLogs.find(
        m => m.misconceptionType === misconception.misconceptionType && m.status !== 'resolved'
      );
      
      if (existing) {
        // Update recurrence count
        const updated = state.misconceptionLogs.map(m =>
          m.id === existing.id
            ? { ...m, recurrenceCount: m.recurrenceCount + 1, timestamp: new Date() }
            : m
        );
        return { misconceptionLogs: updated };
      } else {
        // Add new misconception
        const currentSession = state.currentSession;
        if (currentSession) {
          set({
            currentSession: {
              ...currentSession,
              misconceptionsDetected: currentSession.misconceptionsDetected + 1,
            },
          });
        }
        
        return { misconceptionLogs: [...state.misconceptionLogs, misconception] };
      }
    });
    
    console.log('[TeacherPanel] Misconception logged:', misconception);
  },
  
  updateMisconceptionStatus: (id, status, evidence) => {
    set(state => {
      const updated = state.misconceptionLogs.map(m => {
        if (m.id === id) {
          const resolved = status === 'resolved';
          return {
            ...m,
            status,
            resolved,
            resolutionEvidence: evidence,
          };
        }
        return m;
      });
      
      // Update session resolved count
      const resolved = updated.filter(m => m.status === 'resolved').length;
      const currentSession = state.currentSession;
      if (currentSession) {
        set({
          currentSession: {
            ...currentSession,
            misconceptionsResolved: resolved,
          },
        });
      }
      
      return { misconceptionLogs: updated };
    });
    
    console.log('[TeacherPanel] Misconception status updated:', id, status);
  },
  
  // Agent Integration
  syncAgentInsights: (emotional, misconception, studentSaid = '') => {
    const { currentSession } = get();
    if (!currentSession) return;
    
    console.log('[TeacherPanel] Syncing agent insights', { 
      hasEmotional: !!emotional, 
      hasMisconception: !!misconception 
    });
    
    // Log misconception if detected
    if (misconception?.detected && misconception.type) {
      const severity = mapFrustrationToSeverity(
        emotional?.frustrationLevel || 0,
        emotional?.confusionLevel || 0
      );
      
      get().logMisconception({
        misconceptionType: misconception.type,
        severity,
        description: misconception.correctiveConcept || 'Misconception detected by agent',
        studentSaid: misconception.evidence || studentSaid,
        trigger: 'Agent analysis',
        status: 'detected',
        interventionUsed: misconception.intervention,
        resolved: misconception.resolved || false,
        relatedObjectives: [],
      });
    }
    
    // Track emotional state trends
    if (emotional) {
      // You could add emotional state tracking to the session here
      // For now, we're just using it for misconception severity
      console.log('[TeacherPanel] Emotional state:', {
        state: emotional.state,
        engagement: emotional.engagementLevel,
        frustration: emotional.frustrationLevel,
        confusion: emotional.confusionLevel,
      });
    }
  },
  
  // Export
  exportData: (format) => {
    const { currentSession, standardsCoverage, milestoneLogs, misconceptionLogs } = get();
    
    if (!currentSession) {
      throw new Error('No active session to export');
    }
    
    const exportData: TeacherPanelExport = {
      session: currentSession,
      standards: standardsCoverage,
      milestones: milestoneLogs,
      misconceptions: misconceptionLogs,
      exportedAt: new Date(),
      format,
    };
    
    // Create download
    const filename = `teacher-panel-${currentSession.lessonId}-${Date.now()}.${format}`;
    const content = format === 'json'
      ? JSON.stringify(exportData, null, 2)
      : convertToCSV(exportData);
    
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    
    console.log('[TeacherPanel] Data exported:', filename);
    return exportData;
  },
  
  // Reset
  clearPanel: () => {
    set({
      currentSession: null,
      standardsCoverage: [],
      milestoneLogs: [],
      misconceptionLogs: [],
      isExpanded: false,
      activeTab: 'standards',
    });
    
    console.log('[TeacherPanel] Panel cleared');
  },
}));

/**
 * Helper: Convert export data to CSV format
 */
function convertToCSV(data: TeacherPanelExport): string {
  const lines: string[] = [];
  
  // Session header
  lines.push('SESSION SUMMARY');
  lines.push(`Lesson,${data.session.lessonTitle}`);
  lines.push(`Start,${data.session.startTime.toLocaleString()}`);
  lines.push(`End,${data.session.endTime?.toLocaleString() || 'In Progress'}`);
  lines.push(`Progress,${data.session.percentComplete}%`);
  lines.push('');
  
  // Milestones
  lines.push('MILESTONES');
  lines.push('Title,Status,Time Spent,Evidence');
  data.milestones.forEach(m => {
    lines.push(`"${m.milestoneTitle}",${m.status},${m.timeSpent || 0}s,"${m.studentResponse || ''}"`);
  });
  lines.push('');
  
  // Misconceptions
  lines.push('MISCONCEPTIONS');
  lines.push('Type,Severity,Status,Student Said,Resolution');
  data.misconceptions.forEach(m => {
    lines.push(`"${m.misconceptionType}",${m.severity},${m.status},"${m.studentSaid}","${m.resolutionEvidence || ''}"`);
  });
  
  return lines.join('\n');
}
