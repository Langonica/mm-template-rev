import React, { useState } from 'react';
import styles from './HomeScreen.module.css';
import PrimaryButton from '../PrimaryButton';
import SecondaryButton from '../SecondaryButton';
import ActionCard from '../ActionCard';
import ProgressBar from '../ProgressBar';
import TextLinkGroup from '../TextLinkGroup';
import Select from '../Select';

/**
 * HomeScreen Component
 *
 * Redesigned landing page with unified component library.
 * Features single-column layout, ActionCards, and consistent styling.
 *
 * @param {string} selectedMode - Currently selected game mode for Quick Play
 * @param {function} onModeChange - Mode change handler
 * @param {Array} modeOptions - Available game modes [{value, label}]
 * @param {function} onNewGame - Start new Quick Play game handler
 * @param {function} onContinue - Continue paused game handler
 * @param {boolean} hasGameInProgress - Whether there's a paused game to continue
 * @param {function} onShowRules - Show rules screen handler
 * @param {function} onShowStats - Show statistics screen handler
 * @param {function} onShowCampaign - Show campaign screen handler
 * @param {object} campaignProgress - Campaign progress data
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
    setTimeout(() => {
      action();
    }, 250);
  };

  // Calculate campaign stats
  const getCampaignStats = () => {
    if (!campaignProgress) return { completed: 0, total: 30 };
    const completed = Object.values(campaignProgress.levels || {})
      .filter(l => l?.completed).length;
    return { completed, total: 30 };
  };

  const campaignStats = getCampaignStats();

  // Secondary navigation items
  const secondaryNavItems = [
    { label: 'How to Play', onClick: onShowRules },
    { label: 'Statistics', onClick: onShowStats },
    { label: 'Campaign', onClick: onShowCampaign },
  ];

  return (
    <div className={`${styles.homeScreen} ${isExiting ? styles.fadeOut : styles.fadeIn}`}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          {/* Empty for home screen - no back button */}
        </div>
        <h1 className={styles.headerTitle}>Meridian Solitaire</h1>
        <div className={styles.headerRight}>
          {/* Settings/menu can go here */}
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.content}>
        {/* Title Area */}
        <div className={styles.titleArea}>
          <h2 className={styles.title}>MERIDIAN</h2>
          <p className={styles.subtitle}>Master Solitaire</p>
        </div>

        {/* Continue Game - Full width when active */}
        {hasGameInProgress && (
          <div className={styles.continueSection}>
            <PrimaryButton onClick={() => handleAction(onContinue)}>
              Continue Game
            </PrimaryButton>
          </div>
        )}

        {/* Quick Play ActionCard */}
        <ActionCard
          title="Quick Play"
          description="Random deal in selected mode"
          className={styles.actionCard}
        >
          <div className={styles.quickPlayActions}>
            {!hasGameInProgress && (
              <Select
                variant="primary"
                options={modeOptions}
                value={selectedMode}
                onChange={(e) => onModeChange(e.target.value)}
                className={styles.modeSelect}
              />
            )}
            <SecondaryButton onClick={() => handleAction(onNewGame)}>
              {hasGameInProgress ? 'New Game (forfeit)' : 'Play Now'}
            </SecondaryButton>
          </div>
        </ActionCard>

        {/* Campaign ActionCard */}
        <ActionCard
          title="Campaign"
          description={campaignProgress?.campaignComplete 
            ? 'All 30 levels complete!' 
            : '30 progressive levels'
          }
          className={styles.actionCard}
        >
          {campaignProgress && (
            <div className={styles.campaignProgress}>
              <ProgressBar
                current={campaignStats.completed}
                total={campaignStats.total}
                showPercentage={false}
              />
            </div>
          )}
          <SecondaryButton onClick={onShowCampaign}>
            {campaignProgress?.campaignComplete ? 'View Levels' : 'Continue Campaign'}
          </SecondaryButton>
        </ActionCard>

        {/* Secondary Navigation */}
        <div className={styles.secondaryNav}>
          <TextLinkGroup items={secondaryNavItems} />
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        v2.3.0
      </footer>
    </div>
  );
};

export default HomeScreen;
