# [COMPLETED] Fix Asset Paths for Production Build

**Created:** 2026-01-29
**Status:** ✅ COMPLETED (2026-01-29)
**Priority:** High (blocks production deployment)

> **Note:** This plan has been implemented. See PROGRESS.md "Asset Path Fix for Production Builds" section for details.
> - Commit: `dd208bc`

---

## Problem Summary

Image assets (cardspritesheet.png, mm-gameboard.png) don't load in production builds. The build shows warnings:
```
cardspritesheet.png referenced in cardspritesheet.png didn't resolve at build time,
it will remain unchanged to be resolved at runtime
```

---

## Root Cause Analysis

### Current Setup

**Vite Config:**
```javascript
base: '/meridian-master/'
```

**CSS Variables (App.css:67,71):**
```css
--sprite-url: url('cardspritesheet.png');
--gamestage-url: url('mm-gameboard.png');
```

**File Locations:**
- Images: `public/assets/cardspritesheet.png`, `public/assets/mm-gameboard.png`
- CSS: `src/styles/App.css`

### The Problem

1. CSS is in `/src/styles/App.css`
2. `url('cardspritesheet.png')` is a **relative path** - looks for file relative to CSS location
3. No `cardspritesheet.png` exists in `/src/styles/`
4. Vite can't resolve it at build time → leaves URL unchanged
5. At runtime, the relative path may or may not resolve correctly depending on deployment

### Why It "Sometimes Works"

After build:
- CSS bundles to `dist/assets/index-*.css`
- Images copy to `dist/assets/*.png`
- Relative URL `url(cardspritesheet.png)` from CSS in `dist/assets/` WOULD find the image in `dist/assets/`

**But this is fragile** - it relies on coincidental directory structure, not proper asset handling.

---

## Solution Options

### Option A: Absolute Paths with Base URL (Recommended)

Use absolute paths that include the Vite base:

```css
--sprite-url: url('/meridian-master/assets/cardspritesheet.png');
--gamestage-url: url('/meridian-master/assets/mm-gameboard.png');
```

**Pros:** Simple, works immediately
**Cons:** Hardcodes base path - must change if base changes

---

### Option B: Move Assets to src/ and Import (Best Practice)

Move images to `src/assets/` and import in JavaScript:

```javascript
// In App.jsx or a dedicated assets module
import cardspritesheet from './assets/cardspritesheet.png';
import gameboard from './assets/mm-gameboard.png';

// Inject as CSS variables or inline styles
document.documentElement.style.setProperty('--sprite-url', `url(${cardspritesheet})`);
```

**Pros:** Vite handles hashing, versioning, base path automatically
**Cons:** More invasive change, requires moving files

---

### Option C: CSS Relative Path from public/ Root

Since `public/` files are served at root, use paths from root:

```css
--sprite-url: url('/assets/cardspritesheet.png');
--gamestage-url: url('/assets/mm-gameboard.png');
```

Then Vite should transform these with the base path during build.

**Note:** This may NOT work because CSS url() with leading `/` might not get base path prepended.

---

### Option D: Environment Variable Injection (Flexible)

Create a hook/utility that injects asset URLs with proper base path:

```javascript
// useAssetUrls.js
const BASE = import.meta.env.BASE_URL;
export const SPRITE_URL = `${BASE}assets/cardspritesheet.png`;
export const GAMEBOARD_URL = `${BASE}assets/mm-gameboard.png`;
```

Then apply via inline styles or CSS variable injection.

**Pros:** Automatically adapts to any base path
**Cons:** Requires JavaScript to run before assets load

---

## Recommended Approach: Use BASE_URL in JavaScript

The `useHighDPIAssets` hook already sets CSS variables dynamically. Update it to use `import.meta.env.BASE_URL` which Vite provides automatically.

### The Fix

**File:** `src/hooks/useHighDPIAssets.js`

Update all asset paths to prepend the base URL:

```javascript
const BASE = import.meta.env.BASE_URL; // '/meridian-master/' in this case

const cardSpriteUrl = (shouldUse2x || devicePixelRatio >= 1.5)
  ? `${BASE}assets/cardspritesheet@2x.png`
  : `${BASE}assets/cardspritesheet.png`;

const gameBoardUrl = shouldUse2x
  ? `${BASE}assets/mm-gameboard@2x.png`
  : `${BASE}assets/mm-gameboard.png`;

// ... same pattern for track sprites
```

**Also update CSS defaults** in `src/styles/App.css` (lines 67, 71) as fallback:

```css
--sprite-url: url('/meridian-master/assets/cardspritesheet.png');
--gamestage-url: url('/meridian-master/assets/mm-gameboard.png');
```

---

## Implementation

| Task | Model | File |
|------|-------|------|
| Add BASE_URL to useHighDPIAssets | Sonnet | `src/hooks/useHighDPIAssets.js` |
| Update CSS fallback paths | Haiku | `src/styles/App.css` |
| Verify build and preview | - | - |

### Files to Check for Other Asset References

```bash
grep -r "url(" src/styles/ src/components/ --include="*.css" --include="*.jsx"
```

---

## Testing

After fix:
1. `npm run build`
2. `npm run preview`
3. Open http://localhost:4173/meridian-master/
4. Verify card sprites and gameboard background load
5. Check Network tab for 404s

---

## Notes

- If base path changes in future, CSS paths must be updated
- Consider Phase 2 (dynamic base URL) for long-term flexibility
- High-DPI @2x assets should follow same pattern
