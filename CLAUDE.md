# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Related Documents:**
- `PROCESS.md` - Development workflows, patterns, and skills
- `README.md` - User-facing project overview
- `CHANGELOG.md` - Release history

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

Currently fixed game board (1280×720), scaled via `useViewportScale` hook. **Responsive redesign in progress** - see `docs/LAYOUT_AUDIT.md` for the ratio-based model and implementation phases.

### UI/UX Redesign (In Progress)

Major UI unification underway:
- `docs/UI_REDUX_MASTER_PLAN.md` - Comprehensive redesign specification
- `docs/UI_REDUX_PROGRESS.md` - Implementation tracking
- Phase 0 complete: Removed `isFun` feature
- Phase 1 in progress: Component library foundation

Design tokens in `src/styles/tokens.css`. CSS Modules used for newer components. Asset specifications in `docs/DESIGN_ASSETS.md`.

### Drag & Drop

HTML5 Drag API for desktop, custom touch handling for mobile (100ms long-press, 10px movement threshold). Valid targets pre-calculated at drag start for performance.

## Technical Debt & Code Quality

**See `docs/CODE_AUDIT.md` for comprehensive audit findings.**

**Current Status:**
- ✅ **Phase 1 Complete (2026-01-28):** Performance fixes, Error Boundary, localStorage notifications
- ✅ **Phase 2 Complete (2026-01-28):** Debug cleanup, z-index consolidation
- ⏳ **Phase 3 Queued:** Style migration, file organization

**v2.3.0 Game State Analyzer Status:**
- ✅ **Phase 1 Complete:** State fingerprinting, `GameStateTracker` class
- ✅ **Phase 2 Complete:** Circular play detection with 4 warning levels
- ✅ **Phase 3 Complete:** StalemateModal with stats and actions
- ✅ **Phase 4 Complete:** Auto-complete detection (`canAutoComplete`, `hasBlockedSequences`)
- ✅ **Phase 5 Complete:** Auto-complete execution UI (`AutoCompleteButton`, sequential animations)
- ✅ **Phase 6 Complete:** Hint system (`HintButton`, `HintDisplay`, keyboard shortcut)

**Recently Fixed:**
- ✅ `Column.jsx` - Replaced `getComputedStyle` with module constants + useMemo
- ✅ `useCardGame.js` / `useUndo.js` - Optimized deep cloning with `structuredClone()`
- ✅ `App.jsx` - Reduced useEffect dependencies (10 → 6)
- ✅ `useGameStats.js` / `useCampaignProgress.js` - Added error notifications
- ✅ `main.jsx` - Added Error Boundary wrapper

**When modifying code:**
- Check CODE_AUDIT.md for context on existing issues
- Avoid adding new console.logs (use proper error handling)
- Prefer CSS modules over inline styles
- Follow z-index token scale (`--z-*` variables)

## Model Selection

**Use the right-sized model for each task.** Delegate to agents when appropriate:

| Task Type | Model | Examples |
|-----------|-------|----------|
| Architecture, complex debugging | Opus | Layout planning, mysterious bugs, trade-off analysis |
| Feature implementation, refactoring | Sonnet | Component updates, hook creation, standard fixes |
| Simple edits, searches, docs | Haiku | CSS variable swaps, find/replace, PROGRESS.md updates |

See `docs/MODEL_SELECTION.md` for detailed guidance.

## Commit & Release Practices

- Proactively suggest commits when meaningful work is complete (features, bug fixes, refactors)
- Don't let changes accumulate too long - commit at natural breakpoints
- For major milestones, suggest creating a GitHub Release with:
  - Semantic version tag (vMAJOR.MINOR.PATCH)
  - Release notes summarizing changes
- Maintain CHANGELOG.md with version history

## Model Delegation (IMPORTANT)
- Always delegate to lighter models when possible
- Haiku: CSS edits, docs, searches, simple file changes
- Sonnet: Feature implementation, refactors, component updates
- Opus: Architecture, complex debugging, planning only

## Conventions

- Components: PascalCase (`Card.jsx`, `GameStage.jsx`)
- Hooks: `use` prefix (`useCardGame`, `useDragDrop`)
- Constants: UPPER_SNAKE_CASE (`CARD_MAP`, `SUIT_MAP`)
- State updates: Always immutable (deep clone before modify)
- No emojis in UI or code (removed per project requirement)
