#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Card utilities
const CARD_MAP = {
  'A': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6,
  '8': 7, '9': 8, '10': 9, 'J': 10, 'Q': 11, 'K': 12
};

const SUIT_MAP = {
  'h': 0, 'd': 1, 'c': 2, 's': 3
};

function parseCard(cardStr) {
  if (!cardStr || typeof cardStr !== 'string') return null;
  
  const match = cardStr.match(/^([A2-9JQK]|10)([hdcs])$/);
  if (!match) return null;
  
  const value = match[1];
  const suit = match[2];
  
  return {
    v: CARD_MAP[value],
    s: SUIT_MAP[suit],
    value: value,
    suit: suit,
    numericValue: CARD_MAP[value] + 1,
    color: suit === 'h' || suit === 'd' ? 'red' : 'black',
    display: cardStr
  };
}

function validateSnapshot(snapshot) {
  const errors = [];
  const warnings = [];
  
  const metadata = snapshot.metadata;
  const { tableau, stock, waste, pocket1, pocket2, foundations } = snapshot;
  
  // ===== 1. COLLECT ALL CARDS =====
  const allCards = [];
  
  // Tableau cards
  Object.values(tableau).forEach(column => {
    if (Array.isArray(column)) {
      column.forEach(card => allCards.push(card));
    }
  });
  
  // Stock cards
  if (Array.isArray(stock)) {
    stock.forEach(card => allCards.push(card));
  }
  
  // Waste cards
  if (Array.isArray(waste)) {
    waste.forEach(card => allCards.push(card));
  } else if (waste) {
    allCards.push(waste);
  }
  
  // Pocket cards
  if (pocket1) allCards.push(pocket1);
  if (pocket2) allCards.push(pocket2);
  
  // Foundation cards
  if (foundations?.up) {
    Object.values(foundations.up).forEach(suitCards => {
      if (Array.isArray(suitCards)) {
        suitCards.forEach(card => allCards.push(card));
      }
    });
  }
  
  if (foundations?.down) {
    Object.values(foundations.down).forEach(suitCards => {
      if (Array.isArray(suitCards)) {
        suitCards.forEach(card => allCards.push(card));
      }
    });
  }
  
  // ===== 2. CARD COUNT VALIDATION =====
  const totalCards = allCards.length;
  const uniqueCards = new Set(allCards).size;
  
  if (totalCards !== 52) {
    errors.push(`Card count mismatch: ${totalCards}/52 cards`);
  }
  
  if (uniqueCards !== totalCards) {
    errors.push(`Duplicate cards found: ${uniqueCards} unique out of ${totalCards}`);
  }
  
  // ===== 3. TABLEAU VALIDATION =====
  // Check tableau has exactly 7 columns
  const tableauColumns = Object.keys(tableau);
  if (tableauColumns.length !== 7) {
    errors.push(`Tableau should have 7 columns, found ${tableauColumns.length}`);
  }
  
  // Check each column
  Object.entries(tableau).forEach(([colIndexStr, columnCards]) => {
    const colIndex = parseInt(colIndexStr);
    
    if (!Array.isArray(columnCards)) {
      errors.push(`Column ${colIndex}: Cards should be an array`);
      return;
    }
    
    // Check face-down rules for Traditional/Expert modes
    if (!metadata.allUp && colIndex > 0) {
      const expectedFaceDown = colIndex;
      const actualFaceDown = columnCards.length > expectedFaceDown ? expectedFaceDown : columnCards.length - 1;
      
      if (actualFaceDown !== expectedFaceDown && columnCards.length > 1) {
        warnings.push(`Column ${colIndex}: Expected ${expectedFaceDown} face-down cards in Traditional/Expert mode`);
      }
    }
    
    // Check sequence validity (for face-up cards)
    const faceUpStart = metadata.allUp ? 0 : Math.min(colIndex, columnCards.length - 1);
    const faceUpCards = columnCards.slice(faceUpStart);
    
    // Validate sequence
    for (let i = 1; i < faceUpCards.length; i++) {
      const current = parseCard(faceUpCards[i]);
      const previous = parseCard(faceUpCards[i - 1]);
      
      if (!current || !previous) {
        errors.push(`Column ${colIndex}: Invalid card format at position ${i}`);
        continue;
      }
      
      // Check color alternation
      if (current.color === previous.color) {
        errors.push(`Column ${colIndex}: Cards ${faceUpCards[i-1]} and ${faceUpCards[i]} have same color`);
      }
      
      // Check sequence direction (can't validate without column type)
      // Just check they're sequential
      const diff = Math.abs(current.numericValue - previous.numericValue);
      if (diff !== 1) {
        errors.push(`Column ${colIndex}: Cards ${faceUpCards[i-1]} (${previous.numericValue}) and ${faceUpCards[i]} (${current.numericValue}) not sequential`);
      }
    }
  });
  
  // ===== 4. FOUNDATION VALIDATION =====
  if (foundations) {
    const suits = ['h', 'd', 'c', 's'];
    
    // UP foundations (7Ã¢â€ â€™K)
    if (foundations.up) {
      suits.forEach(suit => {
        const upCards = foundations.up[suit] || [];
        
        // Check sequence
        for (let i = 1; i < upCards.length; i++) {
          const current = parseCard(upCards[i]);
          const previous = parseCard(upCards[i - 1]);
          
          if (!current || !previous) {
            errors.push(`UP Foundation ${suit}: Invalid card at position ${i}`);
            continue;
          }
          
          // Must be same suit
          if (current.suit !== suit || previous.suit !== suit) {
            errors.push(`UP Foundation ${suit}: Card ${upCards[i]} is wrong suit`);
          }
          
          // Must ascend (7Ã¢â€ â€™8Ã¢â€ â€™9Ã¢â€ â€™10Ã¢â€ â€™JÃ¢â€ â€™QÃ¢â€ â€™K)
          if (current.numericValue !== previous.numericValue + 1) {
            errors.push(`UP Foundation ${suit}: Sequence broken between ${upCards[i-1]} and ${upCards[i]}`);
          }
        }
        
        // Check starts with 7 if not empty
        if (upCards.length > 0) {
          const firstCard = parseCard(upCards[0]);
          if (firstCard.numericValue !== 7) {
            errors.push(`UP Foundation ${suit}: Must start with 7, found ${upCards[0]}`);
          }
        }
      });
    }
    
    // DOWN foundations (6Ã¢â€ â€™A)
    if (foundations.down) {
      suits.forEach(suit => {
        const downCards = foundations.down[suit] || [];
        
        // Check sequence
        for (let i = 1; i < downCards.length; i++) {
          const current = parseCard(downCards[i]);
          const previous = parseCard(downCards[i - 1]);
          
          if (!current || !previous) {
            errors.push(`DOWN Foundation ${suit}: Invalid card at position ${i}`);
            continue;
          }
          
          // Must be same suit
          if (current.suit !== suit || previous.suit !== suit) {
            errors.push(`DOWN Foundation ${suit}: Card ${downCards[i]} is wrong suit`);
          }
          
          // Must descend (6Ã¢â€ â€™5Ã¢â€ â€™4Ã¢â€ â€™3Ã¢â€ â€™2Ã¢â€ â€™A)
          if (current.numericValue !== previous.numericValue - 1) {
            errors.push(`DOWN Foundation ${suit}: Sequence broken between ${downCards[i-1]} and ${downCards[i]}`);
          }
        }
        
        // Check starts with 6 if not empty
        if (downCards.length > 0) {
          const firstCard = parseCard(downCards[0]);
          if (firstCard.numericValue !== 6) {
            errors.push(`DOWN Foundation ${suit}: Must start with 6, found ${downCards[0]}`);
          }
        }
      });
    }
  }
  
  // ===== 5. COLUMN TYPING VALIDATION =====
  if (snapshot.columnTypes) {
    if (!Array.isArray(snapshot.columnTypes) || snapshot.columnTypes.length !== 7) {
      errors.push(`columnTypes should be array of length 7`);
    } else {
      snapshot.columnTypes.forEach((type, colIndex) => {
        const columnCards = tableau[colIndex.toString()] || [];
        
        if (columnCards.length === 0) {
          // Empty column
          if (type !== null) {
            errors.push(`Column ${colIndex}: Empty column should have type null, found ${type}`);
          }
        } else {
          const bottomCard = parseCard(columnCards[0]);
          if (!bottomCard) return;
          
          // Check type matches bottom card
          if (type === 'ace' && bottomCard.value !== 'A') {
            errors.push(`Column ${colIndex}: Type is 'ace' but bottom card is ${bottomCard.display}`);
          } else if (type === 'king' && bottomCard.value !== 'K') {
            errors.push(`Column ${colIndex}: Type is 'king' but bottom card is ${bottomCard.display}`);
          } else if (type === 'traditional' && (bottomCard.value === 'A' || bottomCard.value === 'K')) {
            warnings.push(`Column ${colIndex}: Bottom card is ${bottomCard.value} but type is 'traditional'`);
          }
        }
      });
    }
  }
  
  // ===== 6. POCKET VALIDATION =====
  if (metadata.pockets === 1 && pocket2) {
    errors.push(`Mode has 1 pocket but pocket2 has card: ${pocket2}`);
  }
  
  if (metadata.pockets === 2 && !metadata.mode.includes('double')) {
    warnings.push(`Mode ${metadata.mode} has 2 pockets but should only have 1`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalCards,
      uniqueCards,
      tableauCount: Object.values(tableau).reduce((sum, col) => sum + col.length, 0),
      stockCount: Array.isArray(stock) ? stock.length : (stock ? 1 : 0),
      wasteCount: Array.isArray(waste) ? waste.length : (waste ? 1 : 0),
      foundationCount: (foundations?.up ? Object.values(foundations.up).reduce((sum, s) => sum + s.length, 0) : 0) +
                      (foundations?.down ? Object.values(foundations.down).reduce((sum, s) => sum + s.length, 0) : 0)
    }
  };
}

