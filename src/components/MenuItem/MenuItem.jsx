import React from 'react';
import styles from './MenuItem.module.css';

/**
 * MenuItem Component
 *
 * A menu item for use within GameMenu. Supports icons, submenus, shortcuts, and dividers.
 *
 * @param {string} label - Display text
 * @param {React.ReactNode} icon - Optional icon element
 * @param {function} onClick - Click handler
 * @param {boolean} disabled - Disable the item
 * @param {boolean} active - Show as active/selected
 * @param {string} shortcut - Keyboard shortcut hint (e.g., "Ctrl+Z")
 * @param {React.ReactNode} children - Submenu items (renders as submenu if provided)
 * @param {boolean} divider - If true, renders as a divider line
 * @param {string} sectionHeader - If provided, renders as a section header
 */
const MenuItem = ({
  label,
  icon,
  onClick,
  disabled = false,
  active = false,
  shortcut,
  children,
  divider = false,
  sectionHeader,
}) => {
  // Render divider
  if (divider) {
    return <div className={styles.divider} />;
  }

  // Render section header
  if (sectionHeader) {
    return <div className={styles.sectionHeader}>{sectionHeader}</div>;
  }

  const hasSubmenu = Boolean(children);

  const itemClasses = [
    styles.item,
    hasSubmenu && styles.hasSubmenu,
    disabled && styles.disabled,
    active && styles.active,
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (disabled || hasSubmenu) return;
    onClick?.(e);
  };

  return (
    <div className={itemClasses} onClick={handleClick} role="menuitem">
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.label}>{label}</span>
      {shortcut && <span className={styles.shortcut}>{shortcut}</span>}
      {hasSubmenu && <span className={styles.arrow}>▶</span>}
      {hasSubmenu && (
        <div className={styles.submenu} role="menu">
          {children}
        </div>
      )}
    </div>
  );
};

export default MenuItem;
