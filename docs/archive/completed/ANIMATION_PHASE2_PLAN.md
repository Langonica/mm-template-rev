# Animation Phase 2: Regular Autoplay Improvements

**Status**: IMPLEMENTED ✓

## Overview
Improve the double-click autoplay animation to be more visually clear and satisfying.

## Goals
1. **Arc motion** - Cards follow a visible curved trajectory
2. **Ghost trail** - Motion blur effect with trailing cards
3. **Source vacancy flash** - Highlight where card departed from

---

## Current State

### Existing Double-Click Autoplay (`handleAutoMove`)
- **Slurp phase** (300ms): Card scales down at source
- **Pop phase** (400ms): Card scales up at destination
- **Total**: 700ms, no visible trajectory between locations

### Problems
- Cards feel like they "snap" into place
- No visual connection between source and destination
- Players lose track of which card moved where

---

## Proposed Changes

### 1. Arc Motion Animation

**Concept**: Card visibly travels along a curved path from source to destination.

**Animation phases**:
```
0ms    : Card lifts from source (scale 1 → 1.1)
100ms  : Card begins arc trajectory upward
300ms  : Card peaks at arc apex (highest point)
400ms  : Card lands at destination (scale 1.1 → 1)
```

**Bezier curve control points**:
```javascript
// Arc calculation
const arcHeight = 100; // pixels above straight line
const controlX = (startX + endX) / 2;
const controlY = Math.min(startY, endY) - arcHeight;

// CSS offset-path approach
offset-path: path('M startX startY Q controlX controlY endX endY');
```

**Implementation options**:
- **Option A**: CSS `offset-path` with `path()` - smooth but limited browser support
- **Option B**: Manual keyframe calculation with transforms - full control, works everywhere
- **Selected**: Option B for maximum compatibility

### 2. Ghost Trail Effect

**Concept**: 2-3 semi-transparent copies trail behind the moving card.

**Visual design**:
- Ghost 1: 40% opacity, 30ms behind
- Ghost 2: 20% opacity, 60ms behind
- Ghost 3: 10% opacity, 90ms behind (optional)

**CSS approach**:
```css
.ghost-trail-1 {
  opacity: 0.4;
  animation: trail-fade 100ms ease-out forwards;
  animation-delay: 30ms;
}
```

### 3. Source Vacancy Flash

**Concept**: Brief highlight where the card left from.

**Animation**:
```css
@keyframes source-vacancy {
  0% { 
    box-shadow: inset 0 0 0 rgba(255, 215, 0, 0);
    background: transparent;
  }
  50% { 
    box-shadow: inset 0 0 20px rgba(255, 215, 0, 0.5);
    background: rgba(255, 215, 0, 0.1);
  }
  100% { 
    box-shadow: inset 0 0 0 rgba(255, 215, 0, 0);
    background: transparent;
  }
}
```

**Duration**: 300ms

---

## Implementation Plan

### Files to Modify

1. **`useCardGame.js`**
   - Update `handleAutoMove` to use new animation system
   - Add arc trajectory calculation
   - Phase timing: lift (100ms) → arc (300ms) → land (200ms)

2. **`App.css`**
   - `@keyframes arc-lift` - Card lifts from source
   - `@keyframes arc-fly` - Card travels along arc
   - `@keyframes arc-land` - Card settles at destination
   - `@keyframes ghost-trail` - Ghost cards fade
   - `@keyframes source-flash` - Vacancy indicator
   - `.arc-animating` - Container styles

3. **`Column.jsx`**
   - Handle arc animation departing state
   - Show ghost trails
   - Source vacancy flash effect

4. **`Foundation.jsx`**
   - Handle arc animation arriving state
   - Landing pulse effect

5. **`StockWaste.jsx`**
   - Handle arc animation from waste/pocket
   - Source highlight effect

### Animation State Structure

```javascript
// New state (or extend existing autoMoveAnimation)
const [arcAnimation, setArcAnimation] = useState({
  isActive: false,
  card: null,
  source: null,      // { type, column?, suit? }
  target: null,      // { type, column?, suit?, zone? }
  phase: 'idle',     // 'idle' | 'lifting' | 'flying' | 'landing'
  progress: 0,       // 0-100% for progress tracking
  ghosts: []         // [{ id, delay, opacity }]
});
```

