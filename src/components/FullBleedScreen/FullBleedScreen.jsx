import React from 'react';
import styles from './FullBleedScreen.module.css';

/**
 * FullBleedScreen Component
 * 
 * Simple full-screen container. NO header, NO footer.
 * Screens must add their own back buttons.
 * Must be placed INSIDE game-container.
 */
const FullBleedScreen = ({
  isOpen,
  children,
  variant = 'default'
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className={styles.screen}
      data-variant={variant}
    >
      {children}
    </div>
  );
};

export default FullBleedScreen;
