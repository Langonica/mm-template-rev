# Notification System - Code Review & Findings

## Current Implementation Analysis

### Detection Logic (useCardGame.js lines 62-81)

```javascript
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

**Problems Identified:**

1. **"Progress" only counts foundation cards**
   - Line 852 in GameStateTracker: `if (fingerprint.totalFoundationCards > this.maxFoundationCount)`
   - Does NOT consider: tableau builds, face-down reveals, sequence creation
   - Result: User can be actively playing well but get "stalled" warning

2. **"Cycles" counts every state repeat**
   - Returns to same tableau arrangement = cycle
   - But stock/waste might have changed, creating new opportunities
   - Result: False circular play detection during normal cycling

3. **Thresholds are too aggressive**
   - 15 moves without foundation placement = caution
   - 20 moves = stalled
   - In a complex game, 20 moves without foundation is NORMAL

### Stalemate Detection (gameLogic.js lines 699-769)

```javascript
export function checkStalemate(gameState) {
  // ... logic that checks for NO moves available
}
```

**Problems Identified:**

1. **Only triggers when ZERO moves available**
   - Lines 711-713: Returns false if any "real" moves exist
   - "Real" = tableau or foundation moves (not stock draw/recycle)

2. **Doesn't detect "unwinnable"**
   - Game can have moves but still be unwinnable
   - Example: Blocked sequences that can never be freed
   - Result: User keeps cycling indefinitely

3. **Stock/waste check is weak**
   - Lines 727-748: Only checks if cards COULD be played
   - Doesn't check if playing them leads anywhere
   - Result: False hope that cycling will help

### UI Presentation (GameStats.jsx)

**Problems Identified:**

1. **Small text in stats bar**
   - Lines 24-28: Just text after "Moves | Time"
   - Easy to miss during active play

2. **No visual hierarchy**
   - Same presentation for caution/critical/stalled
   - No progressive escalation

3. **No action suggestions**
   - Just tells user there's a problem
   - Doesn't suggest: undo, hint, forfeit options

## Test Scenarios Analysis

### Scenario A: Active Play (False Positive)
**User Action:** Cycling stock to find playable card
**Game State:** Tableau changing, face-down cards being revealed
**Current Detection:** Warning after 15-20 moves
**Problem:** User IS making progress (revealing cards, building sequences)

### Scenario B: Unwinnable Game (False Negative)
**User Action:** Cycling stock repeatedly
**Game State:** Cards blocked in circular dependency
**Current Detection:** No warning, only "X moves since progress"
**Problem:** Game is mathematically unwinnable but no clear indication

### Scenario C: Circular Play (True Positive)
**User Action:** Recycling stock 3+ times with no changes
**Game State:** Same state repeating
**Current Detection:** "Circular play" warning
**Status:** Working correctly, but UX could be better

## Root Causes

| Issue | Root Cause | Impact |
|-------|------------|--------|
| False positives | "Progress" = foundation only | Users ignore warnings |
| False negatives | No unwinnable detection | Wasted time cycling |
| Poor visibility | Small text warning | Users don't notice |
| No guidance | Just status, no actions | Users don't know what to do |

## Proposed Solutions (Prioritized)

### P0: Fix "Progress" Definition
**Change:** Track multiple progress indicators, not just foundation

```javascript
// New: Track these as "progress"
- Foundation cards placed (existing)
- Face-down cards revealed (new)
- Valid sequences created in tableau (new)
- Pocket cards played (new)
- Cards moved to empty columns (new)
```

### P1: Add Unwinnable Detection
**New function:** `isGameUnwinnable(gameState)`
- Exhaustive search of move tree
- Detect blocked circular dependencies
- Only triggers after reasonable search depth

### P2: Progressive Notification UI
**Replace stats bar text with:**

Level 1: None (normal play)
Level 2: Subtle indicator (optional)
Level 3: Toast notification with suggestion
Level 4: Modal with clear actions

### P3: Tune Thresholds
**Current → Proposed:**
- Caution: 15 moves → 25 moves without progress
- Critical: 3 cycles → 5 unproductive cycles
- Stalled: 20 moves → 40 moves or confirmed unwinnable

## Files to Modify

| File | Changes |
|------|---------|
| `useCardGame.js` | Update calculateWarningLevel, add productive move tracking |
| `gameLogic.js` | Add isProductiveMove(), isGameUnwinnable(), enhance GameStateTracker |
| `GameStats.jsx` | Simplify or remove warning display |
| `GameStateToast.jsx` | NEW: Level 2/3 notifications |
| `GameStateOverlay.jsx` | NEW: Level 3 persistent warning |
| `StalemateModal.jsx` | Enhance for Level 4 confirmed unwinnable |
| `App.css` | Add toast/overlay animations |

## Decision Points

1. **Should we completely remove warningLevel from stats bar?**
   - Option A: Keep simplified version (just icon when critical)
   - Option B: Remove entirely, use toast/modal only

2. **How aggressive should unwinnable detection be?**
   - Option A: Conservative (only when obviously stuck)
   - Option B: Aggressive (predict unwinnable early)
   - Trade-off: False negatives vs false positives

3. **Should users be able to disable notifications?**
   - Option A: Settings toggle
   - Option B: "Don't show again" per session
   - Option C: No disable (always on)

## Success Criteria

After implementation:
- [ ] User can cycle stock 10+ times during active play without warning
- [ ] Unwinnable games detected within 60 seconds of pointless cycling
- [ ] Users report understanding when game is unwinnable
- [ ] <10% false positive rate in user testing
- [ ] <5% false negative rate in user testing
