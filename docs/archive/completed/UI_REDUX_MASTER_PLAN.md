# [ARCHIVED - FULLY IMPLEMENTED] Meridian Solitaire UI/UX Redux Master Plan

## Document Information
- **Version:** 1.0 (ARCHIVED)
- **Date:** 2026-01-28
- **Status:** ✅ FULLY IMPLEMENTED - See UI_REDUX_PROGRESS.md for completion details
- **Scope:** HomeScreen, HowToPlay, Statistics, UI System Unification

> **Note:** This document is preserved as a historical record. All phases have been completed as of 2026-01-28. See `UI_REDUX_PROGRESS.md` for implementation details.

---

## Executive Summary

This document specifies a complete redesign of Meridian Solitaire's non-game UI to establish a unified, professional design system. All screens become full-bleed with consistent patterns, preparing for future sprite-based asset integration while maintaining CSS fallbacks.

**Key Deliverables:**
- Unified component library (buttons, cards, layouts)
- Full-bleed screen architecture
- Consistent typography and color systems
- Sprite-ready specifications
- Removal of deprecated `isFun` feature

---

## Phase 0: Cleanup (Pre-Redesign)

### Task: Remove `isFun` / `toggleStyle` Feature

The "Fun Style" card rotation feature is deprecated and will be completely removed.

#### Files to Modify

| File | Changes |
|------|---------|
| `useCardGame.js` | Remove `isFun` from config state, remove `toggleStyle` function |
| `App.jsx` | Remove `toggleStyle` from destructuring, remove props to GameMenu |
| `GameMenu.jsx` | Remove `isFunStyle`/`onToggleStyle` props, remove style toggle menu item |
| `StockWaste.jsx` | Remove `config.isFun` rotation logic, simplify to clean transforms |
| `Card.jsx` | Remove rotation calculation based on seed, remove `config.isFun` check |
| `Header.jsx` | Remove style toggle if present (component may be deprecated) |

#### Implementation Notes
- All cards will display in clean, aligned orientation
- Remove `rotationSeed` from config initialization
- Simplify Card component transform logic

---

## Phase 1: Foundation (Component Library)

### 1.1 Design Tokens Additions

Add to `src/styles/tokens.css`:

```css
:root {
  /* Z-Index Hierarchy */
  --z-home: 100;           /* HomeScreen when game active */
  --z-content: 500;        /* Full-bleed content screens */
  /* existing: --z-modal: 2100, --z-overlay: 3000 */
  
  /* Screen Layout */
  --screen-header-height: 60px;
  --screen-max-width: 960px;
  --screen-padding: var(--spacing-8); /* 32px */
  
  /* Button Dimensions (Sprite Targets) */
  --btn-primary-width: 240px;
  --btn-primary-height: 56px;
  --btn-secondary-width: 200px;
  --btn-secondary-height: 48px;
  --btn-icon-size: 40px;
  
  /* Card Dimensions */
  --card-info-min-height: 120px;
  --card-data-min-height: 160px;
  --card-feature-min-height: 200px;
}
```

### 1.2 Component: FullBleedScreen

**Purpose:** Universal wrapper for full-screen experiences

**Interface:**
```typescript
interface FullBleedScreenProps {
  isOpen: boolean;
  onClose?: () => void;
  title: string;
  headerLeft?: React.ReactNode;   // Default: Back button
  headerRight?: React.ReactNode;  // Optional action
  footer?: React.ReactNode;
  children: React.ReactNode;
  variant?: 'default' | 'home' | 'overlay'; // z-index control
}
```

**CSS Specification:**
```css
.fullBleedScreen {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-deep);
  z-index: var(--z-overlay); /* 3000 */
  overflow: hidden;
}

.fullBleedScreen[data-variant="home"] {
  z-index: var(--z-home); /* 100 */
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: var(--screen-padding);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.contentInner {
  width: 100%;
  max-width: var(--screen-max-width);
}
```

### 1.3 Component: ScreenHeader

**Purpose:** Consistent header across all screens

**Structure:**
```
[← Back]        TITLE        [Action]
   40px       variable         auto
```

**CSS Specification:**
```css
.screenHeader {
  height: var(--screen-header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-6);
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.headerTitle {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.backButton {
  width: var(--btn-icon-size);
  height: var(--btn-icon-size);
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--border-medium);
  border-radius: var(--border-radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
}
```

### 1.4 Component: Button System (3-Tier)

#### Tier 1: PrimaryButton
- **Use:** Main call-to-action
- **Dimensions:** 240px × 56px (fixed for sprites)
- **Style:** `--accent-primary` background, dark text
- **States:** default, hover (lift), active (press), disabled

