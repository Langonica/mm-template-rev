import * as snapshots from '../data/snapshots/index.js';

export const ALL_SNAPSHOTS = snapshots;

// Remove double_pressure from the categories
export const SNAPSHOT_CATEGORIES = {
   easy: [
    'classic_normal_easy_01',
	'classic_normal_easy_02',
	'classic_normal_easy_03',
	'classic_normal_easy_04',
	'classic_normal_easy_05',
	'classic_normal_easy_06',
	'classic_normal_easy_07',
	'classic_normal_easy_08',
	'classic_normal_easy_09',
	'classic_normal_easy_10'
  ],
  moderate: [
    'classic_normal_moderate_01',
	'classic_normal_moderate_02',
	'classic_normal_moderate_03',
	'classic_normal_moderate_04',
	'classic_normal_moderate_05',
	'classic_normal_moderate_06',
	'classic_normal_moderate_07',
	'classic_normal_moderate_08',
	'classic_normal_moderate_09',
	'classic_normal_moderate_10'
  ],
  hard: [
   'classic_normal_hard_01',
	'classic_normal_hard_02',
	'classic_normal_hard_03',
	'classic_normal_hard_04',
	'classic_normal_hard_05',
	'classic_normal_hard_06',
	'classic_normal_hard_07',
	'classic_normal_hard_08',
	'classic_normal_hard_09',
	'classic_normal_hard_10'
  ]
};

// Helper function to get snapshot by ID
export function getSnapshot(snapshotId) {
  return ALL_SNAPSHOTS[snapshotId] || null;
}

// Helper function to get category for a snapshot
export function getSnapshotCategory(snapshotId) {
  if (SNAPSHOT_CATEGORIES.easy.includes(snapshotId)) return 'easy';
  if (SNAPSHOT_CATEGORIES.moderate.includes(snapshotId)) return 'moderate';
if (SNAPSHOT_CATEGORIES.hard.includes(snapshotId)) return 'hard';
  return 'original'; // default
}

// Get display name for snapshot
export function getSnapshotDisplayName(snapshotId) {
  const snapshot = ALL_SNAPSHOTS[snapshotId];
  if (!snapshot) return 'Unknown Snapshot';
  
  return snapshot.metadata.name;
}

// Get description for snapshot
export function getSnapshotDescription(snapshotId) {
  const snapshot = ALL_SNAPSHOTS[snapshotId];
  if (!snapshot) return '';
  
  return snapshot.metadata.description || '';
}