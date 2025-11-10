/**
 * Transcript Manager
 * Utilities for managing multiple student sessions stored in localStorage
 */

export interface SessionSummary {
  studentName: string;
  sessionCount: number;
  sessionIds: string[];
  lastSessionDate?: string;
}

export class TranscriptManager {
  /**
   * Get all students who have session data
   */
  static getAllStudents(): SessionSummary[] {
    const students: SessionSummary[] = [];
    
    // Iterate through localStorage to find session data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('sessions-')) {
        const studentName = key.replace('sessions-', '');
        const sessionIds = JSON.parse(localStorage.getItem(key) || '[]');
        const sessionCount = parseInt(localStorage.getItem(`session-count-${studentName}`) || '0', 10);
        
        students.push({
          studentName,
          sessionCount,
          sessionIds,
          lastSessionDate: sessionIds.length > 0 ? this.extractDateFromSessionId(sessionIds[sessionIds.length - 1]) : undefined
        });
      }
    }
    
    return students.sort((a, b) => a.studentName.localeCompare(b.studentName));
  }
  
  /**
   * Extract date from session ID
   */
  private static extractDateFromSessionId(sessionId: string): string {
    // sessionId format: "{name}-session{N}-{timestamp}"
    const parts = sessionId.split('-');
    const timestamp = parseInt(parts[parts.length - 1], 10);
    return new Date(timestamp).toISOString();
  }
  
  /**
   * Get session count for a specific student
   */
  static getSessionCount(studentName: string): number {
    return parseInt(localStorage.getItem(`session-count-${studentName}`) || '0', 10);
  }
  
  /**
   * Get all session IDs for a specific student
   */
  static getStudentSessions(studentName: string): string[] {
    return JSON.parse(localStorage.getItem(`sessions-${studentName}`) || '[]');
  }
  
  /**
   * Clear all session data for a specific student
   */
  static clearStudentData(studentName: string): void {
    localStorage.removeItem(`session-count-${studentName}`);
    localStorage.removeItem(`sessions-${studentName}`);
    console.log(`[TranscriptManager] Cleared data for ${studentName}`);
  }
  
  /**
   * Clear all session data for all students
   */
  static clearAllData(): void {
    const students = this.getAllStudents();
    students.forEach(student => {
      this.clearStudentData(student.studentName);
    });
    console.log(`[TranscriptManager] Cleared data for ${students.length} students`);
  }
  
  /**
   * Export summary of all students and their sessions
   */
  static exportSummary(): void {
    const students = this.getAllStudents();
    
    const summary = {
      exportDate: new Date().toISOString(),
      totalStudents: students.length,
      totalSessions: students.reduce((acc, s) => acc + s.sessionCount, 0),
      students: students.map(s => ({
        name: s.studentName,
        sessionCount: s.sessionCount,
        lastSession: s.lastSessionDate,
        sessionIds: s.sessionIds
      }))
    };
    
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-summary-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('[TranscriptManager] Summary exported:', summary);
  }
  
  /**
   * Get statistics across all students
   */
  static getGlobalStats() {
    const students = this.getAllStudents();
    
    return {
      totalStudents: students.length,
      totalSessions: students.reduce((acc, s) => acc + s.sessionCount, 0),
      averageSessionsPerStudent: students.length > 0 
        ? Math.round(students.reduce((acc, s) => acc + s.sessionCount, 0) / students.length * 10) / 10
        : 0,
      mostActivestudent: students.length > 0
        ? students.reduce((max, s) => s.sessionCount > max.sessionCount ? s : max, students[0])
        : null,
      studentNames: students.map(s => s.studentName)
    };
  }
}

/**
 * Development helper - expose to window for console access
 */
if (typeof window !== 'undefined') {
  (window as any).TranscriptManager = TranscriptManager;
}
