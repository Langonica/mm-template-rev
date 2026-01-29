# Changelog

All notable changes to Meridian Solitaire are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.2.1] - 2026-01-28

### Critical Bug Fix: Column Typing in Hidden Modes

Fixed column type calculation bug affecting `hidden` and `hidden_double` game modes where columns would incorrectly switch type based on face-down cards.

#### Fixed

- **Column Typing Logic** (`gameLogic.js`)
  - `updateColumnType()` now correctly uses `column[faceDownCount]` instead of `column[0]`
  - Properly calculates face-up card count: `faceUpCount = column.length - faceDownCount`
  - Type now determined by first visible (face-up) card, not physical bottom card
  - Fixed premature type switching when moving cards from columns

#### Bug Details

**Affected Modes:** `hidden`, `hidden_double`
**Severity:** High - Gameplay impact in hidden modes
**Root Cause:** Hardcoded `column[0]` reference ignored face-down card state

**Before:**
```javascript
const card = parseCard(column[0]); // Wrong: reads face-down card
```

**After:**
```javascript
const faceDownCount = state.columnState?.faceDownCounts?.[columnIndex] || 0;
const card = parseCard(column[faceDownCount]); // Correct: reads first face-up
```

---

## [2.2.0] - 2026-01-28

### Deep Blue Casino Theme & Multi-Theme Architecture

Complete visual redesign with deep blue casino aesthetic, cyan accents, and a future-proof theme system.

#### Added

