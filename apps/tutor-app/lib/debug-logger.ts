/**
 * Debug Logger for Pilot App Testing
 * 
 * Provides color-coded console logging for easy verification
 * Enable by setting VITE_DEBUG_MODE=true in .env.local
 */

const DEBUG_ENABLED = import.meta.env.VITE_DEBUG_MODE === 'true' || 
                      import.meta.env.VITE_PILOT_MODE === 'true'; // Auto-enable in pilot mode

// Color codes for different log types
const COLORS = {
  success: '#22c55e',  // green
  error: '#ef4444',    // red
  warning: '#f59e0b',  // orange
  info: '#3b82f6',     // blue
  tool: '#a855f7',     // purple
  event: '#ec4899',    // pink
  ui: '#14b8a6',       // teal
  pilot: '#f97316',    // orange
} as const;

const EMOJIS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  tool: '🔧',
  event: '📡',
  ui: '🎨',
  pilot: '🧪',
  startup: '🚀',
  config: '⚙️',
  connection: '🔌',
  milestone: '🎯',
  image: '🖼️',
  canvas: '🎨',
  emoji: '😊',
  vision: '👁️',
  teacher: '📊',
} as const;

type LogType = keyof typeof COLORS;
type EmojiType = keyof typeof EMOJIS;

class DebugLogger {
  private sessionStart = Date.now();
  private logCount = 0;
  
  constructor() {
    if (DEBUG_ENABLED) {
      this.logStartup();
    }
  }
  
  private logStartup() {
    console.log(
      '%c╔══════════════════════════════════════════════════════════╗',
      'color: #a855f7; font-weight: bold;'
    );
    console.log(
      '%c║       🧪 PILOT APP DEBUG MODE ENABLED 🧪                ║',
      'color: #a855f7; font-weight: bold;'
    );
    console.log(
      '%c╚══════════════════════════════════════════════════════════╝',
      'color: #a855f7; font-weight: bold;'
    );
    console.log('%c📝 All system events will be logged below', 'color: #9ca3af;');
    console.log('%c⏱️ Session started at:', 'color: #9ca3af;', new Date().toLocaleTimeString());
    console.log(' ');
  }
  
  private getTimestamp(): string {
    const elapsed = Date.now() - this.sessionStart;
    const seconds = Math.floor(elapsed / 1000);
    const ms = elapsed % 1000;
    return `[${seconds}s ${ms}ms]`;
  }
  
  log(emoji: EmojiType, type: LogType, category: string, message: string, data?: any) {
    if (!DEBUG_ENABLED) return;
    
    this.logCount++;
    const timestamp = this.getTimestamp();
    const color = COLORS[type];
    const icon = EMOJIS[emoji];
    
    console.log(
      `%c${icon} ${timestamp} [${category.toUpperCase()}]%c ${message}`,
      `color: ${color}; font-weight: bold;`,
      'color: inherit;',
      data !== undefined ? data : ''
    );
  }
  
  // Specialized logging methods
  startup(message: string, data?: any) {
    this.log('startup', 'info', 'STARTUP', message, data);
  }
  
  config(message: string, data?: any) {
    this.log('config', 'info', 'CONFIG', message, data);
  }
  
  connection(message: string, data?: any) {
    this.log('connection', 'success', 'CONNECTION', message, data);
  }
  
  tool(toolName: string, message: string, data?: any) {
    this.log('tool', 'tool', 'TOOL', `${toolName} - ${message}`, data);
  }
  
  event(eventName: string, message: string, data?: any) {
    this.log('event', 'event', 'EVENT', `${eventName} - ${message}`, data);
  }
  
  milestone(message: string, data?: any) {
    this.log('milestone', 'success', 'MILESTONE', message, data);
  }
  
  image(message: string, data?: any) {
    this.log('image', 'info', 'IMAGE', message, data);
  }
  
  canvas(message: string, data?: any) {
    this.log('canvas', 'ui', 'CANVAS', message, data);
  }
  
  emoji(message: string, data?: any) {
    this.log('emoji', 'pilot', 'EMOJI', message, data);
  }
  
  vision(message: string, data?: any) {
    this.log('vision', 'pilot', 'VISION', message, data);
  }
  
  teacher(message: string, data?: any) {
    this.log('teacher', 'info', 'TEACHER', message, data);
  }
  
  success(category: string, message: string, data?: any) {
    this.log('success', 'success', category, message, data);
  }
  
  error(category: string, message: string, data?: any) {
    this.log('error', 'error', category, message, data);
  }
  
  warning(category: string, message: string, data?: any) {
    this.log('warning', 'warning', category, message, data);
  }
  
  // System check summary
  printSystemCheck(checks: Record<string, boolean>) {
    console.log(' ');
    console.log('%c═══════════════════════════════════════', 'color: #a855f7;');
    console.log('%c🔍 SYSTEM CHECK RESULTS', 'color: #a855f7; font-weight: bold; font-size: 14px;');
    console.log('%c═══════════════════════════════════════', 'color: #a855f7;');
    
    Object.entries(checks).forEach(([name, passed]) => {
      const icon = passed ? '✅' : '❌';
      const color = passed ? '#22c55e' : '#ef4444';
      console.log(`%c${icon} ${name}`, `color: ${color};`);
    });
    
    const allPassed = Object.values(checks).every(v => v);
    console.log('%c═══════════════════════════════════════', 'color: #a855f7;');
    
    if (allPassed) {
      console.log('%c🎉 ALL SYSTEMS GO! Ready for pilot study!', 'color: #22c55e; font-weight: bold; font-size: 14px;');
    } else {
      console.log('%c⚠️ Some checks failed - review above', 'color: #ef4444; font-weight: bold; font-size: 14px;');
    }
    console.log(' ');
  }
  
  // Stats summary
  printStats() {
    const elapsed = Date.now() - this.sessionStart;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    console.log(' ');
    console.log('%c📊 DEBUG SESSION STATS', 'color: #3b82f6; font-weight: bold;');
    console.log(`   Total logs: ${this.logCount}`);
    console.log(`   Session time: ${minutes}m ${seconds}s`);
    console.log(' ');
  }
}

// Singleton instance
export const debugLogger = new DebugLogger();

// Convenience exports
export const {
  startup,
  config,
  connection,
  tool,
  event,
  milestone,
  image,
  canvas,
  emoji,
  vision,
  teacher,
  success,
  error,
  warning,
  printSystemCheck,
  printStats,
} = debugLogger;