### Coordinate Calculation

```javascript
// Calculate positions for arc animation
function calculateArcCoordinates(source, target) {
  const startPos = getSourcePosition(source);
  const endPos = getTargetPosition(target);
  
  // Control point for quadratic bezier (higher = more arc)
  const midX = (startPos.x + endPos.x) / 2;
  const midY = Math.min(startPos.y, endPos.y) - 100;
  
  return {
    start: startPos,
    end: endPos,
    control: { x: midX, y: midY }
  };
}

// Generate keyframe points along bezier curve
function generateArcKeyframes(start, control, end, steps = 10) {
  const keyframes = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Quadratic bezier formula: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
    const x = Math.pow(1-t, 2) * start.x + 
              2 * (1-t) * t * control.x + 
              Math.pow(t, 2) * end.x;
    const y = Math.pow(1-t, 2) * start.y + 
              2 * (1-t) * t * control.y + 
              Math.pow(t, 2) * end.y;
    keyframes.push({ x, y, t });
  }
  return keyframes;
}
```

---

## Animation Sequence Details

### Phase 1: Lifting (100ms)
```css
@keyframes arc-lift {
  0% {
    transform: scale(1) translateY(0);
    filter: brightness(1);
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
  100% {
    transform: scale(1.15) translateY(-15px);
    filter: brightness(1.3);
    box-shadow: 0 15px 40px rgba(0,0,0,0.5);
  }
}
```
- Card lifts from its position
- Scales up slightly
- Brightens
- Enhanced shadow

### Phase 2: Flying (300ms)
```css
@keyframes arc-fly {
  0% {
    /* Start at source */
  }
  50% {
    /* Peak of arc - highest point */
    transform: translate(var(--peak-x), var(--peak-y)) scale(1.1);
  }
  100% {
    /* End at destination */
    transform: translate(var(--end-x), var(--end-y)) scale(1.05);
  }
}
```
- Card follows calculated bezier path
- Ghost trails spawn behind
- Source location flashes

### Phase 3: Landing (200ms)
```css
@keyframes arc-land {
  0% {
    transform: scale(1.05);
    filter: brightness(1.3);
  }
  70% {
    transform: scale(0.95);
    filter: brightness(1.1);
  }
  100% {
    transform: scale(1);
    filter: brightness(1);
  }
}
```
- Card settles into final position
- Subtle bounce effect
- Destination pulses

### Ghost Trail
```css
.ghost-trail {
  position: absolute;
  pointer-events: none;
  animation: trail-fade 150ms ease-out forwards;
}

@keyframes trail-fade {
  0% { opacity: 0.5; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.9); }
}
```

### Source Vacancy Flash
```css
.source-vacancy {
  animation: source-flash 300ms ease-out;
}

@keyframes source-flash {
  0% { 
    box-shadow: inset 0 0 0 rgba(255, 215, 0, 0);
  }
  50% { 
    box-shadow: inset 0 0 25px rgba(255, 215, 0, 0.6);
    background: rgba(255, 215, 0, 0.15);
  }
  100% { 
    box-shadow: inset 0 0 0 rgba(255, 215, 0, 0);
    background: transparent;
  }
}
```

---

## Testing Checklist

- [ ] Double-click on tableau card → foundation shows arc animation
- [ ] Double-click on waste card → foundation shows arc animation
- [ ] Double-click on pocket card → foundation shows arc animation
- [ ] Ghost trails visible during flight
- [ ] Source location flashes briefly
- [ ] Landing has subtle bounce at destination
- [ ] Animation completes before next interaction
- [ ] Reduced motion preference respected
- [ ] Performance: 60fps on mid-tier devices

---

## Performance Considerations

1. **GPU Acceleration**: Use `transform` and `opacity` only
2. **Will-change**: Apply sparingly to animated elements
3. **Ghost cleanup**: Remove ghost elements after animation
4. **RAF scheduling**: Use `requestAnimationFrame` for smooth updates

---

## Accessibility

```css
@media (prefers-reduced-motion: reduce) {
  .arc-animating,
  .ghost-trail,
  .source-vacancy {
    animation: none !important;
    transition: none !important;
  }
}
```
