import React, { useState } from 'react';
import styles from './HomeScreen.module.css';
import Button from '../Button';
import Select from '../Select';

/**
 * HomeScreen Component
 *
 * Landing page displayed on initial load and when returning home mid-game.
 * Features Quick Play with mode selector, Campaign mode, and quick access to rules/stats.
 *
 * @param {string} selectedMode - Currently selected game mode for Quick Play
 * @param {function} onModeChange - Mode change handler
 * @param {Array} modeOptions - Available game modes [{value, label}]
 * @param {function} onNewGame - Start new Quick Play game handler (may forfeit current game)
 * @param {function} onContinue - Continue paused game handler
 * @param {boolean} hasGameInProgress - Whether there's a paused game to continue
 * @param {function} onShowRules - Show rules modal handler
 * @param {function} onShowStats - Show stats modal handler
 * @param {function} onShowCampaign - Show campaign screen handler
 * @param {object} campaignProgress - Campaign progress for displaying next level
 */
const HomeScreen = ({
  selectedMode,
  onModeChange,
  modeOptions = [],
  onNewGame,
  onContinue,
  hasGameInProgress = false,
  onShowRules,
  onShowStats,
  onShowCampaign,
  campaignProgress,
}) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleAction = (action) => {
    setIsExiting(true);
    // Delay actual navigation to allow fade-out animation
    setTimeout(() => {
      action();
    }, 250);
  };

  // Get next campaign level info
  const getNextLevelText = () => {
    if (!campaignProgress) return null;
    if (campaignProgress.campaignComplete) return 'Complete!';
    return `Level ${campaignProgress.highestUnlocked}`;
  };

  const getCampaignProgressText = () => {
    if (!campaignProgress) return null;
    const completed = Object.values(campaignProgress.levels || {}).filter(l => l?.completed).length;
    return `${completed}/30`;
  };

  return (
    <div className={`${styles.homeScreen} ${isExiting ? styles.fadeOut : styles.fadeIn}`}>
      {/* Background decoration */}
      <div className={styles.backgroundDecor}>
        <div className={styles.cardDecor}></div>
        <div className={styles.cardDecor}></div>
        <div className={styles.cardDecor}></div>
        <div className={styles.cardDecor}></div>
      </div>

      {/* Main content */}
      <div className={styles.content}>
        {/* Title */}
        <div className={styles.titleArea}>
          <h1 className={styles.title}>MERIDIAN</h1>
          <p className={styles.subtitle}>Master Solitaire</p>
        </div>

        {/* Continue Game button - shown when game is paused */}
        {hasGameInProgress && (
          <Button
            variant="primary"
            size="lg"
            onClick={() => handleAction(onContinue)}
            className={styles.playButton}
          >
            Continue Game
          </Button>
        )}

        {/* Main play options - Quick Play and Campaign */}
        <div className={styles.playOptions}>
          {/* Quick Play Section */}
          <div className={styles.playOption}>
            <div className={styles.optionHeader}>
              <span className={styles.optionTitle}>Quick Play</span>
              {!hasGameInProgress && (
                <span className={styles.optionDescription}>Random game in selected mode</span>
              )}
            </div>

            {/* Mode selector - only show when no game in progress */}
            {!hasGameInProgress && (
              <Select
                variant="primary"
                options={modeOptions}
                value={selectedMode}
                onChange={(e) => onModeChange(e.target.value)}
                className={styles.modeSelect}
              />
            )}

            <Button
              variant={hasGameInProgress ? 'ghost' : 'secondary'}
              size={hasGameInProgress ? 'sm' : 'md'}
              onClick={() => handleAction(onNewGame)}
              className={styles.optionButton}
            >
              {hasGameInProgress ? 'New Game (forfeit current)' : 'Play'}
            </Button>
          </div>

          {/* Campaign Section */}
          <div className={styles.playOption}>
            <div className={styles.optionHeader}>
              <span className={styles.optionTitle}>Campaign</span>
              <span className={styles.optionDescription}>
                {campaignProgress?.campaignComplete
                  ? 'All 30 levels complete!'
                  : '30 progressive levels'
                }
              </span>
            </div>

            {campaignProgress && (
              <div className={styles.campaignInfo}>
                <div className={styles.campaignStat}>
                  <span className={styles.statLabel}>Progress</span>
                  <span className={styles.statValue}>{getCampaignProgressText()}</span>
                </div>
                <div className={styles.campaignStat}>
                  <span className={styles.statLabel}>Next</span>
                  <span className={styles.statValue}>{getNextLevelText()}</span>
                </div>
              </div>
            )}

            <Button
              variant="accent"
              size="md"
              onClick={onShowCampaign}
              className={styles.optionButton}
            >
              {campaignProgress?.campaignComplete ? 'View Levels' : 'Play Campaign'}
            </Button>
          </div>
        </div>

        {/* Secondary actions */}
        <div className={styles.secondaryActions}>
          <Button
            variant="ghost"
            onClick={onShowRules}
            className={styles.secondaryButton}
          >
            How to Play
          </Button>
          <Button
            variant="ghost"
            onClick={onShowStats}
            className={styles.secondaryButton}
          >
            Statistics
          </Button>
        </div>
      </div>

      {/* Version info */}
      <div className={styles.versionInfo}>
        v1.3.0
      </div>
    </div>
  );
};

export default HomeScreen;
