# Game State Notification System - Review & Redesign Plan

## Current Problems

### 1. False Positives - Users Overwhelmed
**Scenario:** Player is actively cycling through stock/waste to find playable cards
- **Current behavior:** Stall warning appears after 15-20 moves
- **User perception:** "I'm playing the game, not stalling!"
- **Result:** Users ignore warnings, become desensitized

### 2. False Negatives - Unwinnable Games Not Detected
**Scenario:** Game is mathematically unwinnable but no notification
- **Current behavior:** No clear indication game is lost
- **User behavior:** Cycles deck endlessly waiting for "game over"
- **Result:** Frustration, wasted time

### 3. Notification Visibility Issues
- Warnings are too subtle (small text in stats bar)
- No clear visual hierarchy between caution/critical/stalled
- No persistent indicator that game is unwinnable

---

## Root Cause Analysis

### Current Detection Logic

```javascript
// From useCardGame.js - current implementation
const calculateWarningLevel = useCallback((trackerResult) => {
  const { cycleCount, movesSinceProgress, isCircular, isNoProgress } = trackerResult;
  
  // Stalled: 20+ moves without progress
  if (isNoProgress || movesSinceProgress >= 20) {
    return 'stalled';
  }
  
  // Critical: 3+ cycles
  if (isCircular || cycleCount >= 3) {
    return 'critical';
  }
  
  // Caution: 2 cycles or 15+ moves
  if (cycleCount >= 2 || movesSinceProgress >= 15) {
    return 'caution';
  }
  
  return 'none';
}, []);
```

### Problems with Current Logic

1. **"Moves without progress" counts ALL moves**
   - Includes: Stock draws, waste cycles, pocket usage, tableau reorganizations
   - Doesn't distinguish between "productive cycling" vs "pointless cycling"

2. **"Cycles" detection is state-based**
   - Returns to same tableau state = 1 cycle
   - But tableau + stock/waste might still have viable paths

3. **Stalemate detection is too conservative**
   - Only triggers when NO moves available
   - Doesn't detect "moves available but don't help" situations

4. **No "unwinnable" detection**
   - Stalemate ≠ Unwinnable
   - Game can have moves but still be unwinnable (blocked sequences)

---

## Proposed Solution Architecture

### Core Concept: Three-Tier Detection System

| Tier | Name | Trigger | UX Treatment |
|------|------|---------|--------------|
| 1 | **Active Play** | Normal cycling, searching | No notification |
| 2 | **Concern** | Suspicious patterns detected | Subtle hint (optional) |
| 3 | **Confirmed Stall** | Mathematically stuck | Clear modal + options |

### New Detection Approach

#### 1. Distinguish "Productive" vs "Unproductive" Cycling

**Productive Cycling (ignore for warnings):**
- Cards moved to foundations during cycle
- New tableau sequences created
- Face-down cards revealed
- Pocket cards played

**Unproductive Cycling (count for warnings):**
- Stock/waste cycled with NO cards played
- Same cards cycling repeatedly
- No change to tableau state

#### 2. Enhanced State Fingerprint

Current:
```javascript
{
  tableauHash,        // Only tableau
  stockTop,
  wasteTop,
  foundationCounts,
  pockets
}
```

Enhanced:
```javascript
{
  tableauHash,
  stockWasteHash,     // Combined stock+waste state
  foundationProgress, // Total cards on foundations
  tableauProgress,    // Face-down cards revealed, sequences built
  lastProgressMove,   // Move number of last meaningful progress
  cycleDepth          // How deep we've searched without progress
}
```

#### 3. Smarter Cycle Detection

```javascript
// New: Track "search depth" not just "cycles"
function calculateSearchDepth(stateHistory) {
  // If we've seen this state before, how many moves ago?
  // If returning to state with NO progress, depth increases
  // If returning to state WITH progress, reset depth
}
```

#### 4. Unwinnable Detection Algorithm

```javascript
function isGameUnwinnable(gameState) {
  // Check 1: Can any card reach foundation?
  // Check 2: Are there blocked circular dependencies?
  // Check 3: Is search space exhausted (all possibilities tried)?
  // Check 4: Have we cycled N times with zero progress?
}
```

---

## UX Redesign

### Current: Stats Bar Warning
```
[Moves: 47] [Time: 2:34]              ⚡ 18 moves
```
**Problem:** Too subtle, easy to miss, confusing

