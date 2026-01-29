# Bug Fix: Column Type Switching on Autoplay

**Status**: ✅ FIXED

## Issue Summary

When a card is autoplayed (double-clicked) to an Ace-type tableau column, the column incorrectly switches to `'traditional'` type, causing cards to snap to the top instead of maintaining proper Ace column stacking.

### Example Scenario
1. Column contains: `['Ah']` with type `'ace'`
2. User double-clicks `2h` to autoplay it onto the Ace
3. Column now contains: `['Ah', '2h']`
4. **BUG**: Type changes to `'traditional'` instead of staying `'ace'`
5. Cards visually snap to top of column instead of proper Ace column layout

---

## Root Cause

### Location
`src/utils/gameLogic.js` - `updateColumnType()` function (lines 254-292)

### The Flawed Logic
```javascript
function updateColumnType(columnIndex, state) {
  // ...
  const faceUpCount = column.length - faceDownCount;
  
  if (faceUpCount > 0) {
    const firstFaceUpIndex = faceDownCount;
    const card = parseCard(column[firstFaceUpIndex]);
    
    if (card) {
      // BUG: Only ace/king with EXACTLY 1 face-up card keeps type
      if (faceUpCount === 1 && card.value === 'A') {
        state.columnState.types[columnIndex] = 'ace';
      } else if (faceUpCount === 1 && card.value === 'K') {
        state.columnState.types[columnIndex] = 'king';
      } else {
        // BUG: Any column with 2+ face-up cards becomes 'traditional'
        state.columnState.types[columnIndex] = 'traditional';
      }
    }
  }
}
```

### Why It Fails
When adding a 2 to an Ace column:
- `faceUpCount` = 2 (was 1, now 2)
- Condition `faceUpCount === 1` is FALSE
- Type incorrectly set to `'traditional'`

---

## Fix Strategy

### Core Principle
**Column types should be "sticky"** - once established, they persist regardless of card additions/removals until the column is emptied.

### Type Determination Rules

| Current State | First Face-Up Card | New Type |
|--------------|-------------------|----------|
| Empty column | Ace | `'ace'` |
| Empty column | King | `'king'` |
| Empty column | Other | `'traditional'` |
| `'ace'` column | (any) | `'ace'` (preserve) |
| `'king'` column | (any) | `'king'` (preserve) |
| `'traditional'` column | (any) | `'traditional'` (preserve) |

### Special Case: Card Reveal
When the last face-up card is removed and a face-down card is flipped:
- Type should update based on the newly revealed card
- This is handled by `flipRevealedCard()` (already correct)

---

## Implementation

### Changes Required

1. **`src/utils/gameLogic.js`** - Modify `updateColumnType()`
   - Only set type when column was empty or has no type
   - Preserve existing type when adding/removing cards
   - Set to `'empty'` when column is cleared

2. **Verify** `flipRevealedCard()` behavior
   - Confirm it correctly updates type when revealing a new card
   - No changes needed (already handles this case)

### Pseudocode
```javascript
function updateColumnType(columnIndex, state) {
  const column = state.tableau[columnIndex.toString()] || [];
  const currentType = state.columnState.types[columnIndex];
  
  // Case 1: Column is empty
  if (column.length === 0) {
    state.columnState.types[columnIndex] = 'empty';
    return;
  }
  
  // Case 2: Type already established - preserve it
  if (currentType && currentType !== 'empty') {
    return; // Type is sticky
  }
  
  // Case 3: Empty column getting first card - determine type
  const faceDownCount = state.columnState.faceDownCounts?.[columnIndex] || 0;
  const firstFaceUpCard = parseCard(column[faceDownCount]);
  
  if (firstFaceUpCard?.value === 'A') {
    state.columnState.types[columnIndex] = 'ace';
  } else if (firstFaceUpCard?.value === 'K') {
    state.columnState.types[columnIndex] = 'king';
  } else {
    state.columnState.types[columnIndex] = 'traditional';
  }
}
```

---

## Testing Checklist

- [ ] Ace column accepts 2, stays as `'ace'` type
- [ ] King column accepts Q, stays as `'king'` type
- [ ] Traditional column stays `'traditional'` when cards added/removed
- [ ] Empty column gets correct type when first card added
- [ ] Type updates correctly when face-down card revealed
- [ ] Autoplay to Ace column maintains proper visual stacking
- [ ] Drag-and-drop to Ace column maintains proper visual stacking

---

## Related Code

- `flipRevealedCard()` - Handles type update when face-down card flipped
- `canStackCards()` - Uses column type for validation
- Card component rendering - Uses column type for layout
