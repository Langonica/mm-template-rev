# Plan: Game State Notification Bug Fix

**Created:** 2026-01-29
**Status:** Ready for Implementation
**Priority:** Critical (blocks user interaction)

---

## Problem Summary

Users report that when autoplaying a card to foundations, a tip modal appears saying "Tip, Try a different approach". Clicking the dismiss button does nothing - the modal keeps looping and cannot be dismissed.

### Root Causes Identified

| Bug | Severity | Description |
|-----|----------|-------------|
| **#1: Dismiss Loop** | Critical | Toast re-triggers immediately after dismiss because useEffect sees tier is still elevated |
| **#2: Wrong Handler** | Medium | Action button passes `handleOverlayDismiss` instead of `handleToastDismiss` |
| **#3: Productivity False Positives** | Medium | Many valid tableau moves aren't counted as "productive", triggering warnings during active play |

---

## Bug #1: Dismiss Loop (Critical)

### Current Behavior
```
User dismisses toast
  → setGameStateToastOpen(false)
  → useEffect triggers (dependency on gameStateToastOpen)
  → tier is still 'hint' (no move was made)
  → condition: !toastOpen && !overlayOpen = true
  → setGameStateToastOpen(true)  ← REOPENS
```

### Solution: Add Suppression State

Track when user has dismissed a notification tier. Don't re-show until tier escalates or resets.

### Implementation

**File:** `src/App.jsx`

**Step 1: Add suppression state** (Sonnet)
```javascript
// After other useState declarations (~line 85)
const [dismissedNotificationTier, setDismissedNotificationTier] = useState(null);
```

**Step 2: Update dismiss handler** (Sonnet)
```javascript
// Update handleToastDismiss (~line 513)
const handleToastDismiss = useCallback(() => {
  setGameStateToastOpen(false);
  // Remember which tier was dismissed to prevent re-triggering
  setDismissedNotificationTier(circularPlayState?.tier || null);
}, [circularPlayState?.tier]);
```

**Step 3: Update useEffect to respect suppression** (Sonnet)
```javascript
// In the notification useEffect (~line 426)
useEffect(() => {
  if (!circularPlayState || showHomeScreen || gameStatus?.isGameOver) return;

  const { tier } = circularPlayState;

  if (isPaused) return;
  if (!isTierEnabled(tier)) return;

  // Reset suppression if tier escalated or returned to none
  if (tier === 'none' ||
      (dismissedNotificationTier && tierIsHigherThan(tier, dismissedNotificationTier))) {
    setDismissedNotificationTier(null);
  }

  // Don't show if user already dismissed this tier level
  if (dismissedNotificationTier && !tierIsHigherThan(tier, dismissedNotificationTier)) {
    return;
  }

  switch (tier) {
    // ... existing cases
  }
}, [circularPlayState, showHomeScreen, gameStatus, isPaused,
    gameStateToastOpen, gameStateOverlayOpen, stalemateModalOpen,
    isTierEnabled, dismissedNotificationTier]);
```

**Step 4: Add tier comparison helper** (Sonnet)
```javascript
// Add helper function (~line 100)
const TIER_SEVERITY = { none: 0, hint: 1, concern: 2, warning: 3, confirmed: 4 };

const tierIsHigherThan = (tier, comparedTo) => {
  return (TIER_SEVERITY[tier] || 0) > (TIER_SEVERITY[comparedTo] || 0);
};
```

**Step 5: Reset suppression on new game** (Sonnet)
```javascript
// In handleNewGame or wherever game resets
setDismissedNotificationTier(null);
```

---

## Bug #2: Wrong Handler on Action Button

### Current Code
```javascript
<GameStateToast
  onDismiss={handleToastDismiss}
  onAction={handleOverlayDismiss}    // WRONG
  actionLabel="Dismiss"
/>
```

### Solution: Remove Redundant Action Button

The toast already has an X close button. The action button pattern is for actions like "Undo" or "Hint", not redundant dismissal.

### Implementation

**File:** `src/App.jsx` (~line 785-791)

