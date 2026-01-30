# Animation Developer Playground - Implementation Plan

## Overview

A developer-only tool for testing, previewing, and tuning all game animations in isolation from game logic.

**Status:** Planning Phase  
**Scope:** DEV mode only, gated behind environment check  
**Goal:** Enable rapid iteration on animation feel without playing full games

---

## Architecture Decision

### Recommended: Option A - Dev Route

**Route:** `/dev/animations` (only registered in DEV mode)

**Why:**
- Cleanest separation from game code
- No risk of accidental inclusion in production
- Full screen real estate for testing
- Can use React Router's code-splitting

**Alternative:** Option C (Hidden Dev Mode via key combo) if we want in-context testing

---

## Component Structure

```
src/
├── dev/                          # DEV-only code (excluded from production)
│   └── AnimationPlayground/
│       ├── AnimationPlayground.jsx      # Main container
│       ├── AnimationPlayground.module.css
│       ├── components/
│       │   ├── PreviewStage.jsx         # Where animations play
│       │   ├── ControlPanel.jsx         # Sliders, inputs, toggles
│       │   ├── AnimationSelector.jsx    # List of animatable things
│       │   ├── PresetManager.jsx        # Save/load/export configs
│       │   └── LivePreview.jsx          # Real-time preview component
│       ├── presets/
│       │   ├── defaultAnimations.js     # Current production values
│       │   └── experimental.js          # WIP animation ideas
│       └── index.js
├── components/                   # Game components (modified to accept animation props)
│   └── Card/
│       └── Card.jsx             # Must accept animationClass override prop
```

---

## Animation Categories to Support

### 1. Card Animations
- [ ] **Slurp** (card entering empty column)
  - Duration, scale, rotation, easing
- [ ] **Pop** (card appearing at destination)
  - Duration, scale curve, bounce intensity
- [ ] **Lift** (card being dragged)
  - Scale, shadow, rotation
- [ ] **Drop Success** (valid drop)
  - Pulse, glow color, duration
- [ ] **Drop Fail** (invalid drop)
  - Shake intensity, duration, return speed
- [ ] **Flip** (face-down to face-up)
  - 3D rotation, duration, easing

### 2. Foundation Animations
- [ ] **Auto-complete cascade**
  - Delay between cards, individual card duration
- [ ] **Foundation glow** (valid target)
  - Color, pulse speed, intensity
- [ ] **Win celebration**
  - Confetti style, duration, card animations

### 3. UI Animations
- [ ] **Toast slide-in/out**
  - Direction, duration, easing
- [ ] **Modal open/close**
  - Scale, fade, backdrop blur
- [ ] **Button press**
  - Scale down, spring back
- [ ] **Portal idle/active**
  - Pulse speed, vortex intensity

### 4. Drag & Drop
- [ ] **Ghost trail**
  - Number of ghosts, fade speed, lag
- [ ] **Valid target highlight**
  - Color, pulse, border style
- [ ] **Touch drag**
  - Long-press delay, visual feedback

---

## Configuration System

### Animation Config Schema

