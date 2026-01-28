import { useState, useCallback, useEffect, useRef } from 'react';

const STORAGE_KEY = 'meridian_solitaire_stats';

const DEFAULT_STATS = {
  totalGames: 0,
  wins: 0,
  losses: 0,
  forfeits: 0,
  currentStreak: 0,
  bestStreak: 0,
  bestWinMoves: null,
  bestWinTime: null,
  totalMoves: 0,
  totalPlayTime: 0,
  byMode: {
    classic: { games: 0, wins: 0, forfeits: 0, bestMoves: null, bestTime: null },
    classic_double: { games: 0, wins: 0, forfeits: 0, bestMoves: null, bestTime: null },
    hidden: { games: 0, wins: 0, forfeits: 0, bestMoves: null, bestTime: null },
    hidden_double: { games: 0, wins: 0, forfeits: 0, bestMoves: null, bestTime: null }
  },
  lastPlayed: null
};

// Map old mode names to new ones for backwards compatibility
const MODE_MIGRATION = {
  double_pocket: 'classic_double',
  traditional: 'hidden',
  expert: 'hidden_double'
};

// Load stats from localStorage
const loadStats = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);

      // Migrate old mode names to new ones
      const migratedByMode = { ...DEFAULT_STATS.byMode };
      if (parsed.byMode) {
        for (const [oldKey, newKey] of Object.entries(MODE_MIGRATION)) {
          if (parsed.byMode[oldKey]) {
            // Merge old stats into new mode key
            const oldStats = parsed.byMode[oldKey];
            const existingStats = migratedByMode[newKey] || DEFAULT_STATS.byMode[newKey];
            migratedByMode[newKey] = {
              games: (existingStats.games || 0) + (oldStats.games || 0),
              wins: (existingStats.wins || 0) + (oldStats.wins || 0),
              forfeits: (existingStats.forfeits || 0) + (oldStats.forfeits || 0),
              bestMoves: oldStats.bestMoves !== null
                ? (existingStats.bestMoves !== null ? Math.min(existingStats.bestMoves, oldStats.bestMoves) : oldStats.bestMoves)
                : existingStats.bestMoves,
              bestTime: oldStats.bestTime !== null
                ? (existingStats.bestTime !== null ? Math.min(existingStats.bestTime, oldStats.bestTime) : oldStats.bestTime)
                : existingStats.bestTime
            };
          }
        }
        // Also keep any new mode stats that already exist
        for (const key of Object.keys(DEFAULT_STATS.byMode)) {
          if (parsed.byMode[key] && !MODE_MIGRATION[key]) {
            migratedByMode[key] = { ...migratedByMode[key], ...parsed.byMode[key] };
          }
        }
      }

      // Merge with defaults to handle any missing fields from older versions
      return {
        ...DEFAULT_STATS,
        ...parsed,
        byMode: migratedByMode
      };
    }
  } catch (e) {
    console.error('Failed to load stats:', e);
  }
  return { ...DEFAULT_STATS };
};

// Save stats to localStorage
const saveStats = (stats) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save stats:', e);
  }
};

