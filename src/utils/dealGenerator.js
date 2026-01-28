import { parseCard } from './cardUtils';

// ============================================================================
// DEAL GENERATOR - Creates random deals for each game mode
// ============================================================================

/**
 * Mode configurations
 */
const MODE_CONFIGS = {
  classic: {
    pockets: 1,
    allUp: true,
    faceDownPattern: false,
    name: 'CLASSIC',
    description: 'Classic mode - all cards face-up, 1 pocket'
  },
  classic_double: {
    pockets: 2,
    allUp: true,
    faceDownPattern: false,
    name: 'CLASSIC DOUBLE',
    description: 'Classic Double mode - all cards face-up, 2 pockets'
  },
  hidden: {
    pockets: 1,
    allUp: false,
    faceDownPattern: true,
    name: 'HIDDEN',
    description: 'Hidden mode - face-down cards in tableau, 1 pocket'
  },
  hidden_double: {
    pockets: 2,
    allUp: false,
    faceDownPattern: true,
    name: 'HIDDEN DOUBLE',
    description: 'Hidden Double mode - face-down cards in tableau, 2 pockets'
  }
};

/**
 * Create a standard 52-card deck
 * @returns {string[]} Array of card strings (e.g., "Ah", "2c", etc.)
 */
function createDeck() {
  const suits = ['h', 'd', 'c', 's'];
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck = [];

  for (const suit of suits) {
    for (const value of values) {
      deck.push(`${value}${suit}`);
    }
  }

  return deck;
}

/**
 * Fisher-Yates shuffle algorithm
 * @param {any[]} array - Array to shuffle
 * @returns {any[]} Shuffled array (mutates original)
 */
function shuffleDeck(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Determine column type based on bottom card
 * @param {string} cardStr - Card string
 * @returns {string} Column type: 'ace', 'king', or 'traditional'
 */
function getColumnTypeFromCard(cardStr) {
  const card = parseCard(cardStr);
  if (!card) return 'traditional';

  if (card.value === 'A') return 'ace';
  if (card.value === 'K') return 'king';
  return 'traditional';
}

/**
 * Generate a random deal for the specified game mode
 * @param {string} mode - Game mode: 'classic', 'double_pocket', 'traditional', 'expert'
 * @returns {object} Game state object matching snapshot format
 */
export function generateRandomDeal(mode) {
  const config = MODE_CONFIGS[mode];
  if (!config) {
    console.error(`Unknown mode: ${mode}`);
    return null;
  }

  // Create and shuffle deck
  const deck = createDeck();
  shuffleDeck(deck);

  // Deal tableau (28 cards total)
  // Column 0: 1 card, Column 1: 2 cards, ..., Column 6: 7 cards
  const tableau = {};
  const columnState = {
    types: [],
    faceUpCounts: [],
    faceDownCounts: []
  };

  let deckIndex = 0;

  for (let col = 0; col < 7; col++) {
    const cardCount = col + 1;
    const columnCards = [];

    for (let i = 0; i < cardCount; i++) {
      columnCards.push(deck[deckIndex++]);
    }

    tableau[col.toString()] = columnCards;

    // Calculate face-down/face-up counts
    if (config.faceDownPattern) {
      // Traditional/Expert: Column N has N face-down cards (except column 0)
      const faceDownCount = col;
      columnState.faceDownCounts[col] = faceDownCount;
      columnState.faceUpCounts[col] = cardCount - faceDownCount;
    } else {
      // Classic/Double Pocket: All face-up
      columnState.faceDownCounts[col] = 0;
      columnState.faceUpCounts[col] = cardCount;
    }

    // On initial deal, only column 0 can be typed based on its card
    // All other columns start as 'traditional' until cards are moved
    if (col === 0) {
      const bottomCard = columnCards[0];
      columnState.types[col] = getColumnTypeFromCard(bottomCard);
    } else {
      columnState.types[col] = 'traditional';
    }
  }

  // Remaining 24 cards go to stock
  const stock = deck.slice(deckIndex);

  // Generate unique ID
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const id = `${mode}_random_${timestamp}_${randomSuffix}`;

  // Build the game state object
  const gameState = {
    metadata: {
      id,
      name: `${config.name} RANDOM`,
      mode,
      variant: 'normal',
      pockets: config.pockets,
      allUp: config.allUp,
      isPressureTest: false,
      version: '2.0.0',
      createdAt: new Date().toISOString(),
      description: `Random ${config.name.toLowerCase()} deal`
    },
    tableau,
    stock,
    waste: [],
    pocket1: null,
    pocket2: null,
    foundations: {
      up: { h: [], d: [], c: [], s: [] },
      down: { h: [], d: [], c: [], s: [] }
    },
    columnState,
    analysis: {
      progress: {
        foundationCards: 0,
        totalCards: 52,
        percentage: 0.0
      },
      cardCounts: {
        tableau: 28,
        stock: 24,
        waste: 0,
        foundations: 0,
        pockets: 0
      },
      tableau: {
        totalCards: 28,
        faceUpCards: config.allUp ? 28 : 7,
        faceDownCards: config.allUp ? 0 : 21,
        emptyColumns: 0
      }
    },
    validation: {
      isValid: true,
      errors: [],
      warnings: [],
      validatedAt: new Date().toISOString()
    }
  };

  return gameState;
}

/**
 * Get available game modes
 * @returns {object[]} Array of mode info objects
 */
export function getGameModes() {
  return Object.entries(MODE_CONFIGS).map(([id, config]) => ({
    id,
    name: config.name,
    description: config.description,
    pockets: config.pockets,
    hasFaceDown: config.faceDownPattern
  }));
}

/**
 * Get mode configuration
 * @param {string} mode - Mode identifier
 * @returns {object|null} Mode configuration or null if not found
 */
export function getModeConfig(mode) {
  return MODE_CONFIGS[mode] || null;
}
