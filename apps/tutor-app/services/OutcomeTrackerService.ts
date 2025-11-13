/**
 * Outcome Tracker Service
 * 
 * Collects evidence of student learning outcomes:
 * - Procedural competence (can they DO the procedure?)
 * - Correctness (did they get it right?)
 * - Talk-out-loud engagement (did they explain their thinking?)
 * - Transfer ability (can they apply to new contexts?)
 */

import { OutcomeEvidence, EnhancedMilestoneLog } from '@/lib/pilot-types';
import { MasteryMilestoneLog } from '@/lib/teacher-panel-types';

interface EvidenceSource {
  transcript: string;
  canvasSnapshot?: string;
  canvasShapeCount?: number;
  toolCallsUsed?: Array<{ name: string; timestamp: number; purpose: string }>;
  timeSpent: number;
  attemptCount: number;
}

interface CorrectnessAnalysis {
  correctness: 'correct' | 'partial' | 'incorrect' | 'not-assessed';
  confidence: number;
  reasoning: string;
}

export class OutcomeTrackerService {
  /**
   * Collect outcome evidence for a milestone
   */
  static async collectEvidence(
    milestone: any,
    source: EvidenceSource
  ): Promise<OutcomeEvidence> {
    const taskType = this.inferTaskType(milestone.id);
    
    // Analyze transcript for verbal evidence
    const verbalEvidence = this.analyzeTranscript(source.transcript);
    
    // Analyze canvas if available
    const canvasEvidence = source.canvasSnapshot 
      ? this.analyzeCanvas(source.canvasSnapshot, source.canvasShapeCount || 0)
      : undefined;
    
    // Determine correctness
    const correctnessAnalysis = await this.assessCorrectness(
      milestone,
      source.transcript,
      canvasEvidence
    );
    
    // Track talk-out-loud metrics
    const talkOutLoudMetrics = this.assessTalkOutLoud(
      source.transcript,
      verbalEvidence,
      milestone
    );
    
    // Check for transfer indicators
    const transferIndicators = this.detectTransfer(
      milestone,
      source.transcript,
      taskType
    );
    
    const evidence: OutcomeEvidence = {
      taskType,
      taskDescription: milestone.title || milestone.description,
      correctness: correctnessAnalysis.correctness,
      confidenceLevel: correctnessAnalysis.confidence,
      canvasEvidence,
      verbalEvidence,
      talkOutLoudMetrics,
      transferIndicators,
      attemptStartTime: Date.now() - (source.timeSpent * 1000),
      attemptEndTime: Date.now(),
      timeSpent: source.timeSpent,
    };
    
    return evidence;
  }

  /**
   * Infer task type from milestone ID/content
   */
  private static inferTaskType(
    milestoneId: string
  ): 'partition' | 'identify' | 'create' | 'explain' | 'transfer' | 'verify' {
    const id = milestoneId.toLowerCase();
    
    if (id.includes('partition') || id.includes('divide') || id.includes('equal-parts')) {
      return 'partition';
    }
    if (id.includes('identify') || id.includes('recognize') || id.includes('name')) {
      return 'identify';
    }
    if (id.includes('create') || id.includes('draw') || id.includes('make')) {
      return 'create';
    }
    if (id.includes('explain') || id.includes('describe') || id.includes('tell')) {
      return 'explain';
    }
    if (id.includes('transfer') || id.includes('apply') || id.includes('challenge')) {
      return 'transfer';
    }
    if (id.includes('verify') || id.includes('check') || id.includes('compare')) {
      return 'verify';
    }
    
    return 'explain'; // Default
  }

