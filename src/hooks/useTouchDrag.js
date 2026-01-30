import { useState, useCallback, useRef, useEffect } from 'react';
import { parseCard } from '../utils/cardUtils';

/**
 * Touch Support Hook for Mobile Drag & Drop
 * Converts touch events to drag-like behavior
 */
// Movement threshold in pixels - finger can move this much during long-press
const MOVEMENT_THRESHOLD = 10;
// Long-press delay in ms - reduced for snappier feel
const LONG_PRESS_DELAY = 100;
// Card dimensions for ghost element
const CARD_WIDTH = 80;
const CARD_HEIGHT = 112;
// Sprite sheet dimensions
const SPRITE_WIDTH = 1040;
const SPRITE_HEIGHT = 560;
// LocalStorage key for tracking first-time drag usage
const TOUCH_DRAG_USED_KEY = 'meridian_touch_drag_used';

export const useTouchDrag = (onDragStart, onDragEnd, onDrop, isValidTarget) => {
  const [touchState, setTouchState] = useState({
    isDragging: false,
    draggedCard: null,
    draggedElement: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    touchStartTime: 0
  });

  // Touch affordance: show hint when user taps without long-pressing
  const [showDragHint, setShowDragHint] = useState(false);
  const hasUsedDragRef = useRef(false);

  // Initialize hasUsedDrag from localStorage on mount
  useEffect(() => {
    try {
      hasUsedDragRef.current = localStorage.getItem(TOUCH_DRAG_USED_KEY) === 'true';
    } catch {
      hasUsedDragRef.current = false;
    }
  }, []);

  const ghostElementRef = useRef(null);
  const touchTimeoutRef = useRef(null);
  const touchStartPosRef = useRef({ x: 0, y: 0 }); // Track initial touch position
  const pendingDragRef = useRef(null); // Store pending drag info
  const tapStartTimeRef = useRef(0); // Track tap timing for affordance

  /**
   * Create lightweight ghost element for touch drag
   * Builds from card data instead of cloning DOM element to reduce memory usage
   */
  const createGhostElement = useCallback((cardStr, x, y) => {
    const cardData = parseCard(cardStr);
    if (!cardData) {
      // Fallback: create placeholder if card can't be parsed
      const ghost = document.createElement('div');
      ghost.style.cssText = `
        position: fixed;
        left: ${x - CARD_WIDTH / 2}px;
        top: ${y - CARD_HEIGHT / 2}px;
        width: ${CARD_WIDTH}px;
        height: ${CARD_HEIGHT}px;
        background: #333;
        border-radius: 6px;
        opacity: 0.8;
        z-index: var(--z-touch-drag);
        pointer-events: none;
      `;
      document.body.appendChild(ghost);
      return ghost;
    }

    // Calculate sprite position from card data
    const spriteX = cardData.v * CARD_WIDTH;
    const spriteY = cardData.s * CARD_HEIGHT;

    const ghost = document.createElement('div');
    ghost.className = 'touch-drag-ghost';
    ghost.style.cssText = `
      position: fixed;
      left: ${x - CARD_WIDTH / 2}px;
      top: ${y - CARD_HEIGHT / 2}px;
      width: ${CARD_WIDTH}px;
      height: ${CARD_HEIGHT}px;
      background-image: var(--sprite-url);
      background-size: ${SPRITE_WIDTH}px ${SPRITE_HEIGHT}px;
      background-position: -${spriteX}px -${spriteY}px;
      border-radius: 6px;
      opacity: 0.8;
      transform: scale(1.1) rotate(-5deg);
      z-index: var(--z-touch-drag);
      pointer-events: none;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      transition: none;
    `;

    document.body.appendChild(ghost);
    return ghost;
  }, []);

  /**
   * Remove ghost element
   */
  const removeGhostElement = useCallback(() => {
    if (ghostElementRef.current) {
      document.body.removeChild(ghostElementRef.current);
      ghostElementRef.current = null;
    }
  }, []);

  /**
   * Find drop target at touch position using data attributes
   * This decouples drop detection from CSS layout, making it more robust
   */
  const findDropTargetAtPosition = useCallback((x, y) => {
    // Hide ghost temporarily to get element beneath
    if (ghostElementRef.current) {
      ghostElementRef.current.style.display = 'none';
    }

    const element = document.elementFromPoint(x, y);

    // Restore ghost
    if (ghostElementRef.current) {
      ghostElementRef.current.style.display = 'block';
    }

    if (!element) return null;

    // Use data attributes for drop zone detection
    // This is layout-independent and won't break if CSS changes
    const dropZone = element.closest('[data-drop-zone]');

    if (dropZone) {
      const zoneType = dropZone.dataset.dropZone;

      switch (zoneType) {
        case 'column': {
          const columnIndex = parseInt(dropZone.dataset.columnIndex, 10);
          if (!isNaN(columnIndex) && columnIndex >= 0 && columnIndex < 7) {
            return { type: 'tableau', column: columnIndex };
          }
          break;
        }
        case 'pocket': {
          const pocketNum = parseInt(dropZone.dataset.pocketNum, 10);
          if (!isNaN(pocketNum) && (pocketNum === 1 || pocketNum === 2)) {
            return { type: 'pocket', pocketNum };
          }
          break;
        }
        default:
          break;
      }
    }

    // Foundation uses existing data attributes (data-foundation-type, data-suit)
    const foundationSlot = element.closest('.foundation-slot');
    if (foundationSlot) {
      const zone = foundationSlot.dataset.foundationType;
      const suit = foundationSlot.dataset.suit;
      if (zone && suit) {
        return { type: 'foundation', zone, suit };
      }
    }

    // Fallback: Check for cards in tableau columns
    // Cards inherit the column context from their parent drop zone
    const card = element.closest('.card');
    if (card) {
      // Walk up to find the column drop zone
      const parentDropZone = card.closest('[data-drop-zone="column"]');
      if (parentDropZone) {
        const columnIndex = parseInt(parentDropZone.dataset.columnIndex, 10);
        if (!isNaN(columnIndex) && columnIndex >= 0 && columnIndex < 7) {
          return { type: 'tableau', column: columnIndex };
        }
      }
    }

    return null;
  }, []);

  /**
   * Actually start the drag (called after long-press delay)
   */
  const startDragInternal = useCallback((element, x, y, cardStr, location) => {
    // Start drag with lightweight ghost built from card data
    const ghost = createGhostElement(cardStr, x, y);
    ghostElementRef.current = ghost;

    setTouchState({
      isDragging: true,
      draggedCard: cardStr,
      draggedElement: element,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
      touchStartTime: Date.now()
    });

    // Notify parent - this calculates valid targets
    if (onDragStart) {
      onDragStart(cardStr, location);
    }

    // Clear pending drag info
    pendingDragRef.current = null;

    // Add haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, [createGhostElement, onDragStart]);

  /**
   * Handle touch start (begin drag)
   */
  const handleTouchStart = useCallback((e, cardStr, location) => {
    // Prevent default to avoid scrolling
    e.preventDefault();

    // Cancel if multi-touch detected at start
    if (e.touches.length > 1) {
      return;
    }

    const touch = e.touches[0];
    const element = e.currentTarget;

    // Store initial position for movement threshold check
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };

    // Track tap start time for affordance hint
    tapStartTimeRef.current = Date.now();

    // Store pending drag info for use after timeout
    pendingDragRef.current = { element, cardStr, location };

    // Long press detection
    touchTimeoutRef.current = setTimeout(() => {
      if (pendingDragRef.current) {
        const { element, cardStr, location } = pendingDragRef.current;
        const pos = touchStartPosRef.current;
        startDragInternal(element, pos.x, pos.y, cardStr, location);
      }
    }, LONG_PRESS_DELAY);

  }, [startDragInternal]);

  /**
   * Handle touch move (dragging)
   */
  const handleTouchMove = useCallback((e) => {
    // Multi-touch during drag - cancel immediately with haptic feedback
    if (e.touches.length > 1) {
      if (touchState.isDragging) {
        // Cancel the drag cleanly with haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(30); // Short feedback for cancel
        }
        // Inline cancel logic to avoid dependency issues
        if (touchTimeoutRef.current) {
          clearTimeout(touchTimeoutRef.current);
          touchTimeoutRef.current = null;
        }
        pendingDragRef.current = null;
        removeGhostElement();
        if (onDragEnd) {
          onDragEnd();
        }
        setTouchState({
          isDragging: false,
          draggedCard: null,
          draggedElement: null,
          startX: 0,
          startY: 0,
          currentX: 0,
          currentY: 0,
          touchStartTime: 0
        });
      } else if (touchTimeoutRef.current) {
        // Cancel pending long-press
        clearTimeout(touchTimeoutRef.current);
        touchTimeoutRef.current = null;
        pendingDragRef.current = null;
      }
      return;
    }

    const touch = e.touches[0];

    if (!touchState.isDragging) {
      // Check if we've moved beyond threshold during long-press wait
      if (touchTimeoutRef.current && pendingDragRef.current) {
        const dx = touch.clientX - touchStartPosRef.current.x;
        const dy = touch.clientY - touchStartPosRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > MOVEMENT_THRESHOLD) {
          // Moved too much - cancel the long-press
          clearTimeout(touchTimeoutRef.current);
          touchTimeoutRef.current = null;
          pendingDragRef.current = null;
        }
      }
      return;
    }

    e.preventDefault();

    // Update ghost position (centered on touch point)
    if (ghostElementRef.current) {
      ghostElementRef.current.style.left = `${touch.clientX - CARD_WIDTH / 2}px`;
      ghostElementRef.current.style.top = `${touch.clientY - CARD_HEIGHT / 2}px`;
    }

    // Check for valid drop target
    const target = findDropTargetAtPosition(touch.clientX, touch.clientY);

    // Visual feedback for valid/invalid targets on the ghost element
    if (target && isValidTarget && isValidTarget(target)) {
      if (ghostElementRef.current) {
        ghostElementRef.current.style.borderColor = 'rgba(76, 175, 80, 0.8)';
        ghostElementRef.current.style.boxShadow = '0 10px 30px rgba(76, 175, 80, 0.5)';
      }
    } else {
      if (ghostElementRef.current) {
        ghostElementRef.current.style.borderColor = 'transparent';
        ghostElementRef.current.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
      }
    }

    setTouchState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY
    }));

  }, [touchState.isDragging, findDropTargetAtPosition, isValidTarget, removeGhostElement, onDragEnd]);

  /**
   * Handle touch end (drop)
   */
  const handleTouchEnd = useCallback((e) => {
    // Clear long press timeout and pending drag
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
    pendingDragRef.current = null;

    if (!touchState.isDragging) {
      // Check if this was a quick tap (user might not know about long-press)
      const tapDuration = Date.now() - tapStartTimeRef.current;
      const wasQuickTap = tapDuration < LONG_PRESS_DELAY && pendingDragRef.current === null;

      // Show affordance hint if first-time user does a quick tap
      if (wasQuickTap && !hasUsedDragRef.current) {
        setShowDragHint(true);
        // Auto-dismiss after 3 seconds
        setTimeout(() => setShowDragHint(false), 3000);
      }

      setTouchState({
        isDragging: false,
        draggedCard: null,
        draggedElement: null,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        touchStartTime: 0
      });
      return;
    }

    e.preventDefault();

    const touch = e.changedTouches[0];
    const target = findDropTargetAtPosition(touch.clientX, touch.clientY);

    // Check if valid drop
    if (target && isValidTarget && isValidTarget(target)) {
      // Successful drop
      if (onDrop) {
        onDrop(target);
      }

      // Mark that user has successfully used touch drag (for affordance)
      if (!hasUsedDragRef.current) {
        hasUsedDragRef.current = true;
        setShowDragHint(false);
        try {
          localStorage.setItem(TOUCH_DRAG_USED_KEY, 'true');
        } catch {
          // Ignore localStorage errors
        }
      }

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([20, 10, 20]);
      }
    } else {
      // Invalid drop - animate back
      if (ghostElementRef.current && touchState.draggedElement) {
        const rect = touchState.draggedElement.getBoundingClientRect();
        ghostElementRef.current.style.transition = 'all 0.3s ease-out';
        ghostElementRef.current.style.left = `${rect.left}px`;
        ghostElementRef.current.style.top = `${rect.top}px`;
        ghostElementRef.current.style.opacity = '0';
        
        setTimeout(removeGhostElement, 300);
      } else {
        removeGhostElement();
      }

      // Haptic feedback for failure
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }

    // End drag
    if (onDragEnd) {
      onDragEnd();
    }

    // Clean up
    setTimeout(() => {
      removeGhostElement();
      setTouchState({
        isDragging: false,
        draggedCard: null,
        draggedElement: null,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        touchStartTime: 0
      });
    }, target && isValidTarget && isValidTarget(target) ? 0 : 300);

  }, [touchState, findDropTargetAtPosition, isValidTarget, onDrop, onDragEnd, removeGhostElement]);

  /**
   * Handle touch cancel (interrupted drag)
   */
  const handleTouchCancel = useCallback(() => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
    pendingDragRef.current = null;

    removeGhostElement();

    if (onDragEnd) {
      onDragEnd();
    }

    setTouchState({
      isDragging: false,
      draggedCard: null,
      draggedElement: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      touchStartTime: 0
    });
  }, [removeGhostElement, onDragEnd]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
      }
      pendingDragRef.current = null;
      removeGhostElement();
    };
  }, [removeGhostElement]);

  // Dismiss the drag hint manually
  const dismissDragHint = useCallback(() => {
    setShowDragHint(false);
  }, []);

  return {
    touchState,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    // Touch affordance for first-time users
    showDragHint,
    dismissDragHint
  };
};

/**
 * Detect if device supports touch
 */
export const isTouchDevice = () => {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
};

/**
 * Get optimal touch target size
 */
export const getTouchTargetSize = () => {
  // Minimum 44x44px for touch targets (Apple HIG)
  return {
    minWidth: 44,
    minHeight: 44
  };
};
