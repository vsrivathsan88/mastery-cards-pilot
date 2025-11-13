import './MicPermissionError.css';

export function MicPermissionError() {
  return (
    <div className="mic-permission-error">
      <div className="error-box">
        <div className="mic-icon">🎤</div>
        <h2>Pi needs to hear you!</h2>
        <p className="error-msg">Your microphone is turned off.</p>

        <div className="instructions">
          <p><strong>How to fix it:</strong></p>
          <ol>
            <li>Look for the <strong>🔒 lock icon</strong> in your browser's address bar (top left)</li>
            <li>Click it and find "Microphone"</li>
            <li>Change it to "Allow"</li>
            <li>Click the button below to try again</li>
          </ol>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="retry-btn"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
