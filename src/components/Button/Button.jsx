import React from 'react';
import styles from './Button.module.css';

/**
 * Button Component
 *
 * A reusable button with consistent styling and multiple variants.
 *
 * @param {string} variant - Color variant: 'primary' | 'secondary' | 'accent' | 'warning' | 'danger' | 'ghost'
 * @param {string} size - Size variant: 'sm' | 'md' | 'lg'
 * @param {boolean} disabled - Disable the button
 * @param {React.ReactNode} icon - Optional icon element to display
 * @param {boolean} iconOnly - If true, renders as icon-only button (no text)
 * @param {string} className - Additional CSS classes
 * @param {React.ReactNode} children - Button text/content
 * @param {object} props - Additional props passed to button element
 *
 * @example
 * <Button variant="primary" onClick={handleClick}>New Game</Button>
 * <Button variant="secondary" icon={<span>↶</span>}>Undo</Button>
 * <Button variant="ghost" size="sm" disabled>Disabled</Button>
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  icon,
  iconOnly = false,
  className = '',
  children,
  ...props
}) => {
  const classNames = [
    styles.button,
    styles[variant],
    size !== 'md' && styles[size],
    iconOnly && styles.iconOnly,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classNames}
      disabled={disabled}
      {...props}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {!iconOnly && children}
    </button>
  );
};

export default Button;
