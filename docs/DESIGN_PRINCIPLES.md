# Meridian Solitaire - Design Principles & Taxonomy

**Version:** 2.3.0  
**Last Updated:** January 2026

---

## Core Philosophy: Signal Over Noise

### Every Element Must Earn Its Place

**The Test:** *"Does this help the player enjoy the game, or is it just visual clutter?"*

| Signal (Keep) | Noise (Remove) |
|---------------|----------------|
| Clear game state | Excessive decorative elements |
| Meaningful animations | Busy background patterns |
| Actionable notifications | Status indicators that don't change behavior |
| Consistent visual hierarchy | Competing focal points |

### Consistency Over Novelty

**Rule:** If we do it one way in one place, we do it that way everywhere.

- **One pattern per interaction type**
  - Modals for blocking decisions
  - Toasts for transient info
  - Badges for status indicators
  
- **One animation language**
  - Same durations across features
  - Same easing functions
  - Same visual vocabulary

---

## Taxonomy: Clear Definitions

### 1. MODES - "How the game deals cards"

**Definition:** Game mechanics that determine the initial deal and card visibility.

| Mode | Description |
|------|-------------|
| **Classic** | All cards face-up, standard solitaire |
| **Classic Double** | All face-up, two pocket slots |
| **Hidden** | Pyramid deal (0,1,2,3... face-down), one pocket |
| **Hidden Double** | Pyramid deal, two pockets |

**UI Treatment:** Mode selector in settings or home screen.  
**Persistence:** Saved to localStorage.  
**Scope:** Affects how NEW games are dealt.

---

### 2. PLAY STYLES - "How you play the game"

**Definition:** Different ways to engage with the game content.

| Play Style | Description |
|------------|-------------|
| **Quick Play** | Random deal in selected mode |
| **Campaign** | 30 progressive levels with unlocks |
| **Daily Challenge** | (Future) Same deal for all players |

**UI Treatment:** Primary choice on home screen.  
**Persistence:** Session-based.  
**Scope:** Determines which game you're playing.

---

### 3. SETTINGS - "Preferences that persist across sessions"

**Definition:** User preferences saved to localStorage, apply globally.

| Setting | Type | Default |
|---------|------|---------|
| Theme | Select | Blue Casino |
| Sound Effects | Toggle | On |
| Music | Toggle | Off |
| Haptic Feedback | Toggle | On (mobile) |
| **Game State Notifications** | Toggle | On |
| Reduced Motion | Toggle | System preference |
| Card Style | Select | Standard |

**UI Treatment:** Settings menu (gear icon).  
**Persistence:** Saved to localStorage.  
**Scope:** Applies to all games.

**Key Principle:** Settings should NOT affect game difficulty or rules.

---

### 4. OPTIONS - "In-game choices that don't persist"

**Definition:** Temporary choices available during gameplay.

| Option | Context |
|--------|---------|
| Undo | Anytime during game |
| Redo | After undo |
| Pause | During active game |
| Auto-Complete | When available |
| Hint | Limited uses per game |
| Forfeit | When game in progress |

**UI Treatment:** In-game controls, buttons, menus.  
**Persistence:** None (reset each game).  
**Scope:** Current game only.

---

## Hints vs Game State Notifications

### HINTS - "How do I play this card?"

**Purpose:** Help player find valid moves.

| Aspect | Definition |
|--------|------------|
| **Trigger** | User request (button press) OR automatic when stuck |
| **Content** | Specific card + destination + reasoning |
| **Frequency** | Limited (3 per game) |
| **Tone** | Helpful, educational |
| **Visual** | Highlight specific card with arrow/path |

**Examples:**
- "Move 8♥ to column 3 (reveals face-down card)"
- "Play A♠ to UP foundation (starts foundation)"

---

### GAME STATE NOTIFICATIONS - "Should I keep playing?"

**Purpose:** Inform player about game state viability.

| Aspect | Definition |
|--------|------------|
| **Trigger** | System detection (no user action) |
| **Content** | Game state assessment + suggested actions |
| **Frequency** | Once per game state change |
| **Tone** | Informative, decisive |
| **Visual** | Modal or persistent indicator |

**Levels:**

