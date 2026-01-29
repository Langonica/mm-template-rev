import React, { useState, useEffect, useRef, useMemo } from 'react';
import Card from '../Card/Card';
import { parseCard, getColumnType, getColumnTypeName } from '../../utils/cardUtils';

// CSS-derived constants for card positioning
// These match the CSS custom properties in App.css
const CARD_HEIGHT = 112;
const TRACK_HEIGHT = 290;
const THEATER_TOP = 190;
const OVERLAP = 16;
const CARD_WIDTH = 80;
const GAP = 20;
const START_X = 300;

const Column = ({
  columnIndex,
  cards = [],
  config,
  snapshot,
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
  animatingCard = null,
  autoMoveAnimation = null
}) => {
  // Track animation states
  const [portalFlash, setPortalFlash] = useState(false);
  const [poppingCard, setPoppingCard] = useState(null);
  const [slurpingCard, setSlurpingCard] = useState(null); // Card being slurped into portal
  const prevWasEmptyRef = useRef(cards.length === 0);
  const prevCardsLengthRef = useRef(cards.length);

  // Pre-calculate positioning values based on column type
  // This avoids calling getComputedStyle in the render loop (Performance fix - Phase 1)
  const positioning = useMemo(() => {
    const trackBottom = THEATER_TOP + TRACK_HEIGHT;
    const plinthHeight = 20;
    const minTop = THEATER_TOP + plinthHeight;
    
    return {
      trackBottom,
      minTop,
      theaterTop: THEATER_TOP
    };
  }, []);

  // Detect when a card lands via portal (empty column received a card)
  useEffect(() => {
    const wasEmpty = prevWasEmptyRef.current;
    const nowHasCards = cards.length > 0;
    const receivedCard = wasEmpty && nowHasCards;

    if (receivedCard && cards.length === 1) {
      // Card just landed via portal - trigger pop animation after slurp completes
      const landedCard = cards[0];

      // Delay pop animation to let slurp finish
      setTimeout(() => {
        setPoppingCard(landedCard);
        setPortalFlash(true);
        setTimeout(() => setPortalFlash(false), 100);
        setTimeout(() => {
          setPoppingCard(null);
          setSlurpingCard(null);
        }, 400);
      }, 300); // Wait for slurp animation
    }

    prevCardsLengthRef.current = cards.length;
    prevWasEmptyRef.current = cards.length === 0;
  }, [cards]);

  const bottomCard = cards[0] ? parseCard(cards[0]) : null;
  
  // Use v2.0 columnState if available, otherwise calculate
  let columnType, columnTypeName;
  if (snapshot?.columnState?.types && snapshot.columnState.types[columnIndex] !== undefined) {
    columnType = snapshot.columnState.types[columnIndex] || 'empty';
    columnTypeName = getColumnTypeName(columnType);
  } else {
    columnType = getColumnType(bottomCard, columnIndex, snapshot?.isPressureTest);
    columnTypeName = getColumnTypeName(columnType);
  }
  
  // Calculate centered position for tableau
  const left = START_X + (columnIndex * (CARD_WIDTH + GAP));
  
  // Check if this column is a valid drop target
  const isValid = isValidTarget({ type: 'tableau', column: columnIndex });
  
  // Handle drag over
  const handleDragOver = (e) => {
    if (isValid) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };

  // Handle drop - with slurp animation for empty columns (single cards only)
  const handleDropEvent = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Get the dragged card info
    const cardStr = e.dataTransfer.getData('cardStr');
    const cardData = cardStr ? parseCard(cardStr) : null;

    // Only trigger slurp animation for single-card moves to empty columns
    // Multi-card stacks skip animation (tracked in BACKLOG.md for future enhancement)
    const isSingleCardMove = dragState?.draggedCards?.length === 1;
    if (cards.length === 0 && cardData && isValid && isSingleCardMove) {
      // Set slurping card for visual overlay
      setSlurpingCard({ cardStr, cardData });
    }

    // Execute drop immediately
    if (onDrop) {
      onDrop({ type: 'tableau', column: columnIndex });
    }
  };

  return (
    <>
      <div
        className={`lane-track lane-${columnType} ${isValid ? 'valid-drop-target' : ''}`}
        style={{
          left: `${left}px`,
          top: 'var(--theater-top)',
          border: isValid ? '2px solid rgba(76, 175, 80, 0.8)' : undefined,
          boxShadow: isValid ? '0 0 20px rgba(76, 175, 80, 0.4)' : undefined,
          transition: 'all 0.3s ease'
        }}
        onDragOver={handleDragOver}
        onDrop={handleDropEvent}
      >
        <div className={`plinth plinth-${columnType}`} style={{
          top: columnType === 'ace' ? '0px' : 'calc(var(--track-h) - var(--card-h))',
          borderTopLeftRadius: columnType === 'ace' ? '8px' : '0px',
          borderTopRightRadius: columnType === 'ace' ? '8px' : '0px',
          borderBottomLeftRadius: columnType === 'ace' ? '0px' : '8px',
          borderBottomRightRadius: columnType === 'ace' ? '0px' : '8px'
        }}>
          {columnTypeName}
        </div>
      </div>
      
      {cards.length === 0 && !slurpingCard && (
        /* Empty column with portal drop zone */
        <div
          className={`empty-column-zone ${isValid ? 'valid-drop-target' : ''}`}
          style={{
            position: 'absolute',
            left: `${left}px`,
            top: 'var(--theater-top)',
            width: 'var(--card-w)',
            height: 'var(--track-h)',
            borderRadius: '8px',
            background: 'transparent',
            zIndex: 'var(--z-cards)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto'
          }}
          onDragOver={handleDragOver}
          onDrop={handleDropEvent}
        >
          {/* Portal element - centered in column */}
          <div
            className={`portal ${isValid ? 'active' : ''}`}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Portal hint text */}
            <span style={{
              fontSize: '11px',
              fontWeight: 'bold',
              color: isValid ? '#4CAF50' : 'rgba(255, 255, 255, 0.4)',
              textShadow: isValid ? '0 0 10px rgba(76, 175, 80, 0.5)' : 'none',
              whiteSpace: 'nowrap',
              transition: 'all 0.3s ease',
              zIndex: 'calc(var(--z-game-base) + 10)',
            }}>
              {isValid ? 'DROP' : 'A / K'}
            </span>
          </div>
        </div>
      )}

      {/* Slurping card animation overlay - persists after drop */}
      {slurpingCard && (
        <div
          style={{
            position: 'absolute',
            left: `${left}px`,
            top: 'var(--theater-top)',
            width: 'var(--card-w)',
            height: 'var(--track-h)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 'var(--z-portal)',
            pointerEvents: 'none'
          }}
        >
          {/* Portal with slurping state */}
          <div
            className="portal slurping"
            style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              position: 'relative'
            }}
          />
          {/* Slurping card */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'var(--card-w)',
              height: 'var(--card-h)',
              backgroundImage: 'var(--sprite-url)',
              backgroundSize: '1040px 560px',
              backgroundPosition: `-${slurpingCard.cardData.v * 80}px -${slurpingCard.cardData.s * 112}px`,
              borderRadius: '6px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.8)',
              animation: 'card-slurp 300ms ease-in forwards',
              zIndex: 'calc(var(--z-portal) + 1)'
            }}
          />
        </div>
      )}
      
      {cards.map((cardStr, index) => {
        const cardData = parseCard(cardStr);
        if (!cardData) return null;
        
        // Determine if card is face-down
        let isBack = false;
        const allUp = snapshot?.metadata?.allUp;
        const isPressureTest = snapshot?.isPressureTest;
        
        if (!allUp && columnIndex > 0 && !isPressureTest) {
          // Use v2.0 columnState if available
          if (snapshot?.columnState?.faceDownCounts) {
            const faceDownCount = snapshot.columnState.faceDownCounts[columnIndex] || 0;
            isBack = index < faceDownCount;
          } else {
            // Fallback: In hidden/hidden_double modes, first 'columnIndex' cards are face-down
            isBack = index < columnIndex;
          }
        }
        
        // Calculate card position based on column type
        // Uses pre-calculated positioning values (Performance fix - Phase 1)
        let cardTop;
        if (columnType === 'ace') {
          // For Ace columns: Start from bottom of track and build upward
          const positionFromBottom = index;
          cardTop = positioning.trackBottom - CARD_HEIGHT - (positionFromBottom * OVERLAP);

          if (cardTop < positioning.minTop) {
            cardTop = positioning.minTop;
          }
        } else {
          // For King/Traditional columns: normal top-down stacking
          cardTop = positioning.theaterTop + (index * OVERLAP);
        }
        
        const cardStyle = {
          left: `${left}px`,
          top: `${cardTop}px`,
          zIndex: `calc(var(--z-cards) + ${index})`
        };
        
        // Check if this card is accessible for dragging
        const faceDownCount = snapshot?.columnState?.faceDownCounts?.[columnIndex] || 0;
        const isDraggable = !isBack && index >= faceDownCount;

        // Top card is the valid drop target for the column
        const isTopCard = index === cards.length - 1;
        const isCardValidTarget = isTopCard && isValid;

        // Handle drop on card - forward to column drop handler
        const handleCardDrop = (e, cardLocation) => {
          if (onDrop) {
            onDrop({ type: 'tableau', column: columnIndex });
          }
        };

        // Determine animation class for this card
        const isPopping = poppingCard === cardStr;
        const isAceRelocating = animatingCard?.cardStr === cardStr && animatingCard?.type === 'ace-relocate';
        const isAcePopping = animatingCard?.cardStr === cardStr && animatingCard?.type === 'ace-pop';

        // Check if this card is being auto-moved to foundation (slurp phase)
        const isAutoMoveSlurping = autoMoveAnimation?.cardStr === cardStr &&
                                   autoMoveAnimation?.phase === 'slurp';

        // Hide card during slurp phase (card is slurping but not yet popping)
        const isSlurping = slurpingCard?.cardStr === cardStr && !isPopping;

        let animationClass = '';
        if (isPopping) animationClass = 'popping';
        else if (isAceRelocating) animationClass = 'ace-relocating';
        else if (isAcePopping) animationClass = 'ace-popping';
        else if (isAutoMoveSlurping) animationClass = 'auto-move-slurping';

        // If card is being slurped (hidden during slurp animation), don't render it yet
        if (isSlurping) {
          return null;
        }

        return (
          <Card
            key={`${columnIndex}-${index}-${cardStr}`}
            cardData={cardData}
            cardStr={cardStr}
            isBack={isBack}
            config={config}
            style={cardStyle}
            className={animationClass}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDropCard={handleCardDrop}
            onDoubleClick={onDoubleClick}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onTouchCancel={onTouchCancel}
            isDraggable={isDraggable}
            isDragging={dragState?.draggedCard === cardStr}
            isValidDropTarget={isCardValidTarget}
            location={{ type: 'tableau', column: columnIndex, index }}
          />
        );
      })}
    </>
  );
};

export default Column;
