import {
  parseCard,
  canStackCards,
  canPlaceOnFoundation,
  findCardLocation,
  isCardAccessible,
  getMovingCards,
  isValidSequence
} from './cardUtils';

// ============================================================================
// MOVE VALIDATION
// ============================================================================

/**
 * Validate if a move is legal
 * @param {string} cardStr - Card being moved (e.g., "Ah")
 * @param {object} target - Target location {type, column?, suit?, zone?}
 * @param {object} gameState - Current game state
 * @returns {object} - {valid: boolean, reason?: string}
 */
export function validateMove(cardStr, target, gameState) {
  if (!cardStr || !target || !gameState) {
    return { valid: false, reason: 'Invalid parameters' };
  }
  
  // Find source location
  const source = findCardLocation(cardStr, gameState);
  if (!source) {
    return { valid: false, reason: 'Card not found' };
  }
  
  // Check if card is accessible
  if (!isCardAccessible(cardStr, source, gameState)) {
    return { valid: false, reason: 'Card not accessible' };
  }
  
  // Get all cards that would move
  const movingCards = getMovingCards(cardStr, source, gameState);
  
  // Validate target based on type
  switch (target.type) {
    case 'foundation':
      return validateFoundationMove(movingCards, target, gameState);
      
    case 'tableau':
      return validateTableauMove(movingCards, target, gameState, source);
      
    case 'pocket':
      return validatePocketMove(movingCards, target, gameState);
      
    default:
      return { valid: false, reason: 'Invalid target type' };
  }
}

/**
 * Validate move to foundation
 */
function validateFoundationMove(movingCards, target, gameState) {
  // Can only move single cards to foundation
  if (movingCards.length > 1) {
    return { valid: false, reason: 'Can only move single cards to foundation' };
  }
  
  const card = movingCards[0];
  const foundation = gameState.foundations[target.zone]?.[target.suit] || [];
  const isDownFoundation = target.zone === 'down';
  
  if (canPlaceOnFoundation(card, foundation, isDownFoundation)) {
    return { valid: true };
  }
  
  return { valid: false, reason: 'Invalid foundation sequence' };
}

/**
 * Validate move to tableau column
 */
function validateTableauMove(movingCards, target, gameState, source) {
  const column = gameState.tableau[target.column.toString()] || [];
  const columnType = gameState.columnState?.types?.[target.column] || 'traditional';
  
  // Empty column
  if (column.length === 0) {
    const firstCard = parseCard(movingCards[0]);
    if (!firstCard) return { valid: false, reason: 'Invalid card' };
    
    // Can only place Ace or King on empty column
    if (firstCard.value === 'A' || firstCard.value === 'K') {
      return { valid: true };
    }
    
    return { valid: false, reason: 'Only Ace or King can start empty column' };
  }
  
  // Non-empty column: check if can stack on top card
  const topCard = column[column.length - 1];
  const firstMovingCard = movingCards[0];
  
  if (canStackCards(topCard, firstMovingCard, columnType)) {
    return { valid: true };
  }
  
  return { valid: false, reason: 'Invalid tableau sequence' };
}

/**
 * Validate move to pocket
 */
function validatePocketMove(movingCards, target, gameState) {
  // Can only move single cards to pocket
  if (movingCards.length > 1) {
    return { valid: false, reason: 'Can only move single cards to pocket' };
  }
  
  // Check if pocket is empty
  const pocketCard = target.pocketNum === 1 ? gameState.pocket1 : gameState.pocket2;
  
  if (pocketCard) {
    return { valid: false, reason: 'Pocket already occupied' };
  }
  
  // Check if pocket is available in this mode
  const pocketCount = gameState.metadata?.pockets || 1;
  if (target.pocketNum > pocketCount) {
    return { valid: false, reason: 'Pocket not available in this mode' };
  }
  
  return { valid: true };
}

// ============================================================================
// MOVE EXECUTION
// ============================================================================

/**
 * Execute a validated move
 * @param {string} cardStr - Card being moved
 * @param {object} target - Target location
 * @param {object} gameState - Current game state
 * @returns {object} - New game state or null if invalid
 */
export function executeMove(cardStr, target, gameState) {
  // Validate first
  const validation = validateMove(cardStr, target, gameState);
  if (!validation.valid) {
    console.warn('Invalid move:', validation.reason);
    return null;
  }
  
  // Find source and get moving cards
  const source = findCardLocation(cardStr, gameState);
  const movingCards = getMovingCards(cardStr, source, gameState);
  
  // Create new state (immutable update)
  const newState = JSON.parse(JSON.stringify(gameState));
  
  // Remove from source
  removeFromSource(movingCards, source, newState);
  
  // Add to target
  addToTarget(movingCards, target, newState);
  
  // Update column types if necessary
  if (source.type === 'tableau') {
    updateColumnType(source.column, newState);
  }
  if (target.type === 'tableau') {
    updateColumnType(target.column, newState);
  }
  
  // Flip face-down card if revealed (may return animation info for Ace reveals)
  let animationInfo = null;
  if (source.type === 'tableau') {
    animationInfo = flipRevealedCard(source.column, newState);
  }

  // Attach animation info to state if present (for Ace reveal animations)
  if (animationInfo) {
    newState._animationInfo = animationInfo;
  }

  return newState;
}

