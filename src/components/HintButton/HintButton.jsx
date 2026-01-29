import React from 'react';
import styles from './HintButton.module.css';
import { HelpCircle } from '../Icon';

/**
 * HintButton Component
 * 
 * Shows available hints with remaining count. Click to reveal a suggested move.
 * Keyboard shortcut: 'H' key
 * 
 * @param {number} hintsRemaining - Number of hints left (0-3)
 * @param {function} onShowHint - Callback to show a hint
 * @param {boolean} disabled - Whether button is disabled
 */
const HintButton = ({ 
  hintsRemaining = 3, 
  onShowHint,
  disabled = false
}) => {
  const isDisabled = disabled || hintsRemaining <= 0;
  
  return (
    <button
      className={`${styles.button} ${isDisabled ? styles.disabled : ''}`}
      onClick={onShowHint}
      disabled={isDisabled}
      title={hintsRemaining > 0 ? `Show hint (${hintsRemaining} remaining) - Press H` : 'No hints remaining'}
    >
      <span className={styles.icon}><HelpCircle size={20} /></span>
      <span className={styles.text}>Hint</span>
      <span className={styles.badge}>{hintsRemaining}</span>
    </button>
  );
};

export default HintButton;
