import {
  parseCard,
  canStackCards,
  canPlaceOnFoundation,
  findCardLocation,
  isCardAccessible,
  getMovingCards,
  isValidSequence,
  getStateFingerprint,
  fingerprintToKey,
  deepClone
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
function validateTableauMove(movingCards, target, gameState, source) { // eslint-disable-line no-unused-vars
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
  
  // Flip face-down card if revealed BEFORE updating column types
  // This ensures faceDownCount is current when type is calculated
  let animationInfo = null;
  if (source.type === 'tableau') {
    animationInfo = flipRevealedCard(source.column, newState);
  }
  
  // Update column types after flip (so faceDownCount is current)
  if (source.type === 'tableau') {
    updateColumnType(source.column, newState);
  }
  if (target.type === 'tableau') {
    updateColumnType(target.column, newState);
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
      
    case 'tableau': {
      const column = state.tableau[source.column.toString()];
      column.splice(source.index, cards.length);
      break;
    }
      
    case 'foundation': {
      const foundation = state.foundations[source.zone][source.suit];
      foundation.splice(source.index, cards.length);
      break;
    }
  }
}

/**
 * Add cards to target location
 */
function addToTarget(cards, target, state) {
  switch (target.type) {
    case 'foundation': {
      const foundation = state.foundations[target.zone][target.suit];
      foundation.push(...cards);
      break;
    }
      
    case 'tableau': {
      const column = state.tableau[target.column.toString()];
      column.push(...cards);
      break;
    }
      
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
 * 
 * Column types are "sticky" - once established, they persist regardless of
 * card additions/removals until the column is emptied.
 * 
 * Type determination:
 * - Empty column: type = 'empty'
 * - First card is Ace: type = 'ace' (persists as cards added/removed)
 * - First card is King: type = 'king' (persists as cards added/removed)
 * - First card is other: type = 'traditional' (persists as cards added/removed)
 * 
 * Special case: When face-down cards are revealed (via flipRevealedCard),
 * the type updates based on the newly revealed card.
 */
function updateColumnType(columnIndex, state) {
  const column = state.tableau[columnIndex.toString()] || [];

  if (!state.columnState) {
    state.columnState = { types: [], faceDownCounts: [] };
  }

  // Case 1: Empty column
  if (column.length === 0) {
    state.columnState.types[columnIndex] = 'empty';
    return;
  }

  // Case 2: Determine type based on current bottom face-up card
  // Column type is always determined by the bottom-most face-up card
  // This allows the type to update when cards are removed
  const faceDownCount = state.columnState.faceDownCounts?.[columnIndex] || 0;

  // First face-up card determines column type
  const firstFaceUpIndex = faceDownCount;
  const card = parseCard(column[firstFaceUpIndex]);

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

/**
 * Flip top face-down card if revealed after removing cards
 * Also updates column type if the revealed card is an Ace or King
 * 
 * In hidden modes, after removing the last face-up card, we flip the
 * top face-down card to face-up. The revealed card becomes the new
 * first face-up card at index (faceDownCount - 1).
 * 
 * @returns {object|null} Animation info if Ace was revealed, null otherwise
 */
function flipRevealedCard(columnIndex, state) {
  const column = state.tableau[columnIndex.toString()] || [];
  if (column.length === 0) return null;

  if (!state.columnState) {
    state.columnState = { types: [], faceDownCounts: [] };
  }

  const faceDownCount = state.columnState.faceDownCounts?.[columnIndex] || 0;
  
  // Check if all remaining cards were face-down before this flip
  // This happens when: faceDownCount == column.length (all cards face-down)
  // After removing face-up cards, we need to reveal one face-down card
  if (faceDownCount > 0 && faceDownCount >= column.length) {
    // Decrement faceDownCount to reveal the top face-down card
    const newFaceDownCount = faceDownCount - 1;
    state.columnState.faceDownCounts[columnIndex] = newFaceDownCount;

    // The revealed card is now at index newFaceDownCount
    // (it was face-down, now it's face-up)
    const revealedCardStr = column[newFaceDownCount];
    const revealedCard = parseCard(revealedCardStr);
    
    if (revealedCard) {
      // Type is 'ace' or 'king' only if this is now the ONLY face-up card
      const faceUpCount = column.length - newFaceDownCount;
      
      if (faceUpCount === 1 && revealedCard.value === 'A') {
        state.columnState.types[columnIndex] = 'ace';
        // Return animation info for Ace reveal
        return {
          type: 'ace-reveal',
          cardStr: revealedCardStr,
          columnIndex: columnIndex
        };
      } else if (faceUpCount === 1 && revealedCard.value === 'K') {
        state.columnState.types[columnIndex] = 'king';
      } else {
        state.columnState.types[columnIndex] = 'traditional';
      }
    }
  }
  return null;
}

// ============================================================================
// AUTO-MOVE HELPERS
// ============================================================================

/**
 * Try to auto-move card to any legal destination (for double-click)
 * 
 * Priority order:
 * 1. Foundation (UP or DOWN by suit)
 * 2. Tableau build (extend sequence on another column)
 * 3. Empty column (Ace or King only)
 * 
 * @param {string} cardStr - Card to move (e.g., "Ah")
 * @param {object} gameState - Current game state
 * @param {object} source - Source location {type, column?, pocketNum?}
 * @returns {object|null} - New game state or null if no move available
 */
export function tryAutoMove(cardStr, gameState, source) {
  const card = parseCard(cardStr);
  if (!card) return null;
  
  // Priority 1: Try foundation moves
  const foundationMove = tryFoundationMove(cardStr, card, gameState);
  if (foundationMove) {
    return executeMove(cardStr, foundationMove, gameState);
  }
  
  // Priority 2: Try tableau moves
  const tableauMove = findOptimalTableauMove(cardStr, card, gameState, source);
  if (tableauMove) {
    return executeMove(cardStr, tableauMove, gameState);
  }
  
  return null;
}

/**
 * Try to move card to foundation
 * @returns {object|null} - Target location or null
 */
function tryFoundationMove(cardStr, card, gameState) {
  // Try UP foundations first (7→K)
  const upFoundation = gameState.foundations.up?.[card.suit] || [];
  if (canPlaceOnFoundation(cardStr, upFoundation, false)) {
    return {
      type: 'foundation',
      zone: 'up',
      suit: card.suit
    };
  }
  
  // Try DOWN foundations (6→A)
  const downFoundation = gameState.foundations.down?.[card.suit] || [];
  if (canPlaceOnFoundation(cardStr, downFoundation, true)) {
    return {
      type: 'foundation',
      zone: 'down',
      suit: card.suit
    };
  }
  
  return null;
}

/**
 * Find optimal tableau move for a card
 * Considers: empty columns (A/K only), building on existing sequences
 * 
 * @returns {object|null} - Target location or null
 */
function findOptimalTableauMove(cardStr, card, gameState, source) {
  const columnTypes = gameState.columnState?.types || [];
  const legalMoves = [];
  
  // Check all 7 tableau columns
  for (let col = 0; col < 7; col++) {
    // Skip if this is the source column
    if (source?.type === 'tableau' && source.column === col) {
      continue;
    }
    
    const column = gameState.tableau[col.toString()] || [];
    const columnType = columnTypes[col] || 'traditional';
    
    // Empty column: only Ace or King can start it
    if (column.length === 0) {
      if (card.value === 'A' || card.value === 'K') {
        legalMoves.push({
          target: { type: 'tableau', column: col },
          score: calculateTableauMoveScore(column, columnType, card, 0)
        });
      }
      continue;
    }
    
    // Non-empty column: check if we can stack on top
    const topCard = column[column.length - 1];
    if (canStackCards(topCard, cardStr, columnType)) {
      legalMoves.push({
        target: { type: 'tableau', column: col },
        score: calculateTableauMoveScore(column, columnType, card, column.length)
      });
    }
  }
  
  // Return the highest-scoring move
  if (legalMoves.length > 0) {
    legalMoves.sort((a, b) => b.score - a.score);
    return legalMoves[0].target;
  }
  
  return null;
}

/**
 * Calculate a score for a tableau move to enable optimal selection
 * Higher score = better move
 */
function calculateTableauMoveScore(column, columnType) {
  let score = 0;
  
  // Prefer building on longer sequences (extending existing work)
  score += column.length * 10;
  
  // Prefer Ace/King columns over Traditional (strategic value)
  if (columnType === 'ace' || columnType === 'king') {
    score += 5;
  }
  
  // Slight preference for keeping cards on tableau vs moving to empty
  // (empty columns are valuable, don't fill them lightly)
  if (column.length === 0) {
    score -= 2;
  }
  
  return score;
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

// ============================================================================
// GAME STATE TRACKER (Game State Analyzer - Phase 1)
// ============================================================================

/**
 * GameStateTracker - Tracks game state history to detect circular play
 * and monitor progression toward win condition
 * 
 * Phase 1 Enhanced: Tracks productive vs unproductive moves for better
 * game state notifications (unwinnable detection, stall warnings)
 */
export class GameStateTracker {
  constructor() {
    this.stateHistory = new Map(); // fingerprintKey -> visitCount
    this.moveNumber = 0;
    this.lastProgressMove = 0; // Move number when last progress was made
    this.cycleCount = 0; // Consecutive cycles without new state
    this.unproductiveCycleCount = 0; // Cycles without ANY productive moves
    this.currentFingerprint = null;
    this.previousFingerprint = null;
    
    // Progress tracking (all metrics, not just foundation)
    this.maxFoundationCount = 0;
    this.minFaceDownCount = Infinity;
    this.maxValidSequences = 0;
    
    // Game state for comparison
    this.lastState = null;
    
    // Phase 2: Unwinnable detection cache
    this.lastUnwinnableCheck = null;
  }

  /**
   * Record a move and update tracking state
   * @param {object} gameState - Current game state after move
   * @param {string} moveType - Type of move made ('foundation', 'tableau', 'draw', 'recycle', etc.)
   * @returns {object} Analysis result with enhanced progress detection
   */
  recordMove(gameState, moveType = 'unknown') {
    const fingerprint = getStateFingerprint(gameState);
    const key = fingerprintToKey(fingerprint);
    
    this.previousFingerprint = this.currentFingerprint;
    this.currentFingerprint = fingerprint;
    this.moveNumber++;

    // Check if this is a new state or a repeat
    const visitCount = this.stateHistory.get(key) || 0;
    const isNewState = visitCount === 0;
    
    if (isNewState) {
      this.cycleCount = 0;
    } else {
      this.cycleCount++;
    }

    // Update visit count
    this.stateHistory.set(key, visitCount + 1);

    // Determine if move was productive
    const productivity = this.analyzeProductivity(fingerprint, moveType);
    
    if (productivity.wasProductive) {
      this.unproductiveCycleCount = 0;
      this.lastProgressMove = this.moveNumber;
    } else if (!isNewState) {
      // Same state AND unproductive = true unproductive cycle
      this.unproductiveCycleCount++;
    }

    // Update progress metrics
    this.updateProgressMetrics(fingerprint);

    // Determine status
    const circular = this.isCircularPlay();
    const noProgress = this.isNoProgress();
    const potentiallyStuck = this.isPotentiallyStuck();

    return {
      isNewState,
      visitCount: visitCount + 1,
      circular,
      noProgress,
      potentiallyStuck,
      cycleCount: this.cycleCount,
      unproductiveCycleCount: this.unproductiveCycleCount,
      movesSinceProgress: this.moveNumber - this.lastProgressMove,
      totalFoundationCards: fingerprint.totalFoundationCards,
      wasProductive: productivity.wasProductive,
      productivityDetails: productivity.details
    };
  }

  /**
   * Analyze if a move was productive (made meaningful progress)
   * @param {object} fingerprint - Current state fingerprint
   * @param {string} moveType - Type of move
   * @returns {object} { wasProductive: boolean, details: object }
   */
  analyzeProductivity(fingerprint, moveType) {
    const details = {
      foundationProgress: false,
      faceDownRevealed: false,
      sequencesBuilt: false,
      strategicColumnFill: false
    };

    // Foundation placement is always productive
    if (fingerprint.totalFoundationCards > this.maxFoundationCount) {
      details.foundationProgress = true;
      return { wasProductive: true, details };
    }

    // Face-down cards revealed
    if (fingerprint.faceDownCount < this.minFaceDownCount) {
      details.faceDownRevealed = true;
      return { wasProductive: true, details };
    }

    // Valid sequences created
    if (fingerprint.validSequences > this.maxValidSequences) {
      details.sequencesBuilt = true;
      return { wasProductive: true, details };
    }

    // Strategic moves to empty columns (Ace or King)
    if (moveType === 'tableau-empty' && this.previousFingerprint) {
      if (fingerprint.emptyColumns < this.previousFingerprint.emptyColumns) {
        details.strategicColumnFill = true;
        return { wasProductive: true, details };
      }
    }

    // Pocket card played (not stored)
    if (moveType === 'pocket-to-foundation' || moveType === 'pocket-to-tableau') {
      return { wasProductive: true, details };
    }

    // Strategic cycling: When few cards remain, cycling stock is likely
    // part of a winning strategy (finding the right card to finish)
    // This prevents false "unproductive play" warnings near game end
    if (moveType === 'recycle' || moveType === 'draw') {
      const cardsRemaining = 52 - (fingerprint.totalFoundationCards || 0);
      if (cardsRemaining <= 10) {
        details.strategicCycling = true;
        details.cardsRemaining = cardsRemaining;
        return { wasProductive: true, details };
      }
    }

    return { wasProductive: false, details };
  }

  /**
   * Update stored progress metrics
   * @param {object} fingerprint - Current fingerprint
   */
  updateProgressMetrics(fingerprint) {
    if (fingerprint.totalFoundationCards > this.maxFoundationCount) {
      this.maxFoundationCount = fingerprint.totalFoundationCards;
    }
    
    if (fingerprint.faceDownCount < this.minFaceDownCount) {
      this.minFaceDownCount = fingerprint.faceDownCount;
    }
    
    if (fingerprint.validSequences > this.maxValidSequences) {
      this.maxValidSequences = fingerprint.validSequences;
    }
  }

  /**
   * Check if we're in a circular play pattern (3+ repeats)
   * @returns {boolean}
   */
  isCircularPlay() {
    return this.cycleCount >= 3;
  }

  /**
   * Check if we've gone too long without progress
   * @returns {boolean}
   */
  isNoProgress() {
    // 30+ moves without progress = no progress (conservative threshold)
    return (this.moveNumber - this.lastProgressMove) > 30;
  }

  /**
   * Check if player is potentially stuck (5+ unproductive cycles)
   * @returns {boolean}
   */
  isPotentiallyStuck() {
    return this.unproductiveCycleCount >= 5;
  }

  /**
   * Get current tracker statistics
   * @returns {object}
   */
  getStats() {
    return {
      moveNumber: this.moveNumber,
      uniqueStates: this.stateHistory.size,
      totalVisits: Array.from(this.stateHistory.values()).reduce((a, b) => a + b, 0),
      cycleCount: this.cycleCount,
      unproductiveCycleCount: this.unproductiveCycleCount,
      lastProgressMove: this.lastProgressMove,
      movesSinceProgress: this.moveNumber - this.lastProgressMove,
      maxFoundationCount: this.maxFoundationCount,
      minFaceDownCount: this.minFaceDownCount,
      maxValidSequences: this.maxValidSequences,
      isCircular: this.isCircularPlay(),
      isNoProgress: this.isNoProgress(),
      isPotentiallyStuck: this.isPotentiallyStuck(),
      unwinnableStatus: this.lastUnwinnableCheck
    };
  }

  /**
   * Reset tracker for new game
   */
  reset() {
    this.stateHistory.clear();
    this.moveNumber = 0;
    this.lastProgressMove = 0;
    this.cycleCount = 0;
    this.unproductiveCycleCount = 0;
    this.currentFingerprint = null;
    this.previousFingerprint = null;
    this.maxFoundationCount = 0;
    this.minFaceDownCount = Infinity;
    this.maxValidSequences = 0;
    this.lastState = null;
    this.lastUnwinnableCheck = null;
  }

  /**
   * Check if current state has been seen before
   * @returns {number} Visit count (0 if never seen)
   */
  getCurrentStateVisitCount() {
    if (!this.currentFingerprint) return 0;
    const key = fingerprintToKey(this.currentFingerprint);
    return this.stateHistory.get(key) || 0;
  }

  /**
   * Check if game is unwinnable (Phase 2)
   * Triggers solver-based detection when unproductive cycles are high
   * 
   * @param {object} gameState - Current game state
   * @param {boolean} forceDeep - Force deep check even if cycles are low
   * @returns {object|null} Unwinnable check result or null if not checked
   */
  checkUnwinnable(gameState, forceDeep = false) {
    // Only check if we've had significant unproductive cycles or forced
    const shouldCheck = forceDeep || this.unproductiveCycleCount >= 4;
    
    if (!shouldCheck) {
      return null;
    }

    // Use quick check first, deep check if cycles are very high
    const useDeepCheck = forceDeep || this.unproductiveCycleCount >= 6;
    const result = useDeepCheck 
      ? deepUnwinnableCheck(gameState)
      : quickUnwinnableCheck(gameState);

    // Cache the result
    this.lastUnwinnableCheck = {
      ...result,
      checkedAt: this.moveNumber,
      cycleCountAtCheck: this.unproductiveCycleCount
    };

    return this.lastUnwinnableCheck;
  }

  /**
   * Get cached unwinnable check result
   * @returns {object|null}
   */
  getUnwinnableStatus() {
    return this.lastUnwinnableCheck;
  }
}

// ============================================================================
// UNWINNABLE DETECTION (Phase 2)
// ============================================================================

/**
 * UnwinnableStateDetector - Uses limited-depth BFS to detect unwinnable games
 * 
 * This is a "best effort" solver that explores possible moves from the current
 * state to determine if a win is still possible. It's designed to be fast
 * enough to run during gameplay while providing high confidence results.
 * 
 * Algorithm:
 * 1. Use BFS to explore move tree from current state
 * 2. Track visited states to avoid cycles
 * 3. Limit search by node count (performance guard)
 * 4. If win found -> definitely winnable
 * 5. If search exhausted -> likely unwinnable (high confidence)
 * 6. If hit node limit -> unknown (medium confidence)
 * 
 * @param {object} gameState - Current game state
 * @param {object} options - Configuration options
 * @returns {object} Detection result { isUnwinnable, confidence, nodesExplored }
 */
export function detectUnwinnableState(gameState, options = {}) {
  const {
    maxNodes = 5000,        // Limit search to prevent UI blocking
    maxDepth = 15,          // Max moves to look ahead
    trackPaths = false      // For debugging - returns winning path if found
  } = options;

  const startTime = performance.now();

  if (!gameState || checkWinCondition(gameState)) {
    return { isUnwinnable: false, confidence: 'certain', nodesExplored: 0, reason: 'already_won' };
  }

  // Quick check: if no moves available, definitely stuck
  const immediateMoves = getAvailableMoves(gameState);
  const realMoves = immediateMoves.filter(m => !m.isStockDraw && !m.isRecycle);
  if (realMoves.length === 0 && gameState.stock.length === 0) {
    return { isUnwinnable: true, confidence: 'high', nodesExplored: 1, reason: 'no_moves' };
  }

  // BFS setup
  const visited = new Set();
  const queue = [{ state: gameState, depth: 0, path: [] }];
  let nodesExplored = 0;
  const maxTime = 100; // 100ms time limit

  while (queue.length > 0 && nodesExplored < maxNodes) {
    // Time check to prevent UI blocking
    if (performance.now() - startTime > maxTime) {
      return { 
        isUnwinnable: null, // Unknown - hit time limit
        confidence: 'low', 
        nodesExplored, 
        reason: 'time_limit',
        message: 'Search incomplete - game may still be winnable'
      };
    }

    const { state, depth, path } = queue.shift();
    nodesExplored++;

    // Get state fingerprint for cycle detection
    const fingerprint = getStateFingerprint(state);
    const stateKey = fingerprintToKey(fingerprint);

    // Skip if already visited
    if (visited.has(stateKey)) continue;
    visited.add(stateKey);

    // Get all possible moves from this state
    const moves = getAvailableMoves(state);

    // Filter to actual moves (exclude just cycling stock)
    const productiveMoves = moves.filter(m => 
      !m.isStockDraw && !m.isRecycle
    );

    // If no productive moves but stock has cards, consider stock draws
    const movesToTry = productiveMoves.length > 0 
      ? productiveMoves 
      : moves.filter(m => m.isStockDraw);

    for (const move of movesToTry) {
      // Execute move to get new state
      let newState;
      try {
        newState = executeMove(move.card, move.target, state);
      } catch {
        continue; // Skip invalid moves
      }

      if (!newState) continue;

      // Check for win
      if (checkWinCondition(newState)) {
        const duration = performance.now() - startTime;
        const result = {
          isUnwinnable: false,
          confidence: 'certain',
          nodesExplored,
          winningPath: trackPaths ? [...path, move] : undefined,
          reason: 'win_found',
          duration
        };
        if (import.meta.env.DEV) {
          console.log('[GSN] Solver: Win found', { nodesExplored, duration: `${duration.toFixed(2)}ms` });
        }
        return result;
      }

      // Add to queue if within depth limit
      if (depth < maxDepth) {
        queue.push({
          state: newState,
          depth: depth + 1,
          path: trackPaths ? [...path, move] : undefined
        });
      }
    }
  }

  // Search exhausted without finding win
  const confidence = nodesExplored > 1000 ? 'high' : nodesExplored > 500 ? 'medium' : 'low';
  const duration = performance.now() - startTime;
  
  const result = {
    isUnwinnable: true,
    confidence,
    nodesExplored,
    reason: nodesExplored >= maxNodes ? 'node_limit' : 'exhausted',
    duration,
    message: confidence === 'high' 
      ? 'Extensive search found no path to win'
      : 'Limited search found no path to win'
  };
  
  if (import.meta.env.DEV) {
    console.log('[GSN] Solver: No win found', { 
      isUnwinnable: true, 
      confidence, 
      nodesExplored, 
      duration: `${duration.toFixed(2)}ms`,
      reason: result.reason
    });
  }
  
  return result;
}

/**
 * Quick unwinnable check for use during normal gameplay
 * Uses lighter parameters for responsiveness
 * 
 * @param {object} gameState - Current game state
 * @returns {object} { isUnwinnable, confidence }
 */
export function quickUnwinnableCheck(gameState) {
  return detectUnwinnableState(gameState, {
    maxNodes: 1000,
    maxDepth: 10,
    trackPaths: false
  });
}

/**
 * Deep unwinnable check for "confirmed" tier notification
 * Uses heavier parameters for higher confidence
 * 
 * @param {object} gameState - Current game state
 * @returns {object} { isUnwinnable, confidence, nodesExplored }
 */
export function deepUnwinnableCheck(gameState) {
  return detectUnwinnableState(gameState, {
    maxNodes: 10000,
    maxDepth: 20,
    trackPaths: false
  });
}

// ============================================================================
// AUTO-COMPLETE DETECTION (Phase 4)
// ============================================================================

/**
 * Check if the game is in a state where all remaining cards can be
 * automatically moved to foundations (trivially winnable).
 * 
 * Conditions:
 * 1. Stock is empty
 * 2. Waste is empty
 * 3. Pockets are empty
 * 4. All tableau cards are face-up
 * 5. No blocked sequences (cards blocking each other)
 * 
 * @param {object} gameState - Current game state
 * @returns {boolean} True if game can be auto-completed
 */
export function canAutoComplete(gameState) {
  if (!gameState) return false;

  // Condition 1: Stock must be empty
  if (gameState.stock && gameState.stock.length > 0) {
    return false;
  }

  // Condition 2: Waste must be empty
  if (gameState.waste && gameState.waste.length > 0) {
    return false;
  }

  // Condition 3: Pockets must be empty
  if (gameState.pocket1 || gameState.pocket2) {
    return false;
  }

  // Condition 4: All tableau cards must be face-up
  for (let col = 0; col < 7; col++) {
    const faceDownCount = gameState.columnState?.faceDownCounts?.[col] || 0;
    if (faceDownCount > 0) {
      return false;
    }
  }

  // Condition 5: No blocked sequences
  if (hasBlockedSequences(gameState)) {
    return false;
  }

  return true;
}

/**
 * Check if there are any blocked sequences that prevent auto-complete.
 * A blocked sequence occurs when cards are arranged such that they
 * circularly depend on each other (e.g., 7 of spades on 8 of hearts, but 8 of hearts needed on 7 of spades foundation).
 * 
 * @param {object} gameState - Current game state
 * @returns {boolean} True if blocked sequences exist
 */
function hasBlockedSequences(gameState) {
  // For each tableau column, check if the bottom card (or sequence)
  // can eventually reach foundation given current foundation state
  
  for (let col = 0; col < 7; col++) {
    const column = gameState.tableau[col.toString()] || [];
    if (column.length === 0) continue;

    // Get the bottom card (first in array)
    const bottomCard = parseCard(column[0]);
    if (!bottomCard) continue;

    // Check if this card can reach foundation
    // A card can reach foundation if:
    // 1. It's the next card for UP foundation (previous value), OR
    // 2. It's the next card for DOWN foundation (next value), OR
    // 3. It's blocked by a card above it that can move

    const canReachFoundation = checkCardCanReachFoundation(
      bottomCard,
      gameState.foundations,
      column.slice(1) // Cards above
    );

    if (!canReachFoundation) {
      // This card is blocked - check if it's a circular dependency
      if (isCircularlyBlocked(bottomCard, column.slice(1), gameState)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if a specific card can eventually reach foundation
 * @param {object} card - Parsed card object
 * @param {object} foundations - Current foundations state
 * @param {string[]} cardsAbove - Cards above this one in the column
 * @returns {boolean}
 */
function checkCardCanReachFoundation(card, foundations, cardsAbove) {
  // Check UP foundation (builds 7→K)
  const upFoundation = foundations.up?.[card.suit] || [];
  const upTopCard = upFoundation.length > 0 ? upFoundation[upFoundation.length - 1] : null;
  const upTopValue = upTopCard ? parseCard(upTopCard)?.v : 5; // 5 = value of 6 (start of UP)
  
  // For UP: we need card.value === upTopValue + 1
  // (e.g., if 7 is on foundation, we need 8)
  if (card.v === upTopValue + 1) {
    return true;
  }

  // Check DOWN foundation (builds 6→A)
  const downFoundation = foundations.down?.[card.suit] || [];
  const downTopCard = downFoundation.length > 0 ? downFoundation[downFoundation.length - 1] : null;
  const downTopValue = downTopCard ? parseCard(downTopCard)?.v : 6; // 6 = value of 7 (start of DOWN)
  
  // For DOWN: we need card.value === downTopValue - 1
  // (e.g., if 7 is on foundation, we need 6)
  if (card.v === downTopValue - 1) {
    return true;
  }

  // If cards above can move away, this card might become free
  // This is a simplified check - in reality we'd need full dependency analysis
  return cardsAbove.length === 0;
}

/**
 * Check if a card is circularly blocked by cards above it
 * @param {object} card - Parsed card object
 * @param {string[]} cardsAbove - Cards above this one
 * @param {object} gameState - Full game state
 * @returns {boolean}
 */
function isCircularlyBlocked(card, cardsAbove, gameState) {
  // Simplified check: if there are cards above that can't move to foundation
  // and the current card also can't move, we might have a circular dependency
  
  if (cardsAbove.length === 0) {
    // No cards above, so not blocked by anything
    return false;
  }

  // Check if any card above can move to foundation
  for (const aboveCardStr of cardsAbove) {
    const aboveCard = parseCard(aboveCardStr);
    if (!aboveCard) continue;

    if (checkCardCanReachFoundation(aboveCard, gameState.foundations, [])) {
      // This card can move, so the bottom card might become free
      return false;
    }
  }

  // All cards above are also blocked - potential circular dependency
  // In a full implementation, we'd trace the full dependency chain
  return true;
}


// ============================================================================
// AUTO-COMPLETE EXECUTION (Phase 5)
// ============================================================================

/**
 * Find all available foundation moves for auto-complete
 * Returns array of move objects: { card, from, to }
 * 
 * @param {Object} gameState - Current game state
 * @returns {Array} - Array of available foundation moves
 */
export function getAllFoundationMoves(gameState) {
  const moves = [];
  const { tableau, foundations, waste, pocket1, pocket2 } = gameState;
  
  // Helper to check and add foundation move
  const checkFoundationMove = (cardStr, source) => {
    if (!cardStr) return;
    
    const card = parseCard(cardStr);
    if (!card) return;
    
    // Try UP foundation
    const upFoundation = foundations?.up?.[card.suit] || [];
    if (canPlaceOnFoundation(cardStr, upFoundation, false)) {
      moves.push({
        card: cardStr,
        from: source,
        to: { type: 'foundation', zone: 'up', suit: card.suit }
      });
      return;
    }
    
    // Try DOWN foundation
    const downFoundation = foundations?.down?.[card.suit] || [];
    if (canPlaceOnFoundation(cardStr, downFoundation, true)) {
      moves.push({
        card: cardStr,
        from: source,
        to: { type: 'foundation', zone: 'down', suit: card.suit }
      });
    }
  };
  
  // Check waste top card
  const wasteTop = waste?.[waste.length - 1];
  checkFoundationMove(wasteTop, { type: 'waste' });
  
  // Check pocket cards
  checkFoundationMove(pocket1, { type: 'pocket', pocketNum: 1 });
  checkFoundationMove(pocket2, { type: 'pocket', pocketNum: 2 });
  
  // Check tableau column bottom cards (exposed cards)
  for (let col = 0; col < 7; col++) {
    const column = tableau?.[col.toString()] || [];
    if (column.length > 0) {
      const bottomCard = column[column.length - 1];
      checkFoundationMove(bottomCard, { type: 'tableau', column: col });
    }
  }
  
  return moves;
}

/**
 * Execute a single foundation move for auto-complete
 * Returns new game state or null if move failed
 * 
 * @param {Object} gameState - Current game state
 * @param {Object} move - Move object from getAllFoundationMoves
 * @returns {Object|null} - New game state or null
 */
export function executeFoundationMove(gameState, move) {
  const { card, from, to } = move;
  
  // Create deep clone
  const newState = deepClone(gameState);
  
  // Remove card from source
  switch (from.type) {
    case 'waste':
      newState.waste = newState.waste.filter(c => c !== card);
      break;
    case 'pocket':
      if (from.pocketNum === 1) newState.pocket1 = null;
      if (from.pocketNum === 2) newState.pocket2 = null;
      break;
    case 'tableau': {
      const col = from.column;
      newState.tableau[col] = newState.tableau[col].filter(c => c !== card);
      break;
    }
    default:
      return null;
  }
  
  // Add card to foundation
  if (to.type === 'foundation') {
    const foundation = newState.foundations[to.zone][to.suit];
    foundation.push(card);
  }
  
  return newState;
}


// ============================================================================
// HINT SYSTEM (Phase 6)
// ============================================================================

/**
 * Hint priority levels
 * Higher number = higher priority
 */
export const HINT_PRIORITY = {
  FOUNDATION: 3,      // Can move to foundation (always good)
  TABLEAU_BUILD: 2,   // Can build on tableau (usually good)
  EXPOSE_CARD: 1,     // Moving frees a face-down card
  POCKET: 0,          // Can use pocket (situational)
  LOW: -1             // Low priority / risky move
};

/**
 * Get hints for current game state
 * Returns prioritized list of suggested moves
 * 
 * @param {Object} gameState - Current game state
 * @param {number} limit - Maximum number of hints to return
 * @returns {Array} - Array of hint objects: { card, from, to, priority, reason }
 */
export function getHints(gameState, limit = 5) {
  const hints = [];
  const { tableau, waste, pocket1, pocket2, stock } = gameState;
  
  // Helper to add hint if not duplicate
  const addHint = (hint) => {
    // Check if we already have this card with same or better priority
    const existing = hints.find(h => h.card === hint.card && h.priority >= hint.priority);
    if (!existing) {
      hints.push(hint);
    }
  };
  
  // 1. Check waste top card for foundation/tableau moves
  const wasteTop = waste?.[waste.length - 1];
  if (wasteTop) {
    const wasteHints = getHintsForCard(wasteTop, { type: 'waste' }, gameState);
    wasteHints.forEach(addHint);
  }
  
  // 2. Check pocket cards
  if (pocket1) {
    const pocket1Hints = getHintsForCard(pocket1, { type: 'pocket', pocketNum: 1 }, gameState);
    pocket1Hints.forEach(addHint);
  }
  if (pocket2) {
    const pocket2Hints = getHintsForCard(pocket2, { type: 'pocket', pocketNum: 2 }, gameState);
    pocket2Hints.forEach(addHint);
  }
  
  // 3. Check tableau exposed cards
  for (let col = 0; col < 7; col++) {
    const column = tableau?.[col.toString()] || [];
    if (column.length > 0) {
      const bottomCard = column[column.length - 1];
      const cardHints = getHintsForCard(bottomCard, { type: 'tableau', column: col }, gameState);
      cardHints.forEach(addHint);
      
      // Check if moving this card would free a face-down card
      const faceDownCount = gameState.columnState?.faceDownCounts?.[col] || 0;
      if (faceDownCount > 0 && column.length === 1) {
        // This is the last face-up card, moving it exposes face-down
        const exposeHint = cardHints.find(h => h.priority >= HINT_PRIORITY.TABLEAU_BUILD);
        if (exposeHint) {
          exposeHint.reason += ' (exposes face-down card)';
          exposeHint.priority = HINT_PRIORITY.EXPOSE_CARD;
        }
      }
    }
  }
  
  // 4. Check if stock draw would help (if no other good moves)
  if (hints.length === 0 && stock?.length > 0) {
    // Check if any stock card could be played
    const stockHints = [];
    for (const cardStr of stock) {
      const tempHints = getHintsForCard(cardStr, { type: 'stock' }, gameState);
      if (tempHints.length > 0) {
        stockHints.push({
          card: cardStr,
          from: { type: 'stock' },
          to: tempHints[0].to,
          priority: HINT_PRIORITY.LOW,
          reason: 'Draw from stock to access playable card'
        });
      }
    }
    
    if (stockHints.length > 0) {
      // Just suggest drawing from stock
      addHint({
        card: null,
        from: { type: 'stock' },
        to: { type: 'waste' },
        priority: HINT_PRIORITY.LOW,
        reason: 'Draw from stock'
      });
    }
  }
  
  // Sort by priority (highest first) and limit
  hints.sort((a, b) => b.priority - a.priority);
  return hints.slice(0, limit);
}

/**
 * Get hints for a specific card
 * 
 * @param {string} cardStr - Card to check
 * @param {Object} source - Source location
 * @param {Object} gameState - Current game state
 * @returns {Array} - Array of hint objects
 */
function getHintsForCard(cardStr, source, gameState) {
  const hints = [];
  const card = parseCard(cardStr);
  if (!card) return hints;
  
  // Check foundation moves (highest priority)
  const upFoundation = gameState.foundations?.up?.[card.suit] || [];
  if (canPlaceOnFoundation(cardStr, upFoundation, false)) {
    hints.push({
      card: cardStr,
      from: source,
      to: { type: 'foundation', zone: 'up', suit: card.suit },
      priority: HINT_PRIORITY.FOUNDATION,
      reason: 'Play to foundation'
    });
  }
  
  const downFoundation = gameState.foundations?.down?.[card.suit] || [];
  if (canPlaceOnFoundation(cardStr, downFoundation, true)) {
    hints.push({
      card: cardStr,
      from: source,
      to: { type: 'foundation', zone: 'down', suit: card.suit },
      priority: HINT_PRIORITY.FOUNDATION,
      reason: 'Play to foundation'
    });
  }
  
  // Check tableau builds
  const columnTypes = gameState.columnState?.types || [];
  for (let col = 0; col < 7; col++) {
    // Skip source column
    if (source?.type === 'tableau' && source.column === col) continue;
    
    const column = gameState.tableau?.[col.toString()] || [];
    const columnType = columnTypes[col];
    
    // Check if card can be placed on this column
    if (canPlaceOnColumn(cardStr, column, columnType)) {
      hints.push({
        card: cardStr,
        from: source,
        to: { type: 'tableau', column: col },
        priority: HINT_PRIORITY.TABLEAU_BUILD,
        reason: 'Build on tableau'
      });
    }
  }
  
  return hints;
}

/**
 * Check if a card can be placed on a specific column
 */
function canPlaceOnColumn(cardStr, column, columnType) {
  const card = parseCard(cardStr);
  if (!card) return false;
  
  // Empty column - only Aces or Kings
  if (column.length === 0) {
    return card.numericValue === 1 || card.numericValue === 13;
  }
  
  const topCardStr = column[column.length - 1];
  const topCard = parseCard(topCardStr);
  if (!topCard) return false;
  
  // Check based on column type
  if (columnType === 'ace') {
    // Ace column: ascending, same suit
    return card.numericValue === topCard.numericValue + 1 && 
           card.suit === topCard.suit &&
           card.numericValue <= 6;
  } else if (columnType === 'king') {
    // King column: descending, same suit
    return card.numericValue === topCard.numericValue - 1 && 
           card.suit === topCard.suit &&
           card.numericValue >= 7;
  } else {
    // Traditional: descending, alternating colors
    return card.numericValue === topCard.numericValue - 1 && 
           card.color !== topCard.color;
  }
}

/**
 * Get the best hint for current state
 * @returns {Object|null} - Best hint or null if no hints
 */
export function getBestHint(gameState) {
  const hints = getHints(gameState, 1);
  return hints.length > 0 ? hints[0] : null;
}
