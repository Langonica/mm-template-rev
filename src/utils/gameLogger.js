/**
 * Game Lifecycle Logger
 * 
 * Tracks complete game sessions from start to finish for analysis.
 * Console-only output, DEV mode only.
 * 
 * @module gameLogger
 */

const LOGGER_VERSION = '1.0.0';

// In-memory log for current game
let currentGameLog = null;
let logEnabled = false;

/**
 * Initialize the logger
 * @param {boolean} enabled - Whether logging is enabled
 */
export function initGameLogger(enabled = import.meta.env.DEV) {
  logEnabled = enabled && import.meta.env.DEV;
  
  if (logEnabled) {
    window.__GAME_LOGGER__ = {
      getCurrentLog: () => currentGameLog,
      dumpLog: dumpCurrentLog,
      clearLog: clearCurrentLog
    };
    console.log('[GameLogger] Initialized. API: window.__GAME_LOGGER__');
  }
}

/**
 * Start logging a new game
 * @param {Object} params - Game start parameters
 */
export function logGameStart(params) {
  if (!logEnabled) return;
  
  const { gameId, mode, dealId, dealSeed, isCampaign, campaignLevel } = params;
  
  currentGameLog = {
    version: LOGGER_VERSION,
    gameId: gameId || generateGameId(),
    startTime: new Date().toISOString(),
    startTimestamp: Date.now(),
    mode,
    dealId,
    dealSeed,
    isCampaign: isCampaign || false,
    campaignLevel,
    events: [],
    moveCount: 0,
    undoCount: 0,
    stockCycles: 0,
    highestTier: 0,
    foundationCards: 0,
    eventsByType: {}
  };
  
  logEvent('GAME_START', {
    mode,
    dealId,
    dealSeed,
    isCampaign,
    campaignLevel
  });
  
  console.group(`[Game ${currentGameLog.gameId}] Started`);
  console.log('Mode:', mode);
  console.log('Deal:', dealId || dealSeed || 'random');
  if (isCampaign) console.log('Campaign Level:', campaignLevel);
}

/**
 * Log a game event
 * @param {string} type - Event type
 * @param {Object} data - Event data
 */
export function logEvent(type, data = {}) {
  if (!logEnabled || !currentGameLog) return;
  
  const event = {
    timestamp: Date.now(),
    type,
    ...data
  };
  
  currentGameLog.events.push(event);
  
  // Track event counts by type
  currentGameLog.eventsByType[type] = (currentGameLog.eventsByType[type] || 0) + 1;
  
  // Update counters based on event type
  switch (type) {
    case 'MOVE':
      currentGameLog.moveCount++;
      break;
    case 'UNDO':
      currentGameLog.undoCount++;
      break;
    case 'STOCK_CYCLE':
      currentGameLog.stockCycles++;
      break;
    case 'NOTIFICATION':
      if (data.tier && data.tier > currentGameLog.highestTier) {
        currentGameLog.highestTier = data.tier;
      }
      break;
    case 'FOUNDATION':
      currentGameLog.foundationCards = data.totalCards || currentGameLog.foundationCards;
      break;
  }
  
  // Log to console in real-time for key events
  if (['GAME_START', 'GAME_END', 'STOCK_CYCLE', 'NOTIFICATION'].includes(type)) {
    console.log(`[${type}]`, data);
  }
}

/**
 * Log a move
 * @param {Object} move - Move details
 */
export function logMove(move) {
  if (!logEnabled) return;
  
  const { type, from, to, card, moveNumber } = move;
  
  logEvent('MOVE', {
    moveNumber: moveNumber || currentGameLog?.moveCount + 1,
    type,
    from,
    to,
    card
  });
}

/**
 * Log undo action
 * @param {number} moveNumber - Current move number
 */
export function logUndo(moveNumber) {
  logEvent('UNDO', { moveNumber });
}

/**
 * Log foundation placement
 * @param {Object} foundation - Foundation details
 */
export function logFoundation(foundation) {
  const { suit, direction, cardCount, card } = foundation;
  
  logEvent('FOUNDATION', {
    suit,
    direction,
    card,
    cardCount,
    totalCards: (currentGameLog?.foundationCards || 0) + 1
  });
}

/**
 * Log stock cycle completion
 * @param {number} cycleNumber - Which cycle
 */
export function logStockCycle(cycleNumber) {
  logEvent('STOCK_CYCLE', { cycleNumber });
}

/**
 * Log notification tier change
 * @param {string} tier - Tier name
 * @param {number} tierNum - Tier number (1-4)
 */
export function logNotification(tier, tierNum) {
  logEvent('NOTIFICATION', { tier, tierNum });
}

/**
 * Log game end
 * @param {Object} result - Game result
 */
export function logGameEnd(result) {
  if (!logEnabled || !currentGameLog) return;
  
  const { outcome, moves, duration, won } = result;
  
  const endTime = new Date().toISOString();
  const actualDuration = duration || (Date.now() - currentGameLog.startTimestamp);
  
  currentGameLog.endTime = endTime;
  currentGameLog.duration = actualDuration;
  currentGameLog.outcome = outcome;
  currentGameLog.won = won;
  
  logEvent('GAME_END', {
    outcome,
    moves,
    duration: actualDuration,
    won
  });
  
  console.groupEnd();
  
  // Print summary
  console.group('[Game Summary]');
  console.log('Result:', outcome.toUpperCase());
  console.log('Moves:', moves);
  console.log('Duration:', formatDuration(actualDuration));
  console.log('Undos:', currentGameLog.undoCount);
  console.log('Stock Cycles:', currentGameLog.stockCycles);
  console.log('Highest Tier:', currentGameLog.highestTier);
  console.log('Foundation Cards:', currentGameLog.foundationCards);
  console.groupEnd();
  
  // Dump full log
  dumpCurrentLog();
}

/**
 * Dump current log to console
 */
export function dumpCurrentLog() {
  if (!logEnabled || !currentGameLog) return;
  
  console.log('[GameLogger] Full Log:', JSON.parse(JSON.stringify(currentGameLog)));
}

/**
 * Clear current log
 */
export function clearCurrentLog() {
  currentGameLog = null;
  console.log('[GameLogger] Log cleared');
}

/**
 * Generate unique game ID
 * @returns {string} Game ID
 */
function generateGameId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
}

/**
 * Format duration in seconds to readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default {
  init: initGameLogger,
  gameStart: logGameStart,
  gameEnd: logGameEnd,
  move: logMove,
  undo: logUndo,
  foundation: logFoundation,
  stockCycle: logStockCycle,
  notification: logNotification,
  event: logEvent,
  dump: dumpCurrentLog,
  clear: clearCurrentLog
};
