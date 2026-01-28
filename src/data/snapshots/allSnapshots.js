// Easy Snapshots (10)
import classic_normal_easy_01 from './classic_normal_easy_01.json';
import classic_normal_easy_02 from './classic_normal_easy_02.json';
import classic_normal_easy_03 from './classic_normal_easy_03.json';
import classic_normal_easy_04 from './classic_normal_easy_04.json';
import classic_normal_easy_05 from './classic_normal_easy_05.json';
import classic_normal_easy_06 from './classic_normal_easy_06.json';
import classic_normal_easy_07 from './classic_normal_easy_07.json';
import classic_normal_easy_08 from './classic_normal_easy_08.json';
import classic_normal_easy_09 from './classic_normal_easy_09.json';
import classic_normal_easy_10 from './classic_normal_easy_10.json';

// Moderate Snapshots (10)
import classic_normal_moderate_01 from './classic_normal_moderate_01.json';
import classic_normal_moderate_02 from './classic_normal_moderate_02.json';
import classic_normal_moderate_03 from './classic_normal_moderate_03.json';
import classic_normal_moderate_04 from './classic_normal_moderate_04.json';
import classic_normal_moderate_05 from './classic_normal_moderate_05.json';
import classic_normal_moderate_06 from './classic_normal_moderate_06.json';
import classic_normal_moderate_07 from './classic_normal_moderate_07.json';
import classic_normal_moderate_08 from './classic_normal_moderate_08.json';
import classic_normal_moderate_09 from './classic_normal_moderate_09.json';
import classic_normal_moderate_10 from './classic_normal_moderate_10.json';

// Hard Snapshots (10)
import classic_normal_hard_01 from './classic_normal_hard_01.json';
import classic_normal_hard_02 from './classic_normal_hard_02.json';
import classic_normal_hard_03 from './classic_normal_hard_03.json';
import classic_normal_hard_04 from './classic_normal_hard_04.json';
import classic_normal_hard_05 from './classic_normal_hard_05.json';
import classic_normal_hard_06 from './classic_normal_hard_06.json';
import classic_normal_hard_07 from './classic_normal_hard_07.json';
import classic_normal_hard_08 from './classic_normal_hard_08.json';
import classic_normal_hard_09 from './classic_normal_hard_09.json';
import classic_normal_hard_10 from './classic_normal_hard_10.json';

export const ALL_SNAPSHOTS = {
  // Easy Snapshots (10)
  classic_normal_easy_01,
  classic_normal_easy_02,
  classic_normal_easy_03,
  classic_normal_easy_04,
  classic_normal_easy_05,
  classic_normal_easy_06,
  classic_normal_easy_07,
  classic_normal_easy_08,
  classic_normal_easy_09,
  classic_normal_easy_10,

  // Moderate Snapshots (10)
  classic_normal_moderate_01,
  classic_normal_moderate_02,
  classic_normal_moderate_03,
  classic_normal_moderate_04,
  classic_normal_moderate_05,
  classic_normal_moderate_06,
  classic_normal_moderate_07,
  classic_normal_moderate_08,
  classic_normal_moderate_09,
  classic_normal_moderate_10,

  // Hard Snapshots (10)
  classic_normal_hard_01,
  classic_normal_hard_02,
  classic_normal_hard_03,
  classic_normal_hard_04,
  classic_normal_hard_05,
  classic_normal_hard_06,
  classic_normal_hard_07,
  classic_normal_hard_08,
  classic_normal_hard_09,
  classic_normal_hard_10,
};

// Group snapshots by category
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
  return 'easy'; // default
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
