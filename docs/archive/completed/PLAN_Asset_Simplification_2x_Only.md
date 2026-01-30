# [COMPLETE ✅] Asset Simplification: 2x-Only Strategy

## Overview

**Previous State:** Dual asset system (1x + 2x) with dynamic selection  
**Current State:** Single 2x asset set, browser downscaling  
**Goal:** Simplify codebase, reduce complexity, maintain visual quality  
**Status:** ✅ COMPLETE - Implemented 2026-01-29
**Result:** ~185 lines removed, consistent quality, simpler maintenance

---

## Pre-Implementation Review Checklist

- [x] All documentation updates identified (see list below)
- [x] Plan reviewed and approved
- [x] Implementation order confirmed
- [x] Rollback plan understood
- [x] **IMPLEMENTED** - All code and documentation changes complete

---

## Documentation Updates Required

### 📄 Root Level Docs
| Document | Status | Notes |
|----------|--------|-------|
| `SETUP.md` | ✅ **UPDATED** | Removed @1x asset references, added 2x-only explanation |
| `README.md` | ✅ **UPDATED** | Updated asset list comments to "2x only" |
| `CLAUDE.md` | ✅ **UPDATED** | Removed useHighDPIAssets from architecture, added 2x-only section |

### 📄 Design Documentation
| Document | Status | Notes |
|----------|--------|-------|
| `docs/guides/DESIGN_ASSETS.md` | ✅ **UPDATED** | Rewrote for 2x-only strategy with CSS background-size |
| `docs/ACTIVE/DESIGN_TOKENS.md` | ✅ **UPDATED** | Added 2x-only asset token section |
| `docs/ACTIVE/DESIGN_SYSTEM.md` | ✅ **UPDATED** | Added Asset Strategy section explaining 2x-only |
| `docs/DESIGN_GUIDE.html` | ✅ **UPDATED** | Updated asset specs, removed 1x references |
| `public/ASSET_PREVIEW.html` | ✅ **UPDATED** | Removed 1x previews, updated to 2x-only display |

### 📄 Active Plans & Progress
| Document | Status | Notes |
|----------|--------|-------|
| `docs/ACTIVE/PROGRESS.md` | ✅ **UPDATED** | Documented simplification as complete |
| `docs/ACTIVE/BACKLOG.md` | ✅ **UPDATED** | Marked as completed work |
| `docs/ACTIVE/CODE_QUALITY.md` | ✅ **UPDATED** | Noted code reduction from asset simplification |

### 📄 Archive (Historical Reference)
| Document | Update Required | Notes |
|----------|----------------|-------|
| `docs/archive/completed/CODE_AUDIT_HISTORY.md` | ❌ No change | Historical record stays as-is |

### 📄 This Plan
| Document | Status | Notes |
|----------|--------|-------|
| `docs/ACTIVE/PLAN_Asset_Simplification_2x_Only.md` | ✅ **ARCHIVED** | Moved to docs/archive/completed/ |

**Total docs to update:** 11  
**Estimated doc work:** 1-2 hours

---

## Current Asset System

| Asset | 1x Size | 2x Size | Ratio |
|-------|---------|---------|-------|
| cardspritesheet.png | 203 KB | 566 KB | 2.8x |
| mm-gameboard.png | 1.2 MB | 4.0 MB | 3.3x |

**Total current:** ~5.4 MB for both sets  
**Proposed:** ~4.6 MB for 2x-only (remove 1x: ~800 KB saved)

---

## Technical Analysis

### Browser Downscaling Quality

**Modern browsers handle downscaling excellently:**
- Uses high-quality interpolation (bicubic/Lanczos)
- GPU-accelerated on most devices
- No visible quality loss at reasonable scales (>50%)

**Our Use Case:**
- 2x assets = 2560×1440 gameboard, 2080×1120 sprites
- Max scale we support: 2.0× (2560×1440 viewport)
- Min scale: ~0.5× (640×360 viewport)

**Downscaling Range:** 100% → 50% of original  
**Quality Impact:** Negligible to none at these scales

