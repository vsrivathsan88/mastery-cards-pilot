import './EvaluationIndicator.css';

export function EvaluationIndicator() {
  return (
    <div className="evaluation-indicator">
      <div className="thinking-dots">
        <span>●</span>
        <span>●</span>
        <span>●</span>
      </div>
      <p>Pi is thinking...</p>
    </div>
  );
}
