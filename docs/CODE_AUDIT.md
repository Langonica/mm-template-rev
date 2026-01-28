# Comprehensive Code Audit - Meridian Master

**Audit Date:** 2026-01-28  
**Auditor:** Kimi (AI Assistant)  
**Scope:** Full codebase review - performance, security, code quality, architecture

---

## Executive Summary

This audit covers the entire Meridian Master React codebase following the v2.1.0 release (large viewport scaling). The codebase is functional and well-structured but has accumulated technical debt in several areas:

### 🔴 Critical Issues (Immediate Action Required)
1. **Performance**: `getComputedStyle` called in render loop causing layout thrashing
2. **Performance**: Deep cloning on every game move (JSON.parse/stringify)
3. **Error Handling**: No React Error Boundaries - crashes result in white screen
4. **Error Handling**: localStorage failures are silent - user data lost without warning

### 🟡 High Priority (Significant Impact)
5. **Debugging**: ~30 console.log statements creating noise in production
6. **Components**: Heavy inline styles in StockWaste.jsx (15 blocks) need componentization
7. **Architecture**: Duplicate `useNotification` files (`.js` and `.jsx`)
8. **CSS**: Z-index chaos (values 110-15000) with collision risks

### 🟢 Medium/Low Priority (Cleanup)
9. Unused imports and variables throughout
10. 8 loose component files not following folder pattern
11. Missing localStorage schema validation
12. No test suite present

---

## Phase 1: Critical Fixes (Performance & Error Handling)

### 1.1 Performance Issues

#### 🔴 CRITICAL: Layout Thrashing in Column.jsx
**Location:** `src/components/Column.jsx:256-273`
```javascript
// PROBLEM: getComputedStyle called in render for every card
const trackHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--track-h'));
const cardHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--card-h'));
```
**Impact:** Forces synchronous layout recalculation for every card in Ace columns  
**Solution:** Use CSS custom properties directly or memoize values

#### 🔴 CRITICAL: Deep Cloning on Every Move
**Location:** `src/hooks/useCardGame.js:151`, `src/hooks/useUndo.js:26`
```javascript
// PROBLEM: Expensive deep clone on EVERY move
const newHistory = [...history, JSON.parse(JSON.stringify(gameState))];
```
**Impact:** O(n) operation grows with state size, causes jank during drag-drop  
**Solution:** Use structural sharing or immer for immutable updates

#### 🔴 CRITICAL: Excessive useEffect Dependencies
**Location:** `src/App.jsx:403-427`
```javascript
// PROBLEM: 9 dependencies including nested object properties
useEffect(() => {
  // Game end handling
}, [gameStatus, moveCount, selectedMode, recordGameEnd, 
    stats.bestWinMoves, stats.bestWinTime, stats.wins, 
    currentCampaignLevel, recordCampaignCompletion]);
```
**Impact:** Effect re-runs on every stat change  
**Solution:** Use individual stat refs or split into smaller effects

### 1.2 Error Handling Issues

#### 🔴 CRITICAL: No Error Boundaries
**Location:** `src/main.jsx`
```javascript
// PROBLEM: No error boundary wrapping
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```
**Impact:** Any unhandled error = white screen of death  
**Solution:** Add Error Boundary component (see Quick Fix below)

#### 🔴 CRITICAL: Silent localStorage Failures
**Location:** `src/hooks/useGameStats.js:34-37`, `src/hooks/useCampaignProgress.js:59-62`
```javascript
// PROBLEM: Failures logged to console only, user unaware
try {
  const saved = localStorage.getItem(KEY);
  return saved ? JSON.parse(saved) : defaultValue;
} catch (e) {
  console.error('Failed to load:', e);  // User never sees this
  return defaultValue;
}
```
**Impact:** User loses progress without warning  
**Solution:** Add user-facing notification for storage failures