/**
 * Remove cards from source location
 */
function removeFromSource(cards, source, state) {
  switch (source.type) {
    case 'waste':
      state.waste.pop();
      break;
      
    case 'pocket':
      if (source.pocketNum === 1) {
        state.pocket1 = null;
      } else {
        state.pocket2 = null;
      }
      break;
      
    case 'tableau':
      const column = state.tableau[source.column.toString()];
      column.splice(source.index, cards.length);
      break;
      
    case 'foundation':
      const foundation = state.foundations[source.zone][source.suit];
      foundation.splice(source.index, cards.length);
      break;
  }
}

/**
 * Add cards to target location
 */
function addToTarget(cards, target, state) {
  switch (target.type) {
    case 'foundation':
      const foundation = state.foundations[target.zone][target.suit];
      foundation.push(...cards);
      break;
      
    case 'tableau':
      const column = state.tableau[target.column.toString()];
      column.push(...cards);
      break;
      
    case 'pocket':
      if (target.pocketNum === 1) {
        state.pocket1 = cards[0];
      } else {
        state.pocket2 = cards[0];
      }
      break;
  }
}

/**
 * Update column type after move
 */
function updateColumnType(columnIndex, state) {
  const column = state.tableau[columnIndex.toString()] || [];
  
  if (!state.columnState) {
    state.columnState = { types: [], faceDownCounts: [] };
  }
  
  if (column.length === 0) {
    state.columnState.types[columnIndex] = 'empty';
    return;
  }
  
  if (column.length === 1) {
    const card = parseCard(column[0]);
    if (card) {
      if (card.value === 'A') {
        state.columnState.types[columnIndex] = 'ace';
      } else if (card.value === 'K') {
        state.columnState.types[columnIndex] = 'king';
      } else {
        state.columnState.types[columnIndex] = 'traditional';
      }
    }
  }
}

/**
 * Flip top face-down card if revealed after removing cards
 * Also updates column type if the revealed card is an Ace or King
 * @returns {object|null} Animation info if Ace was revealed, null otherwise
 */
function flipRevealedCard(columnIndex, state) {
  const column = state.tableau[columnIndex.toString()] || [];
  if (column.length === 0) return null;

  if (!state.columnState) {
    state.columnState = { types: [], faceDownCounts: [] };
  }

  const faceDownCount = state.columnState.faceDownCounts?.[columnIndex] || 0;
  if (faceDownCount > 0 && faceDownCount >= column.length) {
    // Top card should now be face-up
    const newFaceDownCount = Math.max(0, column.length - 1);
    state.columnState.faceDownCounts[columnIndex] = newFaceDownCount;

    // Update column type based on newly revealed card (the new bottom face-up card)
    if (newFaceDownCount < column.length) {
      const revealedCardStr = column[newFaceDownCount];
      const bottomFaceUpCard = parseCard(revealedCardStr);
      if (bottomFaceUpCard) {
        if (bottomFaceUpCard.value === 'A') {
          state.columnState.types[columnIndex] = 'ace';
          // Return animation info for Ace reveal
          return {
            type: 'ace-reveal',
            cardStr: revealedCardStr,
            columnIndex: columnIndex
          };
        } else if (bottomFaceUpCard.value === 'K') {
          state.columnState.types[columnIndex] = 'king';
        } else {
          state.columnState.types[columnIndex] = 'traditional';
        }
      }
    }
  }
  return null;
}

// ============================================================================
// AUTO-MOVE HELPERS
// ============================================================================

/**
 * Try to auto-move card to foundation (for double-click)
 */
export function tryAutoMoveToFoundation(cardStr, gameState) {
  const card = parseCard(cardStr);
  if (!card) return null;
  
  // Try UP foundations first (7→K)
  const upFoundation = gameState.foundations.up?.[card.suit] || [];
  if (canPlaceOnFoundation(cardStr, upFoundation, false)) {
    return executeMove(cardStr, {
      type: 'foundation',
      zone: 'up',
      suit: card.suit
    }, gameState);
  }
  
  // Try DOWN foundations (6→A)
  const downFoundation = gameState.foundations.down?.[card.suit] || [];
  if (canPlaceOnFoundation(cardStr, downFoundation, true)) {
    return executeMove(cardStr, {
      type: 'foundation',
      zone: 'down',
      suit: card.suit
    }, gameState);
  }
  
  return null;
}

