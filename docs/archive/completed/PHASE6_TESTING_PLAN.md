# Phase 6: Testing & Polish - Plan

## Overview

Comprehensive testing strategy for the Game State Notification System, including debugging tools, console functions, and test scenarios.

---

## Part A: Console Debugging & Testing Tools

### 1. Debug Console Logging (Development Mode)

Add conditional logging when `import.meta.env.DEV` is true:

```javascript
// In useCardGame.js - notification tracking
console.log('[GSN] Tier changed:', { 
  from: prevTier, 
  to: newTier, 
  cycles: trackerResult.unproductiveCycleCount,
  movesSinceProgress: trackerResult.movesSinceProgress
});

// In gameLogic.js - unwinnable detection
console.log('[GSN] Unwinnable check:', {
  isUnwinnable: result.isUnwinnable,
  confidence: result.confidence,
  nodesExplored: result.nodesExplored,
  reason: result.reason
});
```

**Proposed Log Points:**

| Location | Event | Data Logged |
|----------|-------|-------------|
| `recordMove()` | Productivity detected | `wasProductive`, `details`, `moveType` |
| `recordMove()` | Cycle detected | `cycleCount`, `isNewState` |
| `checkUnwinnable()` | Solver triggered | `maxNodes`, `maxDepth`, `startTime` |
| `checkUnwinnable()` | Solver complete | `isUnwinnable`, `confidence`, `nodesExplored`, `duration` |
| `calculateNotificationTier()` | Tier changed | `tier`, `reason`, `confidence` |
| `updateGameStateNotification()` | State updated | `tier`, `unproductiveCycles` |

### 2. Console Testing Functions

Expose functions on `window` for manual testing:

```javascript
// In useCardGame.js or App.jsx
if (import.meta.env.DEV) {
  window.__GSN_DEBUG__ = {
    // Get current tracker state
    getTrackerState: () => stateTracker.getStats(),
    
    // Get current notification state
    getNotificationState: () => gameStateNotification,
    
    // Force a specific tier (for UI testing)
    forceTier: (tier) => {
      setGameStateNotification(prev => ({ ...prev, tier }));
      if (tier === 'hint' || tier === 'concern') setGameStateToastOpen(true);
      if (tier === 'warning') setGameStateOverlayOpen(true);
    },
    
    // Run unwinnable check manually
    checkUnwinnable: () => {
      const result = detectUnwinnableState(gameState, { 
        maxNodes: 10000, 
        maxDepth: 20,
        trackPaths: true 
      });
      console.log('[GSN] Manual unwinnable check:', result);
      return result;
    },
    
    // Reset notification state
    resetNotifications: () => {
      setGameStateNotification({
        tier: 'none',
        unproductiveCycles: 0,
        movesSinceProgress: 0,
        wasProductive: true,
        details: null
      });
      setGameStateToastOpen(false);
      setGameStateOverlayOpen(false);
      stateTracker.reset();
    }
  };
}
```

### 3. Test Deal Loader (Console Functions)

Create test scenarios as snapshots that can be loaded via console:

```javascript
// Test scenarios for common situations
window.__TEST_DEALS__ = {
  // Nearly won - all cards face up, ready for auto-complete
  nearlyWon: () => loadTestDeal('TEST_NEARLY_WON'),
  
  // Blocked - circular dependency in tableau
  blocked: () => loadTestDeal('TEST_BLOCKED'),
  
  // Deep stack - many face-down cards
  deepStack: () => loadTestDeal('TEST_DEEP_STACK'),
  
  // Empty stock - stock depleted, cycling waste
  emptyStock: () => loadTestDeal('TEST_EMPTY_STOCK'),
  
  // Unwinnable - mathematically proven
  unwinnable: () => loadTestDeal('TEST_UNWINNABLE'),
  
  // High cycles - simulated 10 unproductive cycles
  highCycles: () => {
    loadTestDeal('TEST_BLOCKED');
    // Simulate cycles
    for (let i = 0; i < 10; i++) {
      stateTracker.unproductiveCycleCount++;
    }
    console.log('[GSN] Simulated 10 unproductive cycles');
  }
};
```

**Test Snapshot Definitions:**

Add to `src/data/snapshots/testSnapshots.js`:

