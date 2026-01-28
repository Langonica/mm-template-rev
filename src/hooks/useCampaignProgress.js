import { useState, useCallback, useEffect } from 'react';
import { validateCampaignProgress, safeParseAndValidate } from '../utils/storageValidation';

const STORAGE_KEY = 'meridian-campaign-progress';

// Campaign level definitions - 30 levels across 3 tiers
export const CAMPAIGN_LEVELS = [
  // Easy tier (1-10)
  { id: 'classic_normal_easy_01', tier: 'easy', levelNumber: 1, name: 'Level 1' },
  { id: 'classic_normal_easy_02', tier: 'easy', levelNumber: 2, name: 'Level 2' },
  { id: 'classic_normal_easy_03', tier: 'easy', levelNumber: 3, name: 'Level 3' },
  { id: 'classic_normal_easy_04', tier: 'easy', levelNumber: 4, name: 'Level 4' },
  { id: 'classic_normal_easy_05', tier: 'easy', levelNumber: 5, name: 'Level 5' },
  { id: 'classic_normal_easy_06', tier: 'easy', levelNumber: 6, name: 'Level 6' },
  { id: 'classic_normal_easy_07', tier: 'easy', levelNumber: 7, name: 'Level 7' },
  { id: 'classic_normal_easy_08', tier: 'easy', levelNumber: 8, name: 'Level 8' },
  { id: 'classic_normal_easy_09', tier: 'easy', levelNumber: 9, name: 'Level 9' },
  { id: 'classic_normal_easy_10', tier: 'easy', levelNumber: 10, name: 'Level 10' },
  // Moderate tier (11-20)
  { id: 'classic_normal_moderate_01', tier: 'moderate', levelNumber: 11, name: 'Level 11' },
  { id: 'classic_normal_moderate_02', tier: 'moderate', levelNumber: 12, name: 'Level 12' },
  { id: 'classic_normal_moderate_03', tier: 'moderate', levelNumber: 13, name: 'Level 13' },
  { id: 'classic_normal_moderate_04', tier: 'moderate', levelNumber: 14, name: 'Level 14' },
  { id: 'classic_normal_moderate_05', tier: 'moderate', levelNumber: 15, name: 'Level 15' },
  { id: 'classic_normal_moderate_06', tier: 'moderate', levelNumber: 16, name: 'Level 16' },
  { id: 'classic_normal_moderate_07', tier: 'moderate', levelNumber: 17, name: 'Level 17' },
  { id: 'classic_normal_moderate_08', tier: 'moderate', levelNumber: 18, name: 'Level 18' },
  { id: 'classic_normal_moderate_09', tier: 'moderate', levelNumber: 19, name: 'Level 19' },
  { id: 'classic_normal_moderate_10', tier: 'moderate', levelNumber: 20, name: 'Level 20' },
  // Hard tier (21-30)
  { id: 'classic_normal_hard_01', tier: 'hard', levelNumber: 21, name: 'Level 21' },
  { id: 'classic_normal_hard_02', tier: 'hard', levelNumber: 22, name: 'Level 22' },
  { id: 'classic_normal_hard_03', tier: 'hard', levelNumber: 23, name: 'Level 23' },
  { id: 'classic_normal_hard_04', tier: 'hard', levelNumber: 24, name: 'Level 24' },
  { id: 'classic_normal_hard_05', tier: 'hard', levelNumber: 25, name: 'Level 25' },
  { id: 'classic_normal_hard_06', tier: 'hard', levelNumber: 26, name: 'Level 26' },
  { id: 'classic_normal_hard_07', tier: 'hard', levelNumber: 27, name: 'Level 27' },
  { id: 'classic_normal_hard_08', tier: 'hard', levelNumber: 28, name: 'Level 28' },
  { id: 'classic_normal_hard_09', tier: 'hard', levelNumber: 29, name: 'Level 29' },
  { id: 'classic_normal_hard_10', tier: 'hard', levelNumber: 30, name: 'Level 30' },
];

// Tier definitions for badges
export const TIERS = {
  easy: { name: 'Bronze', color: '#CD7F32', levels: 10 },
  moderate: { name: 'Silver', color: '#C0C0C0', levels: 10 },
  hard: { name: 'Gold', color: '#FFD700', levels: 10 },
};

const getDefaultProgress = () => ({
  currentLevel: 1,
  highestUnlocked: 1,
  tiersCompleted: { easy: false, moderate: false, hard: false },
  campaignComplete: false,
  levels: {},
});

