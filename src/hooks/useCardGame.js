import { useState, useEffect, useCallback, useMemo } from 'react';
import { ALL_SNAPSHOTS } from '../data/snapshots/allSnapshots';
import { useDragDrop } from './useDragDrop';
import { useUndo } from './useUndo';
import { useTouchDrag, isTouchDevice } from './useTouchDrag';
import {
  executeMove,
  tryAutoMove,
  getGameStatus,
  getAvailableMoves
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

  // Initialize undo system
  const undoSystem = useUndo();

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
    
    // Update config based on snapshot metadata
    setConfig(prev => ({
      ...prev,
      mode: snapshot.metadata.mode,
      variant: snapshot.metadata.variant,
    }));
  }, [undoSystem]);

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

    // Update config based on metadata
    setConfig(prev => ({
      ...prev,
      mode: gameStateData.metadata?.mode || prev.mode,
      variant: gameStateData.metadata?.variant || prev.variant,
    }));
  }, [undoSystem]);
  
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
    }
    
    setMoveCount(prev => prev + 1);
  }, [currentStockCards, currentWasteCards, gameState, undoSystem]);
  
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

      setMoveCount(prev => prev + 1);

      return true;
    }

    return false;
  }, [gameState, undoSystem]);
  
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

      setMoveCount(prev => prev + 1);

      // Switch to pop animation
      setAutoMoveAnimation(prev => prev ? { ...prev, phase: 'pop' } : null);

      // Clear animation after pop completes (400ms)
      setTimeout(() => {
        setAutoMoveAnimation(null);
      }, 400);
    }, 300);

    return true;
  }, [gameState, undoSystem]);
  
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
    ...dragDrop,
    ...touchDrag
  };
};