```css
.primaryButton {
  width: var(--btn-primary-width);
  height: var(--btn-primary-height);
  background: var(--accent-primary);
  border: 1px solid var(--accent-primary);
  border-radius: var(--border-radius-md);
  color: var(--bg-deepest);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.primaryButton:hover:not(:disabled) {
  background: var(--accent-secondary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-glow-sm);
}

.primaryButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

#### Tier 2: SecondaryButton
- **Use:** Alternative main action
- **Dimensions:** 200px × 48px (fixed for sprites)
- **Style:** Surface background, accent border

```css
.secondaryButton {
  width: var(--btn-secondary-width);
  height: var(--btn-secondary-height);
  background: var(--bg-surface);
  border: 1px solid var(--accent-primary);
  border-radius: var(--border-radius-md);
  color: var(--accent-primary);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
}
```

#### Tier 3: TertiaryButton (Text Link)
- **Use:** Supporting actions, navigation
- **Dimensions:** Auto width, 40px height
- **Style:** Transparent, text only

```css
.tertiaryButton {
  padding: var(--spacing-2) var(--spacing-4);
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: var(--font-size-md);
}

.tertiaryButton:hover {
  color: var(--accent-primary);
}
```

### 1.5 Component: Card System (3 Types)

#### Type A: ActionCard
- **Use:** Play options, CTAs
- **Layout:** Header + Description + Actions (vertical)
- **Border:** `--border-subtle`, accent on hover

```css
.actionCard {
  width: 100%;
  padding: var(--spacing-6);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--border-radius-lg);
  transition: border-color var(--transition-fast);
}

.actionCard:hover {
  border-color: var(--accent-primary);
}
```

#### Type B: DataCard
- **Use:** Statistics display
- **Layout:** Large value (top) + Label (bottom), centered
- **Dimensions:** Min 160px height

```css
.dataCard {
  padding: var(--spacing-6);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--border-radius-lg);
  text-align: center;
}

.dataValue {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--accent-primary);
  font-family: var(--font-family-mono);
}

.dataLabel {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  text-transform: uppercase;
}
```

#### Type C: InfoCard
- **Use:** Rules, tips, explanations
- **Layout:** Icon (left) + Content (right) horizontal

```css
.infoCard {
  display: flex;
  gap: var(--spacing-4);
  padding: var(--spacing-5);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--border-radius-lg);
}
```

### 1.6 Component: TabBar

**Purpose:** Unified tab navigation

```css
.tabBar {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-surface);
}

.tab {
  flex: 1;
  padding: var(--spacing-4);
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  color: var(--text-secondary);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-tight);
  cursor: pointer;
}

.tab:hover {
  background: var(--bg-overlay-light);
  color: var(--text-primary);
}

.tabActive {
  color: var(--accent-primary);
  border-bottom-color: var(--accent-primary);
}
```

### 1.7 Component: ProgressBar

**Purpose:** Visual progress indication

```css
.progressBar {
  width: 100%;
  height: 8px;
  background: var(--bg-elevated);
  border-radius: var(--border-radius-sm);
  overflow: hidden;
}