```javascript
export const TEST_SNAPSHOTS = {
  // Cards: All face-up, most can go to foundations
  TEST_NEARLY_WON: {
    metadata: { mode: 'classic', variant: 'normal' },
    tableau: { /* ... */ },
    foundations: { up: { h: 10, d: 10, c: 10, s: 10 }, down: { h: 6, d: 6, c: 6, s: 6 } },
    stock: [],
    waste: [],
    pocket1: null,
    pocket2: null
  },
  
  // Blocked: King-Q-J sequence that can't be moved
  TEST_BLOCKED: {
    // ... setup with circular dependency
  },
  
  // Unwinnable: Specific card configuration that solver confirms
  TEST_UNWINNABLE: {
    // ... from solver analysis
  }
};
```

---

## Part B: Testing Scenarios

### Unit Tests (If Test Framework Exists)

```javascript
// gameLogic.test.js
describe('GameStateTracker', () => {
  test('detects productive foundation move', () => {
    const tracker = new GameStateTracker();
    // ... test logic
  });
  
  test('counts unproductive cycles', () => {
    // ... test logic
  });
  
  test('resets on new game', () => {
    // ... test logic
  });
});

describe('detectUnwinnableState', () => {
  test('returns unwinnable for blocked game', () => {
    // ... test logic
  });
  
  test('returns winnable when path exists', () => {
    // ... test logic
  });
  
  test('respects node limit', () => {
    // ... test logic
  });
});
```

### Manual Testing Checklist

#### Tier 1: Hint (2 cycles)
- [ ] Play normally, don't make foundation moves
- [ ] Cycle through stock 2 times
- [ ] Verify toast appears with subtle styling
- [ ] Verify auto-dismisses after 5s
- [ ] Verify X button works

#### Tier 2: Concern (4 cycles)
- [ ] Continue cycling without progress
- [ ] Verify toast appears at 4 cycles
- [ ] Verify different icon/color than hint
- [ ] Verify stays longer (8s)

#### Tier 3: Warning (6 cycles)
- [ ] Continue to 6 cycles
- [ ] Verify overlay appears (not toast)
- [ ] Verify action buttons work: Undo, Hint, New Deal, Keep Playing
- [ ] Verify backdrop click dismisses

#### Tier 4: Confirmed (Solver)
- [ ] Play known unwinnable deal
- [ ] Verify solver runs automatically at 4+ cycles
- [ ] Verify confidence level in logs

#### Settings
- [ ] Set to "Off" - verify no notifications
- [ ] Set to "Minimal" - verify only confirmed tier shows
- [ ] Set to "On" - verify all tiers show
- [ ] Verify persistence across reloads

#### Edge Cases
- [ ] Rapid cycling (spam clicks)
- [ ] Undo after notification appears
- [ ] New game resets everything
- [ ] Pause while notification showing
- [ ] Win game while notification showing

---

## Part C: Polish Items

### Code Quality
- [ ] Add JSDoc to all new functions
- [ ] Review error handling
- [ ] Verify no memory leaks (setTimeout/setInterval cleanup)
- [ ] Check accessibility (ARIA labels, focus management)

### Performance
- [ ] Verify unwinnable check doesn't block UI (>100ms)
- [ ] Check that solver doesn't run too frequently
- [ ] Verify animations are smooth (60fps)

### Mobile
- [ ] Test on actual touch device
- [ ] Verify toast doesn't block gameplay
- [ ] Verify overlay is easily dismissible

---

## Implementation Steps

1. **Add Debug Logging** - Conditional on DEV mode
2. **Expose Console Functions** - window.__GSN_DEBUG__
3. **Create Test Snapshots** - For common scenarios
4. **Add Console Deal Loader** - window.__TEST_DEALS__
5. **Run Manual Tests** - Checklist above
6. **Code Review** - Polish items

---

## Console Quick Reference

```javascript
// During development, open console and use:

__GSN_DEBUG__.getTrackerState()      // Current tracker stats
__GSN_DEBUG__.getNotificationState() // Current notification
__GSN_DEBUG__.forceTier('warning')   // Force show warning overlay
__GSN_DEBUG__.checkUnwinnable()      // Run solver manually
__GSN_DEBUG__.resetNotifications()   // Reset everything

__TEST_DEALS__.nearlyWon()           // Load nearly won game
__TEST_DEALS__.blocked()             // Load blocked game
__TEST_DEALS__.highCycles()          // Load with 10 cycles
```
