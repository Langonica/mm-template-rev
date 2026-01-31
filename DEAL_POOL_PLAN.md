# Meridian Solitaire: Deal Pool Architecture Plan

## Overview

This document outlines the strategic transition from random deal generation to a curated, verified deal pool system that supports both campaign progression and random play modes.

## Current State

| Component | Status | Notes |
|-----------|--------|-------|
| 30 Campaign Snapshots | ✅ Verified | Hand-curated, sequential difficulty |
| Random Deal Generator | ⚠️ Unverified | Pure random, ~5-10% winnable |
| Stats System | ✅ Active | localStorage-based, comprehensive |
| Telemetry | ✅ DEV-only | Notification tuning data |
| Python Solver | 🚧 In Progress | BFS solver, fixing winnability detection |

## Goals

1. **Immediate**: Enable tester data collection to understand real gameplay patterns
2. **Short-term**: Replace random deals with verified pool for better player experience
3. **Long-term**: Automated deal generation pipeline feeding the pool

---

## Phase 1: Tester Data Collection (Week 1) ✅ COMPLETE

### 1.1 Hidden Debug Export ✅
**Purpose**: Allow testers to share complete localStorage state for analysis

**Implementation**:
- Hidden button on HomeScreen (e.g., triple-click logo or secret key combo)
- Exports all localStorage keys to downloadable JSON
- Includes: stats, session, telemetry, campaign progress, settings

**Output Format**:
```json
{
  "exportedAt": "2026-01-29T22:30:00Z",
  "version": "2.3.2",
  "userAgent": "...",
  "data": {
    "meridian_solitaire_stats": { ... },
    "meridian_solitaire_session": { ... },
    "meridian-gs-telemetry": { ... },
    "meridian_campaign_progress": { ... }
  }
}
```

### 1.2 Game Lifecycle Logging ✅
**Purpose**: Track complete game sessions for analysis

**Logged Events**:
```javascript
[GAME_START] {gameId, timestamp, mode, dealId/seed, isCampaign}
[MOVE] {gameId, moveNumber, type, from, to, card, timestamp}
[UNDO] {gameId, moveNumber, timestamp}
[FOUNDATION] {gameId, suit, direction, cardCount, timestamp}
[STOCK_CYCLE] {gameId, cycleNumber, timestamp}
[NOTIFICATION] {gameId, tier, timestamp}
[GAME_END] {gameId, outcome, moves, duration, timestamp}
```

**Storage**: In-memory during game, dumped to console on game end (DEV only)

### 1.3 Implementation Details ✅

**Files Created**:
- `src/utils/debugExport.js` - LocalStorage export utility
- `src/utils/gameLogger.js` - Game lifecycle logging

**Files Modified**:
- `src/components/HomeScreen/HomeScreen.jsx` - Triple-click version trigger
- `src/App.jsx` - Logger integration, debug export handler

**Usage**:
```javascript
// Export tester data (DEV only)
window.__MERIDIAN_DEBUG__.export();  // Or triple-click version text

// Access logger
window.__GAME_LOGGER__.getCurrentLog();
window.__GAME_LOGGER__.dumpLog();
```

---

## Phase 2: Deal Pool Architecture (Week 2-3) ✅ COMPLETE

### 2.1 Directory Structure ✅

```
src/data/
├── snapshots/                    # Existing 30 campaign levels
│   ├── index.js                  # Current exports
│   └── snapshot_manifest.json    # [NEW] Registry
├── deals/                        # [NEW] Deal pool
│   ├── pool_manifest.json        # Master registry
│   ├── campaign/                 # Sequential campaign levels
│   │   ├── tier1/               # Levels 1-10 (Easy)
│   │   ├── tier2/               # Levels 11-20 (Moderate)
│   │   └── tier3/               # Levels 21-30 (Hard)
│   └── random/                   # Random play pool
│       ├── classic/
│       │   ├── easy/            # 100+ deals
│       │   ├── moderate/
│       │   └── hard/
│       ├── classic_double/
│       ├── hidden/
│       └── hidden_double/
```

### 2.2 Manifest Schema

**pool_manifest.json**:
```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-01-29",
  "stats": {
    "campaign": { "total": 30, "byTier": { "easy": 10, "moderate": 10, "hard": 10 } },
    "random": { "total": 400, "byMode": { "classic": 100, ... } }
  },
  "pools": {
    "campaign": {
      "tier1": { "path": "./campaign/tier1/", "count": 10, "difficulty": "easy" },
      "tier2": { "path": "./campaign/tier2/", "count": 10, "difficulty": "moderate" },
      "tier3": { "path": "./campaign/tier3/", "count": 10, "difficulty": "hard" }
    },
    "random": {
      "classic_easy": { "path": "./random/classic/easy/", "count": 50, "verified": true },
      "classic_moderate": { "path": "./random/classic/moderate/", "count": 50, "verified": true },
      ...
    }
  }
}
```