```javascript
// src/dev/AnimationPlayground/schemas/animationConfig.js

export const animationConfigSchema = {
  // Card Slurp Animation
  slurp: {
    name: 'Card Slurp (Empty Column)',
    description: 'Animation when card enters empty column',
    category: 'card',
    parameters: {
      duration: {
        type: 'number',
        min: 100,
        max: 1000,
        step: 50,
        default: 250,
        unit: 'ms',
        label: 'Duration'
      },
      rotation: {
        type: 'number',
        min: 0,
        max: 360,
        step: 15,
        default: 135,
        unit: 'deg',
        label: 'Rotation'
      },
      scale: {
        type: 'range',
        min: 0.1,
        max: 1.0,
        step: 0.1,
        default: 0.3,
        label: 'End Scale'
      },
      easing: {
        type: 'select',
        options: ['ease-out', 'ease-in-out', 'spring', 'bounce'],
        default: 'ease-out',
        label: 'Easing Function'
      }
    }
  },
  
  // Card Pop Animation
  pop: {
    name: 'Card Pop (Destination)',
    description: 'Animation when card appears at destination',
    category: 'card',
    parameters: {
      duration: { type: 'number', min: 100, max: 800, default: 300 },
      startScale: { type: 'range', min: 0.5, max: 1.5, default: 0.8 },
      endScale: { type: 'range', min: 0.9, max: 1.1, default: 1.0 },
      overshoot: { type: 'range', min: 0, max: 0.3, default: 0.1 },
      easing: {
        type: 'select',
        options: ['spring', 'bounce', 'ease-out', 'elastic'],
        default: 'spring'
      }
    }
  },
  
  // Drag Lift
  dragLift: {
    name: 'Drag Lift',
    description: 'Animation when card is lifted for drag',
    category: 'drag',
    parameters: {
      scale: { type: 'range', min: 1.0, max: 1.3, default: 1.05 },
      shadowBlur: { type: 'number', min: 0, max: 50, default: 20 },
      shadowOpacity: { type: 'range', min: 0, max: 1, default: 0.5 },
      rotation: { type: 'number', min: -15, max: 15, default: 2 }
    }
  },
  
  // Add more animations...
};
```

---

## Live Preview System

### How It Works

1. **Select Animation** from sidebar list
2. **Adjust Parameters** with sliders/inputs
3. **See Live Preview** in center stage
4. **Trigger Animation** with play button or auto-play
5. **Export Config** when satisfied

### Preview Stage Layout

```
┌─────────────────────────────────────────────────────────┐
│  Animation Developer Playground          [Export] [?]  │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌───────────────────────────────────┐  │
│  │          │  │                                   │  │
│  │ Category │  │      PREVIEW STAGE                │  │
│  │ - Card   │  │                                   │  │
│  │ - Drag   │  │      [Animated elements here]     │  │
│  │ - UI     │  │                                   │  │
│  │          │  │                                   │  │
│  │          │  └───────────────────────────────────┘  │
│  │          │                                         │
│  │ Animation│  ┌───────────────────────────────────┐  │
│  │ List     │  │      CONTROL PANEL                │  │
│  │          │  │                                   │  │
│  │ ○ Slurp  │  │  Duration: [====●====] 250ms      │  │
│  │ ○ Pop    │  │  Rotation: [==●======] 135°       │  │
│  │ ○ Lift   │  │  Scale:    [====●====] 0.3        │  │
│  │ ○ Shake  │  │  Easing:   [ease-out ▼]           │  │
│  │          │  │                                   │  │
│  │          │  │  [▶ Play] [🔁 Loop] [📋 Copy CSS] │  │
│  └──────────┘  └───────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Integration with Game

### How Configs Flow to Game

**Option 1: CSS Custom Properties (Recommended)**

```javascript
// Playground exports CSS variables
export const generateCSSVariables = (config) => `
  --anim-slurp-duration: ${config.slurp.duration}ms;
  --anim-slurp-rotation: ${config.slurp.rotation}deg;
  --anim-slurp-scale: ${config.slurp.scale};
  --anim-slurp-easing: ${config.slurp.easing};
  
  --anim-pop-duration: ${config.pop.duration}ms;
  --anim-pop-overshoot: ${config.pop.overshoot};
  /* ... */
`;

// In game, load from localStorage or use defaults
const animationConfig = loadAnimationConfig(); // From playground
const cssVars = generateCSSVariables(animationConfig);

// Inject into document
const style = document.createElement('style');
style.textContent = `:root { ${cssVars} }`;
document.head.appendChild(style);
```

**CSS uses variables:**
```css
.card-slurp {
  animation: slurp var(--anim-slurp-duration) var(--anim-slurp-easing);
}

