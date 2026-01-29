# Code Quality Standards & Current State

**Version:** 2.3.2  
**Last Updated:** 2026-01-29  
**Next Review:** Quarterly

---

## Related Documents

- [Historical Audit Record](../archive/completed/CODE_AUDIT_HISTORY.md) - Full Phase 1-5 remediation details
- [CHANGELOG.md](../../CHANGELOG.md) - Release history
- [Design System](./DESIGN_SYSTEM.md) - CSS architecture patterns

---

## Current State Summary

### ESLint Status
| Metric | Value |
|--------|-------|
| Total Errors | 15 (down from 20) |
| Files with Errors | 8 (down from 10) |
| Build Status | ✅ Passing |

**Note:** Remaining errors are in non-critical files (context constants, GameStateToast.jsx). App.jsx is now clean.

### Remaining Issues (Non-Critical)

| Category | Count | Severity | Notes |
|----------|-------|----------|-------|
| setState-in-effect | 10 | 🟡 Medium | Complex refactor needed - architectural patterns |
| Fast refresh exports | 8 | 🟢 Low | Hooks/functions exported from context files |
| Missing dependencies | 2 | 🟢 Low | useEffect dependency arrays |

---

## Active Standards

### JavaScript/React Patterns

#### 1. Hook Dependencies
- Always include all dependencies in useEffect/useCallback arrays
- Use `// eslint-disable-line` sparingly and with comments

#### 2. State Management
- Prefer `useReducer` for complex state logic
- Use `useState` initializer function for expensive calculations
- Avoid setState in effect bodies (use event handlers instead)

#### 3. Fast Refresh Compatibility
- Context files export only components
- Extract constants to separate `.constants.js` files

### CSS Architecture

#### 1. Token Usage
```css
/* ✅ Use design tokens */
.element {
  background: var(--bg-surface);
  z-index: var(--z-modal);
}

/* ❌ No hardcoded values */
.element {
  background: #1B2838;
  z-index: 9999;
}
```

#### 2. CSS Modules
- New components use CSS Modules
- Legacy components: migrate when modifying

### File Organization

```
src/
├── components/
│   └── ComponentName/
│       ├── ComponentName.jsx
│       ├── ComponentName.module.css  (if needed)
│       └── index.js
├── hooks/
│   └── useHookName.js
└── utils/
    └── utilityName.js
```

---

## Recent Improvements (v2.3.2)

### Phase 2a - Game State Detection Tuning
- **Telemetry System:** New `useGSTelemetry` hook tracks false positives/negatives
- **Configurable Thresholds:** New `notificationConfig.js` utility for tuning
- **Integration:** Telemetry wired throughout game lifecycle in App.jsx
- **Debug APIs:** `window.__GS_TELEMETRY__` and `window.__NOTIFICATION_CONFIG__`

### Phase 1 - App.jsx Architectural Hardening
- **ESLint errors in App.jsx:** Eliminated (0 errors)
- **setState-in-effect violations:** Fixed with queueMicrotask pattern
- **Missing dependencies:** Resolved with useCallback wrappers
- **Result:** App.jsx is now ESLint-clean and architectural-debt-free

## Historical Improvements (v2.3.0)

### Phase 5 - Code Quality Cleanup
- **ESLint errors reduced:** 80 → 20 (75% reduction)
- **Hook violations fixed:** 3 files (setState in effects)
- **Unused variables removed:** 50+ across 19 files
- **Fast Refresh issues:** Extracted constants to separate files

### Phase 4 - Critical Bug Fixes
- **GameStateToast TDZ bug:** Fixed handleDismiss declaration order
- **App.jsx ref mutation:** Wrapped in useEffect
- **useCardGame dependencies:** Commented out debug tools with missing deps

### Phase 1-3 - Earlier Work
See [Historical Audit Record](../archive/completed/CODE_AUDIT_HISTORY.md) for details on:
- Error boundaries
- Performance optimizations
- Z-index token migration
- Component folderization

---

## Maintenance Checklist

### Monthly
- [ ] Run `npm run lint` and review new errors
- [ ] Check for unused dependencies
- [ ] Review console warnings

### Quarterly
- [ ] Full code audit review
- [ ] Update this document with new patterns
- [ ] Archive completed work

---

*This document tracks current state only. For historical remediation details, see [CODE_AUDIT_HISTORY.md](../archive/completed/CODE_AUDIT_HISTORY.md)*
