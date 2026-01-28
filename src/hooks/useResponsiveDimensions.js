import { useState, useEffect, useCallback } from 'react';

/**
 * Responsive Dimensions Hook
 *
 * Calculates game dimensions based on viewport size.
 * All dimensions derive from card width, which is calculated from available space.
 *
 * Formula: cardWidth = (availableWidth - padding) / 8.5
 * Where 8.5 = 7 columns + 6 gaps (at 0.25 card width each)
 *
 * See docs/LAYOUT_AUDIT.md for the full ratio model.
 */

// Base dimensions (reference for ratios)
const BASE_CARD_WIDTH = 80;
const BASE_CARD_HEIGHT = 112;
const CARD_ASPECT_RATIO = BASE_CARD_HEIGHT / BASE_CARD_WIDTH; // 1.4

// Minimum card width for touch usability
const MIN_CARD_WIDTH = 50;

// Padding from viewport edges
const VIEWPORT_PADDING = 16;

// Ratio constants (derived from base layout)
const GAP_RATIO = 0.25;          // Column gap = cardWidth × 0.25
const OVERLAP_RATIO = 0.2;       // Card overlap = cardWidth × 0.2
const TRACK_HEIGHT_RATIO = 3.625; // Track height = cardWidth × 3.625 (290px at base)
const COLUMN_COUNT = 7;
const GAP_COUNT = 6;

// Zone height ratios (of play area)
const FND_ZONE_RATIO = 0.23;     // Foundation zone ~23%
const TABLEAU_ZONE_RATIO = 0.51; // Tableau zone ~51%
const BOTTOM_ZONE_RATIO = 0.26;  // Bottom zone ~26%

/**
 * Calculate all dimensions from card width
 */
const calculateDimensions = (cardWidth) => {
  const cardHeight = Math.round(cardWidth * CARD_ASPECT_RATIO);
  const colGap = Math.round(cardWidth * GAP_RATIO);
  const cardOverlap = Math.round(cardWidth * OVERLAP_RATIO);
  const trackHeight = Math.round(cardWidth * TRACK_HEIGHT_RATIO);

  // Total width needed for tableau
  const tableauWidth = (cardWidth * COLUMN_COUNT) + (colGap * GAP_COUNT);

  // Foundation card dimensions (full size)
  const fndCardScale = 1;
  const fndCardWidth = cardWidth;
  const fndCardHeight = cardHeight;
  const fndZoneHeight = fndCardHeight + 18; // Card height + padding
  const fndTop = 50; // Top padding for foundation zone (centers content vertically)

  // Layout positions (vertical distribution)
  const theaterTop = fndTop + fndZoneHeight + 10; // Foundation top + zone + gap
  const bottomZoneTop = theaterTop + trackHeight + 10; // Theater + tracks + gap
  const controlsZoneTop = bottomZoneTop + cardHeight + 15; // Bottom zone + card + gap

  return {
    // Card dimensions
    cardWidth,
    cardHeight,
    cardOverlap,
    cardAspect: CARD_ASPECT_RATIO,

    // Column/gap dimensions
    colGap,
    trackHeight,
    tableauWidth,

    // Foundation dimensions
    fndCardWidth,
    fndCardHeight,
    fndCardScale,
    fndZoneHeight,
    fndTop,

    // Layout positions
    theaterTop,
    bottomZoneTop,
    controlsZoneTop,
    colStartX: 0, // Will be calculated based on centering
  };
};

/**
 * Calculate optimal card width from viewport
 */
const calculateCardWidthFromViewport = (viewportWidth, viewportHeight) => {
  // Available width for the game
  const availableWidth = viewportWidth - (VIEWPORT_PADDING * 2);

  // Card width if we fill the width
  // Formula: availableWidth = (cardWidth × 7) + (cardWidth × 0.25 × 6)
  // availableWidth = cardWidth × (7 + 1.5) = cardWidth × 8.5
  const cardWidthFromWidth = availableWidth / 8.5;

  // For now, just use width-based calculation
  // Height constraints will be added in Phase 3
  let cardWidth = Math.floor(cardWidthFromWidth);

  // Enforce minimum
  if (cardWidth < MIN_CARD_WIDTH) {
    cardWidth = MIN_CARD_WIDTH;
  }

  // Cap at base size (don't scale up beyond design size)
  if (cardWidth > BASE_CARD_WIDTH) {
    cardWidth = BASE_CARD_WIDTH;
  }

  return cardWidth;
};

/**
 * Update CSS custom properties with calculated dimensions
 */
const updateCSSVariables = (dimensions) => {
  const root = document.documentElement;

  root.style.setProperty('--card-w', `${dimensions.cardWidth}px`);
  root.style.setProperty('--card-h', `${dimensions.cardHeight}px`);
  root.style.setProperty('--card-overlap', `${dimensions.cardOverlap}px`);
  root.style.setProperty('--col-gap', `${dimensions.colGap}px`);
  root.style.setProperty('--track-h', `${dimensions.trackHeight}px`);
  root.style.setProperty('--fnd-card-scale', dimensions.fndCardScale);
  root.style.setProperty('--fnd-card-w', `${dimensions.fndCardWidth}px`);
  root.style.setProperty('--fnd-card-h', `${dimensions.fndCardHeight}px`);
  root.style.setProperty('--fnd-height', `${dimensions.fndZoneHeight}px`);
  root.style.setProperty('--fnd-top', `${dimensions.fndTop}px`);

  // Layout positions
  root.style.setProperty('--theater-top', `${dimensions.theaterTop}px`);
  root.style.setProperty('--bottom-zone-top', `${dimensions.bottomZoneTop}px`);
  root.style.setProperty('--controls-zone-top', `${dimensions.controlsZoneTop}px`);
};

/**
 * Hook: useResponsiveDimensions
 *
 * Returns calculated dimensions and updates CSS variables on viewport change.
 */
export const useResponsiveDimensions = () => {
  const [dimensions, setDimensions] = useState(() =>
    calculateDimensions(BASE_CARD_WIDTH)
  );

  const recalculate = useCallback(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const cardWidth = calculateCardWidthFromViewport(viewportWidth, viewportHeight);
    const newDimensions = calculateDimensions(cardWidth);

    setDimensions(newDimensions);
    updateCSSVariables(newDimensions);

    return newDimensions;
  }, []);

  useEffect(() => {
    // Initial calculation
    recalculate();

    // Debounced resize handler
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(recalculate, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [recalculate]);

  return {
    ...dimensions,
    recalculate,
    isMinSize: dimensions.cardWidth <= MIN_CARD_WIDTH,
    isMaxSize: dimensions.cardWidth >= BASE_CARD_WIDTH,
  };
};

export default useResponsiveDimensions;
