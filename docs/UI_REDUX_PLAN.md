# UI Redux Implementation Plan

## Overview

Fix full-bleed screen scaling issues, remove obsolete headers/footers, restore back buttons, remove borders, and fix progress bar layout.

---

## ✅ Phase 1: Fix Full-Bleed Screen Scaling (COMPLETED)

### Problem
- Full-bleed screens (`HomeScreen`, `HowToPlayScreen`, `StatisticsScreen`, `CampaignScreen`) were siblings of `game-container`, so they didn't scale with the game's CSS transform
- Using `position: fixed` with `100vw/100vh` breaks the game's scaling system

### Solution
Move all full-bleed screens INSIDE `game-container` so they inherit the CSS transform scale.

### Changes Made

#### 1. FullBleedScreen Component
- **File**: `src/components/FullBleedScreen/FullBleedScreen.jsx`
- Changes:
  - Made headers optional (only render if `title`, `headerLeft`, or `headerRight` provided)
  - Back button automatically shown if `onClose` provided and no `headerLeft` specified
  - Fixed dimensions: 1280×720px to match game stage

#### 2. HowToPlayScreen
- **File**: `src/components/HowToPlayScreen/HowToPlayScreen.jsx`
- Changes:
  - No header title
  - Uses `headerLeft={null}` to show back button via FullBleedScreen
  - Tips tab now uses 2-column grid (no scrolling)

#### 3. StatisticsScreen  
- **File**: `src/components/StatisticsScreen/StatisticsScreen.jsx`
- Changes:
  - No header title
  - Reset button moved to Overview tab (not in header)
  - Uses `headerLeft={null}` to show back button

#### 4. CampaignScreen
- **File**: `src/components/CampaignScreen/CampaignScreen.jsx`
- Changes:
  - Uses FullBleedScreen without header
  - Back button inside content area (positioned absolutely)

#### 5. StalemateModal
- **File**: `src/components/StalemateModal/StalemateModal.jsx`
- Changes:
  - Uses FullBleedScreen without header
  - Centered content layout

#### 6. App.jsx Screen Positioning
- **File**: `src/App.jsx`
- Changes:
  - All screens (`HowToPlayScreen`, `StatisticsScreen`, `HomeScreen`, `CampaignScreen`) moved inside `game-container`
  - `PauseOverlay` moved inside `game-container` for proper scaling
  - Screens now scale with the game's CSS transform

---

## ✅ Phase 2: Remove Obsolete Headers/Footers, Restore Back Buttons (COMPLETED)

### Changes Made

#### FullBleedScreen.jsx
- Removed footer slot entirely
- Header is now optional - only renders if `title`, `headerLeft`, or `headerRight` provided
- Back button auto-renders in header left if `onClose` provided and no explicit `headerLeft`

#### HowToPlayScreen
- No header title
- Back button restored via `headerLeft={null}` → triggers FullBleedScreen default back button
- Tips tab: 2-column grid, no scroll

#### StatisticsScreen
- No header title  
- Reset button moved to Overview tab content (bottom of screen)
- Back button restored via `headerLeft={null}`

#### CampaignScreen
- Uses existing back button pattern (inside content, positioned absolutely)

#### HomeScreen
- No header bar
- Title area remains at top of content
- Version in footer area of content

#### CSS Updates
- Added `border: none` to all screen containers
- Removed borders from cards and containers

---

## Phase 3: Progress Bar Layout Fix (COMPLETED)

### Changes Made

#### HomeScreen Campaign Card
- Progress bar now takes full width
- Removed X/Y label from beside progress bar
- Uses empty `label=""` prop

---

## Phase 4: Visual Polish (OPTIONAL)

### Remaining Items
- [ ] Verify all screens render correctly at different viewport sizes
- [ ] Test back navigation on all screens
- [ ] Confirm scaling works at different aspect ratios
- [ ] Visual regression testing

---

## Summary of Changes

| Component | Header | Footer | Back Button | Notes |
|-----------|--------|--------|-------------|-------|
| FullBleedScreen | Optional | Removed | Auto if onClose | Fixed 1280×720 |
| HomeScreen | No | No | N/A | Title in content area |
| HowToPlayScreen | No | No | Yes (via FullBleedScreen) | 2-col Tips grid |
| StatisticsScreen | No | No | Yes (via FullBleedScreen) | Reset in Overview tab |
| CampaignScreen | No | No | Yes (custom) | Uses FullBleedScreen |
| StalemateModal | No | No | N/A | Centered layout |
| PauseOverlay | N/A | N/A | N/A | Fixed 1280×720, inside game-container |
| ConfirmDialog | N/A | N/A | N/A | Fixed 1280×720, centered |

---

## Testing Checklist

- [x] Build succeeds without errors
- [ ] Screens scale correctly with game-container transform
- [ ] Back buttons work on all screens
- [ ] Progress bar displays correctly in Campaign card
- [ ] No borders on cards/containers
- [ ] PauseOverlay scales properly
- [ ] ConfirmDialog scales properly
