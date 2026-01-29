# Documentation Index

**Meridian Solitaire Documentation Hub**

This directory contains all project documentation organized by lifecycle state.

---

## Quick Navigation

| Need to... | Go to |
|------------|-------|
| Understand design principles | [ACTIVE/DESIGN_SYSTEM.md](./ACTIVE/DESIGN_SYSTEM.md) |
| Find color/token values | [ACTIVE/DESIGN_TOKENS.md](./ACTIVE/DESIGN_TOKENS.md) |
| See current development status | [ACTIVE/PROGRESS.md](./ACTIVE/PROGRESS.md) |
| Check code standards | [ACTIVE/CODE_QUALITY.md](./ACTIVE/CODE_QUALITY.md) |
| Deploy the application | [guides/DEPLOYMENT.md](./guides/DEPLOYMENT.md) |
| View historical plans | [archive/completed/](./archive/completed/) |

---

## Directory Structure

```
docs/
├── ACTIVE/           # Living documents (synchronized with code)
│   ├── DESIGN_SYSTEM.md
│   ├── DESIGN_TOKENS.md
│   ├── NOTIFICATION_SYSTEM.md
│   ├── CODE_QUALITY.md
│   ├── PROGRESS.md
│   └── BACKLOG.md
│
├── guides/           # Task-specific reference
│   ├── DEPLOYMENT.md
│   ├── DESIGN_ASSETS.md
│   └── MODEL_SELECTION.md
│
├── archive/          # Historical record
│   ├── completed/    # Finished implementation plans
│   └── reference/    # Original specs, context
│
├── logs/             # Runtime logs (working directory)
└── screenshots/      # UI review images (working directory)
```

---

## Document Types

### ACTIVE/ - Living Documents

These documents change as the codebase changes. **Must be synchronized** with implementation.

- **DESIGN_SYSTEM.md** - Design philosophy, taxonomy, UI patterns
- **DESIGN_TOKENS.md** - CSS variables, colors, spacing (concrete values)
- **NOTIFICATION_SYSTEM.md** - Game state messaging specification
- **CODE_QUALITY.md** - Current lint status, standards, patterns
- **PROGRESS.md** - Current development work tracking
- **BACKLOG.md** - Deferred work, technical debt

### guides/ - Reference Documentation

Stable reference material for specific tasks.

- **DEPLOYMENT.md** - How to build and release
- **DESIGN_ASSETS.md** - Asset specifications for designers
- **MODEL_SELECTION.md** - AI model selection guidance

### archive/ - Historical Record

**Do not modify** - preserved for context and reference.

- **completed/** - Finished implementation plans, phase READMEs
- **reference/** - Original specs, research, historical context

---

## Synchronization Rules

When modifying code, update the relevant living documents:

| Code Change | Document |
|-------------|----------|
| UI component changes | DESIGN_SYSTEM.md |
| Color/spacing changes | DESIGN_TOKENS.md |
| Notification behavior | NOTIFICATION_SYSTEM.md |
| New patterns/standards | CODE_QUALITY.md |
| Completed work | PROGRESS.md |
| New debt discovered | BACKLOG.md |

See [PROCESS.md](../PROCESS.md) for detailed synchronization guidelines.

---

## Root-Level Documents

These files live in the project root:

- **README.md** - Project overview (user-facing)
- **CLAUDE.md** - AI developer context, architecture
- **PROCESS.md** - Development workflows (this structure)
- **SETUP.md** - Developer onboarding
- **CHANGELOG.md** - Release history
- **VERSION** - Current version identifier

---

## Recent Changes

- **2026-01-29** - Documentation reorganization (this structure)
  - Consolidated scattered docs into ACTIVE/guides/archive
  - Split CODE_AUDIT into current (CODE_QUALITY) + history
  - Merged notification system docs
  - Added cross-links between related documents

---

*See [PROCESS.md](../PROCESS.md) for documentation maintenance workflows.*