### Performance Considerations

| Aspect | 1x/2x System | 2x-Only System |
|--------|--------------|----------------|
| Download Size | 5.4 MB (both sets) | 4.6 MB (2x only) |
| Memory Usage | Lower (1x on small screens) | Higher (always 2x) |
| GPU Memory | Lower | Higher (but manageable) |
| Runtime Logic | Complex (hook needed) | Simple (always use 2x) |
| Initial Render | Slower (decision + load) | Faster (direct load) |

**Memory Impact Analysis:**
- 2x gameboard in GPU: ~16 MB (RGBA 2560×1440)
- 2x sprites in GPU: ~9 MB (RGBA 2080×1120)
- Total GPU: ~25 MB
- **Conclusion:** Trivial on modern devices (phones have 2-8 GB RAM)

---

## Code Simplification

### Files to Remove/Modify

| File | Action | Lines Saved |
|------|--------|-------------|
| `useHighDPIAssets.js` | **Remove entirely** | ~150 |
| `App.jsx` | Remove hook usage | ~5 |
| `tokens.css` | Remove dynamic overrides | ~20 |
| `App.css` | Simplify asset refs | ~10 |

**Total simplification:** ~185 lines removed

### Current Complexity (useHighDPIAssets.js)

```javascript
// Dynamic detection, base URL handling, @1x vs @2x logic
const BASE = import.meta.env.BASE_URL;
const cardSpriteUrl = (shouldUse2x || devicePixelRatio >= 1.5)
  ? `${BASE}assets/cardspritesheet@2x.png`
  : `${BASE}assets/cardspritesheet.png`;
// Set CSS variables, handle errors, etc.
```

### Proposed Simplicity

```css
/* Just reference 2x assets directly */
--sprite-url: url('/meridian-master/assets/cardspritesheet@2x.png');
--gamestage-url: url('/meridian-master/assets/mm-gameboard@2x.png');
background-size: 1040px 560px; /* Half of 2080x1120 */
```

No JavaScript needed. No runtime decisions. No dynamic injection.

---

## Implementation Plan

### Phase 1: Preparation

1. **Verify 2x assets exist and work**
   - Confirm cardspritesheet@2x.png loads correctly
   - Confirm mm-gameboard@2x.png loads correctly
   - Test in browser at various scales

2. **Update CSS**
   ```css
   /* Before (dynamic) */
   --sprite-url: url('/meridian-master/assets/cardspritesheet.png');
   
   /* After (2x-only) */
   --sprite-url: url('/meridian-master/assets/cardspritesheet@2x.png');
   background-size: 1040px 560px; /* Key: tell browser to scale */
   ```

### Phase 2: Code Removal

1. **Delete useHighDPIAssets.js**
2. **Remove hook from App.jsx**
3. **Remove dynamic CSS injection**
4. **Remove 1x asset files** (cardspritesheet.png, mm-gameboard.png)

### Phase 3: Testing

| Test | Expected Result |
|------|-----------------|
| Load at 1.0× scale | Crisp graphics, slightly higher memory use |
| Load at 1.5× scale | Crisp graphics, optimal use case |
| Load at 2.0× scale | Native resolution, best quality |
| Mobile device | Works fine, GPU handles downscaling |
| Slow connection | Slightly longer download (~200KB more) |

---

## Pros and Cons

### ✅ Advantages

1. **Simpler codebase** - Remove 185 lines of asset management
2. **Fewer bugs** - No dynamic asset loading logic
3. **Faster initial render** - No JS execution, no CSS injection
4. **Consistent quality** - Always use best assets
5. **Future-proof** - 2x will become standard 1x as displays improve
6. **Slightly smaller total bundle** - Remove 1x files

### ⚠️ Disadvantages

1. **Higher memory usage** - Always load 2x (~25 MB GPU vs ~10 MB)
2. **Slower on very slow connections** - +200 KB initial download
3. **Overkill for tiny viewports** - 640×360 doesn't need 4K assets
4. **Battery impact** - Slightly higher GPU usage on mobile

