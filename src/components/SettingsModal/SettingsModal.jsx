import { useState } from 'react';
import ModalContainer from '../ModalContainer';
import TabBar from '../TabBar';
import TileSelector from '../TileSelector';
import { useNotificationSettings, NOTIFICATION_LEVELS } from '../../contexts/NotificationSettingsContext';
import { useTheme } from '../../contexts/ThemeContext';
import styles from './SettingsModal.module.css';

const TABS = [
  { id: 'gameplay', label: 'Gameplay' },
  { id: 'visual', label: 'Visual' },
  { id: 'about', label: 'About' }
];

const NOTIFICATION_OPTIONS = [
  { value: NOTIFICATION_LEVELS.ON, label: 'On' },
  { value: NOTIFICATION_LEVELS.MINIMAL, label: 'Minimal' },
  { value: NOTIFICATION_LEVELS.OFF, label: 'Off' }
];

function SettingsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('gameplay');
  const { settings, updateSettings } = useNotificationSettings();
  const { theme, availableThemes, setTheme } = useTheme();

  const themeOptions = availableThemes.map(themeName => ({
    value: themeName,
    label: themeName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }));

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      maxWidth="min(90vw, 520px)"
    >
      <TabBar tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      <div className={styles.tabContent}>
        {activeTab === 'gameplay' && (
          <div className={styles.settingsGroup}>
            <div className={styles.settingItem}>
              <TileSelector
                label="Game Notifications"
                options={NOTIFICATION_OPTIONS}
                value={settings.gameStateNotifications}
                onChange={(value) => updateSettings({ gameStateNotifications: value })}
              />
            </div>
          </div>
        )}

        {activeTab === 'visual' && (
          <div className={styles.settingsGroup}>
            <div className={styles.settingItem}>
              <TileSelector
                label="Theme"
                options={themeOptions}
                value={theme}
                onChange={(value) => setTheme(value)}
              />
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className={styles.aboutContent}>
            <h2 className={styles.aboutTitle}>Meridian Solitaire</h2>
            <p className={styles.aboutVersion}>Version 2.3.0</p>
          </div>
        )}
      </div>
    </ModalContainer>
  );
}

export default SettingsModal;
