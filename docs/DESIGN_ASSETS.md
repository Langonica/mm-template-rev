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
| Track Backgrounds | Optional | CSS gradients provide fallback |
| Column Badges | Optional | CSS gradients provide fallback |
| Game Board Background | Optional | CSS gradient/solid color fallback |

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

| Property | Value |
|----------|-------|
| **Filename** | `cardspritesheet.png` |
| **Dimensions** | 1040 × 560 px |
| **Grid** | 13 columns × 5 rows |
| **Cell Size** | 80 × 112 px |
| **Format** | PNG-24 with transparency |

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

### 4. Game Board Background (OPTIONAL)

Full background for the play area.

| Property | Value |
|----------|-------|
| **Filename** | `gameboardonly.png` |
| **Dimensions** | 1280 × 720 px |
| **Format** | PNG-24 or JPEG |

**Design Guidelines:**
- Dark theme preferred (current: `#003c00` deep green)
- Should not compete with cards
- Can include subtle texture or pattern
- Consider leaving track areas transparent for layering

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

- [ ] Export at @1x base dimensions (listed above)
- [ ] Optional: Export @2x for retina displays
- [ ] Use PNG-24 for transparency, JPEG only for photos
- [ ] Verify alignment with grid system
- [ ] Test against dark background (#003c00)
- [ ] Optimize file size (TinyPNG or similar)
- [ ] Place files in `/public/assets/`
- [ ] Update CSS variables to enable new sprites

---

## File Naming Convention

```
[category]-[name].[ext]

Examples:
cardspritesheet.png     (card faces and back)
aces-up.png            (ace track background)
kings-down.png         (king track background)
default-down.png       (traditional track background)
empty.png              (empty track background)
ace-badge.png          (ace column badge)
king-badge.png         (king column badge)
gameboardonly.png      (game board background)
```

---

*Document Version: 2.0*
*Created: 2026-01-23*
*Last Updated: 2026-01-24*
*Phase 5: Asset Independence*
