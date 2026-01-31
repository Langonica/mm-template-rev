# Game Logging System v2.0

Comprehensive player action tracking for simulation development.

---

## Problem Identified

The original logging system was incomplete:
- ❌ Foundation placements weren't logged (only completions)
- ❌ Stock cycles showed as 0 even in won games
- ❌ Pocket usage not tracked
- ❌ Column conversions not tracked
- ❌ Notification tracking was meaningless (system disabled)

---

## Solution: Complete Action Tracking

### Tracked Actions

| Action | Function | Data Captured |
|--------|----------|---------------|
| **Card Move** | `logCardMove()` | Card, from/to location, column types, move number |
| **Foundation Place** | `logFoundationPlacement()` | Card, suit, direction, pile size (1-13) |
| **Pocket Action** | `logPocketAction()` | Store/retrieve, card, pocket number |
| **Column Convert** | `logColumnConversion()` | Column, from/to type, trigger card |
| **Stock Draw** | `logStockDraw()` | Card drawn, cards remaining |
| **Stock Recycle** | `logStockRecycle()` | Waste size, cycle number |
| **Undo** | `logUndo()` | Move number undone |

---

## Files Changed

### New/Updated Source Files

| File | Change |
|------|--------|
| `src/utils/gameLogStorage.js` | **Complete rewrite** - Comprehensive action logging |
| `src/hooks/useCardGame.js` | Added callbacks for move, stock draw, stock recycle |
| `src/App.jsx` | Logging callback implementations |

### Updated Analysis Tools

| File | Change |
|------|--------|
| `tools/analyze_game_logs.py` | **v2.0** - Analyzes all action types, removed notification tracking |
| `tools/analyze_test_data.py` | **v2.0** - Career stats only, removed notification tracking |

---

## Data Structure

### Session Object
```json
{
  "sessionId": "game_abc123",
  "mode": "classic",
  "outcome": "won",
  "moves": 42,
  "duration": 180,
  "initialState": { "tableau": {...}, "stockCount": 24 },
  "finalState": { "foundations": 52, "emptyColumns": 2 },
  "stats": {
    "totalMoves": 42,
    "foundationMoves": 28,
    "tableauMoves": 8,
    "pocketStores": 2,
    "pocketRetrieves": 2,
    "stockDraws": 24,
    "stockRecycles": 3,
    "undoCount": 0,
    "foundationsCompleted": 8,
    "columnConversions": 1
  },
  "events": [
    {"type": "CARD_MOVE", "card": "Ah", "from": {...}, "to": {...}},
    {"type": "FOUNDATION_PLACE", "card": "Ah", "suit": "h", "pileSize": 1},
    {"type": "POCKET", "action": "store", "card": "Kd", "pocketNum": 1},
    {"type": "STOCK_RECYCLE", "cycleNumber": 2, "wasteSize": 24},
    ...
  ]
}
```

---

## Usage

### For Testers
1. Play games normally
2. Triple-click version on HomeScreen to export
3. Send `.json` file via Discord/email

### For Analysis
```bash
# Quick career stats
python3 tools/analyze_test_data.py exports/*.json

# Comprehensive action analysis
python3 tools/analyze_game_logs.py exports/*.json

# Export for simulation training
python3 tools/analyze_game_logs.py exports/*.json -e training.json
```

### Output Examples

**Career Overview:**
```
📊 Session Telemetry:
  Games: 50
  Wins: 32 (64.0%)
  Avg Moves (Win): 38.5
  
🎮 By Mode:
  classic              30 games  70.0% wins  35.2 avg moves
  hidden               20 games  55.0% wins  45.8 avg moves
```

**Detailed Actions:**
```
📊 Move Breakdown:
  Total Moves: 42
  To Foundation: 28
  To Tableau: 8
  Stock Draws: 24
  Stock Recycles: 3 (cycles: 3)

🎒 Pocket Usage:
  Stores: 2
  Retrieves: 2

🏛️  Foundation Progress:
  Cards Placed: 52
  Foundations Completed: 8/8
```

---

## Simulation Applications

This data enables:

1. **Win Pattern Analysis**
   - What move sequences lead to wins?
   - Optimal foundation timing
   - Pocket usage effectiveness

2. **Difficulty Calibration**
   - Actual move counts for easy/moderate/hard
   - Stock cycle distributions
   - Undo frequency by difficulty

3. **AI Training Data**
   - State → Action → Outcome mappings
   - Column conversion strategies
   - Foundation vs tableau priorities

4. **Deal Generation**
   - Identify "interesting" game states
   - Validate generated deals are winnable
   - Tune difficulty parameters

---

## Next Steps

1. Collect 50+ games from 3+ testers
2. Analyze win/loss patterns
3. Validate data quality (check foundation counts match)
4. Use insights to inform Python generator
5. Generate verified deal pool

---

*Version: 2.0*
*Updated: 2026-01-29*
