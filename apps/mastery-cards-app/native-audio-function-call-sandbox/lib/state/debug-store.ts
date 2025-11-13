/**
 * Debug Store
 * Tracks transcript and tool calls for eval testing
 */

import { create } from 'zustand';
import type { DebugMessage } from '../../components/DebugPanel';

interface DebugState {
  messages: DebugMessage[];
  addMessage: (message: Omit<DebugMessage, 'timestamp'>) => void;
  addToolCall: (toolName: string, toolArgs: any) => void;
  addUserMessage: (content: string) => void;
  addAssistantMessage: (content: string) => void;
  addSystemMessage: (content: string) => void;
  clearMessages: () => void;
}

export const useDebugStore = create<DebugState>((set) => ({
  messages: [],

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, { ...message, timestamp: Date.now() }],
    }));
  },

  addToolCall: (toolName, toolArgs) => {
    set((state) => ({
      messages: [
        ...state.messages,
        {
          timestamp: Date.now(),
          type: 'tool_call',
          content: `${toolName} called`,
          toolName,
          toolArgs,
        },
      ],
    }));
  },

  addUserMessage: (content) => {
    set((state) => ({
      messages: [
        ...state.messages,
        {
          timestamp: Date.now(),
          type: 'user',
          content,
        },
      ],
    }));
  },

  addAssistantMessage: (content) => {
    set((state) => ({
      messages: [
        ...state.messages,
        {
          timestamp: Date.now(),
          type: 'assistant',
          content,
        },
      ],
    }));
  },

  addSystemMessage: (content) => {
    set((state) => ({
      messages: [
        ...state.messages,
        {
          timestamp: Date.now(),
          type: 'system',
          content,
        },
      ],
    }));
  },

  clearMessages: () => {
    set({ messages: [] });
  },
}));
