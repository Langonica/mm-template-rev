import React from 'react';
import styles from './TextLinkGroup.module.css';

/**
 * TextLinkGroup Component
 *
 * Group of text links separated by bullets.
 * Used for secondary navigation on home screen.
 *
 * @param {Array} items - Array of link objects: [{ label, onClick }]
 * @param {string} className - Additional CSS classes
 */
const TextLinkGroup = ({
  items = [],
  className = ''
}) => {
  if (items.length === 0) return null;

  return (
    <div className={`${styles.group} ${className}`}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className={styles.separator}>•</span>}
          <button
            className={styles.link}
            onClick={item.onClick}
          >
            {item.label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

export default TextLinkGroup;
