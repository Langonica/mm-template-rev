# Snapshot Generator - Campaign Level Creation Tool

## Executive Summary

A Python-based tool to generate **winnable** campaign levels for Meridian Solitaire with controlled difficulty. Phase 1 implements forward generation + solver validation. Architecture supports future Phase 2 (backward generation from won states).

---

## 1. GOALS

### Primary
- Generate 30 winnable Classic mode levels (10 Easy, 10 Moderate, 10 Hard)
- Ensure bell curve difficulty progression
- Output to staging folder for manual curation
- Provide comprehensive metrics for tuning

### Secondary
- Extensible to other game modes (Classic Double, Hidden, Hidden Double)
- Phase 2: Backward generation for precise difficulty control

---

## 2. ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                    SNAPSHOT GENERATOR                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────┐  │
│  │   DEAL GEN   │   │    SOLVER    │   │   DIFFICULTY   │  │
│  │   (Random)   │──▶│   (BFS/DFS)  │──▶│   ANALYZER     │  │
│  └──────────────┘   └──────────────┘   └────────────────┘  │
│         │                                            │      │
│         ▼                                            ▼      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              METRICS & REPORTING                      │  │
│  │  - Solution path                                      │  │
│  │  - Move count                                         │  │
│  │  - Branching factor                                   │  │
│  │  - Dead ends encountered                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│                            ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 STAGING OUTPUT                        │  │
│  │  ./staging/classic_normal_easy_01.json               │  │
│  │  ./staging/classic_normal_easy_01_report.md          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. JSON OUTPUT SCHEMA

Matches existing snapshot format:

```json
{
  "metadata": {
    "id": "classic_normal_easy_01",
    "mode": "classic",
    "variant": "normal",
    "difficulty": "easy",
    "pockets": 1,
    "allUp": true,
    "version": "2.3.2",
    "description": "Generated winnable level - Easy difficulty"
  },
  "tableau": {
    "0": ["7c", "6d", "5h"],
    "1": ["9s", "8h", "7d", "6c"],
    ...
  },
  "stock": ["As", "2d", ...],
  "waste": ["Kh"],
  "pocket1": null,
  "pocket2": "N/A",
  "foundations": {
    "up": {"h": [], "d": [], "c": [], "s": []},
    "down": {"h": [], "d": [], "c": [], "s": []}
  },
  "columnState": {
    "types": ["traditional", "king", "ace", ...],
    "faceUpCounts": [3, 4, 2, ...],
    "faceDownCounts": [0, 0, 0, ...]
  },
  "analysis": {
    "progress": {
      "foundationCards": 0,
      "totalCards": 52,
      "percentage": 0.0
    }
  },
  "validation": {
    "isValid": true,
    "isWinnable": true,
    "solverMetrics": {
      "solutionMoves": 127,
      "nodesExplored": 842,
      "solveTimeMs": 450,
      "branchingFactor": 2.3,
      "deadEnds": 12
    },
    "difficultyScore": 34.5,
    "validatedAt": "2026-01-30T15:30:00Z"
  }
}
```

---

## 4. DIFFICULTY METRICS MATRIX

### Easy (Bronze Tier: Levels 1-10)
| Metric | Target Range | Description |
|--------|--------------|-------------|
| Solution Moves | 80-120 | Shorter solutions |
| Branching Factor | 2.0-3.0 | More obvious moves |
| Dead Ends | 0-5 | Few blind alleys |
| Starter Cards | Accessible | 7s and 6s in tableau top cards |
| Empty Columns | Early availability | Can create empty columns quickly |

### Moderate (Silver Tier: Levels 11-20)
| Metric | Target Range | Description |
|--------|--------------|-------------|
| Solution Moves | 120-180 | Medium length |
| Branching Factor | 1.5-2.5 | Some non-obvious moves |
| Dead Ends | 5-15 | Moderate complexity |
| Starter Cards | Buried | Need 5-10 moves to access |
| Column Typing | Mixed | Ace/King types appear mid-game |

### Hard (Gold Tier: Levels 21-30)
| Metric | Target Range | Description |
|--------|--------------|-------------|
| Solution Moves | 180-250 | Long solutions |
| Branching Factor | 1.2-2.0 | Many forced moves |
| Dead Ends | 15-30 | High complexity |
| Starter Cards | Deep | 7s and 6s buried in sequences |
| Column Typing | Restrictive | Difficult typing constraints |

### Difficulty Score Formula
```
difficultyScore = 
  (solutionMoves * 0.3) +
  (deadEnds * 2.0) +
  ((3.0 - branchingFactor) * 20) +
  (starterBurialDepth * 5)
```

---

## 5. SOLVER ARCHITECTURE

### Phase 1: Forward Solver (BFS with Heuristics)

