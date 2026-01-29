import { useState, useEffect, useCallback } from 'react';

// Base game dimensions
const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;

// Padding from viewport edges (in pixels)
const VIEWPORT_PADDING = 16;

// Maximum scale factor (2.0 = up to 2560x1440)
// Set to 2.0 to match 2× asset resolution, prevents excessive blur beyond 2×
const MAX_SCALE = 2.0;

/**
 * Hook to calculate optimal scale for the game container based on viewport size.
 * Ensures the game fits within the viewport without cropping.
 * Supports scaling up to MAX_SCALE for larger viewports (requires 2× assets).
 *
 * @returns {object} { scale, scaledWidth, scaledHeight, devicePixelRatio }
 */
export const useViewportScale = () => {
  const calculateScale = useCallback(() => {
    const availableWidth = window.innerWidth - (VIEWPORT_PADDING * 2);
    const availableHeight = window.innerHeight - (VIEWPORT_PADDING * 2);

    // Calculate scale needed to fit width and height
    const scaleX = availableWidth / BASE_WIDTH;
    const scaleY = availableHeight / BASE_HEIGHT;

    // Use the smaller scale to ensure it fits both dimensions
    // Cap at MAX_SCALE to prevent excessive blur beyond 2× asset resolution
    const scale = Math.min(scaleX, scaleY, MAX_SCALE);

    return {
      scale: Math.round(scale * 1000) / 1000, // Round to 3 decimal places
      scaledWidth: Math.floor(BASE_WIDTH * scale),
      scaledHeight: Math.floor(BASE_HEIGHT * scale),
      devicePixelRatio: window.devicePixelRatio || 1,
    };
  }, []);

  const [dimensions, setDimensions] = useState(() => calculateScale());

  useEffect(() => {
    // Debounced resize handler
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setDimensions(calculateScale());
      }, 100);
    };

    // Listen for resize
    window.addEventListener('resize', handleResize);

    // Also listen for orientation change on mobile
    window.addEventListener('orientationchange', handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [calculateScale]);

  return dimensions;
};

export default useViewportScale;
