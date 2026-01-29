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
  // Use CSS to control visibility instead of conditional rendering
  // This prevents flash from DOM mount/unmount
  return (
    <div 
      className={`${styles.screen} ${isOpen ? styles.open : styles.closed}`}
      data-variant={variant}
      aria-hidden={!isOpen}
    >
      {children}
    </div>
  );
};

export default FullBleedScreen;
