import React from 'react';
import Card from '../Card/Card';
import CountBadge from '../CountBadge';
import { parseCard } from '../../utils/cardUtils';

const Foundation = ({
  zone,
  foundations,
  config,
  isDownFoundation,
  onDragStart,
  onDragEnd,
  onDrop,
  onDoubleClick,
  isValidTarget,
  dragState,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onTouchCancel,
  autoMoveAnimation
}) => {
  const suits = ['h', 'd', 'c', 's'];
  
  // Handle drag over for foundation
  const handleDragOver = (e, suit) => {
    if (isValidTarget({ type: 'foundation', zone, suit })) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };
  
  // Handle drop on foundation
  const handleDrop = (e, suit) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onDrop) {
      onDrop({ type: 'foundation', zone, suit });
    }
  };
  
  return (
    <div style={{
      display: 'flex',
      gap: '12px'
    }}>
      {suits.map((suit) => {
        const foundationCards = foundations[suit] || [];
        const topCard = foundationCards.length > 0
          ? foundationCards[foundationCards.length - 1]
          : null;
        
        // Calculate depth layers for foundation stacking visual
        // Every 2 cards adds a layer, max 4 layers (subtle but visible)
        const foundationDepthLayers = Math.min(4, Math.floor(foundationCards.length / 2) + 1);

        const isValid = isValidTarget({ type: 'foundation', zone, suit });

        // Check if this suit is receiving a card with pop animation
        const isPopping = autoMoveAnimation?.phase === 'pop' &&
                          autoMoveAnimation?.target?.suit === suit &&
                          autoMoveAnimation?.cardStr === topCard;

        // Check if this suit's top card is being slurped (source of auto-move)
        const isSlurping = autoMoveAnimation?.phase === 'slurp' &&
                           autoMoveAnimation?.source?.type === 'foundation' &&
                           autoMoveAnimation?.source?.suit === suit &&
                           autoMoveAnimation?.cardStr === topCard;
        
        return (
          <div
            key={`${zone}-foundation-${suit}`}
            className={`slot foundation-slot ${isValid ? 'valid-drop-target' : ''}`}
            style={{
              width: 'var(--fnd-card-w)',
              height: 'var(--fnd-card-h)',
              position: 'relative',
              borderColor: isValid
                ? 'rgba(76, 175, 80, 0.8)'
                : isDownFoundation
                  ? 'var(--temp-silver)'
                  : 'var(--temp-gold)',
              borderRadius: '4px',
              background: isValid
                ? 'rgba(76, 175, 80, 0.1)'
                : 'rgba(255, 255, 255, 0.02)',
              border: isValid
                ? '2px solid rgba(76, 175, 80, 0.8)'
                : '1px solid rgba(255, 255, 255, 0.1)',
              boxSizing: 'border-box',
              transition: 'all 0.3s ease',
              boxShadow: isValid
                ? '0 0 15px rgba(76, 175, 80, 0.4)'
                : 'none'
            }}
            data-foundation-type={isDownFoundation ? 'down' : 'up'}
            data-suit={suit}
            onDragOver={(e) => handleDragOver(e, suit)}
            onDrop={(e) => handleDrop(e, suit)}
          >
            {/* Empty foundation indicator */}
            {!topCard && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '20px',
                opacity: 0.2,
                pointerEvents: 'none'
              }}>
                {suit === 'h' ? '' : suit === 'd' ? '' : suit === 'c' ? '' : ''}
              </div>
            )}
            
            {/* Foundation label */}
            <div style={{
              position: 'absolute',
              top: '2px',
              left: '2px',
              fontSize: '7px',
              fontWeight: 'bold',
              color: 'rgba(255, 255, 255, 0.4)',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              pointerEvents: 'none',
              zIndex: 'var(--z-game-base)'
            }}>
              {isDownFoundation ? '↓6' : '↑7'}
            </div>
            
            {/* Foundation depth layers - stack rises up-left from base card */}
            {foundationDepthLayers > 1 && Array.from({ length: foundationDepthLayers }).map((_, i) => (
              <div 
                key={`${zone}-fnd-depth-${suit}-${i}`}
                style={{
                  position: 'absolute',
                  // Center the deepest layer, layers above go up-left
                  top: `${(i - (foundationDepthLayers - 1)) * 2}px`,
                  left: `${(i - (foundationDepthLayers - 1)) * 2}px`,
                  width: 'var(--card-w)',
                  height: 'var(--card-h)',
                  transform: 'scale(var(--fnd-card-scale))',
                  transformOrigin: 'top left',
                  zIndex: `calc(var(--z-foundations) - ${i})`,
                  opacity: `${0.6 - (i * 0.1)}`,
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxSizing: 'border-box',
                  pointerEvents: 'none'
                }}
              />
            ))}
            
            {topCard && (
              <div style={{
                position: 'absolute',
                // Position above the shallowest depth layer
                top: `${-(foundationDepthLayers - 1) * 2}px`,
                left: `${-(foundationDepthLayers - 1) * 2}px`,
                width: 'var(--card-w)',
                height: 'var(--card-h)',
                transform: 'scale(var(--fnd-card-scale))',
                transformOrigin: 'top left',
                zIndex: 'calc(var(--z-foundations) + 10)'
              }}>
                <Card
                  cardData={parseCard(topCard)}
                  cardStr={topCard}
                  isBack={false}
                  config={config}
                  className={isPopping ? 'foundation-popping' : isSlurping ? 'auto-move-slurping' : ''}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onDropCard={(e) => {
                    if (onDrop) {
                      onDrop({ type: 'foundation', zone, suit });
                    }
                  }}
                  onDoubleClick={onDoubleClick}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  onTouchCancel={onTouchCancel}
                  isDraggable={true}
                  isDragging={dragState?.draggedCard === topCard}
                  isValidDropTarget={isValid}
                  location={{
                    type: 'foundation',
                    zone,
                    suit,
                    index: foundationCards.length - 1,
                    isDown: isDownFoundation
                  }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%'
                  }}
                />
              </div>
            )}
            
            {/* Card count indicator for non-empty foundations */}
            <CountBadge 
              count={foundationCards.length} 
              variant={isDownFoundation ? 'foundation-down' : 'foundation-up'} 
            />
          </div>
        );
      })}
    </div>
  );
};

export default Foundation;