  /**
   * Analyze transcript for verbal evidence
   */
  private static analyzeTranscript(transcript: string): OutcomeEvidence['verbalEvidence'] {
    if (!transcript || transcript.trim().length === 0) {
      return undefined;
    }

    const wordCount = transcript.split(/\s+/).length;
    const hasCorrectTerms = this.countMathTerms(transcript);
    const hasSelfCorrection = /(?:wait|no|actually|I mean|let me think)/i.test(transcript);
    
    // Determine clarity based on length and terminology
    let clarity: 'clear' | 'partial' | 'unclear';
    if (wordCount >= 10 && hasCorrectTerms >= 2) {
      clarity = 'clear';
    } else if (wordCount >= 5 && hasCorrectTerms >= 1) {
      clarity = 'partial';
    } else {
      clarity = 'unclear';
    }
    
    // Assess reasoning quality
    let reasoning: 'strong' | 'developing' | 'minimal';
    if (wordCount >= 15 && hasCorrectTerms >= 3) {
      reasoning = 'strong';
    } else if (wordCount >= 8 && hasCorrectTerms >= 2) {
      reasoning = 'developing';
    } else {
      reasoning = 'minimal';
    }
    
    return {
      explanation: transcript,
      clarity,
      terminology: this.extractMathTerms(transcript),
      reasoning,
      selfCorrection: hasSelfCorrection,
    };
  }