### 2.3 Deal Schema

Each deal file (e.g., `classic_easy_001.json`):
```json
{
  "id": "classic_easy_001",
  "metadata": {
    "mode": "classic",
    "difficulty": "easy",
    "source": "generated",  // or "curated", "manual"
    "seed": 12345,          // if generated
    "verified": true,
    "solutionLength": 42,   // if solved
    "winnable": true,
    "generatedAt": "2026-01-29T00:00:00Z"
  },
  "deal": {
    "tableau": { ... },
    "stock": [...],
    "foundations": { ... },
    "columnState": { ... }
  }
}
```

### 2.4 Loader Updates

**New utility**: `src/utils/dealPool.js`

```javascript
// Get random deal from pool (verified only)
export function getRandomDeal(mode, difficulty) { ... }

// Get campaign level
export function getCampaignLevel(tier, index) { ... }

// Get deal by ID
export function getDeal(dealId) { ... }

// Get pool stats
export function getPoolStats() { ... }
```

### 2.5 Migration Path

1. **Keep existing 30 snapshots** as campaign tier 1-3
2. **Generate initial random pool** (50 deals per mode/difficulty)
3. **Update `generateRandomDeal()`** to pull from pool instead of pure random
4. **Fallback**: If pool exhausted, generate random (with warning log)

---

## Phase 3: Python Generator Integration (Week 4+)

### 3.1 Generator Role

The Python solver/generator becomes an **offline batch tool**:

```
tools/snapshot_generator/
├── core/                    # Existing solver
├── cli.py                   # Batch generation commands
└── output/                  # Generated deals (gitignored)
    └── staging/             # Review before moving to src/data/deals/
```

### 3.2 Generation Workflow

1. **Generate**: `python3 cli.py --batch --mode classic --difficulty easy --count 50`
2. **Verify**: Each deal is solved to confirm winnability
3. **Stage**: Output to `output/staging/`
4. **Review**: Manual or automated validation
5. **Commit**: Move verified deals to `src/data/deals/`
6. **Update**: Run `update_manifest.py` to regenerate `pool_manifest.json`

### 3.3 Solver Improvements (Post-Phase 1)

- Fix winnability detection (currently 0% detection rate)
- Implement move prioritization heuristics
- Add difficulty scoring based on solution path
- Consider backward generation (start from won state, reverse moves)

---

## Phase 4: Campaign Expansion (Ongoing)

### 4.1 Difficulty Tiers

| Tier | Levels | Difficulty | Moves | Description |
|------|--------|------------|-------|-------------|
| 1 | 1-10 | Easy | 15-25 | Gentle introduction |
| 2 | 11-20 | Moderate | 25-40 | Standard challenge |
| 3 | 21-30 | Hard | 40-60 | Complex sequences |
| 4 | 31-40 | Expert | 50-80 | Multiple cycles required |
| 5 | 41-50 | Master | 70+ | Pressure test scenarios |

### 4.2 Expansion Strategy

- Use Python generator to create candidate levels
- Manually review and adjust
- Playtest each level for "feel"
- Ensure gradual difficulty curve within tiers

---

## Implementation Timeline

| Week | Phase | Deliverables |
|------|-------|--------------|
| 1 | 1 | ✅ Debug export button, console logging, tester feedback collection |
| 2 | 2.1-2.2 | ✅ Directory structure, manifest schemas, deal format |
| 3 | 2.3-2.5 | ✅ Loader updates, migration, initial pool population |
| 4 | - | DATA COLLECTION: Gather tester analytics (2-4 weeks) |
| 5 | 3 | Python generator informed by real user data |
| 6+ | 4 | Campaign expansion, pool population |

---

## Phase 2.5: Data Collection (Current)

### Notification System DISABLED

**Status**: Game state notification system (stalemate detection, tiered hints/warnings) has been **disabled** as of this build.

**Reason**: Critical false positives detected - forfeit screens appearing during winning games, 0% accuracy rate.

**Preservation**: All UI components retained for future AI-based system:
- `GameStateToast` - Hints/Concern toasts
- `GameStateOverlay` - Warning tier overlay
- `StalemateModal` - Confirmed unwinnable state

**Re-enable** (when ready):
```javascript
// In browser console (DEV mode)
window.__NOTIFICATION_CONFIG__.setEnabled(true)
location.reload()
```

---

**Do NOT proceed to Phase 3 (Python generator) until we have real user data.**

### Why Wait?

