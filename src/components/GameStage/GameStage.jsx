import React from 'react';
import Column from '../Column/Column';
import StockWaste from '../StockWaste/StockWaste';
import Foundation from '../Foundation/Foundation';
import GameControls from '../GameControls';
import GameStats from '../GameStats';

const GameStage = ({
  snapshot,
  config,
  simulateStockDraw,
  currentStockCards,
  currentWasteCards,
  startDrag,
  endDrag,
  handleDrop,
  isValidTarget,
  dragState,
  handleAutoMove,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  handleTouchCancel,
  animatingCard,
  autoMoveAnimation,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onPause,
  moveCount,
  currentTime,
  formatTime,
  circularPlayState
}) => {
  if (!snapshot) {
    return (
      <main id="game-stage" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: '14px'
      }}>
        Loading game snapshot...
      </main>
    );
  }

  // Extract data from snapshot
  const { tableau, stock, waste, pocket1, pocket2, foundations } = snapshot;
  const metadata = snapshot.metadata;

  return (
    <main id="game-stage">
      {/* Top Foundation Zone - BOTH foundations side by side */}
      <div className="foundation-zone f-top" id="top-zone" style={{ position: 'relative' }}>
        {/* Down Foundations (6→A) on LEFT */}
        <Foundation
          zone="down"
          foundations={foundations?.down || {}}
          config={config}
          isDownFoundation={true}
          onDragStart={startDrag}
          onDragEnd={endDrag}
          onDrop={handleDrop}
          onDoubleClick={handleAutoMove}
          isValidTarget={isValidTarget}
          dragState={dragState}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
          autoMoveAnimation={autoMoveAnimation?.target?.zone === 'down' ? autoMoveAnimation : null}
        />

        {/* Up Foundations (7→K) on RIGHT */}
        <Foundation
          zone="up"
          foundations={foundations?.up || {}}
          config={config}
          isDownFoundation={false}
          onDragStart={startDrag}
          onDragEnd={endDrag}
          onDrop={handleDrop}
          onDoubleClick={handleAutoMove}
          isValidTarget={isValidTarget}
          dragState={dragState}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
          autoMoveAnimation={autoMoveAnimation?.target?.zone === 'up' ? autoMoveAnimation : null}
        />
      </div>
      
      {/* Tableau Columns */}
      {Array.from({ length: 7 }, (_, columnIndex) => {
        const columnCards = tableau[columnIndex.toString()] || [];
        // Only pass animatingCard if it's for this column
        const columnAnimatingCard = animatingCard?.columnIndex === columnIndex ? animatingCard : null;
        // Pass autoMoveAnimation if source is this column
        const columnAutoMove = autoMoveAnimation?.source?.type === 'tableau' &&
                               autoMoveAnimation?.source?.column === columnIndex ? autoMoveAnimation : null;
        return (
          <Column
            key={`column-${columnIndex}`}
            columnIndex={columnIndex}
            cards={columnCards}
            config={config}
            snapshot={snapshot}
            onDragStart={startDrag}
            onDragEnd={endDrag}
            onDrop={handleDrop}
            onDoubleClick={handleAutoMove}
            isValidTarget={isValidTarget}
            dragState={dragState}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            animatingCard={columnAnimatingCard}
            autoMoveAnimation={columnAutoMove}
          />
        );
      })}
      
      {/* Bottom Foundation Zone - Stock, Waste, Pockets */}
      <div className="foundation-zone f-bottom" id="bottom-zone">
        <StockWaste
          snapshot={snapshot}
          config={config}
          simulateStockDraw={simulateStockDraw}
          currentStockCards={currentStockCards}
          currentWasteCards={currentWasteCards}
          pocket1={pocket1}
          pocket2={pocket2}
          onDragStart={startDrag}
          onDragEnd={endDrag}
          onDrop={handleDrop}
          onDoubleClick={handleAutoMove}
          isValidTarget={isValidTarget}
          dragState={dragState}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
          autoMoveAnimation={autoMoveAnimation}
        />
      </div>

      {/* Controls and Stats Row */}
      <div className="controls-zone">
        <GameControls
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={onUndo}
          onRedo={onRedo}
          onPause={onPause}
        />
        <GameStats
          moveCount={moveCount}
          currentTime={currentTime}
          formatTime={formatTime}
          circularPlayState={circularPlayState}
        />
      </div>
    </main>
  );
};

export default GameStage;
