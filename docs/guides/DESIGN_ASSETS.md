# Design Assets Specification

This document catalogs all visual assets for Meridian Solitaire and provides specifications for designers creating new assets.

---

## Quick Links

- **[Visual Asset Preview](../../public/ASSET_PREVIEW.html)** - Interactive checklist with live previews and CSS fallbacks
- **[Printable Asset Checklist](../DESIGN_GUIDE.html)** - Page 11 of Design Guide (PDF-optimized)

---

## Asset Status at a Glance

| Category | Count | Check Via |
|----------|-------|-----------|
| Required | 2 | Interactive preview or checklist below |
| Optional (with CSS fallbacks) | 6 | Interactive preview shows fallback comparison |
| Future UI | 3 | Planned for future enhancement |

---

## 2x-Only Asset Strategy (v2.3.2+)

**Meridian Solitaire uses a simplified 2x-only asset system.** We provide only high-resolution @2x assets and use CSS `background-size` to scale them down for all display densities. This approach:

- **Simplifies the codebase** - No JavaScript asset selection logic needed
- **Ensures crisp visuals** - High-DPI assets downscale beautifully via GPU
- **Reduces maintenance** - One asset version to create and maintain
- **Works everywhere** - Modern browsers handle downscaling excellently

### How It Works

```css
/* CSS loads only the @2x asset */
--sprite-url: url('/meridian-master/assets/cardspritesheet@2x.png');

/* background-size scales it to logical dimensions */
.card {
  background-image: var(--sprite-url);
  background-size: 1040px 560px; /* Half of 2080x1120 @2x */
}
```

The browser's GPU-accelerated downscaling produces excellent results at all viewport scales and device pixel ratios.

---

## Asset Independence (Phase 5)

**The game works with CSS-only styling by default.** All track backgrounds, plinths, and placeholders use CSS gradients. This means:

- The game runs without any custom sprite assets (except card faces)
- Designers can create new sprites at their own pace
- Sprites can be easily swapped by updating CSS variables

### Required vs Optional Assets

| Asset Type | Status | Notes |
|------------|--------|-------|
| Card Sprite Sheet @2x | **REQUIRED** | Cards cannot be rendered without this |
| Game Board Background @2x | **REQUIRED** | `mm-gameboard@2x.png` - active in current build |
| Track Backgrounds | Optional | CSS gradients provide fallback |
| Column Badges | Optional | CSS gradients provide fallback |

---

## How to Enable Custom Sprites

Edit `src/styles/App.css` and uncomment the relevant URL variables:

```css
/* Track backgrounds - uncomment to use custom sprites */
--track-ace: url('/meridian-master/assets/aces-up@2x.png');
--track-king: url('/meridian-master/assets/kings-down@2x.png');
--track-default: url('/meridian-master/assets/default-down@2x.png');
--track-empty: url('/meridian-master/assets/empty@2x.png');

/* Column badges - uncomment to use custom sprites */
--ace-badge-url: url('/meridian-master/assets/ace-badge@2x.png');
--king-badge-url: url('/meridian-master/assets/king-badge@2x.png');

/* Game board background - change to use custom sprite */
--gamestage-url: url('/meridian-master/assets/custom-gameboard@2x.png');
```

---

## Asset Specifications for Designers

### 1. Card Sprite Sheet (REQUIRED)

| Property | @2x (High-DPI) |
|----------|----------------|
| **Filename** | `cardspritesheet@2x.png` |
| **Dimensions** | 2080 × 1120 px |
| **Grid** | 13 columns × 5 rows |
| **Cell Size** | 160 × 224 px |
| **Format** | PNG-24 with transparency |
| **CSS Display Size** | 1040 × 560 px (via background-size) |

**Grid Layout:**
```
Row 0 (y=0):     Hearts    (A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K)
Row 1 (y=224):   Diamonds  (A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K)
Row 2 (y=448):   Clubs     (A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K)
Row 3 (y=672):   Spades    (A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K)
Row 4 (y=896):   Card Back (only column 6 is used: position -960px -896px)
```

**Card Design Notes:**
- Corner radius: 12px (baked into sprite, appears as 6px when scaled)
- No padding between cells
- Card back should be decorative/branded

---

### 2. Track Backgrounds (OPTIONAL)

Tracks are the vertical lanes where tableau cards stack. Each track type has a distinct visual style.