export const useGameStats = () => {
  const [stats, setStats] = useState(loadStats);
  const gameStartTimeRef = useRef(null);
  const [currentGameTime, setCurrentGameTime] = useState(0);
  const timerIntervalRef = useRef(null);
  const pausedTimeRef = useRef(0); // Accumulated time before current pause
  const [isPaused, setIsPaused] = useState(false);

  // Start tracking a new game
  const recordGameStart = useCallback(() => {
    gameStartTimeRef.current = Date.now();
    pausedTimeRef.current = 0;
    setCurrentGameTime(0);
    setIsPaused(false);

    // Start timer interval for live display
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    timerIntervalRef.current = setInterval(() => {
      if (gameStartTimeRef.current) {
        const elapsed = pausedTimeRef.current + Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        setCurrentGameTime(elapsed);
      }
    }, 1000);
  }, []);

  // Pause the game timer
  const pauseTimer = useCallback(() => {
    if (isPaused || !gameStartTimeRef.current) return;

    // Stop the interval
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Accumulate elapsed time
    pausedTimeRef.current += Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
    gameStartTimeRef.current = null;
    setIsPaused(true);
  }, [isPaused]);

  // Resume the game timer
  const resumeTimer = useCallback(() => {
    if (!isPaused) return;

    // Reset start time to now (pausedTimeRef already holds accumulated time)
    gameStartTimeRef.current = Date.now();
    setIsPaused(false);

    // Restart the interval
    timerIntervalRef.current = setInterval(() => {
      if (gameStartTimeRef.current) {
        const elapsed = pausedTimeRef.current + Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        setCurrentGameTime(elapsed);
      }
    }, 1000);
  }, [isPaused]);

  // Stop the timer (called when game ends)
  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Get current game duration in seconds (includes paused time)
  const getGameDuration = useCallback(() => {
    if (isPaused) {
      return pausedTimeRef.current;
    }
    if (!gameStartTimeRef.current) return pausedTimeRef.current;
    return pausedTimeRef.current + Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
  }, [isPaused]);

  // Record game end (win or loss)
  const recordGameEnd = useCallback((won, moves, mode) => {
    const duration = getGameDuration();
    stopTimer();

    setStats(prevStats => {
      const newStats = { ...prevStats };

      // Update totals
      newStats.totalGames += 1;
      newStats.totalMoves += moves;
      newStats.totalPlayTime += duration;
      newStats.lastPlayed = Date.now();

      if (won) {
        newStats.wins += 1;
        newStats.currentStreak += 1;

        // Update best streak
        if (newStats.currentStreak > newStats.bestStreak) {
          newStats.bestStreak = newStats.currentStreak;
        }

        // Update best win (fewest moves)
        if (newStats.bestWinMoves === null || moves < newStats.bestWinMoves) {
          newStats.bestWinMoves = moves;
        }

        // Update best win time
        if (newStats.bestWinTime === null || duration < newStats.bestWinTime) {
          newStats.bestWinTime = duration;
        }
      } else {
        newStats.losses += 1;
        newStats.currentStreak = 0;
      }

      // Update mode-specific stats
      if (mode && newStats.byMode[mode]) {
        newStats.byMode[mode].games += 1;
        if (won) {
          newStats.byMode[mode].wins += 1;

          // Update mode best moves
          if (newStats.byMode[mode].bestMoves === null || moves < newStats.byMode[mode].bestMoves) {
            newStats.byMode[mode].bestMoves = moves;
          }

          // Update mode best time
          if (newStats.byMode[mode].bestTime === null || duration < newStats.byMode[mode].bestTime) {
            newStats.byMode[mode].bestTime = duration;
          }
        }
      }

      // Save to localStorage
      saveStats(newStats);

      return newStats;
    });

    // Return game stats for display
    return {
      duration,
      moves,
      won
    };
  }, [getGameDuration, stopTimer]);

  // Record a forfeit (abandoned game)
  const recordForfeit = useCallback((moves, mode) => {
    const duration = getGameDuration();
    stopTimer();

    setStats(prevStats => {
      const newStats = { ...prevStats };

      // Update totals - forfeits count as games played
      newStats.totalGames += 1;
      newStats.forfeits += 1;
      newStats.totalMoves += moves;
      newStats.totalPlayTime += duration;
      newStats.lastPlayed = Date.now();

      // Forfeits break the win streak
      newStats.currentStreak = 0;

      // Update mode-specific stats
      if (mode && newStats.byMode[mode]) {
        newStats.byMode[mode].games += 1;
        newStats.byMode[mode].forfeits = (newStats.byMode[mode].forfeits || 0) + 1;
      }

      // Save to localStorage
      saveStats(newStats);

      return newStats;
    });

    return { duration, moves, forfeited: true };
  }, [getGameDuration, stopTimer]);

  // Reset all stats
  const resetStats = useCallback(() => {
    const freshStats = { ...DEFAULT_STATS };
    setStats(freshStats);
    saveStats(freshStats);
    gameStartTimeRef.current = null;
    setCurrentGameTime(0);
    stopTimer();
  }, [stopTimer]);

  // Calculate derived stats
  const getWinRate = useCallback(() => {
    if (stats.totalGames === 0) return 0;
    return Math.round((stats.wins / stats.totalGames) * 100);
  }, [stats.totalGames, stats.wins]);

  const getAverageMovesPerWin = useCallback(() => {
    if (stats.wins === 0) return null;
    // This is approximate since we track total moves across all games
    // For accuracy, we'd need to track moves per win separately
    return null; // Not tracking this granularly
  }, [stats.wins]);

  // Format time for display (seconds to MM:SS or HH:MM:SS)
  const formatTime = useCallback((seconds) => {
    if (seconds === null || seconds === undefined) return '--:--';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  return {
    stats,
    currentGameTime,
    isPaused,
    recordGameStart,
    recordGameEnd,
    recordForfeit,
    resetStats,
    pauseTimer,
    resumeTimer,
    getGameDuration,
    getWinRate,
    formatTime
  };
};
