# Animation Improvements Plan

**Status**: Phase 1 IMPLEMENTED ✓

## Current State

### Existing Animation System
The game has several animation mechanisms:

1. **`autoMoveAnimation`** - Used for double-click autoplay (slurp + pop)
   - Phase 1: 'slurp' - card shrinks/disappears from source
   - Phase 2: 'pop' - card appears at destination with scale bounce
   - Duration: ~700ms total (300ms slurp + 400ms pop)

2. **`animatingCard`** - Used for:
   - Ace reveal animations (slurp + pop when face-down Ace flipped)
   - Auto-complete currently uses this with `isAutoMove: true` flag

3. **Portal animations** - For drops on empty columns
   - Slurp into portal (300ms)
   - Pop out at destination (400ms)

### Current Problems

1. **Auto-complete animation is broken/inadequate**:
   - Uses `setAnimatingCard()` but the animation isn't visually clear
   - No visible card movement from source to foundation
   - Cards just "appear" on foundation without showing where they came from
   - Win screen triggers immediately without showing final card plays

2. **Regular autoplay lacks visual feedback**:
   - Double-click autoplay has slurp/pop but it's subtle
   - No clear "arc" or motion showing the card's journey
   - Cards can feel like they "snap" into place

---

## Proposed Improvements

### Phase 1: Fix Auto-Complete Animation Sequence

**Goal**: Show each card visibly moving from its source to the foundation, then trigger win screen after sequence completes.

#### Implementation Approach

1. **Create new animation type `autoCompleteAnimation`**:
```javascript
// New state in useCardGame.js
const [autoCompleteAnimation, setAutoCompleteAnimation] = useState({
  isActive: false,
  moves: [], // Array of {card, from, to}
  currentMoveIndex: 0,
  phase: 'idle' // 'idle' | 'moving' | 'arrived' | 'complete'
});
```

2. **Sequential animation flow**:
```
For each card in auto-complete queue:
  1. Identify source location (tableau/waste/pocket)
  2. Calculate source coordinates (for visual continuity)
  3. Show card "lifting" from source (scale up + shadow)
  4. Animate card along path to foundation (translate + slight arc)
  5. Show card "landing" on foundation (scale down + bounce)
  6. Update game state to reflect move
  7. Brief pause (150ms)
  8. Next card...

After all cards:
  - Trigger win screen (if won)
```

3. **Visual design**:
   - Moving card uses the actual card sprite
   - Card floats above other elements (high z-index)
   - Subtle trail/glow effect during movement
   - Foundation "glows" when card is about to land
   - Sound effect on each placement (optional)

#### Files to Modify
- `useCardGame.js` - New animation state + sequence logic
- `GameStage.jsx` - Pass animation state to components
- `Foundation.jsx` - Show "incoming" animation state
- `Column.jsx` - Show "departing" animation state  
- `StockWaste.jsx` - Show "departing" animation state
- `App.css` - New keyframe animations

---

### Phase 2: Improve Regular Autoplay Animation

**Goal**: Add subtle but clear feedback when any card autoplays (not just auto-complete).

#### Current Behavior
- Slurp: Card scales down to 0 at source
- Pop: Card scales up from 0.8 to 1 at destination

#### Improvements

1. **Arc motion**:
   - Card should follow slight upward arc during movement
   - Use CSS `offset-path` or manual bezier calculation
   - Duration: 400ms total (faster than current 700ms)

2. **Ghost trail**:
   - 2-3 semi-transparent "ghost" cards trail behind
   - Fade out quickly (100ms stagger)

3. **Landing pulse**:
   - Foundation/column "pulses" when card arrives
   - Subtle green glow for valid placement

4. **Source indicator**:
   - Brief " vacancy" flash where card left
   - Helps player track where card came from

#### Implementation
```css
/* New animation */
@keyframes card-arc-move {
  0% {
    transform: translate(var(--start-x), var(--start-y)) scale(1);
    opacity: 1;
  }
  40% {
    transform: translate(var(--mid-x), var(--mid-y)) scale(1.1);
    opacity: 1;
  }
  100% {
    transform: translate(var(--end-x), var(--end-y)) scale(1);
    opacity: 1;
  }
}
```

---

### Phase 3: Win Screen Delay

**Goal**: Ensure win screen only appears after auto-complete animation finishes.

#### Current Issue
```javascript
// In executeAutoComplete
if (status.status === 'won') {
  // Game won - let the win handler take over
  // BUG: Win handler triggers immediately!
}
```

#### Solution
1. Add flag `pendingWin` to animation state
2. When auto-complete finishes AND game is won:
   - Set `pendingWin: true`
   - Wait for animation to complete
   - Then trigger win screen via callback

```javascript
// New approach
const executeAutoComplete = useCallback(async () => {
  // ... animation sequence ...
  
  if (movesMade > 0) {
    // ... state updates ...
    
    // Check win AFTER all animations complete
    const status = getGameStatus(currentState);
    if (status.status === 'won') {
      // Delay win screen by 500ms to show final state
      setTimeout(() => {
        onWin?.(); // Callback to trigger win screen
      }, 500);
    }
  }
}, [/* deps */]);
```

---

## Implementation Priority

### Phase 1 - COMPLETED ✓
- [x] New `autoCompleteAnimation` state in useCardGame.js
- [x] Sequential animation with 3 phases: departing → moving → arriving
- [x] Win screen delays 500ms after animation completes
- [x] Foundation glow effect (gold pulse) when receiving cards
- [x] Column highlight when card is departing
- [x] Departing card overlay with lift/fly/land animations
- [x] CSS animations for all effects

### Phase 2 - Pending
- [ ] Arc motion for regular autoplay (double-click)
- [ ] Ghost trail effect
- [ ] Source vacancy flash

### Phase 3 - Future
- [ ] Sound effects
- [ ] Particle effects on foundation complete
- [ ] Progress indicator overlay

---

## Technical Notes

### Coordinate Calculation
To animate cards from source to destination, we need pixel coordinates:

```javascript
// Get element positions for animation
function getCardCoordinates(location) {
  switch (location.type) {
    case 'tableau':
      // Calculate based on column index + card position in stack
      const colX = START_X + (location.column * (CARD_WIDTH + GAP));
      const colY = THEATER_TOP + (location.index * OVERLAP);
      return { x: colX, y: colY };
      
    case 'foundation':
      // Calculate based on zone + suit position
      // ... foundation positioning logic ...
      
    case 'waste':
      // Fixed position for waste pile
      return WASTE_POSITION;
      
    case 'pocket':
      // Fixed position for pocket slots
      return POCKET_POSITIONS[location.pocketNum];
  }
}
```

### Performance Considerations
- Use `transform` and `opacity` only (GPU accelerated)
- Limit concurrent animations (max 2-3 cards)
- Use `will-change` sparingly
- Clean up animation state to prevent memory leaks

### Accessibility
- Respect `prefers-reduced-motion`
- Ensure animations don't block interactions
- Maintain keyboard navigation during animations
