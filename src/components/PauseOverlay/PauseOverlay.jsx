import React, { useEffect, useCallback } from 'react';
import styles from './PauseOverlay.module.css';
import DataCard from '../DataCard';
import PrimaryButton from '../PrimaryButton';
import SecondaryButton from '../SecondaryButton';
import ProgressBar from '../ProgressBar';

/**
 * PauseOverlay Component (Redesigned)
 *
 * Semi-transparent overlay shown when game is paused.
 * Displays in-game stats and provides Resume/Home/New Game options.
 * Uses unified component library.
 *
 * @param {boolean} isOpen - Whether overlay is visible
 * @param {function} onResume - Resume game handler
 * @param {function} onHome - Return to home handler
 * @param {function} onNewGame - New game handler
 * @param {function} onRestartLevel - Restart level handler (campaign)
 * @param {boolean} isCampaignGame - Whether in campaign mode
 * @param {number} campaignLevelNumber - Current campaign level
 * @param {object} gameStats - Current game statistics
 */
const PauseOverlay = ({
  isOpen,
  onResume,
  onHome,
  onNewGame,
  onRestartLevel,
  isCampaignGame = false,
  campaignLevelNumber = null,
  gameStats = {},
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
  const placedCards = upCount + downCount;

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

        {/* Game Stats */}
        <div className={styles.statsGrid}>
          <DataCard value={formatModeName(mode)} label="Mode" />
          <DataCard value={moves} label="Moves" />
          <DataCard value={formatTime(elapsedTime)} label="Time" />
          <DataCard value={placedCards} label="Cards Placed" />
        </div>

        {/* Progress Bar */}
        <div className={styles.progressSection}>
          <ProgressBar
            current={placedCards}
            total={totalCards}
            showPercentage={true}
          />
        </div>

        {/* Action Buttons */}
        <div className={styles.buttons}>
          <PrimaryButton onClick={onResume}>
            Resume
          </PrimaryButton>
          
          {isCampaignGame ? (
            <>
              <SecondaryButton onClick={onRestartLevel}>
                Restart Level {campaignLevelNumber}
              </SecondaryButton>
              <SecondaryButton onClick={onHome}>
                Back to Campaign
              </SecondaryButton>
            </>
          ) : (
            <>
              <SecondaryButton onClick={onHome}>
                Home
              </SecondaryButton>
              <SecondaryButton onClick={onNewGame}>
                New Game
              </SecondaryButton>
            </>
          )}
        </div>

        <p className={styles.hint}>Press ESC or click outside to resume</p>
      </div>
    </div>
  );
};

export default PauseOverlay;
