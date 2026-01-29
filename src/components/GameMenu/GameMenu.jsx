import React, { useEffect, useRef } from 'react';
import styles from './GameMenu.module.css';
import MenuItem from '../MenuItem';
import Select from '../Select';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotificationSettings, NOTIFICATION_LEVELS } from '../../contexts/NotificationSettingsContext';

/**
 * GameMenu Component
 *
 * Hamburger menu for game actions, settings, and navigation.
 * Consolidates secondary header controls into a clean dropdown.
 *
 * @param {boolean} isOpen - Whether menu is open
 * @param {function} onToggle - Toggle menu open/closed
 * @param {function} onClose - Close the menu

 * @param {function} onOpenStats - Open statistics modal
 * @param {function} onGoHome - Return to home screen
 * @param {function} onSnapshotChange - Snapshot change handler
 * @param {React.ReactNode} snapshotSelector - Snapshot selector component (for dev tools)
 * @param {boolean} hideToggle - Hide the internal hamburger button (default: false)
 */
const GameMenu = ({
  isOpen,
  onToggle,
  onClose,
  onRestartLevel,
  isCampaignGame = false,
  campaignLevelNumber = null,
  onOpenStats,
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

  const handleRestartLevel = () => {
    onRestartLevel?.();
    onClose();
  };

  const handleOpenStats = () => {
    onOpenStats();
    onClose();
  };

  const handleGoHome = () => {
    onGoHome?.();
    onClose();
  };

  // Theme selector
  const { theme, setTheme, availableThemes } = useTheme();
  
  const themeOptions = availableThemes.map(t => ({
    value: t,
    label: t
  }));
  
  const handleThemeChange = (e) => {
    setTheme(e.target.value);
    onClose();
  };

  // Notification settings
  const { settings, updateSettings } = useNotificationSettings();
  
  const notificationOptions = [
    { value: NOTIFICATION_LEVELS.ON, label: 'On' },
    { value: NOTIFICATION_LEVELS.MINIMAL, label: 'Minimal' },
    { value: NOTIFICATION_LEVELS.OFF, label: 'Off' }
  ];
  
  const handleNotificationChange = (e) => {
    updateSettings({ gameStateNotifications: e.target.value });
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
            <MenuItem
              label="Home"
              icon="^"
              onClick={handleGoHome}
            />
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
          <MenuItem sectionHeader="Settings" />
          
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
          
          {/* Notification Settings */}
          <div className={styles.themeGroup}>
            <span className={styles.themeLabel}>Notifications</span>
            <Select
              variant="primary"
              size="sm"
              options={notificationOptions}
              value={settings.gameStateNotifications}
              onChange={handleNotificationChange}
              className={styles.themeSelect}
            />
          </div>
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
