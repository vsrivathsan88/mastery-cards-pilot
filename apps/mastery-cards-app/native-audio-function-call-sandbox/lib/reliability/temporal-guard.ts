/**
 * Temporal Guard - Time-based validation
 * Rejects stale/outdated data based on timestamps
 */

export interface TemporalConfig {
  maxAge: number;           // Maximum age of events in ms
  clockSkewTolerance: number; // Tolerance for clock differences
}

export interface TimestampedEvent {
  timestamp: number;
  [key: string]: any;
}

export class TemporalGuard {
  private readonly config: TemporalConfig = {
    maxAge: 5000,              // 5 seconds
    clockSkewTolerance: 1000   // 1 second
  };
  
  // Clock calibration to handle system time drift
  private clockOffset: number = 0;
  private lastCalibration: number = 0;
  private readonly CALIBRATION_INTERVAL = 60000; // Re-calibrate every minute

  constructor(config?: Partial<TemporalConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }
  
  /**
   * Get adjusted current time accounting for clock offset
   */
  now(): number {
    // Auto-recalibrate if needed
    if (Date.now() - this.lastCalibration > this.CALIBRATION_INTERVAL) {
      this.quickCalibrate();
    }
    
    return Date.now() + this.clockOffset;
  }
  
  /**
   * Quick calibration using monotonic clock detection
   * Detects if system clock jumped (user changed time)
   */
  private quickCalibrate(): void {
    const now = Date.now();
    
    // Detect large backward jumps (> 5 seconds)
    if (this.lastCalibration > 0) {
      const expectedMin = this.lastCalibration + this.CALIBRATION_INTERVAL - 5000;
      if (now < expectedMin) {
        const skew = expectedMin - now;
        console.warn(`[TemporalGuard] Clock jumped backward by ${skew}ms - adjusting offset`);
        this.clockOffset += skew;
      }
    }
    
    this.lastCalibration = now;
  }

  /**
   * Check if timestamp is stale
   */
  isStale(timestamp: number): boolean {
    const now = this.now(); // Use calibrated time
    const age = now - timestamp;
    
    // Account for clock skew - reject events from the future too
    if (timestamp > now + this.config.clockSkewTolerance) {
      console.warn(`[TemporalGuard] ⚠️ Event timestamp is in the future by ${timestamp - now}ms`);
      return true;
    }
    
    return age > this.config.maxAge;
  }

  /**
   * Validate event - returns event if fresh, null if stale
   */
  validate<T extends TimestampedEvent>(
    event: T,
    eventType: string = 'event'
  ): T | null {
    const age = this.now() - event.timestamp;
    
    if (this.isStale(event.timestamp)) {
      console.warn(
        `[TemporalGuard] 🕐 Rejecting stale ${eventType} (age: ${age}ms, max: ${this.config.maxAge}ms)`
      );
      return null;
    }
    
    if (import.meta.env.DEV && age > this.config.maxAge * 0.8) {
      console.warn(
        `[TemporalGuard] ⚠️ ${eventType} is getting old (age: ${age}ms, max: ${this.config.maxAge}ms)`
      );
    }
    
    return event;
  }

  /**
   * Validate multiple events, return only fresh ones
   */
  validateBatch<T extends TimestampedEvent>(
    events: T[],
    eventType: string = 'event'
  ): T[] {
    const fresh = events.filter(event => !this.isStale(event.timestamp));
    
    const staleCount = events.length - fresh.length;
    if (staleCount > 0) {
      console.warn(
        `[TemporalGuard] 🕐 Filtered ${staleCount} stale ${eventType}(s) from batch of ${events.length}`
      );
    }
    
    return fresh;
  }

  /**
   * Add timestamp to event
   */
  stamp<T extends Record<string, any>>(event: T): T & TimestampedEvent {
    return {
      ...event,
      timestamp: this.now()
    };
  }

  /**
   * Create a stamped event
   */
  createStampedEvent<T>(data: T): T & TimestampedEvent {
    return this.stamp(data as any);
  }

  /**
   * Get age of event in milliseconds
   */
  getAge(timestamp: number): number {
    return this.now() - timestamp;
  }

  /**
   * Check if event is within time window
   */
  isWithinWindow(timestamp: number, windowMs: number): boolean {
    return this.getAge(timestamp) <= windowMs;
  }

  /**
   * Compare two timestamps, accounting for clock skew
   */
  isBefore(timestamp1: number, timestamp2: number): boolean {
    // Account for clock skew tolerance
    return timestamp1 < timestamp2 - this.config.clockSkewTolerance;
  }

  /**
   * Get configuration
   */
  getConfig(): TemporalConfig {
    return { ...this.config };
  }
}
