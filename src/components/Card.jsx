import React from 'react';
import { getCardRotation } from '../utils/cardUtils';

const Card = ({
  cardData,
  cardStr,
  isBack,
  config,
  style = {},
  className = '',
  onDragStart,
  onDragEnd,
  onDragOver,
  onDropCard,
  onDoubleClick,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onTouchCancel,
  isDraggable = true,
  isDragging = false,
  isValidDropTarget = false,
  location = null
}) => {
  if (!cardData) return null;

  // Calculate rotation for this specific card
  let rotation = 0;
  if (config.isFun && cardStr && config.rotationSeed !== undefined) {
    rotation = getCardRotation(cardStr, config.rotationSeed);
  }

  const cardStyle = {
    backgroundImage: 'var(--sprite-url)',
    backgroundPosition: isBack 
      ? '-480px -448px'
      : `-${cardData.v * 80}px -${cardData.s * 112}px`,
    width: '80px',
    height: '112px',
    position: 'absolute',
    borderRadius: '6px',
    boxShadow: isDragging 
      ? '0 8px 20px rgba(0, 0, 0, 0.8)' 
      : '0 4px 10px rgba(0, 0, 0, 0.5)',
    zIndex: 110,
    transition: isDragging ? 'none' : 'transform 0.2s, box-shadow 0.2s',
    cursor: isDraggable && !isBack ? 'grab' : 'default',
    opacity: isDragging ? 0.5 : 1,
    // Touch-specific styles
    touchAction: isDraggable && !isBack ? 'none' : 'auto',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none',
    ...style
  };

  // Apply rotation if in fun mode
  if (config.isFun && rotation !== 0) {
    cardStyle.transform = `rotate(${rotation}deg)`;
  }

  const handleMouseEnter = (e) => {
    if (!isDraggable || isBack || isDragging) return;

    const currentTransform = e.currentTarget.style.transform || '';
    e.currentTarget.style.transform = `${currentTransform} translateY(-5px) scale(1.05)`;
    e.currentTarget.style.zIndex = '600';
  };

  const handleMouseLeave = (e) => {
    if (isDragging) return;

    // Reset to original rotation
    if (config.isFun && rotation !== 0) {
      e.currentTarget.style.transform = `rotate(${rotation}deg)`;
    } else {
      e.currentTarget.style.transform = '';
    }
    e.currentTarget.style.zIndex = style.zIndex || '110';
  };

  const handleDragStartInternal = (e) => {
    console.log(`Drag start attempt: ${cardStr}, isDraggable=${isDraggable}, isBack=${isBack}`);
    console.log(`Location:`, location);

    if (!isDraggable || isBack) {
      console.log(`Drag blocked: isDraggable=${isDraggable}, isBack=${isBack}`);
      e.preventDefault();
      return;
    }

    // Set drag data
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('cardStr', cardStr);
    if (location) {
      e.dataTransfer.setData('location', JSON.stringify(location));
    }

    // Set drag image with fixed dimensions
    const dragImage = e.currentTarget.cloneNode(true);
    dragImage.style.opacity = '0.8';
    dragImage.style.width = '80px';
    dragImage.style.height = '112px';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px'; // Position off-screen to avoid flash
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 40, 56);
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage);
      }
    }, 0);

    // Change cursor during drag
    e.currentTarget.style.cursor = 'grabbing';

    // Callback to parent
    if (onDragStart) {
      console.log(`Calling onDragStart callback`);
      onDragStart(cardStr, location);
    }
  };

  const handleDragEndInternal = (e) => {
    e.currentTarget.style.cursor = 'grab';

    if (onDragEnd) {
      onDragEnd();
    }
  };

  const handleDoubleClickInternal = (e) => {
    if (!isDraggable || isBack) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    if (onDoubleClick) {
      onDoubleClick(cardStr);
    }
  };

  // Touch event handlers - always enabled since touch events only fire on actual touch
  const handleTouchStartInternal = (e) => {
    if (!isDraggable || isBack) return;

    if (onTouchStart) {
      onTouchStart(e, cardStr, location);
    }
  };

  const handleTouchMoveInternal = (e) => {
    if (!isDraggable || isBack) return;

    if (onTouchMove) {
      onTouchMove(e);
    }
  };

  const handleTouchEndInternal = (e) => {
    if (!isDraggable || isBack) return;

    if (onTouchEnd) {
      onTouchEnd(e);
    }
  };

  const handleTouchCancelInternal = (e) => {
    if (onTouchCancel) {
      onTouchCancel(e);
    }
  };

  // Handle drag over - allow drops if this card is a valid target
  const handleDragOverInternal = (e) => {
    if (isValidDropTarget) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
    if (onDragOver) {
      onDragOver(e, location);
    }
  };

  // Handle drop on this card
  const handleDropInternal = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(`🃏 Drop on card ${cardStr}, isValidDropTarget=${isValidDropTarget}`);
    if (onDropCard && isValidDropTarget) {
      onDropCard(e, location);
    }
  };

  return (
    <div
      className={`card ${className}`.trim()}
      data-value={cardData.value}
      data-suit={cardData.suit}
      data-color={cardData.color}
      data-numeric={cardData.numericValue}
      data-card-str={cardStr}
      style={cardStyle}
      title={`${cardData.display}${isDraggable && !isBack ? ' (Drag to move, Double-click for auto-move)' : ''}`}
      draggable={isDraggable && !isBack}
      onDragStart={handleDragStartInternal}
      onDragEnd={handleDragEndInternal}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDoubleClick={handleDoubleClickInternal}
      onDragOver={handleDragOverInternal}
      onDrop={handleDropInternal}
      onTouchStart={handleTouchStartInternal}
      onTouchMove={handleTouchMoveInternal}
      onTouchEnd={handleTouchEndInternal}
      onTouchCancel={handleTouchCancelInternal}
    />
  );
};

export default Card;
