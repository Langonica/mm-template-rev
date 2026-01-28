# Design Assets Specification

This document catalogs all visual assets for Meridian Solitaire and provides specifications for designers creating new assets.

---

## Asset Independence (Phase 5)

**The game now works with CSS-only styling by default.** All track backgrounds, plinths, and placeholders use CSS gradients. This means:

- The game runs without any custom sprite assets (except card faces)
- Designers can create new sprites at their own pace
- Sprites can be easily swapped by updating CSS variables

### Required vs Optional Assets

| Asset Type | Status | Notes |
|------------|--------|-------|
| Card Sprite Sheet | **REQUIRED** | Cards cannot be rendered without this |
| Card Sprite Sheet @2x | **REQUIRED** | For crisp cards on high-DPI/scaled displays |
| Game Board Background | **REQUIRED** | `mm-gameboard.png` - active in current build |
| Game Board Background @2x | **REQUIRED** | For crisp background on high-DPI/scaled displays |
| Track Backgrounds | Optional | CSS gradients provide fallback |
| Track Backgrounds @2x | Optional | Only if using custom track sprites |
| Column Badges | Optional | CSS gradients provide fallback |
| Column Badges @2x | Optional | Only if using custom badge sprites |

---

## How to Enable Custom Sprites

Edit `src/styles/App.css` and uncomment the relevant URL variables:

```css
/* Track backgrounds - uncomment to use custom sprites */
--track-ace: url('/assets/aces-up.png');
--track-king: url('/assets/kings-down.png');
--track-default: url('/assets/default-down.png');
--track-empty: url('/assets/empty.png');

/* Column badges - uncomment to use custom sprites */
--ace-badge-url: url('/assets/ace-badge.png');
--king-badge-url: url('/assets/king-badge.png');

/* Game board background - uncomment to use custom sprite */
--gamestage-url: url('/assets/gameboardonly.png');
```

---

## Asset Specifications for Designers

### 1. Card Sprite Sheet (REQUIRED)

| Property | 1× (@1x) | 2× (@2x) |
|----------|----------|----------|
| **Filename** | `cardspritesheet.png` | `cardspritesheet@2x.png` |
| **Dimensions** | 1040 × 560 px | 2080 × 1120 px |
| **Grid** | 13 columns × 5 rows | 13 columns × 5 rows |
| **Cell Size** | 80 × 112 px | 160 × 224 px |
| **Format** | PNG-24 with transparency | PNG-24 with transparency |

**Grid Layout:**
```
Row 0 (y=0):    Hearts    (A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K)
Row 1 (y=112):  Diamonds  (A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K)
Row 2 (y=224):  Clubs     (A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K)
Row 3 (y=336):  Spades    (A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K)
Row 4 (y=448):  Card Back (only column 6 is used: position -480px -448px)
```

**Card Design Notes:**
- Corner radius: 6px (baked into sprite)
- No padding between cells
- Card back should be decorative/branded

---

### 2. Track Backgrounds (OPTIONAL)

Tracks are the vertical lanes where tableau cards stack. Each track type has a distinct visual style.

| Track Type | Filename | Purpose | CSS Fallback |
|------------|----------|---------|--------------|
| Ace Track | `aces-up.png` | Columns that build A→6 | Gold gradient (upward) |
| King Track | `kings-down.png` | Columns that build K→7 | Silver gradient (downward) |
| Traditional Track | `default-down.png` | Flexible direction columns | Neutral gradient |
| Empty Track | `empty.png` | Empty/available columns | Subtle inset |

**Track Specifications:**

| Property | Value |
|----------|-------|
| **Width** | 80 px (matches card width) |
| **Height** | 290 px (track height) |
| **Format** | PNG-24 with transparency |

**Design Guidelines:**
- Ace tracks: Warm/gold tones, upward visual flow
- King tracks: Cool/silver tones, downward visual flow
- Traditional: Neutral, subtle pattern
- Empty: "Drop here" indicator, dashed or dotted style

---

### 3. Column Badges (OPTIONAL)

Badges appear at the anchor position of ace/king columns (top for ace, bottom for king).

| Badge Type | Filename | Purpose |
|------------|----------|---------|
| Ace Badge | `ace-badge.png` | Marks ace column anchor (top) |
| King Badge | `king-badge.png` | Marks king column anchor (bottom) |

