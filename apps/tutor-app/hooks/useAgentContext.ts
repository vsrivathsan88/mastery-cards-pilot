/**
 * useAgentContext - React hook for agent orchestration
 * 
 * Provides easy access to agent insights and context management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { SessionContext } from '@simili/agents';
import { AgentService, AgentInsights } from '../services/AgentService';
import { FillerService } from '../services/FillerService';
import { PromptBuilder } from '../services/PromptBuilder';
import { LessonData } from '@simili/shared';

interface UseAgentContextReturn {
  // Services
  agentService: AgentService;
  fillerService: FillerService;
  
  // State
  currentContext: SessionContext | null;
  isAnalyzing: boolean;
  lastInsights: AgentInsights | null;
  systemPrompt: string;
  
  // Actions
  analyzeTranscription: (text: string) => Promise<AgentInsights>;
  analyzeVision: (canvasSnapshot: string, imageUrl?: string) => Promise<void>;
  checkPrerequisite: (text: string, prerequisiteId: string, isWonderHook?: boolean) => Promise<any>;
  initializeLesson: (lesson: LessonData) => Promise<void>;
  getShouldUseFiller: () => boolean;
  getFiller: () => string | null;
  
  // Debug
  agentStats: {
    totalAnalyses: number;
    avgProcessingTime: number;
    fillersUsed: number;
  };
}

export function useAgentContext(): UseAgentContextReturn {
  // Services (created once)
  const agentServiceRef = useRef<AgentService | null>(null);
  const fillerServiceRef = useRef<FillerService | null>(null);
  
  // Initialize services once
  if (!agentServiceRef.current) {
    agentServiceRef.current = new AgentService();
  }
  if (!fillerServiceRef.current) {
    fillerServiceRef.current = new FillerService();
  }
  
  const agentService = agentServiceRef.current;
  const fillerService = fillerServiceRef.current;

  // State
  const [currentContext, setCurrentContext] = useState<SessionContext | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastInsights, setLastInsights] = useState<AgentInsights | null>(null);
  const [systemPrompt, setSystemPrompt] = useState<string>(PromptBuilder.getBasePrompt());
  
  // Stats tracking
  const [agentStats, setAgentStats] = useState({
    totalAnalyses: 0,
    avgProcessingTime: 0,
    fillersUsed: 0,
  });

  // Listen to agent events
  useEffect(() => {
    const handleContextUpdate = (context: SessionContext) => {
      setCurrentContext(context);
      
      // Rebuild system prompt with new context
      const newPrompt = PromptBuilder.buildSystemPrompt(context);
      setSystemPrompt(newPrompt);
    };

    const handleInsightsReady = (insights: AgentInsights) => {
      setLastInsights(insights);
      
      // Update stats
      setAgentStats(prev => ({
        totalAnalyses: prev.totalAnalyses + 1,
        avgProcessingTime: 
          (prev.avgProcessingTime * prev.totalAnalyses + insights.processingTime) / 
          (prev.totalAnalyses + 1),
        fillersUsed: prev.fillersUsed,
      }));
    };

    const handleAgentsStarted = () => {
      setIsAnalyzing(true);
    };

    const handleAgentsCompleted = () => {
      setIsAnalyzing(false);
    };

    const handleAgentError = (agentName: string, error: Error) => {
      console.error(`[useAgentContext] Agent ${agentName} error:`, error);
    };

    // Subscribe to events
    agentService.on('context_updated', handleContextUpdate);
    agentService.on('insights_ready', handleInsightsReady);
    agentService.on('agents_started', handleAgentsStarted);
    agentService.on('agents_completed', handleAgentsCompleted);
    agentService.on('agent_error', handleAgentError);

    // Cleanup
    return () => {
      agentService.off('context_updated', handleContextUpdate);
      agentService.off('insights_ready', handleInsightsReady);
      agentService.off('agents_started', handleAgentsStarted);
      agentService.off('agents_completed', handleAgentsCompleted);
      agentService.off('agent_error', handleAgentError);
    };
  }, [agentService]);

  // Initialize lesson
  const initializeLesson = useCallback(async (lesson: LessonData) => {
    await agentService.initialize(lesson);
    fillerService.reset();
    
    // Reset stats
    setAgentStats({
      totalAnalyses: 0,
      avgProcessingTime: 0,
      fillersUsed: 0,
    });
  }, [agentService, fillerService]);

  // Analyze transcription
  const analyzeTranscription = useCallback(async (text: string): Promise<AgentInsights> => {
    return await agentService.analyzeTranscription(text);
  }, [agentService]);

  // Analyze vision
  const analyzeVision = useCallback(async (
    canvasSnapshot: string,
    imageUrl?: string
  ) => {
    await agentService.analyzeVision(canvasSnapshot, imageUrl);
  }, [agentService]);

  // Check prerequisite (only call during wonder hooks or early lesson)
  const checkPrerequisite = useCallback(async (
    text: string,
    prerequisiteId: string,
    isWonderHook: boolean = false
  ) => {
    return await agentService.checkPrerequisite(text, prerequisiteId, isWonderHook);
  }, [agentService]);

  // Check if should use filler
  const getShouldUseFiller = useCallback((): boolean => {
    const lastDuration = agentService.getLastAnalysisDuration();
    const emotional = currentContext?.emotional;
    
    return fillerService.shouldUseFiller(lastDuration || 500, emotional);
  }, [agentService, fillerService, currentContext]);

  // Get filler
  const getFiller = useCallback((): string | null => {
    const emotional = currentContext?.emotional;
    const turnNumber = currentContext?.turnNumber || 0;
    
    const filler = fillerService.getFiller(emotional, turnNumber);
    
    if (filler) {
      setAgentStats(prev => ({
        ...prev,
        fillersUsed: prev.fillersUsed + 1,
      }));
    }
    
    return filler;
  }, [fillerService, currentContext]);

  return {
    agentService,
    fillerService,
    currentContext,
    isAnalyzing,
    lastInsights,
    systemPrompt,
    analyzeTranscription,
    analyzeVision,
    checkPrerequisite,
    initializeLesson,
    getShouldUseFiller,
    getFiller,
    agentStats,
  };
}
