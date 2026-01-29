# Game State Notification System - Implementation Specification

**Status:** Ready for Implementation  
**Based On:** DESIGN_PRINCIPLES.md - Conservative, User-Controllable, Signal Over Noise

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

### Phase 1: Enhanced Detection (Core)

**Files:**
- `src/utils/gameLogic.js` - Add isProductiveMove(), enhanced GameStateTracker
- `src/hooks/useCardGame.js` - Update tracking logic

**Tasks:**
1. Add face-down count, valid sequences to state fingerprint
2. Implement isProductiveMove() function
3. Track "unproductive cycle count" separately from "total moves"
4. Update calculateWarningLevel() with new thresholds

### Phase 2: Unwinnable Detection

**Files:**
- `src/utils/gameLogic.js` - Add isGameUnwinnable()

**Tasks:**
1. Implement foundation reachability check
2. Implement circular dependency detection
3. Add limited-depth exhaustive search
4. Cache results to avoid recomputation

### Phase 3: UI Components

**Files:**
- `src/components/GameStateToast/` - NEW
- `src/components/GameStateOverlay/` - NEW (or enhance existing)
- `src/components/StalemateModal/` - Enhance

**Tasks:**
1. Create toast component
2. Create overlay component
3. Update StalemateModal with new stats
4. Add CSS animations

### Phase 4: Settings Integration

**Files:**
- `src/components/GameMenu/SettingsPanel.jsx` - Add toggle
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
