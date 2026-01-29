import React from 'react';
import styles from './ProgressBar.module.css';

/**
 * ProgressBar Component
 *
 * Visual progress indicator with optional label.
 *
 * @param {number} current - Current progress value
 * @param {number} total - Total/maximum value
 * @param {string} label - Optional label (defaults to "current/total")
 * @param {boolean} showPercentage - Show percentage instead of fraction
 * @param {string} className - Additional CSS classes
 */
const ProgressBar = ({
  current,
  total,
  label,
  showPercentage = false,
  className = ''
}) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  
  const displayLabel = label || (showPercentage 
    ? `${percentage}%`
    : `${current}/${total}`
  );

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.bar}>
        <div 
          className={styles.fill}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={styles.label}>{displayLabel}</span>
    </div>
  );
};

export default ProgressBar;
