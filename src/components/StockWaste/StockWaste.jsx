import React from 'react';
import Card from '../Card/Card';
import CountBadge from '../CountBadge';
import { parseCard, getCardRotation } from '../../utils/cardUtils';

const StockWaste = ({
  snapshot,
  config,
  simulateStockDraw,
  currentStockCards,
  currentWasteCards,
  pocket1,
  pocket2,
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
  autoMoveAnimation,
  controls
}) => {
  if (!snapshot) return null;
  
  const metadata = snapshot.metadata;
  
  // Calculate depth based on actual card counts
  // Every 5 cards adds a visual layer, max 5 layers (capped for visual consistency)
  const stockDepthLayers = Math.min(5, Math.floor(currentStockCards.length / 5) + 1);
  const wasteDepthLayers = Math.min(5, Math.floor(currentWasteCards.length / 5) + 1);
  
  // Get top waste card
  const topWasteCard = currentWasteCards.length > 0 
    ? currentWasteCards[currentWasteCards.length - 1]
    : null;

  // Generate deterministic rotations for depth layers based on index
  const getDepthLayerRotation = (index, isStock = true) => {
    if (!config.isFun) return 0;
    return (isStock ? index * 0.3 - 0.6 : index * 0.2 - 0.3);
  };

  // Check if stock is empty
  const isStockEmpty = currentStockCards.length === 0;
  const canRecycle = isStockEmpty && currentWasteCards.length > 0;

  // Check for auto-move slurp animations
  const isWasteSlurping = autoMoveAnimation?.phase === 'slurp' &&
                          autoMoveAnimation?.source?.type === 'waste' &&
                          autoMoveAnimation?.cardStr === topWasteCard;
  const isPocket1Slurping = autoMoveAnimation?.phase === 'slurp' &&
                            autoMoveAnimation?.source?.type === 'pocket' &&
                            autoMoveAnimation?.source?.pocketNum === 1;
  const isPocket2Slurping = autoMoveAnimation?.phase === 'slurp' &&
                            autoMoveAnimation?.source?.type === 'pocket' &&
                            autoMoveAnimation?.source?.pocketNum === 2;

  // Pocket drop handlers
  const handlePocketDragOver = (e, pocketNum) => {
    if (isValidTarget({ type: 'pocket', pocketNum })) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handlePocketDrop = (e, pocketNum) => {
    e.preventDefault();
    if (onDrop) {
      onDrop({ type: 'pocket', pocketNum });
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    }}>
      {/* Stock Pile */}
      <div className="stock-container" style={{
        position: 'relative',
        width: 'var(--card-w)',
        height: 'var(--card-h)'
      }}>
        {isStockEmpty ? (
          /* Empty Stock - Show recycle indicator */
          <div 
            className="stock-empty"
            onClick={canRecycle ? simulateStockDraw : undefined}
            title={canRecycle ? `♻️ Click to recycle ${currentWasteCards.length} cards` : 'No cards in stock'}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '6px',
              border: canRecycle 
                ? '2px dashed rgba(76, 175, 80, 0.6)' 
                : '2px dashed rgba(255, 255, 255, 0.2)',
              background: canRecycle 
                ? 'rgba(76, 175, 80, 0.1)' 
                : 'rgba(255, 255, 255, 0.02)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              cursor: canRecycle ? 'pointer' : 'default',
              transition: 'all 0.3s ease',
              color: canRecycle ? '#4CAF50' : '#555'
            }}
            onMouseEnter={(e) => {
              if (canRecycle) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.borderColor = 'rgba(76, 175, 80, 0.9)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.borderColor = canRecycle 
                ? 'rgba(76, 175, 80, 0.6)'
                : 'rgba(255, 255, 255, 0.2)';
            }}
          >
            {canRecycle ? '♻️' : ''}
          </div>
        ) : (
          /* Stock with cards */
          <div className="stock-pile">
            {Array.from({ length: stockDepthLayers }).map((_, i) => (
              <div 
                key={`stock-depth-${i}`}
                className="stock-depth-layer"
                style={{
                  position: 'absolute',
                  // Offset from center: deepest layer at (0,0), layers above go up-left
                  // (i - (stockDepthLayers - 1)) makes the last (deepest) layer centered
                  top: `${(i - (stockDepthLayers - 1)) * 2}px`,
                  left: `${(i - (stockDepthLayers - 1)) * 2}px`,
                  width: '100%',
                  height: '100%',
                  zIndex: `calc(var(--z-stock-waste) - 200 - ${i})`,
                  opacity: `${0.8 - (i * 0.15)}`,
                  transform: config.isFun 
                    ? `rotate(${getDepthLayerRotation(i, true)}deg)`
                    : '',
                  transition: 'transform 0.3s ease',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed rgba(255, 255, 255, 0.3)',
                  boxSizing: 'border-box'
                }}
              />
            ))}
            
            <div 
              className="stock-top-card"
              onClick={simulateStockDraw}
              title={`Stock: ${currentStockCards.length} cards\nClick to draw a card`}
              style={{
                position: 'absolute',
                // Position above the shallowest depth layer to stack upward
                // (same offset as layer 0, which is at index 0)
                top: `${-(stockDepthLayers - 1) * 2}px`,
                left: `${-(stockDepthLayers - 1) * 2}px`,
                width: '100%',
                height: '100%',
                zIndex: 'calc(var(--z-stock-waste) - 190)',
                cursor: 'pointer',
                backgroundImage: 'var(--sprite-url)',
                backgroundSize: '1040px 560px',
                backgroundPosition: '-480px -448px',
                borderRadius: '6px',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.5)',
                transform: config.isFun 
                  ? `rotate(${getCardRotation("stock-back", config.rotationSeed)}deg)`
                  : '',
                transformOrigin: 'center',
                transition: 'transform 0.3s ease'
              }}
              onMouseEnter={(e) => {
                const currentRotation = config.isFun 
                  ? `rotate(${getCardRotation("stock-back", config.rotationSeed)}deg) `
                  : '';
                e.currentTarget.style.transform = `${currentRotation}translateY(-5px) scale(1.05)`;
                e.currentTarget.style.zIndex = 'var(--z-card-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = config.isFun 
                  ? `rotate(${getCardRotation("stock-back", config.rotationSeed)}deg)`
                  : '';
                e.currentTarget.style.zIndex = 'calc(var(--z-stock-waste) - 190)';
              }}
            />
          </div>
        )}
        
        {/* Card count badge */}
        <CountBadge count={currentStockCards.length} variant="stock" />
      </div>
      
      {/* Waste Pile */}
      <div className="waste-container" style={{
        position: 'relative',
        width: 'var(--card-w)',
        height: 'var(--card-h)'
      }}>
        <div className="waste-pile">
          {currentWasteCards.length === 0 ? (
            /* Empty waste placeholder */
            <div style={{
              width: '100%',
              height: '100%',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.02)',
              boxSizing: 'border-box'
            }} />
          ) : (
            <>
              {/* Waste pile depth layers - same visual model as stock */}
              {Array.from({ length: wasteDepthLayers }).map((_, i) => (
                <div 
                  key={`waste-depth-${i}`}
                  className="waste-depth-layer"
                  style={{
                    position: 'absolute',
                    // Offset from center: deepest layer at (0,0), layers above go up-left
                    top: `${(i - (wasteDepthLayers - 1)) * 2}px`,
                    left: `${(i - (wasteDepthLayers - 1)) * 2}px`,
                    width: '100%',
                    height: '100%',
                    // Waste pile z-index above stock pile (200 range vs 100 range)
                    zIndex: `calc(var(--z-stock-waste) - 100 - ${i})`,
                    opacity: `${0.7 - (i * 0.15)}`,
                    transform: config.isFun 
                      ? `rotate(${getDepthLayerRotation(i, false)}deg)`
                      : '',
                    transition: 'transform 0.3s ease',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxSizing: 'border-box'
                  }}
                />
              ))}
              
              {topWasteCard && (
                <Card
                  cardData={parseCard(topWasteCard)}
                  cardStr={topWasteCard}
                  isBack={false}
                  config={config}
                  className={isWasteSlurping ? 'auto-move-slurping' : ''}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onDoubleClick={onDoubleClick}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  onTouchCancel={onTouchCancel}
                  isDraggable={true}
                  isDragging={dragState?.draggedCard === topWasteCard}
                  location={{ type: 'waste', index: currentWasteCards.length - 1 }}
                  style={{
                    position: 'absolute',
                    // Position above the shallowest depth layer
                    top: -(wasteDepthLayers - 1) * 2,
                    left: -(wasteDepthLayers - 1) * 2,
                    // Waste pile z-index above stock pile
                    zIndex: 'calc(var(--z-stock-waste) + 10)'
                  }}
                />
              )}
            </>
          )}
        </div>
        
        {/* Waste count badge */}
        <CountBadge count={currentWasteCards.length > 1 ? currentWasteCards.length : 0} variant="waste" />
      </div>

      {controls && controls}

      {/* Add 40px gap between waste and pocket1 */}
      <div style={{ marginLeft: '30px' }}>
        {/* Pocket 1 */}
        <div
          className={`slot pocket-slot ${metadata.pockets >= 1 ? '' : 'pocket-inactive'} ${
            isValidTarget({ type: 'pocket', pocketNum: 1 }) ? 'valid-drop-target' : ''
          }`}
          style={{
            position: 'relative',
            width: 'var(--card-w)',
            height: 'var(--card-h)',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: isValidTarget({ type: 'pocket', pocketNum: 1 })
              ? '2px solid rgba(76, 175, 80, 0.8)'
              : '1px solid rgba(255, 255, 255, 0.1)',
            boxSizing: 'border-box',
            opacity: metadata.pockets >= 1 ? 1 : 0.1,
            transition: 'all 0.3s',
            boxShadow: isValidTarget({ type: 'pocket', pocketNum: 1 })
              ? '0 0 20px rgba(76, 175, 80, 0.4)'
              : 'none'
          }}
          onDragOver={(e) => handlePocketDragOver(e, 1)}
          onDrop={(e) => handlePocketDrop(e, 1)}
        >
          {pocket1 && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%'
            }}>
              <Card
                cardData={parseCard(pocket1)}
                cardStr={pocket1}
                isBack={false}
                config={config}
                className={isPocket1Slurping ? 'auto-move-slurping' : ''}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDoubleClick={onDoubleClick}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onTouchCancel={onTouchCancel}
                isDraggable={true}
                isDragging={dragState?.draggedCard === pocket1}
                location={{ type: 'pocket', pocketNum: 1 }}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Pocket 2 (only for double mode) */}
      <div
        className={`slot pocket-slot ${metadata.pockets >= 2 ? '' : 'pocket-inactive'} ${
          isValidTarget({ type: 'pocket', pocketNum: 2 }) ? 'valid-drop-target' : ''
        }`}
        style={{
          position: 'relative',
          width: 'var(--card-w)',
          height: 'var(--card-h)',
          borderRadius: '6px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: isValidTarget({ type: 'pocket', pocketNum: 2 })
            ? '2px solid rgba(76, 175, 80, 0.8)'
            : '1px solid rgba(255, 255, 255, 0.1)',
          boxSizing: 'border-box',
          opacity: metadata.pockets >= 2 ? 1 : 0.1,
          transition: 'all 0.3s',
          boxShadow: isValidTarget({ type: 'pocket', pocketNum: 2 })
            ? '0 0 20px rgba(76, 175, 80, 0.4)'
            : 'none'
        }}
        onDragOver={(e) => handlePocketDragOver(e, 2)}
        onDrop={(e) => handlePocketDrop(e, 2)}
      >
        {pocket2 && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}>
            <Card
              cardData={parseCard(pocket2)}
              cardStr={pocket2}
              isBack={false}
              config={config}
              className={isPocket2Slurping ? 'auto-move-slurping' : ''}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDoubleClick={onDoubleClick}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onTouchCancel={onTouchCancel}
              isDraggable={true}
              isDragging={dragState?.draggedCard === pocket2}
              location={{ type: 'pocket', pocketNum: 2 }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default StockWaste;
