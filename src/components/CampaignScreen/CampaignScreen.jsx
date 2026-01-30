import React, { useState } from 'react';
import LevelCard from '../LevelCard';
import FullBleedScreen from '../FullBleedScreen';
import BackButton from '../BackButton';
import { CAMPAIGN_LEVELS } from '../../hooks/useCampaignProgress';
import styles from './CampaignScreen.module.css';
import { Trophy, Star } from '../Icon';

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

  const tierLevels = {
    easy: CAMPAIGN_LEVELS.filter(l => l.tier === 'easy'),
    moderate: CAMPAIGN_LEVELS.filter(l => l.tier === 'moderate'),
    hard: CAMPAIGN_LEVELS.filter(l => l.tier === 'hard'),
  };

  const tierConfig = [
    { key: 'easy', name: 'Bronze', Icon: Star, color: '#CD7F32' },
    { key: 'moderate', name: 'Silver', Icon: Star, color: '#C0C0C0' },
    { key: 'hard', name: 'Gold', Icon: Star, color: '#FFD700' },
  ];

  return (
    <FullBleedScreen isOpen={true}>
      <div className={styles.screen}>
        <BackButton onClick={onBack} />
        
        <div className={styles.header}>
          <h1 className={styles.title}>Campaign</h1>
          <div className={styles.progress}>
            {campaignProgress.completed}/{campaignProgress.total}
          </div>
        </div>

        {progress.campaignComplete && (
          <div className={styles.completeBanner}>
            <span><Trophy size={24} /></span>
            <span>Campaign Complete!</span>
          </div>
        )}

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
                <span className={styles.tierIcon}><tier.Icon size={16} /></span>
                <span className={styles.tierProgress}>
                  {tierProgress.completed}/{tierProgress.total}
                </span>
              </button>
            );
          })}
        </div>

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
    </FullBleedScreen>
  );
};

export default CampaignScreen;
