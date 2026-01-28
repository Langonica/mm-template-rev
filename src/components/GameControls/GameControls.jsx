import { Undo2, Redo2, Pause } from 'lucide-react';
import styles from './GameControls.module.css';

/**
 * GameControls Component
 *
 * Renders a compact row of game control buttons for undo, redo, and pause actions.
 * Buttons are icon-only with disabled states for better UX.
 */
const GameControls = ({ canUndo, canRedo, onUndo, onRedo, onPause }) => {
  return (
    <div className={styles.controls}>
      <button
        className={styles.button}
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo"
        title="Undo"
      >
        <Undo2 size={18} />
      </button>
      <button
        className={styles.button}
        onClick={onRedo}
        disabled={!canRedo}
        aria-label="Redo"
        title="Redo"
      >
        <Redo2 size={18} />
      </button>
      <button
        className={styles.button}
        onClick={onPause}
        aria-label="Pause"
        title="Pause"
      >
        <Pause size={18} />
      </button>
    </div>
  );
};

export default GameControls;
