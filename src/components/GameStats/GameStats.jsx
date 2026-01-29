import React from 'react';
import styles from './GameStats.module.css';

/**
 * GameStats Component
 * 
 * Displays game statistics: move count and elapsed time.
 * Note: Circular play warnings have been moved to toast/overlay
 * notifications (Phase 5 of Game State Notification System).
 *
 * @param {number} moveCount - Number of moves made
 * @param {number} currentTime - Elapsed time in seconds
 * @param {function} formatTime - Time formatting function
 */
const GameStats = ({ moveCount, currentTime, formatTime }) => {
  return (
    <div className={styles.stats}>
      <span className={styles.stat}>Moves: {moveCount}</span>
      <span className={styles.separator}>|</span>
      <span className={styles.stat}>{formatTime(currentTime)}</span>
    </div>
  );
};

export default GameStats;
