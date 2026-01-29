import { useState, useCallback, useEffect, useRef } from 'react';
import { validateStats, safeParseAndValidate } from '../utils/storageValidation';

const STORAGE_KEY = 'meridian_solitaire_stats';
const SESSION_KEY = 'meridian_solitaire_session';

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
  // Enhanced metrics
  totalCardsMoved: 0,
  perfectGames: 0, // Wins with no undos
  foundationsCompleted: 0, // Total foundations completed across all games
  totalUndosUsed: 0, // Total undos across all games
  byMode: {
    classic: { games: 0, wins: 0, forfeits: 0, bestMoves: null, bestTime: null, perfectGames: 0 },
    classic_double: { games: 0, wins: 0, forfeits: 0, bestMoves: null, bestTime: null, perfectGames: 0 },
    hidden: { games: 0, wins: 0, forfeits: 0, bestMoves: null, bestTime: null, perfectGames: 0 },
    hidden_double: { games: 0, wins: 0, forfeits: 0, bestMoves: null, bestTime: null, perfectGames: 0 }
  },
  lastPlayed: null
};

const DEFAULT_SESSION = {
  date: new Date().toDateString(),
  gamesPlayed: 0,
  gamesWon: 0,
  totalMoves: 0,
  totalTime: 0,
  cardsMoved: 0,
  undosUsed: 0
};

// Map old mode names to new ones for backwards compatibility
const MODE_MIGRATION = {
  double_pocket: 'classic_double',
  traditional: 'hidden',
  expert: 'hidden_double'
};

// Load stats from localStorage with validation
const loadStats = (onError) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      // Parse and validate the stored data
      const parseResult = safeParseAndValidate(stored, validateStats);
      
      if (!parseResult.success) {
        console.error('Stats validation failed:', parseResult.error);
        if (onError) onError('Game statistics were corrupted and have been reset.');
        return { ...DEFAULT_STATS };
      }
      
      const parsed = parseResult.data;

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
              perfectGames: (existingStats.perfectGames || 0) + (oldStats.perfectGames || 0),
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
    if (onError) onError('Failed to load game statistics. Your progress may have been reset.');
  }
  return { ...DEFAULT_STATS };
};

// Save stats to localStorage
const saveStats = (stats, onError) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save stats:', e);
    if (onError) onError('Failed to save game statistics. Your progress may not be preserved.');
  }
};

// Load or initialize session stats
const loadSession = () => {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const today = new Date().toDateString();
      // Reset if it's a new day
      if (parsed.date !== today) {
        return { ...DEFAULT_SESSION, date: today };
      }
      return { ...DEFAULT_SESSION, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load session:', e);
  }
  return { ...DEFAULT_SESSION };
};

// Save session to localStorage
const saveSession = (session) => {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.error('Failed to save session:', e);
  }
};

