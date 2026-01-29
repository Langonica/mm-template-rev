import React from 'react';
import styles from './ActionCard.module.css';

/**
 * ActionCard Component
 *
 * Card for play options and CTAs. Contains title, description, and action elements.
 *
 * @param {string} title - Card title
 * @param {string} description - Card description
 * @param {React.ReactNode} children - Action elements (buttons, selects, etc.)
 * @param {string} className - Additional CSS classes
 */
const ActionCard = ({
  title,
  description,
  children,
  className = ''
}) => {
  return (
    <div className={`${styles.card} ${className}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        {description && (
          <p className={styles.description}>{description}</p>
        )}
      </div>
      <div className={styles.actions}>
        {children}
      </div>
    </div>
  );
};

export default ActionCard;
