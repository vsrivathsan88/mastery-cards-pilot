/**
 * Circuit Breaker - Prevents cascading failures
 * Opens circuit after threshold failures, provides fallback
 */

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerConfig {
  failureThreshold: number;  // Number of failures before opening circuit
  resetTimeout: number;      // Time to wait before trying again (ms)
  monitoringPeriod: number;  // Time window for counting failures (ms)
}

export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: CircuitState = 'closed';
  private failureTimestamps: number[] = [];
  
  private readonly config: CircuitBreakerConfig = {
    failureThreshold: 3,
    resetTimeout: 30000,      // 30 seconds
    monitoringPeriod: 60000   // 1 minute
  };

  constructor(config?: Partial<CircuitBreakerConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Execute function with circuit breaker protection
   * Returns fallback value if circuit is open
   */
  async execute<T>(
    fn: () => Promise<T>,
    fallback: T,
    operationName: string = 'operation'
  ): Promise<T> {
    // Check if circuit should transition from open to half-open
    if (this.state === 'open') {
      const elapsed = Date.now() - this.lastFailureTime;
      
      if (elapsed < this.config.resetTimeout) {
        console.warn(`[CircuitBreaker] Circuit OPEN for ${operationName} - using fallback`);
        return fallback;
      }
      
      console.log(`[CircuitBreaker] Circuit transitioning to HALF-OPEN for ${operationName}`);
      this.state = 'half-open';
    }

    try {
      const result = await fn();
      this.onSuccess(operationName);
      return result;
    } catch (error) {
      this.onFailure(operationName, error);
      return fallback;
    }
  }

  /**
   * Called on successful execution
   */
  private onSuccess(operationName: string): void {
    if (this.state === 'half-open') {
      console.log(`[CircuitBreaker] ✅ Success in HALF-OPEN state for ${operationName} - closing circuit`);
      
      // Add jitter to prevent thundering herd when multiple clients recover
      const jitter = Math.random() * 5000; // 0-5 seconds
      
      setTimeout(() => {
        this.failures = 0;
        this.failureTimestamps = [];
        this.state = 'closed';
        console.log(`[CircuitBreaker] Circuit fully closed after ${jitter.toFixed(0)}ms jitter`);
      }, jitter);
      
      return; // Don't immediately close
    }
    
    this.failures = 0;
    this.failureTimestamps = [];
    this.state = 'closed';
  }

  /**
   * Called on failed execution
   */
  private onFailure(operationName: string, error: any): void {
    const now = Date.now();
    this.lastFailureTime = now;
    this.failureTimestamps.push(now);
    
    // Remove old failures outside monitoring period
    this.failureTimestamps = this.failureTimestamps.filter(
      timestamp => now - timestamp < this.config.monitoringPeriod
    );
    
    this.failures = this.failureTimestamps.length;
    
    console.error(
      `[CircuitBreaker] ❌ Failure for ${operationName} (${this.failures}/${this.config.failureThreshold}):`,
      error
    );
    
    // Open circuit if threshold exceeded
    if (this.failures >= this.config.failureThreshold) {
      if (this.state !== 'open') {
        console.error(
          `[CircuitBreaker] 🔥 OPENING CIRCUIT for ${operationName} - too many failures (${this.failures} in ${this.config.monitoringPeriod}ms)`
        );
      }
      this.state = 'open';
    }
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get failure count
   */
  getFailureCount(): number {
    return this.failures;
  }

  /**
   * Force reset circuit (for testing or manual recovery)
   */
  reset(): void {
    console.log('[CircuitBreaker] 🔄 Manual reset');
    this.failures = 0;
    this.failureTimestamps = [];
    this.state = 'closed';
    this.lastFailureTime = 0;
  }

  /**
   * Check if circuit is operational
   */
  isOperational(): boolean {
    return this.state === 'closed' || this.state === 'half-open';
  }
}