export const useGameStats = (onError) => {
  const [stats, setStats] = useState(() => loadStats(onError));
  const [session, setSession] = useState(() => loadSession());
  const gameStartTimeRef = useRef(null);
  const [currentGameTime, setCurrentGameTime] = useState(0);
  const timerIntervalRef = useRef(null);
  const pausedTimeRef = useRef(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Per-game tracking (reset each game)
  const gameTrackingRef = useRef({
    cardsMoved: 0,
    undosUsed: 0,
    foundationsCompleted: 0
  });

  // Start tracking a new game
  const recordGameStart = useCallback(() => {
    gameStartTimeRef.current = Date.now();
    pausedTimeRef.current = 0;
    setCurrentGameTime(0);
    setIsPaused(false);
    
    // Reset per-game tracking
    gameTrackingRef.current = {
      cardsMoved: 0,
      undosUsed: 0,
      foundationsCompleted: 0
    };

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

  // Track card movement
  const recordCardsMoved = useCallback((count = 1) => {
    gameTrackingRef.current.cardsMoved += count;
  }, []);

  // Track undo usage
  const recordUndo = useCallback(() => {
    gameTrackingRef.current.undosUsed += 1;
    
    // Update session undos
    setSession(prev => {
      const updated = { ...prev, undosUsed: prev.undosUsed + 1 };
      saveSession(updated);
      return updated;
    });
  }, []);

  // Track foundation completion
  const recordFoundationCompleted = useCallback(() => {
    gameTrackingRef.current.foundationsCompleted += 1;
  }, []);

  // Record game end (win or loss)
  const recordGameEnd = useCallback((won, moves, mode) => {
    const duration = getGameDuration();
    stopTimer();
    
    const { cardsMoved, undosUsed, foundationsCompleted } = gameTrackingRef.current;
    const isPerfectGame = won && undosUsed === 0;

    setStats(prevStats => {
      const newStats = { ...prevStats };

      // Update totals
      newStats.totalGames += 1;
      newStats.totalMoves += moves;
      newStats.totalPlayTime += duration;
      // Enhanced metrics
      newStats.totalCardsMoved += cardsMoved;
      newStats.totalUndosUsed += undosUsed;
      newStats.foundationsCompleted += foundationsCompleted;
      newStats.lastPlayed = Date.now();

      if (won) {
        newStats.wins += 1;
        newStats.currentStreak += 1;
        
        // Perfect game tracking
        if (isPerfectGame) {
          newStats.perfectGames += 1;
        }

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
          
          // Perfect games by mode
          if (isPerfectGame) {
            newStats.byMode[mode].perfectGames = (newStats.byMode[mode].perfectGames || 0) + 1;
          }

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
      saveStats(newStats, onError);

      return newStats;
    });
    
    // Update session stats
    setSession(prev => {
      const updated = {
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1,
        gamesWon: prev.gamesWon + (won ? 1 : 0),
        totalMoves: prev.totalMoves + moves,
        totalTime: prev.totalTime + duration,
        cardsMoved: prev.cardsMoved + cardsMoved
      };
      saveSession(updated);
      return updated;
    });

    // Return game stats for display
    return {
      duration,
      moves,
      won,
      cardsMoved,
      undosUsed,
      foundationsCompleted,
      isPerfectGame
    };
  }, [getGameDuration, stopTimer, onError]);

  // Record a forfeit (abandoned game)
  const recordForfeit = useCallback((moves, mode) => {
    const duration = getGameDuration();
    stopTimer();
    
    const { cardsMoved, undosUsed, foundationsCompleted } = gameTrackingRef.current;

    setStats(prevStats => {
      const newStats = { ...prevStats };

      // Update totals - forfeits count as games played
      newStats.totalGames += 1;
      newStats.forfeits += 1;
      newStats.totalMoves += moves;
      newStats.totalPlayTime += duration;
      // Enhanced metrics
      newStats.totalCardsMoved += cardsMoved;
      newStats.totalUndosUsed += undosUsed;
      newStats.foundationsCompleted += foundationsCompleted;
      newStats.lastPlayed = Date.now();

      // Forfeits break the win streak
      newStats.currentStreak = 0;

      // Update mode-specific stats
      if (mode && newStats.byMode[mode]) {
        newStats.byMode[mode].games += 1;
        newStats.byMode[mode].forfeits = (newStats.byMode[mode].forfeits || 0) + 1;
      }

      // Save to localStorage
      saveStats(newStats, onError);

      return newStats;
    });
    
    // Update session stats
    setSession(prev => {
      const updated = {
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1,
        totalMoves: prev.totalMoves + moves,
        totalTime: prev.totalTime + duration,
        cardsMoved: prev.cardsMoved + cardsMoved,
        undosUsed: prev.undosUsed + undosUsed
      };
      saveSession(updated);
      return updated;
    });

    return { duration, moves, forfeited: true };
  }, [getGameDuration, stopTimer, onError]);

  // Reset all stats
  const resetStats = useCallback(() => {
    const freshStats = { ...DEFAULT_STATS };
    const freshSession = { ...DEFAULT_SESSION, date: new Date().toDateString() };
    setStats(freshStats);
    setSession(freshSession);
    saveStats(freshStats, onError);
    saveSession(freshSession);
    gameStartTimeRef.current = null;
    setCurrentGameTime(0);
    stopTimer();
  }, [stopTimer, onError]);

  // Calculate derived stats
  const getWinRate = useCallback(() => {
    if (stats.totalGames === 0) return 0;
    return Math.round((stats.wins / stats.totalGames) * 100);
  }, [stats.totalGames, stats.wins]);


  
  // Get perfect game rate
  const getPerfectGameRate = useCallback(() => {
    if (stats.wins === 0) return 0;
    return Math.round((stats.perfectGames / stats.wins) * 100);
  }, [stats.wins, stats.perfectGames]);
  
  // Get session win rate
  const getSessionWinRate = useCallback(() => {
    if (session.gamesPlayed === 0) return 0;
    return Math.round((session.gamesWon / session.gamesPlayed) * 100);
  }, [session]);

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
  
  // Format large numbers (e.g., 1234 → 1.2K)
  const formatNumber = useCallback((num) => {
    if (num === null || num === undefined) return '--';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
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
    session,
    currentGameTime,
    isPaused,
    recordGameStart,
    recordGameEnd,
    recordForfeit,
    recordCardsMoved,
    recordUndo,
    recordFoundationCompleted,
    resetStats,
    pauseTimer,
    resumeTimer,
    getGameDuration,
    getWinRate,
    getPerfectGameRate,
    getSessionWinRate,
    formatTime,
    formatNumber
  };
};
