/**
 * FillerService - Natural dialogue fillers while agents process
 * 
 * Provides natural conversational fillers when agents need time to analyze.
 * Prevents awkward silences and keeps conversation flowing.
 */

import { FillerManager, FillerType } from '@simili/agents';
import type { EmotionalContext } from '@simili/agents';

const logger = {
  info: (msg: string, data?: any) => console.log(`[FillerService] 💬 ${msg}`, data || ''),
  debug: (msg: string, data?: any) => console.debug(`[FillerService] 🔍 ${msg}`, data || ''),
};

export class FillerService {
  private fillerManager: FillerManager;
  private lastFillerUsed?: string;
  private lastFillerTime: number = 0;
  private fillerCount: number = 0;
  
  // Configuration
  private readonly MIN_DELAY_FOR_FILLER_MS = 500; // Only use filler if agents take >500ms
  private readonly MIN_TIME_BETWEEN_FILLERS_MS = 5000; // Don't overuse fillers
  private readonly MAX_FILLERS_PER_SESSION = 10; // Limit per lesson

  constructor() {
    this.fillerManager = new FillerManager();
    logger.info('Initialized');
  }

  /**
   * Determine if we should use a filler
   * Based on expected agent processing time and conversation context
   */
  public shouldUseFiller(
    expectedProcessingTimeMs: number,
    emotional?: EmotionalContext
  ): boolean {
    // Don't use filler if agents will be fast
    if (expectedProcessingTimeMs < this.MIN_DELAY_FOR_FILLER_MS) {
      logger.debug('Skipping filler - agents fast enough', { expectedMs: expectedProcessingTimeMs });
      return false;
    }

    // Don't overuse fillers
    const timeSinceLastFiller = Date.now() - this.lastFillerTime;
    if (timeSinceLastFiller < this.MIN_TIME_BETWEEN_FILLERS_MS) {
      logger.debug('Skipping filler - used one recently', { 
        timeSinceLast: timeSinceLastFiller 
      });
      return false;
    }

    // Check session limit
    if (this.fillerCount >= this.MAX_FILLERS_PER_SESSION) {
      logger.debug('Skipping filler - session limit reached');
      return false;
    }

    // If student is frustrated, use more supportive fillers
    if (emotional && emotional.frustrationLevel > 0.6) {
      logger.debug('Using filler - student frustrated');
      return true;
    }

    // Default: use filler if expected delay is significant
    logger.debug('Using filler - expected delay significant', { expectedMs: expectedProcessingTimeMs });
    return true;
  }

  /**
   * Get an appropriate filler based on emotional context
   */
  public getFiller(
    emotional?: EmotionalContext,
    turnNumber: number = 0
  ): string | null {
    let fillerType: FillerType = FillerType.ACKNOWLEDGING;

    // Choose filler type based on emotional state
    if (emotional) {
      if (emotional.frustrationLevel > 0.6) {
        fillerType = FillerType.ENCOURAGING;
      } else if (emotional.confusionLevel > 0.5) {
        fillerType = FillerType.PROBING;
      } else if (emotional.engagementLevel > 0.7) {
        fillerType = FillerType.ACKNOWLEDGING;
      } else {
        fillerType = FillerType.THINKING;
      }
    }

    // Get filler using correct API
    const filler = this.fillerManager.getFiller({ type: fillerType });
    
    if (filler) {
      this.lastFillerUsed = filler;
      this.lastFillerTime = Date.now();
      this.fillerCount++;
      
      logger.info('Selected filler', { 
        type: fillerType, 
        filler,
        count: this.fillerCount 
      });
      
      return filler;
    }

    logger.debug('No filler available');
    return null;
  }

  /**
   * Get filler examples for debugging
   */
  public getFillerExamples(): Record<FillerType, string[]> {
    return {
      [FillerType.ACKNOWLEDGING]: this.fillerManager.getFillersByType(FillerType.ACKNOWLEDGING),
      [FillerType.ENCOURAGING]: this.fillerManager.getFillersByType(FillerType.ENCOURAGING),
      [FillerType.THINKING]: this.fillerManager.getFillersByType(FillerType.THINKING),
      [FillerType.PROBING]: this.fillerManager.getFillersByType(FillerType.PROBING),
      [FillerType.NEUTRAL]: this.fillerManager.getFillersByType(FillerType.NEUTRAL),
    };
  }

  /**
   * Reset for new lesson/session
   */
  public reset(): void {
    this.lastFillerUsed = undefined;
    this.lastFillerTime = 0;
    this.fillerCount = 0;
    logger.info('Reset');
  }

  /**
   * Get statistics
   */
  public getStats(): {
    totalUsed: number;
    lastUsed?: string;
    timeSinceLast: number;
  } {
    return {
      totalUsed: this.fillerCount,
      lastUsed: this.lastFillerUsed,
      timeSinceLast: Date.now() - this.lastFillerTime,
    };
  }
}
