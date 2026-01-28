import React from 'react';
import styles from './LevelCard.module.css';

const LevelCard = ({
  level,
  isUnlocked,
  isCompleted,
  isCurrent,
  stats,
  onClick,
  formatTime,
}) => {
  const handleClick = () => {
    if (isUnlocked && onClick) {
      onClick(level);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && isUnlocked) {
      e.preventDefault();
      handleClick();
    }
  };

  const cardClasses = [
    styles.levelCard,
    isCompleted && styles.completed,
    isUnlocked && !isCompleted && styles.unlocked,
    !isUnlocked && styles.locked,
    isCurrent && styles.current,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isUnlocked ? 0 : -1}
      role="button"
      aria-label={`Level ${level.levelNumber}${isCompleted ? ', completed' : isUnlocked ? ', unlocked' : ', locked'}`}
      aria-disabled={!isUnlocked}
    >
      <div className={styles.levelNumber}>{level.levelNumber}</div>

      {isCompleted && (
        <div className={styles.checkmark}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}

      {!isUnlocked && (
        <div className={styles.lockIcon}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
          </svg>
        </div>
      )}

      {isCompleted && stats && (
        <div className={styles.stats}>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Best</span>
            <span className={styles.statValue}>{stats.bestMoves} moves</span>
          </div>
          {stats.bestTime && formatTime && (
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Time</span>
              <span className={styles.statValue}>{formatTime(stats.bestTime)}</span>
            </div>
          )}
        </div>
      )}

      {isCurrent && !isCompleted && (
        <div className={styles.playIndicator}>PLAY</div>
      )}
    </div>
  );
};

export default LevelCard;
