/**
 * Notification Threshold Configuration
 * 
 * Provides configurable thresholds for the game state notification system.
 * Thresholds can be customized via localStorage for testing/tuning.
 * 
 * @module notificationConfig
 */

const STORAGE_KEY = 'meridian-notification-thresholds'

// Default thresholds (conservative to reduce false positives)
export const DEFAULT_THRESHOLDS = {
  hint: 3,      // Tier 1: Subtle hint
  concern: 4,   // Tier 2: More prominent
  warning: 6,   // Tier 3: Overlay (dismissible)
  confirmed: 8, // Tier 4: Confirmed unwinnable
}

// Minimum allowed values (prevent breaking the system)
export const MIN_THRESHOLDS = {
  hint: 1,
  concern: 2,
  warning: 3,
  confirmed: 4,
}

// Maximum allowed values (prevent excessive delays)
export const MAX_THRESHOLDS = {
  hint: 10,
  concern: 15,
  warning: 20,
  confirmed: 30,
}

/**
 * Load thresholds from localStorage or return defaults
 * @returns {Object} Threshold configuration
 */
export function loadThresholds() {
  if (typeof window === 'undefined') return DEFAULT_THRESHOLDS
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_THRESHOLDS
    
    const parsed = JSON.parse(stored)
    
    // Validate and merge with defaults
    const validated = {}
    for (const [key, defaultValue] of Object.entries(DEFAULT_THRESHOLDS)) {
      const storedValue = parsed[key]
      const minValue = MIN_THRESHOLDS[key]
      const maxValue = MAX_THRESHOLDS[key]
      
      if (typeof storedValue === 'number' && 
          storedValue >= minValue && 
          storedValue <= maxValue) {
        validated[key] = storedValue
      } else {
        validated[key] = defaultValue
      }
    }
    
    // Ensure ordering constraint: hint < concern < warning < confirmed
    if (validated.hint >= validated.concern) {
      validated.concern = validated.hint + 1
    }
    if (validated.concern >= validated.warning) {
      validated.warning = validated.concern + 1
    }
    if (validated.warning >= validated.confirmed) {
      validated.confirmed = validated.warning + 1
    }
    
    return validated
  } catch (e) {
    console.warn('[NotificationConfig] Failed to load thresholds:', e)
    return DEFAULT_THRESHOLDS
  }
}

/**
 * Save thresholds to localStorage
 * @param {Object} thresholds - Threshold configuration to save
 * @returns {boolean} Success status
 */
export function saveThresholds(thresholds) {
  if (typeof window === 'undefined') return false
  
  try {
    // Validate values
    for (const [key, value] of Object.entries(thresholds)) {
      if (typeof value !== 'number' || 
          value < MIN_THRESHOLDS[key] || 
          value > MAX_THRESHOLDS[key]) {
        console.error(`[NotificationConfig] Invalid threshold for ${key}: ${value}`)
        return false
      }
    }
    
    // Ensure ordering
    if (thresholds.hint >= thresholds.concern ||
        thresholds.concern >= thresholds.warning ||
        thresholds.warning >= thresholds.confirmed) {
      console.error('[NotificationConfig] Thresholds must be in ascending order')
      return false
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(thresholds))
    return true
  } catch (e) {
    console.error('[NotificationConfig] Failed to save thresholds:', e)
    return false
  }
}

/**
 * Reset thresholds to defaults
 */
export function resetThresholds() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Get current threshold configuration (with metadata)
 * @returns {Object} Configuration with defaults, min, max
 */
export function getThresholdConfig() {
  const current = loadThresholds()
  
  return {
    current,
    defaults: DEFAULT_THRESHOLDS,
    min: MIN_THRESHOLDS,
    max: MAX_THRESHOLDS,
  }
}

/**
 * Debug utility to set thresholds from console
 * Usage: window.setNotificationThresholds({ hint: 2, concern: 4, warning: 6 })
 * 
 * @param {Object} newThresholds - Partial threshold object
 */
export function setThresholdsDebug(newThresholds) {
  const current = loadThresholds()
  const merged = { ...current, ...newThresholds }
  
  if (saveThresholds(merged)) {
    console.log('[NotificationConfig] Thresholds updated:', merged)
    console.log('[NotificationConfig] Reload page to apply changes')
    return merged
  }
  
  return null
}

// Expose debug API in development
if (typeof window !== 'undefined' && import.meta.env?.DEV) {
  window.__NOTIFICATION_CONFIG__ = {
    get: getThresholdConfig,
    set: setThresholdsDebug,
    reset: resetThresholds,
  }
  
  console.log('[NotificationConfig] Debug API available at window.__NOTIFICATION_CONFIG__')
}
