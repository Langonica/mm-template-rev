# Layout Audit & Responsive Ratio Model

## Current Fixed Measurements

### Overall Dimensions
| Element | Current Value | Notes |
|---------|---------------|-------|
| Stage Width | 1280px | `--stage-w` |
| Stage Height | 720px | `--stage-h` (includes header/footer) |
| Play Area Height | 610px | Actual game board (`#game-stage`) |
| Header Height | 55px | Fixed |
| Footer Height | 55px | Fixed |

### Card Dimensions
| Element | Current Value | Aspect Ratio |
|---------|---------------|--------------|
| Card Width | 80px | 1 |
| Card Height | 112px | 1.4 (112/80) |
| Card Overlap | 16px | 0.2 × card width |

### Foundation Zone (Top)
| Element | Current Value | Notes |
|---------|---------------|-------|
| Zone Height | 140px | `--fnd-height` |
| Foundation Slot | 80×112px | Full card size |
| Gap Between Slots | 20px | Within each foundation group |
| Gap Between UP/DOWN | ~40px | Visual separation |

### Tableau Zone (Middle)
| Element | Current Value | Calculation |
|---------|---------------|-------------|
| Theater Top | 150px | Where columns start (was 145px) |
| Track Height | 310px | `--track-h` |
| Track Width | 80px | Same as card width |
| Column Gap | 20px | `--col-gap` |
| Column Start X | 300px | Left offset for first column |
| Total Columns Width | 660px | 7×80 + 6×20 = 560+120 |

### Stock/Waste Zone (Bottom)
| Element | Current Value | Notes |
|---------|---------------|-------|
| Zone Top | 460px | 150 + 310 = 460 |
| Stock/Waste Size | 80×112px | Full card size |
| Gap Stock→Waste | 10px | |
| Gap Waste→Pocket1 | 40px | Extra separation |
| Pocket Size | 80×112px | Full card size |

---

## Derived Ratios (Relative to Play Area)

### Vertical Distribution (of 610px play area)
| Zone | Pixels | Percentage |
|------|--------|------------|
| Foundations (top padding + slots) | ~150px | 24.6% |
| Tableau | ~310px | 50.8% |
| Stock/Waste/Pockets | ~150px | 24.6% |

### Horizontal Distribution (of 1280px width)
| Element | Pixels | Percentage |
|---------|--------|------------|
| Left margin to columns | 300px | 23.4% |
| 7 columns + 6 gaps | 660px | 51.6% |
| Right margin | 320px | 25.0% |

### Card-Relative Measurements
| Element | Card Widths | Notes |
|---------|-------------|-------|
| Column gap | 0.25 | 20/80 |
| Card overlap | 0.2 | 16/80 |
| Track height | 3.875 | 310/80 (~4 cards stacked) |
| Play area width | 16 | 1280/80 |

---

## Proposed Responsive Model

### Core Principle
**Derive everything from card width, which is derived from available viewport width.**

```
cardWidth = (viewportWidth - horizontalPadding - (6 × gapRatio × cardWidth)) / 7
```

Solving for cardWidth:
```
cardWidth = (viewportWidth - horizontalPadding) / (7 + 6 × gapRatio)
cardWidth = (viewportWidth - horizontalPadding) / 8.5  (if gapRatio = 0.25)
```

### CSS Custom Properties (Calculated via JS)

```css
:root {
  /* Base unit - calculated from viewport */
  --card-w: calc((100vw - 32px) / 8.5);  /* Simplified; JS for precision */
  --card-h: calc(var(--card-w) * 1.4);

  /* Derived measurements */
  --col-gap: calc(var(--card-w) * 0.25);
  --card-overlap: calc(var(--card-w) * 0.2);
  --track-h: calc(var(--card-w) * 3.875);

  /* Foundation cards - smaller */
  --fnd-card-w: calc(var(--card-w) * 0.65);
  --fnd-card-h: calc(var(--fnd-card-w) * 1.4);

  /* Zone heights as percentages */
  --fnd-zone-h: 20%;   /* Reduced from ~25% with smaller cards */
  --tableau-zone-h: 55%;
  --bottom-zone-h: 25%;
}
```

### Aspect Ratio Container

```css
.game-stage {
  aspect-ratio: 1280 / 610;  /* ~2.1:1 */
  width: 100%;
  max-width: 1280px;
  max-height: 100vh;
  /* Height will auto-adjust to maintain ratio */
}
```

