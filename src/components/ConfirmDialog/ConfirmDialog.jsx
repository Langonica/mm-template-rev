import React, { useEffect, useCallback } from 'react';
import styles from './ConfirmDialog.module.css';
import PrimaryButton from '../PrimaryButton';
import TertiaryButton from '../TertiaryButton';

/**
 * ConfirmDialog Component (Redesigned)
 *
 * Simple confirmation dialog with unified component styling.
 * Uses TertiaryButton for cancel and PrimaryButton for confirm.
 *
 * @param {boolean} isOpen - Whether dialog is visible
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {string} confirmText - Confirm button text (default 'Confirm')
 * @param {string} cancelText - Cancel button text (default 'Cancel')
 * @param {function} onConfirm - Handler for confirm action
 * @param {function} onCancel - Handler for cancel action
 * @param {string} variant - Button variant ('default', 'danger')
 */
const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
}) => {
  // Handle escape key to close
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter') {
      onConfirm();
    }
  }, [onCancel, onConfirm]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const confirmVariant = variant === 'danger' ? 'danger' : 'default';

  return (
    <div
      className={styles.overlay}
      onClick={onCancel}
    >
      <div
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className={styles.title}>
          {title}
        </h3>

        <p className={styles.message}>
          {message}
        </p>

        <div className={styles.buttonRow}>
          <TertiaryButton onClick={onCancel}>
            {cancelText}
          </TertiaryButton>

          <PrimaryButton 
            onClick={onConfirm}
            variant={confirmVariant}
          >
            {confirmText}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
