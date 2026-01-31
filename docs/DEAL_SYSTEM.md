# Deal System Architecture

## Overview

All games (campaign and random) now use the **30 curated campaign deals**. These are verified winnable deals that are adapted on-the-fly for any game mode.

---

## How It Works

### Deal Sources

```
src/data/deals/campaign/
├── tier1/           # 10 Easy deals (levels 1-10)
│   ├── level_01.json
│   └── ...
├── tier2/           # 10 Moderate deals (levels 11-20)
└── tier3/           # 10 Hard deals (levels 21-30)
```

### Mode Adaptation

The same base deal can be played in any mode:

| Mode | Pockets | Face Pattern | Adaptation |
|------|---------|--------------|------------|
| `classic` | 1 | All face up | Base deal as-is |
| `classic_double` | 2 | All face up | Add 2nd pocket |
| `hidden` | 1 | Face down pyramid | Flip cards face down |
| `hidden_double` | 2 | Face down pyramid | Add 2nd pocket + flip |

### Deal ID Generation

```
Original:    campaign_tier2_05
Classic:     campaign_tier2_05_as_classic
Hidden:      campaign_tier2_05_as_hidden
Double:      campaign_tier2_05_as_classic_double
```

---

## Data Flow

```
User selects mode
       ↓
System picks random tier based on difficulty preference
       ↓
Loads campaign deal (e.g., tier2/level_05.json)
       ↓
Adapt deal for mode (pockets, face up/down)
       ↓
Generate game state with adapted metadata
       ↓
Log: dealId = "campaign_tier2_05_as_hidden"
       ↓
Play game
       ↓
Log: initial state, all moves, final state
```

---

## Why This Matters

### For Players
- ✅ All deals are winnable (verified)
- ✅ Consistent quality across all modes
- ✅ Fair challenge at chosen difficulty

### For Data Collection
- ✅ Every game has a traceable deal ID
- ✅ Can correlate outcomes with specific deals
- ✅ Compare same deal across modes
- ✅ Build difficulty profiles per deal

### For Simulation
- ✅ Known initial states
- ✅ Ground truth: deal is winnable
- ✅ Train AI on verified deals only
- ✅ Test generalization across modes

---

## Examples

### Same Deal, Different Modes

**Base Deal**: `campaign_tier2_03` (Moderate)

```javascript
// Classic mode
{
  dealId: "campaign_tier2_03_as_classic",
  pockets: 1,
  allUp: true,
  // Card layout identical to base
}

// Hidden Double mode  
{
  dealId: "campaign_tier2_03_as_hidden_double",
  pockets: 2,
  allUp: false,
  // Same cards, but face down in pyramid pattern
}
```

### Game Log Entry

```json
{
  "sessionId": "game_k9x2m4",
  "dealId": "campaign_tier2_03_as_hidden_double",
  "mode": "hidden_double",
  "difficulty": "moderate",
  "outcome": "won",
  "moves": 42,
  "initialState": {
    "tableau": { "0": ["7c"], "1": ["2d", "Kh"], ... },
    "columnTypes": ["traditional", "traditional", ...],
    "stockCount": 24
  },
  "finalState": {
    "foundations": 52,
    "emptyColumns": 2,
    "columnTypes": ["ace", "king", "traditional", ...]
  },
  "stats": {
    "foundationMoves": 28,
    "pocketStores": 3,
    "stockRecycles": 2
  }
}
```

---

## Implementation Details

### Key Functions

```javascript
// src/utils/dealPool.js

// Get random deal for any mode
async function getRandomDeal(mode, difficulty) {
  // 1. Map difficulty to tier
  // 2. Pick random campaign deal
  // 3. Adapt for mode
  // 4. Return with metadata
}

// Adapt deal for target mode
function adaptDealForMode(baseDeal, targetMode, difficulty) {
  // Adjust: pockets, allUp, columnState
  // Update: id, name, metadata
}
```

### Fallback Behavior

If campaign deal fails to load:
1. Log warning
2. Return null
3. `dealGenerator.js` falls back to pure random (for now)

**Future**: Remove fallback once pool is proven stable.

---

## Testing the System

### DEV Mode Console Commands

```javascript
// Check what deals are available
window.__GAME_LOG_STORAGE__.getAll()

// See recent games with deal IDs
window.__GAME_LOG_STORAGE__.getRecent(5)

// Export for analysis
window.__MERIDIAN_DEBUG__.export()
```

### Verification Steps

1. Start new game in any mode
2. Check console: `[DealPool] Using tierX level Y for mode difficulty`
3. Play and win/lose
4. Export data (triple-click version)
5. Verify JSON contains `dealId` with `_as_{mode}` suffix

---

## Future Enhancements

### Phase 3: Expand Pool
- Generate 100+ verified deals via Python solver
- Categorize by difficulty based on actual win data
- Add "pressure test" deals (intentionally challenging)

### Phase 4: Smart Deal Selection
- Track win rates per deal per mode
- Avoid deals player has recently played
- Difficulty ramping based on performance

### Phase 5: Deal Evolution
- Community-submitted deals (verified by solver)
- Seasonal/event deals
- Daily challenge deals

---

## Related Documentation

- `GAME_LOGGING_V2.md` - Comprehensive action tracking
- `DEAL_POOL_PLAN.md` - Overall deal pool architecture
- `NOTIFICATION_SYSTEM_DISABLED.md` - Why hints are off

---

*System Version: 2.0*
*Last Updated: 2026-01-29*
