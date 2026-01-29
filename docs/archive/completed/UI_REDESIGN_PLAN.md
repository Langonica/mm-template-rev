# HomeScreen UI/UX Redesign Plan

## Executive Summary

Redesign HomeScreen, RulesModal, and StatsModal to establish a unified, professional UI system that matches the GameStage quality. All screens become full-bleed with consistent patterns, preparing for future sprite-based asset integration.

---

## Critical Findings & Constraints

### Z-Index Hierarchy (Post-Bug-Fix)
| Layer | Z-Index | Usage |
|-------|---------|-------|
| `--z-base` | 0 | Game board, base content |
| `--z-home` | 100 | HomeScreen (when game active below) |
| `--z-content` | 500 | Full-bleed info screens |
| `--z-modal` | 2100 | Dialogs requiring backdrop |
| `--z-overlay` | 3000 | Full-bleed overlays (Rules, Stats) |
| `--z-notification` | 4000 | Toast notifications |

**Rule:** Full-bleed screens use `--z-overlay` (3000). HomeScreen uses `--z-home` (100) when game is active underneath.

### DOM Coexistence Pattern
All screens may exist simultaneously in DOM. Visibility controlled by:
1. Conditional rendering: `{showHomeScreen && <HomeScreen />}`
2. Z-index layering for overlay scenarios
3. Opacity/visibility transitions for smooth switching

---

## Design System Specification

### 1. Screen Architecture

All screens follow this structure:

```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 HEADER (60px)                       │   │
│  │  [Back]        TITLE          [Action/Button]       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │                 CONTENT AREA                        │   │
│  │         (scrollable, max-width 960px)               │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 FOOTER (optional)                   │   │
│  │              [version, links, etc]                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2. Layout Specifications

#### Screen Container
```css
.screen {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-deep);
  z-index: var(--z-overlay); /* 3000 for info screens */
  overflow: hidden;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-8);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.contentInner {
  width: 100%;
  max-width: 960px;
}
```

#### Header Pattern
```css
.header {
  height: 60px;
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
```

### 3. Typography System (Enforced)

| Token | Size | Usage |
|-------|------|-------|
| `--font-size-3xl` | 32px | Screen titles, hero numbers |
| `--font-size-2xl` | 24px | Section headers |
| `--font-size-xl` | 20px | Card titles, header text |
| `--font-size-lg` | 16px | Body emphasis |
| `--font-size-md` | 14px | **Primary body text** |
| `--font-size-sm` | 12px | Labels, captions |
| `--font-size-xs` | 10px | Fine print (minimum) |

**Rules:**
- No hardcoded font sizes (use tokens only)
- No sizes below `--font-size-xs` (10px)
- Headings use `--font-weight-bold` (700)
- Body uses `--font-weight-normal` (400)

### 4. Color Palette (Unified)

#### Semantic Colors
| Purpose | Token | Hex |
|---------|-------|-----|
| Primary accent | `--accent-primary` | #00D4FF |
| Secondary accent | `--accent-secondary` | #00B8D4 |
| Success/Valid | `--color-success` | #00E5FF |
| Warning | `--color-warning` | #FFC107 |
| Danger/Reset | `--color-danger` | #f44336 |

#### Card Accent Colors
| Card Type | Border | Background Tint |
|-----------|--------|-----------------|
| Info/Default | `--border-subtle` | `--bg-surface` |
| Success/Complete | `--color-success` | `--color-success-10` |
| Warning/Attention | `--color-warning` | `--color-warning-10` |
| Danger/Destructive | `--color-danger` | `--color-danger-10` |

### 5. Button System (3-Tier)

#### Tier 1: Primary
- **Use:** Main action on screen
- **Size:** 240px × 56px (fixed for sprite mapping)
- **Style:** `--accent-primary` bg, dark text
- **States:** default, hover, active, disabled

#### Tier 2: Secondary
- **Use:** Alternative main action
- **Size:** 200px × 48px (fixed for sprite mapping)
- **Style:** `--bg-surface` bg, `--accent-primary` border
- **States:** default, hover, active, disabled

#### Tier 3: Tertiary
- **Use:** Supporting actions, navigation
- **Size:** Auto width, 40px height
- **Style:** Transparent, text only or subtle border
- **States:** default, hover, active

#### Back Button (Universal)
- **Size:** 40px × 40px square
- **Icon:** ← (arrow left)
- **Position:** Header left

### 6. Card System (Unified to 3 Types)

#### Type A: Info Card
- **Use:** Rules explanations, tips
- **Size:** 100% width, auto height
- **Layout:** Icon (left) + Content (right)
- **Border:** `--border-subtle`

#### Type B: Data Card
- **Use:** Statistics display
- **Size:** Fixed aspect ratio or grid cell
- **Layout:** Large value (top) + Label (bottom)
- **Border:** `--accent-primary` (for emphasis)

#### Type C: Feature Card
- **Use:** Mode descriptions, highlights
- **Size:** Grid-based (280px min)
- **Layout:** Title + Tags + Description
- **Border:** `--border-subtle`, accent on hover

---

## Screen-Specific Designs

### Screen 1: HomeScreen

#### Layout Changes
**Current:** Centered content, 2-column play options, floating version
**New:** Full-bleed with header, single-column stack

```
┌─────────────────────────────────────────────────────────────┐
│  [←]         MERIDIAN SOLITAIRE              [⚙ Settings]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│              [Continue Game]                                │
│              (only when game in progress)                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  QUICK PLAY                                         │   │
│  │  Random deal in selected mode                       │   │
│  │                                                     │   │
│  │  [CLASSIC ▼]  [Play Now]                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  CAMPAIGN                                           │   │
│  │  30 progressive levels                              │   │
│  │  ████████████░░░░░░  27/30                          │   │
│  │              [Continue Campaign]                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  How to Play  •  Statistics  •  Campaign                  │
│                                                             │
│                         v2.3.0                            │
└─────────────────────────────────────────────────────────────┘
```

#### Key Changes
1. **Header added** with Back (exits app) and Settings
2. **Single column** play options (eliminates height mismatch)
3. **Mode selector inline** with Play button
4. **Campaign progress bar** visual instead of text stats
5. **Text links** for secondary actions (not buttons)
6. **Centered footer** for version

#### Component Mapping
| Element | Component | Props |
|---------|-----------|-------|
| Screen | `FullBleedScreen` | `title`, `headerLeft`, `headerRight` |
| Play Cards | `ActionCard` | `title`, `description`, `children` |
| Mode Select | `InlineSelect` | `options`, `value`, `onChange` |
| Progress Bar | `ProgressBar` | `current`, `total` |
| Secondary Nav | `TextLinkGroup` | `items: [{label, onClick}]` |

---

### Screen 2: How to Play (Rules)

#### Layout Changes
**Current:** Centered modal, 5 tabs with different layouts each
**New:** Full-bleed, consistent tab content layout

```
┌─────────────────────────────────────────────────────────────┐
│  [←]         HOW TO PLAY                                    │
├─────────────────────────────────────────────────────────────┤
│  [Goal] [Columns] [Controls] [Modes] [Tips]                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🎯                                                 │   │
│  │  FILL ALL 8 FOUNDATIONS TO WIN                      │   │
│  │                                                     │   │
│  │  Build UP foundations from 7 to King by suit        │   │
│  │  Build DOWN foundations from 6 to Ace by suit       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Column Types                                               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │
│  │ ACE          │ │ KING         │ │ EMPTY        │      │
│  │ A → 2 → 3    │ │ K → Q → J    │ │ Any A or K   │      │
│  └──────────────┘ └──────────────┘ └──────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Tab Content Standardization
All tabs use **vertical stack** layout:
1. Hero/Highlight section (optional)
2. Grid of info cards
3. Text sections

#### Card Consolidation
| Old Style | New Type | Notes |
|-----------|----------|-------|
| foundationCard | FeatureCard | Icon + title + description |
| columnCard | FeatureCard | With colored border variants |
| controlCard | InfoCard | Icon left, content right |
| modeCard | FeatureCard | With feature tags |
| tipCard | InfoCard | Number badge left |

---

### Screen 3: Statistics

#### Layout Changes
**Current:** Centered modal, 3 tabs, emoji icons
**New:** Full-bleed, consistent with other screens

```
┌─────────────────────────────────────────────────────────────┐
│  [←]         STATISTICS                    [🗑 Reset Stats]│
├─────────────────────────────────────────────────────────────┤
│  [Overview] [Records] [By Mode]                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │   156    │ │    89    │ │    67    │ │    5.2%  │     │
│  │  Played  │ │   Wins   │ │ Losses   │ │ Win Rate │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  TOTAL PLAY TIME: 48h 32m                           │   │
│  │  TOTAL MOVES: 24,592                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Icon Replacement
Replace emojis with CSS icon sprites:
- 🔥 Streak → Flame icon
- ⭐ Best → Star icon
- 🎯 Moves → Target icon
- ⚡ Time → Lightning icon

---

## Component Library Specification

### FullBleedScreen
```typescript
interface FullBleedScreenProps {
  isOpen: boolean;
  onClose?: () => void;
  title: string;
  headerLeft?: React.ReactNode;  // Back button default
  headerRight?: React.ReactNode; // Optional action
  footer?: React.ReactNode;
  children: React.ReactNode;
}
```

### ActionCard
```typescript
interface ActionCardProps {
  title: string;
  description?: string;
  accent?: 'default' | 'primary' | 'success';
  children: React.ReactNode;  // Interactive elements
}
```

### TabBar
```typescript
interface TabBarProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onChange: (id: string) => void;
}
```

### InfoCard / FeatureCard / DataCard
(Standardized card components as defined in Section 6)

---

## Sprite Transition Roadmap

### Phase 1: CSS Implementation (Now)
- Implement all components with CSS
- Use exact pixel dimensions for sprite mapping
- Document all visual states

### Phase 2: Asset Preparation
| Asset Type | Dimensions | States |
|------------|------------|--------|
| Primary Button | 240×56 | default, hover, active, disabled |
| Secondary Button | 200×48 | default, hover, active, disabled |
| Back Button | 40×40 | default, hover, active |
| Action Card BG | 960×auto | default, hover |
| Data Card BG | 220×160 | default, hover |
| Icons (set) | 24×24 each | single state |

### Phase 3: Sprite Integration
- Replace CSS backgrounds with sprite references
- Maintain text rendering in CSS (labels, values)
- Keep layout and spacing in CSS

---

## Implementation Phases

### Phase 1: Foundation (1-2 days)
1. Create `FullBleedScreen` component
2. Update CSS tokens (add `--z-home`, `--z-content`)
3. Refactor button system to 3-tier
4. Create unified card components

### Phase 2: HomeScreen (1 day)
1. Implement new layout
2. Integrate ActionCard for play options
3. Add progress bar component
4. Convert secondary actions to text links

### Phase 3: Rules Screen (1 day)
1. Convert to full-bleed
2. Standardize tab content layouts
3. Consolidate card types
4. Replace emojis with icons

### Phase 4: Statistics Screen (1 day)
1. Convert to full-bleed
2. Standardize card layouts
3. Replace emojis with icons
4. Move reset to header

### Phase 5: Polish (1 day)
1. Transitions and animations
2. Responsive testing
3. Accessibility audit
4. Cross-browser testing

---

## Success Criteria

1. **Visual Consistency:** All three screens feel like one unified app
2. **No Z-Index Issues:** Clear layering, no click blocking
3. **Button Hierarchy:** Users instantly know primary vs secondary actions
4. **Readable Typography:** Minimum 10px, clear hierarchy
5. **Sprite-Ready:** All components have fixed dimensions for asset replacement
6. **Responsive:** Works at 320px width up to 1920px

---

## Appendix: Token Additions Needed

```css
:root {
  /* Z-Index (additions) */
  --z-home: 100;
  --z-content: 500;
  
  /* Screen dimensions */
  --screen-header-height: 60px;
  --screen-max-width: 960px;
  --screen-padding: var(--spacing-8);
  
  /* Button dimensions (sprite targets) */
  --btn-primary-width: 240px;
  --btn-primary-height: 56px;
  --btn-secondary-width: 200px;
  --btn-secondary-height: 48px;
  --btn-icon-size: 40px;
}
```

---

*Document Version: 1.0*
*Date: 2026-01-28*
*Status: Ready for Implementation Review*
