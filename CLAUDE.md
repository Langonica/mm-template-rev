# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Related Documents:**
- `PROCESS.md` - Development workflows, patterns, and skills
- `README.md` - User-facing project overview
- `CHANGELOG.md` - Release history
- `docs/viewer.html` - 📖 Universal documentation browser (open in browser)
- `docs/PLAYER_GUIDE.md` - 🎮 Complete player manual and strategy guide
- `docs/TECHNICAL_GUIDE.md` - ⚙️ Developer architecture and engine reference
- `docs/ACTIVE/` - Living documentation (Design System, Progress, Backlog)
- `docs/guides/` - Reference guides (Deployment, Assets)

## Build & Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server (localhost:5173)
npm run build        # Production build to dist/
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run validate     # Validate snapshot JSON files
```

## Architecture Overview

Meridian Solitaire is a card game with dual foundation systems (UP: 7→K, DOWN: 6→A), column typing mechanics, and multiple game modes. Built with React 18 + Vite, no external UI libraries.

### State Management Pattern

Game state flows through custom hooks, not Context API:

```
useCardGame (core game state)
    ├── useDragDrop (drag state, valid targets)
    ├── useUndo (100-move history)
    ├── useTouchDrag (mobile long-press drag)
    └── useGameStats (localStorage persistence)

App.jsx orchestrates all hooks and passes state down as props
```

**Key principle**: Each hook owns one concern. `useCardGame` is the single source of truth for game state.

### Data Flow

1. User interaction → Component handler
2. Handler calls `useCardGame` methods (e.g., `handleDrop`, `handleAutoMove`)
3. `gameLogic.js` validates and executes move
4. State updates immutably (deep clone)
5. Components re-render via props

### Card Representation

Cards are strings (`"Ah"`, `"10s"`, `"Kd"`) parsed to objects when needed:
```javascript
parseCard("Ah") → {v: 0, s: 2, value: "A", suit: "h", color: "red", numericValue: 1}
```

Locations are objects:
```javascript
{type: "tableau", column: 0}
{type: "foundation", zone: "up", suit: "h"}
{type: "pocket", pocketNum: 1}
{type: "waste"}
```

### Game State Structure

```javascript
{
  tableau: {"0": ["7c"], "1": ["2c", "6h"], ...},  // 7 columns
  stock: ["4c", "Js"],
  waste: ["9s"],
  pocket1: null,
  pocket2: null,
  foundations: {
    up: {h: [], d: [], c: [], s: []},   // 7→K
    down: {h: [], d: [], c: [], s: []}  // 6→A
  },
  columnState: {
    types: ["traditional", "ace", "king", ...],
    faceDownCounts: [0, 1, 2, ...]  // For hidden modes
  }
}
```

### Key Files

| File | Purpose |
|------|---------|
| `src/hooks/useCardGame.js` | Core game state, move execution, undo/redo integration |
| `src/hooks/useDragDrop.js` | Drag state, pre-calculates valid targets at drag start |
| `src/utils/gameLogic.js` | Move validation, execution, game status detection, **GameStateTracker** |
| `src/utils/cardUtils.js` | Card parsing, location finding, stacking rules |
| `src/utils/dealGenerator.js` | Random deal generation for game modes |
| `src/App.jsx` | Main orchestrator, connects all hooks and components |
| `src/components/StalemateModal/` | Stalemate detection UX with stats and actions |
| `src/components/AutoCompleteButton/` | Auto-complete button with executing state |
| `src/components/HintButton/` | Hint button with remaining count badge |
| `src/components/HintDisplay/` | Floating hint notification |

### Game State Analyzer (v2.3.0)

New system for detecting stalemates, circular play, and auto-complete opportunities.

**State Fingerprinting:**
```javascript
// Each move generates a compact state fingerprint
getStateFingerprint(gameState) → { tableauHash, stockTop, wasteTop, ... }
fingerprintToKey(fingerprint) → "Ah,2d;E;Kd,Qh...;|9s|null|..."  // String key for Map
```

**Circular Play Detection:**
- `GameStateTracker` class tracks state history in a Map
- Detects when player returns to same state 3+ times (circular play)
- Tracks moves without foundation progress (20+ = stalled)
- Four warning levels: `none` → `caution` → `critical` → `stalled`

**Auto-Complete Detection & Execution:**
```javascript
// Returns true when game is trivially winnable
canAutoComplete(gameState) {
  // 1. Stock, waste, pockets empty
  // 2. All tableau cards face-up
  // 3. No blocked sequences (7♠ on 8♥ blocks both)
}

