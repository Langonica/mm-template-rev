# Icon Migration Plan: Emoji → Lucide Icons

## Current State

The codebase uses a mix of:
1. **Emojis** (🏆, 🚫, 🖱️, 👆, 📱, ⌨️, 📘, 📗, 🎴, 🃏, ⭐, 🔥, 🎯, ⚡, 💎, 🎮, 💡, 💭, ⚠️)
2. **Symbol characters** (@, ^, *, ★, ↶, ↷, ⏸, ✓, ✕, ℹ, ⚠, ?, □)
3. **Lucide React icons** (Settings, Undo2, Redo2, Pause from lucide-react)

## Target State

Use **Lucide React** consistently throughout the application.

## Migration Strategy

### Step 1: Create Icon Component
Create a centralized Icon component that exports all needed icons from lucide-react with consistent sizing.

### Step 2: Replace by Category

#### Category A: Game Notifications (Phase 3)
| File | Current | New Icon |
|------|---------|----------|
| GameStateToast.jsx | 💡, 💭 | Lightbulb, MessageCircle |
| GameStateOverlay.jsx | ⚠️ | AlertTriangle |
| StalemateModal.jsx | 🚫 | CircleX |
| useNotification.jsx | ✓, ✕, ℹ, ⚠ | Check, X, Info, AlertTriangle |

#### Category B: HowToPlayScreen
| File | Current | New Icon |
|------|---------|----------|
| HowToPlayScreen.jsx | 🏆 | Trophy |
| HowToPlayScreen.jsx | 🖱️ | MousePointerClick |
| HowToPlayScreen.jsx | 👆 | Hand |
| HowToPlayScreen.jsx | 📱 | Smartphone |
| HowToPlayScreen.jsx | ⌨️ | Keyboard |
| HowToPlayScreen.jsx | 📘 | BookOpen |
| HowToPlayScreen.jsx | 📗 | BookOpen (variant) |
| HowToPlayScreen.jsx | 🎴 | Layers |
| HowToPlayScreen.jsx | 🃏 | Sparkles |
| HowToPlayScreen.jsx | □ | Square |
| HowToPlayScreen.jsx | A, K | Text (keep as is) |

#### Category C: StatisticsScreen
| File | Current | New Icon |
|------|---------|----------|
| StatisticsScreen.jsx | 🔥 | Flame |
| StatisticsScreen.jsx | ⭐ | Star |
| StatisticsScreen.jsx | 🎯 | Target |
| StatisticsScreen.jsx | ⚡ | Zap |
| StatisticsScreen.jsx | 💎 | Gem |
| StatisticsScreen.jsx | 🎮 | Gamepad2 |

#### Category D: CampaignScreen
| File | Current | New Icon |
|------|---------|----------|
| CampaignScreen.jsx | ★ | Star |
| CampaignScreen.jsx | 🏆 | Trophy |

#### Category E: Header & Controls
| File | Current | New Icon |
|------|---------|----------|
| Header.jsx | ↶ | Undo2 (already using) |
| Header.jsx | ↷ | Redo2 (already using) |
| Header.jsx | ⏸ | Pause (already using) |
| GameControls.jsx | (check) | Should use same as Header |
| HintButton.jsx | ? | HelpCircle |

#### Category F: Menu Items
| File | Current | New Icon |
|------|---------|----------|
| GameMenu.jsx | @ | RotateCcw |
| GameMenu.jsx | ^ | Home |
| GameMenu.jsx | * | BarChart3 |

## Implementation Order

1. **Create Icon component** - Centralized icon exports
2. **Update useNotification.jsx** - Notification icons
3. **Update GameStateToast/Overlay** - Notification system
4. **Update HowToPlayScreen** - Most emojis
5. **Update StatisticsScreen** - Record icons
6. **Update CampaignScreen** - Tier icons
7. **Update Header/Controls** - Action icons
8. **Update GameMenu** - Menu icons
9. **Update StalemateModal** - Modal icon
10. **Update HintButton** - Hint icon

## Icon Component Design

```jsx
// components/Icon/Icon.jsx
export { 
  Trophy, 
  AlertTriangle, 
  Lightbulb, 
  MessageCircle,
  // ... all needed icons 
} from 'lucide-react';

// Or create wrapper for consistent sizing
export const Icon = ({ icon: LucideIcon, size = 'md', ...props }) => {
  const sizeMap = { xs: 12, sm: 16, md: 20, lg: 24, xl: 32 };
  return <LucideIcon size={sizeMap[size] || sizeMap.md} {...props} />;
};
```

## Files to Modify

- [ ] `src/components/Icon/` - NEW
- [ ] `src/hooks/useNotification.jsx`
- [ ] `src/components/GameStateToast/GameStateToast.jsx`
- [ ] `src/components/GameStateOverlay/GameStateOverlay.jsx`
- [ ] `src/components/StalemateModal/StalemateModal.jsx`
- [ ] `src/components/HowToPlayScreen/HowToPlayScreen.jsx`
- [ ] `src/components/StatisticsScreen/StatisticsScreen.jsx`
- [ ] `src/components/CampaignScreen/CampaignScreen.jsx`
- [ ] `src/components/Header/Header.jsx`
- [ ] `src/components/GameControls/GameControls.jsx`
- [ ] `src/components/GameMenu/GameMenu.jsx`
- [ ] `src/components/HintButton/HintButton.jsx`

## CSS Updates Needed

Update CSS modules to style Lucide icons (SVG) instead of emoji/text:
- Remove emoji-specific font-size adjustments
- Add SVG icon sizing (width/height)
- Ensure color inheritance works with SVG
