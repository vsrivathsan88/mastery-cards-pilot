/**
 * CanvasControls - Undo/Redo/Clear buttons for canvas
 * Clean, kid-friendly drawing controls
 */

import './CanvasControls.css';

interface CanvasControlsProps {
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function CanvasControls({ 
  onUndo, 
  onRedo, 
  onClear, 
  canUndo, 
  canRedo 
}: CanvasControlsProps) {
  return (
    <div className="canvas-controls">
      <button
        className="canvas-control-btn"
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
      >
        <span className="btn-icon">↶</span>
        <span className="btn-label">Undo</span>
      </button>

      <button
        className="canvas-control-btn"
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
      >
        <span className="btn-icon">↷</span>
        <span className="btn-label">Redo</span>
      </button>

      <button
        className="canvas-control-btn canvas-control-clear"
        onClick={onClear}
        title="Clear canvas"
      >
        <span className="btn-icon">🗑️</span>
        <span className="btn-label">Clear</span>
      </button>
    </div>
  );
}