// Find all available foundation moves
getAllFoundationMoves(gameState) → [{ card, from, to }, ...]

// Execute single foundation move
executeFoundationMove(gameState, move) → newState

// In useCardGame hook:
executeAutoComplete()  // Async, animates moves sequentially
cancelAutoComplete()   // Abort execution
isAutoCompleting       // Boolean state
```

**Hook Integration:**
```javascript
// useCardGame.js exposes:
circularPlayState: { warningLevel, cycleCount, movesSinceProgress, isCircular, isNoProgress }
stateTrackerStats: { maxFoundationCount, totalMovesTracked, uniqueStates }

// Auto-complete (Phase 5)
canAutoComplete: boolean       // true when auto-complete available
isAutoCompleting: boolean      // true while executing
executeAutoComplete()          // Start auto-complete (async)
cancelAutoComplete()           // Abort execution

// Hint system (Phase 6)
currentHint: { card, from, to, priority, reason }  // Current hint or null
hintsRemaining: number         // 0-3 hints left
showHint()                     // Show best available hint
clearHint()                    // Dismiss current hint
// Keyboard: Press 'H' to show hint
```

### Game Modes

- `classic` - 1 pocket, all face-up
- `classic_double` - 2 pockets, all face-up
- `hidden` - 1 pocket, some face-down
- `hidden_double` - 2 pockets, some face-down

### Column Types

Columns become typed when an Ace or King is placed:
- **Ace columns**: Stack upward (A→2→3→4→5→6)
- **King columns**: Stack downward (K→Q→J→10→9→8→7)
- **Traditional**: Descending only, alternating colors

### LocalStorage Keys

- `meridian_solitaire_stats` - Win/loss stats, streaks, best times
- `meridian-campaign-progress` - 30-level campaign progress

### CSS Architecture

Currently fixed game board (1280×720), scaled via `useViewportScale` hook. Design tokens in `src/styles/tokens.css`. See `docs/ACTIVE/DESIGN_TOKENS.md` for token reference.

**Asset Strategy (2x-Only):** The game uses a simplified 2x-only asset system. Only `@2x` high-resolution assets are provided (e.g., `cardspritesheet@2x.png`, `mm-gameboard@2x.png`), and CSS `background-size` scales them down for all display densities. This eliminates JavaScript asset selection logic and ensures crisp visuals via GPU downscaling. See `docs/guides/DESIGN_ASSETS.md` for specifications.

**Historical:** Layout audit research archived in `docs/archive/reference/LAYOUT_AUDIT.md`.

### UI/UX System

- **Design System:** `docs/ACTIVE/DESIGN_SYSTEM.md` - Principles, taxonomy, patterns
- **Design Tokens:** `docs/ACTIVE/DESIGN_TOKENS.md` - Colors, spacing, CSS variables
- **Snapshot Generator:** `docs/ACTIVE/SNAPSHOT_GENERATOR_PLAN.md` - Campaign level generation tool (Planning Phase)
- **Asset Specs:** `docs/guides/DESIGN_ASSETS.md` - Visual asset requirements (2x-only strategy with CSS background-size scaling)

**Historical:** UI Redux plans archived in `docs/archive/completed/UI_REDUX_2026/`.

**Icon System:** Centralized `Icon` component at `src/components/Icon/` exports all Lucide icons with consistent sizing. No emojis in UI.

### Drag & Drop

HTML5 Drag API for desktop, custom touch handling for mobile (100ms long-press, 10px movement threshold). Valid targets pre-calculated at drag start for performance.

## Technical Debt & Code Quality

**See `docs/ACTIVE/CODE_QUALITY.md` for current standards.**

**Historical audit:** `docs/archive/completed/CODE_AUDIT_HISTORY.md`

**Current Status:**
- ✅ **Phase 1-3 Complete:** Performance, cleanup, organization
- ✅ **Phase 4 Complete (2026-01-29):** Critical bug fixes (TDZ, ref mutation, missing deps)
- ✅ **Phase 5 Complete (2026-01-29):** Hook violations, unused variables (80→20 errors)

**v2.3.0 Game State Analyzer Status:**
- ✅ **Phase 1 Complete:** State fingerprinting, `GameStateTracker` class
- ✅ **Phase 2 Complete:** Circular play detection with 4 warning levels
- ✅ **Phase 3 Complete:** StalemateModal with stats and actions
- ✅ **Phase 4 Complete:** Auto-complete detection (`canAutoComplete`, `hasBlockedSequences`)
- ✅ **Phase 5 Complete:** Auto-complete execution UI (`AutoCompleteButton`, sequential animations)
- ✅ **Phase 6 Complete:** Hint system (`HintButton`, `HintDisplay`, keyboard shortcut)

**Recently Fixed (v2.3.0):**
- ✅ `GameStateToast.jsx` - Fixed TDZ bug (handleDismiss declaration order)
- ✅ `App.jsx` - Fixed ref mutation during render
- ✅ `useCardGame.js` - Fixed debug tools missing dependencies
- ✅ `Icon` component - Centralized icon exports from lucide-react
- ✅ Context files - Extracted constants for Fast Refresh compatibility
- ✅ ESLint errors - Reduced from 80 to 20 (75% reduction)

**When modifying code:**
- Check CODE_QUALITY.md for current standards
- Avoid adding new console.logs (use proper error handling)
- Prefer CSS modules over inline styles
- Follow z-index token scale (`--z-*` variables)
- Use `Icon` component for all icons (no emojis)

## Model Delegation (CRITICAL PRACTICE)

**Always delegate to the lightest model capable of the task.** This is a core practice, not a suggestion. Opus should only do work that requires Opus-level reasoning.

| Task Type | Model | When to Use |
|-----------|-------|-------------|
| **Haiku** | Simple | CSS edits, doc updates, searches, find/replace, PROGRESS.md, straightforward file changes |
| **Sonnet** | Standard | Feature implementation, refactoring, component updates, standard bug fixes, code generation |
| **Opus** | Complex | Architecture decisions, mysterious bugs, multi-system debugging, trade-off analysis, planning |

**Delegation workflow:**
1. Opus identifies the work needed (planning, diagnosis)
2. Opus delegates implementation tasks to Sonnet/Haiku via Task agents
3. Opus reviews results and handles any complex follow-up

**Examples of proper delegation:**
- Updating PROGRESS.md after completing work → **Haiku**
- Writing a new React component from a clear spec → **Sonnet**
- Fixing a CSS token value → **Haiku**
- Debugging why a useEffect causes infinite loops → **Opus**
- Implementing a bug fix once root cause is known → **Sonnet**

See `docs/guides/MODEL_SELECTION.md` for detailed guidance.

## Commit & Release Practices

- Proactively suggest commits when meaningful work is complete (features, bug fixes, refactors)
- Don't let changes accumulate too long - commit at natural breakpoints
- For major milestones, suggest creating a GitHub Release with:
  - Semantic version tag (vMAJOR.MINOR.PATCH)
  - Release notes summarizing changes
- Maintain CHANGELOG.md with version history

## Conventions

- Components: PascalCase (`Card.jsx`, `GameStage.jsx`)
- Hooks: `use` prefix (`useCardGame`, `useDragDrop`)
- Constants: UPPER_SNAKE_CASE (`CARD_MAP`, `SUIT_MAP`)
- State updates: Always immutable (deep clone before modify)
- No emojis in UI or code (removed per project requirement)
