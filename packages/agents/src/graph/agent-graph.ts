import { StateGraph } from '@langchain/langgraph';
import { AgentState, AgentStateType } from './state';
import { MisconceptionClassifier } from '../subagents/MisconceptionClassifier';
import { EmotionalClassifier } from '../subagents/EmotionalClassifier';
import { ContextManager } from '../context/ContextManager';
import { createLogger } from '../utils/logger';

const logger = createLogger({ prefix: '[MultiAgentGraph]' });

export class MultiAgentGraph {
  private graph: StateGraph<typeof AgentState>;
  private misconceptionClassifier: MisconceptionClassifier;
  private emotionalClassifier: EmotionalClassifier;
  private contextManager: ContextManager;
  private compiled: any;

  constructor(apiKey?: string) {
    this.misconceptionClassifier = new MisconceptionClassifier(apiKey);
    this.emotionalClassifier = new EmotionalClassifier(apiKey || '');
    this.contextManager = new ContextManager();
    this.graph = new StateGraph(AgentState);
    
    this.buildGraph();
    this.compiled = this.graph.compile();
  }

  private buildGraph(): void {
    // Node 1: Process transcription
    this.graph.addNode('process_transcription', this.processTranscription.bind(this));
    
    // Node 2-3: Parallel analysis nodes
    this.graph.addNode('analyze_misconception', this.analyzeMisconception.bind(this));
    this.graph.addNode('analyze_emotional', this.analyzeEmotional.bind(this));
    
    // Node 4: Format context for Main Agent
    this.graph.addNode('format_context', this.formatContext.bind(this));
    
    // Define edges (flow)
    // @ts-ignore - LangGraph types are strict, but this works at runtime
    this.graph.addEdge('__start__' as any, 'process_transcription' as any);
    
    // PARALLEL EXECUTION: Both analyses run simultaneously
    // Fan out: process_transcription → [analyze_misconception, analyze_emotional]
    // @ts-ignore
    this.graph.addEdge('process_transcription' as any, 'analyze_misconception' as any);
    // @ts-ignore
    this.graph.addEdge('process_transcription' as any, 'analyze_emotional' as any);
    
    // Fan in: Wait for both to complete before formatting
    // @ts-ignore
    this.graph.addEdge('analyze_misconception' as any, 'format_context' as any);
    // @ts-ignore
    this.graph.addEdge('analyze_emotional' as any, 'format_context' as any);
    
    // @ts-ignore
    this.graph.addEdge('format_context' as any, '__end__' as any);
    
    logger.info('Graph built with PARALLEL execution: misconception + emotional run simultaneously');
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
   * PARALLEL EXECUTION: Runs simultaneously with misconception analysis
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
