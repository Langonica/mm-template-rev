import React, { useEffect, useCallback, useRef } from 'react';
import styles from './ModalContainer.module.css';
import { X } from '../Icon';

/**
 * ModalContainer Component
 *
 * Standardized modal wrapper component for the design system.
 * Provides consistent backdrop, animations, and interaction patterns.
 *
 * @param {boolean} isOpen - Whether modal is visible
 * @param {function} onClose - Callback when modal should close
 * @param {string} title - Optional modal title
 * @param {boolean} showCloseButton - Show X close button (default true)
 * @param {boolean} closeOnBackdrop - Allow closing by clicking backdrop (default true)
 * @param {boolean} closeOnEscape - Allow closing with ESC key (default true)
 * @param {React.ReactNode} children - Modal content
 * @param {string} maxWidth - Max width of modal (default 'min(90vw, 480px)')
 * @param {string} className - Additional CSS class for modal content
 */
const ModalContainer = ({
  isOpen,
  onClose,
  title,
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  children,
  maxWidth = 'min(90vw, 480px)',
  className = '',
}) => {
  const modalRef = useRef(null);

  // Handle escape key
  const handleKeyDown = useCallback((e) => {
    if (closeOnEscape && e.key === 'Escape') {
      onClose();
    }
  }, [closeOnEscape, onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  }, [closeOnBackdrop, onClose]);

  // Set up keyboard listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Focus trap - focus first focusable element on open
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div
        ref={modalRef}
        className={`${styles.modal} ${className}`}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        {showCloseButton && (
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        )}

        {/* Title */}
        {title && (
          <h2 className={styles.title}>{title}</h2>
        )}

        {/* Content */}
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default ModalContainer;
