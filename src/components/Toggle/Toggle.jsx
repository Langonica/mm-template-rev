import React from 'react';
import styles from './Toggle.module.css';

/**
 * Toggle Component
 *
 * Binary on/off toggle switch for settings and preferences.
 *
 * @param {boolean} checked - Whether the toggle is on/off
 * @param {function} onChange - Change handler (receives boolean checked state)
 * @param {boolean} disabled - Disable the toggle
 * @param {string} label - Label text displayed next to toggle
 * @param {string} description - Optional description text below label
 * @param {string} size - Size variant: 'sm' | 'md'
 * @param {string} className - Additional CSS classes
 *
 * @example
 * <Toggle
 *   checked={soundEnabled}
 *   onChange={(checked) => setSoundEnabled(checked)}
 *   label="Sound Effects"
 *   description="Enable game sound effects and audio feedback"
 * />
 */
const Toggle = ({
  checked = false,
  onChange,
  disabled = false,
  label,
  description,
  size = 'md',
  className = '',
  ...props
}) => {
  const handleClick = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    // Space or Enter key toggles the switch
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  };

  const toggleId = React.useId();

  const containerClasses = [
    styles.container,
    className
  ].filter(Boolean).join(' ');

  const switchClasses = [
    styles.switch,
    styles[size],
    checked && styles.checked,
    disabled && styles.disabled
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      <div className={styles.switchWrapper}>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-labelledby={label ? `${toggleId}-label` : undefined}
          aria-describedby={description ? `${toggleId}-description` : undefined}
          className={switchClasses}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          {...props}
        >
          <span className={styles.track}>
            <span className={styles.thumb} />
          </span>
        </button>
      </div>

      {(label || description) && (
        <div className={styles.labelWrapper}>
          {label && (
            <label
              id={`${toggleId}-label`}
              className={styles.label}
              onClick={!disabled ? handleClick : undefined}
            >
              {label}
            </label>
          )}
          {description && (
            <span
              id={`${toggleId}-description`}
              className={styles.description}
            >
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Toggle;
