import React from 'react';
import styles from './SecondaryButton.module.css';

/**
 * SecondaryButton Component
 *
 * Alternative main action button. Fixed dimensions for sprite compatibility.
 *
 * @param {React.ReactNode} children - Button text/content
 * @param {function} onClick - Click handler
 * @param {boolean} disabled - Disabled state
 * @param {string} type - Button type attribute
 * @param {string} className - Additional CSS classes
 */
const SecondaryButton = ({
  children,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  ...props
}) => {
  return (
    <button
      type={type}
      className={`${styles.button} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default SecondaryButton;