```python
class Solver:
    def solve(self, game_state, max_nodes=10000, max_time_ms=5000):
        """
        Returns: {
            'winnable': bool,
            'solution': [move1, move2, ...],
            'metrics': {
                'nodes_explored': int,
                'solve_time_ms': int,
                'branching_factor': float,
                'dead_ends': int
            }
        }
        """
```

#### Move Generation
1. Auto-play to foundations (if available)
2. Tableau to tableau moves
3. Waste to tableau/foundation
4. Stock draw
5. Pocket operations

#### State Deduplication
- Use compact state fingerprint
- Skip already-visited states
- Track best path to each state

#### Early Termination
- Win condition reached
- Max nodes explored
- Max time elapsed
- Proven unwinnable (no moves, stock empty)

### Phase 2: Backward Generator (Future)

```python
class BackwardGenerator:
    def generate_from_won_state(self, reverse_moves_count):
        """
        1. Start with completed game (all cards on foundations)
        2. Make N reverse moves (undo-like operations)
        3. Return winnable starting position
        """
```

---

## 6. IMPLEMENTATION PHASES

### Phase 1A: Core Infrastructure (Week 1)
- [ ] Game state representation
- [ ] Move validation (reuse existing gameLogic.js logic in Python)
- [ ] State fingerprinting
- [ ] JSON output formatter

### Phase 1B: Solver (Week 2)
- [ ] BFS solver implementation
- [ ] Move generation (all legal moves)
- [ ] State deduplication
- [ ] Early termination logic

### Phase 1C: Generator (Week 3)
- [ ] Random deal generation
- [ ] Solver integration
- [ ] Discard unwinnable deals
- [ ] Basic metrics collection

### Phase 1D: Difficulty & Reports (Week 4)
- [ ] Difficulty analyzer
- [ ] Report generation (Markdown)
- [ ] Staging output
- [ ] CLI interface

### Phase 2: Backward Generation (Future)
- [ ] Reverse move definitions
- [ ] Won state initialization
- [ ] Controlled difficulty via reverse depth
- [ ] Preset patterns (blockers, bottlenecks)

---

## 7. COMMAND LINE INTERFACE

### Generate Single Level
```bash
python generator.py \
  --mode classic \
  --difficulty easy \
  --output ./staging/ \
  --max-attempts 100 \
  --solver-timeout 5000
```

### Generate Batch (Bell Curve)
```bash
python generator.py \
  --mode classic \
  --batch \
  --easy 10 \
  --moderate 10 \
  --hard 10 \
  --output ./staging/ \
  --report ./staging/report.md
```

### Validate Existing Snapshot
```bash
python generator.py \
  --validate \
  --input ./src/data/snapshots/classic_normal_easy_01.json \
  --report ./staging/validation_report.md
```

---

## 8. STAGING OUTPUT STRUCTURE

```
./staging/
├── classic_normal_easy_01.json
├── classic_normal_easy_01_report.md
├── classic_normal_easy_02.json
├── classic_normal_easy_02_report.md
├── ...
├── batch_report_2026-01-30.md
└── difficulty_distribution.png (optional)
```

### Individual Report Format
```markdown
# Snapshot Report: classic_normal_easy_01

## Summary
- **Winnable**: Yes
- **Solution Moves**: 94
- **Difficulty Score**: 28.2 (Easy)

## Solver Metrics
- Nodes Explored: 523
- Solve Time: 320ms
- Branching Factor: 2.4
- Dead Ends: 3

## Card Analysis
- Starters Accessible: Yes (7h, 6c in tableau top)
- Empty Column Available: Move 8

## Recommended Tier: Bronze
```

---

## 9. VIEWER INTEGRATION

After generation, reports can be viewed in the documentation viewer:

```bash
# Generate reports in viewer-compatible format
python generator.py --batch --viewer-format

# View at
# http://localhost:5173/docs/viewer.html?doc=../staging/batch_report_2026-01-30.md
```

---

## 10. VALIDATION CHECKLIST

Before moving from staging to production:

- [ ] All 30 levels winnable (solver verified)
- [ ] Difficulty distribution matches bell curve
- [ ] No duplicate game states
- [ ] All JSON validates against schema
- [ ] Manual play-test of 3 random levels per tier
- [ ] Report metrics reviewed

---

## 11. FUTURE EXTENSIONS

### Game Mode Expansion
```python
MODES = {
    'classic': {'pockets': 1, 'all_up': True},
    'classic_double': {'pockets': 2, 'all_up': True},
    'hidden': {'pockets': 1, 'all_up': False, 'face_down': 21},
    'hidden_double': {'pockets': 2, 'all_up': False, 'face_down': 21}
}
```

### Advanced Difficulty Control
- Specific bottleneck patterns
- Required move sequences
- Stock/waste dependency depth

### Interactive Tuning
- Web UI for parameter adjustment
- Real-time difficulty preview
- A/B testing framework

---

*Document Version: 1.0*
*Created: 2026-01-30*
*Status: Planning Phase*
