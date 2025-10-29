import { StateGraph } from '@langchain/langgraph';
import { AgentState, AgentStateType } from './state';
import { MisconceptionClassifier } from '../subagents/MisconceptionClassifier';
import { EmotionalClassifier } from '../subagents/EmotionalClassifier';
import { PrerequisiteDetector } from '../subagents/PrerequisiteDetector';
import { ContextManager } from '../context/ContextManager';
import { createLogger } from '../utils/logger';

const logger = createLogger({ prefix: '[MultiAgentGraph]' });

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚠️ DEBUG ONLY - Simple Event System (Browser Compatible)
// TO REMOVE: Delete this entire block when removing debug
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
type EventHandler = (data: any) => void;

class SimpleEventEmitter {
  private events: Map<string, EventHandler[]> = new Map();

  on(event: string, handler: EventHandler) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(handler);
  }

  emit(event: string, data?: any) {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  off(event: string, handler: EventHandler) {
    const handlers = this.events.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
}
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export class MultiAgentGraph {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⚠️ DEBUG ONLY - Event System
  // TO REMOVE: Delete this property when removing debug
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  private eventEmitter = new SimpleEventEmitter();
  
  // Expose event methods for external listeners
  on = this.eventEmitter.on.bind(this.eventEmitter);
  emit = this.eventEmitter.emit.bind(this.eventEmitter);
  off = this.eventEmitter.off.bind(this.eventEmitter);
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  private graph: StateGraph<typeof AgentState>;
  private misconceptionClassifier: MisconceptionClassifier;
  private emotionalClassifier: EmotionalClassifier;
  private prerequisiteDetector: PrerequisiteDetector;
  private contextManager: ContextManager;
  private compiled: any;

  constructor(apiKey?: string) {
    this.misconceptionClassifier = new MisconceptionClassifier(apiKey);
    this.emotionalClassifier = new EmotionalClassifier(apiKey || '');
    this.prerequisiteDetector = new PrerequisiteDetector(apiKey);
    this.contextManager = new ContextManager();
    this.graph = new StateGraph(AgentState);
    
    this.buildGraph();
    this.compiled = this.graph.compile();
  }

  private buildGraph(): void {
    // Node 1: Process transcription
    this.graph.addNode('process_transcription', this.processTranscription.bind(this));
    
    // Node 2-4: Parallel analysis nodes (3-way parallel execution)
    this.graph.addNode('analyze_misconception', this.analyzeMisconception.bind(this));
    this.graph.addNode('analyze_emotional', this.analyzeEmotional.bind(this));
    this.graph.addNode('analyze_prerequisite', this.analyzePrerequisite.bind(this));
    
    // Node 5: Format context for Main Agent
    this.graph.addNode('format_context', this.formatContext.bind(this));
    
    // Define edges (flow)
    // @ts-ignore - LangGraph types are strict, but this works at runtime
    this.graph.addEdge('__start__' as any, 'process_transcription' as any);
    
    // PARALLEL EXECUTION: All 3 analyses run simultaneously
    // Fan out: process_transcription → [analyze_misconception, analyze_emotional, analyze_prerequisite]
    // @ts-ignore
    this.graph.addEdge('process_transcription' as any, 'analyze_misconception' as any);
    // @ts-ignore
    this.graph.addEdge('process_transcription' as any, 'analyze_emotional' as any);
    // @ts-ignore
    this.graph.addEdge('process_transcription' as any, 'analyze_prerequisite' as any);
    
    // Fan in: Wait for all 3 to complete before formatting
    // @ts-ignore
    this.graph.addEdge('analyze_misconception' as any, 'format_context' as any);
    // @ts-ignore
    this.graph.addEdge('analyze_emotional' as any, 'format_context' as any);
    // @ts-ignore
    this.graph.addEdge('analyze_prerequisite' as any, 'format_context' as any);
    
    // @ts-ignore
    this.graph.addEdge('format_context' as any, '__end__' as any);
    
    logger.info('Graph built with 3-WAY PARALLEL execution: misconception + emotional + prerequisite run simultaneously');
  }

  /**
   * Node: Process incoming transcription
   */
  private async processTranscription(state: AgentStateType): Promise<Partial<AgentStateType>> {
    const startTime = Date.now();
    
    logger.info('[MultiAgentGraph] Processing transcription', {
      turn: state.turnNumber,
      isFinal: state.isFinal,
      transcription: state.transcription.substring(0, 50) + '...',
    });

    // Update transcription history
    const history = state.transcriptionHistory || [];
    if (state.isFinal) {
      history.push(state.transcription);
      
      // Keep only last 5 for context window management
      if (history.length > 5) {
        history.splice(0, history.length - 5);
      }
    }

    // Update context manager
    if (state.lesson && state.currentMilestone !== undefined) {
      this.contextManager.updateLessonContext(
        state.lesson,
        state.currentMilestone,
        state.milestoneIndex,
        state.attempts,
        state.timeOnMilestone
      );
    }

    const duration = Date.now() - startTime;
    logger.info(`[MultiAgentGraph] Processing complete in ${duration}ms, starting parallel analysis...`);

    return {
      transcriptionHistory: history,
      timestamp: Date.now(),
    };
  }

  /**
   * Node: Analyze for misconceptions using sub-agent
   * PARALLEL EXECUTION: Runs simultaneously with emotional analysis
   */
  private async analyzeMisconception(state: AgentStateType): Promise<Partial<AgentStateType>> {
    const startTime = Date.now();
    
    // Only analyze final transcriptions
    if (!state.isFinal) {
      logger.info('[Misconception] Skipping (not final transcription)');
      return {};
    }

    if (!state.lesson) {
      logger.warn('[Misconception] No lesson context, skipping');
      return {};
    }

    logger.info('[Misconception] 🚀 Starting analysis (PARALLEL)...');
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ⚠️ DEBUG ONLY - Emit agent start event
    // TO REMOVE: Delete this emit when removing debug
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    this.emit('agent:start', {
      turn: state.turnNumber,
      agent: 'misconception',
      timestamp: startTime,
    });
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    try {
      // Extract known misconceptions from lesson
      const scaffolding = (state.lesson as any).scaffolding;
      const knownMisconceptions = scaffolding?.commonMisconceptions || [];

      // Call misconception classifier (Gemini 2.0 Flash)
      const result = await this.misconceptionClassifier.analyze({
        transcription: state.transcription,
        lesson: state.lesson,
        knownMisconceptions,
      });

      const duration = Date.now() - startTime;
      logger.info(`[Misconception] ✅ Complete in ${duration}ms - Detected: ${result.detected}`, {
        type: result.type,
        confidence: result.confidence,
      });

      // Update context manager
      if (result.detected) {
        this.contextManager.addMisconception({
          turn: state.turnNumber,
          detected: true,
          type: result.type,
          confidence: result.confidence,
          evidence: result.evidence,
          intervention: result.intervention,
          correctiveConcept: result.correctiveConcept,
        });
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // ⚠️ DEBUG ONLY - Emit agent complete event
      // TO REMOVE: Delete this emit when removing debug
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      this.emit('agent:complete', {
        turn: state.turnNumber,
        agent: 'misconception',
        timestamp: Date.now(),
        duration,
        result,
      });
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      return {
        misconception: result,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`[Misconception] ❌ Failed after ${duration}ms`, { error });
      
      // Return safe fallback (graceful degradation)
      return {
        misconception: { detected: false },
      };
    }
  }

  /**
   * Node: Analyze emotional state
   * PARALLEL EXECUTION: Runs simultaneously with misconception and prerequisite analysis
   */
  private async analyzeEmotional(state: AgentStateType): Promise<Partial<AgentStateType>> {
    const startTime = Date.now();
    
    logger.info('[Emotional] 🚀 Starting analysis (PARALLEL)...');

    try {
      // Call emotional classifier (Gemini 2.0 Flash)
      const result = await this.emotionalClassifier.analyze(
        state.transcription,
        state.transcriptionHistory
      );

      const duration = Date.now() - startTime;
      logger.info(`[Emotional] ✅ Complete in ${duration}ms - State: ${result.state}`, {
        engagement: result.engagementLevel,
        frustration: result.frustrationLevel,
        confusion: result.confusionLevel,
        confidence: result.confidence,
      });

      // Store in context manager
      this.contextManager.updateEmotionalContext({
        timestamp: Date.now(),
        state: result.state,
        engagementLevel: result.engagementLevel,
        frustrationLevel: result.frustrationLevel,
        confusionLevel: result.confusionLevel,
        indicators: result.evidence,
        trend: result.state, // Simplified for now
        recommendation: result.recommendation,
      });

      return {
        emotional: {
          state: result.state,
          engagementLevel: result.engagementLevel,
          frustrationLevel: result.frustrationLevel,
          confusionLevel: result.confusionLevel,
          indicators: result.evidence,
          trend: result.state,
          recommendation: result.recommendation,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`[Emotional] ❌ Failed after ${duration}ms`, { error });
      
      // Return neutral fallback (graceful degradation)
      return {
        emotional: {
          state: 'neutral',
          engagementLevel: 0.5,
          frustrationLevel: 0,
          confusionLevel: 0,
          indicators: [],
          trend: 'stable',
          recommendation: 'Continue with current approach',
        },
      };
    }
  }

  /**
   * Node: Analyze for prerequisite gaps (INVISIBLE ASSESSMENT)
   * PARALLEL EXECUTION: Runs simultaneously with misconception and emotional analysis
   */
  private async analyzePrerequisite(state: AgentStateType): Promise<Partial<AgentStateType>> {
    const startTime = Date.now();
    
    // Only analyze in early lesson stages (wonder hook, Milestone 0-1)
    if (!state.lesson || state.milestoneIndex > 2) {
      logger.info('[Prerequisite] Skipping (beyond early lesson stages)');
      return {};
    }

    // Only analyze final transcriptions
    if (!state.isFinal) {
      logger.info('[Prerequisite] Skipping (not final transcription)');
      return {};
    }

    logger.info('[Prerequisite] 🚀 Starting invisible assessment (PARALLEL)...');

    try {
      // Extract prerequisites from lesson
      const lesson = state.lesson as any;
      const prerequisites = lesson.prerequisitesDetailed || [];

      if (prerequisites.length === 0) {
        logger.info('[Prerequisite] No prerequisites defined in lesson');
        return {};
      }

      // Determine which prerequisites to check based on milestone
      const currentMilestone = lesson.milestones?.[state.milestoneIndex];
      const relevantPrereqs = prerequisites.filter((prereq: any) => {
        // Check prerequisites tagged for current stage
        if (state.milestoneIndex === 0 && prereq.checkTiming === 'milestone-0') return true;
        if (state.milestoneIndex === 1 && prereq.checkTiming === 'wonder-hook') return true;
        if (currentMilestone?.assessedPrerequisites?.includes(prereq.id)) return true;
        return false;
      });

      if (relevantPrereqs.length === 0) {
        logger.info('[Prerequisite] No relevant prerequisites for current milestone');
        return {};
      }

      // Analyze each relevant prerequisite
      const results = await Promise.all(
        relevantPrereqs.map((prereq: any) =>
          this.prerequisiteDetector.analyze({
            transcription: state.transcription,
            prerequisite: {
              id: prereq.id,
              concept: prereq.concept,
              description: prereq.description,
              wonderHookQuestion: prereq.wonderHookQuestion,
              passSignals: [], // Would be populated from full prereq JSON
              gapSignals: [], // Would be populated from full prereq JSON
              microLesson: {
                approach: '',
                script: '',
                duration: 45,
                reAssessQuestion: '',
              },
            },
            conversationContext: state.transcriptionHistory,
            isWonderHook: state.milestoneIndex <= 1,
          })
        )
      );

      const duration = Date.now() - startTime;
      
      // Check if any critical gaps detected
      const criticalGaps = results.filter(r => r.status === 'GAP_DETECTED');
      
      logger.info(`[Prerequisite] ✅ Complete in ${duration}ms - Checked ${relevantPrereqs.length} prerequisites`, {
        gapsDetected: criticalGaps.length,
        results: results.map(r => ({ id: r.prerequisiteId, status: r.status, confidence: r.confidence })),
      });

      // Store in context manager
      if (criticalGaps.length > 0) {
        criticalGaps.forEach(gap => {
          this.contextManager.addPrerequisiteGap({
            turn: state.turnNumber,
            prerequisiteId: gap.prerequisiteId,
            concept: gap.concept,
            status: gap.status,
            confidence: gap.confidence,
            evidence: gap.evidence,
            nextAction: gap.nextAction,
            detectedGap: gap.detectedGap,
          });
        });
      }

      return {
        prerequisite: {
          checked: true,
          results,
          criticalGaps: criticalGaps.length,
          recommendedAction: criticalGaps.length > 0 ? 'TEACH_PREREQUISITE' : 'CONTINUE_LESSON',
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`[Prerequisite] ❌ Failed after ${duration}ms`, { error });
      
      // Return safe fallback (don't block lesson)
      return {
        prerequisite: {
          checked: false,
          results: [],
          criticalGaps: 0,
          recommendedAction: 'CONTINUE_LESSON',
        },
      };
    }
  }

  /**
   * Node: Format context for Main Agent
   */
  private async formatContext(state: AgentStateType): Promise<Partial<AgentStateType>> {
    logger.info('[MultiAgentGraph] Formatting context for Main Agent');

    // Get formatted context from ContextManager
    const formattedContext = this.contextManager.formatContextForPrompt();

    return {
      contextForMainAgent: formattedContext,
    };
  }

  /**
   * Run the graph with input state
   */
  async run(input: Partial<AgentStateType>): Promise<AgentStateType> {
    try {
      const result = await this.compiled.invoke(input);
      return result;
    } catch (error) {
      logger.error('[MultiAgentGraph] Graph execution failed', { error });
      throw error;
    }
  }

  /**
   * Stream the graph execution (for real-time updates)
   */
  async *stream(input: Partial<AgentStateType>): AsyncGenerator<AgentStateType> {
    try {
      const stream = await this.compiled.stream(input);
      
      for await (const chunk of stream) {
        yield chunk;
      }
    } catch (error) {
      logger.error('[MultiAgentGraph] Graph streaming failed', { error });
      throw error;
    }
  }

  /**
   * Get the context manager (for external access)
   */
  getContextManager(): ContextManager {
    return this.contextManager;
  }
}
