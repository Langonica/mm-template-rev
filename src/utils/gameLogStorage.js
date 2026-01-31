/**
 * Game Log Storage - Comprehensive Player Action Tracking
 * 
 * Records every meaningful player action for analysis and simulation:
 * - All card moves (tableau↔tableau, tableau↔foundation, waste↔foundation, etc.)
 * - Pocket usage (store/retrieve)
 * - Column type conversions (traditional→ace/king)
 * - Stock operations (draw, recycle)
 * - Foundation placements (every card, not just completion)
 * - Game lifecycle (start, end, outcome)
 * 
 * @module gameLogStorage
 */

const STORAGE_KEY = 'meridian_game_logs';
const MAX_STORED_LOGS = 100;

// ============================================================================
// Session Management
// ============================================================================

export function initLogStorage() {
  return loadLogs();
}

function loadLogs() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('[GameLogStorage] Failed to load logs:', e);
  }
  return [];
}

function saveLogs(logs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('[GameLogStorage] Failed to save logs:', e);
    if (e.name === 'QuotaExceededError' && logs.length > 10) {
      const trimmed = logs.slice(-10);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    }
  }
}

// ============================================================================
// Session Lifecycle
// ============================================================================

export function startLogSession(params) {
  const { mode, dealId, dealSeed, isCampaign, campaignLevel, initialState } = params;
  
  if (import.meta.env.DEV) {
    console.log('[GameLogStorage] Starting session:', { mode, dealId, isCampaign });
  }
  
  const sessionId = `game_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`;
  
  const session = {
    sessionId,
    version: '2.0.0',
    startTime: new Date().toISOString(),
    startTimestamp: Date.now(),
    mode,
    dealId: dealId || null,
    dealSeed: dealSeed || null,
    isCampaign: isCampaign || false,
    campaignLevel: campaignLevel || null,
    initialState: initialState ? {
      tableau: initialState.tableau,
      stockCount: initialState.stock?.length,
      wasteTop: initialState.waste?.[0] || null
    } : null,
    events: [],
    completed: false,
    // Aggregated stats (calculated at end)
    stats: {
      totalMoves: 0,
      foundationMoves: 0,
      tableauMoves: 0,
      pocketStores: 0,
      pocketRetrieves: 0,
      stockDraws: 0,
      stockRecycles: 0,
      undoCount: 0,
      stockCycles: 0,
      foundationsCompleted: 0,
      columnConversions: 0
    }
  };
  
  window.__CURRENT_LOG_SESSION__ = session;
  logEvent('SESSION_START', { mode, dealId, isCampaign, campaignLevel });
  
  return sessionId;
}

export function endLogSession(result) {
  const session = window.__CURRENT_LOG_SESSION__;
  if (!session) return;
  
  const { outcome, moves, duration, finalState } = result;
  
  session.endTime = new Date().toISOString();
  session.duration = duration;
  session.outcome = outcome;
  session.moves = moves;
  session.completed = true;
  
  // Calculate final stats
  calculateSessionStats(session);
  
  // Add final state snapshot
  if (finalState) {
    session.finalState = {
      foundations: countFoundationCards(finalState),
      tableauCards: countTableauCards(finalState),
      emptyColumns: countEmptyColumns(finalState),
      columnTypes: finalState.columnState?.types || []
    };
  }
  
  logEvent('SESSION_END', { 
    outcome, 
    moves, 
    duration,
    stats: session.stats
  });
  
  persistCurrentSession();
  window.__CURRENT_LOG_SESSION__ = null;
}

// ============================================================================
// Player Actions - Every Move Type
// ============================================================================

/**
 * Log any card movement between locations
 * @param {Object} move - Move details
 * @param {string} move.card - Card moved
 * @param {string} move.fromType - Source type ('tableau', 'waste', 'pocket')
 * @param {string|number} move.fromLoc - Source location (column index, 'waste', or pocket num)
 * @param {string} move.toType - Destination type ('tableau', 'foundation', 'pocket')
 * @param {string|number} move.toLoc - Dest location (column index, foundation spec, pocket num)
 * @param {number} move.moveNumber - Sequential move number
 * @param {Object} gameState - Current game state AFTER move (for tracking column types)
 */
export function logCardMove(move, gameState) {
  const { card, fromType, fromLoc, toType, toLoc, moveNumber } = move;
  
  if (import.meta.env.DEV) {
    console.log('[GameLogStorage] logCardMove:', { card, fromType, toType, moveNumber });
  }
  
  const eventData = {
    moveNumber,
    card,
    from: { type: fromType, loc: fromLoc },
    to: { type: toType, loc: toLoc }
  };
  
  // Track column type if tableau column
  if (gameState?.columnState?.types) {
    if (toType === 'tableau' && typeof toLoc === 'number') {
      eventData.toColumnType = gameState.columnState.types[toLoc];
    }
    if (fromType === 'tableau' && typeof fromLoc === 'number') {
      eventData.fromColumnType = gameState.columnState.types[fromLoc];
    }
  }
  
  logEvent('CARD_MOVE', eventData);
}

