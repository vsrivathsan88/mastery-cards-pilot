/**
 * Error Recovery Component
 *
 * Provides robust error handling and recovery options
 */

import React, { useState, useEffect } from 'react';
import './ErrorRecovery.css';

export interface ErrorInfo {
  type: 'connection' | 'evaluation' | 'audio' | 'network' | 'unknown';
  message: string;
  details?: string;
  canRetry: boolean;
  timestamp: number;
}

interface ErrorRecoveryProps {
  error: ErrorInfo;
  onRetry?: () => void;
  onDismiss?: () => void;
  onReportIssue?: () => void;
}

export const ErrorRecovery: React.FC<ErrorRecoveryProps> = ({
  error,
  onRetry,
  onDismiss,
  onReportIssue,
}) => {
  const [retrying, setRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Get error icon based on type
  const getErrorIcon = () => {
    switch (error.type) {
      case 'connection':
        return '🔌';
      case 'evaluation':
        return '🧠';
      case 'audio':
        return '🎤';
      case 'network':
        return '📡';
      default:
        return '⚠️';
    }
  };

  // Get recovery suggestion based on error type
  const getRecoverySuggestion = () => {
    switch (error.type) {
      case 'connection':
        return 'Check your internet connection and try again';
      case 'evaluation':
        return 'The evaluation service is temporarily unavailable';
      case 'audio':
        return 'Check your microphone permissions and refresh the page';
      case 'network':
        return 'Network error - please check your connection';
      default:
        return 'An unexpected error occurred';
    }
  };

  // Handle retry with exponential backoff
  const handleRetry = async () => {
    if (retryCount >= MAX_RETRIES) {
      console.log('[ErrorRecovery] Max retries reached');
      return;
    }

    setRetrying(true);
    setRetryCount(prev => prev + 1);

    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
    console.log(`[ErrorRecovery] Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);

    await new Promise(resolve => setTimeout(resolve, delay));

    if (onRetry) {
      onRetry();
    }

    setRetrying(false);
  };

  // Auto-retry for certain error types
  useEffect(() => {
    if (error.canRetry && retryCount === 0 && error.type === 'network') {
      console.log('[ErrorRecovery] Auto-retrying network error...');
      handleRetry();
    }
  }, [error]);

  return (
    <div className="error-recovery">
      <div className="error-recovery-card">
        <div className="error-icon">{getErrorIcon()}</div>

        <h3 className="error-title">
          {error.type === 'connection' && 'Connection Issue'}
          {error.type === 'evaluation' && 'Evaluation Error'}
          {error.type === 'audio' && 'Audio Problem'}
          {error.type === 'network' && 'Network Error'}
          {error.type === 'unknown' && 'Something went wrong'}
        </h3>

        <p className="error-message">{error.message}</p>

        {error.details && (
          <details className="error-details">
            <summary>Technical details</summary>
            <pre>{error.details}</pre>
          </details>
        )}

        <p className="error-suggestion">{getRecoverySuggestion()}</p>

        <div className="error-actions">
          {error.canRetry && retryCount < MAX_RETRIES && (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="error-button error-button-primary"
            >
              {retrying ? 'Retrying...' : `Retry (${MAX_RETRIES - retryCount} left)`}
            </button>
          )}

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="error-button error-button-secondary"
            >
              Dismiss
            </button>
          )}

          {onReportIssue && (
            <button
              onClick={onReportIssue}
              className="error-button error-button-link"
            >
              Report Issue
            </button>
          )}
        </div>

        {retrying && (
          <div className="error-progress">
            <div className="error-progress-bar" />
          </div>
        )}
      </div>
    </div>
  );
};

// Error boundary for catching React errors
export class AppErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error, errorInfo: React.ErrorInfo) => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external service if needed
    if (window.location.hostname !== 'localhost') {
      // Send error to logging service
      console.log('[ErrorBoundary] Would send to logging service:', {
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-fallback">
          <h1>Oops! Something went wrong</h1>
          <p>We're sorry, but something unexpected happened.</p>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '20px' }}>
            <summary>Error details</summary>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.error?.stack}
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}