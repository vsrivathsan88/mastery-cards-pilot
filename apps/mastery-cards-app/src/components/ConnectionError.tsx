import './ConnectionError.css';

export interface ConnectionErrorProps {
  title: string;
  message: string;
  suggestion: string;
  canRetry: boolean;
  onRetry: () => void;
}

export function ConnectionError({
  title,
  message,
  suggestion,
  canRetry,
  onRetry
}: ConnectionErrorProps) {
  return (
    <div className="connection-error-overlay">
      <div className="connection-error-box">
        <div className="error-icon">📡</div>
        <h2>{title}</h2>
        <p className="error-message">{message}</p>
        <p className="error-suggestion">{suggestion}</p>

        {canRetry && (
          <button onClick={onRetry} className="retry-button">
            Refresh Page
          </button>
        )}

        <div className="error-details">
          <p>If this keeps happening:</p>
          <ul>
            <li>Check your internet connection</li>
            <li>Make sure you're not using a VPN that might block connections</li>
            <li>Try a different browser</li>
            <li>Contact your teacher or parent for help</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
