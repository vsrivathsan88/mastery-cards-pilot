/**
 * Retry Strategy - Exponential backoff with jitter
 * Handles transient failures gracefully
 */

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;      // Base delay in ms
  maxDelay: number;       // Cap for exponential growth
  jitterFactor: number;   // 0-1, amount of randomness to add
  timeout?: number;       // Per-attempt timeout in ms
}

export class RetryStrategy {
  private attempt: number = 0;
  
  private readonly config: RetryConfig = {
    maxAttempts: 5,
    baseDelay: 1000,      // 1 second
    maxDelay: 30000,      // 30 seconds
    jitterFactor: 0.25,   // ±25%
    timeout: 10000        // 10 seconds per attempt
  };

  constructor(config?: Partial<RetryConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Execute function with exponential backoff retry
   */
  async execute<T>(
    fn: () => Promise<T>,
    operationName: string = 'operation'
  ): Promise<T> {
    this.attempt = 0;

    while (this.attempt < this.config.maxAttempts) {
      try {
        this.attempt++;
        
        console.log(`[Retry] Attempting ${operationName} (${this.attempt}/${this.config.maxAttempts})`);
        
        // Execute with timeout if configured
        const result = this.config.timeout
          ? await this.executeWithTimeout(fn, this.config.timeout)
          : await fn();
        
        // Success! Reset and return
        if (this.attempt > 1) {
          console.log(`[Retry] ✅ ${operationName} succeeded on attempt ${this.attempt}`);
        }
        this.reset();
        return result;
        
      } catch (error) {
        const isLastAttempt = this.attempt >= this.config.maxAttempts;
        
        if (isLastAttempt) {
          console.error(
            `[Retry] ❌ ${operationName} failed after ${this.attempt} attempts:`,
            error
          );
          throw new Error(
            `${operationName} failed after ${this.attempt} attempts: ${error}`
          );
        }
        
        const delay = this.calculateDelay();
        console.warn(
          `[Retry] ⚠️ ${operationName} attempt ${this.attempt} failed. Retrying in ${delay}ms...`,
          error
        );
        
        await this.sleep(delay);
      }
    }

    throw new Error(`Unexpected retry loop exit for ${operationName}`);
  }

  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
      )
    ]);
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateDelay(): number {
    // Exponential: baseDelay * 2^(attempt-1)
    // Example: 1s, 2s, 4s, 8s, 16s
    const exponential = Math.min(
      this.config.baseDelay * Math.pow(2, this.attempt - 1),
      this.config.maxDelay
    );
    
    // Add jitter to prevent thundering herd
    // If jitterFactor = 0.25, adds ±25% randomness
    const jitterRange = exponential * this.config.jitterFactor;
    const jitter = jitterRange * (Math.random() * 2 - 1);
    
    return Math.floor(exponential + jitter);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reset attempt counter
   */
  private reset(): void {
    this.attempt = 0;
  }

  /**
   * Get current attempt number
   */
  getCurrentAttempt(): number {
    return this.attempt;
  }
}