/**
 * Log foundation placement specifically
 * @param {string} card - Card placed
 * @param {string} suit - h/d/c/s
 * @param {string} direction - 'up' or 'down'
 * @param {number} pileSize - Size of pile after placement (1-13)
 * @param {number} moveNumber
 */
export function logFoundationPlacement(card, suit, direction, pileSize, moveNumber) {
  logEvent('FOUNDATION_PLACE', {
    card,
    suit,
    direction,
    pileSize,
    moveNumber,
    isComplete: pileSize === 13
  });
}

/**
 * Log pocket usage
 * @param {string} action - 'store' or 'retrieve'
 * @param {string} card - Card involved
 * @param {number} pocketNum - Pocket 1 or 2
 * @param {number} moveNumber
 */
export function logPocketAction(action, card, pocketNum, moveNumber) {
  logEvent('POCKET', {
    action, // 'store' or 'retrieve'
    card,
    pocketNum,
    moveNumber
  });
}

/**
 * Log column type conversion
 * @param {number} column - Column index (0-6)
 * @param {string} fromType - Previous type
 * @param {string} toType - New type ('ace', 'king', 'traditional')
 * @param {string} triggerCard - Card that triggered conversion
 * @param {number} moveNumber
 */
export function logColumnConversion(column, fromType, toType, triggerCard, moveNumber) {
  logEvent('COLUMN_CONVERT', {
    column,
    from: fromType,
    to: toType,
    triggerCard,
    moveNumber
  });
}

/**
 * Log stock draw (moving card from stock to waste)
 * @param {string} card - Card drawn
 * @param {number} cardsRemaining - Cards left in stock
 * @param {number} moveNumber
 */
export function logStockDraw(card, cardsRemaining, moveNumber) {
  logEvent('STOCK_DRAW', {
    card,
    cardsRemaining,
    moveNumber
  });
}

/**
 * Log stock recycle (when stock is empty and waste is recycled)
 * @param {number} wasteSize - Number of cards being recycled
 * @param {number} cycleNumber - Which cycle this is (1, 2, 3...)
 */
export function logStockRecycle(wasteSize, cycleNumber) {
  logEvent('STOCK_RECYCLE', {
    wasteSize,
    cycleNumber
  });
}

/**
 * Log undo action
 * @param {number} moveNumber - The move that was undone
 * @param {string} undoneCard - Card that was moved (if tracked)
 */
export function logUndo(moveNumber, undoneCard = null) {
  logEvent('UNDO', { moveNumber, undoneCard });
}

/**
 * Log auto-complete start (optional, for tracking assisted wins)
 * @param {number} cardsRemaining - Cards left to place
 * @param {number} moveNumber
 */
export function logAutoCompleteStart(cardsRemaining, moveNumber) {
  logEvent('AUTOCOMPLETE_START', { cardsRemaining, moveNumber });
}

// ============================================================================
// Internal Helpers
// ============================================================================

function logEvent(type, data = {}) {
  const session = window.__CURRENT_LOG_SESSION__;
  if (!session) {
    console.warn(`[GameLogStorage] No active session for event: ${type}`);
    return;
  }
  
  const event = {
    timestamp: Date.now(),
    relativeTime: Date.now() - session.startTimestamp,
    type,
    ...data
  };
  
  session.events.push(event);
  
  // Debug logging in DEV mode
  if (import.meta.env.DEV) {
    console.log(`[GameLogStorage] Event: ${type}`, data);
  }
  
  // Persist every 10 events
  if (session.events.length % 10 === 0) {
    persistCurrentSession();
  }
}

function persistCurrentSession() {
  const session = window.__CURRENT_LOG_SESSION__;
  if (!session) return;
  
  const logs = loadLogs();
  const existingIndex = logs.findIndex(l => l.sessionId === session.sessionId);
  
  if (existingIndex >= 0) {
    logs[existingIndex] = { ...session };
  } else {
    logs.push({ ...session });
  }
  
  if (logs.length > MAX_STORED_LOGS) {
    logs.shift();
  }
  
  saveLogs(logs);
}

function calculateSessionStats(session) {
  const stats = session.stats;
  
  for (const event of session.events) {
    switch (event.type) {
      case 'CARD_MOVE':
        stats.totalMoves++;
        if (event.to?.type === 'foundation') {
          stats.foundationMoves++;
        } else if (event.to?.type === 'tableau') {
          stats.tableauMoves++;
        }
        break;
      case 'POCKET':
        if (event.action === 'store') stats.pocketStores++;
        if (event.action === 'retrieve') stats.pocketRetrieves++;
        break;
      case 'STOCK_DRAW':
        stats.stockDraws++;
        break;
      case 'STOCK_RECYCLE':
        stats.stockRecycles++;
        stats.stockCycles = Math.max(stats.stockCycles, event.cycleNumber);
        break;
      case 'UNDO':
        stats.undoCount++;
        break;
      case 'FOUNDATION_PLACE':
        if (event.isComplete) stats.foundationsCompleted++;
        break;
      case 'COLUMN_CONVERT':
        stats.columnConversions++;
        break;
    }
  }
}

