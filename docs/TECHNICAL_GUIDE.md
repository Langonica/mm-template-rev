# Meridian Solitaire - Technical Guide

**Developer Reference & Architecture Documentation**

This guide provides comprehensive technical information for developers, contributors, and anyone interested in the architecture and implementation of Meridian Solitaire.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Game Engine](#game-engine)
4. [State Management](#state-management)
5. [Animation System](#animation-system)
6. [Input Handling](#input-handling)
7. [Rendering Pipeline](#rendering-pipeline)
8. [AI & Solver](#ai--solver)
9. [Build System](#build-system)
10. [Testing Strategy](#testing-strategy)
11. [Performance](#performance)
12. [Extension Points](#extension-points)
13. [Development Patterns](#development-patterns)

---

## Architecture Overview

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | React 18 | Component architecture, state management |
| **Build Tool** | Vite 5 | Fast development, optimized production builds |
| **Language** | JavaScript (ES2022) | Application logic |
| **Styling** | CSS Custom Properties | Design tokens, theming |
| **Animation** | CSS Transitions/Animations | Hardware-accelerated effects |
| **Storage** | localStorage | Game state persistence |

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Application (App.jsx)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Game State  │  │  UI State   │  │   Animation State   │  │
│  │  (Context)  │  │  (useState) │  │     (useState)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   Game Logic  │    │  Components   │    │   Hooks       │
│  (gameLogic.js)│    │  (JSX/CSS)    │    │  (Custom)     │
└───────────────┘    └───────────────┘    └───────────────┘
```

### Key Design Principles

1. **Separation of Concerns** - Game logic isolated from UI components
2. **Immutable State** - State updates always create new objects
3. **CSS-First Animation** - Hardware acceleration via transform/opacity
4. **Responsive by Design** - Viewport scaling, not media queries
5. **Accessibility** - Keyboard navigation, ARIA labels, reduced motion support

---

## Project Structure

```
meridian-solitaire/
├── src/
│   ├── components/           # React components
│   │   ├── Card/            # Card component with animations
│   │   ├── Column/          # Tableau column
│   │   ├── Foundation/      # Foundation piles
│   │   ├── StockWaste/      # Stock and waste piles
│   │   ├── GameStateToast/  # Notification system
│   │   └── ...              # Other UI components
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useCardGame.js   # Main game logic hook
│   │   ├── useViewportScale.js  # Responsive scaling
│   │   ├── useGSTelemetry.js    # Game state telemetry
│   │   └── ...
│   │
│   ├── utils/               # Utility functions
│   │   ├── gameLogic.js     # Core game engine
│   │   ├── animation/       # Animation utilities
│   │   └── ...
│   │
│   ├── styles/              # CSS files
│   │   ├── App.css          # Main application styles
│   │   ├── tokens.css       # Design tokens
│   │   └── ...
│   │
│   ├── contexts/            # React contexts
│   │   └── GameContext.js   # Game state context
│   │
│   ├── constants/           # Application constants
│   │   └── game.constants.js
│   │
│   └── App.jsx              # Root application component
│
├── docs/                    # Documentation
│   ├── ACTIVE/              # Living documents
│   ├── guides/              # Reference guides
│   ├── archive/             # Historical records
│   ├── PLAYER_GUIDE.md      # Player documentation
│   ├── TECHNICAL_GUIDE.md   # This document
│   └── viewer.html          # Documentation browser
│
├── public/                  # Static assets
│   └── assets/              # Images, sprites
│
└── [config files]          # vite.config.js, package.json, etc.
```

---

## Game Engine

### Core Module: `gameLogic.js`

The game engine is a pure JavaScript module with no React dependencies, making it:
- **Testable** - Unit test without mounting components
- **Portable** - Could be reused in other implementations
- **Predictable** - Pure functions with no side effects

### State Representation

```javascript
// Game state structure
{
  // Tableau: 8 columns of cards
  tableau: [
    [{ rank, suit, faceUp }, ...],  // Column 0
    [{ rank, suit, faceUp }, ...],  // Column 1
    // ... 6 more columns
  ],
  
  // Foundations: 4 suits building A→K
  foundations: {
    hearts: [/* cards */],
    diamonds: [/* cards */],
    clubs: [/* cards */],
    spades: [/* cards */]
  },
  
  // Stock and waste piles
  stock: [/* face-down cards */],
  waste: [/* face-up cards */],
  
  // Pocket storage (2 slots)
  pocket: [card | null, card | null],
  
  // Game metadata
  moves: 0,
  score: 0,
  startTime: timestamp,
  gameMode: 'classic' | 'hidden' | 'hidden_double'
}
```

### Card Representation

```javascript
{
  rank: 1-13,           // 1=Ace, 11=Jack, 12=Queen, 13=King
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades',
  faceUp: boolean       // Visibility state
}
```

### Key Operations

#### Move Validation
```javascript
// Check if a move is legal
function canPlaceOnTableau(card, targetCard) {
  // Must be descending rank
  if (card.rank !== targetCard.rank - 1) return false;
  
  // Must alternate colors
  if (isRed(card.suit) === isRed(targetCard.suit)) return false;
  
  return true;
}
```

#### Foundation Placement
```javascript
function canPlaceOnFoundation(card, foundationSuit, foundationPile) {
  // Must match suit
  if (card.suit !== foundationSuit) return false;
  
  // Empty foundation: must be Ace
  if (foundationPile.length === 0) return card.rank === 1;
  
  // Otherwise: must be next rank up
  const topCard = foundationPile[foundationPile.length - 1];
  return card.rank === topCard.rank + 1;
}
```

#### Move Execution
All moves go through `executeMove()` which:
1. Validates the move
2. Updates game state immutably
3. Records move for undo history
4. Checks for win conditions
5. Updates column types

### Game State Tracker

The `GameStateTracker` class monitors gameplay patterns:

```javascript
class GameStateTracker {
  // Detects unproductive play patterns
  analyzeProductivity(fingerprint, moveType)
  
  // Circular play detection (4-tier warning system)
  detectCircularPlay(currentFingerprint)
  
  // Stalemate detection
  detectStalemate(state)
  
  // Auto-complete detection
  canAutoComplete(state)
}
```

---

## State Management

### React Context Pattern

Game state uses React Context for global access:

```javascript
// GameContext.js
const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [gameState, setGameState] = useState(initialState);
  const gameStateRef = useRef(gameState);
  
  // Keep ref in sync for synchronous access
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  
  return (
    <GameContext.Provider value={{ gameState, setGameState, gameStateRef }}>
      {children}
    </GameContext.Provider>
  );
}
```

### Why useRef + useState?

The dual pattern (`useState` + `useRef`) solves a specific problem:

| Pattern | Use Case |
|---------|----------|
| `useState` | Triggers re-renders when state changes |
| `useRef` | Synchronous access in event handlers without closure staleness |

Example scenario:
```javascript
// Event handler needs current state
const handleClick = useCallback(() => {
  // gameStateRef.current is always fresh
  const canMove = checkMove(gameStateRef.current, ...);
}, []); // No dependency needed!
```

### State Persistence

```javascript
// Save game state
function saveGameState(state) {
  localStorage.setItem('meridian_game', JSON.stringify(state));
}

// Load game state
function loadGameState() {
  const saved = localStorage.getItem('meridian_game');
  return saved ? JSON.parse(saved) : null;
}
```

---

## Animation System

### Architecture

Meridian uses a **phase-based animation system**:

```javascript
// Animation phases
const ANIMATION_PHASES = {
  IDLE: 'idle',
  LIFTING: 'lifting',      // Card scales up
  MOVING: 'moving',        // Card travels
  LANDING: 'landing',      // Card settles
  ARRIVED: 'arrived'       // Animation complete
};
```

### Animation Types

| Type | Use Case | Duration |
|------|----------|----------|
| **Auto-play** | Double-click foundation moves | 600ms |
| **Auto-complete** | Win sequence | Staggered 200ms/card |
| **Drag** | User-initiated moves | Instant (no animation) |
| **Flip** | Card reveal | 300ms |

### CSS-First Approach

Animations use CSS for GPU acceleration:

```css
/* Card lift effect */
.card-lifting {
  animation: lift 100ms ease-out forwards;
}

@keyframes lift {
  from { transform: scale(1); }
  to { transform: scale(1.1); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
}

/* Arc movement */
.card-moving {
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### JavaScript Coordination

React state drives animation classes:

```javascript
function Card({ card, animationState }) {
  const className = classNames('card', {
    'card-lifting': animationState === 'lifting',
    'card-moving': animationState === 'moving',
    'card-landing': animationState === 'landing'
  });
  
  return <div className={className}>...</div>;
}
```

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  .card,
  .card-moving,
  .card-lifting {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## Input Handling

### Multi-Modal Input

Meridian supports mouse, touch, and keyboard:

```javascript
// Unified input handling
function handleInput(event) {
  switch (event.type) {
    case 'mousedown':
    case 'touchstart':
      return handleDragStart(event);
    case 'dblclick':
      return handleAutoPlay(event);
    case 'keydown':
      return handleKeyboard(event);
  }
}
```

### Drag and Drop

**Implementation:** Custom HTML5 drag API wrapper

```javascript
function useDragAndDrop() {
  const handleDragStart = (e, cardData) => {
    e.dataTransfer.setData('application/json', JSON.stringify(cardData));
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDrop = (e, targetColumn) => {
    const data = JSON.parse(e.dataTransfer.getData('application/json'));
    executeMove(data, targetColumn);
  };
  
  return { handleDragStart, handleDrop };
}
```

### Touch Optimization

- **Long-press detection:** 100ms threshold (faster than standard 500ms)
- **Movement threshold:** 10px before canceling long-press
- **Ghost element:** Visual feedback during drag

```javascript
const TOUCH_CONFIG = {
  longPressDelay: 100,
  movementThreshold: 10
};
```

### Keyboard Navigation

Full keyboard accessibility:
- `Tab` / `Shift+Tab` - Navigate between card groups
- `Arrow keys` - Select cards within group
- `Enter` / `Space` - Activate/Select
- `A` - Auto-play available moves
- `H` - Hint
- `Ctrl+Z` - Undo

---

## Rendering Pipeline

### Viewport Scaling

Instead of media queries, Meridian uses **dynamic viewport scaling**:

```javascript
function useViewportScale() {
  const [scale, setScale] = useState(1);
  
  useEffect(() => {
    const calculateScale = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Base game size: 1280x720
      const scaleX = viewportWidth / 1280;
      const scaleY = viewportHeight / 720;
      
      // Use smaller scale to fit entirely
      return Math.min(scaleX, scaleY);
    };
    
    setScale(calculateScale());
    window.addEventListener('resize', () => setScale(calculateScale()));
  }, []);
  
  return scale;
}
```

### CSS Transform Scaling

```jsx
function App() {
  const scale = useViewportScale();
  
  return (
    <div 
      className="game-container"
      style={{ transform: `scale(${scale})` }}
    >
      {/* Game content at base 1280x720 resolution */}
    </div>
  );
}
```

### 2x-Only Asset Strategy

```css
/* Only @2x assets loaded, CSS scales down */
.card {
  background-image: url('/assets/cardspritesheet@2x.png');
  background-size: 1040px 560px; /* Half of 2080x1120 */
}
```

**Benefits:**
- Simpler code (no asset selection logic)
- Consistent quality across all displays
- GPU handles downscaling efficiently

---

## AI & Solver

### Solver Algorithm

The solver uses **depth-first search with heuristics**:

```javascript
function solveGame(state, maxDepth = 1000) {
  const visited = new Set();
  const stack = [{ state, path: [] }];
  
  while (stack.length > 0) {
    const { state: current, path } = stack.pop();
    
    // Check win
    if (isWin(current)) return path;
    
    // Check depth
    if (path.length >= maxDepth) continue;
    
    // Check visited
    const fingerprint = getFingerprint(current);
    if (visited.has(fingerprint)) continue;
    visited.add(fingerprint);
    
    // Generate moves
    const moves = generateAllMoves(current);
    
    // Sort by heuristic (best first)
    moves.sort((a, b) => heuristic(b) - heuristic(a));
    
    // Add to stack
    for (const move of moves) {
      const newState = applyMove(current, move);
      stack.push({ state: newState, path: [...path, move] });
    }
  }
  
  return null; // No solution found
}
```

### Move Heuristics

Moves are ranked by priority:

| Priority | Move Type | Reasoning |
|----------|-----------|-----------|
| 100 | Foundation placement | Direct progress toward win |
| 90 | Reveal face-down card | Increases available moves |
| 80 | Create empty column | Maximum flexibility |
| 70 | Build long sequence | Preserves mobility |
| 60 | Move to tableau | Maintains options |

### Hint System

The hint system uses a simplified solver:

```javascript
function getHint(state) {
  // Look ahead 3 moves
  const solutions = solveGame(state, maxDepth = 3);
  
  if (solutions && solutions.length > 0) {
    return solutions[0]; // First move of best solution
  }
  
  return null; // No good move found
}
```

---

## Build System

### Vite Configuration

```javascript
// vite.config.js
export default {
  base: '/meridian-master/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  },
  server: {
    port: 5173,
    open: true
  }
};
```

### Build Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint code quality check |

### Production Deployment

1. Build: `npm run build`
2. Output in `dist/` directory
3. Deploy `dist/` contents to web server
4. Ensure `base` path matches deployment location

---

## Testing Strategy

### Unit Testing (Game Logic)

```javascript
// Example: Test move validation
describe('canPlaceOnTableau', () => {
  test('allows red 7 on black 8', () => {
    const card = { rank: 7, suit: 'hearts' };
    const target = { rank: 8, suit: 'spades' };
    expect(canPlaceOnTableau(card, target)).toBe(true);
  });
  
  test('rejects same color', () => {
    const card = { rank: 7, suit: 'hearts' };
    const target = { rank: 8, suit: 'diamonds' };
    expect(canPlaceOnTableau(card, target)).toBe(false);
  });
});
```

### Integration Testing

Test component interactions:
- Card drag from tableau to foundation
- Undo/redo flow
- Game state persistence

### Manual Testing Checklist

| Feature | Test Cases |
|---------|------------|
| Gameplay | All move types, win condition, scoring |
| UI | Responsive scaling, animations, accessibility |
| Persistence | Save/load, statistics, campaign progress |
| Edge Cases | Empty piles, full foundations, stock recycling |

---

## Performance

### Optimization Strategies

#### 1. Memoization

```javascript
const MemoizedCard = memo(function Card({ card, ...props }) {
  // Only re-render if card data changes
  return <div className="card">...</div>;
}, (prev, next) => {
  return prev.card.id === next.card.id;
});
```

#### 2. Virtualization (if needed)

For very long card lists (not typically needed in solitaire).

#### 3. CSS Containment

```css
.game-container {
  contain: layout style paint;
}
```

### Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| First Contentful Paint | < 1.5s | ~1.2s |
| Time to Interactive | < 3s | ~2.1s |
| Animation FPS | 60fps | 60fps |
| Memory Usage | < 100MB | ~45MB |

### Profiling

Use React DevTools Profiler:
1. Record gameplay session
2. Identify expensive renders
3. Apply memoization where needed

---

## Extension Points

### Adding a New Game Mode

1. **Define mode in constants:**
```javascript
// game.constants.js
export const GAME_MODES = {
  CLASSIC: 'classic',
  HIDDEN: 'hidden',
  CUSTOM: 'custom'  // New mode
};
```

2. **Implement mode logic:**
```javascript
// gameLogic.js
function initializeCustomMode() {
  return {
    ...baseState,
    stockRecycleLimit: 1,
    startingFaceDown: 5
  };
}
```

3. **Add UI selector:**
```jsx
<select onChange={setGameMode}>
  <option value="classic">Classic</option>
  <option value="custom">Custom</option>
</select>
```

### Adding Animations

1. **Define animation class:**
```css
@keyframes myAnimation {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

.my-animation {
  animation: myAnimation 300ms ease-out;
}
```

2. **Apply via state:**
```javascript
const [animationClass, setAnimationClass] = useState('');

const triggerAnimation = () => {
  setAnimationClass('my-animation');
  setTimeout(() => setAnimationClass(''), 300);
};
```

### Custom Card Decks

Replace the sprite sheet:
1. Create new `cardspritesheet@2x.png`
2. Maintain 13×5 grid layout
3. Update CSS if dimensions change

---

## Development Patterns

### Custom Hooks Pattern

```javascript
// Encapsulate complex logic in hooks
function useGameState(mode) {
  const [state, setState] = useState(() => initGame(mode));
  const [history, setHistory] = useState([]);
  
  const move = useCallback((from, to) => {
    setState(prev => {
      const next = executeMove(prev, from, to);
      setHistory(h => [...h, prev]);
      return next;
    });
  }, []);
  
  const undo = useCallback(() => {
    setHistory(h => {
      if (h.length === 0) return h;
      setState(h[h.length - 1]);
      return h.slice(0, -1);
    });
  }, []);
  
  return { state, move, undo };
}
```

### CSS Module Pattern

```javascript
// ComponentName.jsx
import styles from './ComponentName.module.css';

function ComponentName() {
  return <div className={styles.container}>...</div>;
}
```

```css
/* ComponentName.module.css */
.container {
  composes: card from global;  /* Extend global styles */
  background: var(--bg-surface);
}
```

### Error Boundary Pattern

```javascript
class ErrorBoundary extends Component {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  componentDidCatch(error, info) {
    console.error('Game error:', error, info);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorScreen onReset={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}
```

---

## Contributing

### Code Style

- **ESLint:** Enforced via config
- **Naming:** camelCase for variables, PascalCase for components
- **Comments:** JSDoc for functions, inline for complex logic

### Commit Convention

```
type(scope): description

feat(animations): Add new card flip animation
fix(gameLogic): Correct ace placement validation
docs(readme): Update installation instructions
```

### Pull Request Process

1. Create feature branch
2. Implement changes with tests
3. Run `npm run lint`
4. Update relevant documentation
5. Submit PR with description

---

## Resources

### Internal Documentation

- [Player's Guide](./PLAYER_GUIDE.md) - User-facing documentation
- [Design System](./ACTIVE/DESIGN_SYSTEM.md) - UI patterns
- [Design Tokens](./ACTIVE/DESIGN_TOKENS.md) - CSS variables
- [Progress](./ACTIVE/PROGRESS.md) - Current work status

### External References

- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide/)
- [CSS Transform Performance](https://www.html5rocks.com/en/tutorials/speed/high-performance-animations/)

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-29 | v2.3.2 - 2x-only asset simplification, telemetry system |
| 2026-01-28 | v2.3.0 - Game state analyzer, smart detection system |
| 2026-01-24 | v2.2.0 - Blue theme redesign, design system |
| 2026-01-23 | v2.1.0 - Viewport scaling, responsive layout |

---

**Questions?** Check the [Player's Guide](./PLAYER_GUIDE.md) for gameplay help or explore the codebase!

*Last Updated: 2026-01-29*  
*Version: 2.3.2*
