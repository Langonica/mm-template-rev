# Plan: Touch Interaction Robustness

**Created:** 2026-01-29
**Status:** In Progress (Phase 1 Complete)
**Priority:** Medium-High (mobile UX quality)

---

## Current State Summary

The touch implementation in `useTouchDrag.js` is **functional and improving**:

| Aspect | Status | Notes |
|--------|--------|-------|
| Long-press detection | ✅ Working | 100ms delay, 10px threshold |
| Ghost element drag | ✅ Lightweight | Built from card data, no DOM cloning (Phase 3) |
| Drop target detection | ✅ Robust | Uses data attributes (Phase 1 complete) |
| Multi-touch | ✅ Handled | Cancels drag cleanly with feedback (Phase 2) |
| Touch affordance | ✅ Implemented | First-time hint on quick tap (Phase 4) |
| Accessibility | ❌ Missing | No ARIA labels for touch state |

---

## Key Problems Identified

### ~~1. Drop Target Detection Fragility (High Priority)~~ ✅ RESOLVED

**Problem:** Used hardcoded constants for column detection.

**Solution Implemented:** Data attributes on drop zones (`data-drop-zone`, `data-column-index`, `data-pocket-num`). `findDropTargetAtPosition()` now uses `element.closest('[data-drop-zone]')` pattern.

### ~~2. Ghost Element Memory Risk (Medium Priority)~~ ✅ RESOLVED

**Problem:** `cloneNode(true)` copied all event listeners, potential memory leak.

**Solution Implemented:** Lightweight ghost built from card data using `parseCard()`. No DOM cloning - creates minimal div with sprite background position.

### ~~3. Multi-Touch Confusion (Medium Priority)~~ ✅ RESOLVED

**Problem:** Second finger touches were silently ignored.

**Solution Implemented:** Multi-touch detection in `handleTouchStart` and `handleTouchMove`. If second finger touches during drag, cancel immediately with haptic feedback (30ms vibration).

### ~~4. No Touch Affordance (Medium Priority)~~ ✅ RESOLVED

**Problem:** New users didn't know cards require long-press to drag.

**Solution Implemented:** First-time user hint system with localStorage persistence. Shows "Hold cards to drag them" toast on quick tap until first successful drag.

### ~~5. Stale Valid Targets (Low-Medium Priority)~~ ✅ ALREADY RESOLVED

**Problem:** Concern about valid targets being stale.

**Status:** Already handled - `isValidTarget(target)` is called at drop time in `handleTouchEnd`, using current game state.

### 6. Deprecated Haptic API (Low Priority)

**Problem:** Uses `navigator.vibrate()` which still works but is older pattern.

**Solution:** Add feature detection, graceful fallback.

---

## Implementation Phases

### Phase 1: Drop Target Detection Refactor (Critical) ✅ COMPLETE

**Goal:** Eliminate hardcoded layout constants, use data attributes.

**Completed 2026-01-29:**

| File | Change |
|------|--------|
| `Column.jsx` | Added `data-drop-zone="column"` and `data-column-index` to lane-track and empty-column-zone |
| `Foundation.jsx` | Already had `data-foundation-type` and `data-suit` (no changes needed) |
| `StockWaste.jsx` | Added `data-drop-zone="pocket"` and `data-pocket-num` to both pocket slots |
| `useTouchDrag.js` | Refactored `findDropTargetAtPosition()` to use `dataset` properties |

**Result:** Drop target detection now decoupled from CSS layout. No hardcoded pixel constants.

---

### Phase 2: Multi-Touch Handling ✅ COMPLETE

**Goal:** Gracefully handle multi-touch scenarios.

**Completed 2026-01-29:**

| File | Change |
|------|--------|
| `useTouchDrag.js` | Added `e.touches.length > 1` checks in both `handleTouchStart` and `handleTouchMove` |

**Behavior:**
- Multi-touch at drag start → ignored, no drag initiated
- Multi-touch during drag → cancel drag with 30ms haptic feedback
- Multi-touch during long-press wait → cancel pending drag

