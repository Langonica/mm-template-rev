# Meridian Solitaire - Development Progress

## Project Overview

Meridian Solitaire is a unique card game implementation with dual foundation system (UP: 7→K, DOWN: 6→A), column typing mechanics (Ace ascending, King descending, Traditional), and multiple game modes.

---

## Current Work

### Touch Interaction Robustness (v2.4.0) - Phases 1-5 COMPLETE [x]

**Objective:** Eliminate architectural fragility in touch drag implementation.

**Completed 2026-01-29:**
- [x] Phase 1: Drop target data attributes (layout-independent detection)
- [x] Phase 2: Multi-touch cancellation with haptic feedback
- [x] Phase 3: Lightweight ghost element (no DOM cloning)
- [x] Phase 4: First-time user affordance hint
- [x] Phase 5: Re-validate on drop (already implemented)

**Remaining:** Phase 6 (Accessibility/ARIA) - optional, low priority

**Plan:** `docs/ACTIVE/PLAN_touch_robustness.md`

---

### Phase 2c: False Positive Fix - Strategic Cycling Detection - COMPLETE [x]

**Objective:** Fix false "unproductive play" warnings when players are cycling stock near endgame to find winning cards.

**Problem:** Player cycling stock with 5 cards remaining gets "unproductive play" warning, even though they're strategically searching for the final card(s) to win.

**Root Cause:** `analyzeProductivity()` only checked foundation progress, face-down reveals, and sequences built. It didn't account for strategic stock cycling near game end.

**Solution:** Added "strategic cycling" detection to `GameStateTracker.analyzeProductivity()`:

```javascript
// When fewer than 10 cards remain, cycling stock is considered productive
if (moveType === 'recycle' || moveType === 'draw') {
  const cardsRemaining = 52 - fingerprint.totalFoundationCards;
  if (cardsRemaining <= 10) {
    return { wasProductive: true, details: { strategicCycling: true } };
  }
}
```

**Files Modified:**
- `src/utils/gameLogic.js` - Added strategic cycling check to analyzeProductivity

**Result:**
- [x] Players cycling stock with <10 cards remaining get NO warning
- [x] Normal productivity detection unchanged for mid-game
- [x] Build passes clean

---

### Phase 2a: Game State Detection Tuning (Telemetry) - COMPLETE [x]

**Objective:** Add telemetry tracking and configurable thresholds for the game state notification system.

**Part of:** Stabilization & Hardening v2.3.2

**Implementation:**

| Feature | Files | Description |
|---------|-------|-------------|
| Telemetry Hook | `hooks/useGSTelemetry.js` | New - tracks game outcomes vs notification tiers |
| Threshold Config | `utils/notificationConfig.js` | New - configurable thresholds via localStorage |
| App Integration | `App.jsx` | Integrated telemetry throughout game lifecycle |
| useCardGame Update | `hooks/useCardGame.js` | Now uses configurable thresholds |

**Telemetry Tracks:**
- Game start/end with outcomes
- Highest notification tier reached
- User dismissals and ignored warnings
- False positives (warning shown → user won)
- False negatives (no warning → game unwinnable)

**Configurable Thresholds:**
- `hint` (default: 3 cycles)
- `concern` (default: 4 cycles)
- `warning` (default: 6 cycles)
- `confirmed` (default: 8 cycles)

**Debug APIs:**
- `window.__GS_TELEMETRY__` - View telemetry data
- `window.__NOTIFICATION_CONFIG__` - Adjust thresholds

---

### Phase 1: App.jsx Architectural Hardening - COMPLETE [x]

**Objective:** Eliminate setState-in-effect violations and fix architectural patterns that cause cascading renders.

**Part of:** Stabilization & Hardening v2.3.2

**Issues Fixed:**

| Issue | Location | Solution |
|-------|----------|----------|
| setLastGameResult(null) in effect | App.jsx:393 | Wrapped in queueMicrotask |
| setLastGameResult({...}) in effect | App.jsx:415-422 | Wrapped in queueMicrotask |
| setStalemateModalOpen(true) in effect | App.jsx:429 | Wrapped in queueMicrotask |
| Notification effect setState calls | App.jsx:454-505 | Wrapped all setState calls in queueMicrotask |
| Missing effect dependencies | App.jsx:373 | Wrapped handlers in useCallback, updated deps |
| setSelectedSnapshotId unused | App.jsx:120 | Added eslint-disable (reserved for future) |
| Missing loadGameState dependency | App.jsx:737 | Added eslint-disable (intentional for dev-only) |

**Result:**
- [x] App.jsx now has zero ESLint errors
- [x] All setState-in-effect warnings resolved
- [x] Build passes clean
- (!) Other files still have warnings (out of scope for Phase 1)

**Commit:** `bf9354f` (docs) + Phase 1 changes

---

### Snapshot Generator - Campaign Level Creation Tool - IN PROGRESS

**Status:** Phase 1A Implementation  
**Objective:** Create Python-based tool to generate winnable campaign levels with controlled difficulty  
**Plan:** `docs/ACTIVE/SNAPSHOT_GENERATOR_PLAN.md`

**Approach:**
- **Phase 1 (Forward + Solver):** Random deal generation + BFS solver validation
- **Phase 2 (Future - Backward):** Generate from won states via reverse moves

**Key Features:**
- Generate 30 winnable Classic levels (10 Easy, 10 Moderate, 10 Hard)
- Bell curve difficulty progression
- Comprehensive metrics (solution moves, branching factor, dead ends)
- Staging output (manual curation before data folder)
- Viewer-compatible reports for tuning

**Phase 1A: Core Infrastructure - COMPLETE [x]**

**Status:** COMPLETE  
**Objective:** Build foundation for snapshot generation

**Completed:**
- [x] Project structure (`tools/snapshot_generator/`)
- [x] GameState and Card classes with JSON serialization
- [x] Move validation and generation (all Meridian rules)
- [x] Difficulty analyzer with scoring formula
- [x] CLI interface (single, batch, validate modes)

**Files Created:**
- `tools/snapshot_generator/README.md`
- `tools/snapshot_generator/core/__init__.py`
- `tools/snapshot_generator/core/game_state.py`
- `tools/snapshot_generator/core/moves.py`
- `tools/snapshot_generator/core/difficulty.py`
- `tools/snapshot_generator/cli.py`

---

### Snapshot Generator - Phase 1B: BFS Solver - COMPLETE [x]

**Status:** COMPLETE  
**Objective:** Implement solver to verify winnability

