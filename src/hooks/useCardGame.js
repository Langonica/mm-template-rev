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
  getBestHint,
  detectUnwinnableState
} from '../utils/gameLogic';
import { findCardLocation, parseCard, canPlaceOnFoundation, deepClone } from '../utils/cardUtils';
import { loadThresholds, isNotificationSystemEnabled } from '../utils/notificationConfig';

export const useCardGame = (callbacks = {}) => {
  const { onCardsMoved, onFoundationCompleted } = callbacks;
  const [config, setConfig] = useState({
    mode: 'classic',
    variant: 'normal',
    isTouchDevice: isTouchDevice()
  });
  
  const [currentStockCards, setCurrentStockCards] = useState([]);
  const [currentWasteCards, setCurrentWasteCards] = useState([]);
  const [currentSnapshot, setCurrentSnapshot] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [moveCount, setMoveCount] = useState(0);
  const [animatingCard, setAnimatingCard] = useState(null); // For portal animations
  const [autoMoveAnimation, setAutoMoveAnimation] = useState(null); // For foundation auto-move animations

  // Game state notification system (Phase 1 - Enhanced Detection)
  // NOTE: System currently DISABLED in notificationConfig.js due to reliability issues
  // All tiers return 'none' until detection accuracy is improved
  const [gameStateNotification, setGameStateNotification] = useState({
    tier: 'none', // 'none' | 'concern' | 'warning' | 'confirmed'
    unproductiveCycles: 0,
    movesSinceProgress: 0,
    wasProductive: true,
    details: null
  });

  // Auto-complete detection state (Phase 4)
  const [autoCompleteAvailable, setAutoCompleteAvailable] = useState(false);

  // Auto-complete animation state (Phase 1 Animation Improvements)
  const [autoCompleteAnimation, setAutoCompleteAnimation] = useState({
    isActive: false,
    currentMove: null, // { card, from, to, phase }
    progress: { completed: 0, total: 0 }
  });

  // Initialize undo system
  const undoSystem = useUndo();

  // Initialize game state tracker (for circular play detection)
  const [stateTracker] = useState(() => new GameStateTracker());

  // Load configurable thresholds (memoized to avoid reloading on every render)
  const thresholds = useMemo(() => loadThresholds(), []);

  // Helper: Calculate notification tier based on tracker state
  // Uses configurable thresholds (loaded once on mount)
  const calculateNotificationTier = useCallback((trackerResult, unwinnableCheck = null) => {
    const { 
      unproductiveCycleCount
    } = trackerResult;
    
    // Tier 4: Confirmed unwinnable (solver-based detection)
    // Only check when we've had significant unproductive cycles
    if (unwinnableCheck?.isUnwinnable === true) {
      return { tier: 'confirmed', reason: 'solver', confidence: unwinnableCheck.confidence };
    }
    
    // Tier 3: Warning (configurable threshold)
    if (unproductiveCycleCount >= thresholds.warning) {
      return { tier: 'warning', reason: 'cycles', value: unproductiveCycleCount };
    }
    
    // Tier 2: Concern (configurable threshold)
    if (unproductiveCycleCount >= thresholds.concern) {
      return { tier: 'concern', reason: 'cycles', value: unproductiveCycleCount };
    }
    
    // Tier 1: Hint (configurable threshold)
    if (unproductiveCycleCount >= thresholds.hint) {
      return { tier: 'hint', reason: 'cycles', value: unproductiveCycleCount };
    }
    
    return { tier: 'none' };
  }, [thresholds]);

  // Helper: Run unwinnable detection when appropriate
  // Returns cached result or runs new check if conditions met
  const runUnwinnableCheck = useCallback((currentState, trackerResult) => {
    // Only check if we have enough unproductive cycles to warrant it
    // Use concern threshold as the minimum to start checking
    if (trackerResult.unproductiveCycleCount < thresholds.concern) {
      return null;
    }
    
    // Use deeper check for higher cycle counts (at warning threshold)
    const useDeepCheck = trackerResult.unproductiveCycleCount >= thresholds.warning;
    const maxNodes = useDeepCheck ? 8000 : 3000;
    const maxDepth = useDeepCheck ? 15 : 10;
    
    return detectUnwinnableState(currentState, { maxNodes, maxDepth });
  }, [thresholds]);

  // Helper: Update game state notification after move
  const updateGameStateNotification = useCallback((trackerResult, currentState) => {
    // SYSTEM DISABLED: Notification system disabled due to reliability issues
    // See notificationConfig.js for details
    if (!isNotificationSystemEnabled()) {
      // Still update cycle counts for tracking, but always return 'none' tier
      setGameStateNotification(prev => ({
        ...prev,
        tier: 'none',
        unproductiveCycles: trackerResult.unproductiveCycleCount,
        movesSinceProgress: trackerResult.movesSinceProgress,
        wasProductive: trackerResult.wasProductive,
        details: trackerResult.productivityDetails
      }));
      return 'none';
    }
    
    // Run unwinnable check if conditions warrant
    const unwinnableCheck = currentState ? runUnwinnableCheck(currentState, trackerResult) : null;
    
    const { tier, reason, confidence } = calculateNotificationTier(trackerResult, unwinnableCheck);
    
    // Debug logging in development
    if (import.meta.env.DEV && tier !== 'none') {
      console.log('[GSN] Notification updated:', {
        tier,
        reason,
        cycles: trackerResult.unproductiveCycleCount,
        movesSinceProgress: trackerResult.movesSinceProgress,
        wasProductive: trackerResult.wasProductive
      });
    }
    
    setGameStateNotification(prev => ({
      ...prev,
      tier,
      unproductiveCycles: trackerResult.unproductiveCycleCount,
      movesSinceProgress: trackerResult.movesSinceProgress,
      wasProductive: trackerResult.wasProductive,
      details: trackerResult.productivityDetails,
      unwinnableCheck: unwinnableCheck || prev.unwinnableCheck
    }));
    
    return tier;
  }, [calculateNotificationTier, runUnwinnableCheck]);

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
  // Phase 1 Animation Improvements: Sequential visual animation before state updates
  const executeAutoComplete = useCallback(async () => {
    if (!gameState || isAutoCompleting) return;
    
    // Verify auto-complete is still available
    if (!canAutoComplete(gameState)) return;
    
    // Collect all moves first
    const allMoves = [];
    let tempState = gameState;
    const maxMoves = 52; // Safety limit
    
    while (allMoves.length < maxMoves) {
      const moves = getAllFoundationMoves(tempState);
      if (moves.length === 0) break;
      
      const move = moves[0];
      const newState = executeFoundationMove(tempState, move);
      if (!newState) break;
      
      allMoves.push(move);
      tempState = newState;
    }
    
    if (allMoves.length === 0) return;
    
    // Start auto-complete animation sequence
    setIsAutoCompleting(true);
    autoCompleteAbortRef.current = false;
    
    // Initialize animation state
    setAutoCompleteAnimation({
      isActive: true,
      currentMove: null,
      progress: { completed: 0, total: allMoves.length }
    });
    
    // Record initial state for undo
    const initialState = deepClone(gameState);
    
    let currentState = gameState;
    let movesMade = 0;
    
    // Animate each move sequentially
    for (const move of allMoves) {
      if (autoCompleteAbortRef.current) break;
      
      // Phase 1: Show card "lifting" from source (200ms)
      setAutoCompleteAnimation({
        isActive: true,
        currentMove: { ...move, phase: 'departing' },
        progress: { completed: movesMade, total: allMoves.length }
      });
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Phase 2: Card in transit to foundation (300ms)
      setAutoCompleteAnimation({
        isActive: true,
        currentMove: { ...move, phase: 'moving' },
        progress: { completed: movesMade, total: allMoves.length }
      });
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Execute the move
      const newState = executeFoundationMove(currentState, move);
      if (!newState) break;
      
      currentState = newState;
      setGameState(newState);
      setCurrentStockCards(newState.stock || []);
      setCurrentWasteCards(newState.waste || []);
      
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
      
      movesMade++;
      
      // Phase 3: Card "arriving" at foundation (200ms)
      setAutoCompleteAnimation({
        isActive: true,
        currentMove: { ...move, phase: 'arriving' },
        progress: { completed: movesMade, total: allMoves.length }
      });
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Track foundation completion
      if (onFoundationCompleted && move.to.type === 'foundation') {
        const foundationPile = currentState.foundations[move.to.zone]?.[move.to.suit] || [];
        if (foundationPile.length === 13) {
          onFoundationCompleted();
        }
      }
    }
    
    // Clear animation state
    setAutoCompleteAnimation({
      isActive: false,
      currentMove: null,
      progress: { completed: movesMade, total: allMoves.length }
    });
    
    // Record as single undo entry if moves were made
    if (movesMade > 0) {
      undoSystem.recordMove({
        type: 'auto-complete',
        movesCount: movesMade
      }, initialState);
      
      setMoveCount(prev => prev + movesMade);
      
      // Update tracking
      const trackingResult = stateTracker.recordMove(currentState, 'auto-complete');
      updateGameStateNotification(trackingResult, currentState);
      
      // Check win condition - but DON'T trigger win screen yet
      const status = getGameStatus(currentState);
      if (status.status === 'won') {
        // Delay win screen to show final state
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    setIsAutoCompleting(false);
    setAutoCompleteAvailable(false);
    clearHint();
  }, [gameState, isAutoCompleting, undoSystem, stateTracker, updateGameStateNotification, clearHint, onFoundationCompleted]);
  
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
      
      // Track state for notification system
      const trackingResult = stateTracker.recordMove(newState, 'recycle');
      updateGameStateNotification(trackingResult, newState);
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
      
      // Track state for notification system
      const trackingResult = stateTracker.recordMove(newState, 'draw');
      updateGameStateNotification(trackingResult, newState);
      checkAutoComplete(newState);
      clearHint(); // Clear hints after move
    }
    
    setMoveCount(prev => prev + 1);
  }, [currentStockCards, currentWasteCards, gameState, undoSystem, stateTracker, updateGameStateNotification, checkAutoComplete, clearHint]);
  
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

      // Track state for notification system
      const trackingResult = stateTracker.recordMove(newState, target?.type === 'foundation' ? 'foundation' : 'tableau');
      updateGameStateNotification(trackingResult, newState);
      
      // Check auto-complete availability (Phase 4)
      checkAutoComplete(newState);
      clearHint(); // Clear hints after move

      setMoveCount(prev => prev + 1);
      
      // Track card movement for statistics
      if (onCardsMoved) {
        onCardsMoved(1); // Single card moved
      }
      
      // Track foundation completion (check if foundation now has 13 cards)
      if (onFoundationCompleted && target.type === 'foundation') {
        const foundationPile = newState.foundations[target.zone]?.[target.suit] || [];
        if (foundationPile.length === 13) {
          onFoundationCompleted();
        }
      }

      return true;
    }

    return false;
  }, [gameState, undoSystem, stateTracker, updateGameStateNotification, checkAutoComplete, clearHint, onCardsMoved, onFoundationCompleted]);
  
  // Handle double-click auto-move with arc animation (Phase 2)
  // Tries foundation first, then tableau builds, then empty columns
  // Animation phases: lifting (100ms) → flying (300ms) → landing (200ms)
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

    // Phase 2 Animation: Arc trajectory with ghost trails
    // Start lifting animation at source
    setAutoMoveAnimation({
      cardStr,
      cardData: card,
      source: sourceLocation,
      target: actualTarget,
      phase: 'lifting',
      showGhosts: true
    });

    // Phase 1: Lifting (100ms)
    setTimeout(() => {
      // Apply state update while card is "in flight"
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

      // Track state for notification system
      const trackingResult = stateTracker.recordMove(testState, isFoundationMove ? 'foundation' : 'tableau');
      updateGameStateNotification(trackingResult, testState);
      
      // Check auto-complete availability (Phase 4)
      checkAutoComplete(testState);
      clearHint();

      setMoveCount(prev => prev + 1);
      
      // Track card movement for statistics
      if (onCardsMoved) {
        onCardsMoved(1);
      }
      
      // Track foundation completion
      if (onFoundationCompleted && isFoundationMove) {
        const foundationPile = testState.foundations[targetZone]?.[targetSuit] || [];
        if (foundationPile.length === 13) {
          onFoundationCompleted();
        }
      }

      // Phase 2: Flying with ghost trails (300ms)
      setAutoMoveAnimation(prev => prev ? { 
        ...prev, 
        phase: 'flying',
        showGhosts: true 
      } : null);

      // Phase 3: Landing (200ms)
      setTimeout(() => {
        setAutoMoveAnimation(prev => prev ? { 
          ...prev, 
          phase: 'landing',
          showGhosts: false 
        } : null);

        // Clear animation after landing completes
        setTimeout(() => {
          setAutoMoveAnimation(null);
        }, 200);
      }, 300);
    }, 100);

    return true;
  }, [gameState, undoSystem, stateTracker, updateGameStateNotification, checkAutoComplete, clearHint, onCardsMoved, onFoundationCompleted]);
  
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

  // ============================================================================
  // PHASE 6: DEBUG TOOLS (Development Only)
  // ============================================================================
  
  // NOTE: Debug tools are temporarily disabled because they reference
  // setGameStateToastOpen and setGameStateOverlayOpen which are defined in
  // App.jsx and not available in this hook. To re-enable, either pass the
  // setter functions as parameters or implement the UI state management here.
  // 
  // useEffect(() => {
  //   if (!import.meta.env.DEV) return;
  //   
  //   // Expose debugging functions on window
  //   window.__GSN_DEBUG__ = {
  //     // Get current tracker state
  //     getTrackerState: () => stateTracker ? stateTracker.getStats() : null,
  //     
  //     // Get current notification state
  //     getNotificationState: () => gameStateNotification,
  //     
  //     // Get current game state
  //     getGameState: () => gameState,
  //     
  //     // Force a specific tier (for UI testing)
  //     forceTier: (tier) => {
  //       console.log('[GSN] Forcing tier:', tier);
  //       setGameStateNotification(prev => ({ ...prev, tier }));
  //       if (tier === 'hint' || tier === 'concern') {
  //         setGameStateToastOpen(true);
  //       } else if (tier === 'warning') {
  //         setGameStateOverlayOpen(true);
  //         setGameStateToastOpen(false);
  //       } else if (tier === 'none') {
  //         setGameStateToastOpen(false);
  //         setGameStateOverlayOpen(false);
  //       }
  //     },
  //     
  //     // Run unwinnable check manually
  //     checkUnwinnable: (options = {}) => {
  //       if (!gameState) {
  //         console.log('[GSN] No game state available');
  //         return null;
  //       }
  //       const startTime = performance.now();
  //       const result = detectUnwinnableState(gameState, { 
  //         maxNodes: options.maxNodes || 10000, 
  //         maxDepth: options.maxDepth || 20,
  //         trackPaths: options.trackPaths || true 
  //       });
  //       const duration = performance.now() - startTime;
  //       console.log('[GSN] Manual unwinnable check:', { ...result, duration: `${duration.toFixed(2)}ms` });
  //       return result;
  //     },
  //     
  //     // Reset notification state
  //     resetNotifications: () => {
  //       console.log('[GSN] Resetting notifications');
  //       setGameStateNotification({
  //         tier: 'none',
  //         unproductiveCycles: 0,
  //         movesSinceProgress: 0,
  //         wasProductive: true,
  //         details: null,
  //         unwinnableCheck: null
  //       });
  //       setGameStateToastOpen(false);
  //       setGameStateOverlayOpen(false);
  //       stateTracker.reset();
  //     },
  //     
  //     // Simulate unproductive cycles
  //     simulateCycles: (count = 5) => {
  //       console.log(`[GSN] Simulating ${count} unproductive cycles`);
  //       for (let i = 0; i < count; i++) {
  //         stateTracker.unproductiveCycleCount++;
  //       }
  //       console.log('[GSN] Current cycles:', stateTracker.unproductiveCycleCount);
  //     }
  //   };
  //   
  //   console.log('[GSN] Debug tools available. Try: __GSN_DEBUG__.getTrackerState()');
  //   
  //   return () => {
  //     delete window.__GSN_DEBUG__;
  //   };
  // }, [stateTracker, gameState, gameStateNotification]);

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
    simulateStockDraw,
    loadSnapshot,
    loadGameState,
    handleMove,
    handleAutoMove,
    handleUndo,
    handleRedo,
    canUndo: undoSystem.canUndo,
    canRedo: undoSystem.canRedo,
    undoMoveCount: undoSystem.getMoveCount,
    gameStatus,
    availableMoves,
    // State tracker for circular play detection
    stateTrackerStats: stateTracker ? stateTracker.getStats() : null,
    // Game state notification system (Phase 1 - Enhanced Detection)
    gameStateNotification,
    // Deprecated: keeping for backward compatibility during transition
    circularPlayState: gameStateNotification,
    // Auto-complete (Phase 5)
    canAutoComplete: autoCompleteAvailable,
    isAutoCompleting,
    executeAutoComplete,
    cancelAutoComplete,
    autoCompleteAnimation,
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