.progressFill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
  border-radius: var(--border-radius-sm);
  transition: width var(--transition-normal);
}
```

---

## Phase 2: Screen Redesigns

### 2.1 HomeScreen Redesign

#### Current Issues
- 2-column layout causes height misalignment
- 5 different button styles
- Awkward version placement
- Mode selector breaks visual flow

#### New Layout (Single Column)

```
┌─────────────────────────────────────────────────────────────┐
│  [←]         MERIDIAN SOLITAIRE              [⚙ Menu]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│              [Continue Game]                                │
│              (when game in progress)                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  QUICK PLAY                                         │   │
│  │  Random deal in selected mode                       │   │
│  │                                                     │   │
│  │  ┌──────────────┐  ┌──────────────┐                │   │
│  │  │ CLASSIC ▼   │  │   Play Now   │                │   │
│  │  └──────────────┘  └──────────────┘                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  CAMPAIGN                                           │   │
│  │  30 progressive levels                              │   │
│  │  ████████████░░░░░░  27/30                          │   │
│  │              [Continue Campaign]                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│         How to Play  •  Statistics  •  Campaign           │
│                                                             │
│                         v2.3.0                            │
└─────────────────────────────────────────────────────────────┘
```

#### Component Mapping
| Element | Component | Notes |
|---------|-----------|-------|
| Screen | FullBleedScreen | variant="home" |
| Continue | PrimaryButton | Full width, conditional |
| Quick Play | ActionCard | Contains inline select + button |
| Campaign | ActionCard | Contains progress bar |
| Secondary | TextLinkGroup | 3 text links with bullets |
| Version | Footer | Centered, muted |

#### Props Interface
```typescript
interface HomeScreenProps {
  hasGameInProgress: boolean;
  onContinue: () => void;
  onNewGame: () => void;
  selectedMode: string;
  onModeChange: (mode: string) => void;
  modeOptions: { value: string; label: string }[];
  campaignProgress: {
    completed: number;
    total: number;
    currentLevel: number;
  };
  onShowCampaign: () => void;
  onShowRules: () => void;
  onShowStats: () => void;
}
```

---

### 2.2 HowToPlay Screen (RulesModal Redesign)

#### Changes
- Convert from modal to full-bleed screen
- Standardize all tab content layouts
- Replace emojis with CSS icons
- Consolidate 5 card styles to 3

#### Tab Standardization

All tabs use **vertical stack** layout:
1. Optional hero/highlight section
2. Grid of InfoCards or FeatureCards
3. Optional text section

#### Tab Content

**Goal Tab:**
- Hero: "Fill all 8 foundations to win"
- 2 FeatureCards: UP Foundations, DOWN Foundations

**Columns Tab:**
- 3 InfoCards: Ace, King, Empty (horizontal with icons)

**Controls Tab:**
- Grid of DataCards: Drag, Double-click, Undo, Redo, Long-press

**Modes Tab:**
- 2×2 grid of FeatureCards with mode tags

**Tips Tab:**
- Vertical stack of InfoCards with numbered badges

#### Component Mapping
| Old | New |
|-----|-----|
| foundationCard | FeatureCard |
| columnCard | InfoCard |
| controlCard | DataCard |
| modeCard | FeatureCard |
| tipCard | InfoCard |

---

### 2.3 Statistics Screen (StatsModal Redesign)

#### Changes
- Convert from modal to full-bleed screen
- Move reset button to header right
- Replace emojis with icons
- Standardize card layouts

#### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [←]         STATISTICS                    [🗑 Reset]      │
├─────────────────────────────────────────────────────────────┤
│  [Overview] [Records] [By Mode]                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Overview Tab:                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │   156    │ │    89    │ │    67    │ │   5.2%   │     │
│  │  Played  │ │   Wins   │ │  Losses  │ │ Win Rate │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  TOTAL PLAY TIME: 48h 32m                           │   │
│  │  TOTAL MOVES: 24,592                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Icon Replacements
| Emoji | New | CSS Implementation |
|-------|-----|-------------------|
| 🔥 | Flame | CSS shape or sprite |
| ⭐ | Star | CSS shape or sprite |
| 🎯 | Target | CSS shape or sprite |
| ⚡ | Lightning | CSS shape or sprite |

---

### 2.4 CampaignScreen Alignment

#### Changes
- Adopt FullBleedScreen wrapper
- Keep existing LevelCard component
- Update header to ScreenHeader pattern
- Unify tier tab styling with TabBar

---

## Phase 3: UI Unification

### 3.1 GameMenu Refactor

#### Current
- Hamburger dropdown menu
- Mixed component styles
- Positioned over game

#### New: OverlayPanel
- Full-bleed overlay (z-index: 3000)
- Slide-in from right animation
- Consistent with screen architecture
- Same header pattern (title + close)

```
┌─────────────────────────────────────────────────────────────┐
│  [X]         GAME MENU                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  QUICK ACTIONS                                              │
│  [New Game] [Restart Level]                                 │
│                                                             │
│  GAME SETTINGS                                              │
│  [Mode Select]                                              │
│                                                             │
│  INFORMATION                                                │
│  [Statistics]                                               │
│                                                             │
│  THEME                                                      │
│  [Deep Blue Casino ▼]                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 ConfirmDialog Refactor

#### New: ModalDialog
- Centered modal (not full-bleed)
- Uses unified button system
- Consistent backdrop
- z-index: 2100 (below overlays)

```
┌───────────────────────────────────┐
│         Confirm Action            │
├───────────────────────────────────┤
│                                   │
│  Are you sure you want to         │
│  reset your statistics?           │
│                                   │
│  [Cancel]    [Yes, Reset]         │
│                                   │
└───────────────────────────────────┘
```

### 3.3 PauseOverlay Alignment

- Update to use ScreenHeader pattern
- Consistent button styling
- Same z-index as other overlays (3000)

### 3.4 Notification System

