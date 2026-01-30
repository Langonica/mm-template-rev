# Stabilization & Hardening Plan - v2.3.2

**Goal:** Make the current feature set rock-solid before release candidate.

**Status:** Phase 1 Ready for Implementation  
**Created:** 2026-01-29  

---

## Phase Overview

| Phase | Focus | Complexity | Files | Status |
|-------|-------|------------|-------|--------|
| 1 | App.jsx Architectural Hardening | Medium | 2-3 | [In Progress] Ready |
| 2a | Detection Tuning (Telemetry) | Low | 3-4 | [-] Pending |
| 2b | Detection Hardening (Edge Cases) | Medium | 4-5 | [-] Pending |
| 3* | Error Resilience (Optional) | Medium | 5+ | [-] Deferred |

*Phase 3 only if issues surface during testing

---

## Phase 1: App.jsx Architectural Hardening

### Objective
Eliminate setState-in-effect violations and fix architectural patterns that cause cascading renders.

### Why This Matters

```
Current Pattern (Problematic):
useEffect(() => {
  if (condition) {
    setState(value)  // Triggers re-render during render phase
  }
}, [deps])

Better Pattern:
useEffect(() => {
  if (condition) {
    // Schedule state update, don't call synchronously
    const timer = setTimeout(() => setState(value), 0)
    return () => clearTimeout(timer)
  }
}, [deps])

Best Pattern (if initialization):
const [state, setState] = useState(() => {
  // Calculate initial state synchronously
  return computeInitialValue()
})
```

### Issues to Fix

#### 1.1 `setLastGameResult(null)` in Effect (Line 393)
**Location:** `App.jsx:393`

**Current Code:**
```javascript
useEffect(() => {
  if (currentSnapshot && moveCount === 0 && !gameEndedRef.current) {
    recordGameStart()
    gameEndedRef.current = false
    setLastGameResult(null)  // [-] setState in effect body
  }
}, [currentSnapshot, moveCount, recordGameStart])
```

**Problem:** Setting state during effect body causes cascading renders.

**Solution:** Initialize state properly or use event handler pattern.

**Implementation:**
```javascript
// Option A: Move to state initializer
const [lastGameResult, setLastGameResult] = useState(() => {
  // Compute initial value if needed
  return null
})

// Option B: Use ref for game state tracking
const gameStateRef = useRef({ hasRecordedStart: false, result: null })

useEffect(() => {
  if (currentSnapshot && moveCount === 0 && !gameStateRef.current.hasRecordedStart) {
    recordGameStart()
    gameStateRef.current.hasRecordedStart = true
    gameStateRef.current.result = null
  }
}, [currentSnapshot, moveCount, recordGameStart])
```

#### 1.2 Missing Dependencies (Lines 373, 712)
**Location:** `App.jsx:373` and `App.jsx:712`

**Issues:**
- Line 373: Missing `handleRedoWithNotification` and `handleUndoWithNotification`
- Line 712: Missing `loadGameState`

**Solution:** Use `useCallback` for handlers or restructure to avoid dependency.

#### 1.3 `setSelectedSnapshotId` Unused (Line 120)
**Location:** `App.jsx:120`

**Current:**
```javascript
const [selectedSnapshotId, setSelectedSnapshotId] = useState(null)
```

**Problem:** Assigned but never used. Incomplete feature or dead code.

**Solution:** Either implement snapshot persistence or remove.

**Decision Needed:** Was this intended for "continue game" functionality? If so, implement:
```javascript
// In handleNewGame or game end
setSelectedSnapshotId(currentSnapshot?.id || null)

// In initialization
useEffect(() => {
  // Restore from localStorage if available
  const saved = localStorage.getItem('meridian-last-snapshot')
  if (saved && !currentSnapshot) {
    // Offer to continue
  }
}, [])
```

If not needed, remove to reduce bundle size and confusion.

#### 1.4 setState-in-effect (Lines 429, 455)
**Location:** `App.jsx:429` and `App.jsx:455`

Similar pattern to 1.1 - setState called directly in effect body.

**Solution:** Consolidate with 1.1 approach.

### Files to Modify

| File | Changes | Lines |
|------|---------|-------|
| `src/App.jsx` | Refactor effects to remove setState-in-effect | 120, 373, 393, 429, 455, 712 |
| `src/hooks/useGameStats.js` | Add memoization for callbacks | TBD |

### Testing Checklist

