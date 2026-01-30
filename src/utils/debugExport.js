/**
 * Debug Export Utility
 * 
 * Provides tester data collection functionality for development.
 * Hidden feature - accessible via secret trigger in DEV mode only.
 * 
 * @module debugExport
 */

const EXPORT_VERSION = '1.0.0';

/**
 * Collect all relevant localStorage data for export
 * @returns {Object} Complete localStorage snapshot
 */
export function collectLocalStorageData() {
  const data = {};
  
  // Known Meridian Solitaire keys
  const knownKeys = [
    'meridian_solitaire_stats',
    'meridian_solitaire_session',
    'meridian-gs-telemetry',
    'meridian_campaign_progress',
    'meridian_settings',
    'meridian_theme',
    'meridian_game_logs',
    'touchHintSeen',
    'notificationSettings'
  ];
  
  // Collect known keys
  for (const key of knownKeys) {
    const value = localStorage.getItem(key);
    if (value !== null) {
      try {
        data[key] = JSON.parse(value);
      } catch {
        data[key] = value; // Store as string if not valid JSON
      }
    }
  }
  
  // Also collect any other keys that start with meridian
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('meridian') && !data[key]) {
      try {
        const value = localStorage.getItem(key);
        data[key] = value ? JSON.parse(value) : null;
      } catch {
        data[key] = localStorage.getItem(key);
      }
    }
  }
  
  return data;
}

/**
 * Generate comprehensive export package
 * @returns {Object} Complete export package
 */
export function generateExport() {
  return {
    exportedAt: new Date().toISOString(),
    version: EXPORT_VERSION,
    appVersion: import.meta.env.VITE_APP_VERSION || 'unknown',
    userAgent: navigator.userAgent,
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio
    },
    viewport: {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight
    },
    data: collectLocalStorageData()
  };
}

/**
 * Download export as JSON file
 * @param {Object} exportData - Data to export
 */
export function downloadExport(exportData) {
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  });
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `meridian-debug-export-${timestamp}.json`;
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log(`[DebugExport] Downloaded: ${filename}`);
}

/**
 * Trigger debug export (call from hidden button/key combo)
 * Only works in DEV mode
 */
export function triggerDebugExport() {
  if (!import.meta.env.DEV) {
    console.warn('[DebugExport] Export only available in DEV mode');
    return;
  }
  
  console.log('[DebugExport] Generating export...');
  const exportData = generateExport();
  downloadExport(exportData);
  
  // Also log summary to console
  console.group('Debug Export Summary');
  console.log('Keys exported:', Object.keys(exportData.data).length);
  console.log('Timestamp:', exportData.exportedAt);
  console.log('Full data:', exportData);
  console.groupEnd();
}

/**
 * Expose debug API globally in DEV mode
 */
export function initDebugExport() {
  if (!import.meta.env.DEV) return;
  
  window.__MERIDIAN_DEBUG__ = {
    export: triggerDebugExport,
    getData: generateExport,
    logData: () => console.log('[DebugExport]', generateExport())
  };
  
  console.log('[DebugExport] Debug API available at window.__MERIDIAN_DEBUG__');
}

export default {
  collectLocalStorageData,
  generateExport,
  downloadExport,
  triggerDebugExport,
  initDebugExport
};