export function countFoundationCards(state) {
  if (!state?.foundations) return 0;
  let count = 0;
  for (const zone of ['up', 'down']) {
    for (const suit of ['h', 'd', 'c', 's']) {
      count += state.foundations[zone]?.[suit]?.length || 0;
    }
  }
  return count;
}

export function countTableauCards(state) {
  if (!state?.tableau) return 0;
  return Object.values(state.tableau).reduce((sum, col) => sum + (col?.length || 0), 0);
}

export function countEmptyColumns(state) {
  if (!state?.tableau) return 0;
  return Object.values(state.tableau).filter(col => !col || col.length === 0).length;
}

// ============================================================================
// Query/Export API
// ============================================================================

export function getAllLogs() {
  return loadLogs();
}

export function getRecentLogs(count = 10) {
  return loadLogs().slice(-count);
}

export function getLogsByMode(mode) {
  return loadLogs().filter(l => l.mode === mode);
}

export function getLogsByOutcome(outcome) {
  return loadLogs().filter(l => l.outcome === outcome);
}

export function getLog(sessionId) {
  return loadLogs().find(l => l.sessionId === sessionId) || null;
}

export function clearAllLogs() {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportLogs() {
  return {
    exportedAt: new Date().toISOString(),
    version: '2.0.0',
    count: loadLogs().length,
    logs: loadLogs()
  };
}

export function getAggregateStats() {
  const logs = loadLogs().filter(l => l.completed);
  
  const stats = {
    totalGames: logs.length,
    wins: 0,
    losses: 0,
    byMode: {},
    averages: {
      moves: 0,
      duration: 0,
      foundations: 0,
      stockCycles: 0,
      undos: 0
    }
  };
  
  let totalMoves = 0;
  let totalDuration = 0;
  let totalFoundations = 0;
  let totalCycles = 0;
  let totalUndos = 0;
  
  for (const log of logs) {
    // Outcomes
    if (log.outcome === 'won') stats.wins++;
    else stats.losses++;
    
    // By mode
    if (!stats.byMode[log.mode]) {
      stats.byMode[log.mode] = { games: 0, wins: 0, losses: 0 };
    }
    stats.byMode[log.mode].games++;
    if (log.outcome === 'won') stats.byMode[log.mode].wins++;
    else stats.byMode[log.mode].losses++;
    
    // Averages
    totalMoves += log.moves || 0;
    totalDuration += log.duration || 0;
    totalFoundations += log.stats?.foundationsCompleted || 0;
    totalCycles += log.stats?.stockCycles || 0;
    totalUndos += log.stats?.undoCount || 0;
  }
  
  const n = logs.length;
  if (n > 0) {
    stats.averages.moves = Math.round(totalMoves / n);
    stats.averages.duration = Math.round(totalDuration / n);
    stats.averages.foundations = Math.round(totalFoundations / n);
    stats.averages.stockCycles = Math.round(totalCycles / n);
    stats.averages.undos = Math.round(totalUndos / n);
  }
  
  return stats;
}

// ============================================================================
// Debug API
// ============================================================================

export function initLogStorageDebug() {
  if (!import.meta.env.DEV) return;
  
  window.__GAME_LOG_STORAGE__ = {
    getAll: getAllLogs,
    getRecent: getRecentLogs,
    getStats: getAggregateStats,
    export: exportLogs,
    clear: clearAllLogs,
    // Direct logging for testing
    logMove: logCardMove,
    logFoundation: logFoundationPlacement,
    logPocket: logPocketAction,
    logRecycle: logStockRecycle
  };
  
  console.log('[GameLogStorage] Debug API: window.__GAME_LOG_STORAGE__');
}

export default {
  init: initLogStorage,
  startSession: startLogSession,
  endSession: endLogSession,
  logMove: logCardMove,
  logFoundation: logFoundationPlacement,
  logPocket: logPocketAction,
  logColumnConvert: logColumnConversion,
  logStockDraw: logStockDraw,
  logStockRecycle: logStockRecycle,
  logUndo: logUndo,
  logAutoComplete: logAutoCompleteStart,
  getAll: getAllLogs,
  getRecent: getRecentLogs,
  getByMode: getLogsByMode,
  getByOutcome: getLogsByOutcome,
  getStats: getAggregateStats,
  export: exportLogs,
  clear: clearAllLogs,
  initDebug: initLogStorageDebug
};
