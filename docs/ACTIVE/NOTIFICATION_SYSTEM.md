# Game State Notification System - Implementation Specification

**Status:** All Phases Complete ✅ (v2.3.0)  
**Based On:** DESIGN_PRINCIPLES.md - Conservative, User-Controllable, Signal Over Noise

## Implementation Status

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Enhanced Progress Detection | ✅ Complete |
| Phase 2 | Unwinnable Detection Algorithm | ✅ Complete |
| Phase 3 | Toast UI Components | ✅ Complete |
| Phase 4 | Settings Integration | ✅ Complete |
| Phase 5 | Remove Stats Bar Warning | 🔄 In Progress |
| Phase 6 | Testing & Polish | ✅ Complete |

---

## Overview

Replace the current "moves since progress" warning system with a conservative, three-tier notification system that distinguishes between normal play, concerning patterns, and confirmed unwinnable games.

### Key Principles Applied

1. **Signal Over Noise:** Notifications only when actionable
2. **Conservative Detection:** Better to miss than to nag
3. **User Control:** Can be disabled in Settings
4. **Clear Hierarchy:** Modal for confirmed, toast for concern
5. **Distinguish from Hints:** System detection vs user request

---

## Three-Tier Detection System

### Tier 0: Normal Play
**State:** Player making productive moves OR cycling with purpose
**UX:** Nothing shown
**Exit Condition:** 3+ unproductive cycles detected

### Tier 1: Concern
**State:** Suspicious pattern (cycling without foundation progress)
**UX:** Subtle hint (optional, can be disabled)
**Entry:** 3 unproductive cycles
**Exit:** Productive move made OR escalate to Tier 2

### Tier 2: Warning
**State:** Likely stuck (5+ unproductive cycles)
**UX:** Toast notification with suggestions
**Entry:** 5 unproductive cycles
**Exit:** Productive move made OR escalate to Tier 3

### Tier 3: Confirmed Unwinnable
**State:** Mathematically proven unwinnable
**UX:** Modal with clear actions
**Entry:** Exhaustive search confirms no win path
**Exit:** User selects action (new deal, undo, etc.)

---

## What Counts as "Progress"

Current (incorrect): Only foundation cards

**New Definition (productive moves):**
- ✅ Card placed on foundation
- ✅ Face-down card revealed
- ✅ Valid sequence created in tableau (3+ cards)
- ✅ Card moved to empty column (Ace/King)
- ✅ Pocket card played (not stored)

**Does NOT count (neutral):**
- Stock draw
- Waste cycle
- Tableau reorganization (no new sequences)
- Pocket storage

**Unproductive (counts against):**
- Full stock/waste cycle with no productive moves
- Returning to previous state with no progress

---

## Detection Algorithm

### Enhanced State Fingerprint

```javascript
{
  // Existing
  tableauHash: string,
  stockWasteHash: string,  // Combined stock + waste
  foundationCount: number,
  
  // New
  faceDownCount: number,           // Total face-down cards
  validSequences: number,          // 3+ card sequences in tableau
  emptyColumns: number,            // Available for Aces/Kings
  
  // Derived
  progressScore: number            // Composite metric
}
```

### Unproductive Cycle Detection

```javascript
function isUnproductiveCycle(previousState, currentState) {
  // Check 1: Did foundation count increase?
  if (currentState.foundationCount > previousState.foundationCount) {
    return false; // Productive
  }
  
  // Check 2: Did face-down count decrease?
  if (currentState.faceDownCount < previousState.faceDownCount) {
    return false; // Productive (revealed card)
  }
  
  // Check 3: Did valid sequences increase?
  if (currentState.validSequences > previousState.validSequences) {
    return false; // Productive
  }
  
  // Check 4: Did empty column get filled strategically?
  if (currentState.emptyColumns < previousState.emptyColumns) {
    // Check if it was Ace or King
    if (wasStrategicColumnFill(previousState, currentState)) {
      return false; // Productive
    }
  }
  
  // No productive changes detected
  return true;
}
```