// ===== MAIN VALIDATION LOOP =====
async function validateAllSnapshots() {
  console.log('Ã°Å¸â€Â VALIDATING ALL SNAPSHOTS\n');
  
  const snapshotsDir = path.join(__dirname, '../src/data/snapshots');
  const categories = ['original', 'midgame'];
  
  let totalSnapshots = 0;
  let validSnapshots = 0;
  let invalidSnapshots = 0;
  
  for (const category of categories) {
    const categoryDir = path.join(snapshotsDir, category);
    
    if (!fs.existsSync(categoryDir)) {
      console.log(`Ã¢ÂÅ’ Category directory not found: ${categoryDir}`);
      continue;
    }
    
    const files = fs.readdirSync(categoryDir).filter(f => f.endsWith('.json'));
    
    console.log(`\nÃ°Å¸â€œÂ ${category.toUpperCase()} (${files.length} snapshots):`);
    console.log('='.repeat(50));
    
    for (const file of files) {
      totalSnapshots++;
      const filePath = path.join(categoryDir, file);
      
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const result = validateSnapshot(data);
        
        const snapshotId = data.metadata?.id || file.replace('.json', '');
        
        if (result.isValid) {
          console.log(`Ã¢Å“â€¦ ${snapshotId}: VALID`);
          validSnapshots++;
          
          if (result.warnings.length > 0) {
            console.log(`   Ã¢Å¡Â Ã¯Â¸Â  Warnings: ${result.warnings.join('; ')}`);
          }
        } else {
          console.log(`Ã¢ÂÅ’ ${snapshotId}: INVALID`);
          invalidSnapshots++;
          
          console.log(`   Errors:`);
          result.errors.forEach(error => console.log(`     - ${error}`));
          
          if (result.warnings.length > 0) {
            console.log(`   Warnings:`);
            result.warnings.forEach(warning => console.log(`     - ${warning}`));
          }
          
          console.log(`   Stats: ${JSON.stringify(result.stats)}`);
        }
        
      } catch (error) {
        console.log(`Ã¢ÂÅ’ ${file}: ERROR - ${error.message}`);
        invalidSnapshots++;
      }
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('Ã°Å¸â€œÅ  VALIDATION SUMMARY:');
  console.log(`   Total Snapshots: ${totalSnapshots}`);
  console.log(`   Valid: ${validSnapshots} Ã¢Å“â€¦`);
  console.log(`   Invalid: ${invalidSnapshots} Ã¢ÂÅ’`);
  console.log(`   Success Rate: ${((validSnapshots / totalSnapshots) * 100).toFixed(1)}%`);
  
  if (invalidSnapshots > 0) {
    console.log('\nÃ¢Å¡Â Ã¯Â¸Â  Some snapshots need fixing!');
    process.exit(1);
  } else {
    console.log('\nÃ°Å¸Å½â€° All snapshots are valid!');
    process.exit(0);
  }
}

// Run validation
validateAllSnapshots().catch(console.error);