import { useState, useCallback } from 'react';
import { findCardLocation, getMovingCards, isCardAccessible } from '../utils/cardUtils';
import { validateMove } from '../utils/gameLogic';

/**
 * Custom hook for managing drag and drop state
 */
export const useDragDrop = (gameState, onMove) => {
  const [dragState, setDragState] = useState({
    isDragging: false,
    draggedCard: null,
    draggedCards: [],
    sourceLocation: null,
    validTargets: []
  });

  /**
   * Start dragging a card
   */
  const startDrag = useCallback((cardStr, location) => {
    console.time('startDrag');
    if (!gameState) {
      console.warn('⚠️ No game state');
      return;
    }

    const source = location || findCardLocation(cardStr, gameState);
    if (!source) {
      console.warn('Cannot find card location for drag:', cardStr);
      console.timeEnd('startDrag');
      return;
    }

    console.log('Checking accessibility for:', cardStr, source);
    
    // CHECK IF CARD IS ACCESSIBLE - THIS WAS MISSING!
    if (!isCardAccessible(cardStr, source, gameState)) {
      console.warn('Card not accessible for dragging:', cardStr, source);
      console.timeEnd('startDrag');
      return;
    }

    console.log('Card is accessible, getting moving cards...');
    const movingCards = getMovingCards(cardStr, source, gameState);
    console.log('Moving cards:', movingCards);

    console.log('Calculating valid targets...');
    // Calculate valid drop targets
    const validTargets = calculateValidTargets(cardStr, source, gameState);
    console.log('Valid targets:', validTargets);

    setDragState({
      isDragging: true,
      draggedCard: cardStr,
      draggedCards: movingCards,
      sourceLocation: source,
      validTargets
    });
    
    console.timeEnd('startDrag');
  }, [gameState]);

  /**
   * End dragging (cleanup)
   */
  const endDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedCard: null,
      draggedCards: [],
      sourceLocation: null,
      validTargets: []
    });
  }, []);

  /**
   * Handle drop on a target
   */
  const handleDrop = useCallback((target) => {
    if (!dragState.isDragging || !dragState.draggedCard) {
      console.warn('Drop rejected: Not dragging or no card');
      return false;
    }

    console.log('Attempting drop:', {
      card: dragState.draggedCard,
      target,
      validTargets: dragState.validTargets
    });

    const validation = validateMove(dragState.draggedCard, target, gameState);

    console.log('Drop validation result:', validation);

    if (validation.valid) {
      console.log('Drop VALID - executing move');
      // Execute move through callback
      const success = onMove(dragState.draggedCard, target);
      console.log('Move execution result:', success);
      endDrag();
      return true;
    } else {
      console.log('Invalid drop:', validation.reason);
      endDrag();
      return false;
    }
  }, [dragState, gameState, onMove, endDrag]);

  /**
   * Check if a target is valid for current drag
   */
  const isValidTarget = useCallback((target) => {
    if (!dragState.isDragging) return false;

    return dragState.validTargets.some(valid => 
      valid.type === target.type &&
      (target.type === 'tableau' ? valid.column === target.column :
       target.type === 'foundation' ? (valid.zone === target.zone && valid.suit === target.suit) :
       target.type === 'pocket' ? valid.pocketNum === target.pocketNum :
       false)
    );
  }, [dragState]);

  return {
    dragState,
    startDrag,
    endDrag,
    handleDrop,
    isValidTarget
  };
};

/**
 * Calculate all valid drop targets for a card
 */
function calculateValidTargets(cardStr, source, gameState) {
  const targets = [];

  // Check all tableau columns
  for (let col = 0; col < 7; col++) {
    const target = { type: 'tableau', column: col };
    const validation = validateMove(cardStr, target, gameState);
    if (validation.valid) {
      targets.push(target);
    }
  }

  // Check all foundations
  const zones = ['up', 'down'];
  const suits = ['h', 'd', 'c', 's'];
  
  for (const zone of zones) {
    for (const suit of suits) {
      const target = { type: 'foundation', zone, suit };
      const validation = validateMove(cardStr, target, gameState);
      if (validation.valid) {
        targets.push(target);
      }
    }
  }

  // Check pockets
  const pocketCount = gameState.metadata?.pockets || 1;
  for (let pocketNum = 1; pocketNum <= pocketCount; pocketNum++) {
    const target = { type: 'pocket', pocketNum };
    const validation = validateMove(cardStr, target, gameState);
    if (validation.valid) {
      targets.push(target);
    }
  }

  return targets;
}
