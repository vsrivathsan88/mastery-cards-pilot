/**
 * Connection Watchdog - Detects zombie/stale connections
 * Monitors connection health and triggers recovery
 */

export interface WatchdogConfig {
  activityTimeout: number;    // Time without activity before considering connection stale (ms)
  checkInterval: number;      // How often to check (ms)
}

export class ConnectionWatchdog {
  private lastActivity: number = Date.now();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  
  private readonly config: WatchdogConfig = {
    activityTimeout: 15000,  // 15 seconds
    checkInterval: 5000      // 5 seconds
  };

  constructor(config?: Partial<WatchdogConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Start monitoring connection health
   * @param onStale Callback when connection is detected as stale
   */
  start(onStale: () => void): void {
    if (this.isRunning) {
      console.warn('[Watchdog] Already running');
      return;
    }

    console.log('[Watchdog] 🐕 Starting connection monitor');
    this.isRunning = true;
    this.lastActivity = Date.now();

    this.heartbeatInterval = setInterval(() => {
      const elapsed = Date.now() - this.lastActivity;
      
      if (elapsed > this.config.activityTimeout) {
        console.error(
          `[Watchdog] ⚠️ Connection stale detected! No activity for ${elapsed}ms (threshold: ${this.config.activityTimeout}ms)`
        );
        
        // Stop monitoring before calling callback to prevent loops
        this.stop();
        
        // Notify about stale connection
        onStale();
      } else {
        // Log heartbeat in dev mode
        if (import.meta.env.DEV) {
          console.log(`[Watchdog] 💓 Heartbeat - last activity ${elapsed}ms ago`);
        }
      }
    }, this.config.checkInterval);
  }

  /**
   * Record activity (call this on any message received)
   */
  ping(): void {
    this.lastActivity = Date.now();
    
    if (import.meta.env.DEV) {
      console.log('[Watchdog] 📡 Activity detected');
    }
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('[Watchdog] 🛑 Stopping connection monitor');
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    this.isRunning = false;
  }

  /**
   * Check if watchdog is currently running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get time since last activity
   */
  getTimeSinceLastActivity(): number {
    return Date.now() - this.lastActivity;
  }

  /**
   * Manually reset activity timer (use when sending messages)
   */
  reset(): void {
    console.log('[Watchdog] 🔄 Manual reset');
    this.lastActivity = Date.now();
  }
}