### Minimum Viable Sizes

| Element | Min Size | Rationale |
|---------|----------|-----------|
| Card Width | 50px | Touch target usability |
| Card Height | 70px | Readability |
| Viewport Width | ~460px | 50 × 8.5 + padding |

Below minimums: Show "rotate device" or "use larger screen" message.

---

## Foundation Optimization

### Current State
- 8 foundation slots at full 80×112px each
- Total width: 8×80 + 7×20 = 780px
- Significant vertical space: 140px zone

### Proposed Optimization
- Reduce foundation cards to 65% size: 52×73px
- Reduce gaps proportionally: 13px
- Total width: 8×52 + 7×13 = 507px
- Zone height reduction: 140px → ~100px
- **Saves ~40px vertical space**

### Interaction Consideration
- Drop targets can remain larger than visual cards (invisible hit area)
- Drag FROM foundation is rare but must remain possible

---

## Implementation Phases

### Phase 1: CSS Custom Properties
- Define all dimensions as CSS vars in `:root`
- Keep fixed px values initially
- No functional change, just preparation

### Phase 2: JavaScript Dimension Calculator
- Create `useResponsiveDimensions` hook
- Calculate card width from viewport
- Update CSS vars on resize
- Maintain aspect ratio

### Phase 3: Component Refactor
- Remove hardcoded px values from components
- Use CSS vars or calculated values
- Foundation.jsx: scaled card rendering
- Column.jsx: relative positioning
- StockWaste.jsx: relative positioning

### Phase 4: Layout Container (Finalized Plan)

**Key Decisions:**
- Minimum viewport: Phone landscape (~667px width)
- Portrait orientation: Block with "rotate device" message
- Header/Footer: Eliminate entirely - no formal chrome

**New Layout Structure:**
```
┌─────────────────────────────────────────────┐
│                                             │
│   [DOWN Fnd]         [UP Fnd]        [⚙️]   │  Foundation zone + gear icon
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│              7 Tableau Columns              │  Tableau zone
│                                             │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  [Stock][Waste]  [⟲][⟳][⏸]  [Pkt1][Pkt2]   │  Bottom zone with controls
│                                             │
│           moves: 42    time: 3:21           │  Stats (subtle)
└─────────────────────────────────────────────┘
```

**Implementation Tasks:**
1. Remove Header and Footer components from game view
2. Add gear icon (top-right) → opens Settings modal
3. Move undo/redo/pause controls to bottom zone (between waste and pockets)
4. Add subtle stats display below bottom zone
5. Create portrait orientation blocker with rotate message
6. Update CSS to full-bleed game container

**What Stays:**
- PauseOverlay (already has Home/Resume/New Game)
- HomeScreen (shown before game starts)
- Settings modal (to be created or expanded from menu)

**Vertical Space Reclaimed:** 110px (was header + footer)

### Phase 5: Asset Independence (COMPLETE)
- ✅ Replaced track backgrounds with CSS gradient fallbacks
- ✅ Created plinth styling with CSS-only gradients
- ✅ Enhanced foundation slot styling (UP/DOWN indicators)
- ✅ Improved stock/waste/pocket placeholder styling
- ✅ Made all sprites optional except card faces
- ✅ Updated DESIGN_ASSETS.md with new specifications
- ✅ Sprites can be re-enabled by uncommenting CSS variables

---

## Files Requiring Changes

### High Impact
- `src/styles/App.css` - All dimension vars and zone positioning
- `src/components/Column.jsx` - Card positioning logic (lines 69-74)
- `src/components/Foundation.jsx` - Slot sizing
- `src/components/StockWaste.jsx` - Element sizing

### Medium Impact
- `src/components/GameStage.jsx` - Zone layout
- `src/components/Card.jsx` - Size from vars
- `src/hooks/useTouchDrag.js` - Coordinate calculations (lines 94-108)

### New Files
- `src/hooks/useResponsiveDimensions.js` - Dimension calculator

### Assets to Replace/Modify
- Track sprites (aces-up.png, kings-down.png, etc.) → CSS gradients
- gameboardonly.png → Either scale or eliminate

---

## Open Questions

1. **Minimum supported viewport?** Phone in portrait? Tablet only?
2. **Header/footer fate?** Overlay controls or thin bar?
3. **Foundation interaction priority?** Size vs. usability tradeoff
4. **Orientation lock?** Force landscape on mobile?

---

*Created: 2026-01-23*