// ============================================================================
// WIN/STALEMATE DETECTION
// ============================================================================

/**
 * Check if the game is won (all foundations complete)
 * UP foundations: 7→K (7 cards per suit = 28 total)
 * DOWN foundations: 6→A (6 cards per suit = 24 total)
 * Total: 52 cards
 */
export function checkWinCondition(gameState) {
  if (!gameState?.foundations) return false;

  const suits = ['h', 'd', 'c', 's'];

  // Check UP foundations (7→K = 7 cards each)
  for (const suit of suits) {
    const upFoundation = gameState.foundations.up?.[suit] || [];
    if (upFoundation.length !== 7) return false;
  }

  // Check DOWN foundations (6→A = 6 cards each)
  for (const suit of suits) {
    const downFoundation = gameState.foundations.down?.[suit] || [];
    if (downFoundation.length !== 6) return false;
  }

  return true;
}

/**
 * Get all available moves from the current game state
 * Returns array of { card, source, target, description }
 */
export function getAvailableMoves(gameState) {
  if (!gameState) return [];

  const moves = [];
  const suits = ['h', 'd', 'c', 's'];

  // 1. Check moves from waste
  if (gameState.waste && gameState.waste.length > 0) {
    const wasteCard = gameState.waste[gameState.waste.length - 1];
    const wasteSource = { type: 'waste', index: gameState.waste.length - 1 };
    addValidMovesForCard(wasteCard, wasteSource, gameState, moves);
  }

  // 2. Check moves from pockets
  if (gameState.pocket1) {
    const pocketSource = { type: 'pocket', pocketNum: 1 };
    addValidMovesForCard(gameState.pocket1, pocketSource, gameState, moves);
  }
  if (gameState.pocket2) {
    const pocketSource = { type: 'pocket', pocketNum: 2 };
    addValidMovesForCard(gameState.pocket2, pocketSource, gameState, moves);
  }

  // 3. Check moves from tableau columns
  for (let col = 0; col < 7; col++) {
    const column = gameState.tableau[col.toString()] || [];
    if (column.length === 0) continue;

    const faceDownCount = gameState.columnState?.faceDownCounts?.[col] || 0;

    // Check each face-up card in the column
    for (let idx = faceDownCount; idx < column.length; idx++) {
      const cardStr = column[idx];
      const source = { type: 'tableau', column: col, index: idx };

      // Check if this card can form a valid sequence with cards above it
      const cardsAbove = column.slice(idx);
      const columnType = gameState.columnState?.types?.[col] || 'traditional';

      if (isValidSequence(cardsAbove, columnType)) {
        addValidMovesForCard(cardStr, source, gameState, moves);
      }
    }
  }

  // 4. Check moves from foundations (can move top card back to tableau)
  for (const zone of ['up', 'down']) {
    for (const suit of suits) {
      const foundation = gameState.foundations[zone]?.[suit] || [];
      if (foundation.length > 0) {
        const topCard = foundation[foundation.length - 1];
        const source = {
          type: 'foundation',
          zone,
          suit,
          index: foundation.length - 1,
          isDown: zone === 'down'
        };
        addValidMovesForCard(topCard, source, gameState, moves);
      }
    }
  }

  // 5. Check if drawing from stock would help (only if stock has cards)
  if (gameState.stock && gameState.stock.length > 0) {
    moves.push({
      card: null,
      source: { type: 'stock' },
      target: { type: 'waste' },
      description: 'Draw from stock',
      isStockDraw: true
    });
  }

  // 6. Check if recycling waste would help (only if stock empty and waste has cards)
  if ((!gameState.stock || gameState.stock.length === 0) &&
      gameState.waste && gameState.waste.length > 0) {
    moves.push({
      card: null,
      source: { type: 'waste' },
      target: { type: 'stock' },
      description: 'Recycle waste to stock',
      isRecycle: true
    });
  }

  return moves;
}

/**
 * Helper: Add all valid moves for a specific card to the moves array
 */
