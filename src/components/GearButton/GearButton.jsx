import React from 'react';
import { Settings } from 'lucide-react';
import styles from './GearButton.module.css';

const GearButton = ({ onClick, className }) => {
  return (
    <button
      className={`${styles.gearButton} ${className || ''}`}
      onClick={onClick}
      aria-label="Settings"
      type="button"
    >
      <Settings className={styles.gearIcon} size={20} />
    </button>
  );
};

export default GearButton;
