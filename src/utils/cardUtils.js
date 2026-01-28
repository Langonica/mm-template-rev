import { CARD_MAP, SUIT_MAP } from '../data/constants';

// ============================================================================
// CARD PARSING & CONVERSION
// ============================================================================

/**
 * Simple deterministic rotation based on card string
 */
export function getCardRotation(cardStr, seed = 0) {
  if (!cardStr) return 0;
  
  // Simple hash function for deterministic rotation
  let hash = 0;
  for (let i = 0; i < cardStr.length; i++) {
    hash = ((hash << 5) - hash) + cardStr.charCodeAt(i);
    hash = hash & hash;
  }
  
  // Use seed to create variation
  hash = (hash * 9301 + 49297) % 233280;
  return ((hash + seed) % 5) - 2; // Range -2 to 2 degrees
}

/**
 * Parse card string (e.g., "Ah", "10s") into card data object
 */
export function parseCard(cardStr) {
  if (!cardStr || typeof cardStr !== 'string') {
    console.warn(`Invalid card string: "${cardStr}"`);
    return null;
  }
  
  const match = cardStr.match(/^([A2-9JQK]|10)([hdcs])$/);
  if (!match) {
    console.error(`Invalid card string: "${cardStr}"`);
    return null;
  }
  
  const value = match[1];
  const suit = match[2];
  
  return {
    v: CARD_MAP[value],
    s: SUIT_MAP[suit],
    value: value,
    suit: suit,
    numericValue: CARD_MAP[value] + 1, // A=1, 2=2, ..., K=13
    color: suit === 'h' || suit === 'd' ? 'red' : 'black',
    display: cardStr
  };
}

/**
 * Convert simple card string to full Card object with unique ID
 * Used when loading snapshots that store cards as simple strings
 */