---

### Phase 3: Lightweight Ghost Element ✅ COMPLETE

**Goal:** Reduce memory risk from cloneNode.

**Completed 2026-01-29:**

| File | Change |
|------|--------|
| `useTouchDrag.js` | Replaced `cloneNode(true)` with lightweight div built from `parseCard()` |

**Implementation:**
- Import `parseCard` from cardUtils
- Calculate sprite position: `cardData.v * 80, cardData.s * 112`
- Create minimal div with `background-image: var(--sprite-url)` and computed position
- No event listeners copied, minimal DOM footprint

---

### Phase 4: Touch Affordance (First-Time UX) ✅ COMPLETE

**Goal:** Help new users discover long-press drag.

**Completed 2026-01-29:**

| File | Change |
|------|--------|
| `useTouchDrag.js` | Added `showDragHint`, `dismissDragHint`, localStorage tracking |
| `App.jsx` | Added hint toast UI with auto-dismiss |

**Implementation:**
- Track `meridian_touch_drag_used` in localStorage
- On quick tap (under 100ms), show hint if not used before
- Auto-dismiss after 3 seconds, or on click
- Mark localStorage after first successful drop

---

### Phase 5: Re-validate on Drop ✅ ALREADY IMPLEMENTED

**Goal:** Ensure move is still valid when finger lifts.

**Status:** Already implemented at line 359 of useTouchDrag.js:
```javascript
if (target && isValidTarget && isValidTarget(target)) {
  // Successful drop
  if (onDrop) { onDrop(target); }
```

The `isValidTarget` function is called at drop time with current game state.

---

### Phase 6: Accessibility Improvements (Optional)

**Goal:** ARIA labels for touch drag state.

**Changes:**
- Add `aria-grabbed` to dragged card
- Add `aria-dropeffect` to valid targets
- Announce drag start/end to screen readers

**Estimate:** Medium complexity

---

## Implementation Order

| Phase | Task | Model | Priority | Status |
|-------|------|-------|----------|--------|
| 1 | Drop target data attributes | Sonnet | Critical | ✅ Complete |
| 2 | Multi-touch cancellation | Haiku | High | ✅ Complete |
| 3 | Lightweight ghost element | Sonnet | Medium | ✅ Complete |
| 4 | Touch affordance tooltip | Sonnet | Medium | ✅ Complete |
| 5 | Re-validate on drop | Haiku | Medium | ✅ Already implemented |
| 6 | Accessibility (ARIA) | Sonnet | Low | Pending (optional) |

---

## Files to Modify

```
src/hooks/useTouchDrag.js       - Core touch logic (Phases 1-3, 5)
src/components/Column/Column.jsx - Data attributes (Phase 1)
src/components/Foundation/Foundation.jsx - Data attributes (Phase 1)
src/components/StockWaste/StockWaste.jsx - Data attributes (Phase 1)
src/components/Card/Card.jsx    - Touch affordance (Phase 4)
src/styles/App.css              - Ghost styles, affordance animation
```

---

## Testing Checklist

After implementation:

- [ ] Long-press drag works on iOS Safari
- [ ] Long-press drag works on Android Chrome
- [ ] Drop detection accurate for all 7 columns
- [ ] Drop detection accurate for all 8 foundations
- [ ] Drop detection accurate for pockets
- [ ] Multi-touch cancels drag cleanly
- [ ] Ghost element removed after drag
- [ ] No memory leaks after 50+ drags
- [ ] First-time user sees affordance hint
- [ ] Haptic feedback on supported devices

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing touch | Medium | High | Extensive testing on real devices |
| Performance regression | Low | Medium | Profile before/after |
| Layout changes break detection | Low (with data attrs) | Low | Data attributes decouple from CSS |

---

## Success Metrics

- Zero hardcoded layout constants in touch detection
- Multi-touch handled gracefully
- First-time users successfully drag within 3 attempts
- No touch-related bug reports post-launch

---

*Plan created after investigation of useTouchDrag.js and related components.*
