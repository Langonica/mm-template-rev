# Backlog & Technical Debt

A living document tracking deferred improvements, technical debt, and items to revisit when time permits.

---

## In Progress

### Game State Analyzer & Smart Detection System
**Priority:** 🔴 High | **Complexity:** High | **Added:** 2026-01-28 | **Status:** Phase 2 Complete, Phase 3 Ready

**Goal:** Detect stalemates, circular play, and offer auto-complete for trivially winnable games.

**Six-Phase Implementation:**

**Phase 1: State Fingerprinting** ✅ COMPLETE
- ✅ Create `GameStateTracker` class
- ✅ Implement `getStateFingerprint()` - hash board state
- ✅ Track state history (fingerprint → visit count)
- ✅ Track moves without progress

**Phase 2: Circular Play Detection** ✅ COMPLETE
- ✅ Detect 3+ identical states = circular play
- ✅ Count stock/waste cycles
- ✅ 20 moves without foundation progress = warning
- ✅ Visual indicators in GameStats
- ✅ Warning levels: caution, critical, stalled

**Phase 3: Stalemate UX Modal** 🛑 IN PROGRESS
- Create `StalemateModal` component
- Stats display (moves, time, foundation cards)
- Action buttons: [New Deal] [Restart] [Undo]

**Phase 2: Circular Play Detection** 🔄
- Detect 3+ identical states = circular play
- Count stock/waste cycles
- 20 moves without foundation progress = warning

**Phase 3: Stalemate UX Modal** 🛑
- `StalemateModal` component
- Stats display (moves, time, cards on foundation)
- Actions: [New Deal] [Restart] [Undo]

**Phase 4: Auto-Complete Detection** ✨
- Conditions: stock/waste/pockets empty + all face-up + no blocked sequences
- `canAutoComplete()` function
- Check after every move

**Phase 5: Auto-Complete Execution** ⚡
- "Auto-Complete" button appears when available
- Chain obvious moves with animation delays
- Record as single move for undo
- Cancel option

**Phase 6: Hint System Foundation** 💡
- Reuse move detection from Phase 1
- Show available moves count
- Highlight best move
- Explain why

**Files to Modify:**
- `src/utils/gameLogic.js` - Core detection logic
- `src/utils/cardUtils.js` - State fingerprinting
- `src/hooks/useCardGame.js` - Integration
- `src/components/` - StalemateModal, AutoComplete UI

**Status:** Ready to implement Phase 1

---

## Queued (Ready to Implement)

---

### Code Audit - Phase 3: Style Migration & Organization
**Priority:** 🟢 Medium | **Complexity:** Medium | **Added:** 2026-01-28

**Tasks:**
1. Folderize 8 loose components (Card, Column, Footer, Foundation, GameStage, Header, SnapshotSelector, StockWaste)
2. Extract inline styles to CSS modules (53 blocks across 12 files)
3. Remove unused imports and variables (12+ instances)
4. Add localStorage schema validation

---

## Animation Refinements

### Portal Animation for Card Stacks
**Priority:** Medium | **Complexity:** Medium | **Added:** 2026-01-20

**Current State:** Portal slurp/pop animation only works for single cards. When dragging a King with stacked cards to an empty column, the animation is skipped.

**Optimal Solution (Option A):**
- Track all moving cards in `slurpingCards` array (not just single card)
- Slurp the entire stack together (shrink/rotate as group)
- Pop each card sequentially with slight delay (cascade effect)
- Use `dragState.draggedCards` which already contains the full card array

**Technical Details:**
- `Column.jsx:handleDropEvent` - needs to capture all moving cards
- `Column.jsx:useEffect` for pop - needs to handle `cards.length > 1`
- Consider animating cards with staggered delays (50-100ms per card)

**Files to modify:**
- `src/components/Column.jsx`
- `src/styles/App.css` (possibly add cascade animation keyframes)

---

## Code Quality

### CSS camelCase Property Warnings
**Priority:** Low | **Complexity:** Low | **Added:** 2026-01-20

Build shows warnings for camelCase CSS properties (e.g., `borderRadius` vs `border-radius`). These are cosmetic and don't affect functionality, but should be cleaned up for consistency.

---

## Future Enhancements

*Items that aren't bugs or debt, but would be nice to have:*

### Hint System
- Highlight available moves when player is stuck
- Could pulse valid drop targets or show arrow indicators

### Auto-Complete Detection
- Detect when game is trivially winnable
- Offer to auto-complete remaining moves

### Sound Effects
- Card flip, drop, shuffle sounds
- Victory fanfare
- Optional mute toggle

---

## Completed Items

*Move items here when resolved, with date and brief note:*

### ~~Code Audit - Phase 2: Debug Cleanup & Component Refactoring~~
**Resolved:** 2026-01-28 | Completed console.log cleanup and z-index consolidation. Removed ~20 debug console.log statements from validateSnapshots.js (wrapped in DEBUG flag) and useHighDPIAssets.js. Consolidated 11 hardcoded z-index values to use CSS custom properties from tokens.css. Mappings: 110 → calc(), 600 → --z-drag-ghost, 9999/10000 → --z-overlay, 1000 → calc(var(--z-portal) + 300). All z-index values now use design tokens as single source of truth.