**Badge Specifications:**

| Property | Value |
|----------|-------|
| **Width** | 80 px (matches card width) |
| **Height** | 112 px (matches card height) |
| **Format** | PNG-24 with transparency |

**Design Guidelines:**
- Should be subtle, not compete with cards
- Ace: "A" symbol or upward arrow motif
- King: "K" symbol or crown motif
- Semi-transparent to blend with track

---

### 4. Game Board Background (REQUIRED)

Full background for the play area. Currently using `mm-gameboard.png`.

| Property | 1× (@1x) | 2× (@2x) |
|----------|----------|----------|
| **Filename** | `mm-gameboard.png` | `mm-gameboard@2x.png` |
| **Dimensions** | 1280 × 720 px | 2560 × 1440 px |
| **Format** | PNG-24 | PNG-24 |

**Design Guidelines:**
- Dark theme preferred (current: `#1720c3` blue felt)
- Should not compete with cards
- Can include subtle texture or pattern
- Consider leaving track areas transparent for layering
- Must match current `mm-gameboard.png` layout exactly (just higher resolution)

---

## Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| Deep Green | `#003c00` | Background |
| Gold Accent | `#c9a050` | UP foundations, ace columns |
| Silver Accent | `#7d92a1` | DOWN foundations, king columns |
| Surface | `#1a1f26` | UI elements |
| Valid Target | `#4caf50` | Drop target highlight |

---

## CSS Variables Reference

All asset URLs are controlled via CSS custom properties in `:root`:

```css
/* Required */
--sprite-url: url('/assets/cardspritesheet.png');

/* Optional - set to 'none' for CSS-only fallback */
--track-ace: none;
--track-king: none;
--track-default: none;
--track-empty: none;
--ace-badge-url: none;
--king-badge-url: none;
--gamestage-url: none;
```

---

## Dimension Reference (Responsive)

All dimensions derive from card width. At base size:

| Element | Pixels | Ratio to Card Width |
|---------|--------|---------------------|
| Card Width | 80 px | 1.0 |
| Card Height | 112 px | 1.4 |
| Track Height | 290 px | 3.625 |
| Column Gap | 20 px | 0.25 |
| Card Overlap | 16 px | 0.2 |

**For @2x retina assets, double all dimensions.**

---

## Export Checklist for Designers

When creating/updating assets:

### Required Assets (Must Have)
- [ ] Export `cardspritesheet.png` at 1× (1040×560px)
- [ ] Export `cardspritesheet@2x.png` at 2× (2080×1120px)
- [ ] Export `mm-gameboard.png` at 1× (1280×720px)
- [ ] Export `mm-gameboard@2x.png` at 2× (2560×1440px)

### Optional Assets (Only If Customizing)
- [ ] Export track sprites at 1× (80×290px) and 2× (160×580px)
- [ ] Export badge sprites at 1× (80×112px) and 2× (160×224px)

### All Assets
- [ ] Use PNG-24 for transparency, JPEG only for photos
- [ ] Verify alignment with grid system
- [ ] Test against dark background (`#1720c3` blue felt)
- [ ] Optimize file size (TinyPNG or similar)
- [ ] Place files in `/public/assets/`
- [ ] Ensure @2x versions match @1x layout exactly (just doubled)

---

## File Naming Convention

```
[category]-[name].[ext]          # 1× assets
[category]-[name]@2x.[ext]       # 2× (retina) assets

Examples:
cardspritesheet.png              (card faces and back - 1×)
cardspritesheet@2x.png           (card faces and back - 2×)
mm-gameboard.png                 (game board background - 1×)
mm-gameboard@2x.png              (game board background - 2×)
aces-up.png                      (ace track background - 1×)
aces-up@2x.png                   (ace track background - 2×)
ace-badge.png                    (ace column badge - 1×)
ace-badge@2x.png                 (ace column badge - 2×)
```

**Note:** The `@2x` suffix is standard convention for retina/high-DPI assets. CSS and JS will automatically select the appropriate version based on device pixel ratio.

---

*Document Version: 2.1*
*Created: 2026-01-23*
*Last Updated: 2026-01-28*
*Phase 5: Asset Independence ✅ | Phase 6: High-DPI Support ✅*