### Unwinnable Detection (Conservative)

```javascript
function isGameUnwinnable(gameState, searchDepth = 5) {
  // Quick checks first
  
  // 1. Can any card reach foundation?
  const canReachFoundation = checkFoundationReachability(gameState);
  if (!canReachFoundation) {
    return { unwinnable: true, confidence: 'high', reason: 'blocked' };
  }
  
  // 2. Are there circular dependencies?
  const hasCircularBlock = checkCircularDependencies(gameState);
  if (hasCircularBlock) {
    return { unwinnable: true, confidence: 'high', reason: 'circular' };
  }
  
  // 3. Exhaustive search (limited depth for performance)
  const searchResult = exhaustiveSearch(gameState, searchDepth);
  if (searchResult.exhausted && !searchResult.winFound) {
    return { unwinnable: true, confidence: 'medium', reason: 'exhausted' };
  }
  
  // 4. User behavior check (last resort)
  // If user has cycled 10+ times with our detection active
  // and we've detected no progress, high confidence
  
  return { unwinnable: false };
}
```

---

## UI Specifications

### Tier 1: Concern (Optional)

**Visibility:** Can be disabled in Settings (default: OFF)

```
┌─────────────────────────────────┐
│  💡 Tip: You've been cycling    │
│  through the deck. Consider     │
│  undoing if you're stuck.       │
│                          [×]    │
└─────────────────────────────────┘
```

- Position: Top-center
- Duration: 5 seconds
- Animation: Slide down
- Dismiss: Click X or auto-dismiss

### Tier 2: Warning

**Visibility:** Respects Settings toggle

```
┌──────────────────────────────────────────────────┐
│                                                  │
│            ⚠️ You may be stuck                   │
│                                                  │
│    You've cycled through the deck 5 times        │
│    without making progress.                      │
│                                                  │
│    [Undo Last Moves]  [Keep Playing]             │
│                                                  │
└──────────────────────────────────────────────────┘
```

- Position: Center overlay
- Background: Semi-transparent dark
- Dismiss: Click action or "Keep Playing"
- Don't show again: Checkbox

### Tier 3: Confirmed Unwinnable

**Visibility:** Always (unless notifications fully disabled)

```
┌──────────────────────────────────────────────────┐
│                                                  │
│            🏁 Game Analysis Complete             │
│                                                  │
│    This game appears to be unwinnable.           │
│    All possible moves have been explored.        │
│                                                  │
│    Progress: 12/52 cards (23%)                   │
│    Moves made: 47                                │
│    Time: 5:32                                    │
│                                                  │
│    [New Deal]  [Undo 5 Moves]  [Restart]         │
│                                                  │
└──────────────────────────────────────────────────┘
```

- Use existing StalemateModal
- Enhanced with progress stats
- Clear primary action (New Deal)

---

## Settings Integration

### New Setting: Game State Notifications

**Location:** Settings > Gameplay

**Options:**
- **On (Default):** All tiers active
- **Minimal:** Only Tier 3 (confirmed unwinnable)
- **Off:** No notifications

**Help Text:** 
> "Get notified when the game detects you may be stuck or when a game is unwinnable. Minimal mode only shows confirmed unwinnable games."

### Settings Storage

```javascript
// localStorage key: meridian-settings
{
  theme: 'blue-casino',
  soundEffects: true,
  gameStateNotifications: 'on', // 'on' | 'minimal' | 'off'
  hints: true,
  // ... other settings
}
```

---

## Implementation Plan

### Phase 1: Enhanced Detection (Core) ✅

**Files:**
- `src/utils/gameLogic.js` - Enhanced GameStateTracker with productivity tracking
- `src/hooks/useCardGame.js` - Four-tier notification logic
- `src/utils/cardUtils.js` - Enhanced state fingerprinting

**Implemented:**
1. ✅ Face-down count, valid sequences, empty columns in fingerprint
2. ✅ `isProductiveMove()` - 6 types of productive moves tracked
3. ✅ `unproductiveCycleCount` - Separate from total moves
4. ✅ Four-tier system: hint → concern → warning → confirmed

