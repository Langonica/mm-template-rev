# Backlog & Technical Debt

A living document tracking deferred improvements, technical debt, and items to revisit when time permits.

---

## In Progress

---

## Queued (Ready to Implement)

---

### Stabilization & Hardening - Phase 2b (v2.3.2)
**Priority:** 🟡 High | **Complexity:** Medium | **Added:** 2026-01-29

**Phase 2a:** ✅ COMPLETE - Telemetry and configurable thresholds implemented
**Phase 2c:** ✅ COMPLETE - False positive fix (strategic cycling detection)

**Phase 2b: Game State Detection Hardening**
- Add "ignore this game" option for edge cases
- Harden solver against timeout edge cases
- Add detection failure recovery (don't crash game)

**Status:** Ready to implement when testing reveals edge cases

---

### CSS Inline Style Migration (Deferred)
**Priority:** 🟢 Low | **Complexity:** Medium | **Added:** 2026-01-28

**Context:** ~53 inline style blocks remain across 12 files. These work correctly but should eventually be migrated to CSS modules for consistency.

**Files with most inline styles:**
- StockWaste.jsx (15 blocks)
- Foundation.jsx (8 blocks)
- Column.jsx (7 blocks)

**Note:** This is cosmetic cleanup - no functional impact. Can be done incrementally when touching those files for features.

---

## Animation Refinements

### ~~Auto-Complete Animation Sequence~~
**Resolved:** 2026-01-28 | Implemented Phase 1 with 3-phase animation (departing/moving/arriving). Cards visibly move from source to foundation with gold glow effects. Win screen delays 500ms after sequence completes.

### ~~Arc Motion for Double-Click Autoplay~~
**Resolved:** 2026-01-28 | Implemented Phase 2 with arc trajectory animation. Phases: lifting (100ms) → flying with ghost trails (300ms) → landing with bounce (200ms). Source flash effect on departing location.

### Portal Animation for Card Stacks
**Status:** 📋 ARCHIVED - Deferred to post-launch  
**Priority:** Low | **Added:** 2026-01-20

**Context:** Portal slurp/pop animation only works for single cards. Multi-card sequence animation would be nice but not critical for launch.

**Archived Plan:** See `docs/archive/reference/ANIMATION_IMPROVEMENTS_PLAN.md`

**Note:** Current animation works fine, just skips for multi-card moves. Can revisit after launch.

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

### ~~GSN False Positive Fix - Strategic Cycling Detection~~
**Resolved:** 2026-01-29 | Fixed false "unproductive play" warnings when players cycling stock near endgame to find winning cards. Added "strategic cycling" check to `GameStateTracker.analyzeProductivity()`: when <10 cards remain and player draws/recycles, move is considered productive. Prevents warnings during legitimate endgame strategies.

### ~~Asset Path Fix for Production Builds~~
**Resolved:** 2026-01-29 | Fixed image assets not loading in production builds. Asset paths were relative but needed the Vite base URL (`/meridian-master/`). Updated `useHighDPIAssets.js` to use `import.meta.env.BASE_URL` and updated CSS fallback paths in `App.css`.

### ~~Game State Notification Bug Fix (v2.3.1)~~
**Resolved:** 2026-01-29 | Fixed toast dismiss loop where notification would immediately reopen after user dismissed it. Root cause: useEffect re-triggered when `gameStateToastOpen` changed but tier was still elevated. Fix: Added `dismissedNotificationTier` suppression state that prevents re-triggering until tier escalates or resets. Also removed redundant action button from toast and raised hint threshold from 2 to 3 cycles.

### ~~Animation Phase 1: Auto-Complete Sequence~~
**Resolved:** 2026-01-28 | New `autoCompleteAnimation` state with sequential card movement. Three phases: departing (200ms) with source lift, moving (300ms) with state update, arriving (200ms) with foundation glow. Win screen delays 500ms to show final state. Foundation and Column components updated with visual effects.

### ~~Animation Phase 2: Arc Motion for Regular Autoplay~~
**Resolved:** 2026-01-28 | Replaced slurp/pop with 3-phase arc animation. Total duration 600ms (faster than previous 700ms). Lifting phase scales card up; flying phase includes 3 ghost trails with staggered fade; landing phase has bounce effect. Source vacancy flash on column/waste/pocket. Gold glow on destination foundation. CSS includes prefers-reduced-motion support.

### ~~UI Redux: Full-Bleed Screens~~
**Resolved:** 2026-01-28 | Moved all full-bleed screens inside game-container for proper CSS transform scaling. Updated FullBleedScreen with optional headers. Removed obsolete headers/footers, restored back buttons. Removed borders from containers. Updated HowToPlay, Statistics, Campaign, Home screens. Deleted deprecated RulesModal and StatsModal components.

### ~~Code Audit - Phase 2: Debug Cleanup & Component Refactoring~~
**Resolved:** 2026-01-28 | Completed console.log cleanup and z-index consolidation. Removed ~20 debug console.log statements from validateSnapshots.js (wrapped in DEBUG flag) and useHighDPIAssets.js. Consolidated 11 hardcoded z-index values to use CSS custom properties from tokens.css. Mappings: 110 → calc(), 600 → --z-drag-ghost, 9999/10000 → --z-overlay, 1000 → calc(var(--z-portal) + 300). All z-index values now use design tokens as single source of truth.

### ~~Extended Autoplay System~~
**Resolved:** 2026-01-28 | Extended double-click autoplay from foundation-only to include tableau moves. Renamed `tryAutoMoveToFoundation()` → `tryAutoMove()` in gameLogic.js. Added `findOptimalTableauMove()` with scoring system that prefers longer sequences and Ace/King columns. Priority order: Foundation → Tableau build → Empty column. Updated useCardGame.js to handle tableau move animations and record move destination type for undo history.

### ~~Game State Analyzer & Smart Detection System (v2.3.0)~~
**Resolved:** 2026-01-29 | All 6 phases complete. Phase 1: State fingerprinting (`GameStateTracker`, `getStateFingerprint()`). Phase 2: Circular play detection with 4-tier warning system (none→hint→concern→warning→confirmed). Phase 3: StalemateModal with stats and actions. Phase 4: Auto-complete detection (`canAutoComplete()`, `hasBlockedSequences()`). Phase 5: Auto-complete execution UI with sequential animations. Phase 6: Hint system with 3 hints/game, keyboard shortcut (H), priority ranking. **Note:** Toast dismiss loop bug discovered post-completion, tracked separately as v2.3.1.

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

*Last Updated: 2026-01-29* | *v2.3.1 in progress: Notification bug fix*
