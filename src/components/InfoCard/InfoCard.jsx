import React from 'react';
import styles from './InfoCard.module.css';

/**
 * InfoCard Component
 *
 * Card for displaying information with an icon and content side by side.
 *
 * @param {React.ReactNode} icon - Icon element to display
 * @param {string} title - Card title
 * @param {string|React.ReactNode} children - Card content
 * @param {string} className - Additional CSS classes
 */
const InfoCard = ({
  icon,
  title,
  children,
  className = ''
}) => {
  return (
    <div className={`${styles.card} ${className}`}>
      {icon && (
        <div className={styles.icon}>
          {icon}
        </div>
      )}
      <div className={styles.content}>
        {title && <h4 className={styles.title}>{title}</h4>}
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
};

export default InfoCard;
