import React from 'react';
import styles from './AutoCompleteButton.module.css';

/**
 * AutoCompleteButton Component
 * 
 * Appears when the game is trivially winnable (all cards face-up,
 * no blocked sequences, stock/waste/pockets empty). Clicking executes
 * automatic foundation moves to complete the game.
 * 
 * @param {boolean} visible - Whether to show the button
 * @param {boolean} isExecuting - Whether auto-complete is in progress
 * @param {function} onExecute - Callback to start auto-complete
 * @param {function} onCancel - Callback to cancel auto-complete
 */
const AutoCompleteButton = ({ 
  visible = false, 
  isExecuting = false,
  onExecute,
  onCancel
}) => {
  if (!visible && !isExecuting) return null;
  
  const handleClick = () => {
    if (isExecuting) {
      onCancel?.();
    } else {
      onExecute?.();
    }
  };
  
  return (
    <button
      className={`${styles.button} ${isExecuting ? styles.executing : ''}`}
      onClick={handleClick}
      disabled={!visible && !isExecuting}
      title={isExecuting ? 'Click to cancel auto-complete' : 'Play all cards to foundations'}
    >
      {isExecuting ? (
        <>
          <span className={styles.spinner}></span>
          <span>Auto-Playing...</span>
        </>
      ) : (
        <>
          <span className={styles.icon}></span>
          <span>Auto-Complete</span>
        </>
      )}
    </button>
  );
};

export default AutoCompleteButton;