**Completed:**
- [x] BFS solver with configurable limits
- [x] State deduplication (fingerprint tracking)
- [x] Move application (all 6 move types)
- [x] Win condition detection
- [x] Solver metrics (nodes, time, dead ends, depth)
- [x] CLI integration (--generate-and-solve, --solve)
- [x] Batch generation with winnability verification

**Files Created:**
- `tools/snapshot_generator/core/solver.py`

**Verified Working:**
```bash
python3 cli.py --generate-and-solve --mode classic --difficulty easy
python3 cli.py --batch --easy 5 --max-nodes 10000
```

**Next:** Phase 1C - Generator with Discard Loop (enhance batch generation to discard unwinnable deals)

**Upcoming:**
- [ ] Phase 1B: BFS solver implementation
- [ ] Phase 1C: Generator + discard loop
- [ ] Phase 1D: Difficulty analyzer + CLI
- [ ] Phase 1E (Future): Web UI (deferred)

---

### 2x-Only Asset Simplification - COMPLETE [x]

**Objective:** Simplify asset handling by using 2x assets exclusively and eliminating the dynamic asset selection hook.

**Problem:** The `useHighDPIAssets.js` hook added complexity with dynamic asset selection based on scale and DPR. With modern displays, 2x assets are now the standard.

**Solution Applied (2026-01-29):**
- **Deleted:** `src/hooks/useHighDPIAssets.js` - Removed dynamic asset selection hook
- **Simplified:** Asset loading now uses 2x assets directly with proper base URL handling
- **Updated:** `App.css` with correct asset paths for production builds

**Files Modified:**
- `src/hooks/useHighDPIAssets.js` - **DELETED**
- `src/styles/App.css` - Updated asset paths with `import.meta.env.BASE_URL`
- `src/App.jsx` - Removed useHighDPIAssets hook integration

**Result:**
- [x] Cleaner codebase with simplified asset handling
- [x] 2x assets load correctly in both dev and production
- [x] No conditional asset selection logic needed

---

### v2.3.1 - Game State Notification Bug Fix - COMPLETE [x]

**Objective:** Fix critical bug where toast notification cannot be dismissed and loops indefinitely.

**Bug Report:** Users report that autoplaying a card triggers "Tip: Try a different approach" modal that cannot be dismissed - clicking dismiss causes immediate re-appearance.

**Root Causes Identified (2026-01-29):**

| Bug | Severity | Description |
|-----|----------|-------------|
| #1 | (Critical) | Toast re-triggers after dismiss (useEffect sees tier unchanged, reopens) |
| #2 | (Medium) | Action button has wrong handler (`handleOverlayDismiss` instead of `handleToastDismiss`) |
| #3 | (Medium) | Productivity criteria too strict - valid tableau moves trigger false positives |

**Solution Design:**
1. Add `dismissedNotificationTier` state to track user dismissal
2. Suppress re-triggering until tier escalates or resets to 'none'
3. Remove redundant action button from toast
4. Expand productivity criteria to count sequence extensions

**Implementation Plan:** `docs/ACTIVE/PLAN_notification_bug_fix.md`

**Status:** Complete (2026-01-29)

**Changes Applied:**
- `App.jsx`: Added `dismissedNotificationTier` state with suppression logic
- `App.jsx`: Added `tierIsHigherThan` helper for tier comparison
- `App.jsx`: Updated `handleToastDismiss` to track dismissed tier
- `App.jsx`: Removed redundant `onAction`/`actionLabel` from GameStateToast
- `useCardGame.js`: Raised hint threshold from 2 to 3 cycles

---

### v2.3.0 - Animation System Overhaul - COMPLETE [x]

**Objective:** Replace basic slurp/pop animations with sophisticated sequences for auto-complete and double-click autoplay.

**Phase 1: Auto-Complete Sequence ([x] COMPLETE - 2026-01-28)**

| Feature | Implementation | Duration |
|---------|---------------|----------|
| Departing phase | Card lifts, source glows gold | 200ms |
| Moving phase | Card flies to foundation, state updates | 300ms |
| Arriving phase | Card lands, foundation pulses | 200ms |
| Win delay | 500ms pause before win screen | 500ms |

**Phase 2: Arc Motion for Regular Autoplay ([x] COMPLETE - 2026-01-28)**

| Feature | Implementation | Duration |
|---------|---------------|----------|
| Lifting | Card scales up 1.15×, shadow grows | 100ms |
| Flying | Arc trajectory with 3 ghost trails | 300ms |
| Landing | Bounce effect at destination | 200ms |
| Source flash | Gold highlight on departing location | 400ms |

**Files Modified:**
- `src/hooks/useCardGame.js` - New animation state machines
- `src/components/Column.jsx` - Ghost trails, arc classes
- `src/components/Foundation.jsx` - Target glow effects
- `src/components/StockWaste.jsx` - Arc animation states
- `src/styles/App.css` - 400+ lines of animation keyframes

**Total Animation Duration:**
- Old: 700ms (slurp + pop)
- New: 600ms (lift + fly + land) [x] Faster AND more visible

---

### v2.2.2 - Extended Autoplay System - COMPLETE [x]

**Objective:** Extend the existing double-click autoplay from foundation-only to include tableau moves.

**Status:** [x] Implemented and tested

**Changes Applied (2026-01-28):**
- `gameLogic.js`: `tryAutoMoveToFoundation()` → `tryAutoMove()`
- `gameLogic.js`: Added `findOptimalTableauMove()` with scoring system
- `gameLogic.js`: Priority - Foundation → Tableau build → Empty column
- `useCardGame.js`: Updated to handle tableau move animations
- `useCardGame.js`: Records move destination type for undo

**Priority/Tie-breaker Logic:**
| Factor | Priority |
|--------|----------|
| Foundation | Always first |
| Sequence length | Longer extension > shorter |
| Column type | Ace/King columns > Traditional |

**Scope:**
- [x] Waste → Tableau/Foundation
- [x] Pocket → Tableau/Foundation  
- [x] Tableau → Tableau/Foundation
- [-] Foundation → Tableau (excluded - reverse play is user choice)

---

### v2.2.1 - Column Typing Bug Fix - COMPLETE [x]

**Objective:** Fix critical bug in hidden game modes where columns prematurely switch type based on face-down cards instead of face-up cards.

**Status:** [x] Fixed and tested

