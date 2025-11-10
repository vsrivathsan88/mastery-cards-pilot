/**
 * Debug Panel Component
 * Shows transcript, tool calls, and session data for eval testing
 */

import { useState } from 'react';
import './DebugPanel.css';

export interface DebugMessage {
  timestamp: number;
  type: 'user' | 'assistant' | 'tool_call' | 'system';
  content: string;
  toolName?: string;
  toolArgs?: any;
}

interface DebugPanelProps {
  messages: DebugMessage[];
  onClear?: () => void;
}

export function DebugPanel({ messages, onClear }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'transcript' | 'tools' | 'session'>('transcript');

  const toolCalls = messages.filter(m => m.type === 'tool_call');
  const transcript = messages.filter(m => m.type === 'user' || m.type === 'assistant');

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const time = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    const ms = String(date.getMilliseconds()).padStart(3, '0');
    return `${time}.${ms}`;
  };

  const exportLogs = () => {
    const data = {
      exportTime: new Date().toISOString(),
      messages,
      toolCalls: toolCalls.length,
      transcriptLength: transcript.length,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mastery-cards-debug-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) {
    return (
      <button 
        className="debug-toggle-button"
        onClick={() => setIsOpen(true)}
        title="Open Debug Panel"
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <div className="debug-panel">
      <div className="debug-panel-header">
        <div className="debug-panel-title">
          <span className="debug-icon">🐛</span>
          <span>Debug Panel</span>
          <span className="debug-count">{messages.length} events</span>
        </div>
        <div className="debug-panel-actions">
          <button className="debug-button" onClick={exportLogs} title="Export logs">
            💾 Export
          </button>
          <button className="debug-button" onClick={onClear} title="Clear logs">
            🗑️ Clear
          </button>
          <button className="debug-button" onClick={() => setIsOpen(false)} title="Close panel">
            ✕
          </button>
        </div>
      </div>

      <div className="debug-tabs">
        <button
          className={`debug-tab ${activeTab === 'transcript' ? 'active' : ''}`}
          onClick={() => setActiveTab('transcript')}
        >
          💬 Transcript ({transcript.length})
        </button>
        <button
          className={`debug-tab ${activeTab === 'tools' ? 'active' : ''}`}
          onClick={() => setActiveTab('tools')}
        >
          🔧 Tool Calls ({toolCalls.length})
        </button>
        <button
          className={`debug-tab ${activeTab === 'session' ? 'active' : ''}`}
          onClick={() => setActiveTab('session')}
        >
          📊 Session
        </button>
      </div>

      <div className="debug-content">
        {activeTab === 'transcript' && (
          <div className="debug-transcript">
            {transcript.length === 0 ? (
              <div className="debug-empty">No messages yet. Start a voice session!</div>
            ) : (
              transcript.map((msg, idx) => (
                <div key={idx} className={`debug-message ${msg.type}`}>
                  <div className="debug-message-header">
                    <span className="debug-message-role">
                      {msg.type === 'user' ? '👤 Student' : '🤖 Pi'}
                    </span>
                    <span className="debug-message-time">{formatTime(msg.timestamp)}</span>
                  </div>
                  <div className="debug-message-content">{msg.content}</div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="debug-tools">
            {toolCalls.length === 0 ? (
              <div className="debug-empty">No tool calls yet. Pi will call tools after assessment.</div>
            ) : (
              toolCalls.map((call, idx) => (
                <div key={idx} className="debug-tool-call">
                  <div className="debug-tool-header">
                    <span className="debug-tool-name">
                      {call.toolName === 'swipe_right' ? '✅' : '📝'} {call.toolName}
                    </span>
                    <span className="debug-tool-time">{formatTime(call.timestamp)}</span>
                  </div>
                  <div className="debug-tool-args">
                    <pre>{JSON.stringify(call.toolArgs, null, 2)}</pre>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'session' && (
          <div className="debug-session">
            <div className="debug-session-stats">
              <div className="debug-stat">
                <div className="debug-stat-label">Total Messages</div>
                <div className="debug-stat-value">{messages.length}</div>
              </div>
              <div className="debug-stat">
                <div className="debug-stat-label">Tool Calls</div>
                <div className="debug-stat-value">{toolCalls.length}</div>
              </div>
              <div className="debug-stat">
                <div className="debug-stat-label">User Messages</div>
                <div className="debug-stat-value">{transcript.filter(m => m.type === 'user').length}</div>
              </div>
              <div className="debug-stat">
                <div className="debug-stat-label">Pi Messages</div>
                <div className="debug-stat-value">{transcript.filter(m => m.type === 'assistant').length}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
