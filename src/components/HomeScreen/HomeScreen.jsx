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
 * Landing page - no header, version inside content area
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
    setTimeout(() => action(), 250);
  };

  const campaignStats = campaignProgress ? {
    completed: Object.values(campaignProgress.levels || {}).filter(l => l?.completed).length,
    total: 30
  } : { completed: 0, total: 30 };

  const secondaryNavItems = [
    { label: 'How to Play', onClick: onShowRules },
    { label: 'Statistics', onClick: onShowStats },
    { label: 'Campaign', onClick: onShowCampaign },
  ];

  return (
    <div className={`${styles.screen} ${isExiting ? styles.fadeOut : styles.fadeIn}`}>
      <div className={styles.content}>
        {/* Title */}
        <div className={styles.titleArea}>
          <h1 className={styles.mainTitle}>MERIDIAN</h1>
          <p className={styles.subtitle}>Master Solitaire</p>
        </div>

        {/* Continue Button */}
        {hasGameInProgress && (
          <PrimaryButton onClick={() => handleAction(onContinue)}>
            Continue Game
          </PrimaryButton>
        )}

        {/* Cards */}
        <div className={styles.cards}>
          <ActionCard title="Quick Play" description="Random deal in selected mode">
            {!hasGameInProgress && (
              <Select
                variant="primary"
                options={modeOptions}
                value={selectedMode}
                onChange={(e) => onModeChange(e.target.value)}
                className={styles.select}
              />
            )}
            <SecondaryButton onClick={() => handleAction(onNewGame)}>
              {hasGameInProgress ? 'New Game (forfeit)' : 'Play Now'}
            </SecondaryButton>
          </ActionCard>

          <ActionCard 
            title="Campaign" 
            description={campaignProgress?.campaignComplete ? 'All 30 levels complete!' : '30 progressive levels'}
          >
            {campaignProgress && (
              <ProgressBar
                current={campaignStats.completed}
                total={campaignStats.total}
                showPercentage={false}
                label=""
              />
            )}
            <SecondaryButton onClick={onShowCampaign}>
              {campaignProgress?.campaignComplete ? 'View Levels' : 'Continue Campaign'}
            </SecondaryButton>
          </ActionCard>
        </div>

        {/* Nav Links */}
        <TextLinkGroup items={secondaryNavItems} />

        {/* Version - inside content area */}
        <div className={styles.version}>v2.3.0</div>
      </div>
    </div>
  );
};

export default HomeScreen;