export function convertToCardObject(cardStr, timestamp = null) {
  const parsed = parseCard(cardStr);
  if (!parsed) return null;
  
  const id = `${cardStr}_${timestamp || Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id,
    value: parsed.value,
    suit: parsed.suit,
    color: parsed.color,
    numericValue: parsed.numericValue,
    isFaceUp: true,
    display: cardStr
  };
}

/**
 * Get numeric value from card value string
 */
export function getNumericValue(value) {
  if (!value) return 0;
  return (CARD_MAP[value.toUpperCase()] || 0) + 1;
}

// ============================================================================
// COLUMN TYPE UTILITIES
// ============================================================================

export function getColumnType(cardData, columnIndex, isPressureTest = false) {
  if (isPressureTest) {
    if (!cardData || !cardData.value) return 'empty';
    const value = cardData.value.toUpperCase();
    if (value === 'A') return 'ace';
    if (value === 'K') return 'king';
    return 'traditional';
  }
  
  if (columnIndex === 0) {
    if (!cardData || !cardData.value) return 'empty';
    const value = cardData.value.toUpperCase();
    if (value === 'A') return 'ace';
    if (value === 'K') return 'king';
    return 'traditional';
  }
  
  return 'traditional';
}

export function getColumnTypeName(columnType) {
  return columnType === 'ace' ? '' : 
         columnType === 'king' ? '' : 
         columnType === 'empty' ? '' : 
         '';
}

// ============================================================================
// CARD SEQUENCE VALIDATION
// ============================================================================

/**
 * Check if two cards can be stacked (color alternation + value)
 */
export function canStackCards(bottomCard, topCard, columnType = 'traditional') {
  if (!bottomCard || !topCard) return false;
  
  const bottom = typeof bottomCard === 'string' ? parseCard(bottomCard) : bottomCard;
  const top = typeof topCard === 'string' ? parseCard(topCard) : topCard;
  
  if (!bottom || !top) return false;
  
  // Must alternate colors
  if (bottom.color === top.color) return false;
  
  // Check value sequence based on column type
  if (columnType === 'ace') {
    // Ace column: ascending only (A→2→3→4→5→6)
    return top.numericValue === bottom.numericValue + 1 && top.numericValue <= 6;
  } else if (columnType === 'king') {
    // King column: descending only (K→Q→J→10→9→8→7)
    return top.numericValue === bottom.numericValue - 1 && top.numericValue >= 7;
  } else {
    // Traditional: descending only (standard solitaire rules - 5 goes on 6)
    return top.numericValue === bottom.numericValue - 1;
  }
}

/**
 * Validate a sequence of cards is properly ordered
 */
export function isValidSequence(cards, columnType = 'traditional') {
  if (!cards || cards.length <= 1) return true;
  
  for (let i = 0; i < cards.length - 1; i++) {
    const current = typeof cards[i] === 'string' ? parseCard(cards[i]) : cards[i];
    const next = typeof cards[i + 1] === 'string' ? parseCard(cards[i + 1]) : cards[i + 1];
    
    const canStack = canStackCards(current, next, columnType);
    if (!canStack) {
      console.log(`Invalid sequence at position ${i}:`, {
        current: cards[i],
        next: cards[i + 1],
        columnType,
        reason: 'canStackCards returned false'
      });
      return false;
    }
  }
  
  return true;
}

/**
 * Check if card can be placed on foundation
 */
export function canPlaceOnFoundation(card, foundation, isDownFoundation) {
  const cardData = typeof card === 'string' ? parseCard(card) : card;
  if (!cardData) return false;
  
  // Empty foundation
  if (!foundation || foundation.length === 0) {
    // UP foundations start with 7
    if (!isDownFoundation) {
      return cardData.numericValue === 7;
    }
    // DOWN foundations start with 6
    return cardData.numericValue === 6;
  }
  
  // Get top card of foundation
  const topCard = typeof foundation[foundation.length - 1] === 'string' 
    ? parseCard(foundation[foundation.length - 1])
    : foundation[foundation.length - 1];
  
  if (!topCard) return false;
  
  // Must match suit
  if (cardData.suit !== topCard.suit) return false;
  
  // Check sequence
  if (!isDownFoundation) {
    // UP foundation: must be next ascending (7→8→9→10→J→Q→K)
    return cardData.numericValue === topCard.numericValue + 1 && cardData.numericValue <= 13;
  } else {
    // DOWN foundation: must be next descending (6→5→4→3→2→A)
    return cardData.numericValue === topCard.numericValue - 1 && cardData.numericValue >= 1;
  }
}

// ============================================================================
// CARD LOCATION & ACCESSIBILITY
// ============================================================================

/**
 * Find which location a card is in
 */
export function findCardLocation(cardStr, gameState) {
  if (!cardStr || !gameState) return null;
  
  // Check waste (top card only)
  if (gameState.waste && gameState.waste.length > 0) {
    if (gameState.waste[gameState.waste.length - 1] === cardStr) {
      return { type: 'waste', index: gameState.waste.length - 1 };
    }
  }
  
  // Check pockets
  if (gameState.pocket1 === cardStr) {
    return { type: 'pocket', pocketNum: 1 };
  }
  if (gameState.pocket2 === cardStr) {
    return { type: 'pocket', pocketNum: 2 };
  }
  
  // Check tableau
  if (gameState.tableau) {
    for (let col = 0; col < 7; col++) {
      const column = gameState.tableau[col.toString()] || [];
      const index = column.indexOf(cardStr);
      if (index !== -1) {
        return { type: 'tableau', column: col, index };
      }
    }
  }
  
  // Check foundations
  if (gameState.foundations) {
    const zones = ['up', 'down'];
    const suits = ['h', 'd', 'c', 's'];
    
    for (const zone of zones) {
      for (const suit of suits) {
        const foundation = gameState.foundations[zone]?.[suit] || [];
        const index = foundation.indexOf(cardStr);
        if (index !== -1) {
          return { 
            type: 'foundation', 
            zone, 
            suit, 
            index,
            isDown: zone === 'down'
          };
        }
      }
    }
  }
  
  return null;
}

/**
 * Check if a card is accessible for dragging
 */
export function isCardAccessible(cardStr, location, gameState) {
  if (!location || !gameState) return false;
  
  switch (location.type) {
    case 'waste':
      // Only top card is accessible
      const wasteLength = gameState.waste?.length || 0;
      const isTopWaste = location.index === wasteLength - 1;
      console.log(`Waste accessibility: index=${location.index}, wasteLength=${wasteLength}, isTop=${isTopWaste}`);
      return isTopWaste;
      
    case 'pocket':
      // Card in pocket is always accessible
      return true;
      
    case 'foundation':
      // Cards CAN be dragged from foundations (spec correction)
      // Only top card is accessible
      const foundation = gameState.foundations[location.zone]?.[location.suit] || [];
      return location.index === foundation.length - 1;
      
    case 'tableau':
      const column = gameState.tableau[location.column.toString()] || [];
      
      // Get face-down count for this column
      const faceDownCount = gameState.columnState?.faceDownCounts?.[location.column] || 0;
      
      // Card must be face-up
      if (location.index < faceDownCount) {
        console.log(`Card ${cardStr} not accessible: face-down (index ${location.index} < ${faceDownCount})`);
        return false;
      }
      
      // All cards from this position to top must form valid sequence
      const cardsAbove = column.slice(location.index);
      const columnType = gameState.columnState?.types?.[location.column] || 'traditional';
      
      const isValid = isValidSequence(cardsAbove, columnType);
      console.log(`Card ${cardStr} accessible check:`, {
        column: location.column,
        index: location.index,
        cardsAbove,
        columnType,
        isValid
      });
      
      return isValid;
      
    default:
      return false;
  }
}

/**
 * Get all cards that would move with the dragged card (for tableau sequences)
 */
export function getMovingCards(cardStr, location, gameState) {
  if (location.type !== 'tableau') {
    return [cardStr];
  }
  
  const column = gameState.tableau[location.column.toString()] || [];
  const cards = column.slice(location.index);
  
  return cards;
}