export const useCampaignProgress = (onError) => {
  const [progress, setProgress] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        // Parse and validate the stored data
        const parseResult = safeParseAndValidate(saved, validateCampaignProgress);
        
        if (!parseResult.success) {
          console.error('Campaign progress validation failed:', parseResult.error);
          if (onError) onError('Campaign progress was corrupted and has been reset.');
          return getDefaultProgress();
        }
        
        // Merge with defaults to handle new fields
        return { ...getDefaultProgress(), ...parseResult.data };
      }
    } catch (e) {
      console.error('Failed to load campaign progress:', e);
      if (onError) onError('Failed to load campaign progress. Your level progress may have been reset.');
    }
    return getDefaultProgress();
  });

  // Persist to localStorage whenever progress changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.error('Failed to save campaign progress:', e);
      if (onError) onError('Failed to save campaign progress. Your level progress may not be preserved.');
    }
  }, [progress, onError]);

  // Get level info by snapshot ID
  const getLevelBySnapshotId = useCallback((snapshotId) => {
    return CAMPAIGN_LEVELS.find(level => level.id === snapshotId);
  }, []);

  // Get level info by level number (1-30)
  const getLevelByNumber = useCallback((levelNumber) => {
    return CAMPAIGN_LEVELS.find(level => level.levelNumber === levelNumber);
  }, []);

  // Check if a level is unlocked
  const isLevelUnlocked = useCallback((levelNumber) => {
    return levelNumber <= progress.highestUnlocked;
  }, [progress.highestUnlocked]);

  // Check if a level is completed
  const isLevelCompleted = useCallback((snapshotId) => {
    return progress.levels[snapshotId]?.completed || false;
  }, [progress.levels]);

  // Get level stats
  const getLevelStats = useCallback((snapshotId) => {
    return progress.levels[snapshotId] || null;
  }, [progress.levels]);

  // Record a level attempt (called when starting a level)
  const recordAttempt = useCallback((snapshotId) => {
    setProgress(prev => {
      const levelStats = prev.levels[snapshotId] || { completed: false, bestMoves: null, bestTime: null, attempts: 0 };
      return {
        ...prev,
        levels: {
          ...prev.levels,
          [snapshotId]: {
            ...levelStats,
            attempts: levelStats.attempts + 1,
          },
        },
      };
    });
  }, []);

  // Record a level completion (called when winning)
  const recordCompletion = useCallback((snapshotId, moves, time) => {
    setProgress(prev => {
      const level = getLevelBySnapshotId(snapshotId);
      if (!level) return prev;

      const levelStats = prev.levels[snapshotId] || { completed: false, bestMoves: null, bestTime: null, attempts: 0 };

      // Update best stats
      const newBestMoves = levelStats.bestMoves === null ? moves : Math.min(levelStats.bestMoves, moves);
      const newBestTime = levelStats.bestTime === null ? time : Math.min(levelStats.bestTime, time);

      // Calculate new highest unlocked (next level)
      const newHighestUnlocked = Math.max(prev.highestUnlocked, Math.min(level.levelNumber + 1, 30));

      // Check tier completions
      const newLevels = {
        ...prev.levels,
        [snapshotId]: {
          ...levelStats,
          completed: true,
          bestMoves: newBestMoves,
          bestTime: newBestTime,
        },
      };

      // Check if tiers are now complete
      const checkTierComplete = (tier) => {
        const tierLevels = CAMPAIGN_LEVELS.filter(l => l.tier === tier);
        return tierLevels.every(l => newLevels[l.id]?.completed);
      };

      const newTiersCompleted = {
        easy: checkTierComplete('easy'),
        moderate: checkTierComplete('moderate'),
        hard: checkTierComplete('hard'),
      };

      const newCampaignComplete = newTiersCompleted.easy && newTiersCompleted.moderate && newTiersCompleted.hard;

      return {
        ...prev,
        highestUnlocked: newHighestUnlocked,
        tiersCompleted: newTiersCompleted,
        campaignComplete: newCampaignComplete,
        levels: newLevels,
      };
    });
  }, [getLevelBySnapshotId]);

  // Get tier progress (completed count / total)
  const getTierProgress = useCallback((tier) => {
    const tierLevels = CAMPAIGN_LEVELS.filter(l => l.tier === tier);
    const completed = tierLevels.filter(l => progress.levels[l.id]?.completed).length;
    return { completed, total: tierLevels.length };
  }, [progress.levels]);

  // Get overall campaign progress
  const getCampaignProgress = useCallback(() => {
    const completed = CAMPAIGN_LEVELS.filter(l => progress.levels[l.id]?.completed).length;
    return { completed, total: CAMPAIGN_LEVELS.length };
  }, [progress.levels]);

  // Reset campaign progress
  const resetProgress = useCallback(() => {
    setProgress(getDefaultProgress());
  }, []);

  return {
    progress,
    CAMPAIGN_LEVELS,
    TIERS,
    getLevelBySnapshotId,
    getLevelByNumber,
    isLevelUnlocked,
    isLevelCompleted,
    getLevelStats,
    recordAttempt,
    recordCompletion,
    getTierProgress,
    getCampaignProgress,
    resetProgress,
  };
};