- [ ] Build passes with no ESLint errors
- [ ] Game initialization still works (new game, snapshot load)
- [ ] Undo/redo still triggers notifications
- [ ] Game end detection still works
- [ ] Performance feels responsive (no lag on rapid actions)

### Implementation Notes

**Model Selection:**
- This phase requires Opus-level analysis of state flow
- The interactions between effects are complex
- Risk of breaking game state management

**Delegate To:** Opus (this session)

---

## Phase 2a: Game State Detection Tuning (Telemetry)

### Objective
Add telemetry to measure false positive/negative rates and tune thresholds.

### Why This Matters

Current thresholds (2/4/6 cycles for hint/concern/warning) were educated guesses. We need data to tune them.

### Implementation Plan

**2a.1 Telemetry Hook**
```javascript
// src/hooks/useGSTelemetry.js
export function useGSTelemetry() {
  const sessionRef = useRef({
    gamesPlayed: [],
    falsePositives: [],
    falseNegatives: [],
    tierEscalations: []
  })
  
  const recordGameResult = (gameState, wasWinnable, userQuit) => {
    // Store for analysis
  }
  
  const recordFalsePositive = (tier, cycleCount, gameState) => {
    // User kept playing after warning and eventually won
  }
  
  return { recordGameResult, recordFalsePositive, getReport }
}
```

**2a.2 User Feedback Mechanism**
```javascript
// In GameStateOverlay - add "I can still win this" button
// Tracks when user dismisses warning and continues
```

**2a.3 Threshold Configuration**
```javascript
// Make thresholds configurable for testing
const THRESHOLDS = {
  hint: parseInt(localStorage.getItem('gs-hint-threshold') || '2'),
  concern: parseInt(localStorage.getItem('gs-concern-threshold') || '4'),
  warning: parseInt(localStorage.getItem('gs-warning-threshold') || '6')
}
```

### Files to Create/Modify

| File | Purpose |
|------|---------|
| `src/hooks/useGSTelemetry.js` | New - telemetry tracking |
| `src/App.jsx` | Integrate telemetry |
| `src/components/GameStateOverlay/` | Add feedback buttons |
| `src/components/GameStateToast/` | Add feedback buttons |

### Delegate To:** Sonnet (clear requirements, isolated scope)

---

## Phase 2b: Game State Detection Hardening (Edge Cases)

### Objective
Handle edge cases and add recovery options.

### Implementation Plan

**2b.1 "Ignore This Game" Option**
- Add button to disable notifications for current game
- Persist per-game flag
- Reset on new game

**2b.2 Solver Timeout Recovery**
- Current solver has 100ms max timeout
- If solver times out, show "analysis incomplete" not "possibly unwinnable"
- Retry with reduced depth

**2b.3 Detection Failure Recovery**
- If GameStateTracker throws, catch and disable for that game
- Log to console for debugging
- Don't crash the game

### Files to Modify

| File | Changes |
|------|---------|
| `src/utils/gameLogic.js` | Harden solver timeout handling |
| `src/hooks/useCardGame.js` | Add ignore flag, error boundaries |
| `src/components/GameStateOverlay/` | Add ignore button |

### Delegate To:** Sonnet (with Opus review for error handling patterns)

---

## Success Criteria

### Phase 1
- [ ] Zero ESLint errors in App.jsx
- [ ] Zero setState-in-effect warnings
- [ ] All tests pass (if we had tests...)
- [ ] Manual playthrough of 5+ games with no state sync issues

### Phase 2a
- [ ] Telemetry data collected for 20+ games
- [ ] Thresholds can be adjusted via localStorage for testing
- [ ] False positive/negative report available

### Phase 2b
- [ ] "Ignore this game" option works
- [ ] Solver timeout handled gracefully
- [ ] Detection failures don't crash game

---

## Rollback Plan

If issues arise during implementation:
1. Revert App.jsx changes (keep backup)
2. Game reverts to current state (functional but with warnings)
3. Document specific issue encountered

---

## Related Documents

- [CODE_QUALITY.md](./CODE_QUALITY.md) - Current ESLint status
- [NOTIFICATION_SYSTEM.md](./NOTIFICATION_SYSTEM.md) - Detection system spec
- [BACKLOG.md](./BACKLOG.md) - Technical debt tracking

---

*Plan created for pre-RC stabilization. Focus: eliminate architectural debt that could cause testing instability.*
