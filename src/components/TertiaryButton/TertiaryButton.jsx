import React from 'react';
import styles from './TertiaryButton.module.css';

/**
 * TertiaryButton Component
 *
 * Supporting action button - text link style for subtle actions.
 *
 * @param {React.ReactNode} children - Button text/content
 * @param {function} onClick - Click handler
 * @param {boolean} disabled - Disabled state
 * @param {string} type - Button type attribute
 * @param {string} className - Additional CSS classes
 */
const TertiaryButton = ({
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

export default TertiaryButton;
