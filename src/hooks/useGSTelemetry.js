/**
 * Game State Telemetry Hook
 * 
 * Tracks false positive/negative rates for the game state notification system.
 * Helps tune thresholds and identify edge cases.
 * 
 * @module useGSTelemetry
 */

import { useCallback, useRef, useEffect } from 'react'

const STORAGE_KEY = 'meridian-gs-telemetry'
const TELEMETRY_VERSION = '1.0'

/**
 * Telemetry entry for a single game
 * @typedef {Object} GameTelemetry
 * @property {string} gameId - Unique game identifier (timestamp-based)
 * @property {string} startTime - ISO timestamp of game start
 * @property {string} endTime - ISO timestamp of game end
 * @property {string} outcome - 'won' | 'lost' | 'forfeit' | 'incomplete'
 * @property {string} mode - Game mode (classic, hidden, etc.)
 * @property {number} moves - Total moves made
 * @property {number} highestTier - Highest notification tier reached (0=none, 1=hint, 2=concern, 3=warning, 4=confirmed)
 * @property {boolean} wasDismissed - User dismissed at least one notification
 * @property {boolean} ignoredWarning - User chose "keep playing" after warning tier
 * @property {boolean} eventuallyWon - Whether user won after ignoring warnings
 * @property {number} cycleCount - Number of unproductive cycles detected
 * @property {number} solverChecked - Number of times solver ran
 * @property {string} solverResult - 'winnable' | 'unwinnable' | 'timeout' | 'none'
 */

/**
 * Hook for tracking game state notification telemetry
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether telemetry is enabled (default: true in DEV, false in production)
 * @returns {Object} Telemetry methods and state
 */