Our difficulty classifications (15-25 moves = easy, 25-40 = moderate, 40-60 = hard) are educated guesses. Real player data will tell us:
- What winnability rate feels fair vs frustrating
- How undo usage correlates with perceived difficulty
- Whether our move count ranges align with player experience
- If notification tiers (hint/concern/warning) are accurate

### Collection Method

Testers triple-click version text on HomeScreen → downloads JSON file → share via Discord/email.

The export now includes:
- **Stats**: Career totals, by-mode breakdown
- **Telemetry**: Per-game outcomes, tiers, solver results
- **Game Logs**: Full event stream of each game session (NEW)

### Analysis Tools

#### Quick Stats (Career/Telemetry)
```bash
# Career statistics and session summaries
python3 tools/analyze_test_data.py exports/*.json
```

#### Detailed Game Logs (Comprehensive)
```bash
# Full action analysis
python3 tools/analyze_game_logs.py exports/tester1_2026-01-29.json

# Verbose - see every move
python3 tools/analyze_game_logs.py -v exports/*.json

# Export for simulation training
python3 tools/analyze_game_logs.py exports/*.json -e training_data.json
```

**Tracked Actions:**
- Every card move (source → destination with column types)
- Foundation placements (every card, not just completions)
- Pocket usage (store/retrieve with timing)
- Column conversions (traditional→ace/king)
- Stock operations (draws, recycles with cycle count)
- Undo events (when and what was undone)
- Game lifecycle (start, end, final state)

### Data Sources

| Source | Key | Granularity | Use Case |
|--------|-----|-------------|----------|
| Stats | `meridian_solitaire_stats` | Aggregated | Career totals, best times |
| Telemetry | `meridian-gs-telemetry` | Per-game | Win/loss, solver results |
| Game Logs | `meridian_game_logs` | Per-event | **Full action reconstruction** |
| Session | `meridian_solitaire_session` | Daily | Current session metrics |

**Note**: Notification tier tracking removed (system disabled). Focus is now on concrete player actions for simulation training.

### Minimum Data Requirements (Phase 3 Gate)

| Requirement | Threshold | Purpose |
|-------------|-----------|---------|
| Testers | 3+ unique users | Diverse skill levels |
| Total games | 50+ | Statistical significance |
| Games per mode | 10+ each | Mode comparison |
| Win/loss data | All games | Baseline winnability |

### Key Questions to Answer

1. **Actual random deal win rate**: Is it really 5-10%? Do players enjoy those games?
2. **Move count validation**: Do our easy/moderate/hard ranges feel right?
3. **Notification accuracy**: False positive rate (warning shown but player won)?
4. **Session patterns**: How many games do players attempt in one session?

### Success Metrics (Post-Data Collection)

| Metric | Current | Target After Data |
|--------|---------|-------------------|
| Data-driven difficulty | Guesses | Validated ranges |
| Generator parameters | Theoretical | Evidence-based |
| Tester confidence | Unknown | Validated model |

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Random deal winnability | ~5-10% | 100% (pooled) |
| Campaign levels | 30 | 100+ |
| Tester data visibility | None | Complete session logs |
| Deal generation | Manual | Automated batch |

---

## Open Questions

1. **Pool size**: How many deals per mode/difficulty? (Start: 50, Target: 200+)
2. **Unwinnable deals**: Include intentional unwinnable deals for "pressure test" mode?
3. **Deal rotation**: How often to refresh random pool? (Version updates?)
4. **Analytics**: Collect real win rates per deal to identify outliers?

---

## Appendix: File Changes

### New Files
- `src/components/DebugExport/` - Hidden export button component
- `src/utils/debugExport.js` - LocalStorage export utility ✅
- `src/utils/gameLogger.js` - Console logging utility ✅
- `src/utils/gameLogStorage.js` - Persistent game log storage ✅
- `src/utils/dealPool.js` - Deal pool loader ✅
- `src/data/deals/` - Deal pool directory ✅
- `src/data/deals/pool_manifest.json` - Master registry ✅
- `tools/analyze_test_data.py` - Analyze telemetry exports ✅
- `tools/analyze_game_logs.py` - Analyze detailed game logs ✅
- `tools/snapshot_generator/batch_generate.py` - Batch generation script

### Modified Files
- `src/App.jsx` - Add debug export, integrate logger ✅
- `src/components/HomeScreen/HomeScreen.jsx` - Hidden debug trigger ✅
- `src/utils/dealGenerator.js` - Use pool instead of pure random ✅
- `src/utils/notificationConfig.js` - Add disable flag ✅
- `src/hooks/useCardGame.js` - Disable notification system ✅
- `src/utils/snapshotLoader.js` - Integrate with pool manifest

---

*Plan version: 1.0*
*Last updated: 2026-01-29*
