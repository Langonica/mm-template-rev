/**
 * Game Log Storage
 * 
 * Persists detailed game logs to localStorage for later export and analysis.
 * Complements gameLogger.js by storing the full event stream.
 * 
 * @module gameLogStorage
 */

const STORAGE_KEY = 'meridian_game_logs';
const MAX_STORED_LOGS = 50; // Keep last 50 games

/**
 * Initialize log storage
 * @returns {Array} Existing logs
 */
export function initLogStorage() {
  return loadLogs();
}

/**
 * Load logs from localStorage
 * @returns {Array} Stored logs
 */
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

/**
 * Save logs to localStorage
 * @param {Array} logs - Logs to save
 */
function saveLogs(logs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('[GameLogStorage] Failed to save logs:', e);
    // If quota exceeded, remove oldest logs
    if (e.name === 'QuotaExceededError' && logs.length > 10) {
      const trimmed = logs.slice(-10);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    }
  }
}

/**
 * Start a new game log session
 * @param {Object} params - Game parameters
 * @returns {string} Log session ID
 */
export function startLogSession(params) {
  const { mode, dealId, isCampaign, campaignLevel } = params;
  
  const sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
  
  const session = {
    sessionId,
    version: '1.0.0',
    startTime: new Date().toISOString(),
    mode,
    dealId,
    isCampaign: isCampaign || false,
    campaignLevel,
    events: [],
    completed: false
  };
  
  // Store in memory for current session
  window.__CURRENT_LOG_SESSION__ = session;
  
  // Log start event
  logSessionEvent('SESSION_START', { mode, dealId, isCampaign, campaignLevel });
  
  return sessionId;
}

/**
 * Log an event to current session
 * @param {string} type - Event type
 * @param {Object} data - Event data
 */
export function logSessionEvent(type, data = {}) {
  const session = window.__CURRENT_LOG_SESSION__;
  if (!session) return;
  
  const event = {
    timestamp: Date.now(),
    relativeTime: Date.now() - new Date(session.startTime).getTime(),
    type,
    ...data
  };
  
  session.events.push(event);
  
  // Auto-persist every 10 events
  if (session.events.length % 10 === 0) {
    persistCurrentSession();
  }
}

/**
 * Log a move event
 * @param {Object} move - Move details
 */
export function logSessionMove(move) {
  const { type, from, to, card, moveNumber } = move;
  logSessionEvent('MOVE', {
    moveNumber,
    moveType: type,
    from,
    to,
    card
  });
}

/**
 * Log undo event
 * @param {number} moveNumber - Move that was undone
 */
export function logSessionUndo(moveNumber) {
  logSessionEvent('UNDO', { moveNumber });
}

/**
 * Log foundation placement
 * @param {string} suit - Card suit
 * @param {string} direction - 'up' or 'down'
 * @param {string} card - Card placed
 */
export function logSessionFoundation(suit, direction, card) {
  logSessionEvent('FOUNDATION', { suit, direction, card });
}

/**
 * Log stock cycle
 * @param {number} cycleNumber - Cycle count
 */
export function logSessionStockCycle(cycleNumber) {
  logSessionEvent('STOCK_CYCLE', { cycleNumber });
}

/**
 * Log notification tier
 * @param {string} tier - Tier name
 */
export function logSessionNotification(tier) {
  logSessionEvent('NOTIFICATION', { tier });
}

/**
 * End current log session and persist
 * @param {Object} result - Game result
 */
export function endLogSession(result) {
  const session = window.__CURRENT_LOG_SESSION__;
  if (!session) return;
  
  const { outcome, moves, duration } = result;
  
  session.endTime = new Date().toISOString();
  session.duration = duration;
  session.outcome = outcome;
  session.moves = moves;
  session.completed = true;
  
  // Add end event
  logSessionEvent('SESSION_END', { outcome, moves, duration });
  
  // Persist to storage
  persistCurrentSession();
  
  // Clear current session
  window.__CURRENT_LOG_SESSION__ = null;
}

/**
 * Persist current session to localStorage
 */