### Quick Fix: Error Boundary
```jsx
// src/components/ErrorBoundary.jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Game error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <div className="error-fallback">Something went wrong. Please refresh.</div>;
    }
    return this.props.children;
  }
}
```

---

## Phase 2: High Priority (Debug Cleanup & Component Refactoring)

### 2.1 Debugging Code to Remove

#### useDragDrop.js (19 lines)
**Lines:** 21-23, 29, 31, 34, 38, 40, 43, 45, 47, 50, 60, 81, 85, 91, 93, 96, 99, 103  
**Type:** Verbose drag-drop flow logging, performance timing  
**Action:** Remove all except error warnings

#### useHighDPIAssets.js (6 lines)
**Lines:** 56-63, 68-69  
**Type:** Asset loading diagnostics  
**Action:** Remove or wrap in `import.meta.env.DEV` check

#### Card.jsx (5 lines)
**Lines:** 83-84, 87, 119, 189  
**Type:** Drag event logging  
**Action:** Remove

#### Foundation.jsx, Column.jsx, main.jsx
**Lines:** Various single-line logs  
**Action:** Remove

### 2.2 Component Refactoring

#### Create Reusable CountBadge Component
**Current:** Nearly identical badge code in StockWaste.jsx (lines 199-217 and 302-320)
```javascript
// Stock badge - blue
style={{ background: 'rgba(33, 150, 243, 0.9)', ... }}

// Waste badge - purple  
style={{ background: 'rgba(156, 39, 176, 0.9)', ... }}
```
**Solution:** `<CountBadge count={n} variant="stock|waste|foundation" />`

#### Delete Duplicate File
**Location:** `src/hooks/useNotification.js` and `src/hooks/useNotification.jsx`  
**Status:** Identical 211-line files  
**Action:** Delete `.js` version, keep `.jsx`

### 2.3 CSS Architecture Issues

#### Z-Index Chaos
**Current Scale:** 110, 200-196, 210, 220, 300-296, 310, 320, 1000, 2000, 3000, 3001, 5000, 6000, 9998, 9999, 10000, 15000

**Collisions at 9999-10000:**
- `.loading-overlay`: 9999
- `.keyboard-hint`: 9999
- `.win-overlay`: 10000
- `.game-over-overlay`: 10000
- `.orientation-blocker`: 10000

**Recommended Scale:**
```css
--z-game: 100;
--z-cards: 200;
--z-foundations: 300;
--z-stock-waste: 400;
--z-modals: 500;
--z-overlays: 600;
--z-notifications: 700;
--z-tooltips: 800;
```

---

## Phase 3: Polish (Styles, Organization, Validation)

### 3.1 Inline Style Migration

| Component | Inline Blocks | Action |
|-----------|--------------|--------|
| StockWaste.jsx | 15 | Extract to CSS module |
| Foundation.jsx | 8 | Extract to CSS module |
| Column.jsx | 7 | Extract portal styles |
| SnapshotSelector.jsx | 8 | Extract form styles |
| Footer.jsx | 5 | Extract text styles |

### 3.2 File Organization

**Loose Components (should be foldered):**
- Card.jsx
- Column.jsx
- Footer.jsx
- Foundation.jsx
- GameStage.jsx
- Header.jsx
- SnapshotSelector.jsx
- StockWaste.jsx

**Standardize on:** `ComponentName/ComponentName.jsx` + `ComponentName.module.css`

### 3.3 Dead Code Removal

#### Unused Imports (7)
- `Column.jsx:1` - `useRef`
- `Header.jsx:4` - `SnapshotSelector`
- `SnapshotSelector.jsx:1-7` - `getSnapshotDescription`
- `useCardGame.js:3` - `useDragDrop`
- `gameLogic.js:5,7` - `isCardAccessible`, `isValidSequence`

#### Unused Variables (5)
- `App.jsx:98` - `responsiveDimensions`
- `Column.jsx:27` - `prevCardsLengthRef`
- `SnapshotSelector.jsx:28` - `currentSnapshotName`
- `validateSnapshots.js:282` - `wasteCount`

