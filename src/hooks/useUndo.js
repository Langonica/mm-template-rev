import { useState, useCallback, useRef } from 'react';
import { deepClone } from '../utils/cardUtils';

/**
 * Undo/Redo Manager Class
 * Manages move history with efficient state snapshots
 * Uses native structuredClone when available (Performance fix - Phase 1)
 */
class UndoManager {
  constructor(maxHistorySize = 100) {
    this.history = [];
    this.currentIndex = -1;
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Record a move in history
   */
  recordMove(move, previousState) {
    // Remove any "future" history if we're not at the end
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // Add new move with deep clone of state
    // Uses structuredClone when available for better performance (Phase 1)
    this.history.push({
      move,
      previousState: deepClone(previousState),
      timestamp: Date.now()
    });

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }

  /**
   * Get previous state for undo
   */
  undo() {
    if (!this.canUndo()) {
      return null;
    }

    const entry = this.history[this.currentIndex];
    this.currentIndex--;
    return entry.previousState;
  }

  /**
   * Get next state for redo (move forward)
   */
  redo() {
    if (!this.canRedo()) {
      return null;
    }

    this.currentIndex++;
    
    // For redo, we need the state AFTER the move
    // This is stored in the next history entry
    if (this.currentIndex < this.history.length - 1) {
      return this.history[this.currentIndex + 1].previousState;
    }
    
    return null;
  }

  /**
   * Check if undo is available
   */
  canUndo() {
    return this.currentIndex >= 0;
  }

  /**
   * Check if redo is available
   */
  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Get move count
   */
  getMoveCount() {
    return this.history.length;
  }

  /**
   * Clear all history
   */
  clear() {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * Get last move details for display
   */
  getLastMove() {
    if (this.currentIndex >= 0) {
      return this.history[this.currentIndex].move;
    }
    return null;
  }

  /**
   * Export history for save game
   */
  export() {
    return {
      history: this.history,
      currentIndex: this.currentIndex
    };
  }

  /**
   * Import history from saved game
   */
  import(data) {
    if (data && Array.isArray(data.history)) {
      this.history = data.history;
      this.currentIndex = data.currentIndex ?? -1;
    }
  }
}

/**
 * React hook for undo/redo functionality
 */
export const useUndo = () => {
  const undoManagerRef = useRef(new UndoManager());
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [moveCount, setMoveCount] = useState(0);

  // Update undo/redo availability
  const updateUndoState = useCallback(() => {
    const manager = undoManagerRef.current;
    setCanUndo(manager.canUndo());
    setCanRedo(manager.canRedo());
    setMoveCount(manager.getMoveCount());
  }, []);

  // Record a move
  const recordMove = useCallback((move, previousState) => {
    undoManagerRef.current.recordMove(move, previousState);
    updateUndoState();
  }, [updateUndoState]);

  // Undo last move
  const undo = useCallback(() => {
    const previousState = undoManagerRef.current.undo();
    updateUndoState();
    return previousState;
  }, [updateUndoState]);

  // Redo next move
  const redo = useCallback(() => {
    const nextState = undoManagerRef.current.redo();
    updateUndoState();
    return nextState;
  }, [updateUndoState]);

  // Clear history
  const clearHistory = useCallback(() => {
    undoManagerRef.current.clear();
    updateUndoState();
  }, [updateUndoState]);

  // Get last move
  const getLastMove = useCallback(() => {
    return undoManagerRef.current.getLastMove();
  }, []);

  return {
    canUndo,
    canRedo,
    moveCount,
    recordMove,
    undo,
    redo,
    clearHistory,
    getLastMove
  };
};
