import { useEffect, useCallback } from 'react';

/**
 * High-DPI Asset Loading Hook
 * 
 * Selects @2x assets when the game is scaled up significantly.
 * Uses @2x assets when scale >= 1.25 to ensure crisp visuals on large viewports.
 * Also considers DPR for high-DPI displays at smaller scales.
 * 
 * @param {number} scale - Current viewport scale factor from useViewportScale
 * @param {number} devicePixelRatio - Device pixel ratio from useViewportScale
 */
export const useHighDPIAssets = (scale, devicePixelRatio) => {
  const updateAssetUrls = useCallback(() => {
    const root = document.documentElement;
    
    // Determine if we should use @2x assets
    // Primary: Use @2x when scale >= 1.25 (viewport is scaled up)
    // Secondary: Use @2x on high-DPI displays (DPR >= 2) even at smaller scales
    const shouldUse2x = scale >= 1.25 || devicePixelRatio >= 2;
    
    // Card sprite: Use @2x when shouldUse2x is true, OR on high-DPI displays
    // Cards are the most critical visual element
    const cardSpriteUrl = (shouldUse2x || devicePixelRatio >= 1.5)
      ? 'assets/cardspritesheet@2x.png'
      : 'assets/cardspritesheet.png';
    
    // Game board - use @2x when viewport is large enough to benefit
    const gameBoardUrl = shouldUse2x
      ? 'assets/mm-gameboard@2x.png'
      : 'assets/mm-gameboard.png';
    
    // Optional track sprites - only set if using custom sprites
    // These fall back to CSS gradients if files don't exist
    const trackAceUrl = shouldUse2x ? 'assets/aces-up@2x.png' : 'assets/aces-up.png';
    const trackKingUrl = shouldUse2x ? 'assets/kings-down@2x.png' : 'assets/kings-down.png';
    const trackDefaultUrl = shouldUse2x ? 'assets/default-down@2x.png' : 'assets/default-down.png';
    const trackEmptyUrl = shouldUse2x ? 'assets/empty@2x.png' : 'assets/empty.png';
    
    // Apply to CSS custom properties
    root.style.setProperty('--sprite-url', `url('${cardSpriteUrl}')`);
    root.style.setProperty('--gamestage-url', `url('${gameBoardUrl}')`);
    
    // Only set optional track sprites if they exist (checked via CSS)
    // Note: CSS will gracefully fall back to gradients if images fail to load
    root.style.setProperty('--track-ace', `url('${trackAceUrl}')`);
    root.style.setProperty('--track-king', `url('${trackKingUrl}')`);
    root.style.setProperty('--track-default', `url('${trackDefaultUrl}')`);
    root.style.setProperty('--track-empty', `url('${trackEmptyUrl}')`);
    
    // Debug logging - only in development
    if (import.meta.env.DEV) {
      const computedSprite = getComputedStyle(root).getPropertyValue('--sprite-url').trim();
      const computedBoard = getComputedStyle(root).getPropertyValue('--gamestage-url').trim();
      
      // Debug logging removed for production
      // Enable by setting localStorage.setItem('debug-hidpi', '1') and reloading
    }
  }, [scale, devicePixelRatio]);

  useEffect(() => {
    // Initial asset selection
    updateAssetUrls();
    
    // Listen for DPR changes (can happen when moving between displays)
    const handleDprChange = () => {
      updateAssetUrls();
    };
    
    // Some browsers support matchMedia for DPR changes
    const mediaQuery = window.matchMedia(`(-webkit-min-device-pixel-ratio: ${devicePixelRatio})`);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleDprChange);
    } else if (mediaQuery.addListener) {
      // Older browsers
      mediaQuery.addListener(handleDprChange);
    }
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleDprChange);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleDprChange);
      }
    };
  }, [updateAssetUrls, devicePixelRatio]);
};

export default useHighDPIAssets;