### Phase 2: Unwinnable Detection ✅

**Files:**
- `src/utils/gameLogic.js` - `detectUnwinnableState()`, `quick/deepUnwinnableCheck()`
- `src/hooks/useCardGame.js` - `runUnwinnableCheck()` integration

**Implemented:**
1. ✅ BFS-based solver with node/time/depth limits
2. ✅ Quick (3K nodes) vs Deep (8K nodes) checks
3. ✅ Confidence levels (low/medium/high/certain)
4. ✅ Automatic triggering at 4+ unproductive cycles
5. ✅ Result caching in GameStateTracker

### Phase 3: UI Components ✅

**Files:**
- `src/components/GameStateToast/` - Toast for hint/concern tiers
- `src/components/GameStateOverlay/` - Overlay for warning tier
- `src/App.jsx` - Integration with game state

**Implemented:**
1. ✅ `GameStateToast` - Auto-dismiss, tier-specific styling, action button
2. ✅ `GameStateOverlay` - Semi-transparent backdrop, action buttons
3. ✅ CSS animations with `prefers-reduced-motion` support
4. ✅ Responsive mobile/desktop layouts
5. ✅ Integration in App.jsx with automatic display logic

### Phase 5: Stats Bar Cleanup ✅

**Files:**
- `src/components/GameStats/GameStats.jsx` - Simplified component
- `src/components/GameStats/GameStats.module.css` - Removed warning styles
- `src/components/GameStage/GameStage.jsx` - Removed prop
- `src/App.jsx` - Removed prop

**Implemented:**
1. ✅ Removed `circularPlayState` prop from GameStats
2. ✅ Removed warning indicator logic and CSS
3. ✅ Component now shows only moves and time
4. ✅ All warnings now via GameStateToast/GameStateOverlay

### Phase 4: Settings Integration ✅

**Files:**
- `src/contexts/NotificationSettingsContext.jsx` - Context provider
- `src/components/GameMenu/GameMenu.jsx` - Settings UI
- `src/main.jsx` - Provider integration
- `src/App.jsx` - Settings-aware display logic

**Implemented:**
1. ✅ `NotificationSettingsContext` with localStorage persistence
2. ✅ Three levels: On / Minimal / Off
3. ✅ `shouldShowNotification()` utility function
4. ✅ Settings UI in GameMenu (Notifications dropdown)
5. ✅ `isTierEnabled()` hook method for conditional display
6. ✅ App.jsx effect respects user preferences
- `src/contexts/SettingsContext.jsx` - Update schema
- `src/hooks/useSettings.js` - Handle new setting

**Tasks:**
1. Add "Game State Notifications" setting
2. Update settings schema
3. Wire up to notification system

### Phase 5: Remove Old UI

**Files:**
- `src/components/GameStats/GameStats.jsx` - Remove warning indicator

**Tasks:**
1. Remove circularPlayState warning from stats bar
2. Keep stats (moves, time) - just remove warning text

### Phase 6: Testing & Tuning

**Tasks:**
1. Test with 20+ games
2. Tune thresholds (target: <5% false positive)
3. Verify all tiers work correctly
4. Test settings toggle

---

## Thresholds (Initial)

| Metric | Tier 1 | Tier 2 | Tier 3 |
|--------|--------|--------|--------|
| Unproductive cycles | 3 | 5 | 10+ |
| Moves without progress | — | 30 | 50+ |
| Search confidence | — | — | Medium+ |

**Note:** These are STARTING values. Adjust based on testing.

---

## Migration from Current System

### Current Behavior → New Behavior

| Scenario | Current | New |
|----------|---------|-----|
| Active play, cycling stock | "⚡ 18 moves" warning | Nothing (Tier 0) |
| Cycling 5+ times no progress | "⚠️ Circular play" | Toast suggestion (Tier 2) |
| Unwinnable detected | Nothing | Modal (Tier 3) |
| Notifications disabled | Same warnings | Nothing shown |

