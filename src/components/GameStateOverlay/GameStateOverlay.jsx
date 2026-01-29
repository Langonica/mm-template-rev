import React, { useEffect, useState } from 'react';
import styles from './GameStateOverlay.module.css';
import PrimaryButton from '../PrimaryButton';
import SecondaryButton from '../SecondaryButton';
import TertiaryButton from '../TertiaryButton';
import { AlertTriangle } from '../Icon';

/**
 * GameStateOverlay Component (Phase 3)
 *
 * Semi-transparent overlay for warning tier notifications.
 * Displayed when player has 6+ unproductive cycles.
 *
 * Features:
 * - Darkened background overlay
 * - Centered card with warning message
 * - Action buttons: Undo, Keep Playing, Get Hint
 * - Can be dismissed to continue playing
 *
 * @param {boolean} isOpen - Whether overlay is visible
 * @param {number} cycleCount - Number of unproductive cycles
 * @param {number} movesSinceProgress - Moves since last progress
 * @param {function} onDismiss - Handler to dismiss overlay
 * @param {function} onUndo - Handler for undo action
 * @param {function} onHint - Handler for hint action
 * @param {function} onNewDeal - Handler for new deal action
 */
const GameStateOverlay = ({
  isOpen,
  cycleCount = 0,
  movesSinceProgress = 0,
  onDismiss,
  onUndo,
  onHint,
  onNewDeal,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Handle open/close with animation
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 200);
  };

  const handleUndo = () => {
    onUndo?.();
    handleDismiss();
  };

  const handleHint = () => {
    onHint?.();
    handleDismiss();
  };

  const handleNewDeal = () => {
    onNewDeal?.();
    handleDismiss();
  };

  if (!isOpen && !isVisible) return null;

  const overlayClass = `${styles.overlay} ${
    isVisible && !isExiting ? styles.visible : ''
  } ${isExiting ? styles.exiting : ''}`;

  return (
    <div className={overlayClass} role="dialog" aria-modal="true">
      {/* Backdrop - click to dismiss */}
      <div className={styles.backdrop} onClick={handleDismiss} />

      {/* Content card */}
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.icon}><AlertTriangle size={48} /></span>
          <h2 className={styles.title}>You May Be Stuck</h2>
        </div>

        <div className={styles.body}>
          <p className={styles.message}>
            You've gone through the deck <strong>{cycleCount} times</strong> without making
            progress on the foundations.
          </p>
          
          {movesSinceProgress > 0 && (
            <p className={styles.detail}>
              {movesSinceProgress} moves since last foundation card
            </p>
          )}

          <p className={styles.suggestion}>
            Consider undoing some moves or trying a different approach.
          </p>
        </div>

        <div className={styles.actions}>
          <PrimaryButton onClick={handleUndo}>
            Undo Moves
          </PrimaryButton>
          
          <SecondaryButton onClick={handleHint}>
            Get Hint
          </SecondaryButton>
          
          <TertiaryButton onClick={handleNewDeal}>
            New Deal
          </TertiaryButton>
        </div>

        <button
          className={styles.keepPlaying}
          onClick={handleDismiss}
          type="button"
        >
          Keep Playing →
        </button>
      </div>
    </div>
  );
};

export default GameStateOverlay;
