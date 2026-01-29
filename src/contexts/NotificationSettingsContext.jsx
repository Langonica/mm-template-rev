/**
 * Notification Settings Context Provider
 * 
 * Manages user preferences for game state notifications.
 * 
 * Usage:
 *   import { NotificationSettingsProvider, useNotificationSettings } from './contexts/NotificationSettingsContext';
 *   
 *   // In component:
 *   const { settings, updateSettings } = useNotificationSettings();
 *   
 *   // Check if notifications are enabled:
 *   if (settings.gameStateNotifications !== 'off') { ... }
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Notification level options
export const NOTIFICATION_LEVELS = {
  ON: 'on',         // All tiers active
  MINIMAL: 'minimal', // Only 'confirmed' tier (unwinnable games)
  OFF: 'off'        // No notifications
};

// Default settings
const DEFAULT_SETTINGS = {
  gameStateNotifications: NOTIFICATION_LEVELS.ON
};

// Storage key
const SETTINGS_STORAGE_KEY = 'meridian-notification-settings';

// Create context
const NotificationSettingsContext = createContext(null);

/**
 * Parse and validate settings from storage
 */
const parseStoredSettings = (stored) => {
  try {
    const parsed = JSON.parse(stored);
    return {
      gameStateNotifications: Object.values(NOTIFICATION_LEVELS).includes(parsed.gameStateNotifications)
        ? parsed.gameStateNotifications
        : DEFAULT_SETTINGS.gameStateNotifications
    };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
};

/**
 * Check if a notification tier should be shown based on settings
 */
export const shouldShowNotification = (settings, tier) => {
  const level = settings?.gameStateNotifications || NOTIFICATION_LEVELS.ON;
  
  switch (level) {
    case NOTIFICATION_LEVELS.OFF:
      return false;
    case NOTIFICATION_LEVELS.MINIMAL:
      // Only show 'confirmed' tier (mathematically unwinnable)
      return tier === 'confirmed';
    case NOTIFICATION_LEVELS.ON:
    default:
      // Show all tiers
      return true;
  }
};

/**
 * Notification Settings Provider Component
 */
export const NotificationSettingsProvider = ({ children }) => {
  // Initialize settings from localStorage or default
  const [settings, setSettingsState] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (saved) {
          return parseStoredSettings(saved);
        }
      } catch (e) {
        console.warn('Failed to read notification settings from localStorage:', e);
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Persist settings to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      } catch (e) {
        console.warn('Failed to save notification settings to localStorage:', e);
      }
    }
  }, [settings]);

  // Update specific setting
  const updateSettings = useCallback((updates) => {
    setSettingsState(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // Reset to defaults
  const resetSettings = useCallback(() => {
    setSettingsState(DEFAULT_SETTINGS);
  }, []);

  // Helper to check if a tier should be shown
  const isTierEnabled = useCallback((tier) => {
    return shouldShowNotification(settings, tier);
  }, [settings]);

  const value = {
    settings,
    updateSettings,
    resetSettings,
    isTierEnabled,
    notificationLevel: settings.gameStateNotifications,
    isEnabled: settings.gameStateNotifications !== NOTIFICATION_LEVELS.OFF,
    isMinimal: settings.gameStateNotifications === NOTIFICATION_LEVELS.MINIMAL
  };

  return (
    <NotificationSettingsContext.Provider value={value}>
      {children}
    </NotificationSettingsContext.Provider>
  );
};

/**
 * useNotificationSettings Hook
 * Access notification settings context in components
 * 
 * @returns {Object} { settings, updateSettings, resetSettings, isTierEnabled, ... }
 * @throws {Error} If used outside NotificationSettingsProvider
 */
export const useNotificationSettings = () => {
  const context = useContext(NotificationSettingsContext);
  if (context === null) {
    throw new Error('useNotificationSettings must be used within a NotificationSettingsProvider');
  }
  return context;
};

export default NotificationSettingsContext;