### Proposed: Progressive Disclosure

#### Level 1: Normal Play
- No visible indicators
- Optional: Subtle "thinking" animation if cycling long time

#### Level 2: Gentle Hint (after 3 unproductive cycles)
- Toast notification: "Consider undoing recent moves"
- Auto-dismiss after 5 seconds
- Non-blocking

#### Level 3: Active Warning (after 5 unproductive cycles)
- Semi-transparent overlay with message
- "You may be stuck. Try: [Undo] [Hint] [Continue Playing]"
- Can be dismissed

#### Level 4: Confirmed Unwinnable (mathematically proven)
- Full modal (like current StalemateModal)
- "This game appears unwinnable"
- Clear actions: [New Deal] [Undo Moves] [Keep Trying]

### Visual Design

#### Warning Toast (Level 2)
```
┌─────────────────────────────────┐
│  💡 Consider undoing some moves │
│     You've been cycling without │
│     making progress.            │
│                          [×]    │
└─────────────────────────────────┘
```
- Position: Top-center
- Animation: Slide down
- Duration: 5 seconds or click dismiss

#### Warning Overlay (Level 3)
```
┌──────────────────────────────────────────────────┐
│                                                  │
│            ⚠️ You may be stuck                   │
│                                                  │
│    You've cycled through the deck 5 times        │
│    without making progress.                      │
│                                                  │
│    [Undo Moves]  [Get Hint]  [Keep Playing]      │
│                                                  │
└──────────────────────────────────────────────────┘
```
- Background: Darken game board
- Dismissible but persistent

#### Unwinnable Modal (Level 4)
```
┌──────────────────────────────────────────────────┐
│                                                  │
│            🏁 Game Analysis Complete             │
│                                                  │
│    This game appears to be unwinnable.           │
│    All possible moves have been explored.        │
│                                                  │
│    Stats:                                        │
│    • Moves: 47                                   │
│    • Time: 5:32                                  │
│    • Cards on foundations: 12/52 (23%)           │
│    • Search depth: Exhausted                     │
│                                                  │
│    [New Deal]  [Undo 5 Moves]  [Restart Level]   │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Enhanced Detection Logic

**Files:** `src/utils/gameLogic.js`, `src/hooks/useCardGame.js`

1. Create `EnhancedGameStateTracker` class
   - Track productive vs unproductive moves
   - Calculate "search depth" metric
   - Detect unwinnable positions

2. Update `calculateWarningLevel` function
   - Use new metrics
   - Add "confidence score" (how sure are we it's unwinnable?)

3. Add `isGameUnwinnable()` function
   - Exhaustive search of possible moves
   - Cache results to avoid recomputation

### Phase 2: New Notification Components

**Files:** New components in `src/components/`

1. `GameStateToast.jsx` - Level 2 gentle hints
2. `GameStateOverlay.jsx` - Level 3 warnings
3. Update `StalemateModal.jsx` - Level 4 confirmed unwinnable

### Phase 3: UX Polish

**Files:** `src/styles/App.css`, component CSS modules

1. Toast animations
2. Overlay transitions
3. Modal styling updates
4. Reduced motion support

### Phase 4: Testing & Tuning

1. Test with various game scenarios
2. Tune thresholds (cycle counts, move counts)
3. User testing for notification clarity

---

## Technical Details

### New State Tracking

```javascript
// Enhanced state tracker
class EnhancedGameStateTracker {
  constructor() {
    this.stateHistory = new Map();
    this.unproductiveCycleCount = 0;
    this.productiveMovesCount = 0;
    this.lastProgressMove = 0;
    this.currentMove = 0;
    this.searchDepth = 0;
  }
  
  recordMove(gameState, moveType) {
    this.currentMove++;
    
    // Determine if move was productive
    const wasProductive = this.isProductiveMove(gameState, moveType);
    
    if (wasProductive) {
      this.productiveMovesCount++;
      this.lastProgressMove = this.currentMove;
      this.unproductiveCycleCount = 0;
      this.searchDepth = 0;
    } else {
      this.checkForUnproductiveCycle(gameState);
    }
    
    // Check if unwinnable
    if (this.shouldCheckUnwinnable()) {
      this.unwinnableCheckResult = this.checkUnwinnable(gameState);
    }
  }
  
