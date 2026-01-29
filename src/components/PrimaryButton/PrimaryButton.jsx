import React from 'react';
import styles from './PrimaryButton.module.css';

/**
 * PrimaryButton Component
 *
 * Main call-to-action button. Fixed dimensions for sprite compatibility.
 * Supports default and danger variants for confirmations.
 *
 * @param {React.ReactNode} children - Button text/content
 * @param {function} onClick - Click handler
 * @param {boolean} disabled - Disabled state
 * @param {string} type - Button type attribute
 * @param {string} variant - Button variant ('default', 'danger')
 * @param {string} className - Additional CSS classes
 */
const PrimaryButton = ({
  children,
  onClick,
  disabled = false,
  type = 'button',
  variant = 'default',
  className = '',
  ...props
}) => {
  const variantClass = variant === 'danger' ? styles.danger : '';

  return (
    <button
      type={type}
      className={`${styles.button} ${variantClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default PrimaryButton;
