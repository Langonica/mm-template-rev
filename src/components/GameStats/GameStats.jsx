import React from 'react';
import styles from './GameStats.module.css';

const GameStats = ({ moveCount, currentTime, formatTime, circularPlayState }) => {
  const { warningLevel, movesSinceProgress } = circularPlayState || {};
  
  // Determine indicator styles based on warning level
  const getIndicatorClass = () => {
    switch (warningLevel) {
      case 'stalled':
        return `${styles.indicator} ${styles.stalled}`;
      case 'critical':
        return `${styles.indicator} ${styles.critical}`;
      case 'caution':
        return `${styles.indicator} ${styles.caution}`;
      default:
        return styles.indicator;
    }
  };
  
  const getIndicatorText = () => {
    switch (warningLevel) {
      case 'stalled':
        return `⚠️ ${movesSinceProgress} moves - stalled`;
      case 'critical':
        return `⚠️ Circular play detected`;
      case 'caution':
        return `⚡ ${movesSinceProgress} moves`;
      default:
        return null;
    }
  };
  
  const indicatorText = getIndicatorText();
  
  return (
    <div className={styles.stats}>
      <span className={styles.stat}>Moves: {moveCount}</span>
      <span className={styles.separator}>|</span>
      <span className={styles.stat}>{formatTime(currentTime)}</span>
      {indicatorText && (
        <>
          <span className={styles.separator}>|</span>
          <span className={getIndicatorClass()} title="Moves since last foundation card">
            {indicatorText}
          </span>
        </>
      )}
    </div>
  );
};

export default GameStats;