### Backward Compatibility

- Existing `circularPlayState` prop remains (for now)
- Can be deprecated after transition
- No breaking changes to game logic

---

## Success Metrics

### Quantitative
- False positive rate: <5%
- False negative rate: <2%
- Time to detect unwinnable: <60 seconds of pointless cycling
- User engagement: 80%+ use suggested action when shown Tier 3

### Qualitative
- Users report understanding when game is unwinnable
- Users don't feel "nagged" during normal play
- Settings toggle is discoverable and used

---

## Open Questions (Decided)

| Question | Decision |
|----------|----------|
| Remove from stats bar? | **Yes.** Use toast/modal only. |
| Conservative vs aggressive? | **Conservative.** Fewer false positives. |
| Allow disabling? | **Yes.** Three options: On/Minimal/Off. |
| Tier 1 optional? | **Yes.** Default OFF to reduce noise. |

---

## Related Documents

- `DESIGN_PRINCIPLES.md` - Taxonomy and philosophy
- `GAME_STATE_NOTIFICATION_PLAN.md` - Original research
- `NOTIFICATION_SYSTEM_REVIEW.md` - Current system analysis


---

## Appendix A: Historical Review & Analysis

**Original Review Date:** January 2026  
**Source:** Consolidated from `NOTIFICATION_SYSTEM_REVIEW.md`

### Problems Identified in Original System

#### Detection Logic Issues

1. **"Progress" only counted foundation cards**
   - Did NOT consider: tableau builds, face-down reveals, sequence creation
   - Result: User could be actively playing well but get "stalled" warning

2. **"Cycles" counted every state repeat**
   - Returns to same tableau arrangement = cycle
   - But stock/waste might have changed, creating new opportunities
   - Result: False circular play detection during normal cycling

3. **Thresholds were too aggressive**
   - 15 moves without foundation placement = caution
   - 20 moves = stalled
   - In a complex game, 20 moves without foundation is NORMAL

#### UI Presentation Issues

1. **Small text in stats bar**
   - Easy to miss during active play

2. **No visual hierarchy**
   - Same presentation for caution/critical/stalled
   - No progressive escalation

3. **No action suggestions**
   - Just tells user there's a problem
   - Doesn't suggest: undo, hint, forfeit options

### Test Scenarios Analysis

| Scenario | User Action | Current Detection | Problem |
|----------|-------------|-------------------|---------|
| Active Play (False Positive) | Cycling stock to find playable card | Warning after 15-20 moves | User IS making progress (revealing cards) |
| Unwinnable Game (False Negative) | Cycling stock repeatedly | No warning | Game is unwinnable but no clear indication |
| Circular Play (True Positive) | Recycling stock 3+ times with no changes | "Circular play" warning | Working correctly, but UX could be better |

### Solutions Implemented

| Issue | Solution | Status |
|-------|----------|--------|
| False positives | Enhanced "progress" definition (6 types of productive moves) | ✅ Implemented |
| False negatives | Unwinnable detection with BFS solver | ✅ Implemented |
| Poor visibility | Progressive toast → overlay → modal system | ✅ Implemented |
| No guidance | Clear action buttons in each tier | ✅ Implemented |

### Threshold Evolution

| Tier | Original | Current | Rationale |
|------|----------|---------|-----------|
| Hint | 15 moves | 2 cycles | Earlier subtle indicator |
| Concern | 20 moves | 4 cycles | Reduced false positives |
| Warning | 3 cycles | 6 cycles | More tolerance for cycling |
| Confirmed | N/A | Solver-based | Mathematical certainty |

---

## Appendix B: Related Documents

- [Design System](./DESIGN_SYSTEM.md) - Taxonomy and philosophy
- [Historical: Game State Notification Plan](../archive/reference/GAME_STATE_NOTIFICATION_PLAN.md) - Original research
- [Historical: Notification System Review](../archive/reference/NOTIFICATION_SYSTEM_REVIEW.md) - Archived review (content merged above)

---

*This document is a living specification. Update when notification behavior changes.*
