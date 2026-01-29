import React from 'react';
import styles from './TabBar.module.css';

/**
 * TabBar Component
 *
 * Unified tab navigation for screens with multiple sections.
 *
 * @param {Array} tabs - Array of tab objects: [{ id, label }]
 * @param {string} activeTab - Currently active tab ID
 * @param {function} onChange - Tab change handler (receives tab ID)
 * @param {string} className - Additional CSS classes
 */
const TabBar = ({
  tabs = [],
  activeTab,
  onChange,
  className = ''
}) => {
  return (
    <div className={`${styles.tabBar} ${className}`} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabBar;
