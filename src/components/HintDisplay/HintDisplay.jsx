import React from 'react';
import styles from './HintDisplay.module.css';

/**
 * HintDisplay Component
 * 
 * Shows the current hint with card and target information.
 * Auto-dismisses after 5 seconds or when user makes a move.
 * 
 * @param {Object} hint - Current hint object { card, from, to, priority, reason }
 * @param {function} onDismiss - Callback to dismiss hint
 */
const HintDisplay = ({ hint, onDismiss }) => {
  if (!hint) return null;
  
  // Format card string for display (e.g., "Ah" -> "A♥")
  const formatCard = (cardStr) => {
    if (!cardStr) return '';
    const value = cardStr.slice(0, -1);
    const suit = cardStr.slice(-1);
    const suitSymbols = { h: '♥', d: '♦', c: '♣', s: '♠' };
    return `${value}${suitSymbols[suit] || suit}`;
  };
  
  // Format location for display
  const formatLocation = (location) => {
    if (!location) return '';
    
    switch (location.type) {
      case 'foundation':
        return `${location.zone === 'up' ? 'Up' : 'Down'} Foundation`;
      case 'tableau':
        return `Column ${location.column + 1}`;
      case 'waste':
        return 'Waste';
      case 'pocket':
        return `Pocket ${location.pocketNum}`;
      default:
        return location.type;
    }
  };
  
  const isNoMoves = hint.type === 'none';
  
  return (
    <div className={`${styles.container} ${isNoMoves ? styles.noMoves : ''}`}>
      <div className={styles.content}>
        {isNoMoves ? (
          <span className={styles.message}>{hint.message}</span>
        ) : (
          <>
            <span className={styles.card}>{formatCard(hint.card)}</span>
            <span className={styles.arrow}>→</span>
            <span className={styles.target}>{formatLocation(hint.to)}</span>
            <span className={styles.reason}>{hint.reason}</span>
          </>
        )}
      </div>
      <button 
        className={styles.dismiss}
        onClick={onDismiss}
        title="Dismiss hint"
      >
        ×
      </button>
    </div>
  );
};

export default HintDisplay;
