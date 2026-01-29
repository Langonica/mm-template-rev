import React, { useCallback, useEffect, useState } from 'react';
import styles from './GameStateToast.module.css';
import { Lightbulb, MessageCircle } from '../Icon';

/**
 * GameStateToast Component (Phase 3)
 *
 * Displays non-intrusive notifications for game state detection.
 * Used for 'hint' and 'concern' tiers of the notification system.
 *
 * Features:
 * - Auto-dismiss after duration (configurable)
 * - Manual dismiss via X button
 * - Slide-in/out animations
 * - Different styles for hint vs concern tiers
 *
 * @param {boolean} isOpen - Whether toast is visible
 * @param {string} tier - 'hint' | 'concern'
 * @param {string} message - Main message to display
 * @param {string} subtext - Optional secondary text
 * @param {number} duration - Auto-dismiss duration in ms (default: 5000)
 * @param {function} onDismiss - Handler when toast is dismissed
 * @param {function} onAction - Handler for action button click
 * @param {string} actionLabel - Label for action button (optional)
 */
const GameStateToast = ({
  isOpen,
  tier = 'hint',
  message,
  subtext,
  duration = 5000,
  onDismiss,
  onAction,
  actionLabel,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Handle open/close with animation
  useEffect(() => {
    if (isOpen) {
      setIsExiting(false);
      // Small delay to allow mount before animation
      const showTimer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(showTimer);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    // Wait for exit animation before calling onDismiss
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 300);
  }, [onDismiss]);

  // Auto-dismiss timer
  useEffect(() => {
    if (!isOpen || !isVisible) return;

    // Only auto-dismiss for hint tier, concern stays until user action
    if (tier === 'hint') {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isVisible, tier, duration, handleDismiss]);

  const handleAction = () => {
    onAction?.();
    handleDismiss();
  };

  if (!isOpen && !isVisible) return null;

  const getIcon = () => {
    switch (tier) {
      case 'concern':
        return <Lightbulb size={20} />;
      case 'hint':
      default:
        return <MessageCircle size={20} />;
    }
  };

  const containerClass = `${styles.container} ${
    tier === 'concern' ? styles.concern : styles.hint
  } ${isVisible && !isExiting ? styles.visible : ''} ${
    isExiting ? styles.exiting : ''
  }`;

  return (
    <div className={containerClass} role="status" aria-live="polite">
      <div className={styles.content}>
        <span className={styles.icon}>{getIcon()}</span>
        <div className={styles.text}>
          <p className={styles.message}>{message}</p>
          {subtext && <p className={styles.subtext}>{subtext}</p>}
        </div>
        {actionLabel && onAction && (
          <button 
            className={styles.actionButton}
            onClick={handleAction}
            type="button"
          >
            {actionLabel}
          </button>
        )}
      </div>
      <button
        className={styles.closeButton}
        onClick={handleDismiss}
        aria-label="Dismiss notification"
        type="button"
      >
        ×
      </button>
    </div>
  );
};

export default GameStateToast;