@keyframes slurp {
  0% { transform: scale(1) rotate(0); }
  100% { 
    transform: scale(var(--anim-slurp-scale)) rotate(var(--anim-slurp-rotation));
  }
}
```

**Option 2: JavaScript Animation Library (Framer Motion, GSAP)**
If we want more complex control, use a library with dynamic variants.

---

## Implementation Steps

### Phase 1: Foundation (2-3 hours)
1. Create `/dev/AnimationPlayground/` directory structure
2. Set up DEV-only routing in `App.jsx`
3. Create base components (Playground, ControlPanel, PreviewStage)
4. Add schema for 3-4 core animations

### Phase 2: First Animations (2-3 hours)
1. Implement Card component that accepts animation overrides
2. Add Slurp and Pop animation previews
3. Create parameter controls (sliders, selects)
4. Connect controls to live preview

### Phase 3: Full Coverage (4-6 hours)
1. Add all remaining animation categories
2. Implement preset save/load
3. Add export to CSS variables
4. Create documentation

### Phase 4: Polish (2 hours)
1. Compare mode (A/B test old vs new)
2. Animation sequencer (chain multiple animations)
3. Performance metrics (FPS during animation)

---

## Production Safety

### Build-time Exclusion

```javascript
// vite.config.js
export default defineConfig({
  // ...
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        // Dev routes only included in dev build
        ...(process.env.NODE_ENV === 'development' && {
          dev: resolve(__dirname, 'dev.html')
        })
      }
    }
  }
});
```

### Runtime Gating

```javascript
// In App.jsx
{import.meta.env.DEV && (
  <Route path="/dev/*" element={<DevRoutes />} />
)}
```

### No Production Leak

- All dev files in `/src/dev/` directory
- Directory excluded from production builds
- Components explicitly check `import.meta.env.DEV`

---

## User Flow

### Developer Experience

1. **Start dev server:** `npm run dev`
2. **Navigate to:** `http://localhost:5173/dev/animations`
3. **Select animation** from sidebar (e.g., "Card Slurp")
4. **Adjust parameters** with sliders
5. **Click Play** to see animation
6. **Enable Loop** to see it repeatedly
7. **Compare** with "Reset to Default" button
8. **Export** when satisfied (copies CSS variables to clipboard)
9. **Paste** into `tokens.css` or save as new preset

### Export Formats

**Option 1: CSS Variables (Recommended)**
```css
/* Paste into src/styles/tokens.css */
:root {
  --anim-slurp-duration: 250ms;
  --anim-slurp-rotation: 135deg;
  /* ... */
}
```

**Option 2: JavaScript Config**
```javascript
// export as animation.config.js
export const animationConfig = {
  slurp: { duration: 250, rotation: 135, /* ... */ },
  pop: { duration: 300, overshoot: 0.1, /* ... */ }
};
```

**Option 3: Preset File**
Save to `src/dev/AnimationPlayground/presets/my-tweak.json`

---

## Success Criteria

- [ ] Can preview all major animations in isolation
- [ ] Can adjust timing, easing, and transforms in real-time
- [ ] Changes reflect immediately in preview
- [ ] Can export config to use in game
- [ ] Zero impact on production build size
- [ ] No dev code in production bundle
- [ ] Intuitive enough for non-technical stakeholders to use

---

## Estimated Effort

| Phase | Time | Complexity |
|-------|------|------------|
| 1: Foundation | 3h | Medium |
| 2: Core Animations | 3h | Medium |
| 3: Full Coverage | 5h | Medium |
| 4: Polish | 2h | Low |
| **Total** | **13h** | **Medium** |

---

## Questions to Resolve

1. **Which animation library?**
   - CSS-only (current) - simple, fast
   - Framer Motion - React-native, gestures
   - GSAP - most powerful, but heavy

2. **Export format?**
   - CSS variables (preferred for performance)
   - JS config (more flexible)
   - Both

3. **Scope of preview?**
   - Single card animations only
   - Multi-card sequences
   - Full board state animations

4. **Persistence?**
   - localStorage for draft configs
   - Git-tracked preset files
   - Both

---

**Next Step:** Confirm architecture choice and begin Phase 1 implementation?