| Track Type | Filename | Purpose | CSS Fallback |
|------------|----------|---------|--------------|
| Ace Track | `aces-up@2x.png` | Columns that build A→6 | Light blue tint (upward) |
| King Track | `kings-down@2x.png` | Columns that build K→7 | Deep blue tint (downward) |
| Traditional Track | `default-down@2x.png` | Flexible direction columns | Blue-grey gradient |
| Empty Track | `empty@2x.png` | Empty/available columns | Dark blue inset |

**Track Specifications:**

| Property | Value |
|----------|-------|
| **Width** | 160 px (matches card width @2x) |
| **Height** | 580 px (track height @2x) |
| **Format** | PNG-24 with transparency |
| **CSS Display Size** | 80 × 290 px (via background-size) |

**Design Guidelines (v2.2+ Blue Theme):**
- Ace tracks: Light/cyan blue tones (#E3F2FD), upward visual flow
- King tracks: Deep blue tones (#0D47A1), downward visual flow
- Traditional: Blue-grey neutral
- Empty: "Drop here" indicator, dashed or dotted style
- All tracks: Semi-transparent to blend with game board

**Legacy Guidelines (Pre-v2.2):**
- Ace tracks: Warm/gold tones, upward visual flow
- King tracks: Cool/silver tones, downward visual flow

---

### 3. Column Badges (OPTIONAL)

Badges appear at the anchor position of ace/king columns (top for ace, bottom for king).

| Badge Type | Filename | Purpose |
|------------|----------|---------|
| Ace Badge | `ace-badge@2x.png` | Marks ace column anchor (top) |
| King Badge | `king-badge@2x.png` | Marks king column anchor (bottom) |

**Badge Specifications:**

| Property | Value |
|----------|-------|
| **Width** | 160 px (matches card width @2x) |
| **Height** | 224 px (matches card height @2x) |
| **Format** | PNG-24 with transparency |
| **CSS Display Size** | 80 × 112 px (via background-size) |

**Design Guidelines:**
- Should be subtle, not compete with cards
- Ace: "A" symbol or upward arrow motif
- King: "K" symbol or crown motif
- Semi-transparent to blend with track

---

### 4. Game Board Background (REQUIRED)

Full background for the play area. Currently using `mm-gameboard@2x.png`.

| Property | @2x (High-DPI) |
|----------|----------------|
| **Filename** | `mm-gameboard@2x.png` |
| **Dimensions** | 2560 × 1440 px |
| **Format** | PNG-24 |
| **CSS Display Size** | Full viewport (via background-size: 100% 100%) |

**Design Guidelines (v2.2+ Blue Casino Theme):**
- Deep blue theme (current: `#0D1B2A` deep blue)
- Should not compete with cards
- Can include subtle texture or pattern
- Consider leaving track areas transparent for layering
- Must match current layout exactly
- Gradient suggestion: `#0A1628` (top) → `#0D1B2A` (center) → `#1B2838` (bottom)

**Legacy Guidelines (Pre-v2.2):**
- Dark green theme (`#1720c3` blue felt was interim)

---

## Color Reference (v2.2+ Blue Casino Theme)

### Primary Palette

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Deepest Background | `#0A1628` | 10, 22, 40 | Darkest areas |
| Deep Background | `#0D1B2A` | 13, 27, 42 | Main background, game board |
| Surface | `#1B2838` | 27, 40, 56 | Cards, panels, buttons |
| Elevated | `#233347` | 35, 51, 71 | Hover states, active elements |
| Primary Accent | `#00D4FF` | 0, 212, 255 | Buttons, badges, highlights |
| Secondary Accent | `#00B8D4` | 0, 184, 212 | Hover accents |

### Semantic Colors

| State | Hex | RGB | Usage |
|-------|-----|-----|-------|
| Success | `#00E5FF` | 0, 229, 255 | Success states, win animation |
| Warning | `#FFB74D` | 255, 183, 77 | Warnings |
| Error | `#FF5252` | 255, 82, 82 | Errors, invalid moves |
| Info | `#448AFF` | 68, 138, 255 | Information |

### Track Colors (Ace/King Distinction)

| Type | Color | Opacity | Purpose |
|------|-------|---------|---------|
| Ace (Up) | `#E3F2FD` | 8% | Light = rising, ascending |
| King (Down) | `#0D47A1` | 15% | Dark = foundation, base |
| Neutral | `#1B2838` | 10% | Standard columns |
| Empty | `#0A1628` | 50% | Dashed, subtle |

### Text Colors

| Role | Color | Opacity | Contrast |
|------|-------|---------|----------|
| Primary | `#FFFFFF` | 100% | 15.8:1 (AAA) |
| Secondary | `#FFFFFF` | 70% | 10.2:1 (AAA) |
| Muted | `#FFFFFF` | 50% | 7.1:1 (AAA) |
| Disabled | `#FFFFFF` | 30% | 4.8:1 (AA) |

### Legacy Colors (Pre-v2.2)

| Name | Hex | Usage |
|------|-----|-------|
| Deep Green | `#003c00` | Background (old) |
| Gold Accent | `#c9a050` | UP foundations (old) |
| Silver Accent | `#7d92a1` | DOWN foundations (old) |

---

## CSS Variables Reference

All asset URLs are controlled via CSS custom properties in `:root`:

```css
/* Required - @2x assets with CSS downscaling */
--sprite-url: url('/meridian-master/assets/cardspritesheet@2x.png');
--gamestage-url: url('/meridian-master/assets/mm-gameboard@2x.png');

/* Optional - set to 'none' for CSS-only fallback */
--track-ace: none;
--track-king: none;
--track-default: none;
--track-empty: none;
--ace-badge-url: none;
--king-badge-url: none;
```

### Background-Size Scaling

```css
/* Cards: 2080x1120 @2x scaled to 1040x560 logical */
.card {
  background-image: var(--sprite-url);
  background-size: 1040px 560px;
}

/* Game board: Full viewport coverage */
.game-stage {
  background-image: var(--gamestage-url);
  background-size: 100% 100%;
}
```

---

## Dimension Reference (Responsive)

All dimensions derive from card width. At base size:

| Element | Logical Size | @2x Asset Size | Ratio to Card Width |
|---------|--------------|----------------|---------------------|
| Card Width | 80 px | 160 px | 1.0 |
| Card Height | 112 px | 224 px | 1.4 |
| Track Height | 290 px | 580 px | 3.625 |
| Column Gap | 20 px | - | 0.25 |
| Card Overlap | 16 px | - | 0.2 |

**Note:** Create assets at @2x dimensions. CSS `background-size` handles the downscaling.

---

## Export Checklist for Designers

When creating/updating assets:

### Required Assets (Must Have)
- [ ] Export `cardspritesheet@2x.png` at 2080×1120px
- [ ] Export `mm-gameboard@2x.png` at 2560×1440px

### Optional Assets (Only If Customizing)
- [ ] Export track sprites at 160×580px (@2x)
- [ ] Export badge sprites at 160×224px (@2x)

### All Assets
- [ ] Use PNG-24 for transparency, JPEG only for photos
- [ ] Verify alignment with grid system
- [ ] Test against dark background (`#0D1B2A` deep blue)
- [ ] Optimize file size (TinyPNG or similar)
- [ ] Place files in `/public/assets/`
- [ ] Verify browser downscaling quality at various viewport scales

---

## File Naming Convention

```
[category]-[name]@2x.[ext]       # High-DPI assets (only version needed)

Examples:
cardspritesheet@2x.png           (card faces and back - @2x)
mm-gameboard@2x.png              (game board background - @2x)
aces-up@2x.png                   (ace track background - @2x)
ace-badge@2x.png                 (ace column badge - @2x)
```

**Note:** The `@2x` suffix indicates high-DPI assets. CSS `background-size` automatically scales them down for all display densities. No 1× versions are needed.

---

## Migration Notes (v2.3.2)

The dual 1x/2x asset system was simplified to 2x-only in v2.3.2:

| Old Approach | New Approach |
|--------------|--------------|
| Two asset files (1x and 2x) | One @2x asset file |
| JavaScript runtime selection | CSS background-size scaling |
| 150 lines of asset selection code | Zero lines of JS |
| Conditional asset loading | Simple CSS variable |

**Benefits:**
- Reduced code complexity
- Consistent visual quality across all devices
- Smaller total file size (no duplicate 1x assets)
- Faster initial load (no JS asset selection)

---

*Document Version: 2.3.2*
*Created: 2026-01-23*
*Last Updated: 2026-01-29*
*Phase 5: Asset Independence [x] | Phase 6: High-DPI Support [x] | Phase 7: 2x-Only Simplification [x]*