---

## Recommendation

### ✅ YES - Simplify to 2x-only

**Rationale:**
- Modern devices have plenty of RAM/GPU
- 200 KB extra download is trivial on modern connections
- Code simplicity is worth the tradeoff
- No visual quality issues with downscaling
- Future displays will make 2x the baseline anyway

**When to implement:**
- After v2.3.2 stabilization is complete
- As part of v2.4.0 "simplification" release
- When we're confident in stability

**Risk Level:** LOW  
**Effort:** 1-2 hours  
**Reward:** Simpler code, easier maintenance

---

## Alternative: Keep Dual Assets but Simplify

If we want the best of both worlds:

```css
/* Always use 2x in CSS */
--sprite-url: url('/meridian-master/assets/cardspritesheet@2x.png');
background-size: 1040px 560px;

/* Delete useHighDPIAssets.js */
/* Delete 1x files */
/* Done - browser handles everything */
```

This gives us:
- ✅ Simple code (no JS asset management)
- ✅ Consistent behavior
- ⚠️ Always download 2x (but that's acceptable)

---

## Migration Checklist

- [x] Verify 2x assets work in all scenarios
- [x] Update CSS with correct `background-size`
- [x] Remove useHighDPIAssets.js
- [x] Remove hook from App.jsx
- [x] Delete 1x asset files
- [x] Test at 1.0×, 1.5×, 2.0× scales
- [x] Test on mobile
- [x] Verify build size reduction
- [x] Update documentation (11 files)

---

**Status:** Ready for implementation when we want to simplify  
**Decision:** Recommended - simplifies codebase significantly


---

## Detailed Documentation Update Instructions

### 1. SETUP.md Updates

**Search for:**
- `@1x` or `1x` asset references
- `cardspritesheet.png` (without @2x)
- `useHighDPIAssets` mentions

**Update:**
```markdown
# Before
Required assets:
- cardspritesheet.png (80×112 per card)
- cardspritesheet@2x.png (160×224 per card)
- mm-gameboard.png (1280×720)
- mm-gameboard@2x.png (2560×1440)

# After  
Required assets:
- cardspritesheet@2x.png (160×224 per card, browser downscales)
- mm-gameboard@2x.png (2560×1440, browser downscales)
```

### 2. README.md Updates

**Search for:**
- Asset list in project structure
- 1x/2x mentions

**Update:**
```markdown
# Before
public/
├── assets/
│   ├── cardspritesheet.png      # Card graphics
│   ├── cardspritesheet@2x.png   # HiDPI cards
│   ├── mm-gameboard.png         # Background
│   └── mm-gameboard@2x.png      # HiDPI background

# After
public/
├── assets/
│   ├── cardspritesheet@2x.png   # Card graphics (browser downscales)
│   ├── mm-gameboard@2x.png      # Background (browser downscales)
```

### 3. CLAUDE.md Updates

**Search for:**
- `useHighDPIAssets` in architecture section
- Hook descriptions

**Update:**
```markdown
# Before
useHighDPIAssets (scale, devicePixelRatio)
    └── Automatic @1x/@2x asset selection

# After
Note: Assets are 2x-only with browser downscaling.
No dynamic asset selection needed.
```

### 4. docs/guides/DESIGN_ASSETS.md Updates

**Major rewrite sections:**

#### Asset Specifications Table
```markdown
# Before
| Asset | 1x Dimensions | 2x Dimensions | Format |
|-------|---------------|---------------|--------|
| Card Sprite | 1040×560 | 2080×1120 | PNG |
| Game Board | 1280×720 | 2560×1440 | PNG |

# After
| Asset | Dimensions | Display Size | Format |
|-------|------------|--------------|--------|
| Card Sprite | 2080×1120 | 1040×560 (CSS downscale) | PNG |
| Game Board | 2560×1440 | 1280×720 (CSS downscale) | PNG |
```

#### Asset Workflow
```markdown
# Before
Design at 2x → Export 1x and 2x → Both go in public/assets/
→ useHighDPIAssets selects based on DPR

# After
Design at 2x → Export 2x only → Place in public/assets/
→ CSS background-size handles downscaling
```

### 5. docs/ACTIVE/DESIGN_TOKENS.md Updates

**Remove section:**
- Dynamic asset URL tokens
- `--sprite-url-1x`, `--sprite-url-2x` if present

**Update:**
```css
/* Before */
--sprite-url: var(--sprite-url-1x); /* Fallback */

/* After */
--sprite-url: url('/meridian-master/assets/cardspritesheet@2x.png');
background-size: 1040px 560px;
```

### 6. public/ASSET_PREVIEW.html Updates

**Remove:**
- 1x preview sections
- Toggle between 1x/2x

**Update:**
- Show only 2x assets
- Add note: "Browser downscales to 1x display size"
- Update displayed dimensions

### 7. docs/DESIGN_GUIDE.html Updates

**Search for:**
- Asset dimension tables
- 1x references

**Update:**
- All asset specs to 2x-only
- Remove dual-asset workflow
- Update CSS examples

### 8. docs/ACTIVE/PROGRESS.md Updates

**Add new section:**
```markdown
### Asset System Simplification - 2x-Only - COMPLETE ✅

**Objective:** Simplify from dual 1x/2x assets to single 2x set with browser downscaling.

**Changes:**
- Removed useHighDPIAssets.js hook (150 lines)
- Deleted 1x asset files (cardspritesheet.png, mm-gameboard.png)
- Updated CSS with background-size for downscaling
- Simplified asset management to CSS-only

**Benefits:**
- ~185 lines of code removed
- No runtime asset decisions
- Consistent quality across all viewports
- ~800 KB smaller total asset footprint

**Technical:**
- 2x assets display at half size via CSS background-size
- Browser handles high-quality downscaling
- GPU memory impact minimal on modern devices
```

### 9. docs/ACTIVE/BACKLOG.md Updates

**Add to completed items:**
```markdown
### ~~Asset System Simplification~~
**Resolved:** 2026-01-29 | Migrated from dual 1x/2x asset system to single 2x set with browser downscaling. Removed useHighDPIAssets.js hook and 1x files. CSS background-size handles display scaling. Codebase reduced by ~185 lines.
```

### 10. docs/ACTIVE/CODE_QUALITY.md Updates

**Add to recent improvements:**
```markdown
### Asset System Simplification
- **useHighDPIAssets.js:** Removed (150 lines)
- **Asset management:** Now CSS-only
- **Code reduction:** ~185 total lines removed
- **Complexity:** Reduced (no runtime asset decisions)
```

---

## Implementation Order

### Phase 1: Code Changes (30 min)
1. Update App.css with 2x-only references + background-size
2. Remove useHighDPIAssets.js
3. Remove hook from App.jsx
4. Delete 1x asset files
5. Test build

### Phase 2: Documentation (1-2 hours)
1. Update SETUP.md
2. Update README.md
3. Update CLAUDE.md
4. Update DESIGN_ASSETS.md
5. Update DESIGN_TOKENS.md
6. Update PROGRESS.md
7. Update BACKLOG.md
8. Update CODE_QUALITY.md
9. Regenerate ASSET_PREVIEW.html
10. Update DESIGN_GUIDE.html

### Phase 3: Verification (30 min)
1. Build and verify no errors
2. Test at multiple scales
3. Verify docs are consistent
4. Commit all changes

---

## Rollback Plan

If issues arise:
1. Revert commit
2. 1x assets restored from git history
3. useHighDPIAssets.js restored
4. CSS reverted to dynamic

**Risk:** Low - changes are isolated to asset loading

---

## Final Checklist Before Implementation

- [x] This plan reviewed and approved
- [x] All 11 documentation updates identified and understood
- [x] Implementation order confirmed
- [x] Rollback plan understood
- [x] Time allocated (2-3 hours total)
- [x] No other major work in progress
- [x] **IMPLEMENTED 2026-01-29**

**Status:** ✅ COMPLETE - All code and documentation changes finished. Plan archived.
