import React from 'react';
import styles from './GameStats.module.css';

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