### 3.4 Security Improvements

#### localStorage Schema Validation
**Current:** Parse without validation
```javascript
const data = JSON.parse(localStorage.getItem(KEY));
```

**Recommended:** Add schema check
```javascript
const saved = localStorage.getItem(KEY);
if (!saved) return defaultValue;

try {
  const parsed = JSON.parse(saved);
  if (validateStatsSchema(parsed)) {
    return parsed;
  }
} catch (e) {
  console.error('Corrupted stats data');
}
return defaultValue;
```

---

## Appendix A: Performance Detailed Findings

### UseEffect Dependency Issues
| File | Line | Issue |
|------|------|-------|
| App.jsx | 403-427 | 9 dependencies, excessive re-runs |
| App.jsx | 346-378 | 7 dependencies in keyboard effect |
| Column.jsx | 31-54 | Cards dependency causes animation re-run |
| RulesModal.jsx | 16-44 | Three effects with onClose function ref |

### Inline Object/Array Creation in JSX
| File | Lines | Pattern |
|------|-------|---------|
| App.jsx | 483 | `modeOptions={getGameModes().map(...)}` |
| App.jsx | 524+ | Game over inline styles |
| GameStage.jsx | 105-123 | Column props with filtered data |
| Header.jsx | 71-101 | Button icon creates new element |
| StockWaste.jsx | 88-296 | Extensive inline styles |

### Missing useCallback/useMemo
| File | Lines | Function/Value |
|------|-------|----------------|
| App.jsx | 313-343 | Handler functions passed to GameStage |
| Card.jsx | 62-80 | Mouse enter/leave handlers |
| Card.jsx | 82-130 | Drag start/end handlers |
| Foundation.jsx | 98-99 | Inline arrow function in loop |

---

## Appendix B: Security Detailed Findings

### localStorage Operations
| File | Read | Write | Validation |
|------|------|-------|------------|
| useGameStats.js | ✅ try-catch | ✅ | ⚠️ None |
| useCampaignProgress.js | ✅ try-catch | ✅ | ⚠️ None |
| App.jsx | ⚠️ No try-catch | ⚠️ Hardcoded | N/A |

### XSS Risk Assessment
| Vector | Status | Notes |
|--------|--------|-------|
| innerHTML/dangerouslySetInnerHTML | ✅ None | React JSX only |
| eval()/new Function() | ✅ None | Not used |
| setTimeout with strings | ✅ None | Numeric delays only |
| Card string rendering | ✅ Safe | Regex validated, CSS sprites |
| Drag & drop data | ✅ Safe | Validated through parseCard() |

---

## Appendix C: File Organization Status

### Components (23 total)
**Foldered (15):** Button, CampaignScreen, ConfirmDialog, GameControls, GameMenu, GameStats, GearButton, HomeScreen, LevelCard, MenuItem, OrientationBlocker, PauseOverlay, RulesModal, Select, StatsModal

**Loose (8):** Card, Column, Footer, Foundation, GameStage, Header, SnapshotSelector, StockWaste

### Hooks (11)
All properly named with `use` prefix ✅

### Utils (6)
All camelCase ✅

### Tests
**Status:** None found ❌

---

## Recommended Action Timeline

| Phase | Tasks | Est. Time | Priority |
|-------|-------|-----------|----------|
| Phase 1 | Error boundary, fix getComputedStyle, optimize useEffect | 2-3 hours | 🔴 Critical |
| Phase 2 | Remove console.logs, create CountBadge, delete duplicate | 3-4 hours | 🟡 High |
| Phase 3 | Folder loose components, extract styles, add validation | 4-6 hours | 🟢 Medium |

---

*Document Version: 1.0*  
*Last Updated: 2026-01-28*  
*Related: PROGRESS.md (v2.1.0 work), BACKLOG.md (cleanup tasks)*
