import React from 'react';
import styles from './DataCard.module.css';

/**
 * DataCard Component
 *
 * Card for displaying statistics with large value and label.
 *
 * @param {string|number} value - The statistic value to display
 * @param {string} label - The label for the statistic
 * @param {string} className - Additional CSS classes
 */
const DataCard = ({
  value,
  label,
  className = ''
}) => {
  return (
    <div className={`${styles.card} ${className}`}>
      <span className={styles.value}>{value}</span>
      <span className={styles.label}>{label}</span>
    </div>
  );
};

export default DataCard;