function addValidMovesForCard(cardStr, source, gameState, moves) {
  const card = parseCard(cardStr);
  if (!card) return;

  // Check tableau columns
  for (let col = 0; col < 7; col++) {
    // Skip moving to same column
    if (source.type === 'tableau' && source.column === col) continue;

    const target = { type: 'tableau', column: col };
    const validation = validateMove(cardStr, target, gameState);

    if (validation.valid) {
      moves.push({
        card: cardStr,
        source,
        target,
        description: `Move ${card.display} to column ${col + 1}`
      });
    }
  }

  // Check foundations (only single cards can go to foundation)
  if (source.type !== 'tableau' ||
      source.index === (gameState.tableau[source.column.toString()]?.length || 0) - 1) {

    // Check UP foundation
    const upTarget = { type: 'foundation', zone: 'up', suit: card.suit };
    const upValidation = validateMove(cardStr, upTarget, gameState);
    if (upValidation.valid) {
      moves.push({
        card: cardStr,
        source,
        target: upTarget,
        description: `Move ${card.display} to UP foundation`
      });
    }

    // Check DOWN foundation
    const downTarget = { type: 'foundation', zone: 'down', suit: card.suit };
    const downValidation = validateMove(cardStr, downTarget, gameState);
    if (downValidation.valid) {
      moves.push({
        card: cardStr,
        source,
        target: downTarget,
        description: `Move ${card.display} to DOWN foundation`
      });
    }
  }

  // Check pockets (only single cards, and only if source is not a pocket)
  if (source.type !== 'pocket') {
    const isSingleCard = source.type !== 'tableau' ||
      source.index === (gameState.tableau[source.column.toString()]?.length || 0) - 1;

    if (isSingleCard) {
      const pocketCount = gameState.metadata?.pockets || 1;

      for (let pocketNum = 1; pocketNum <= pocketCount; pocketNum++) {
        const target = { type: 'pocket', pocketNum };
        const validation = validateMove(cardStr, target, gameState);
        if (validation.valid) {
          moves.push({
            card: cardStr,
            source,
            target,
            description: `Move ${card.display} to pocket ${pocketNum}`
          });
        }
      }
    }
  }
}

/**
 * Check if the game is in a stalemate (no valid moves available)
 * This is more nuanced than just checking available moves - we need to
 * consider if cycling through the stock could eventually help
 */
export function checkStalemate(gameState) {
  if (!gameState) return false;

  // If game is won, it's not a stalemate
  if (checkWinCondition(gameState)) return false;

  const moves = getAvailableMoves(gameState);

  // Filter out stock draw and recycle - these don't count as "real" moves
  // for stalemate purposes unless they're the ONLY options
  const realMoves = moves.filter(m => !m.isStockDraw && !m.isRecycle);

  if (realMoves.length > 0) {
    // There are real moves available
    return false;
  }

  // No real moves - check if stock/waste cycling could help
  // This is a simplified check - a full check would simulate all possible draws

  const stockCount = gameState.stock?.length || 0;
  const wasteCount = gameState.waste?.length || 0;

  if (stockCount === 0 && wasteCount === 0) {
    // No cards in stock or waste, no moves available = stalemate
    return true;
  }

  // If there are cards in stock/waste, we need to check if ANY card
  // in the combined stock+waste could be played
  const allStockWasteCards = [
    ...(gameState.stock || []),
    ...(gameState.waste || [])
  ];

  for (const cardStr of allStockWasteCards) {
    // Simulate this card being on top of waste
    const tempState = {
      ...gameState,
      waste: [cardStr]
    };

    const tempSource = { type: 'waste', index: 0 };
    const tempMoves = [];
    addValidMovesForCard(cardStr, tempSource, tempState, tempMoves);

    // Filter to only tableau and foundation moves (not pocket)
    const playableMoves = tempMoves.filter(m =>
      m.target.type === 'tableau' || m.target.type === 'foundation'
    );

    if (playableMoves.length > 0) {
      // At least one card in stock/waste could eventually be played
      return false;
    }
  }

  // Check if any pocket card could be played
  const pocketCards = [gameState.pocket1, gameState.pocket2].filter(Boolean);
  if (pocketCards.length > 0) {
    // There are pocket cards - if no moves from them, might still not be stalemate
    // if pockets can receive cards that could later be played
    // For simplicity, if pockets have cards but no moves, continue checking
  }

  // No card in stock/waste can be played, and no real moves available
  // This is likely a stalemate, but we should also check if any tableau
  // reorganization could help (this is complex, so we'll be conservative)

  return true;
}

/**
 * Get game status summary
 */
export function getGameStatus(gameState) {
  if (!gameState) {
    return { status: 'loading', message: 'Loading game...' };
  }

  if (checkWinCondition(gameState)) {
    return {
      status: 'won',
      message: 'Congratulations! You won!',
      isGameOver: true
    };
  }

  if (checkStalemate(gameState)) {
    return {
      status: 'stalemate',
      message: 'No moves available. Game over.',
      isGameOver: true
    };
  }

  const moves = getAvailableMoves(gameState);
  const realMoves = moves.filter(m => !m.isStockDraw && !m.isRecycle);

  return {
    status: 'playing',
    message: `${realMoves.length} moves available`,
    availableMoves: realMoves.length,
    isGameOver: false
  };
}