**Option A: Remove action button entirely** (Haiku)
```javascript
<GameStateToast
  isOpen={gameStateToastOpen}
  {...getToastContent()}
  onDismiss={handleToastDismiss}
  // Remove: onAction={handleOverlayDismiss}
  // Remove: actionLabel="Dismiss"
/>
```

**Option B: Change to useful action** (Sonnet)
```javascript
<GameStateToast
  isOpen={gameStateToastOpen}
  {...getToastContent()}
  onDismiss={handleToastDismiss}
  onAction={handleUndo}
  actionLabel="Undo"
/>
```

**Recommendation:** Option A for simplicity. The X button handles dismissal.

---

## Bug #3: Productivity False Positives (Secondary)

### Current Criteria for "Productive" Move
1. Foundation cards increased
2. Face-down card revealed
3. Valid sequences increased (3+ cards)
4. Empty column filled with A/K
5. Pocket card played

### Problem
Many strategic moves don't qualify:
- Moving a single card to build a sequence
- Moving a 2-card sequence
- Rearranging for future moves

### Solution: Expand Productivity Criteria

**File:** `src/utils/gameLogic.js` - `analyzeProductivity()` (~line 910)

**Option A: Count any sequence extension** (Sonnet)
```javascript
// Add check for sequence extension (any length increase)
if (fingerprint.totalSequenceCards > this.maxTotalSequenceCards) {
  details.sequenceExtended = true;
  return { wasProductive: true, details };
}
```

**Option B: Raise threshold** (Haiku)
Change `unproductiveCycleCount >= 2` to `>= 3` in `calculateNotificationTier`

**Option C: Both A and B** (Recommended)

### Additional Fingerprint Metric Needed
```javascript
// In cardUtils.js getStateFingerprint()
const totalSequenceCards = countTotalSequenceCards(gameState); // Sum of all cards in sequences
```

---

## Implementation Order

| Phase | Task | Model | Files |
|-------|------|-------|-------|
| 1 | Fix dismiss loop (Bug #1) | Sonnet | `App.jsx` |
| 2 | Remove/fix action button (Bug #2) | Haiku | `App.jsx` |
| 3 | Raise threshold to 3 cycles | Haiku | `useCardGame.js` |
| 4 | Add sequence extension tracking | Sonnet | `gameLogic.js`, `cardUtils.js` |
| 5 | Update PROGRESS.md, BACKLOG.md | Haiku | docs |
| 6 | Test all scenarios | Manual | - |

---

## Test Scenarios

After implementation, verify:

1. **Dismiss works**: Show toast, click X, toast stays closed
2. **Escalation shows**: Dismiss at 'hint', continue cycling, 'concern' should show
3. **Progress resets**: Make a foundation move, dismissedTier should reset
4. **New game resets**: Start new game, suppression state should clear
5. **Autoplay doesn't trigger falsely**: Autoplay to foundation shouldn't show toast

---

## Documentation Updates Required

| Document | Update |
|----------|--------|
| `PROGRESS.md` | Add bug fix to Current Work section |
| `BACKLOG.md` | Move from In Progress, add to Completed |
| `CHANGELOG.md` | Add fix details under v2.3.0 |
| `CLAUDE.md` | Already updated with delegation guidance |

---

## Files to Modify

```
src/App.jsx                    - Bug #1, #2 (primary fix)
src/hooks/useCardGame.js       - Bug #3 threshold adjustment
src/utils/gameLogic.js         - Bug #3 productivity expansion
src/utils/cardUtils.js         - Bug #3 new fingerprint metric
docs/ACTIVE/PROGRESS.md        - Documentation
docs/ACTIVE/BACKLOG.md         - Documentation
CHANGELOG.md                   - Documentation
```

---

## Rollback Plan

If issues arise:
1. Revert App.jsx changes (suppression state)
2. Keep threshold/productivity changes (lower risk)
3. Toast will revert to current (buggy) behavior until properly fixed

---

*Plan created by Opus after diagnosis. Implementation to be delegated to Sonnet/Haiku per task complexity.*