export function useGSTelemetry(options = {}) {
  const { enabled = import.meta.env.DEV } = options
  
  // Current game tracking (in-memory only during game)
  const currentGameRef = useRef(null)
  
  // Session stats (aggregated)
  const sessionStatsRef = useRef({
    gamesStarted: 0,
    gamesCompleted: 0,
    falsePositives: 0,  // Warning shown but user won
    falseNegatives: 0,  // No warning but game unwinnable
    dismissedWarnings: 0,
    ignoredWarnings: 0,
    ignoredButWon: 0,
  })

  /**
   * Start tracking a new game
   */
  const startGame = useCallback((mode) => {
    if (!enabled) return
    
    const gameId = Date.now().toString(36)
    currentGameRef.current = {
      gameId,
      startTime: new Date().toISOString(),
      mode,
      outcome: 'incomplete',
      highestTier: 0,
      wasDismissed: false,
      ignoredWarning: false,
      eventuallyWon: false,
      cycleCount: 0,
      solverChecked: 0,
      solverResult: 'none',
    }
    
    sessionStatsRef.current.gamesStarted++
  }, [enabled])

  /**
   * Record notification tier escalation
   */
  const recordTier = useCallback((tier) => {
    if (!enabled || !currentGameRef.current) return
    
    const tierNum = typeof tier === 'string' 
      ? { none: 0, hint: 1, concern: 2, warning: 3, confirmed: 4 }[tier] || 0
      : tier
      
    if (tierNum > currentGameRef.current.highestTier) {
      currentGameRef.current.highestTier = tierNum
    }
  }, [enabled])

  /**
   * Record user dismissed a notification
   */
  const recordDismissal = useCallback(() => {
    if (!enabled || !currentGameRef.current) return
    
    currentGameRef.current.wasDismissed = true
    sessionStatsRef.current.dismissedWarnings++
  }, [enabled])

  /**
   * Record user chose to keep playing despite warning
   */
  const recordIgnoredWarning = useCallback(() => {
    if (!enabled || !currentGameRef.current) return
    
    currentGameRef.current.ignoredWarning = true
    sessionStatsRef.current.ignoredWarnings++
  }, [enabled])

  /**
   * Record solver check
   */
  const recordSolverCheck = useCallback((result) => {
    if (!enabled || !currentGameRef.current) return
    
    currentGameRef.current.solverChecked++
    currentGameRef.current.solverResult = result
  }, [enabled])

  /**
   * Record cycle count update
   */
  const recordCycleCount = useCallback((count) => {
    if (!enabled || !currentGameRef.current) return
    
    currentGameRef.current.cycleCount = Math.max(
      currentGameRef.current.cycleCount,
      count
    )
  }, [enabled])

  /**
   * End game tracking and analyze results
   */
  const endGame = useCallback((outcome, moves) => {
    if (!enabled || !currentGameRef.current) return
    
    const game = currentGameRef.current
    game.endTime = new Date().toISOString()
    game.outcome = outcome
    game.moves = moves
    game.eventuallyWon = outcome === 'won'
    
    // Analyze for false positives/negatives
    if (game.highestTier >= 3 && outcome === 'won') {
      // Warning shown but user won = potential false positive
      sessionStatsRef.current.falsePositives++
      console.log('[Telemetry] Potential false positive detected:', game)
    }
    
    if (game.highestTier < 3 && outcome === 'lost' && game.solverResult === 'unwinnable') {
      // No warning but game was unwinnable = potential false negative
      sessionStatsRef.current.falseNegatives++
      console.log('[Telemetry] Potential false negative detected:', game)
    }
    
    if (game.ignoredWarning && outcome === 'won') {
      sessionStatsRef.current.ignoredButWon++
    }
    
    sessionStatsRef.current.gamesCompleted++
    
    // Persist to localStorage for analysis
    persistGame(game)
    
    currentGameRef.current = null
  }, [enabled])

  /**
   * Get current session statistics
   */
  const getSessionStats = useCallback(() => {
    return { ...sessionStatsRef.current }
  }, [])

  /**
   * Get detailed report of recent games
   */
  const getRecentGames = useCallback((limit = 10) => {
    if (typeof window === 'undefined') return []
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      const games = data.games || []
      return games.slice(-limit)
    } catch {
      return []
    }
  }, [])

  /**
   * Calculate false positive rate
   */
  const getFalsePositiveRate = useCallback(() => {
    const stats = sessionStatsRef.current
    if (stats.gamesCompleted === 0) return 0
    return stats.falsePositives / stats.gamesCompleted
  }, [])

  /**
   * Calculate false negative rate
   */
  const getFalseNegativeRate = useCallback(() => {
    const stats = sessionStatsRef.current
    if (stats.gamesCompleted === 0) return 0
    return stats.falseNegatives / stats.gamesCompleted
  }, [])

  /**
   * Reset session statistics
   */
  const resetSessionStats = useCallback(() => {
    sessionStatsRef.current = {
      gamesStarted: 0,
      gamesCompleted: 0,
      falsePositives: 0,
      falseNegatives: 0,
      dismissedWarnings: 0,
      ignoredWarnings: 0,
      ignoredButWon: 0,
    }
  }, [])

  /**
   * Clear persisted telemetry data
   */
  const clearPersistedData = useCallback(() => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // Persist a single game to localStorage
  const persistGame = (game) => {
    if (typeof window === 'undefined') return
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      data.version = TELEMETRY_VERSION
      data.games = data.games || []
      data.games.push(game)
      // Keep last 100 games to avoid storage bloat
      if (data.games.length > 100) {
        data.games = data.games.slice(-100)
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
      console.warn('[Telemetry] Failed to persist game:', e)
    }
  }

  // Expose debug API in DEV mode
  useEffect(() => {
    if (!enabled || !import.meta.env.DEV) return
    
    window.__GS_TELEMETRY__ = {
      getSessionStats,
      getRecentGames,
      getFalsePositiveRate,
      getFalseNegativeRate,
      resetSessionStats,
      clearPersistedData,
    }
    
    console.log('[Telemetry] Debug API available at window.__GS_TELEMETRY__')
    
    return () => {
      delete window.__GS_TELEMETRY__
    }
  }, [enabled, getSessionStats, getRecentGames, getFalsePositiveRate, 
      getFalseNegativeRate, resetSessionStats, clearPersistedData])

  return {
    startGame,
    endGame,
    recordTier,
    recordDismissal,
    recordIgnoredWarning,
    recordSolverCheck,
    recordCycleCount,
    getSessionStats,
    getRecentGames,
    getFalsePositiveRate,
    getFalseNegativeRate,
    resetSessionStats,
    clearPersistedData,
    enabled,
  }
}

export default useGSTelemetry