  isProductiveMove(gameState, moveType) {
    // Foundation placement = productive
    // Tableau build that reveals card = productive
    // Stock draw that leads to playable card = productive
    // Just cycling stock/waste = unproductive
  }
  
  getWarningLevel() {
    if (this.unwinnableCheckResult?.isUnwinnable) {
      return { level: 'unwinnable', confidence: this.unwinnableCheckResult.confidence };
    }
    
    if (this.unproductiveCycleCount >= 5) {
      return { level: 'warning', cycles: this.unproductiveCycleCount };
    }
    
    if (this.unproductiveCycleCount >= 3) {
      return { level: 'hint', cycles: this.unproductiveCycleCount };
    }
    
    return { level: 'none' };
  }
}
```

### Productive Move Detection

```javascript
function isProductiveMove(previousState, currentState, moveType) {
  // Check 1: Cards added to foundation
  const prevFoundationCards = countFoundationCards(previousState);
  const currFoundationCards = countFoundationCards(currentState);
  if (currFoundationCards > prevFoundationCards) return true;
  
  // Check 2: Face-down card revealed
  const prevFaceDown = countFaceDownCards(previousState);
  const currFaceDown = countFaceDownCards(currentState);
  if (currFaceDown < prevFaceDown) return true;
  
  // Check 3: New sequence created in tableau
  if (hasNewValidSequence(previousState, currentState)) return true;
  
  // Check 4: Pocket card played (not just stored)
  if (moveType === 'pocket-to-foundation' || moveType === 'pocket-to-tableau') {
    return true;
  }
  
  // Stock draw - neutral, could lead to productive
  if (moveType === 'draw') return null; // Unknown
  
  // Everything else = unproductive
  return false;
}
```

### Unwinnable Detection

```javascript
function checkUnwinnable(gameState, maxDepth = 10) {
  // Use BFS/DFS to explore possible moves
  // Track visited states
  // If no path leads to win after exhaustive search, unwinnable
  
  const visited = new Set();
  const queue = [gameState];
  let nodesExplored = 0;
  
  while (queue.length > 0 && nodesExplored < maxDepth * 1000) {
    const state = queue.shift();
    const stateKey = getStateFingerprint(state);
    
    if (visited.has(stateKey)) continue;
    visited.add(stateKey);
    nodesExplored++;
    
    // Get all possible moves
    const moves = getAllPossibleMoves(state);
    
    // If any move leads to win, game is winnable
    for (const move of moves) {
      const newState = executeMove(state, move);
      if (isWinState(newState)) {
        return { isUnwinnable: false, nodesExplored };
      }
      queue.push(newState);
    }
  }
  
  // If we've explored exhaustively and no win found
  return { 
    isUnwinnable: true, 
    confidence: nodesExplored > 100 ? 'high' : 'medium',
    nodesExplored 
  };
}
```

---

## Threshold Tuning

### Initial Values (to be tested)

| Metric | Hint | Warning | Unwinnable |
|--------|------|---------|------------|
| Unproductive cycles | 3 | 5 | 8+ |
| Moves without progress | 15 | 25 | 40+ |
| Stock/waste recycles | 2 | 4 | 6+ |
| Search depth | — | — | Exhausted |

### Adjustment Strategy

1. Start conservative (high thresholds)
2. Test with 50+ games
3. Count false positives/negatives
4. Adjust by ±20% and retest
5. Target: <5% false positive, <2% false negative

---

## Success Metrics

### Qualitative
- Users report understanding when game is unwinnable
- Users don't feel "nagged" during normal play
- Users trust the detection system

### Quantitative
- False positive rate < 5%
- False negative rate < 2%
- Average time to detect unwinnable < 30 seconds of pointless cycling
- User engagement: Continue playing after warning vs quit

---

## Open Questions

1. Should we allow users to disable warnings entirely?
2. Should hint system integrate with state detection?
3. How to handle "expert" players who want no help?
4. Should we show "confidence level" for unwinnable detection?
5. Do we track analytics on warning dismissals?

---

## Related Documents

- Current implementation: `src/hooks/useCardGame.js`, `src/utils/gameLogic.js`
- Current UI: `src/components/GameStats/`, `src/components/StalemateModal/`
- Existing BACKLOG item: "Game State Analyzer & Smart Detection System"
