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
 * @param {string} mode - Game mode
 * @param {string} difficulty - Difficulty (easy, moderate, hard)
 * @param {Object} options - Options
 * @param {boolean} options.avoidReuse - Avoid reusing deals in session
 * @returns {Object|null} Deal data or null if not available
 */
export async function getRandomDeal(mode, difficulty = 'moderate', options = {}) {
  const { avoidReuse = true } = options;
  const poolKey = `${mode}_${difficulty}`;
  const pool = poolManifest.pools.random[poolKey];
  
  if (!pool || pool.count === 0) {
    console.log(`[DealPool] No deals in pool for ${poolKey}, falling back to generator`);
    return null;
  }
  
  // Generate deal ID (sequential numbering)
  let maxAttempts = pool.count;
  let dealNumber;
  let dealId;
  
  if (avoidReuse && usedDeals[mode]) {
    // Try to find an unused deal
    const available = [];
    for (let i = 1; i <= pool.count; i++) {
      const id = `${mode}_${difficulty}_${i.toString().padStart(3, '0')}`;
      if (!usedDeals[mode].has(id)) {
        available.push(i);
      }
    }
    
    if (available.length === 0) {
      // All deals used, reset
      console.log(`[DealPool] All ${mode} deals used, resetting`);
      usedDeals[mode].clear();
      dealNumber = Math.floor(Math.random() * pool.count) + 1;
    } else {
      dealNumber = available[Math.floor(Math.random() * available.length)];
    }
  } else {
    dealNumber = Math.floor(Math.random() * pool.count) + 1;
  }
  
  dealId = `${mode}_${difficulty}_${dealNumber.toString().padStart(3, '0')}`;
  
  // Track usage
  if (usedDeals[mode]) {
    usedDeals[mode].add(dealId);
  }
  
  try {
    const deal = await loadDeal(pool.path, dealNumber);
    if (deal) {
      return {
        ...deal,
        _poolId: dealId,
        _source: 'pool'
      };
    }
  } catch (error) {
    console.warn(`[DealPool] Failed to load deal ${dealId}:`, error);
  }
  
  return null;
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
  const { metadata, deal: dealData } = deal;
  
  return {
    metadata: {
      id: deal.id || metadata.id,
      name: metadata.name || `${metadata.mode} ${metadata.difficulty}`,
      mode: metadata.mode,
      variant: metadata.variant || 'normal',
      pockets: metadata.pockets || getDefaultPockets(metadata.mode),
      allUp: metadata.allUp !== undefined ? metadata.allUp : getDefaultAllUp(metadata.mode),
      isPressureTest: metadata.isPressureTest || false,
      version: metadata.version || '1.0.0',
      createdAt: metadata.createdAt || new Date().toISOString(),
      description: metadata.description || ''
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
    columnState: dealData.columnState || generateDefaultColumnState(metadata.mode),
    analysis: dealData.analysis || null,
    validation: dealData.validation || { isValid: true, errors: [], warnings: [] },
    // Pool metadata
    _pool: {
      source: deal._source,
      poolId: deal._poolId,
      campaignId: deal._campaignId,
      tier: deal._tier,
      level: deal._level
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
