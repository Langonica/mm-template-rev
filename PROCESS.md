# Meridian Solitaire Development Process

**Purpose:** Living document of established development patterns, workflows, and skills specific to this project.

**When to Update:** After establishing new patterns, after retrospectives, when onboarding.

---

## Table of Contents

1. [Project Documentation Structure](#project-documentation-structure)
2. [Development Workflow](#development-workflow)
3. [Phase-Based Development](#phase-based-development)
4. [Documentation Standards](#documentation-standards)
5. [Communication Patterns](#communication-patterns)
6. [Quality Gates](#quality-gates)

---

## Project Documentation Structure

### Core Documents (Root Level)

| File | Purpose | Update Frequency |
|------|---------|------------------|
| `README.md` | User-facing project overview | Rarely |
| `CLAUDE.md` | AI agent context, architecture | When architecture changes |
| `CHANGELOG.md` | Release history | Per release |
| `PROCESS.md` | This file - our workflows | When patterns change |
| `SETUP.md` | Developer onboarding | When setup changes |

### Planning Documents (`/docs`)

| File Pattern | Purpose | When Created |
|--------------|---------|--------------|
| `*_PLAN.md` | Comprehensive feature plans | Before major work |
| `*_PROGRESS.md` | Implementation tracking | At phase start |
| `CODE_AUDIT.md` | Technical debt tracking | Quarterly |
| `BACKLOG.md` | Future ideas | Continuously |
| `THEME_SPEC_*.md` | Design system specs | When theming changes |

### Supporting Directories

| Directory | Contents |
|-----------|----------|
| `docs/logs/` | Runtime logs for debugging |
| `docs/screenshots/` | UI review screenshots |

---

## Development Workflow

### Standard Iteration Cycle

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Review    │───→│  Implement  │───→│   Verify    │
│   Context   │    │   Changes   │    │   Build     │
└─────────────┘    └─────────────┘    └──────┬──────┘
       ↑                                      │
       └──────────────┬───────────────────────┘
                      │
               ┌──────┴──────┐
               │   Commit    │
               │   & Update  │
               │   Progress  │
               └─────────────┘
```

### Step-by-Step

1. **Review Context**
   - Read `CLAUDE.md` for architecture
   - Read relevant `*_PLAN.md` for specifications
   - Check `*_PROGRESS.md` for current status

2. **Implement Changes**
   - Make minimal, focused changes
   - Follow existing code style
   - Add comments for complex logic

3. **Verify Build**
   ```bash
   npm run build
   ```
   - Must complete without errors
   - Check for new warnings

4. **Update Progress**
   - Edit `*_PROGRESS.md` file
   - Mark tasks complete
   - Add commit hash

5. **Commit**
   - Use conventional commit format
   - Reference phase/context
   - Include scope description

---

## Phase-Based Development

### When to Use

Use phase-based development for:
- Major UI redesigns
- Multi-file refactoring
- Feature sets with dependencies

### Phase Structure

```
Phase N: [Name]
├── Objective: [One sentence]
├── Files: [List of files to modify]
├── Dependencies: [What must complete first]
└── Success Criteria: [How we know it's done]
```

### Progress Tracking Format

Create `[FEATURE]_PROGRESS.md` at phase start:

```markdown
# [Feature] Implementation Progress

## Phase Status Overview

| Phase | Description | Status | Started | Completed |
|-------|-------------|--------|---------|-----------|
| 0 | [Name] | 🔄/✅/⏳ | Date | Date |

## Phase N: [Current Phase]

### Objective
[What we're doing]

### Files Modified

| File | Changes | Status |
|------|---------|--------|
| `path/to/file` | Description | 🔄/✅/⏳ |

### Commits

| Commit | Description | Date |
|--------|-------------|------|
| `abc123` | Message | Date |

## Notes

[Important observations, blockers, decisions]
```

### Phase Completion Checklist

- [ ] All files modified per plan
- [ ] Build passes clean
- [ ] Progress document updated
- [ ] Commit made with descriptive message
- [ ] Next phase planned (if applicable)

---

## Documentation Standards

### Planning Documents (`*_PLAN.md`)

**Required Sections:**
1. Executive Summary
2. Design System Specification (if UI)
3. Component Specifications
4. Implementation Schedule
5. Success Criteria

**Format:**
- Use tables for comparisons
- Include ASCII diagrams for layouts
- Specify exact pixel values for UI
- List breaking changes explicitly

### Progress Documents (`*_PROGRESS.md`)

**Update Rules:**
1. Update status table at top of each session
2. Mark files complete as they're finished
3. Add commit hashes immediately after commit
4. Document blockers in Notes section

### Commit Messages

**Format:**
```
[type]([context]): [description]

[details]

Part of [Phase/Feature].
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code restructuring
- `docs` - Documentation only
- `style` - CSS/styling
- `chore` - Maintenance

**Examples:**
```
feat(Phase 0): Remove isFun/toggleStyle feature

Completely removed card rotation feature:
- Removed from useCardGame config
- Removed toggle function
- Removed from GameMenu

Part of UI Redux Phase 0.
```

---

## Communication Patterns

### Status Updates

When asked for status, provide:
1. Current phase and status
2. Files modified this session
3. Any blockers or issues
4. Next steps

### Asking for Review

When requesting review:
1. Summarize what changed
2. Highlight key decisions
3. Point out areas needing attention
4. Ask specific questions

### Raising Issues

When problems arise:
1. Describe symptom
2. Show relevant code/log
3. Explain what was attempted
4. Propose solution or ask for guidance

---

## Quality Gates

### Pre-Commit Checklist

- [ ] `npm run build` passes
- [ ] No console errors introduced
- [ ] Code follows existing patterns
- [ ] Comments added for complex logic
- [ ] Progress document updated

### Phase Completion Gates

- [ ] All success criteria met
- [ ] Build clean
- [ ] No TODOs left in code
- [ ] Documentation updated
- [ ] Commit history is clean

### UI Changes Additional Gates

- [ ] Visual inspected at multiple sizes
- [ ] Keyboard navigation works
- [ ] Color contrast acceptable
- [ ] Animations are smooth

---

## Recurring Patterns

### Adding a New Component

1. Create directory: `components/ComponentName/`
2. Files:
   - `ComponentName.jsx`
   - `ComponentName.module.css`
   - `index.js` (re-export)
3. Add to `CLAUDE.md` component list
4. Document in relevant plan

### Modifying the Design System

1. Update `src/styles/tokens.css`
2. Update relevant specs in `docs/`
3. Check all components using token
4. Update `CLAUDE.md` if architecture changes

### Debugging UI Issues

1. Check browser console for errors
2. Review z-index layering
3. Inspect computed styles
4. Check responsive breakpoints
5. Log to `docs/logs/` if needed

---

## Project-Specific Knowledge

### Z-Index Hierarchy

```
--z-home: 100          /* HomeScreen when game active */
--z-content: 500       /* Full-bleed content screens */
--z-modal: 2100        /* Dialogs with backdrop */
--z-overlay: 3000      /* Full-bleed overlays */
--z-notification: 4000 /* Toast notifications */
```

### Component Naming

- PascalCase for components: `HomeScreen`
- camelCase for hooks: `useCardGame`
- kebab-case for CSS: `.home-screen`

### File Organization

```
src/
├── components/      /* React components */
│   └── ComponentName/
│       ├── ComponentName.jsx
│       ├── ComponentName.module.css
│       └── index.js
├── hooks/           /* Custom React hooks */
├── utils/           /* Pure utility functions */
├── contexts/        /* React contexts */
├── styles/          /* Global styles, tokens */
└── data/            /* Static data, snapshots */
```

---

## Onboarding New Context

When starting fresh session:

1. Read `CLAUDE.md` for project context
2. Check `docs/*_PROGRESS.md` for current status
3. Review recent commits: `git log --oneline -10`
4. Verify build: `npm run build`

## Start of Session Patterns

### User Says
| Pattern | My Response |
|---------|-------------|
| "Continue [feature]" | Read relevant PROGRESS.md, check git status, continue |
| "Start [new feature]" | Read relevant PLAN.md, confirm scope, begin |
| "Review and plan" | Assess current state, identify next steps |
| Just "Hi" or general | Ask: "What would you like to work on?" |

### What I'll Always Check
Even without explicit instruction, I'll:
1. List working directory (if changed)
2. Check git status for uncommitted work
3. Read any `*_PROGRESS.md` files if present

### What You Should Explicitly Tell Me
- If you want me to re-read a specific document
- If we're changing direction from previous session
- If you have new requirements or constraints
- If you want me to ignore previous context

---

*Last Updated: 2026-01-28*
*Version: 1.0*