Keep existing toast notifications but:
- Align colors with new palette
- Ensure z-index: 4000 (above overlays)

---

## Phase 4: Enhanced Metrics (Future)

### Fun Metrics to Add (Low Effort)

| Metric | Display Location |
|--------|-----------------|
| Total cards moved | Statistics screen |
| Foundations completed | Statistics screen |
| Undo count (per game) | Game end summary |
| Pocket usage | Statistics screen |
| Perfect games (no undo) | Records tab |

### Medium Effort Features

| Feature | Description |
|---------|-------------|
| Session stats | Today's games/moves/time |
| Speed run tracking | Best time by difficulty |
| Achievement badges | Visual rewards system |

---

## Sprite Transition Roadmap

### Phase 1: CSS Implementation (Now)
- All components built with CSS
- Exact pixel dimensions established
- States documented

### Phase 2: Asset Specification

| Asset | Dimensions | States Needed |
|-------|------------|---------------|
| Primary Button | 240×56 | default, hover, active, disabled |
| Secondary Button | 200×48 | default, hover, active, disabled |
| Back Button | 40×40 | default, hover, active |
| Close Button | 40×40 | default, hover, active |
| Action Card BG | 960×auto | default, hover |
| Data Card BG | 220×160 | default |
| Info Card BG | 100%×auto | default |
| Tab Active | variable | active indicator |
| Progress Bar | 100%×8 | fill gradient |
| Icons (set) | 24×24 | single state each |

### Phase 3: Sprite Integration
- Replace CSS backgrounds with sprite references
- Keep text rendering in CSS
- Maintain layout in CSS
- Icon sprites replace CSS icons

---

## Implementation Schedule

### Week 1: Foundation
- Day 1-2: Phase 0 cleanup (remove isFun)
- Day 3-4: Component library (buttons, cards, layout)
- Day 5: TabBar, ProgressBar, ScreenHeader

### Week 2: Screens
- Day 1-2: HomeScreen redesign
- Day 3: HowToPlay screen
- Day 4: Statistics screen
- Day 5: CampaignScreen alignment

### Week 3: Unification
- Day 1-2: GameMenu refactor
- Day 3: ConfirmDialog, PauseOverlay
- Day 4: Integration testing
- Day 5: Polish, animations

### Week 4: Enhanced Metrics (Optional)
- Add fun metrics
- Achievement system design
- Final QA

---

## Success Criteria

1. **Visual Consistency:** All screens share unified design language
2. **No Z-Index Issues:** Proper layering, no click blocking
3. **Button Hierarchy:** Clear primary/secondary/tertiary distinction
4. **Typography:** Strict token usage, no hardcoded values
5. **Sprite-Ready:** Fixed dimensions for all interactive elements
6. **Responsive:** Works 320px to 1920px+
7. **Accessibility:** Keyboard nav, ARIA labels, focus states

---

## Appendix A: File Change Summary

### New Files
- `components/FullBleedScreen/`
- `components/ScreenHeader/`
- `components/ActionCard/`
- `components/DataCard/`
- `components/InfoCard/`
- `components/TabBar/`
- `components/ProgressBar/`
- `components/TextLinkGroup/`
- `components/OverlayPanel/` (GameMenu replacement)
- `components/ModalDialog/` (ConfirmDialog replacement)

### Modified Files
- `hooks/useCardGame.js` (remove isFun/toggleStyle)
- `App.jsx` (prop drilling cleanup)
- `components/HomeScreen/` (complete rewrite)
- `components/RulesModal/` → `components/HowToPlayScreen/`
- `components/StatsModal/` → `components/StatisticsScreen/`
- `components/CampaignScreen/` (header alignment)
- `components/GameMenu/` → `components/OverlayPanel/`
- `components/ConfirmDialog/` → `components/ModalDialog/`
- `components/Card/` (remove rotation)
- `components/StockWaste/` (remove rotation)
- `styles/tokens.css` (additions)

### Deleted Files
- `isFun` related logic entirely
- Old Header component (if unused)

---

## Appendix B: Breaking Changes

1. **HomeScreen props:** Simplified, no mode select in header
2. **GameMenu:** Complete API change to OverlayPanel
3. **Stats display:** Emoji removal (pure CSS/icons)
4. **Config state:** `isFun` and `rotationSeed` removed

---

## Document Approval

| Role | Name | Date | Status |
|------|------|------|--------|
| Product Owner | | | ☐ Approved |
| Tech Lead | | | ☐ Approved |
| Design Lead | | | ☐ Approved |

---

*End of Document*
