import React from 'react';
import styles from './CountBadge.module.css';

/**
 * CountBadge Component
 * 
 * Displays a circular badge with a count number.
 * Used for stock pile, waste pile, and foundation card counts.
 * 
 * Variants:
 * - 'stock': Blue badge (bottom-right of stock pile)
 * - 'waste': Purple badge (bottom-right of waste pile)
 * - 'foundation-up': Gold/yellow badge (bottom-right of UP foundation)
 * - 'foundation-down': Silver/gray badge (bottom-right of DOWN foundation)
 */
const CountBadge = ({ count, variant = 'stock' }) => {
  if (!count || count <= 0) return null;

  const variantClass = {
    'stock': styles.stock,
    'waste': styles.waste,
    'foundation-up': styles.foundationUp,
    'foundation-down': styles.foundationDown,
  }[variant] || styles.stock;

  // Format large numbers
  const displayCount = count > 99 ? '99+' : count;

  return (
    <div className={`${styles.badge} ${variantClass}`}>
      {displayCount}
    </div>
  );
};

export default CountBadge;
