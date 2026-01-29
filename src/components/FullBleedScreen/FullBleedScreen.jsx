import React from 'react';
import styles from './FullBleedScreen.module.css';

/**
 * FullBleedScreen Component
 *
 * Universal wrapper for full-screen experiences.
 * Used for HomeScreen, HowToPlay, Statistics, and other full-bleed screens.
 *
 * @param {boolean} isOpen - Whether screen is visible
 * @param {function} onClose - Close handler (for back button)
 * @param {string} title - Screen title (centered in header)
 * @param {React.ReactNode} headerLeft - Custom left header content (default: Back button)
 * @param {React.ReactNode} headerRight - Custom right header content
 * @param {React.ReactNode} footer - Optional footer content
 * @param {React.ReactNode} children - Screen content
 * @param {string} variant - 'default' | 'home' | 'overlay' (controls z-index)
 */
const FullBleedScreen = ({
  isOpen,
  onClose,
  title,
  headerLeft,
  headerRight,
  footer,
  children,
  variant = 'default'
}) => {
  if (!isOpen) return null;

  const handleBackClick = () => {
    onClose?.();
  };

  return (
    <div 
      className={styles.screen}
      data-variant={variant}
    >
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          {headerLeft !== undefined ? (
            headerLeft
          ) : (
            <button 
              className={styles.backButton}
              onClick={handleBackClick}
              aria-label="Go back"
            >
              ←
            </button>
          )}
        </div>
        
        <h1 className={styles.title}>{title}</h1>
        
        <div className={styles.headerRight}>
          {headerRight}
        </div>
      </header>

      {/* Content */}
      <main className={styles.content}>
        <div className={styles.contentInner}>
          {children}
        </div>
      </main>

      {/* Footer */}
      {footer && (
        <footer className={styles.footer}>
          {footer}
        </footer>
      )}
    </div>
  );
};

export default FullBleedScreen;
