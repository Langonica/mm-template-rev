import React from 'react';
import styles from './Select.module.css';

/**
 * Select Component
 *
 * A styled dropdown select with consistent styling.
 *
 * @param {string} variant - Color variant: 'primary' | 'secondary' | 'ghost'
 * @param {string} size - Size variant: 'sm' | 'md' | 'lg'
 * @param {boolean} disabled - Disable the select
 * @param {Array} options - Array of option objects: [{ value, label }]
 * @param {string} value - Currently selected value
 * @param {function} onChange - Change handler (receives event)
 * @param {string} className - Additional CSS classes
 * @param {object} props - Additional props passed to select element
 *
 * @example
 * <Select
 *   variant="primary"
 *   options={[{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }]}
 *   value={selected}
 *   onChange={(e) => setSelected(e.target.value)}
 * />
 */
const Select = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  options = [],
  value,
  onChange,
  className = '',
  ...props
}) => {
  const classNames = [
    styles.select,
    styles[variant],
    size !== 'md' && styles[size],
    className
  ].filter(Boolean).join(' ');

  return (
    <select
      className={classNames}
      value={value}
      onChange={onChange}
      disabled={disabled}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;
