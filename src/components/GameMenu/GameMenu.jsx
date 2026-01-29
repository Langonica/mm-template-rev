import React, { useEffect, useRef } from 'react';
import styles from './GameMenu.module.css';
import MenuItem from '../MenuItem';
import Select from '../Select';
import { useTheme, THEMES } from '../../contexts/ThemeContext';

/**
 * GameMenu Component
 *
 * Hamburger menu for game actions, settings, and navigation.
 * Consolidates secondary header controls into a clean dropdown.
 *
 * @param {boolean} isOpen - Whether menu is open
 * @param {function} onToggle - Toggle menu open/closed
 * @param {function} onClose - Close the menu
 * @param {function} onNewGame - Start new game handler
 * @param {string} selectedMode - Current game mode
 * @param {function} onModeChange - Mode change handler
 * @param {Array} modeOptions - Available game modes [{value, label}]
 * @param {function} onOpenStats - Open statistics modal
 * @param {boolean} isFunStyle - Current style setting
 * @param {function} onToggleStyle - Toggle fun/classic style
 * @param {string} selectedSnapshotId - Current snapshot
 * @param {function} onSnapshotChange - Snapshot change handler
 * @param {React.ReactNode} snapshotSelector - Snapshot selector component (for dev tools)
 * @param {boolean} hideToggle - Hide the internal hamburger button (default: false)
 */
const GameMenu = ({
  isOpen,
  onToggle,
  onClose,
  onNewGame,
  onRestartLevel,
  isCampaignGame = false,
  campaignLevelNumber = null,
  selectedMode,
  onModeChange,
  modeOptions = [],
  onOpenStats,
  isFunStyle,
  onToggleStyle,
  onGoHome,
  snapshotSelector,
  hideToggle = false,
}) => {
  const menuRef = useRef(null);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      // Delay to prevent immediate close on the same click that opened
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Escape key to close
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleNewGame = () => {
    onNewGame();
    onClose();
  };

  const handleRestartLevel = () => {
    onRestartLevel?.();
    onClose();
  };

  const handleOpenStats = () => {
    onOpenStats();
    onClose();
  };

  const handleToggleStyle = () => {
    onToggleStyle();
    onClose();
  };

  const handleGoHome = () => {
    onGoHome?.();
    onClose();
  };

  // Theme selector
  const { theme, setTheme, availableThemes, themeInfo } = useTheme();
  
  const themeOptions = availableThemes.map(t => ({
    value: t,
    label: t === THEMES.BLUE_CASINO ? 'Deep Blue Casino' : t
  }));
  
  const handleThemeChange = (e) => {
    setTheme(e.target.value);
    onClose();
  };

  return (
    <div className={styles.menuContainer} ref={menuRef}>
      {/* Hamburger Button */}
      {!hideToggle && (
        <button
          className={`${styles.menuButton} ${isOpen ? styles.open : ''}`}
          onClick={onToggle}
          aria-label="Game menu"
          aria-expanded={isOpen}
        >
          <div className={styles.hamburger}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
      )}

      {/* Dropdown Menu */}
      <div className={`${styles.dropdown} ${isOpen ? styles.open : ''}`} role="menu">
        {/* Game Actions */}
        <div className={styles.section}>
          {isCampaignGame ? (
            <>
              <MenuItem
                label={`Restart Level ${campaignLevelNumber}`}
                icon="@"
                onClick={handleRestartLevel}
              />
              <MenuItem
                label="Back to Campaign"
                icon="^"
                onClick={handleGoHome}
              />
            </>
          ) : (
            <>
              <MenuItem
                label="New Game"
                icon="+"
                onClick={handleNewGame}
              />
              <MenuItem
                label="Home"
                icon="^"
                onClick={handleGoHome}
              />

              {/* Mode Selector - only show in Quick Play */}
              <div className={styles.modeGroup}>
                <span className={styles.modeLabel}>Game Mode</span>
                <Select
                  variant="primary"
                  size="sm"
                  options={modeOptions}
                  value={selectedMode}
                  onChange={(e) => onModeChange(e.target.value)}
                  className={styles.modeSelect}
                />
              </div>
            </>
          )}
        </div>

        {/* Information */}
        <div className={styles.section}>
          <MenuItem
            label="Statistics"
            icon="*"
            onClick={handleOpenStats}
          />
        </div>

        {/* Settings */}
        <div className={styles.section}>
          {/* Theme Selector */}
          <div className={styles.themeGroup}>
            <span className={styles.themeLabel}>Theme</span>
            <Select
              variant="primary"
              size="sm"
              options={themeOptions}
              value={theme}
              onChange={handleThemeChange}
              className={styles.themeSelect}
            />
          </div>
          
          <MenuItem
            label={isFunStyle ? 'Switch to Classic Style' : 'Switch to Fun Style'}
            icon={isFunStyle ? '~' : '~'}
            onClick={handleToggleStyle}
          />
        </div>

        {/* Dev Tools - Only show if snapshotSelector is provided */}
        {snapshotSelector && (
          <div className={styles.section}>
            <MenuItem sectionHeader="Dev Tools" />
            <div style={{ padding: '4px 12px' }}>
              {snapshotSelector}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameMenu;
