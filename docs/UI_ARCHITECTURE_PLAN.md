# UI Architecture Plan - Meridian Solitaire

## 1. Core Principles

- **Single Source of Scale**: Only game-container scales. All screens use % sizing
- **Zero Chrome**: No headers/footers outside 1280x720 bounds
- **Consistent Navigation**: Every screen has visible back button (except Home)
- **Borderless**: No borders on containers, use background colors only

## 2. Screen Container Pattern

```css
.screen {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;        /* Fills game-container */
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-deep);
  overflow: hidden;
}

.backButton {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  z-index: 100;
}
```

## 3. Implementation Phases

### Phase 1: Fix Infrastructure
- Move ALL screens inside game-container
- Remove FullBleedScreen header/footer
- Add explicit back buttons to each screen
- Fix game-wrapper border

### Phase 2: Fix Screens
- HomeScreen: Remove header, fix version placement, remove progress label
- HowToPlayScreen: Add back button, fix Tips to 3-column grid
- StatisticsScreen: Add back button, fix reset button placement
- CampaignScreen: Add back button

### Phase 3: Remove Borders
- Remove borders from all containers
- Remove borders from cards

### Phase 4: Verify
- Test scaling, navigation, no overflow

## 4. Current Issues to Fix

1. Back buttons missing - add explicit back button to each screen
2. Reset button in Statistics - move to content area
3. Progress bar cramped - remove X/Y label, bar takes full width
4. HomeScreen header - remove entirely
5. Version number - place inside HomeScreen content
6. Borders - remove all borders, use backgrounds only
