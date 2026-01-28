import React from 'react';
import Button from './Button';
import GameMenu from './GameMenu';
import SnapshotSelector from './SnapshotSelector';
import { getGameModes } from '../utils/dealGenerator';

const GAME_MODES = getGameModes();

// Transform game modes for Select component
const modeOptions = GAME_MODES.map(mode => ({
  value: mode.id,
  label: mode.name
}));

/**
 * Header Component
 *
 * Simplified layout:
 * - Left: Brand (MERIDIAN Master Solitaire)
 * - Center: Live stats (Moves, Timer)
 * - Center-Right: Undo/Redo (primary gameplay actions)
 * - Right: Hamburger menu (everything else)
 */
const Header = ({
  config,
  toggleStyle,
  selectedSnapshotId,
  onSnapshotChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  moveCount,
  selectedMode,
  onModeChange,
  onNewGame,
  currentGameTime,
  formatTime,
  onOpenStats,
  // Menu state (managed by App.jsx)
  isMenuOpen,
  onMenuToggle,
  onMenuClose,
  onGoHome,
  onPause,
  showPauseButton = false,
}) => {
  return (
    <header>
      {/* Left: Brand */}
      <div className="header-left">
        <div>
          <span className="header-title">MERIDIAN</span>
          <span className="header-subtitle">Master Solitaire</span>
        </div>
      </div>

      {/* Center: Stats */}
      <div className="header-center">
        <div className="header-stat">
          Moves: {moveCount}
        </div>
        <div className="header-stat game-timer">
          {formatTime ? formatTime(currentGameTime) : '0:00'}
        </div>
      </div>

      {/* Right: Actions + Menu */}
      <div className="header-right">
        {/* Undo Button */}
        <Button
          variant="secondary"
          onClick={onUndo}
          disabled={!canUndo}
          icon={<span>↶</span>}
          title={`Undo last move${canUndo ? '' : ' (no moves to undo)'}`}
        >
          Undo
        </Button>

        {/* Redo Button */}
        <Button
          variant="accent"
          onClick={onRedo}
          disabled={!canRedo}
          icon={<span>↷</span>}
          title={`Redo next move${canRedo ? '' : ' (no moves to redo)'}`}
        >
          Redo
        </Button>

        {/* Pause Button - only shown during active game */}
        {showPauseButton && (
          <Button
            variant="ghost"
            onClick={onPause}
            icon={<span style={{ fontSize: '14px' }}>⏸</span>}
            title="Pause game"
          >
            Pause
          </Button>
        )}

        {/* Game Menu */}
        <GameMenu
          isOpen={isMenuOpen}
          onToggle={onMenuToggle}
          onClose={onMenuClose}
          onNewGame={onNewGame}
          selectedMode={selectedMode}
          onModeChange={onModeChange}
          modeOptions={modeOptions}
          onOpenStats={onOpenStats}
          isFunStyle={config.isFun}
          onToggleStyle={toggleStyle}
          onGoHome={onGoHome}
          snapshotSelector={
            <SnapshotSelector
              selectedSnapshotId={selectedSnapshotId}
              onSnapshotChange={onSnapshotChange}
            />
          }
        />
      </div>
    </header>
  );
};

export default Header;
