/**
 * Theme Context Provider
 * 
 * Provides theme switching capability for multi-theme support.
 * Default theme: blue-casino (v2.2+)
 * 
 * Usage:
 *   import { ThemeProvider, useTheme, THEMES } from './contexts/ThemeContext';
 *   
 *   // In component:
 *   const { theme, setTheme, availableThemes } = useTheme();
 *   
 *   // Switch theme:
 *   setTheme(THEMES.GREEN_CLASSIC);
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { THEMES } from './ThemeContext.constants.js';

// Default theme
const DEFAULT_THEME = THEMES.BLUE_CASINO;

// Storage key
const THEME_STORAGE_KEY = 'meridian-theme';

// Create context
const ThemeContext = createContext(null);

/**
 * Theme Provider Component
 * Wraps the app and provides theme state
 */
export const ThemeProvider = ({ children }) => {
  // Initialize theme from localStorage or default
  const [theme, setThemeState] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        if (saved && Object.values(THEMES).includes(saved)) {
          return saved;
        }
      } catch (e) {
        console.warn('Failed to read theme from localStorage:', e);
      }
    }
    return DEFAULT_THEME;
  });

  // Apply theme to document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  // Persist theme to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch (e) {
        console.warn('Failed to save theme to localStorage:', e);
      }
    }
  }, [theme]);

  // Set theme with validation
  const setTheme = useCallback((newTheme) => {
    if (Object.values(THEMES).includes(newTheme)) {
      setThemeState(newTheme);
    } else {
      console.warn(`Invalid theme: ${newTheme}. Available:`, Object.values(THEMES));
    }
  }, []);

  // Get current theme info
  const getThemeInfo = useCallback(() => {
    const themeNames = {
      [THEMES.BLUE_CASINO]: 'Deep Blue Casino',
      // [THEMES.GREEN_CLASSIC]: 'Green Classic',
      // [THEMES.CRIMSON_NIGHT]: 'Crimson Night',
    };
    return {
      id: theme,
      name: themeNames[theme] || theme,
    };
  }, [theme]);

  const value = {
    theme,
    setTheme,
    availableThemes: Object.values(THEMES),
    themeInfo: getThemeInfo(),
    isDefault: theme === DEFAULT_THEME,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * useTheme Hook
 * Access theme context in components
 * 
 * @returns {Object} { theme, setTheme, availableThemes, themeInfo, isDefault }
 * @throws {Error} If used outside ThemeProvider
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === null) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * useThemeStyles Hook
 * Returns CSS variable references for theme-aware styling
 * 
 * @returns {Object} CSS variable references
 */
export const useThemeStyles = () => {
  // Verify we're in a theme provider
  useTheme();
  
  // Return CSS variable references
  // These automatically update when theme changes
  return {
    // Accents
    accent: 'var(--accent-primary)',
    accentSecondary: 'var(--accent-secondary)',
    accentGlow: 'var(--accent-glow)',
    accentSubtle: 'var(--accent-subtle)',
    
    // Backgrounds
    bgDeepest: 'var(--bg-deepest)',
    bgDeep: 'var(--bg-deep)',
    bgSurface: 'var(--bg-surface)',
    bgElevated: 'var(--bg-elevated)',
    bgOverlay: 'var(--bg-overlay)',
    
    // Tracks
    trackUp: 'var(--track-up)',
    trackUpBorder: 'var(--track-up-border)',
    trackDown: 'var(--track-down)',
    trackDownBorder: 'var(--track-down-border)',
    trackNeutral: 'var(--track-neutral)',
    trackNeutralBorder: 'var(--track-neutral-border)',
    trackEmpty: 'var(--track-empty)',
    
    // Text
    textPrimary: 'var(--text-primary)',
    textSecondary: 'var(--text-secondary)',
    textMuted: 'var(--text-muted)',
    textDisabled: 'var(--text-disabled)',
    
    // Semantic
    success: 'var(--color-success)',
    successBg: 'var(--color-success-bg)',
    successGlow: 'var(--color-success-glow)',
    warning: 'var(--color-warning)',
    warningBg: 'var(--color-warning-bg)',
    error: 'var(--color-danger)',
    errorBg: 'var(--color-danger-bg)',
    info: 'var(--color-info)',
    infoBg: 'var(--color-info-bg)',
    
    // Borders
    borderSubtle: 'var(--border-subtle)',
    borderLight: 'var(--border-light)',
    borderMedium: 'var(--border-medium)',
    borderStrong: 'var(--border-strong)',
    borderAccent: 'var(--border-accent)',
    
    // Shadows
    shadowSm: 'var(--shadow-sm)',
    shadowMd: 'var(--shadow-md)',
    shadowLg: 'var(--shadow-lg)',
    shadowXl: 'var(--shadow-xl)',
    shadowGlow: 'var(--shadow-glow)',
    shadowGlowSm: 'var(--shadow-glow-sm)',
    
    // Cards
    cardBg: 'var(--card-bg)',
    cardShadow: 'var(--card-shadow)',
    cardShadowHover: 'var(--card-shadow-hover)',
    
    // Interactive
    hoverBg: 'var(--hover-bg)',
    hoverBorder: 'var(--hover-border)',
    activeBg: 'var(--active-bg)',
    activeBorder: 'var(--active-border)',
    focusRing: 'var(--focus-ring)',
  };
};

// Re-export THEMES for backward compatibility
export { THEMES };

export default ThemeContext;
