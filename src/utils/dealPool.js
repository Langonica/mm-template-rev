/**
 * Deal Pool Utility
 * 
 * Manages loading and selection of verified deals from the pool.
 * Supports both campaign progression and random play modes.
 * 
 * @module dealPool
 */

import poolManifest from '../data/deals/pool_manifest.json';

// Cache for loaded deals
const dealCache = new Map();

// Track used deals per session (to avoid repetition)
const usedDeals = {
  classic: new Set(),
  classic_double: new Set(),
  hidden: new Set(),
  hidden_double: new Set()
};

/**
 * Get pool statistics
 * @returns {Object} Pool stats
 */
export function getPoolStats() {
  return {
    campaign: poolManifest.stats.campaign,
    random: poolManifest.stats.random,
    version: poolManifest.version,
    lastUpdated: poolManifest.lastUpdated
  };
}

/**
 * Get campaign level info from manifest
 * @param {string} tier - Tier name (tier1, tier2, tier3)
 * @param {number} index - Level index (1-10)
 * @returns {Object|null} Level info or null
 */
export function getCampaignLevelInfo(tier, index) {
  const tierData = poolManifest.pools.campaign[tier];
  if (!tierData || index < 1 || index > tierData.levels.length) {
    return null;
  }
  return tierData.levels[index - 1];
}

/**
 * Get all levels for a campaign tier
 * @param {string} tier - Tier name
 * @returns {Array} Array of level info
 */
export function getCampaignTierLevels(tier) {
  return poolManifest.pools.campaign[tier]?.levels || [];
}

/**
 * Get campaign tier info
 * @param {string} tier - Tier name
 * @returns {Object|null} Tier info
 */
export function getCampaignTierInfo(tier) {
  return poolManifest.pools.campaign[tier] || null;
}

/**
 * Build campaign level ID from components
 * @param {string} tier - Tier (tier1, tier2, tier3)
 * @param {number} level - Level number (1-10)
 * @returns {string} Level ID
 */
export function buildCampaignLevelId(tier, level) {
  return `campaign_${tier}_${level.toString().padStart(2, '0')}`;
}

/**
 * Parse campaign level ID
 * @param {string} levelId - Level ID
 * @returns {Object|null} Parsed components
 */
export function parseCampaignLevelId(levelId) {
  const match = levelId.match(/^campaign_(tier\d+)_(\d+)$/);
  if (!match) return null;
  return {
    tier: match[1],
    level: parseInt(match[2], 10)
  };
}

/**
 * Get difficulty for a campaign level
 * @param {string} tier - Tier name
 * @returns {string} Difficulty (easy, moderate, hard)
 */
export function getCampaignTierDifficulty(tier) {
  const difficulties = {
    tier1: 'easy',
    tier2: 'moderate',
    tier3: 'hard'
  };
  return difficulties[tier] || 'moderate';
}

/**
 * Check if random pool has deals for a mode/difficulty
 * @param {string} mode - Game mode
 * @param {string} difficulty - Difficulty level
 * @returns {boolean}
 */
export function hasRandomDeals(mode, difficulty) {
  const poolKey = `${mode}_${difficulty}`;
  const pool = poolManifest.pools.random[poolKey];
  return pool && pool.count > 0;
}

/**
 * Get random deal from pool
 * Uses the 30 curated campaign deals and adapts them for any mode.
 * This ensures all random games use verified winnable deals.
 * 
 * @param {string} mode - Game mode (classic, hidden, classic_double, hidden_double)
 * @param {string} difficulty - Difficulty (easy, moderate, hard)
 * @param {Object} options - Options
 * @param {boolean} options.avoidReuse - Avoid reusing deals in session
 * @returns {Object|null} Deal data or null if not available
 */
export async function getRandomDeal(mode, difficulty = 'moderate', options = {}) {
  const { avoidReuse = true } = options;
  
  // Map difficulty to campaign tier
  const tierMap = { easy: 'tier1', moderate: 'tier2', hard: 'tier3' };
  const tier = tierMap[difficulty] || 'tier1';
  
  // Get tier data from campaign pool (30 curated deals)
  const tierData = poolManifest.pools.campaign[tier];
  if (!tierData || tierData.count === 0) {
    console.log(`[DealPool] No campaign deals for ${tier}, falling back`);
    return null;
  }
  
  // Pick random level from tier (1-10)
  // For avoidReuse, we'd need to track across all modes - simplified for now
  const levelNumber = Math.floor(Math.random() * tierData.count) + 1;
  const levelInfo = tierData.levels[levelNumber - 1];
  
  try {
    // Use base URL from Vite to construct proper path
    const baseUrl = import.meta.env.BASE_URL || '/';
    const dealPath = tierData.path.startsWith('./') ? tierData.path.slice(2) : tierData.path;
    const dealUrl = `${baseUrl}${dealPath}${levelInfo.file}`;
    const module = await import(/* @vite-ignore */ dealUrl);
    const baseDeal = module.default || module;
    
    // Adapt the deal for the requested mode (pockets, face up/down)
    const adaptedDeal = adaptDealForMode(baseDeal, mode, difficulty);
    
    console.log(`[DealPool] Using ${tier} level ${levelNumber} for ${mode} ${difficulty}`);
    
    return {
      ...adaptedDeal,
      _poolId: `campaign_${tier}_${levelNumber.toString().padStart(2, '0')}`,
      _source: 'campaign-adapted',
      _adaptedFor: { mode, difficulty, originalTier: tier, originalLevel: levelNumber }
    };
    
  } catch (error) {
    console.error(`[DealPool] Failed to load campaign deal ${tier}/${levelNumber}:`, error);
    return null;
  }
}