| Level | State | UX Treatment |
|-------|-------|--------------|
| **None** | Active play | Nothing shown |
| **Concern** | Suspicious pattern | Subtle indicator (optional) |
| **Warning** | Likely stuck | Toast with suggestions |
| **Confirmed** | Mathematically unwinnable | Modal with clear actions |

**Examples:**
- "This game appears unwinnable. All possible moves explored."
- "You've been cycling without progress. Try undoing recent moves?"

---

## UI Component Standards

### When to Use What

| Component | Use For | Don't Use For |
|-----------|---------|---------------|
| **Modal** | Blocking decisions, game over, unwinnable confirmed | Transient info, optional actions |
| **Toast** | Brief notifications, undo available, auto-complete ready | Critical decisions, complex info |
| **Badge** | Status indicators (count, warning level) | Primary actions |
| **Overlay** | Pause, loading, confirmations | Permanent UI |
| **Inline Text** | Stats, labels, descriptions | Warnings, urgent info |

### Animation Standards

| Type | Duration | Easing | Use Case |
|------|----------|--------|----------|
| **Instant** | 0ms | — | State updates |
| **Micro** | 100-150ms | ease-out | Hover, focus |
| **Standard** | 200-300ms | ease | Transitions, reveals |
| **Emphasis** | 400-600ms | spring | Celebrations, important changes |

---

## Settings Menu Structure

```
Settings (gear icon)
├── Gameplay
│   ├── Game State Notifications [Toggle] [?]
│   ├── Hints [Toggle] [?]
│   └── Auto-Complete Offer [Toggle] [?]
├── Audio
│   ├── Sound Effects [Toggle]
│   ├── Music [Toggle]
│   └── Volume [Slider]
├── Visual
│   ├── Theme [Select: Blue Casino | Green Classic | Crimson]
│   ├── Card Style [Select: Standard | Large Print]
│   └── Reduced Motion [Toggle]
├── Advanced
│   ├── Reset Statistics [Button]
│   └── Reset Campaign [Button]
└── About
    ├── Version
    ├── Credits
    └── Privacy Policy
```

---

## Implementation Guidelines

### Adding New UI Elements

**Checklist:**
- [ ] Does this element exist elsewhere in the app? (Reuse pattern)
- [ ] Is the visual treatment consistent with similar elements?
- [ ] Does it use design tokens (colors, spacing, typography)?
- [ ] Does it respect reduced motion preference?
- [ ] Is it accessible (keyboard, screen reader)?
- [ ] Can it be disabled if it's not critical?

### Notification Design Rules

1. **One notification at a time**
   - Queue if multiple conditions met
   - Priority: Confirmed > Warning > Concern

2. **Always provide an action**
   - Never just "X is happening"
   - Always "X is happening. [Do Y]"

3. **Respect user preference**
   - If notifications disabled, skip all levels
   - Log to console for debugging instead

4. **Progressive disclosure**
   - Start subtle (Level 2)
   - Escalate only if user continues
   - Never go straight to modal

---

## Anti-Patterns to Avoid

### ❌ Visual Clutter
- Multiple competing animations
- Decorative elements that don't serve gameplay
- Information density too high

### ❌ Inconsistent Patterns
- Different modal styles for similar actions
- Animation durations that vary randomly
- Button styles that differ between screens

### ❌ Passive-Aggressive UX
- Notifications that can't be dismissed
- Guilt-inducing language ("You gave up!")
- Overly cheerful messages during failure

### ❌ Mystery Meat Navigation
- Icons without labels
- Gestures without hints
- Hidden features without discovery paths

---

## Glossary

| Term | Definition |
|------|------------|
| **Mode** | Card dealing mechanics (Classic, Hidden, etc.) |
| **Play Style** | Game type (Quick Play, Campaign, Daily) |
| **Setting** | Persistent user preference |
| **Option** | Temporary in-game choice |
| **Hint** | User-requested move suggestion |
| **Notification** | System-generated state alert |
| **Progress** | Meaningful game advancement (not just moves) |
| **Unwinnable** | Mathematically proven no win possible |
| **Stalled** | No productive moves available |
| **Circular Play** | Repeating states without progress |

---

*These principles guide all design decisions. When in doubt, choose the simpler option.*