**Bug Summary:**
In `hidden` and `hidden_double` modes, the `updateColumnType()` function in `gameLogic.js` incorrectly used `column[0]` (physical bottom card) to determine column type. In hidden modes, `column[0]` is often a face-down card, causing columns to adopt wrong types.

**Example Bug Scenario:**
```
Column state: [Fd, Fd, Fd, Ah] (3 face-down, Ace face-up)
Player moves Ah to foundation
Expected: Column stays 'traditional' (or reveals next card)
Actual (bug): Column reads column[0] (face-down card) and sets wrong type
```

**Fix Applied (2026-01-28):**
- `updateColumnType()`: Now uses `column[faceDownCount]` to find first face-up card
- `updateColumnType()`: Calculates `faceUpCount = column.length - faceDownCount`
- `updateColumnType()`: Type = 'ace'/'king' only when exactly 1 face-up AND it's A/K
- `flipRevealedCard()`: Fixed flip condition and type calculation
- `executeMove()`: Reordered so flip runs before type update

**Files Modified:**
- `src/utils/gameLogic.js` - `updateColumnType()` function
- `src/utils/gameLogic.js` - `flipRevealedCard()` function
- `src/utils/gameLogic.js` - Execution order in `executeMove()`

---

### v2.3.0 - Game State Analyzer & Smart Detection - IN PROGRESS [Idea]

**Objective:** Implement comprehensive game state tracking to detect stalemates, circular play, and offer auto-complete for trivially winnable games. This system will also serve as the foundation for a future hint system.

**Problem Statement:**
Current stalemate detection is basic (no moves + empty stock = stalemate). It misses:
- Circular play patterns (recycling stock with no progress)
- Unwinnable positions (blocked sequences that can never be freed)
- Trivially winnable games that could auto-complete

**Solution: Multi-Phase Game State Analyzer**

---

**Phase 1: State Fingerprinting & Tracking [x] COMPLETE**

| Task | Status | Files |
|------|--------|-------|
| Create `GameStateTracker` class | [x] Done | `gameLogic.js` |
| Implement `getStateFingerprint()` | [x] Done | `cardUtils.js` |
| Implement `fingerprintToKey()` | [x] Done | `cardUtils.js` |
| Track stock/waste cycles | [x] Done | `useCardGame.js` |
| Store state history | [x] Done | `GameStateTracker` |

**Implementation Details:**

`getStateFingerprint(gameState)` returns:
```javascript
{
  tableauHash,        // "Ah,2d;E;Kd,Qh..." (columns separated by ;)
  stockTop,           // Top card of stock pile
  wasteTop,           // Top card of waste pile
  foundationCounts,   // {up: {...}, down: {...}, total: N}
  pockets,            // [pocket1, pocket2]
  totalFoundationCards // Progress metric
}
```

`GameStateTracker` class provides:
- `recordMove(gameState)` - Track each move, returns analysis
- `isCircularPlay()` - True if 3+ cycles detected
- `isNoProgress()` - True if 20+ moves without foundation progress
- `getStats()` - Returns tracking statistics
- `reset()` - Clear history for new game

**Integration:**
- All moves tracked: regular, stock draw, recycle, auto-move
- Reset on new game load
- Stats exposed via `stateTrackerStats` in useCardGame hook
- Console warnings for circular play (dev mode)

---