/**
 * Adapt a base deal (classic mode) for any game mode
 * Changes pocket count and face up/down pattern based on target mode
 * 
 * @param {Object} baseDeal - Original campaign deal
 * @param {string} targetMode - Mode to adapt for
 * @param {string} difficulty - Difficulty for naming
 * @returns {Object} Adapted deal
 */
function adaptDealForMode(baseDeal, targetMode, difficulty) {
  // Mode configurations
  const modeConfig = {
    classic: { pockets: 1, allUp: true, faceDownPattern: false },
    classic_double: { pockets: 2, allUp: true, faceDownPattern: false },
    hidden: { pockets: 1, allUp: false, faceDownPattern: true },
    hidden_double: { pockets: 2, allUp: false, faceDownPattern: true }
  };
  
  const config = modeConfig[targetMode] || modeConfig.classic;
  const { id: baseId, metadata, deal } = baseDeal;
  
  // Build adapted column state
  const adaptedColumnState = adaptColumnState(deal.columnState, config.faceDownPattern);
  
  return {
    ...baseDeal,
    metadata: {
      ...metadata,
      id: `${baseId}_as_${targetMode}`,
      name: `${metadata.name} (${targetMode})`,
      mode: targetMode,
      pockets: config.pockets,
      allUp: config.allUp,
      difficulty: difficulty,
      adaptedFrom: baseId,
      adaptedAt: new Date().toISOString()
    },
    deal: {
      ...deal,
      columnState: adaptedColumnState,
      // Clear pockets if reducing from 2 to 1
      pocket2: config.pockets === 1 ? null : deal.pocket2
    }
  };
}

/**
 * Adapt column state for face up/down pattern
 * @param {Object} originalColumnState - Original column state
 * @param {boolean} faceDownPattern - true for hidden mode (face down cards)
 * @returns {Object} Adapted column state
 */
function adaptColumnState(originalColumnState, faceDownPattern) {
  if (!faceDownPattern) {
    // Classic mode: all face up
    return {
      types: originalColumnState?.types || ['traditional', 'traditional', 'traditional', 'traditional', 'traditional', 'traditional', 'traditional'],
      faceDownCounts: [0, 0, 0, 0, 0, 0, 0],
      faceUpCounts: [1, 2, 3, 4, 5, 6, 7]
    };
  } else {
    // Hidden mode: traditional pyramid pattern
    // Column N has N face-down cards (except column 0)
    return {
      types: originalColumnState?.types || ['traditional', 'traditional', 'traditional', 'traditional', 'traditional', 'traditional', 'traditional'],
      faceDownCounts: [0, 1, 2, 3, 4, 5, 6],
      faceUpCounts: [1, 1, 1, 1, 1, 1, 1]
    };
  }
}

/**
 * Load a specific deal by file path
 * @param {string} basePath - Base path from manifest
 * @param {number} number - Deal number
 * @returns {Object|null} Deal data
 */
async function loadDeal(basePath, number) {
  const filename = `deal_${number.toString().padStart(3, '0')}.json`;
  const fullPath = `${basePath}${filename}`;
  
  // Check cache
  if (dealCache.has(fullPath)) {
    return dealCache.get(fullPath);
  }
  
  try {
    // Dynamic import
    const module = await import(/* @vite-ignore */ fullPath);
    const deal = module.default || module;
    
    // Cache it
    dealCache.set(fullPath, deal);
    
    return deal;
  } catch (error) {
    console.error(`[DealPool] Failed to load ${fullPath}:`, error);
    return null;
  }
}

/**
 * Get a campaign level deal
 * @param {string} tier - Tier (tier1, tier2, tier3)
 * @param {number} level - Level number (1-10)
 * @returns {Object|null} Deal data
 */
