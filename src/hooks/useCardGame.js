import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ALL_SNAPSHOTS } from '../data/snapshots/allSnapshots';
import { useDragDrop } from './useDragDrop';
import { useUndo } from './useUndo';
import { useTouchDrag, isTouchDevice } from './useTouchDrag';
import {
  executeMove,
  tryAutoMove,
  getGameStatus,
  getAvailableMoves,
  GameStateTracker,
  canAutoComplete,
  getAllFoundationMoves,
  executeFoundationMove,
  getHints,
  getBestHint
} from '../utils/gameLogic';
import { findCardLocation, parseCard, canPlaceOnFoundation, deepClone } from '../utils/cardUtils';

export const useCardGame = () => {
  const [config, setConfig] = useState({
    mode: 'classic',
    variant: 'normal',
    isFun: false,
    isTouchDevice: isTouchDevice(),
    rotationSeed: Math.floor(Math.random() * 1000)
  });
  
  const [currentStockCards, setCurrentStockCards] = useState([]);
  const [currentWasteCards, setCurrentWasteCards] = useState([]);
  const [currentSnapshot, setCurrentSnapshot] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [moveCount, setMoveCount] = useState(0);
  const [animatingCard, setAnimatingCard] = useState(null); // For portal animations
  const [autoMoveAnimation, setAutoMoveAnimation] = useState(null); // For foundation auto-move animations

  // Circular play detection state
  const [circularPlayState, setCircularPlayState] = useState({
    isCircular: false,
    cycleCount: 0,
    isNoProgress: false,
    movesSinceProgress: 0,
    warningLevel: 'none' // 'none' | 'caution' | 'critical' | 'stalled'
  });

  // Auto-complete detection state (Phase 4)
  const [, setAutoCompleteAvailable] = useState(false);

  // Initialize undo system
  const undoSystem = useUndo();

  // Initialize game state tracker (for circular play detection)
  const [stateTracker] = useState(() => new GameStateTracker());

  // Helper: Calculate warning level based on tracker state
  const calculateWarningLevel = useCallback((trackerResult) => {
    const { cycleCount, movesSinceProgress, isCircular, isNoProgress } = trackerResult;
    
    // Stalled: 20+ moves without progress
    if (isNoProgress || movesSinceProgress >= 20) {
      return 'stalled';
    }
    
    // Critical: 3+ cycles (circular play detected)
    if (isCircular || cycleCount >= 3) {
      return 'critical';
    }
    
    // Caution: 2 cycles or 15+ moves without progress
    if (cycleCount >= 2 || movesSinceProgress >= 15) {
      return 'caution';
    }
    
    return 'none';
  }, []);

  // Helper: Update circular play state after move
  const updateCircularPlayState = useCallback((trackerResult) => {
    const warningLevel = calculateWarningLevel(trackerResult);
    
    setCircularPlayState({
      isCircular: trackerResult.circular,
      cycleCount: trackerResult.cycleCount,
      isNoProgress: trackerResult.noProgress,
      movesSinceProgress: trackerResult.movesSinceProgress,
      warningLevel
    });
    
    return warningLevel;
  }, [calculateWarningLevel]);

  // Helper: Check if auto-complete is available (Phase 4)
  const checkAutoComplete = useCallback((currentState) => {
    if (!currentState) {
      setAutoCompleteAvailable(false);
      return false;
    }
    
    const available = canAutoComplete(currentState);
    setAutoCompleteAvailable(available);
    return available;
  }, []);
  
  // ============================================================================
  // HINT SYSTEM (Phase 6) - MUST BE BEFORE AUTO-COMPLETE (uses clearHint)
  // ============================================================================
  
  const [currentHint, setCurrentHint] = useState(null);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [hintCards, setHintCards] = useState([]); // Cards to highlight
  
  // Clear current hint - defined early so auto-complete can use it
  const clearHint = useCallback(() => {
    setCurrentHint(null);
    setHintCards([]);
  }, []);
  
  // Show a hint
  const showHint = useCallback(() => {
    if (!gameState || hintsRemaining <= 0) return;
    
    const hint = getBestHint(gameState);
    if (!hint) {
      // No hints available
      setCurrentHint({ type: 'none', message: 'No moves available' });
      setTimeout(() => setCurrentHint(null), 2000);
      return;
    }
    
    // Set the hint
    setCurrentHint(hint);
    
    // Highlight the card(s) that can move
    if (hint.card) {
      setHintCards([hint.card]);
    }
    
    // Decrement hints
    setHintsRemaining(prev => prev - 1);
    
    // Auto-clear hint after 5 seconds
    setTimeout(() => {
      setCurrentHint(null);
      setHintCards([]);
    }, 5000);
  }, [gameState, hintsRemaining]);
  
  // Reset hints (for new game)
  const resetHints = useCallback(() => {
    setHintsRemaining(3);
    setCurrentHint(null);
    setHintCards([]);
  }, []);
  
  // Keyboard shortcut for hints (H key)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'h' || e.key === 'H') {
        // Don't trigger if typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          return;
        }
        showHint();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHint]);
  
  // State for auto-complete execution (Phase 5)
  const [isAutoCompleting, setIsAutoCompleting] = useState(false);
  const autoCompleteAbortRef = useRef(false);
  
  // Execute auto-complete: Play all available cards to foundations
  const executeAutoComplete = useCallback(async () => {
    if (!gameState || isAutoCompleting) return;
    
    // Verify auto-complete is still available
    if (!canAutoComplete(gameState)) return;
    
    setIsAutoCompleting(true);
    autoCompleteAbortRef.current = false;
    
    // Record initial state for undo
    const initialState = deepClone(gameState);
    
    let currentState = gameState;
    let movesMade = 0;
    const maxMoves = 52; // Safety limit
    
    // Find and execute foundation moves until no more available
    while (movesMade < maxMoves && !autoCompleteAbortRef.current) {
      const moves = getAllFoundationMoves(currentState);
      
      if (moves.length === 0) break;
      
      // Execute the first available move
      const move = moves[0];
      const newState = executeFoundationMove(currentState, move);
      
      if (!newState) break;
      
      // Animate the move
      setAnimatingCard({
        card: move.card,
        from: move.from,
        to: move.to,
        isAutoMove: true
      });
      
      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Update state
      currentState = newState;
      setGameState(newState);
      movesMade++;
      
      // Clear animation
      setAnimatingCard(null);
      
      // Small delay between moves
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Record as single undo entry if moves were made
    if (movesMade > 0) {
      undoSystem.recordMove({
        type: 'auto-complete',
        movesCount: movesMade
      }, initialState);
      
      setMoveCount(prev => prev + 1);
      
      // Update tracking
      const trackingResult = stateTracker.recordMove(currentState);
      updateCircularPlayState(trackingResult);
      
      // Check win condition
      const status = getGameStatus(currentState);
      if (status.status === 'won') {
        // Game won - let the win handler take over
      }
    }
    
    setIsAutoCompleting(false);
    setAutoCompleteAvailable(false);
    clearHint(); // Clear any hints
  }, [gameState, isAutoCompleting, undoSystem, stateTracker, updateCircularPlayState, clearHint]);
  
  // Cancel auto-complete execution
  const cancelAutoComplete = useCallback(() => {
    autoCompleteAbortRef.current = true;
  }, []);

  // Note: No auto-load on mount. Game loads when user clicks "Play Game" from HomeScreen.
  // This prevents the flash of a dealt game before HomeScreen renders.

  const loadSnapshot = useCallback((snapshotId) => {
    const snapshot = ALL_SNAPSHOTS[snapshotId];
    
    if (!snapshot) {
      console.error(`Snapshot ${snapshotId} not found`);
      return;
    }
    
    setCurrentSnapshot(snapshot);
    
    // v2.0 schema: stock and waste are both arrays
    setCurrentStockCards(Array.isArray(snapshot.stock) ? [...snapshot.stock] : []);
    setCurrentWasteCards(Array.isArray(snapshot.waste) ? [...snapshot.waste] : []);
    
    // Create game state from snapshot
    const state = {
      stock: Array.isArray(snapshot.stock) ? [...snapshot.stock] : [],
      waste: Array.isArray(snapshot.waste) ? [...snapshot.waste] : [],
      pocket1: snapshot.pocket1 || null,
      pocket2: snapshot.pocket2 || null,
      tableau: snapshot.tableau || {},
      foundations: snapshot.foundations || { up: {}, down: {} },
      columnState: snapshot.columnState || { types: [], faceDownCounts: [] },
      metadata: snapshot.metadata || {}
    };
    
    setGameState(state);
    setMoveCount(0);
    
    // Clear undo history when loading new snapshot
    undoSystem.clearHistory();
    
    // Reset state tracker for new game
    stateTracker.reset();
    
    // Reset hints for new game
    resetHints();
    
    // Update config based on snapshot metadata
    setConfig(prev => ({
      ...prev,
      mode: snapshot.metadata.mode,
      variant: snapshot.metadata.variant,
    }));
  }, [undoSystem, stateTracker, resetHints]);

  // Load a game state directly (for random deals)
  const loadGameState = useCallback((gameStateData) => {
    if (!gameStateData) {
      console.error('No game state provided');
      return;
    }

    setCurrentSnapshot(gameStateData);

    // v2.0 schema: stock and waste are both arrays
    setCurrentStockCards(Array.isArray(gameStateData.stock) ? [...gameStateData.stock] : []);
    setCurrentWasteCards(Array.isArray(gameStateData.waste) ? [...gameStateData.waste] : []);

    // Create game state from data
    const state = {
      stock: Array.isArray(gameStateData.stock) ? [...gameStateData.stock] : [],
      waste: Array.isArray(gameStateData.waste) ? [...gameStateData.waste] : [],
      pocket1: gameStateData.pocket1 || null,
      pocket2: gameStateData.pocket2 || null,
      tableau: gameStateData.tableau || {},
      foundations: gameStateData.foundations || { up: {}, down: {} },
      columnState: gameStateData.columnState || { types: [], faceDownCounts: [] },
      metadata: gameStateData.metadata || {}
    };

    setGameState(state);
    setMoveCount(0);

    // Clear undo history when loading new game
    undoSystem.clearHistory();

    // Reset state tracker for new game
    stateTracker.reset();
    
    // Reset hints for new game
    resetHints();

    // Update config based on metadata
    setConfig(prev => ({
      ...prev,
      mode: gameStateData.metadata?.mode || prev.mode,
      variant: gameStateData.metadata?.variant || prev.variant,
    }));
  }, [undoSystem, stateTracker, resetHints]);
  
  const setMode = useCallback((mode) => {
    const modeSnapshotId = `${mode}_normal`;
    if (ALL_SNAPSHOTS[modeSnapshotId]) {
      loadSnapshot(modeSnapshotId);
    } else {
      const modeSnapshots = Object.keys(ALL_SNAPSHOTS).filter(id => 
        id.startsWith(`${mode}_`)
      );
      if (modeSnapshots.length > 0) {
        loadSnapshot(modeSnapshots[0]);
      }
    }
  }, [loadSnapshot]);
  
  const setVariant = useCallback((variant) => {
    const variantSnapshotId = `${config.mode}_${variant}`;
    if (ALL_SNAPSHOTS[variantSnapshotId]) {
      loadSnapshot(variantSnapshotId);
    } else {
      setConfig(prev => ({ ...prev, variant }));
    }
  }, [config.mode, loadSnapshot]);
  
  const toggleStyle = useCallback(() => {
    setConfig(prev => ({ ...prev, isFun: !prev.isFun }));
  }, []);
  
  const simulateStockDraw = useCallback(() => {
    if (!gameState) return;
    
    // Save state for undo
    // Uses structuredClone when available for better performance (Phase 1)
    const previousState = deepClone(gameState);
    
    if (currentStockCards.length === 0) {
      // Recycle waste to stock
      if (currentWasteCards.length === 0) return;
      
      const newStock = [...currentWasteCards].reverse();
      setCurrentStockCards(newStock);
      setCurrentWasteCards([]);
      
      // Update game state
      const newState = {
        ...gameState,
        stock: newStock,
        waste: []
      };
      setGameState(newState);
      
      // Record move for undo
      undoSystem.recordMove({
        type: 'recycle',
        from: 'waste',
        to: 'stock',
        cardCount: currentWasteCards.length
      }, previousState);
      
      // Track state for circular play detection (recycle is a significant state change)
      const trackingResult = stateTracker.recordMove(newState);
      updateCircularPlayState(trackingResult);
      checkAutoComplete(newState);
      clearHint(); // Clear hints after move
      
    } else {
      // Draw a card
      const drawnCard = currentStockCards[currentStockCards.length - 1];
      const newStockCards = currentStockCards.slice(0, -1);
      const newWasteCards = [...currentWasteCards, drawnCard];
      
      setCurrentStockCards(newStockCards);
      setCurrentWasteCards(newWasteCards);
      
      // Update game state
      const newState = {
        ...gameState,
        stock: newStockCards,
        waste: newWasteCards
      };
      setGameState(newState);
      
      // Record move for undo
      undoSystem.recordMove({
        type: 'draw',
        card: drawnCard,
        from: 'stock',
        to: 'waste'
      }, previousState);
      
      // Track state for circular play detection
      const trackingResult = stateTracker.recordMove(newState);
      updateCircularPlayState(trackingResult);
      checkAutoComplete(newState);
      clearHint(); // Clear hints after move
    }
    
    setMoveCount(prev => prev + 1);
  }, [currentStockCards, currentWasteCards, gameState, undoSystem, stateTracker, updateCircularPlayState, checkAutoComplete, clearHint]);
  
  // Handle card move with undo tracking
  const handleMove = useCallback((cardStr, target) => {
    if (!gameState) {
      console.error('No game state available');
      return false;
    }

    // Save state for undo BEFORE executing move
    const previousState = deepClone(gameState);

    const newState = executeMove(cardStr, target, gameState);

    if (newState) {
      // Check for animation info (Ace reveal)
      const animationInfo = newState._animationInfo;
      if (animationInfo) {
        // Clean up the temporary property
        delete newState._animationInfo;

        // Handle Ace reveal animation sequence
        if (animationInfo.type === 'ace-reveal') {
          // 400ms pause, then slurp animation
          setTimeout(() => {
            setAnimatingCard({
              cardStr: animationInfo.cardStr,
              columnIndex: animationInfo.columnIndex,
              type: 'ace-relocate'
            });

            // After slurp (200ms), show pop animation
            setTimeout(() => {
              setAnimatingCard({
                cardStr: animationInfo.cardStr,
                columnIndex: animationInfo.columnIndex,
                type: 'ace-pop'
              });

              // Clear animation after pop completes (300ms)
              setTimeout(() => {
                setAnimatingCard(null);
              }, 350);
            }, 250);
          }, 400);
        }
      }

      // Update all state
      setGameState(newState);
      setCurrentStockCards(newState.stock || []);
      setCurrentWasteCards(newState.waste || []);

      // Update current snapshot to reflect changes
      setCurrentSnapshot(prev => ({
        ...prev,
        stock: newState.stock,
        waste: newState.waste,
        pocket1: newState.pocket1,
        pocket2: newState.pocket2,
        tableau: newState.tableau,
        foundations: newState.foundations,
        columnState: newState.columnState
      }));

      // Record move for undo
      undoSystem.recordMove({
        type: 'move',
        card: cardStr,
        target: target
      }, previousState);

      // Track state for circular play detection
      const trackingResult = stateTracker.recordMove(newState);
      updateCircularPlayState(trackingResult);
      
      // Check auto-complete availability (Phase 4)
      checkAutoComplete(newState);
      clearHint(); // Clear hints after move
      
      // Log warnings for development (can be removed in production)
      if (trackingResult.circular) {
        console.warn('Circular play detected - consider undoing moves');
      }

      setMoveCount(prev => prev + 1);

      return true;
    }

    return false;
  }, [gameState, undoSystem, stateTracker, updateCircularPlayState, checkAutoComplete, clearHint]);
  
  // Handle double-click auto-move with slurp/pop animation
  // Tries foundation first, then tableau builds, then empty columns
  const handleAutoMove = useCallback((cardStr) => {
    if (!gameState) return false;

    // Find source location before executing move
    const sourceLocation = findCardLocation(cardStr, gameState);
    if (!sourceLocation) return false;

    // Determine what type of move is possible
    const card = parseCard(cardStr);
    if (!card) return false;

    // Check if foundation move is possible
    let isFoundationMove = false;
    let targetZone = null;
    let targetSuit = card.suit;

    const upFoundation = gameState.foundations.up?.[card.suit] || [];
    if (canPlaceOnFoundation(cardStr, upFoundation, false)) {
      targetZone = 'up';
      isFoundationMove = true;
    } else {
      const downFoundation = gameState.foundations.down?.[card.suit] || [];
      if (canPlaceOnFoundation(cardStr, downFoundation, true)) {
        targetZone = 'down';
        isFoundationMove = true;
      }
    }

    // If no foundation move, tryAutoMove will find tableau move
    // We need to execute the move to know the actual target
    const previousState = JSON.parse(JSON.stringify(gameState));

    // Try the auto-move first to see what target we get
    const testState = tryAutoMove(cardStr, gameState, sourceLocation);
    if (!testState) {
      return false; // No legal move available
    }

    // Determine actual target from the executed move
    let actualTarget;
    let moveDestination;
    
    if (isFoundationMove) {
      actualTarget = { zone: targetZone, suit: targetSuit };
      moveDestination = 'foundation';
    } else {
      // Tableau move - find which column the card went to
      for (let col = 0; col < 7; col++) {
        const prevColumn = gameState.tableau[col.toString()] || [];
        const newColumn = testState.tableau[col.toString()] || [];
        
        // If column gained cards and the moved card is now in it
        if (newColumn.length > prevColumn.length) {
          const topCard = newColumn[newColumn.length - 1];
          if (topCard === cardStr || newColumn.includes(cardStr)) {
            actualTarget = { type: 'tableau', column: col };
            moveDestination = 'tableau';
            break;
          }
        }
      }
      
      if (!actualTarget) {
        // Fallback - shouldn't happen if move was successful
        actualTarget = { type: 'tableau', column: 0 };
        moveDestination = 'tableau';
      }
    }

    // Start slurp animation at source
    setAutoMoveAnimation({
      cardStr,
      cardData: card,
      source: sourceLocation,
      target: actualTarget,
      phase: 'slurp'
    });

    // After slurp completes (300ms), apply the state and show pop
    setTimeout(() => {
      setGameState(testState);
      setCurrentStockCards(testState.stock || []);
      setCurrentWasteCards(testState.waste || []);

      setCurrentSnapshot(prev => ({
        ...prev,
        stock: testState.stock,
        waste: testState.waste,
        pocket1: testState.pocket1,
        pocket2: testState.pocket2,
        tableau: testState.tableau,
        foundations: testState.foundations,
        columnState: testState.columnState
      }));

      // Record move for undo
      undoSystem.recordMove({
        type: 'auto-move',
        card: cardStr,
        to: moveDestination
      }, previousState);

      // Track state for circular play detection
      const trackingResult = stateTracker.recordMove(testState);
      updateCircularPlayState(trackingResult);
      
      // Check auto-complete availability (Phase 4)
      checkAutoComplete(testState);
      clearHint(); // Clear hints after move

      setMoveCount(prev => prev + 1);

      // Switch to pop animation
      setAutoMoveAnimation(prev => prev ? { ...prev, phase: 'pop' } : null);

      // Clear animation after pop completes (400ms)
      setTimeout(() => {
        setAutoMoveAnimation(null);
      }, 400);
    }, 300);

    return true;
  }, [gameState, undoSystem, stateTracker, updateCircularPlayState, checkAutoComplete, clearHint]);
  
  // Undo last move
  const handleUndo = useCallback(() => {
    const previousState = undoSystem.undo();
    
    if (previousState) {
      setGameState(previousState);
      setCurrentStockCards(previousState.stock || []);
      setCurrentWasteCards(previousState.waste || []);
      
      setCurrentSnapshot(prev => ({
        ...prev,
        stock: previousState.stock,
        waste: previousState.waste,
        pocket1: previousState.pocket1,
        pocket2: previousState.pocket2,
        tableau: previousState.tableau,
        foundations: previousState.foundations,
        columnState: previousState.columnState
      }));
      
      setMoveCount(prev => Math.max(0, prev - 1));
      
      return true;
    }
    
    return false;
  }, [undoSystem]);
  
  // Redo next move
  const handleRedo = useCallback(() => {
    const nextState = undoSystem.redo();
    
    if (nextState) {
      setGameState(nextState);
      setCurrentStockCards(nextState.stock || []);
      setCurrentWasteCards(nextState.waste || []);
      
      setCurrentSnapshot(prev => ({
        ...prev,
        stock: nextState.stock,
        waste: nextState.waste,
        pocket1: nextState.pocket1,
        pocket2: nextState.pocket2,
        tableau: nextState.tableau,
        foundations: nextState.foundations,
        columnState: nextState.columnState
      }));
      
      setMoveCount(prev => prev + 1);
      
      return true;
    }
    
    return false;
  }, [undoSystem]);
  
  // Initialize drag & drop (desktop/mouse)
  const dragDrop = useDragDrop(gameState, handleMove);

  // Initialize touch drag (mobile)
  const touchDrag = useTouchDrag(
    dragDrop.startDrag,
    dragDrop.endDrag,
    dragDrop.handleDrop,
    dragDrop.isValidTarget
  );

  // Calculate game status (memoized to avoid recalculating on every render)
  const gameStatus = useMemo(() => {
    return getGameStatus(gameState);
  }, [gameState]);

  // Get available moves (useful for hints)
  const availableMoves = useMemo(() => {
    return getAvailableMoves(gameState);
  }, [gameState]);

  return {
    config,
    currentSnapshot,
    currentStockCards,
    currentWasteCards,
    gameState,
    moveCount,
    animatingCard,
    autoMoveAnimation,
    setMode,
    setVariant,
    toggleStyle,
    simulateStockDraw,
    loadSnapshot,
    loadGameState,
    handleMove,
    handleAutoMove,
    handleUndo,
    handleRedo,
    canUndo: undoSystem.canUndo,
    canRedo: undoSystem.canRedo,
    gameStatus,
    availableMoves,
    // State tracker for circular play detection
    stateTrackerStats: stateTracker ? stateTracker.getStats() : null,
    // Circular play warning state (Phase 2)
    circularPlayState,
    // Auto-complete (Phase 5)
    canAutoComplete: autoCompleteAvailable,
    isAutoCompleting,
    executeAutoComplete,
    cancelAutoComplete,
    // Hint system (Phase 6)
    currentHint,
    hintsRemaining,
    hintCards,
    showHint,
    clearHint,
    resetHints,
    ...dragDrop,
    ...touchDrag
  };
};