### ~~Extended Autoplay System~~
**Resolved:** 2026-01-28 | Extended double-click autoplay from foundation-only to include tableau moves. Renamed `tryAutoMoveToFoundation()` → `tryAutoMove()` in gameLogic.js. Added `findOptimalTableauMove()` with scoring system that prefers longer sequences and Ace/King columns. Priority order: Foundation → Tableau build → Empty column. Updated useCardGame.js to handle tableau move animations and record move destination type for undo history.

### ~~Critical Bug Fix: Column Typing in Hidden Modes~~
**Resolved:** 2026-01-28 | Fixed column type calculation bug in `hidden` and `hidden_double` modes. `updateColumnType()` was using `column[0]` (physical bottom card) instead of `column[faceDownCount]` (first face-up card). In hidden modes, the bottom card is often face-down, causing incorrect type assignment. Fix: Calculate `firstFaceUpIndex = faceDownCount`, determine type from that card. Type is 'ace'/'king' only when exactly 1 face-up card AND it's A/K. Also fixed `flipRevealedCard()` logic and reordered operations in `executeMove()` to ensure flip happens before type update.

### ~~Code Audit - Phase 1: Critical Performance & Error Handling~~
**Resolved:** 2026-01-28 | Fixed 4 critical issues: (1) Removed `getComputedStyle` from Column.jsx render loop - eliminated layout thrashing, (2) Created `deepClone()` utility using native `structuredClone()` with JSON fallback - ~2-3x faster deep cloning, (3) Reduced useEffect dependencies in App.jsx from 10 → 6 using statsRef pattern, (4) Added user-facing error notifications for localStorage failures via onError callbacks. All changes maintain backward compatibility.

### ~~Design System Overhaul (v2.0.0)~~
**Resolved:** 2026-01-24 | Complete redesign with new blue color palette (#1720c3), comprehensive design tokens, full-bleed tabbed interfaces. RulesModal (5 tabs), StatsModal (3 tabs), CampaignScreen (tier tabs). ConfirmDialog and StatsModal refactored to CSS modules. Breaking changes: color palette green→blue, modals full-bleed without scrolling.

### ~~Responsive Layout Redesign~~
**Resolved:** 2026-01-24 | All 5 phases complete. Phase 1: CSS custom properties. Phase 2: useResponsiveDimensions hook. Phase 3: Component refactor (Foundation 65% scaling). Phase 4: Full-bleed layout, eliminated header/footer chrome, gear icon settings, portrait blocker. Phase 5: Asset independence with CSS gradients.

### ~~Touch Drag Improvements~~
**Resolved:** 2026-01-23 | Reduced long-press delay (150ms→100ms). Added 10px movement threshold during long-press. Added detection for empty column zones and card elements as drop targets. Improved ref cleanup.

### ~~Dynamic Viewport Scaling~~
**Resolved:** 2026-01-23 | Created `useViewportScale` hook. Game scales to fit viewport without cropping. Removed 7 hardcoded media query breakpoints. Note: This is a stopgap; full responsive redesign planned.

### ~~Pause Screen~~
**Resolved:** 2026-01-23 | PauseOverlay component with in-game stats. Pause button in header. Timer pause/resume. Escape key toggle. Click-outside dismiss.

### ~~Campaign Mode~~
**Resolved:** 2026-01-22 | 30-level progressive campaign with 3 tiers (Bronze/Silver/Gold). Per-level analytics (best moves, best time, attempts). Tier completion badges. Locked progression. HomeScreen updated with Quick Play / Campaign options. Version 1.3.0.

### ~~Pause & Continue Behavior~~
**Resolved:** 2026-01-22 | Home pauses game (no penalty). "Continue Game" button when game paused. "New Game" forfeits current game. Forfeits tracked separately in stats, break win streaks.

### ~~Home Screen~~
**Resolved:** 2026-01-22 | Created HomeScreen and RulesModal components. Shows on initial load with mode selector, play button, and access to rules/stats. "Home" menu item returns to home screen.

### ~~Header Reorganization & Menu System~~
**Resolved:** 2026-01-22 | Created GameMenu and MenuItem components. Simplified header to 3-section layout (Brand | Stats | Actions+Menu). 6 elements moved to hamburger dropdown. Click-outside and Escape close behavior.

### ~~CSS Architecture Refactoring (Phase 1)~~
**Resolved:** 2026-01-22 | Created tokens.css, Button and Select components with CSS Modules. Refactored Header.jsx as proof of concept. Header reduced from 238 to 127 lines, eliminated all inline styles.

### ~~Responsive Scaling Enhancement (v2.1.0)~~
**Resolved:** 2026-01-28 | Removed 1.0× scale cap (now supports up to 2.0× / 2560×1440). Added `useHighDPIAssets` hook for automatic @2x asset selection based on viewport scale and DPR. Updated stock/waste pile visuals with centered stacking model. Assets: cardspritesheet@2x.png, mm-gameboard@2x.png.

---

*Last Updated: 2026-01-28* | *v2.1.0 released: Large viewport scaling and high-DPI asset support*