  /**
   * Count math terms in transcript
   */
  private static countMathTerms(text: string): number {
    const mathTerms = [
      'equal', 'same', 'different', 'half', 'third', 'fourth', 'sixth',
      'fraction', 'part', 'whole', 'divide', 'partition', 'share',
      'numerator', 'denominator', 'size', 'amount', 'pieces'
    ];
    
    let count = 0;
    const lowerText = text.toLowerCase();
    for (const term of mathTerms) {
      if (lowerText.includes(term)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Extract math terms used
   */
  private static extractMathTerms(text: string): string[] {
    const mathTerms = [
      'equal', 'same', 'different', 'half', 'third', 'fourth', 'sixth',
      'fraction', 'part', 'whole', 'divide', 'partition', 'share',
      'numerator', 'denominator', 'size', 'amount', 'pieces',
      'one-half', 'one-third', 'one-fourth', 'two-thirds', 'three-fourths'
    ];
    
    const found: string[] = [];
    const lowerText = text.toLowerCase();
    
    for (const term of mathTerms) {
      if (lowerText.includes(term)) {
        found.push(term);
      }
    }
    
    return found;
  }

  /**
   * Analyze canvas drawing
   */
  private static analyzeCanvas(
    snapshotDataUrl: string,
    shapeCount: number
  ): OutcomeEvidence['canvasEvidence'] {
    // Simple heuristic analysis
    // In a full implementation, this would use vision API
    
    return {
      shapesDrawn: [`${shapeCount} shapes`],
      correctPartitions: shapeCount >= 2, // Heuristic: if they drew something
      equalityVerified: false, // Would need vision analysis
      partitionCount: shapeCount,
      expectedCount: undefined,
      visualAnalysis: `Student drew ${shapeCount} shapes on canvas`,
    };
  }

  /**
   * Assess correctness of student work
   */
  private static async assessCorrectness(
    milestone: any,
    transcript: string,
    canvasEvidence?: OutcomeEvidence['canvasEvidence']
  ): Promise<CorrectnessAnalysis> {
    // Simple keyword-based assessment
    // In production, this would use the MisconceptionClassifier or vision analysis
    
    const keywords = milestone.keywords || [];
    const matchedKeywords = keywords.filter((kw: string) => 
      transcript.toLowerCase().includes(kw.toLowerCase())
    );
    
    const matchRatio = keywords.length > 0 ? matchedKeywords.length / keywords.length : 0;
    
    let correctness: 'correct' | 'partial' | 'incorrect' | 'not-assessed';
    let confidence: number;
    
    if (matchRatio >= 0.7) {
      correctness = 'correct';
      confidence = 0.8 + (matchRatio * 0.2);
    } else if (matchRatio >= 0.4) {
      correctness = 'partial';
      confidence = 0.6;
    } else if (matchRatio > 0) {
      correctness = 'partial';
      confidence = 0.4;
    } else {
      correctness = 'not-assessed';
      confidence = 0.2;
    }
    
    // Boost confidence if canvas work present
    if (canvasEvidence?.correctPartitions) {
      confidence = Math.min(1.0, confidence + 0.1);
    }
    
    return {
      correctness,
      confidence,
      reasoning: `Matched ${matchedKeywords.length}/${keywords.length} key concepts`,
    };
  }

  /**
   * Assess talk-out-loud engagement
   */
  private static assessTalkOutLoud(
    transcript: string,
    verbalEvidence: OutcomeEvidence['verbalEvidence'],
    milestone: any
  ): OutcomeEvidence['talkOutLoudMetrics'] {
    const wordCount = transcript.split(/\s+/).length;
    
    // Check if this was prompted or unprompted
    const wasPrompted = /(?:why|how|explain|tell me|describe)/i.test(milestone.prompt || milestone.description || '');
    
    return {
      prompted: wasPrompted,
      responseProvided: wordCount >= 5,
      unprompted: !wasPrompted && wordCount >= 10,
      explanationLength: wordCount,
      reasoning: verbalEvidence?.reasoning || 'minimal',
      selfCorrection: verbalEvidence?.selfCorrection || false,
    };
  }

  /**
   * Detect transfer indicators
   */
  private static detectTransfer(
    milestone: any,
    transcript: string,
    taskType: string
  ): OutcomeEvidence['transferIndicators'] {
    // Check if milestone is a transfer task
    const isTransferTask = taskType === 'transfer' || 
                          milestone.id?.includes('transfer') ||
                          milestone.id?.includes('challenge');
    
    if (!isTransferTask) {
      return undefined;
    }
    
    // Look for novel context indicators
    const hasNovelContext = /(?:different|new|another|my own)/i.test(transcript);
    
    // Look for strategy explanation
    const hasStrategy = /(?:because|first|then|so|that's why)/i.test(transcript);
    
    // Look for connections to prior learning
    const hasConnections = /(?:remember|like before|same as|similar)/i.test(transcript);
    
    return {
      novelContext: hasNovelContext,
      independentApplication: transcript.split(/\s+/).length >= 15,
      strategyExplained: hasStrategy,
      connectionsMade: hasConnections ? ['referenced prior learning'] : [],
    };
  }

  /**
   * Generate session outcome summary
   */
  static generateSessionSummary(milestoneLogs: EnhancedMilestoneLog[]): any {
    const logsWithEvidence = milestoneLogs.filter(log => log.outcomeEvidence);
    
    if (logsWithEvidence.length === 0) {
      return null;
    }
    
    // Calculate procedural competency
    const taskBreakdown = this.calculateTaskBreakdown(logsWithEvidence);
    const overallAccuracy = this.calculateOverallAccuracy(logsWithEvidence);
    
    // Calculate talk-out-loud metrics
    const talkMetrics = this.calculateTalkOutLoudMetrics(logsWithEvidence);
    
    // Calculate transfer metrics
    const transferMetrics = this.calculateTransferMetrics(logsWithEvidence);
    
    // Calculate tool usage
    const toolUsage = this.calculateToolUsage(milestoneLogs);
    
    return {
      sessionId: `session-${Date.now()}`,
      timestamp: new Date(),
      
      proceduralCompetency: {
        overallAccuracy,
        taskBreakdown,
        averageConfidence: this.averageConfidence(logsWithEvidence),
      },
      
      talkOutLoudMetrics: talkMetrics,
      transferMetrics,
      toolUsageStats: toolUsage,
      
      totalMilestones: milestoneLogs.length,
      milestonesWithEvidence: logsWithEvidence.length,
    };
  }

  private static calculateTaskBreakdown(logs: EnhancedMilestoneLog[]): any {
    const breakdown: any = {
      partitioning: { attempted: 0, correct: 0, partial: 0 },
      identification: { attempted: 0, correct: 0, partial: 0 },
      creation: { attempted: 0, correct: 0, partial: 0 },
      verification: { attempted: 0, correct: 0, partial: 0 },
      transfer: { attempted: 0, correct: 0, partial: 0 },
    };
    
    for (const log of logs) {
      if (!log.outcomeEvidence) continue;
      
      const taskType = log.outcomeEvidence.taskType;
      const correctness = log.outcomeEvidence.correctness;
      
      const key = taskType === 'partition' ? 'partitioning' :
                  taskType === 'identify' ? 'identification' :
                  taskType === 'create' ? 'creation' :
                  taskType === 'verify' ? 'verification' :
                  'transfer';
      
      if (breakdown[key]) {
        breakdown[key].attempted++;
        if (correctness === 'correct') {
          breakdown[key].correct++;
        } else if (correctness === 'partial') {
          breakdown[key].partial++;
        }
      }
    }
    
    return breakdown;
  }

  private static calculateOverallAccuracy(logs: EnhancedMilestoneLog[]): number {
    let totalCorrect = 0;
    let totalPartial = 0;
    let totalAttempted = logs.length;
    
    for (const log of logs) {
      if (!log.outcomeEvidence) continue;
      
      if (log.outcomeEvidence.correctness === 'correct') {
        totalCorrect++;
      } else if (log.outcomeEvidence.correctness === 'partial') {
        totalPartial++;
      }
    }
    
    // Correct = 100%, Partial = 50%
    return totalAttempted > 0 
      ? ((totalCorrect * 100) + (totalPartial * 50)) / totalAttempted
      : 0;
  }

  private static calculateTalkOutLoudMetrics(logs: EnhancedMilestoneLog[]): any {
    let totalPrompts = 0;
    let responsesGiven = 0;
    let unpromptedCount = 0;
    let selfCorrectionCount = 0;
    let totalLength = 0;
    let clarityScores = 0;
    
    for (const log of logs) {
      if (!log.outcomeEvidence?.talkOutLoudMetrics) continue;
      
      const metrics = log.outcomeEvidence.talkOutLoudMetrics;
      
      if (metrics.prompted) totalPrompts++;
      if (metrics.responseProvided) responsesGiven++;
      if (metrics.unprompted) unpromptedCount++;
      if (metrics.selfCorrection) selfCorrectionCount++;
      
      totalLength += metrics.explanationLength;
      
      // Convert clarity to score
      const clarity = log.outcomeEvidence.verbalEvidence?.clarity;
      if (clarity === 'clear') clarityScores += 100;
      else if (clarity === 'partial') clarityScores += 50;
    }
    
    const count = logs.length;
    
    return {
      totalPrompts,
      responsesGiven,
      responseRate: totalPrompts > 0 ? responsesGiven / totalPrompts : 0,
      averageClarity: count > 0 ? clarityScores / count : 0,
      unpromptedExplanations: unpromptedCount,
      selfCorrections: selfCorrectionCount,
      averageExplanationLength: count > 0 ? totalLength / count : 0,
    };
  }

  private static calculateTransferMetrics(logs: EnhancedMilestoneLog[]): any {
    let attempted = 0;
    let correct = 0;
    let independentStrategies = 0;
    const connections: string[] = [];
    
    for (const log of logs) {
      const transfer = log.outcomeEvidence?.transferIndicators;
      if (!transfer) continue;
      
      attempted++;
      if (log.outcomeEvidence?.correctness === 'correct') correct++;
      if (transfer.independentApplication) independentStrategies++;
      if (transfer.connectionsMade) connections.push(...transfer.connectionsMade);
    }
    
    return {
      novelProblemsAttempted: attempted,
      novelProblemsCorrect: correct,
      transferSuccessRate: attempted > 0 ? (correct / attempted) * 100 : 0,
      independentStrategies,
      connectionsMade: [...new Set(connections)],
    };
  }

  private static calculateToolUsage(logs: MasteryMilestoneLog[]): any {
    let canvasDrawing = 0;
    let canvasLabels = 0;
    let emojiReactions = 0;
    let totalTools = 0;
    
    for (const log of logs) {
      const tools = (log as EnhancedMilestoneLog).toolCallsUsed || [];
      for (const tool of tools) {
        totalTools++;
        if (tool.name === 'draw_on_canvas') canvasDrawing++;
        if (tool.name === 'add_canvas_label') canvasLabels++;
        if (tool.name === 'show_emoji_reaction') emojiReactions++;
      }
    }
    
    return {
      canvasDrawingByPi: canvasDrawing,
      canvasLabelsByPi: canvasLabels,
      emojiReactionsByPi: emojiReactions,
      totalToolCalls: totalTools,
    };
  }

  private static averageConfidence(logs: EnhancedMilestoneLog[]): number {
    let total = 0;
    let count = 0;
    
    for (const log of logs) {
      if (log.outcomeEvidence?.confidenceLevel !== undefined) {
        total += log.outcomeEvidence.confidenceLevel;
        count++;
      }
    }
    
    return count > 0 ? total / count : 0;
  }
}
