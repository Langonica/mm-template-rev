# Game State Notification System - DISABLED

**Date**: 2026-01-29  
**Version**: 2.3.2+  
**Status**: DISABLED pending reliability improvements

---

## Why Disabled

The game state notification system (stalemate detection, tiered warnings) exhibited critical reliability issues:

- **0% accuracy rate** - All tier triggers were false positives
- **Forfeit during win** - Players reported forfeit/stalemate screens appearing while completing foundations
- **Interrupts gameplay** - Overlays appearing at inappropriate times
- **No true positives** - System never correctly identified an actual unwinnable state

---

## What Was Disabled

### Detection Logic
- `calculateNotificationTier()` - Still runs but output ignored
- `runUnwinnableCheck()` - Disabled when system is off
- `updateGameStateNotification()` - Returns 'none' tier always

### User-Facing Features
- `GameStateToast` - Hints and concern notifications
- `GameStateOverlay` - Warning tier (dismissible)
- `StalemateModal` - Confirmed unwinnable state

**Note**: All UI components remain in codebase, just never triggered.

---

## What's Preserved

All components, styles, and logic remain intact for future re-enable:

```
src/components/GameStateToast/     # UI preserved
src/components/GameStateOverlay/   # UI preserved
src/components/StalemateModal/     # UI preserved
src/hooks/useCardGame.js           # Logic preserved, gated by flag
src/utils/gameLogic.js             # Detection algorithms preserved
```

---

## How to Re-enable

### Temporary (Current Session)
```javascript
// In browser console (DEV mode)
window.__NOTIFICATION_CONFIG__.setEnabled(true)
location.reload()
```

### Permanent (Code Change)
```javascript
// src/utils/notificationConfig.js
// Change default:
export function isNotificationSystemEnabled() {
  return true  // Instead of checking localStorage
}
```

---

## Path Forward

### Option 1: AI-Based Detection
- Train model on game logs from Phase 2.5 data collection
- Predict unwinnable states based on move patterns
- More nuanced than cycle counting

### Option 2: Improved Heuristics
- Use solver verification (when Python generator ready)
- Better productivity detection (not just foundation moves)
- Context-aware thresholds (mode-specific)

### Option 3: Hybrid
- Heuristics for quick hints
- Solver for definitive unwinnable detection
- Telemetry-driven threshold tuning

---

## Technical Details

### Disable Flag Location
```javascript
// src/utils/notificationConfig.js
const ENABLED_KEY = 'meridian-notification-enabled'

export function isNotificationSystemEnabled() {
  // Default to DISABLED
  const enabled = localStorage.getItem(ENABLED_KEY)
  return enabled === 'true'
}
```

### Gate in useCardGame
```javascript
// src/hooks/useCardGame.js
if (!isNotificationSystemEnabled()) {
  setGameStateNotification(prev => ({
    ...prev,
    tier: 'none',  // Always 'none'
    // ... tracking data still updated
  }));
  return 'none';
}
```

### Result
- `circularPlayState.tier` always `'none'`
- No toasts, overlays, or modals appear
- Game state tracking still runs (for data collection)
- Can re-enable without code change via localStorage

---

## References

- Issue: False positives during winning games
- Related: Phase 2.5 data collection for future AI system
- Components: GameStateToast, GameStateOverlay, StalemateModal
