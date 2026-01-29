import React from 'react';
import styles from './Card.module.css';

const Card = ({
  cardData,
  cardStr,
  isBack,
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

  const cardStyle = {
    backgroundPosition: isBack 
      ? '-480px -448px'
      : `-${cardData.v * 80}px -${cardData.s * 112}px`,
    ...style
  };

  // Build className
  const cardClassName = [
    styles.card,
    isDragging && styles.dragging,
    isValidDropTarget && styles.validDropTarget,
    className
  ].filter(Boolean).join(' ');

  const handleMouseEnter = (e) => {
    if (!isDraggable || isBack || isDragging) return;

    const currentTransform = e.currentTarget.style.transform || '';
    e.currentTarget.style.transform = `${currentTransform} translateY(-5px) scale(1.05)`;
    e.currentTarget.style.zIndex = 'var(--z-card-hover)';
  };

  const handleMouseLeave = (e) => {
    if (isDragging) return;

    e.currentTarget.style.transform = '';
    e.currentTarget.style.zIndex = style.zIndex || 'calc(var(--z-cards) + 10)';
  };

  const handleDragStartInternal = (e) => {
    if (!isDraggable || isBack) {
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
    dragImage.style.top = '-1000px';
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

  // Touch event handlers
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

  const handleDragOverInternal = (e) => {
    if (isValidDropTarget) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
    if (onDragOver) {
      onDragOver(e, location);
    }
  };

  const handleDropInternal = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDropCard && isValidDropTarget) {
      onDropCard(e, location);
    }
  };

  return (
    <div
      className={cardClassName}
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
