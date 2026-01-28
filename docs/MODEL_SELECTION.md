# Model Selection Guide

Choosing the right Claude model for different project tasks. Match capability to complexity - don't use a sledgehammer for a thumbtack.

---

## Available Models

| Model | Strength | Speed | Cost | Best For |
|-------|----------|-------|------|----------|
| **Opus 4.5** | Highest | Slowest | $$$ | Architecture, complex debugging, multi-system reasoning |
| **Sonnet** | High | Fast | $$ | Feature implementation, refactoring, most coding |
| **Haiku** | Good | Fastest | $ | Simple edits, lookups, documentation, quick fixes |

---

## Project Phase Recommendations

### Planning & Architecture

| Task | Recommended | Reasoning |
|------|-------------|-----------|
| Responsive layout redesign planning | **Opus** | Multi-file impact analysis, ratio model design, phase sequencing |
| New feature architecture | **Opus** | Trade-off analysis, pattern selection, integration planning |
| Reviewing implementation options | **Opus** | Nuanced pros/cons, long-term maintainability considerations |
| Simple task planning | Sonnet | Straightforward feature breakdown |

### Implementation

| Task | Recommended | Reasoning |
|------|-------------|-----------|
| Complex hook creation (useResponsiveDimensions) | Sonnet | Clear requirements, focused scope |
| Component refactoring | Sonnet | Pattern application, consistent changes |
| Bug fixes with clear reproduction | Sonnet | Targeted investigation and fix |
| CSS variable consolidation | Sonnet | Systematic, repetitive work |
| Multi-file feature (Campaign Mode) | Sonnet | Multiple files but clear pattern |
| Mysterious bugs, race conditions | **Opus** | Deep reasoning about state/timing |
| Simple prop additions | Haiku | Mechanical change |
| Rename variable across files | Haiku | Find-and-replace logic |

### Debugging

| Task | Recommended | Reasoning |
|------|-------------|-----------|
| "Why is layout overlapping?" | **Opus** | Needs to reason about CSS cascade, JS state, component hierarchy |
| "Touch drag is inconsistent" | **Opus** | Timing, event propagation, state management intersection |
| "Button click not working" | Sonnet | Usually straightforward cause |
| "Typo in display text" | Haiku | Obvious fix |

### Documentation & Maintenance

| Task | Recommended | Reasoning |
|------|-------------|-----------|
| Design system documentation | Sonnet | Needs to understand and explain patterns |
| BACKLOG.md updates | Haiku | Simple text editing |
| Commit message generation | Haiku | Formulaic output |
| README updates | Haiku | Straightforward prose |
| Architecture decision records | **Opus** | Capturing nuanced reasoning |

### Code Review & Analysis

| Task | Recommended | Reasoning |
|------|-------------|-----------|
| "Is this approach sound?" | **Opus** | Needs to consider edge cases, maintainability, alternatives |
| "What does this code do?" | Sonnet | Explanation task |
| "Find all uses of X" | Haiku | Search task |

---

## MeridianMaster Specific Examples

### Use Opus For:
- Responsive layout phase planning (done)
- Debugging the double-scaling foundation bug
- Touch interaction timing issues
- Game state machine edge cases
- Performance optimization strategy

### Use Sonnet For:
- Implementing CSS variable system
- Creating useResponsiveDimensions hook
- Foundation.jsx 65% scaling implementation
- Column.jsx/StockWaste.jsx refactoring
- Campaign mode feature implementation
- Pause overlay component

### Use Haiku For:
- Updating hardcoded `145px` → `var(--theater-top)`
- Adding new CSS variables to :root
- PROGRESS.md status updates
- Simple component prop additions
- Git commit preparation

---

## Cost/Benefit Mental Model

```
Task Complexity
     ^
     |
High |   ┌─────────────┐
     |   │    OPUS     │  Complex architecture
     |   │             │  Mysterious bugs
     |   └─────────────┘  Multi-system reasoning
     |   ┌─────────────────────────┐
Med  |   │        SONNET           │  Most implementation
     |   │                         │  Feature development
     |   └─────────────────────────┘  Standard debugging
     |   ┌─────────────────────────────────────┐
Low  |   │              HAIKU                  │  Simple edits
     |   │                                     │  Documentation
     |   └─────────────────────────────────────┘  Lookups
     └────────────────────────────────────────────> Speed needed
```

---

## Warning Signs You're Using Wrong Model

**Opus overkill:**
- Task completed in one tool call
- No architectural decisions involved
- Simple find-and-replace pattern

**Haiku underkill:**
- Model keeps making wrong assumptions
- Missing edge cases
- Needs multiple correction rounds
- Task involves understanding system interactions

**Right-sized:**
- Task completes with minimal back-and-forth
- Solution accounts for project context
- No wasted reasoning on simple tasks
- No missed complexity on hard tasks

---

## Session Retrospective: 2026-01-23

Real example from responsive layout implementation session (ran entirely on Opus 4.5):

| Task | Used | Should Have Used | Notes |
|------|------|------------------|-------|
| Responsive layout planning | Opus | Opus ✓ | Multi-phase architecture, ratio model design |
| Creating useResponsiveDimensions hook | Opus | Sonnet | Clear requirements, focused scope |
| CSS variable consolidation | Opus | Sonnet/Haiku | Systematic, repetitive |
| Foundation 65% implementation | Opus | Sonnet | Pattern application |
| Debugging double-scaling bug | Opus | Opus ✓ | Required reasoning about transform cascade |
| Fixing hardcoded px values | Opus | Haiku | Mechanical find-replace |
| Writing MODEL_SELECTION.md | Opus | Haiku | Documentation |

**Takeaway:** Architecture planning and the mysterious layout overlap bug justified Opus. The implementation and mechanical edits could have been 2-3x faster on lighter models with same quality output.

---

*Last Updated: 2026-01-23*