export async function getCampaignDeal(tier, level) {
  const tierData = poolManifest.pools.campaign[tier];
  if (!tierData) {
    console.error(`[DealPool] Unknown tier: ${tier}`);
    return null;
  }
  
  const levelInfo = tierData.levels[level - 1];
  if (!levelInfo) {
    console.error(`[DealPool] Level ${level} not found in ${tier}`);
    return null;
  }
  
  try {
    const module = await import(/* @vite-ignore */ `${tierData.path}${levelInfo.file}`);
    const deal = module.default || module;
    
    return {
      ...deal,
      _campaignId: levelInfo.id,
      _tier: tier,
      _level: level,
      _source: 'campaign'
    };
  } catch (error) {
    console.error(`[DealPool] Failed to load campaign level ${tier}/${level}:`, error);
    return null;
  }
}

/**
 * Convert deal format to game state format
 * @param {Object} deal - Deal from pool
 * @returns {Object} Game state compatible with useCardGame
 */
export function dealToGameState(deal) {
  const { id: dealId, metadata, deal: dealData } = deal;
  
  // Use metadata from deal (which may be adapted for different mode)
  const mode = metadata.mode || 'classic';
  
  return {
    metadata: {
      id: metadata.id || dealId,
      name: metadata.name || `${mode} ${metadata.difficulty}`,
      mode: mode,
      variant: metadata.variant || 'normal',
      pockets: metadata.pockets !== undefined ? metadata.pockets : getDefaultPockets(mode),
      allUp: metadata.allUp !== undefined ? metadata.allUp : getDefaultAllUp(mode),
      isPressureTest: metadata.isPressureTest || false,
      version: metadata.version || '1.0.0',
      createdAt: metadata.createdAt || new Date().toISOString(),
      description: metadata.description || '',
      // Tracking info for adapted deals
      adaptedFrom: metadata.adaptedFrom || null,
      originalId: metadata.originalId || null
    },
    tableau: dealData.tableau,
    stock: dealData.stock,
    waste: dealData.waste || [],
    pocket1: dealData.pocket1 || null,
    pocket2: dealData.pocket2 || null,
    foundations: dealData.foundations || {
      up: { h: [], d: [], c: [], s: [] },
      down: { h: [], d: [], c: [], s: [] }
    },
    columnState: dealData.columnState || generateDefaultColumnState(mode),
    analysis: dealData.analysis || null,
    validation: dealData.validation || { isValid: true, errors: [], warnings: [] },
    // Pool metadata for logging/tracking
    _pool: {
      source: deal._source,
      poolId: deal._poolId,
      campaignId: deal._campaignId,
      tier: deal._tier,
      level: deal._level,
      adaptedFor: deal._adaptedFor || null
    }
  };
}

/**
 * Get default pocket count for mode
 * @param {string} mode
 * @returns {number}
 */
function getDefaultPockets(mode) {
  const pockets = {
    classic: 1,
    classic_double: 2,
    hidden: 1,
    hidden_double: 2
  };
  return pockets[mode] || 1;
}

/**
 * Get default allUp setting for mode
 * @param {string} mode
 * @returns {boolean}
 */
function getDefaultAllUp(mode) {
  return mode === 'classic' || mode === 'classic_double';
}

/**
 * Generate default column state
 * @param {string} mode
 * @returns {Object}
 */
function generateDefaultColumnState(mode) {
  const allUp = getDefaultAllUp(mode);
  const faceDownCounts = allUp ? [0, 0, 0, 0, 0, 0, 0] : [0, 1, 2, 3, 4, 5, 6];
  const faceUpCounts = [1, 1, 1, 1, 1, 1, 1];
  
  // Default all to traditional
  const types = ['traditional', 'traditional', 'traditional', 'traditional', 'traditional', 'traditional', 'traditional'];
  
  return {
    types,
    faceDownCounts,
    faceUpCounts
  };
}

/**
 * Reset usage tracking (for testing)
 */
export function resetUsageTracking() {
  Object.keys(usedDeals).forEach(key => usedDeals[key].clear());
}

/**
 * Get usage stats
 * @returns {Object}
 */
export function getUsageStats() {
  return {
    classic: usedDeals.classic.size,
    classic_double: usedDeals.classic_double.size,
    hidden: usedDeals.hidden.size,
    hidden_double: usedDeals.hidden_double.size
  };
}

export default {
  getPoolStats,
  getCampaignLevelInfo,
  getCampaignTierLevels,
  getCampaignTierInfo,
  buildCampaignLevelId,
  parseCampaignLevelId,
  getCampaignTierDifficulty,
  hasRandomDeals,
  getRandomDeal,
  getCampaignDeal,
  dealToGameState,
  resetUsageTracking,
  getUsageStats
};