- **Blue Casino Theme** (Default)
  - Deep royal blue background (#0D1B2A)
  - Cyan accent color (#00D4FF) for buttons, badges, highlights
  - Light blue vs deep blue track distinction (luminance-based)
  - Success states: Cyan with subtle green tint
  - White cards unchanged (sacred content)
  
- **Multi-Theme Architecture**
  - ThemeContext provider for runtime theme switching
  - useTheme hook for theme access in components
  - useThemeStyles hook for CSS variable references
  - Theme constants: blue-casino (default)
  - CSS custom properties with fallbacks
  - localStorage persistence for theme preference
  
- **Theme Specification Document**
  - docs/THEME_SPEC_v2.2.md with complete design rationale
  - Color palette with hex, RGB, contrast ratios
  - Component-by-component color mapping
  - Accessibility compliance notes
  - Future theme roadmap (Green Classic, Crimson Night)

- **New Theme Files**
  - `src/styles/themes/blue-casino.css` - Complete theme definition
  - 80+ CSS variables for comprehensive theming
  
- **Semantic Token Layer**
  - Added semantic tokens to `tokens.css`
  - Maps theme constants to component-agnostic names
  - Backward compatible with fallbacks

#### Changed

- **Background**: Dark green/black → Deep royal blue (#0D1B2A)
- **Primary Accent**: Gold (#c9a050) → Cyan (#00D4FF)
- **Success States**: Green → Cyan with green tint
- **Win Animations**: Gold particles → Cyan particles
- **Ace Columns**: Gold tint → Light blue tint
- **King Columns**: Silver tint → Deep blue tint
- **Modals**: Dark grey → Deep blue panels
- **Buttons**: Blue/Teal → Cyan primary
- **Count Badges**: Blue/Purple → Cyan

#### Technical

- New: `ThemeProvider` wraps entire app
- New: `src/styles/themes/` directory structure
- New: `src/contexts/ThemeContext.jsx`
- New: `src/hooks/useTheme.js`
- Theme CSS loaded before App.css for cascade priority
- All components now theme-aware via CSS variables

---

## [2.0.0] - 2026-01-24

### Design System Overhaul

Complete redesign with new color palette, comprehensive design tokens, and full-bleed tabbed interfaces.

#### Added

- **Design Token System** (`tokens.css`)
  - 8 color categories with opacity variants (10%, 20%, 30%, 50%)
  - Typography scale: 10px → 48px (8 sizes)
  - Spacing scale: 0 → 64px (11 values, 8px base)
  - Border radius options (xs through 2xl, pill, round)
  - Shadow system (6 elevations + inset + glows)
  - Icon sizes (xs through 2xl)
  - Transition speeds and timing functions
  - Z-index scale (8 levels)

- **New Color Palette**
  - Primary blue felt: #1720c3 (dark), #1922d5 (light)
  - Gold accent: #c9a050 (ace columns, UP foundations)
  - Silver accent: #7d92a1 (king columns, DOWN foundations)
  - Semantic colors: success, warning, danger
  - Neutral grayscale (50-900)

- **Full-Bleed Tabbed Interfaces**
  - RulesModal: 5 tabs (Goal, Columns, Controls, Modes, Tips)
  - StatsModal: 3 tabs (Overview, Records, By Mode) + persistent footer
  - CampaignScreen: 3 tier tabs (Bronze, Silver, Gold) with 2×5 level grid

- **Project Guidelines** (CLAUDE.md)
  - Commit & release practices
  - Model delegation for efficient development

#### Changed

- **App.css**: Full migration to design token system
- **ConfirmDialog**: Refactored to CSS modules with folder structure
- **StatsModal**: Refactored to CSS modules with folder structure
- **LevelCard**: Updated to use design tokens
- **CampaignScreen**: Horizontal tier tabs instead of vertical scroll
- **RulesModal**: Tabbed content instead of scrolling sections

#### Breaking Changes

- Color palette changed from green (#003c00) to blue (#1720c3)
- All modals now full-bleed with no scrolling
- Campaign screen navigation changed to tier tabs

---

## [1.4.0] - 2026-01-23

### Pause Screen

Added in-game pause functionality with timer control and quick navigation.

#### Added

- **Pause Button**
  - Appears in header next to Undo/Redo when game is active
  - Only shown when moves > 0 and game not over

- **Pause Overlay**
  - Semi-transparent overlay over game board
  - Displays current game stats: Mode, Moves, Time, Progress
  - Visual progress bar showing foundation completion percentage
  - Resume, Home, and New Game buttons
  - Click outside to resume
  - Escape key toggles pause

- **Timer Pause/Resume**
  - Timer correctly pauses and resumes
  - Accumulated time preserved across pause sessions
  - `pauseTimer()` and `resumeTimer()` functions in useGameStats

#### Technical

- New component: `src/components/PauseOverlay/`
- Updated: `src/components/Header.jsx` - pause button props
- Updated: `src/hooks/useGameStats.js` - pause/resume timer logic
- Updated: `src/App.jsx` - pause state, handlers, keyboard shortcuts

---

## [1.3.0] - 2026-01-22

### Campaign Mode, Home Screen, and UI Overhaul

Major update with campaign mode, proper landing page, and complete header reorganization.

#### Added

- **Campaign Mode**
  - 30 progressive levels across 3 difficulty tiers (Bronze/Silver/Gold)
  - Locked progression - complete level to unlock next
  - Per-level analytics: best moves, best time, attempts
  - Tier badges for completing each tier
  - Campaign complete badge for finishing all 30 levels
  - "Next Level" button on win for seamless progression

- **Home Screen**
  - Landing page with Quick Play and Campaign options
  - Mode selector for Quick Play
  - How to Play rules modal
  - Statistics access
  - Continue Game button when game is paused

- **Header Reorganization**
  - Hamburger menu containing: New Game, Mode Selector, Stats, Style Toggle, Snapshots
  - Clean layout: Brand | Stats | Undo/Redo | Menu
  - Animated hamburger to X transition

- **Pause & Continue**
  - Go Home pauses game without penalty
  - Continue Game resumes paused games
  - Forfeit tracking for abandoned games

- **CSS Architecture**
  - Design tokens in `tokens.css`
  - Reusable Button and Select components
  - CSS Modules for component scoping

- **Dynamic Viewport Scaling**
  - `useViewportScale` hook for responsive sizing
  - Game fits within viewport without cropping
  - Handles both width and height constraints

#### Changed

- **Game Mode Names**
  - "Double Pocket" → "Classic Double"
  - "Traditional" → "Hidden"
  - "Expert" → "Hidden Double" (now with 2 pockets)

#### Technical

- New hooks: `useCampaignProgress`, `useViewportScale`
- New components: `HomeScreen`, `RulesModal`, `CampaignScreen`, `LevelCard`, `GameMenu`, `MenuItem`, `Button`, `Select`
- Stats backwards compatibility for old mode names

---

## [1.1.0] - 2026-01-19

### Game Mode Selector & Random Deals

This release adds the ability to play random deals in any of the four game modes, plus several bug fixes and code cleanup.

#### Added

- **Game Mode Selector**
  - Dropdown in header to select game mode: Classic, Double Pocket, Traditional, Expert
  - Modes switch automatically on selection (with confirmation if game in progress)

- **New Game Button**
  - "New Game" button in header starts a random deal in the selected mode
  - Fisher-Yates shuffle algorithm for true randomization

- **Random Deal Generator** (`src/utils/dealGenerator.js`)
  - `generateRandomDeal(mode)` - Creates random game states for any mode
  - `getGameModes()` - Returns available game mode configurations
  - `getModeConfig(mode)` - Returns configuration for a specific mode
  - Proper face-down card handling for Traditional/Expert modes
  - Column type assignment based on bottom face-up card

- **Confirmation Dialog** (`src/components/ConfirmDialog.jsx`)
  - Modal dialog for mid-game confirmations
  - Triggers when switching modes, loading snapshots, or starting new game (if moves > 0)
  - Keyboard support: Enter to confirm, Escape to cancel
  - Visual variants: default, warning, danger

- **Load Game State Hook**
  - `loadGameState(gameStateData)` in `useCardGame` hook
  - Allows loading generated deals (not just snapshot IDs)

#### Fixed

- **Face-Down Card Reveal Column Typing** (`src/utils/gameLogic.js:flipRevealedCard`)
  - When a face-down card is revealed and it's an Ace or King, the column type now correctly updates
  - Previously only updated `faceDownCounts` but not `columnState.types`

- **Traditional Column Stacking Bug** (Fixed in previous session)
  - Traditional columns now only allow descending stacks (5 on 6, not 7 on 6)
  - Previously allowed both directions due to `Math.abs(diff) === 1` logic

#### Changed

- **Header Component**
  - Added mode selector dropdown
  - Added "New Game" button
  - Removed emojis from style toggle ("Fun Style" / "Classic Style" instead of emoji icons)
  - Removed emoji from touch mode indicator

- **Game Over Overlay**
  - Changed emoji icons to text ("VICTORY" / "GAME OVER")
  - "Play Again" button now starts a new random game instead of reloading the same snapshot

#### Removed

- **All Emojis from Codebase**
  - Removed from console.log statements throughout
  - Removed from notification messages
  - Removed from UI text
  - Removed from changelog legend

#### Technical

- New file: `src/utils/dealGenerator.js`
- New file: `src/components/ConfirmDialog.jsx`
- Updated: `src/components/Header.jsx`
- Updated: `src/App.jsx`
- Updated: `src/hooks/useCardGame.js`
- Updated: `src/utils/gameLogic.js`
- Updated: `src/utils/cardUtils.js`
- Updated: `src/components/Card.jsx`
- Updated: `src/components/Column.jsx`
- Updated: `src/hooks/useDragDrop.js`
- Updated: `src/hooks/useNotification.jsx`
- Updated: `src/hooks/useNotification.js`

---

## [1.0.0] - 2026-01-16

### Initial Release - Complete Implementation

This is the first complete, production-ready release of Meridian Solitaire with all core features implemented.

---

## Phase 5: Interactions & Polish

### Added
- **Undo/Redo System**
  - Full move history (100 moves)
  - Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Y/Ctrl+Shift+Z (redo)
  - Visual buttons in header with enable/disable states
  - Tracks all moves: drags, draws, waste recycling, auto-moves
  - Efficient state management with deep cloning

- **Touch/Mobile Support**
  - Long-press (150ms) to initiate drag
  - Visual ghost element during drag
  - Drop target detection
  - Haptic feedback (vibration) on supported devices
  - Optimized touch targets (44x44px minimum)
  - Auto-detection of touch capability
  - iOS and Android compatibility

- **Notification System**
  - Toast-style notifications with 4 types (success, error, info, warning)
  - Auto-dismiss after 3 seconds (configurable)
  - Manual dismiss option
  - Smooth slide-down animation
  - Non-blocking UI
  - Color-coded feedback

- **Edge Case Handling**
  - Empty stock with empty waste
  - Undo/redo at history boundaries
  - Touch interruption (calls, notifications)
  - Rapid successive moves
  - Invalid drop attempts
  - Missing/corrupted game state

- **UX Polish**
  - Move counter in header
  - Undo/redo button visual states
  - Touch device indicator
  - First-time touch hint
  - Keyboard shortcut support
  - Loading states

### Changed
- Updated `useCardGame.js` to integrate undo, touch, and notifications
- Enhanced `Card.jsx` with touch event handlers
- Improved `Header.jsx` with undo/redo controls and move counter
- Updated `App.jsx` with notification system and keyboard shortcuts

### Technical
- New hooks: `useUndo`, `useTouchDrag`, `useNotification`
- Added CSS animations for notifications and undo/redo
- Improved error handling throughout
- Cross-platform keyboard shortcut support

---

## Phase 4: Advanced Drag Features

### Added
- **Multi-Card Sequence Dragging**
  - Unlimited sequence length (if valid)
  - Automatic sequence validation
  - Visual indicator for sequence count
  - Proper z-index handling

- **Column Type Validation**
  - Ace columns: Ascending only (A→2→3→4→5→6)
  - King columns: Descending only (K→Q→J→10→9→8→7)
  - Traditional columns: Flexible direction
  - Empty column rules (Ace or King only)

- **Foundation Move Validation**
  - UP foundations: 7→8→9→10→J→Q→K
  - DOWN foundations: 6→5→4→3→2→A
  - Suit matching enforcement
  - **Cards CAN be dragged FROM foundations**

### Technical
- Enhanced validation in `gameLogic.js`
- Improved sequence detection in `cardUtils.js`

---

## Phase 3: Core Drag System

### Added
- **Drag & Drop Implementation**
  - HTML5 Drag & Drop API
  - Mouse-based drag for desktop
  - Visual feedback for valid/invalid targets
  - Smooth animations

- **Drop Target System**
  - Tableau columns
  - Foundation slots (both UP and DOWN)
  - Pocket slots (1 or 2 depending on mode)
  - Empty column detection

- **Move Validation**
  - Color alternation checks
  - Sequence validation
  - Foundation placement rules
  - Pocket availability checks
  - Column type restrictions

- **Double-Click Auto-Move**
  - Auto-send cards to foundation when valid
  - Works from any source (waste, pocket, tableau, foundation)
  - Smart foundation selection (UP vs DOWN)

### Technical
- New hooks: `useDragDrop`
- New utility: `gameLogic.js` for move execution
- Enhanced `cardUtils.js` with validation helpers

---

## Phase 2: Visual Polish

### Added
- **Stock/Waste Animations**
  - Stock draw animation
  - Waste recycle animation
  - Card count badges
  - Depth indicators

- **Hover Effects**
  - Card lift on hover
  - Scale effect (1.05x)
  - Smooth transitions
  - Z-index management

- **Drop Target Feedback**
  - Green glow pulse on valid targets
  - Border highlighting
  - Scale effects
  - Smooth color transitions

- **Success/Failure Animations**
  - Success flash (green)
  - Failure shake (red)
  - Drop success pulse
  - Bounce-back animation

### Technical
- Added CSS animations and keyframes
- GPU-accelerated transforms
- Optimized transition timing

---

## Phase 1: Stock/Waste Foundation

### Added
- **Empty Stock Visual**
  - Recycle indicator (♻️) when waste has cards
  - Empty state outline
  - Click to recycle functionality
  - Visual feedback

- **Card Count Badges**
  - Stock pile count
  - Waste pile count
  - Foundation pile counts
  - Color-coded badges

- **Depth Layers**
  - Visual stack depth for stock
  - Visual stack depth for waste
  - Improved 3D appearance
  - Subtle rotation in fun mode

- **Card Conversion Helpers**
  - Simple string to Card object conversion
  - Unique ID generation
  - Numeric value calculation
  - Color determination

### Changed
- Enhanced `StockWaste.jsx` with visual improvements
- Extended `cardUtils.js` with conversion functions
- Improved depth layer calculations

---

## Initial Implementation

### Added
- **Core Game Engine**
  - 52-card deck support
  - Dual foundation system (UP: 7→K, DOWN: 6→A)
  - 7 tableau columns
  - Stock and waste piles
  - Pocket support (1 or 2)

- **Game Modes**
  - Classic (1 pocket)
  - Double Pocket (2 pockets)
  - Traditional
  - Expert

- **Snapshot System**
  - 24 pre-loaded puzzles
  - 3 difficulty levels (Easy, Moderate, Hard)
  - JSON-based storage
  - Schema v2.0 with analysis data

- **Visual Styles**
  - Classic mode (straight cards)
  - Fun mode (rotated cards)
  - Card sprite sheet rendering
  - Responsive layout

- **Components**
  - Card rendering
  - Column display with types
  - Foundation piles
  - Stock/Waste/Pockets
  - Header with controls
  - Footer with metadata

### Technical
- React 18.3.1
- Vite 5.4.11
- CSS3 animations
- HTML5 canvas sprites

---

## [0.1.0] - Initial Prototype

### Added
- Basic card rendering
- Simple column layout
- Foundation slots
- Stock/waste mechanics
- Test snapshots

---

## Future Releases

### [1.5.0] - Planned
- Sound effects
- Hint system
- Auto-complete detection

### [2.0.0] - Planned
- Daily challenges
- Achievements
- Leaderboards
- Custom themes

### [3.0.0] - Planned
- Multiplayer mode
- Progressive web app (PWA)

---

## Version History Summary

| Version | Date | Highlights |
|---------|------|------------|
| 2.0.0 | 2026-01-24 | Design system overhaul, blue palette, full-bleed tabbed UI |
| 1.4.0 | 2026-01-23 | Pause screen with timer control |
| 1.3.0 | 2026-01-22 | Campaign mode, home screen, UI overhaul |
| 1.1.0 | 2026-01-19 | Game mode selector, random deals, emoji cleanup |
| 1.0.0 | 2026-01-16 | Complete release with all features |
| 0.1.0 | 2026-01-15 | Initial prototype |

---

## Notes

- All versions are tagged in git with format `vX.Y.Z`
- Breaking changes are documented with migration guides
- Performance improvements are tracked in benchmarks
- Security updates are released as patches

---

**Legend:**
- [MAJOR] Major release
- [FEATURE] New feature
- [FIX] Bug fix
- [DOCS] Documentation
- [REFACTOR] Refactor
- [PERF] Performance
- [SECURITY] Security