function persistCurrentSession() {
  const session = window.__CURRENT_LOG_SESSION__;
  if (!session) return;
  
  const logs = loadLogs();
  
  // Check if already persisted
  const existingIndex = logs.findIndex(l => l.sessionId === session.sessionId);
  
  if (existingIndex >= 0) {
    // Update existing
    logs[existingIndex] = { ...session };
  } else {
    // Add new
    logs.push({ ...session });
  }
  
  // Trim to max
  if (logs.length > MAX_STORED_LOGS) {
    logs.shift(); // Remove oldest
  }
  
  saveLogs(logs);
}

/**
 * Get all stored logs
 * @returns {Array} All logs
 */
export function getAllLogs() {
  return loadLogs();
}

/**
 * Get logs for a specific session
 * @param {string} sessionId - Session ID
 * @returns {Object|null} Log or null
 */
export function getLog(sessionId) {
  const logs = loadLogs();
  return logs.find(l => l.sessionId === sessionId) || null;
}

/**
 * Get recent logs
 * @param {number} count - Number of logs to get
 * @returns {Array} Recent logs
 */
export function getRecentLogs(count = 10) {
  const logs = loadLogs();
  return logs.slice(-count);
}

/**
 * Get logs by mode
 * @param {string} mode - Game mode
 * @returns {Array} Logs for mode
 */
export function getLogsByMode(mode) {
  const logs = loadLogs();
  return logs.filter(l => l.mode === mode);
}

/**
 * Get logs by outcome
 * @param {string} outcome - 'won' or 'lost'
 * @returns {Array} Logs with outcome
 */
export function getLogsByOutcome(outcome) {
  const logs = loadLogs();
  return logs.filter(l => l.outcome === outcome);
}

/**
 * Clear all stored logs
 */
export function clearAllLogs() {
  localStorage.removeItem(STORAGE_KEY);
  console.log('[GameLogStorage] All logs cleared');
}

/**
 * Export logs as JSON
 * @returns {Object} Export object
 */
export function exportLogs() {
  const logs = loadLogs();
  return {
    exportedAt: new Date().toISOString(),
    count: logs.length,
    logs
  };
}

/**
 * Get log statistics
 * @returns {Object} Stats
 */
export function getLogStats() {
  const logs = loadLogs();
  
  const stats = {
    totalGames: logs.length,
    wins: 0,
    losses: 0,
    byMode: {},
    avgMoves: 0,
    avgDuration: 0
  };
  
  let totalMoves = 0;
  let totalDuration = 0;
  let completedGames = 0;
  
  for (const log of logs) {
    // Outcomes
    if (log.outcome === 'won') stats.wins++;
    else if (log.outcome === 'lost') stats.losses++;
    
    // By mode
    if (!stats.byMode[log.mode]) {
      stats.byMode[log.mode] = { games: 0, wins: 0, losses: 0 };
    }
    stats.byMode[log.mode].games++;
    if (log.outcome === 'won') stats.byMode[log.mode].wins++;
    else stats.byMode[log.mode].losses++;
    
    // Averages
    if (log.completed) {
      totalMoves += log.moves || 0;
      totalDuration += log.duration || 0;
      completedGames++;
    }
  }
  
  if (completedGames > 0) {
    stats.avgMoves = Math.round(totalMoves / completedGames);
    stats.avgDuration = Math.round(totalDuration / completedGames);
  }
  
  return stats;
}

/**
 * Initialize debug API
 */
export function initLogStorageDebug() {
  if (!import.meta.env.DEV) return;
  
  window.__GAME_LOG_STORAGE__ = {
    getAll: getAllLogs,
    getRecent: getRecentLogs,
    getStats: getLogStats,
    export: exportLogs,
    clear: clearAllLogs
  };
  
  console.log('[GameLogStorage] Debug API: window.__GAME_LOG_STORAGE__');
}

export default {
  init: initLogStorage,
  startSession: startLogSession,
  endSession: endLogSession,
  logEvent: logSessionEvent,
  logMove: logSessionMove,
  logUndo: logSessionUndo,
  logFoundation: logSessionFoundation,
  logStockCycle: logSessionStockCycle,
  logNotification: logSessionNotification,
  getAll: getAllLogs,
  getRecent: getRecentLogs,
  getByMode: getLogsByMode,
  getByOutcome: getLogsByOutcome,
  getStats: getLogStats,
  export: exportLogs,
  clear: clearAllLogs,
  initDebug: initLogStorageDebug
};
