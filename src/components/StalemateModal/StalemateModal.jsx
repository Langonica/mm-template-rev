import React from 'react';
import styles from './StalemateModal.module.css';
import Button from '../Button';

/**
 * StalemateModal Component
 * 
 * Displayed when the game is in an unwinnable state:
 * - No further moves available
 * - Circular play detected (3+ cycles)
 * - No progress for extended period (20+ moves)
 * 
 * @param {boolean} isOpen - Whether modal is visible
 * @param {object} stats - Game statistics
 * @param {number} stats.moveCount - Total moves made
 * @param {number} stats.currentTime - Time elapsed in seconds
 * @param {number} stats.foundationCards - Cards on foundation
 * @param {number} stats.totalCards - Total cards (52)
 * @param {function} onNewDeal - Handler for new random deal
 * @param {function} onRestart - Handler for restart level
 * @param {function} onUndo - Handler for undo moves
 * @param {number} undoMoves - Number of moves to undo (default 5)
 * @param {function} onClose - Handler to close modal
 */
const StalemateModal = ({
  isOpen,
  stats,
  onNewDeal,
  onRestart,
  onUndo,
  undoMoves = 5,
  onClose
}) => {
  if (!isOpen) return null;

  const { moveCount, currentTime, foundationCards, totalCards = 52 } = stats || {};

  // Format time as MM:SS
  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = Math.round((foundationCards / totalCards) * 100);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.icon}>🏁</span>
          <h2 className={styles.title}>Game Stalled</h2>
        </div>

        {/* Message */}
        <p className={styles.message}>
          No further moves available. The game is in an unwinnable state.
        </p>

        {/* Stats */}
        <div className={styles.stats}>
          <h3 className={styles.statsTitle}>Game Stats</h3>
          
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Moves Made:</span>
            <span className={styles.statValue}>{moveCount || 0}</span>
          </div>
          
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Time Elapsed:</span>
            <span className={styles.statValue}>{formatTime(currentTime)}</span>
          </div>
          
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Foundation Cards:</span>
            <span className={styles.statValue}>
              {foundationCards || 0} / {totalCards}
              <span className={styles.percentage}> ({progressPercentage}%)</span>
            </span>
          </div>

          {/* Progress bar */}
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <Button 
            variant="primary" 
            onClick={onNewDeal}
            className={styles.actionButton}
          >
            New Deal
          </Button>
          
          <Button 
            variant="secondary" 
            onClick={onRestart}
            className={styles.actionButton}
          >
            Restart Level
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={onUndo}
            className={styles.actionButton}
          >
            Undo {undoMoves} Moves
          </Button>
        </div>

        {/* Close button */}
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
    </div>
  );
};

export default StalemateModal;
