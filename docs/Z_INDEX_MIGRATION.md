# Z-Index Consolidation Plan

## Audit Summary

**Scope**: 50+ hardcoded z-index values across CSS and JSX  
**Range**: 1 to 15,000  
**Conflicts**: Multiple overlays at 9999-10000 range  
**Solution**: Token-based layered scale

---

## Current State Analysis

### Hardcoded Values Found

```
1, 2, 10                           - Base elements, card hover
100, 110, 120, 130                - Cards, foundation slots, count badges
200, 210, 220                     - Waste pile layers
281, 295, 296-300                 - Foundation depth layers
300, 310, 320                     - Foundation cards, badges
385, 500, 501                     - Column animations
600, 643, 679, 716                - Card hover states
768, 772                          - Modal content
996, 1000, 1021, 1045            - Pause overlay, animations
1206, 1230, 1295, 1347, 1402     - Menu items
1500, 2000, 2100, 2500           - Home screen, headers
3000, 3100                       - Header elements
5000                             - How to play modal
6000                             - Stats modal
9998                             - Touch drag ghost
9999                             - Keyboard hint, orientation blocker
10000                            - Loading overlay, win overlay, game over
15000                            - Stats modal overlay
```

### Conflict Hotspots

| Value | Components | Issue |
|-------|-----------|-------|
| 9999 | `keyboard-hint`, `orientation-blocker` | Same z-index, undefined stacking |
| 10000 | `loading-overlay`, `win-overlay`, `game-over-overlay` | Same z-index, last in DOM wins |

---

## New Token-Based Scale

```css
/* Game Layer (0-999) */
--z-game-base: 0;      /* Game board, tracks, empty slots */
--z-plinths: 5;        /* Column plinths */
--z-cards: 100;        /* Cards on tableau/foundations */
--z-card-hover: 200;   /* Hovered/lifted cards */
--z-stock-waste: 300;  /* Stock/waste pile depth layers */
--z-foundations: 400;  /* Foundation pile depth layers */
--z-count-badges: 500; /* Count badges on all piles */
--z-drag-ghost: 600;   /* Drag ghost image */
--z-portal: 700;       /* Portal animations */
--z-controls: 800;     /* Game controls (pause, undo) */

/* UI Layer (1000-4999) */
--z-dropdown: 1000;         /* Dropdown menus */
--z-modal-backdrop: 2000;   /* Modal backdrops */
--z-modal: 2100;            /* Modals (stats, rules) */
--z-overlay: 3000;          /* Pause/game over overlays */
--z-notification: 4000;     /* Toast notifications */
--z-tooltip: 4500;          /* Tooltips */

/* System Layer (5000+) */
--z-touch-drag: 5000;       /* Touch drag element */
--z-orientation: 6000;      /* Orientation blocker */
```

---

## Migration Mapping

| File | Current Value | New Token | Notes |
|------|--------------|-----------|-------|
| Card.module.css | z-index: 2 | --z-cards | Card base layer |
| Card.module.css | z-index: 600 | --z-card-hover | Hover state |
| Foundation.jsx | z-index: 281-300 | --z-foundations + calc | Foundation depth |
| Foundation.jsx | z-index: 310 | --z-foundations + 10 | Foundation cards |
| CountBadge.module.css | z-index: 320 | --z-count-badges | All badges |
| StockWaste.jsx | z-index: 100-110 | --z-stock-waste + calc | Stock depth |
| StockWaste.jsx | z-index: 200-220 | --z-stock-waste + calc | Waste depth |
| LoadingOverlay.jsx | z-index: 10000 | --z-overlay | Loading spinner |
| PauseOverlay.jsx | z-index: 1000 | --z-overlay | Pause screen |
| WinOverlay.jsx | z-index: 10000 | --z-overlay | Win celebration |
| GameOverOverlay.jsx | z-index: 10000 | --z-overlay | Game over |
| Notification.jsx | z-index: 15000 | --z-notification | Toast |
| KeyboardHint.jsx | z-index: 9999 | --z-tooltip | Keyboard hints |
| OrientationBlocker.jsx | z-index: 9999 | --z-orientation | Mobile blocker |
| TouchDragElement | z-index: 9998 | --z-touch-drag | Drag image |
| Header | z-index: 2000,3000 | --z-controls | Fixed header |
| Footer | z-index: 2000,3000 | --z-controls | Fixed footer |

---

## Implementation Plan

### Phase 1: Foundation (This PR)
- [x] Define new token scale in tokens.css
- [x] Create migration guide
- [ ] Update CountBadge component
- [ ] Update Card.module.css

### Phase 2: Piles
- [ ] Migrate StockWaste.jsx
- [ ] Migrate Foundation.jsx
- [ ] Remove inline z-index calculations

### Phase 3: Overlays
- [ ] Migrate all overlay components
- [ ] Resolve 9999/10000 conflicts
- [ ] Test stacking order

### Phase 4: UI Components
- [ ] Migrate Header/Footer
- [ ] Migrate Modals
- [ ] Migrate Notifications

---

## Testing Checklist

- [ ] Card hover lifts above other cards
- [ ] Stock/Waste badges visible above cards
- [ ] Foundation badges visible
- [ ] Drag ghost above all game elements
- [ ] Pause overlay blocks game interaction
- [ ] Win overlay shows above pause
- [ ] Notifications show above overlays
- [ ] Touch drag works on mobile
- [ ] Orientation blocker shows when rotated
- [ ] Keyboard hints visible above game

---

## Risk Assessment

**Low Risk**: --z-game-base, --z-plinths, --z-cards  
**Medium Risk**: --z-card-hover, pile depth layers  
**High Risk**: Overlay consolidation (9999→--z-overlay)

**Mitigation**: Test each change in browser, verify stacking contexts.
