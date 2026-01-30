# Snapshot Generator

Python tool for generating winnable Meridian Solitaire campaign levels.

## Quick Start

```bash
cd tools/snapshot_generator

# Generate single level
python cli.py --mode classic --difficulty easy --output ./staging/

# Generate batch (bell curve)
python cli.py --batch --easy 10 --moderate 10 --hard 10 --output ./staging/

# Validate existing snapshot
python cli.py --validate --input ../../src/data/snapshots/classic_normal_easy_01.json
```

## Structure

```
snapshot_generator/
├── core/              # Shared logic
│   ├── __init__.py
│   ├── game_state.py  # State representation
│   ├── moves.py       # Move validation/generation
│   ├── solver.py      # BFS solver
│   └── difficulty.py  # Difficulty analyzer
├── tests/             # Unit tests
├── staging/           # Output folder (not committed)
├── cli.py            # Command line interface
└── README.md         # This file
```

## Development

```bash
# Run tests
python -m pytest tests/

# Generate report for single level
python cli.py --mode classic --difficulty moderate --report
```

## Output

Generated snapshots are written to `./staging/` for manual review before moving to `../../src/data/snapshots/`.