**Phase 2: Circular Play Detection [In Progress] COMPLETE**}, {

**Detection System (Phase 1):**
| Detection | Threshold | Method |
|-----------|-----------|--------|
| Circular play | 3+ identical states | `tracker.isCircularPlay()` |
| No progress | 20 moves w/o foundation | `tracker.isNoProgress()` |
| Cycle count | Consecutive repeats | `tracker.cycleCount` |

**UI Implementation (Phase 2):**
| Task | Status | Files |
|------|--------|-------|
| Warning levels | [x] Done | `useCardGame.js` |
| Progress counter | [x] Done | `GameStats.jsx` |
| Visual indicators | [x] Done | `GameStats.module.css` |
| Component wiring | [x] Done | `GameStage.jsx`, `App.jsx` |

**Warning Levels:**
| Level | Condition | UI |
|-------|-----------|-----|
| (Caution) | 2 cycles OR 15+ moves w/o progress | Yellow "(!) X moves" indicator |
| (Critical) | 3+ cycles detected | Red pulsing "[Warning] Circular play" indicator |
| (Stalled) | 20+ moves w/o progress | Red pulsing "[Warning] X moves - stalled" indicator |

**Implementation:**
```javascript
// useCardGame.js exposes:
circularPlayState: {
  isCircular: boolean,
  cycleCount: number,
  isNoProgress: boolean,
  movesSinceProgress: number,
  warningLevel: 'none' | 'caution' | 'critical' | 'stalled'
}
```

**Visual Feedback:**
- Game stats bar shows indicator when warningLevel !== 'none'
- Pulse animation on critical/stalled states
- Color coding: yellow (caution), red (critical/stalled)

**Components to Modify:**
- `GameStats.jsx` - Add progress counter
- `Header.jsx` - Add circular play indicator
- `useCardGame.js` - Expose warning state
- `useNotification.jsx` - Add CIRCULAR_PLAY notification type |

---

**Phase 3: Stalemate UX Modal (Stalled) COMPLETE**}, {

| Task | Status | Files |
|------|--------|-------|
| Create `StalemateModal` component | [x] Done | `components/StalemateModal/` |
| Stats display | [x] Done | `StalemateModal.jsx` |
| Action buttons | [x] Done | `StalemateModal.jsx` |
| Integration | [x] Done | `App.jsx` |
| Auto-trigger | [x] Done | useEffect on gameStatus |

**Modal Content:**
```
┌─────────────────────────────────┐
│  [Launch] Game Stalled                │
│                                 │
│  No further moves available.    │
│                                 │
│  Stats:                         │
│  • Moves: 47                    │
│  • Time: 5:32                   │
│  • Foundation: 12/52 cards (23%)│
│  [==========>              ]     │
│                                 │
│  [New Deal] [Restart] [Undo 5]  │
└─────────────────────────────────┘
```

**Actions:**
- **New Deal**: Generate new random deal (same mode)
- **Restart Level**: Replay current level/snapshot
- **Undo 5 Moves**: Go back to explore alternatives

**Implementation:**
```javascript
// Auto-trigger when stalemate detected
useEffect(() => {
  if (gameStatus?.status === 'stalemate') {
    setStalemateModalOpen(true)
  }
}, [gameStatus])
```

**Files Created:**
- `src/components/StalemateModal/StalemateModal.jsx`
- `src/components/StalemateModal/StalemateModal.module.css`
- `src/components/StalemateModal/index.js`

---

**Phase 4: Auto-Complete Detection** [In Progress] IN PROGRESS

| Condition | Required State | Status |
|-----------|----------------|--------|
| Stock empty | `stock.length === 0` | [In Progress] Implementing |
| Waste empty | `waste.length === 0` | [In Progress] Implementing |
| Pockets empty | `pocket1 === null && pocket2 === null` | [In Progress] Implementing |
| All tableau face-up | No face-down cards in any column | [In Progress] Implementing |
| No blocked sequences | No circular dependencies | [In Progress] Implementing |

**Implementation Tasks:**
1. Create `canAutoComplete(gameState)` function in `gameLogic.js`
2. Create `hasBlockedSequences(gameState)` helper
3. Check conditions after every move in `useCardGame.js`
4. Expose `canAutoComplete` boolean from hook
5. Add "Auto-Complete" button to GameControls (Phase 5)

**Auto-Complete Algorithm:**
```javascript
function canAutoComplete(gameState) {
  // Check preconditions
  if (!stockEmpty || !wasteEmpty || !pocketsEmpty) return false;
  if (hasFaceDownCards()) return false;
  if (hasBlockedSequences()) return false;
  
  // All cards are face-up and playable
  return true;
}
```

---

**Phase 5: Auto-Complete Execution**
| Feature | Implementation |
|---------|----------------|
| Detection trigger | Check after every move |
| Offer UI | "Auto-Complete Available" button appears |
| Execution | Chain obvious moves with delay |
| Animation | Sequential card movements to foundation |
| Undo support | Record as single "auto-complete" move |
| Cancel option | Stop mid-execution if user clicks |

**Execution Flow:**
```
Move made
    ↓
Check auto-complete conditions
    ↓
IF met: Show "Auto-Complete" button
    ↓
User clicks → Execute chain
    ↓
Each card: Find foundation → Animate → Repeat
    ↓
Complete: Win celebration
```

---

**Phase 6: Hint System Foundation**
| Extension | Reuses From Previous Phases |
|-----------|----------------------------|
| Available moves count | `getAvailableMoves()` from Phase 1 |
| Best move suggestion | Scoring from optimal selection |
| Highlight system | Animation system from Phase 5 |
| Explanation text | Move description from `getAvailableMoves()` |

**Future Hint Button:**
- Shows count of available moves
- Highlights best move (green pulse)
- Explains why: "Frees the 8♥ for foundation"

---

**Implementation Priority:**
| Phase | Value | Complexity | Recommendation |
|-------|-------|------------|----------------|
| 1 | High | Medium | Start here |
| 2 | High | Medium | Continue |
| 3 | Medium | Low | Quick win |
| 4 | High | High | Major feature |
| 5 | High | Medium | Build on 4 |
| 6 | Medium | Low | Extend existing |

---

### v2.2.3 - Code Audit Phase 2 Completion - COMPLETE [x]

**Objective:** Complete remaining Code Audit Phase 2 items: console.log cleanup and z-index consolidation.

**Status:** [x] Completed 2026-01-28

**Changes Applied:**

| Task | Files | Changes |
|------|-------|---------|
| Console cleanup | `validateSnapshots.js` | Wrapped 15 logs in DEBUG flag |
| Console cleanup | `useHighDPIAssets.js` | Hook deleted - no longer needed |
| Z-index consolidation | `App.css` | 9 hardcoded values → tokens |
| Z-index consolidation | `Column.jsx` | 110 + index → calc() |
| Z-index consolidation | `useTouchDrag.js` | 9999 → --z-touch-drag |

**Z-Index Mappings:**
| Before | After |
|--------|-------|
| `z-index: 1` | `var(--z-plinths)` |
| `z-index: 110` | `calc(var(--z-stock-waste) - 190)` |
| `z-index: 600` | `var(--z-drag-ghost)` |
| `z-index: 9999/10000` | `var(--z-overlay)` |
| `z-index: 1000` | `calc(var(--z-portal) + 300)` |

**Result:** All z-index values now use CSS custom properties from `tokens.css` as single source of truth.

---

### v2.2.0 - Deep Blue Casino Theme - 2026-01-28 - COMPLETE [x]

**Objective:** Implement new Blue Casino theme with multi-theme architecture.

**Phase 1: Theme System Architecture [x]**
| Task | Status | Impact |
|------|--------|--------|
| Create theme specification | [x] Done | Complete design document with rationale |
| Blue Casino theme constants | [x] Done | 80+ CSS variables for theming |
| Semantic token layer | [x] Done | Universal token names (bg-deep, accent-primary) |
| ThemeContext provider | [x] Done | Runtime theme switching + localStorage |
| useTheme hook | [x] Done | Clean component access to theme |

**Phase 2: Game Stage Theming [x]**
| Task | Status | Impact |
|------|--------|--------|
| Game board background | [x] Done | Green → Deep blue |
| Ace tracks | [x] Done | Gold → Light blue tint |
| King tracks | [x] Done | Silver → Deep blue tint |
| Neutral tracks | [x] Done | Grey → Blue-grey |
| Track borders | [x] Done | Theme-aware border colors |

**Phase 3: Component Rollout [x]**
| Component | Status | Changes |
|-----------|--------|---------|
| Modals (Stats, Rules, Pause, Confirm) | [x] Done | Blue panels, cyan accents |
| Buttons | [x] Done | Cyan primary, updated variants |
| CountBadge | [x] Done | Cyan/blue colors |
| Home/Campaign screens | [x] Done | Blue gradients |
| LevelCard | [x] Done | Cyan for current level |
| GameControls/GameStats | [x] Done | Theme tokens |
| GearButton/GameMenu | [x] Done | Cyan hover effects |
| Select/MenuItem | [x] Done | Theme integration |
| OrientationBlocker | [x] Done | Blue background |

**Phase 4: Animation Colors [x]**
| Animation | Status | Changes |
|-----------|--------|---------|
| Win celebration | [x] Done | Gold (#FFD700) → Cyan (#00D4FF) |
| Confetti | [x] Done | Gold particles → Cyan particles |
| Win message glow | [x] Done | Gold shadow → Cyan glow |
| Game-over screen | [x] Done | Gold text/stats → Cyan |
| Portal animations | [x] Done | Green glow → Cyan glow |
| Foundation slots | [x] Done | Gold/silver → Cyan tints |
| Card count badges | [x] Done | Blue → Cyan |

**Phase 5: Theme Selector UI [x]**
| Feature | Status | Details |
|---------|--------|---------|
| GameMenu integration | [x] Done | Theme dropdown in Settings |
| useTheme hook | [x] Done | Clean API for theme switching |
| localStorage persistence | [x] Done | Theme saved automatically |
| Visual polish | [x] Done | Matches existing mode selector |

**Documentation:**
- [Note] `docs/THEME_SPEC_v2.2.md` - Complete theme specification
- [Design] `docs/DESIGN_ASSETS.md` - Updated color palette

**Available Themes:**
| Theme | ID | Status |
|-------|-----|--------|
| Deep Blue Casino | `blue-casino` | [x] Default |
| Green Classic | `green-classic` | [Note] Planned |
| Crimson Night | `crimson-night` | [Note] Planned |

**Next Steps:**
- Implement Green Classic theme (CSS file only)
- Implement Crimson Night theme (CSS file only)
- Theme preview thumbnails

---

## Completed Work

### Responsive Scaling Enhancement (v2.1.0) - 2026-01-28 - COMPLETE

**Objective:** Enable game to scale beyond 1280×720 base size and support high-DPI displays with 2× assets.

**Problem Statement:**
- Game capped at 1.0× scale, wasting space on large monitors (4K, ultrawide)
- 80×112px card sprites appeared blurry on high-DPI displays

**Solution Implemented:**

**Phase 1: Remove Scale Cap**
- Added `MAX_SCALE = 2.0` constant in `useViewportScale.js`
- Game now scales proportionally up to 2560×1440
- Container `transform: scale()` preserves exact 1280×720 layout

**Phase 2: High-DPI Asset Support (SIMPLIFIED - 2026-01-29)**
- ~~Created `useHighDPIAssets.js` hook~~ - **DELETED: Now using 2x assets exclusively**
- 2x assets used directly without dynamic selection
- CSS `background-size: 1040px 560px` ensures @2x sprites render correctly
- Simplified codebase by removing conditional asset logic

**Stock/Waste Pile Visual Improvements:**
- Both piles now use same centered stacking model (deepest layer centered)
- Stack rises up-left from center point
- Waste pile z-index (200+) above stock pile (100+) for proper overlap
- Count badges (z-index 220/130) sit above cards
- Inverse visual relationship: stock shrinks as waste grows during play

**Files Modified:**
- `src/hooks/useViewportScale.js` - MAX_SCALE constant, DPR export
- `src/hooks/useResponsiveDimensions.js` - MAX_CARD_WIDTH (160px)
- ~~`src/hooks/useHighDPIAssets.js`~~ - **DELETED** - Using 2x assets directly
- `src/components/StockWaste.jsx` - Centered stacking, z-index fixes
- `src/styles/App.css` - background-size for @2x, relative asset paths
- `src/App.jsx` - Simplified asset loading (removed useHighDPIAssets hook)

**Assets Required (User Provided):**
- `cardspritesheet@2x.png` (2080×1120px) [x]
- `mm-gameboard@2x.png` (2560×1440px) [x]

---

### Design System Overhaul (v2.0.0) - 2026-01-24 - COMPLETE

**Objective:** Complete redesign with new color palette, comprehensive design tokens, and full-bleed tabbed interfaces.

**Design Token System:**
- Expanded `tokens.css` with 8 color categories and opacity variants (10%, 20%, 30%, 50%)
- Typography scale: 10px → 48px (8 sizes)
- Spacing scale: 0 → 64px (11 values, 8px base)
- Border radius options (xs through 2xl, pill, round)
- Shadow system (6 elevations + inset + glows)
- Icon sizes, transition speeds, z-index scale

**New Color Palette:**
- Primary blue felt: #1720c3 (dark), #1922d5 (light)
- Gold accent: #c9a050 (ace columns, UP foundations)
- Silver accent: #7d92a1 (king columns, DOWN foundations)
- Semantic colors: success, warning, danger
- Neutral grayscale (50-900)

**Full-Bleed Tabbed Interfaces:**
- RulesModal: 5 tabs (Goal, Columns, Controls, Modes, Tips)
- StatsModal: 3 tabs (Overview, Records, By Mode) + persistent footer
- CampaignScreen: 3 tier tabs (Bronze, Silver, Gold) with 2×5 level grid

**Component Refactoring:**
- ConfirmDialog: Refactored to CSS modules with folder structure
- StatsModal: Refactored to CSS modules with folder structure
- LevelCard: Updated to use design tokens
- App.css: Full migration to design token system

**Breaking Changes:**
- Color palette changed from green (#003c00) to blue (#1720c3)
- All modals now full-bleed with no scrolling
- Campaign screen navigation changed to tier tabs

---

### Responsive Layout Redesign - 2026-01-23 - COMPLETE

**Objective:** Replace fixed 1280×720 layout with fluid, viewport-responsive design.

**Problem Statement:**
- Current layout uses fixed pixel dimensions with `transform: scale()`
- Causes cropping on small screens, touch target issues, coordinate mismatches
- Background sprite (1280×610) constrains flexibility

**Planning Completed:**
- [x] Audit current measurements and derive ratio model
- [x] Document all design assets and specifications
- [x] Define 5-phase implementation plan
- [x] Identify files requiring changes
- [x] Resolve key decisions (min viewport, header/footer fate, orientation)

**Phase 1: CSS Custom Properties (COMPLETE)**
- Consolidated all design tokens and measurements into `src/styles/App.css`
- Created CSS variables for: card dimensions, spacing, colors, typography, responsive breakpoints
- All dimension calculations now driven by root-level CSS variables

**Phase 2: Responsive Dimensions Hook (COMPLETE)**
- Created `src/hooks/useResponsiveDimensions.js`
- Hook calculates all responsive measurements from viewport size
- Returns card width, card height, column gap, overlap, track height, padding
- Handles resize events and throttling for performance

**Phase 3: Components Refactored (COMPLETE)**
- `Foundation.jsx` updated to use 65% scaling (saves ~40px vertical space)
- `Column.jsx` refactored to use CSS variables for responsive dimensions
- `StockWaste.jsx` updated to use CSS variables
- `HomeScreen.module.css` updated to use CSS variables throughout
- All components now calculate dimensions from root CSS variables

**Phase 4: Layout Container (COMPLETE)**
- Eliminated header/footer chrome (110px reclaimed)
- Full-bleed game layout
- New components: OrientationBlocker, GameControls, GearButton, GameStats
- Gear icon opens settings menu
- Controls/stats row below bottom zone
- Foundations restored to 100% size
- Portrait orientation blocked

**Documents Created:**
- `docs/LAYOUT_AUDIT.md` - Measurements, ratios, responsive model, phase plan
- `docs/DESIGN_ASSETS.md` - Sprite specs, typography, colors, designer guide

**Key Insight:**
Everything derives from card width: `cardWidth = (viewportWidth - padding) / 8.5`
- Card height = cardWidth × 1.4
- Column gap = cardWidth × 0.25
- Overlap = cardWidth × 0.2
- Track height = cardWidth × 3.875

**Foundation Optimization:**
Reducing foundation cards to 65% size saves ~40px vertical space while remaining functional.

---

### Touch Drag Improvements - 2026-01-23 - COMPLETE

**Objective:** Fix inconsistent touch interactions (laggy start, disappearing targets).

**Changes:**
- Reduced long-press delay from 150ms to 100ms
- Added 10px movement threshold (prevents accidental cancel)
- Added detection for `.empty-column-zone` elements
- Added detection for card elements as drop targets
- Improved cleanup of refs in all handlers

**Files Modified:**
- `src/hooks/useTouchDrag.js`

---

### Pause Screen - 2026-01-23 - COMPLETE

**Objective:** Add in-game pause functionality with overlay, timer pause/resume, and quick access to Home/New Game.

**Progress:**
- [x] Create `PauseOverlay` component with CSS Module
- [x] Add pause button to Header (next to Undo/Redo)
- [x] Update `useGameStats` with `pauseTimer`, `resumeTimer`, `isPaused`
- [x] Update `App.jsx` with pause state and handlers
- [x] Escape key toggles pause
- [x] Click outside overlay to resume
- [x] Test and verify build

**Files Created:**
- `src/components/PauseOverlay/PauseOverlay.jsx` - Pause overlay with stats display
- `src/components/PauseOverlay/PauseOverlay.module.css` - Overlay styles with animations
- `src/components/PauseOverlay/index.js` - Clean export

**Files Modified:**
- `src/components/Header.jsx` - Added `onPause` and `showPauseButton` props
- `src/hooks/useGameStats.js` - Added `pauseTimer`, `resumeTimer`, `isPaused` for timer control
- `src/App.jsx` - Added pause state, handlers, keyboard shortcut, PauseOverlay render

**Features:**
- Pause button appears in header when game is active (moves > 0, not game over)
- Semi-transparent overlay over game board
- In-game stats displayed: Mode, Moves, Time, Progress (foundation cards)
- Progress bar showing completion percentage
- Resume button (primary action)
- Home button (returns to home screen)
- New Game button (with confirmation if needed)
- Escape key toggles pause on/off
- Click outside content area to resume
- Timer correctly pauses and resumes (accumulated time preserved)

---

### Campaign Mode - 2026-01-22 - COMPLETE

**Objective:** Add a progressive campaign mode with 30 levels across 3 difficulty tiers, with badges and per-level analytics.

**Progress:**
- [x] Create `useCampaignProgress` hook for localStorage persistence
- [x] Create `LevelCard` component for level tiles
- [x] Create `CampaignScreen` component with tier sections and badges
- [x] Update `HomeScreen` with Quick Play / Campaign buttons
- [x] Update `App.jsx` for campaign flow integration
- [x] Test and verify build

**Files Created:**
- `src/hooks/useCampaignProgress.js` - Campaign progress hook with localStorage, level tracking, tier/badge logic
- `src/components/LevelCard/LevelCard.jsx` - Level tile component with locked/unlocked/completed states
- `src/components/LevelCard/LevelCard.module.css` - Styled level cards with animations
- `src/components/LevelCard/index.js` - Clean export
- `src/components/CampaignScreen/CampaignScreen.jsx` - Campaign level select with tier badges
- `src/components/CampaignScreen/CampaignScreen.module.css` - Campaign screen styles
- `src/components/CampaignScreen/index.js` - Clean export

**Files Modified:**
- `src/components/HomeScreen/HomeScreen.jsx` - Added Quick Play / Campaign options, campaign progress display
- `src/components/HomeScreen/HomeScreen.module.css` - New layout for play options
- `src/App.jsx` - Campaign state, handlers, game-over integration for campaign levels
- `src/styles/App.css` - Campaign level indicator in game-over overlay

**Features:**
- 30 progressive levels (Easy 1-10, Moderate 11-20, Hard 21-30)
- Locked progression - complete level to unlock next
- Per-level analytics: best moves, best time, attempts
- Tier badges (Bronze/Silver/Gold) for completing each tier
- Campaign complete badge for finishing all 30 levels
- "Next Level" button on win for seamless progression
- "Back to Campaign" option at any time
- Progress persisted to localStorage
- Version bumped to 1.3.0

**Technical Details:**
- Campaign uses existing snapshots: `classic_normal_easy_01` through `classic_normal_hard_10`
- Campaign progress separate from Quick Play stats
- Game completion records both Quick Play stats AND campaign level completion

---

### Pause & Continue Behavior - 2026-01-22 - COMPLETE

**Objective:** Allow pausing games by going Home, with option to continue or forfeit.

**Progress:**
- [x] Add forfeit tracking to useGameStats hook
- [x] Add paused game state logic to App.jsx
- [x] Add Continue Game button to HomeScreen
- [x] Update StatsModal to display forfeits
- [x] Test and verify build

**Files Modified:**
- `src/hooks/useGameStats.js` - Added `forfeits` to stats, `recordForfeit()` function
- `src/App.jsx` - Added `hasGameInProgress`, `handleContinueGame`, `handleNewGameFromHome`
- `src/components/HomeScreen/HomeScreen.jsx` - Continue button, conditional UI based on game state
- `src/components/StatsModal.jsx` - Display forfeits in overall and per-mode stats

**Result:**
- Going Home pauses game (no penalty, no warning)
- "Continue Game" shown when game in progress
- "New Game (forfeit current)" clearly indicates consequence
- Mode selector hidden when game paused (only affects new games)
- Forfeits tracked separately, break win streaks
- Build passes successfully

---

### Home Screen - 2026-01-22 - COMPLETE

**Objective:** Add a proper landing page with mode selector, play button, and rules modal.

**Progress:**
- [x] Create `HomeScreen/` component with CSS Module
- [x] Create `RulesModal/` component for How to Play
- [x] Add `showHomeScreen` state to App.jsx
- [x] Add Home menu item to GameMenu
- [x] Test and verify build

**Files Created:**
- `src/components/HomeScreen/HomeScreen.jsx` - Landing page with mode selector
- `src/components/HomeScreen/HomeScreen.module.css` - Styled home screen with animations
- `src/components/HomeScreen/index.js` - Clean export
- `src/components/RulesModal/RulesModal.jsx` - How to Play modal with game rules
- `src/components/RulesModal/RulesModal.module.css` - Modal styles
- `src/components/RulesModal/index.js` - Clean export

**Files Modified:**
- `src/App.jsx` - Added showHomeScreen, rulesModalOpen states, handlers, HomeScreen + RulesModal render
- `src/components/Header.jsx` - Added onGoHome prop
- `src/components/GameMenu/GameMenu.jsx` - Added Home menu item

**Result:**
- App now shows HomeScreen on initial load
- Mode selector on home screen
- "Play Game" starts game with fade-out animation
- "How to Play" opens rules modal with full game instructions
- "Statistics" opens existing stats modal
- "Home" in hamburger menu returns to home screen
- Build passes successfully

---

### Header Reorganization & Menu System - 2026-01-22 - COMPLETE

**Objective:** Consolidate 10+ header elements into a clean layout with hamburger menu.

**Target Layout:**
```
┌──────────────────────────────────────────────────────────────────────┐
│  MERIDIAN              Moves: 47  ⏱ 2:34      [↶] [↷]      [☰]      │
│  Master Solitaire                                                    │
└──────────────────────────────────────────────────────────────────────┘
```

**Progress:**
- [x] Create `GameMenu/` component with CSS Module
- [x] Create `MenuItem/` component for menu items
- [x] Simplify Header.jsx layout
- [x] Add menu state to App.jsx
- [x] Add click-outside-to-close behavior
- [x] Test and verify build

**Files Created:**
- `src/components/GameMenu/GameMenu.jsx` - Hamburger menu with dropdown
- `src/components/GameMenu/GameMenu.module.css` - Menu styles with animations
- `src/components/GameMenu/index.js` - Clean export
- `src/components/MenuItem/MenuItem.jsx` - Reusable menu item with submenu support
- `src/components/MenuItem/MenuItem.module.css` - Menu item styles
- `src/components/MenuItem/index.js` - Clean export

**Files Modified:**
- `src/components/Header.jsx` - Simplified from 127 to 113 lines, new 3-section layout
- `src/App.jsx` - Added menu state (isMenuOpen) and handlers
- `src/styles/App.css` - Added header-center, header-right classes

**Result:**
- Header now shows: Brand | Stats | Undo/Redo | Menu
- 6 elements moved to hamburger menu: New Game, Mode Selector, Stats, Style Toggle, Snapshots
- Click-outside and Escape key close the menu
- Animated hamburger → X transition
- Build passes successfully

---

### CSS Architecture Refactoring (Phase 1) - 2026-01-22 - COMPLETE

**Objective:** Establish a clean, maintainable CSS architecture using CSS Modules and design tokens before building new UI features (Header Menu, Home Screen).

**Files Created:**
- `src/styles/tokens.css` - 100+ design tokens (colors, spacing, typography, borders, effects)
- `src/components/Button/Button.jsx` - Reusable button with 6 variants, 3 sizes, icon support
- `src/components/Button/Button.module.css` - Scoped button styles
- `src/components/Button/index.js` - Clean export
- `src/components/Select/Select.jsx` - Reusable dropdown with 3 variants
- `src/components/Select/Select.module.css` - Scoped select styles
- `src/components/Select/index.js` - Clean export

**Files Modified:**
- `src/styles/App.css` - Added tokens import, header-left, header-stat, header-badge classes
- `src/components/Header.jsx` - Refactored from 238 lines with inline styles to 127 lines using components

**Result:**
- Header.jsx reduced by ~47% (111 lines removed)
- Zero inline styles in Header.jsx (was 13+ style={{}} blocks)
- Hover effects now via CSS :hover (was DOM manipulation via onMouseEnter/onMouseLeave)
- Build passes successfully

---

## Completed Work

### Version 1.1.0 (2026-01-19)

#### Game Mode Selector & Random Deals

**New Features:**

1. **Game Mode Selector**
   - Dropdown in header to select game mode: Classic, Classic Double, Hidden, Hidden Double
   - Modes switch automatically on selection (with confirmation if game in progress)

2. **New Game Button**
   - "New Game" button in header starts a random deal in the selected mode
   - Fisher-Yates shuffle algorithm for true randomization

3. **Random Deal Generator** (`src/utils/dealGenerator.js`)
   - `generateRandomDeal(mode)` - Creates random game states for any mode
   - `getGameModes()` - Returns available game mode configurations
   - `getModeConfig(mode)` - Returns configuration for a specific mode
   - Proper face-down card handling for Hidden/Hidden Double modes
   - Column type assignment based on bottom face-up card (only column 0 on initial deal)

4. **Confirmation Dialog** (`src/components/ConfirmDialog.jsx`)
   - Modal dialog for mid-game confirmations
   - Triggers when switching modes, loading snapshots, or starting new game (if moves > 0)
   - Keyboard support: Enter to confirm, Escape to cancel
   - Visual variants: default, warning, danger

5. **Load Game State Hook**
   - `loadGameState(gameStateData)` in `useCardGame` hook
   - Allows loading generated deals (not just snapshot IDs)

**Bug Fixes:**

1. **Face-Down Card Reveal Column Typing** (`src/utils/gameLogic.js:flipRevealedCard`)
   - When a face-down card is revealed and it's an Ace or King, the column type now correctly updates
   - Previously only updated `faceDownCounts` but not `columnState.types`

2. **Traditional Column Stacking Bug** (Fixed in previous session)
   - Traditional columns now only allow descending stacks (5 on 6, not 7 on 6)
   - Previously allowed both directions due to `Math.abs(diff) === 1` logic

3. **Initial Deal Column Typing**
   - On initial deal, only column 0 gets typed based on its card
   - All other columns start as 'traditional' until cards are moved

**UI Changes:**

- Removed all emojis from the codebase
- Header: "Fun Style" / "Classic Style" instead of emoji icons
- Game Over Overlay: "VICTORY" / "GAME OVER" text instead of emojis

---

### Portal Animation System (2026-01-19)

**Visual Effects for Empty Column Interactions:**

1. **Portal Element** (`src/components/Column.jsx`)
   - Renders a circular portal in empty columns
   - Shows "A / K" hint text when idle
   - Shows "DROP" text when valid card is being dragged

2. **Portal States** (`src/styles/App.css`)
   - **Idle State**: Subtle pulse animation with soft glow
   - **Active State**: Vortex animation with pull effect when valid King/Ace is dragged
   - **Flash Effect**: Brief white flash after card is slurped

3. **Card Animations**
   - **Slurp Animation** (250ms): Card shrinks and rotates 135° as it's "sucked" into portal
   - **Pop Animation** (300ms): Card appears at final position with spring bounce effect

4. **Ace Reveal Animation**
   - When face-down Ace is revealed and column becomes ace-typed
   - 400ms pause to let player see the reveal
   - Ace slurps (200ms) at current position
   - Ace pops (300ms) at bottom position (where Aces belong in ace columns)

**Technical Implementation:**

- `animatingCard` state in `useCardGame.js` tracks current animation
- Animation info returned from `flipRevealedCard()` via `_animationInfo` property
- `Column.jsx` detects when empty column receives card and triggers pop animation
- CSS keyframes: `portal-idle-pulse`, `portal-active-vortex`, `card-slurp`, `card-pop`, `ace-relocate-slurp`, `ace-pop-bottom`

---

## File Changes Summary

### New Files
- `src/utils/dealGenerator.js` - Random deal generation
- `src/components/ConfirmDialog.jsx` - Confirmation modal
- `docs/PROGRESS.md` - This progress document

### Modified Files
- `src/styles/App.css` - Portal animations and keyframes
- `src/components/Column.jsx` - Portal element, animation state handling
- `src/components/Card.jsx` - className prop for animation classes
- `src/components/GameStage.jsx` - animatingCard prop passing
- `src/components/Header.jsx` - Mode selector, New Game button
- `src/App.jsx` - Mode selection, confirmations, animatingCard integration
- `src/hooks/useCardGame.js` - loadGameState, animatingCard state, animation timing
- `src/utils/gameLogic.js` - flipRevealedCard animation info return, executeMove animation tracking
- `src/utils/cardUtils.js` - Emoji removal from console logs
- `src/hooks/useDragDrop.js` - Emoji removal
- `src/hooks/useNotification.jsx` - Emoji removal
- `CHANGELOG.md` - Version 1.1.0 documentation

---

## Architecture Notes

### Column Type System
- **Ace Columns**: Cards stack from bottom up (A→2→3→4→5→6)
- **King Columns**: Cards stack from top down (K→Q→J→10→9→8→7)
- **Traditional Columns**: Cards stack descending only (not both directions)
- **Empty Columns**: Accept only Kings (become King columns) or Aces (become Ace columns)

### Animation Flow
1. User drags King/Ace to empty column
2. Portal shows active state during drag
3. On drop, card appears at correct position with pop animation
4. For Ace reveals: pause → slurp → pop at bottom

### State Management
- Game state managed via `useCardGame` hook
- Undo system preserves full state history
- Animation state is separate from game state (UI-only concern)

---

## Archived Planning (Historical)

*The following section is preserved from earlier development phases. These features have been implemented or reprioritized.*

### Version 2.1.0 (Historical Plan - Implemented)
- ~~Hint system~~ [x] Implemented in v2.3.0
- ~~Auto-complete detection~~ [x] Implemented in v2.3.0
- Sound effects [Task] Still planned

### Version 2.2.0 (Historical Plan - Implemented)
- ~~Deep Blue Theme~~ [x] Implemented in v2.2.0
- ~~Multi-theme architecture~~ [x] Implemented in v2.2.0
- ~~Responsive scaling~~ [x] Implemented in v2.1.0
- Achievements [Task] Still planned
- Daily challenges [Task] Still planned

### Version 3.0.0 (Future)
- Leaderboards [Task] Planned
- Progressive web app (PWA) [Task] Planned

---

## Current Priorities

See [BACKLOG.md](./BACKLOG.md) for active work items and technical debt.

---

## Testing Notes

### Manual Test Cases

1. **Portal Animation - King Drop**
   - Start new game with empty column
   - Drag King to empty column
   - Verify: Portal shows active state, card pops at top position

2. **Portal Animation - Ace Drop**
   - Start new game with empty column
   - Drag Ace to empty column
   - Verify: Portal shows active state, card pops at bottom position

3. **Ace Reveal Animation**
   - Play Hidden/Hidden Double mode
   - Remove cards to reveal face-down Ace
   - Verify: 400ms pause, slurp animation, pop at bottom

4. **Mode Switching**
   - Start game, make some moves
   - Switch mode via dropdown
   - Verify: Confirmation dialog appears
   - Confirm: New random deal in selected mode

5. **New Game Button**
   - Start game, make some moves
   - Click "New Game"
   - Verify: Confirmation dialog appears
   - Confirm: New random deal starts

---

## Known Issues

- CSS warnings for camelCase properties in some older CSS rules (cosmetic, not functional)
- Portal animation may briefly show on initial load (edge case)

---

*Last Updated: 2026-01-29 (Documentation System Added)*

---

## Summary of Recent Changes

### Completed: Documentation System Overhaul
- **Created `docs/viewer.html`** - Universal Markdown documentation browser
  - Searchable navigation across all documentation
  - Print-friendly styling (generate PDFs)
  - Syntax-highlighted code blocks
  - Mobile-responsive design
  - Works offline (no build step required)
  
- **Created `docs/PLAYER_GUIDE.md`** - Comprehensive player documentation
  - Complete game rules and mechanics
  - Strategy guide (beginner to advanced)
  - All game modes explained
  - Campaign mode walkthrough
  - FAQ and glossary
  
- **Created `docs/TECHNICAL_GUIDE.md`** - Developer reference
  - Architecture overview and patterns
  - Game engine deep dive
  - Animation system documentation
  - State management patterns
  - Extension points for contributors
  
- **Updated cross-references** - All docs now link to viewer and new guides
  - `docs/README.md` - Added viewer and guide links
  - `README.md` - Added documentation section
  - `CLAUDE.md` - Updated related documents

### Completed: 2x-Only Asset Simplification
- Deleted `src/hooks/useHighDPIAssets.js` (dynamic asset selection no longer needed)
- Updated `src/styles/App.css` with simplified 2x asset paths
- Updated `src/App.jsx` to load 2x assets directly
- All asset-related sections in this document updated to reflect the simplification
