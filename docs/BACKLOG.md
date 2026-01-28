# Backlog & Technical Debt

A living document tracking deferred improvements, technical debt, and items to revisit when time permits.

---

## In Progress

*No items currently in progress.*

---

## Queued (Ready to Implement)

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
