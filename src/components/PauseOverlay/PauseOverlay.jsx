import React, { useEffect, useCallback } from 'react';
import styles from './PauseOverlay.module.css';
import Button from '../Button';

/**
 * PauseOverlay - Semi-transparent overlay shown when game is paused
 * Displays in-game stats and provides Resume/Home/New Game options
 * In campaign mode, shows Restart Level instead of New Game
 */
const PauseOverlay = ({
  isOpen,
  onResume,
  onHome,
  onNewGame,
  onRestartLevel,
  isCampaignGame = false,
  campaignLevelNumber = null,
  gameStats = {}
}) => {
  const { moves = 0, elapsedTime = 0, mode = 'classic', foundationProgress = {} } = gameStats;

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format mode name for display
  const formatModeName = (modeKey) => {
    const modeNames = {
      classic: 'Classic',
      classic_double: 'Classic Double',
      hidden: 'Hidden',
      hidden_double: 'Hidden Double'
    };
    return modeNames[modeKey] || modeKey;
  };

  // Calculate foundation progress
  const upCount = foundationProgress.up || 0;
  const downCount = foundationProgress.down || 0;
  const totalCards = 52;
  const progressPercent = Math.round(((upCount + downCount) / totalCards) * 100);

  // Handle escape key to resume
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && isOpen) {
      onResume();
    }
  }, [isOpen, onResume]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Handle backdrop click to resume
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onResume();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.content}>
        <h2 className={styles.title}>PAUSED</h2>

        <div className={styles.stats}>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Mode</span>
            <span className={styles.statValue}>{formatModeName(mode)}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Moves</span>
            <span className={styles.statValue}>{moves}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Time</span>
            <span className={styles.statValue}>{formatTime(elapsedTime)}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Progress</span>
            <span className={styles.statValue}>{progressPercent}% ({upCount + downCount}/{totalCards})</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className={styles.buttons}>
          <Button variant="primary" size="large" onClick={onResume}>
            Resume
          </Button>
          {isCampaignGame ? (
            <>
              <Button variant="secondary" size="medium" onClick={onRestartLevel}>
                Restart Level {campaignLevelNumber}
              </Button>
              <Button variant="ghost" size="medium" onClick={onHome}>
                Back to Campaign
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" size="medium" onClick={onHome}>
                Home
              </Button>
              <Button variant="ghost" size="medium" onClick={onNewGame}>
                New Game
              </Button>
            </>
          )}
        </div>

        <p className={styles.hint}>Press ESC or click outside to resume</p>
      </div>
    </div>
  );
};

export default PauseOverlay;
