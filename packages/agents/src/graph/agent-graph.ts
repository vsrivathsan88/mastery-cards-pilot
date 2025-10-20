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
    
    // Node 2: Analyze for misconceptions
    this.graph.addNode('analyze_misconception', this.analyzeMisconception.bind(this));
    
    // Node 3: Analyze emotional state (parallel with misconception)
    this.graph.addNode('analyze_emotional', this.analyzeEmotional.bind(this));
    
    // Node 4: Format context for Main Agent
    this.graph.addNode('format_context', this.formatContext.bind(this));
    
    // Define edges (flow)
    // @ts-ignore - LangGraph types are strict, but this works at runtime
    this.graph.addEdge('__start__' as any, 'process_transcription' as any);
    // @ts-ignore - Both analyses run in sequence (could be parallel but keep simple for now)
    this.graph.addEdge('process_transcription' as any, 'analyze_misconception' as any);
    // @ts-ignore
    this.graph.addEdge('analyze_misconception' as any, 'analyze_emotional' as any);
    // @ts-ignore
    this.graph.addEdge('analyze_emotional' as any, 'format_context' as any);
    // @ts-ignore
    this.graph.addEdge('format_context' as any, '__end__' as any);
  }

  /**
   * Node: Process incoming transcription
   */
  private async processTranscription(state: AgentStateType): Promise<Partial<AgentStateType>> {
    logger.info('[MultiAgentGraph] Processing transcription', {
      turn: state.turnNumber,
      isFinal: state.isFinal,
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

    return {
      transcriptionHistory: history,
      timestamp: Date.now(),
    };
  }

  /**
   * Node: Analyze for misconceptions using sub-agent
   */
  private async analyzeMisconception(state: AgentStateType): Promise<Partial<AgentStateType>> {
    // Only analyze final transcriptions
    if (!state.isFinal) {
      logger.info('[MultiAgentGraph] Skipping misconception analysis (not final)');
      return {};
    }

    if (!state.lesson) {
      logger.warn('[MultiAgentGraph] No lesson context, skipping misconception analysis');
      return {};
    }

    logger.info('[MultiAgentGraph] Analyzing misconception');

    try {
      // Extract known misconceptions from lesson
      const scaffolding = (state.lesson as any).scaffolding;
      const knownMisconceptions = scaffolding?.commonMisconceptions || [];

      // Call misconception classifier
      const result = await this.misconceptionClassifier.analyze({
        transcription: state.transcription,
        lesson: state.lesson,
        knownMisconceptions,
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
      logger.error('[MultiAgentGraph] Misconception analysis failed', { error });
      
      // Return safe fallback
      return {
        misconception: { detected: false },
      };
    }
  }

  /**
   * Node: Analyze emotional state
   */
  private async analyzeEmotional(state: AgentStateType): Promise<Partial<AgentStateType>> {
    logger.info('[MultiAgentGraph] Analyzing emotional state');

    try {
      const result = await this.emotionalClassifier.analyze(
        state.transcription,
        state.transcriptionHistory
      );

      logger.info('[MultiAgentGraph] Emotional analysis complete', {
        state: result.state,
        engagement: result.engagementLevel,
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
      logger.error('[MultiAgentGraph] Emotional analysis failed', { error });
      
      // Return neutral fallback
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
