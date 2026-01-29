# 🎮 Meridian Solitaire - Complete Edition

A modern, feature-rich implementation of Meridian Solitaire with drag-and-drop, undo/redo, touch support, and more.

![Version](https://img.shields.io/badge/version-2.3.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/react-18.3.1-61dafb)
![Vite](https://img.shields.io/badge/vite-5.4.11-646cff)

---

## ✨ Features

### 🎯 Core Gameplay
- **Dual Foundation System**: UP (7→K) and DOWN (6→A) foundations
- **Column Typing**: Ace, King, and Traditional column types
- **Multiple Game Modes**: Classic, Double Pocket, Traditional, Expert
- **24 Pre-loaded Puzzles**: Easy, Moderate, and Hard difficulty levels
- **Smart Validation**: Real-time move validation with clear feedback

### 🖱️ Interactions
- **Drag & Drop**: Smooth HTML5 drag-and-drop for all cards
- **Multi-Card Sequences**: Drag entire valid sequences at once
- **Double-Click Auto-Move**: Quick-send cards to foundations
- **Touch Support**: Full mobile/tablet compatibility with long-press
- **Keyboard Shortcuts**: Ctrl+Z (undo), Ctrl+Y (redo)

### 🔄 Advanced Features
- **Undo/Redo**: 100-move history with full state preservation
- **Move Counter**: Track your efficiency
- **Statistics Tracking**: Game stats, records, and per-mode analytics
- **Notifications**: Toast-style feedback for actions
- **Haptic Feedback**: Vibration on touch devices (where supported)
- **Visual Feedback**: Green glow on valid targets, animations everywhere
- **Hint System**: 3 hints per game with keyboard shortcut (H)
- **Auto-Complete**: Detects and executes trivially winnable endgames
- **Game State Detection**: Circular play detection and stalemate warnings

### 🏆 Campaign Mode
- **30 Progressive Levels**: Bronze, Silver, and Gold tiers
- **Locked Progression**: Complete levels to unlock next
- **Per-Level Analytics**: Best moves, best time, attempts
- **Tier Badges**: Earn badges for completing each tier
- **Campaign Complete Badge**: Finish all 30 levels

### 🏠 Home Screen & Navigation
- **Landing Page**: Quick Play and Campaign options
- **Mode Selector**: Choose game mode before playing
- **Pause Screen**: Pause mid-game with stats overlay
- **Continue Game**: Resume paused games seamlessly

### 🎨 Design System (v2.0.0)
- **Blue Felt Palette**: #1720c3 primary, gold/silver accents
- **Design Tokens**: Comprehensive CSS custom properties
- **Full-Bleed Layouts**: Tabbed modals without scrolling
- **Responsive Scaling**: Fits any viewport without cropping
- **Two Visual Styles**: Classic and Fun modes (with card rotation)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm

### Installation

```bash
# Navigate to project directory
cd meridian-solitaire-complete

# Install dependencies
npm install

# Start development server
npm run dev
```

The game will open at `http://localhost:5173`

### Build for Production

```bash
# Create optimized build
npm run build

# Preview production build
npm run preview
```

---

## 📁 Project Structure

```
meridian-solitaire-complete/
├── src/
│   ├── App.jsx                      # Main application component
│   ├── main.jsx                     # Entry point
│   ├── components/                  # React components
│   │   ├── Card.jsx                 # Draggable card component
│   │   ├── Column.jsx               # Tableau column with drop targets
│   │   ├── Foundation.jsx           # Foundation piles (UP/DOWN)
│   │   ├── GameStage.jsx            # Main game board
│   │   ├── Header.jsx               # Header with controls
│   │   ├── Footer.jsx               # Footer with metadata
│   │   ├── StockWaste.jsx           # Stock/waste/pockets
│   │   └── SnapshotSelector.jsx     # Puzzle selector
│   ├── hooks/                       # Custom React hooks
│   │   ├── useCardGame.js           # Main game state management
│   │   ├── useDragDrop.js           # Drag & drop logic
│   │   ├── useUndo.js               # Undo/redo system
│   │   ├── useTouchDrag.js          # Touch support
│   │   └── useNotification.js       # Notification system
│   ├── utils/                       # Utility functions
│   │   ├── cardUtils.js             # Card parsing & validation
│   │   ├── gameLogic.js             # Move validation & execution
│   │   ├── snapshotLoader.js        # Snapshot loading
│   │   └── validateSnapshots.js     # Snapshot validation
│   ├── data/                        # Game data
│   │   ├── constants.js             # Card/suit mappings
│   │   └── snapshots/               # Puzzle snapshots (24 JSON files)
│   │       ├── allSnapshots.js      # Snapshot registry
│   │       ├── index.js             # Exports
│   │       └── *.json               # Individual puzzles
│   └── styles/
│       └── App.css                  # Complete styles & animations
├── public/
│   └── assets/                      # Game assets
│       ├── cardspritesheet.png      # Card graphics
│       ├── gameboardbkgd.png        # Background
│       └── gameboardonly.png        # Board overlay
├── docs/                            # Documentation
│   └── MERIDIAN_MASTER_GAME_ENGINE_SPECIFICATION.txt
├── package.json                     # Dependencies
├── vite.config.js                   # Vite configuration
├── eslint.config.js                 # ESLint configuration
└── index.html                       # HTML entry point
```

---

## 🎮 How to Play

### Objective
Place all 52 cards into 8 foundation piles:
- **4 UP foundations** (7→8→9→10→J→Q→K) - one per suit
- **4 DOWN foundations** (6→5→4→3→2→A) - one per suit

### Basic Rules

**Tableau (7 Columns):**
- Cards must alternate colors (red ↔ black)
- **Ace Columns**: Build ascending (A→2→3→4→5→6)
- **King Columns**: Build descending (K→Q→J→10→9→8→7)
- **Traditional Columns**: Flexible direction
- Empty columns accept only Ace or King

**Foundations:**
- Each foundation requires same suit
- UP foundations start with 7, build up to King
- DOWN foundations start with 6, build down to Ace

**Stock/Waste:**
- Click stock to draw one card
- When empty, click to recycle waste pile
- Top waste card can be played

**Pockets:**
- Temporary storage (1 or 2 depending on mode)
- Hold one card each

### Controls

**Desktop:**
- **Drag & Drop**: Click and drag cards
- **Double-Click**: Auto-move to foundation
- **Click Stock**: Draw card
- **Ctrl+Z**: Undo last move
- **Ctrl+Y**: Redo next move

**Mobile/Touch:**
- **Long-Press**: Start dragging card (150ms)
- **Drag**: Move card to target
- **Tap Stock**: Draw card
- **Double-Tap**: Auto-move to foundation

---

## 🔧 Configuration

### Game Modes

Change modes via the snapshot selector in the header:
- **Classic**: 1 pocket, normal difficulty
- **Double Pocket**: 2 pockets, easier
- **Traditional**: Classic solitaire style
- **Expert**: Maximum challenge

### Difficulty Levels

Each mode has 10 puzzles across 3 difficulty levels:
- **Easy** (01-10): Good for learning
- **Moderate** (01-10): Balanced challenge
- **Hard** (01-10): Expert puzzles

### Visual Styles

Toggle between Classic and Fun modes:
- **Classic**: Straight cards, clean look
- **Fun**: Slight card rotation, playful feel

---

## 📊 Technical Details

### Built With
- **React** 18.3.1 - UI framework
- **Vite** 5.4.11 - Build tool & dev server
- **HTML5 Drag & Drop API** - Native drag-and-drop
- **CSS3 Animations** - Smooth transitions
- **LocalStorage** - Settings persistence

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

### Performance
- First Load: ~500ms
- Hot Reload: <100ms
- 60 FPS animations
- <50MB memory usage

---

## 🎨 Customization

### Adding New Snapshots

1. Create JSON file in `src/data/snapshots/`:
```json
{
  "metadata": {
    "name": "My Puzzle",
    "mode": "classic",
    "variant": "normal",
    "difficulty": "easy",
    "pockets": 1,
    "allUp": true
  },
  "stock": ["4c", "Js", ...],
  "waste": ["9s"],
  "tableau": {
    "0": ["Ah", "2d", ...],
    "1": [...],
    ...
  },
  "foundations": {
    "up": { "h": [], "d": [], "c": [], "s": [] },
    "down": { "h": [], "d": [], "c": [], "s": [] }
  },
  "pocket1": null,
  "pocket2": null
}
```

2. Add to `allSnapshots.js`:
```javascript
import myPuzzle from './my_puzzle.json';

export const ALL_SNAPSHOTS = {
  // ... existing
  'my_puzzle': myPuzzle
};
```

### Styling

Edit `src/styles/App.css` to customize:
- Colors: CSS variables in `:root`
- Animations: Keyframes at bottom of file
- Layout: Card dimensions, spacing, etc.

---

## 🐛 Troubleshooting

### Common Issues

**Cards won't drag:**
- Check if card is accessible (face-up, valid sequence)
- On touch devices, ensure long-press (150ms)
- Verify browser supports HTML5 drag & drop

**Undo button disabled:**
- No moves have been made yet
- History was cleared when loading new snapshot

**Touch not working:**
- Device may not support touch events
- Try refreshing page
- Check browser compatibility

**Visual glitches:**
- Clear browser cache
- Update to latest browser version
- Check GPU acceleration is enabled

---

## 📈 Development Roadmap

### Completed ✅
- [x] Core game engine
- [x] Drag & drop system
- [x] Multi-card sequences
- [x] Undo/redo
- [x] Touch support
- [x] Notifications
- [x] 24 pre-loaded puzzles
- [x] Save/load game state (v1.1.0)
- [x] Statistics tracking (v1.3.0)
- [x] Campaign mode with 30 levels (v1.3.0)
- [x] Home screen & navigation (v1.3.0)
- [x] Pause screen (v1.4.0)
- [x] Design system overhaul (v2.0.0)

### Planned 🎯
- [ ] Sound effects
- [ ] Achievements
- [ ] Daily challenges
- [ ] Additional themes (Green Classic, Crimson Night)
- [ ] Progressive web app (PWA)

---

## 📝 License

MIT License - feel free to use this project for learning or commercial purposes.

---

## 🙏 Acknowledgments

- Card graphics from standard playing card sprites
- Game design based on traditional Meridian Solitaire rules
- Built with modern web technologies

---

## 📞 Support

For issues, questions, or contributions:
1. Check the documentation in `/docs`
2. Review the game specification
3. Test with the integration test suite

---

## 🎉 Enjoy Playing!

Load up a puzzle, start dragging cards, and enjoy this modern take on a classic solitaire game!

**Pro Tips:**
- Use Ctrl+Z liberally - mistakes are learning opportunities
- Try the Easy puzzles first to learn the rules
- Double-click cards for quick foundation moves
- On mobile, long-press to drag cards
- Watch the card count badges to track progress

Happy playing! 🃏✨
