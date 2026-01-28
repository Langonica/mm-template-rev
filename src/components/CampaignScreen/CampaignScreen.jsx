import React, { useState } from 'react';
import LevelCard from '../LevelCard';
import Button from '../Button';
import { CAMPAIGN_LEVELS, TIERS } from '../../hooks/useCampaignProgress';
import styles from './CampaignScreen.module.css';

const CampaignScreen = ({
  progress,
  isLevelUnlocked,
  isLevelCompleted,
  getLevelStats,
  getTierProgress,
  getCampaignProgress,
  onPlayLevel,
  onBack,
  formatTime,
}) => {
  const [activeTier, setActiveTier] = useState('easy');
  const campaignProgress = getCampaignProgress();

  // Group levels by tier
  const tierLevels = {
    easy: CAMPAIGN_LEVELS.filter(l => l.tier === 'easy'),
    moderate: CAMPAIGN_LEVELS.filter(l => l.tier === 'moderate'),
    hard: CAMPAIGN_LEVELS.filter(l => l.tier === 'hard'),
  };

  const tierConfig = [
    { key: 'easy', name: 'Bronze', icon: '★', color: '#CD7F32' },
    { key: 'moderate', name: 'Silver', icon: '★', color: '#C0C0C0' },
    { key: 'hard', name: 'Gold', icon: '★', color: '#FFD700' },
  ];

  return (
    <div className={styles.campaignScreen}>
      {/* Header */}
      <div className={styles.header}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className={styles.backButton}
        >
          ← Back
        </Button>
        <h1 className={styles.title}>Campaign</h1>
        <div className={styles.campaignProgress}>
          <span className={styles.progressLabel}>Progress:</span>
          <span className={styles.progressValue}>
            {campaignProgress.completed}/{campaignProgress.total}
          </span>
        </div>
      </div>

      {/* Campaign Complete Banner */}
      {progress.campaignComplete && (
        <div className={styles.campaignCompleteBanner}>
          <div className={styles.completeBadge}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z" />
            </svg>
          </div>
          <span className={styles.completeText}>Campaign Complete!</span>
        </div>
      )}

      {/* Tier Tabs */}
      <div className={styles.tierTabs}>
        {tierConfig.map((tier) => {
          const tierProgress = getTierProgress(tier.key);
          const isComplete = progress.tiersCompleted[tier.key];
          const isActive = activeTier === tier.key;

          return (
            <button
              key={tier.key}
              className={`${styles.tierTab} ${isActive ? styles.active : ''} ${isComplete ? styles.complete : ''}`}
              onClick={() => setActiveTier(tier.key)}
              style={{ '--tier-color': tier.color }}
            >
              <span className={styles.tierName}>{tier.name}</span>
              <span className={`${styles.tierIcon} ${isComplete ? styles.filled : ''}`}>
                {tier.icon}
              </span>
              <span className={styles.tierProgress}>
                {tierProgress.completed}/{tierProgress.total}
              </span>
            </button>
          );
        })}
      </div>

      {/* Level Grid */}
      <div className={styles.levelGridContainer}>
        <div className={styles.levelGrid}>
          {tierLevels[activeTier].map(level => (
            <LevelCard
              key={level.id}
              level={level}
              isUnlocked={isLevelUnlocked(level.levelNumber)}
              isCompleted={isLevelCompleted(level.id)}
              isCurrent={level.levelNumber === progress.highestUnlocked && !isLevelCompleted(level.id)}
              stats={getLevelStats(level.id)}
              onClick={onPlayLevel}
              formatTime={formatTime}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CampaignScreen;
