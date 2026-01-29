import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Touch Support Hook for Mobile Drag & Drop
 * Converts touch events to drag-like behavior
 */
// Movement threshold in pixels - finger can move this much during long-press
const MOVEMENT_THRESHOLD = 10;
// Long-press delay in ms - reduced for snappier feel
const LONG_PRESS_DELAY = 100;

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

  const ghostElementRef = useRef(null);
  const touchTimeoutRef = useRef(null);
  const touchStartPosRef = useRef({ x: 0, y: 0 }); // Track initial touch position
  const pendingDragRef = useRef(null); // Store pending drag info

  /**
   * Create visual ghost element for touch drag
   */
  const createGhostElement = useCallback((originalElement, x, y) => {
    // Clone the card element
    const ghost = originalElement.cloneNode(true);
    ghost.style.position = 'fixed';
    ghost.style.left = `${x - 40}px`; // Center on touch point
    ghost.style.top = `${y - 56}px`;
    ghost.style.width = '80px';
    ghost.style.height = '112px';
    ghost.style.opacity = '0.8';
    ghost.style.transform = 'scale(1.1) rotate(-5deg)';
    ghost.style.zIndex = 'var(--z-touch-drag)'
    ghost.style.pointerEvents = 'none';
    ghost.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
    ghost.style.transition = 'none';
    
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
   * Find drop target at touch position
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

    // Check if it's a valid drop target
    // Look for foundation, column, or pocket
    const foundationSlot = element.closest('.foundation-slot');
    if (foundationSlot) {
      const zone = foundationSlot.getAttribute('data-foundation-type');
      const suit = foundationSlot.getAttribute('data-suit');
      if (zone && suit) {
        return { type: 'foundation', zone, suit };
      }
    }

    const pocketSlot = element.closest('.pocket-slot');
    if (pocketSlot) {
      const pocketNum = pocketSlot.classList.contains('pocket-slot') ? 
        (pocketSlot.previousElementSibling ? 2 : 1) : 1;
      return { type: 'pocket', pocketNum };
    }

    const laneTrack = element.closest('.lane-track');
    if (laneTrack) {
      // Extract column index from position
      const style = window.getComputedStyle(laneTrack);
      const left = parseInt(style.left);
      const startX = 300;
      const cardWidth = 80;
      const gap = 20;
      const column = Math.round((left - startX) / (cardWidth + gap));
      if (column >= 0 && column < 7) {
        return { type: 'tableau', column };
      }
    }

    // Check for empty column zone (portal area)
    const emptyZone = element.closest('.empty-column-zone');
    if (emptyZone) {
      const style = window.getComputedStyle(emptyZone);
      const left = parseInt(style.left);
      const startX = 300;
      const cardWidth = 80;
      const gap = 20;
      const column = Math.round((left - startX) / (cardWidth + gap));
      if (column >= 0 && column < 7) {
        return { type: 'tableau', column };
      }
    }

    // Also check for cards themselves (drop on top of existing cards)
    const card = element.closest('.card');
    if (card) {
      // Find which column this card is in by checking parent lane-track
      // Cards are positioned absolutely, so find column from card's left position
      const cardLeft = parseInt(window.getComputedStyle(card).left);
      const startX = 300;
      const cardWidth = 80;
      const gap = 20;
      const column = Math.round((cardLeft - startX) / (cardWidth + gap));
      if (column >= 0 && column < 7) {
        return { type: 'tableau', column };
      }
    }

    return null;
  }, []);

  /**
   * Actually start the drag (called after long-press delay)
   */
  const startDragInternal = useCallback((element, x, y, cardStr, location) => {
    // Start drag
    const ghost = createGhostElement(element, x, y);
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

    const touch = e.touches[0];
    const element = e.currentTarget;

    // Store initial position for movement threshold check
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };

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

    // Update ghost position
    if (ghostElementRef.current) {
      ghostElementRef.current.style.left = `${touch.clientX - 40}px`;
      ghostElementRef.current.style.top = `${touch.clientY - 56}px`;
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

  }, [touchState.isDragging, findDropTargetAtPosition, isValidTarget]);

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

  return {
    touchState,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel
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
